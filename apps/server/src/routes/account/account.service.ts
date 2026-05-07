import { createHash } from "node:crypto";
import { comparePassword, getPrismaClient } from "@repo/db";
import { decrypt, decryptJson, getEncryptionKey } from "@repo/crypto";
import { HttpErrorResponse } from "#src/plugins/error-handler.plugin.js";
import { ERROR_CODES } from "@repo/server-sdk/schemas";
import { logger } from "#src/logger.js";
import { invalidateUserCache } from "#src/lib/cache.js";

/**
 * Compute a deterministic anonymized email from a userId.
 * Format: deleted_{sha256(userId)[0:16]}@redacted.local
 */
const anonymizedEmail = (userId: string): string => {
  const hash = createHash("sha256").update(userId).digest("hex").slice(0, 16);
  return `deleted_${hash}@redacted.local`;
};

/**
 * Delete a user's account using the hybrid strategy:
 *  - Hard delete: ClinicalProfile, chats, souls, nutrition plans, background tasks,
 *                  notifications, suggestions, event registrations (free), refresh tokens, accounts.
 *  - Anonymize + retain: CreditTransaction, CoursePurchase, EventPurchase,
 *                        BundlePurchase (10-year Italian tax law).
 *  - Retain as-is: ConsentRecord (10-year accountability), AuditLog.
 *  - Anonymize the User row itself (keep it as a financial anchor).
 */
export const deleteAccount = async (
  userId: string,
  password: string,
): Promise<void> => {
  const prisma = getPrismaClient();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true, clinicalProfileId: true },
  });

  if (!user) {
    throw new HttpErrorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
  }

  if (!user.password) {
    throw new HttpErrorResponse(
      "Password required for account deletion",
      400,
      ERROR_CODES.DELETION_REQUIRES_PASSWORD,
    );
  }

  const ok = await comparePassword(password, user.password);
  if (!ok) {
    throw new HttpErrorResponse(
      "Invalid password",
      401,
      ERROR_CODES.INVALID_CREDENTIALS,
    );
  }

  const tenYearsFromNow = new Date();
  tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10);

  await prisma.$transaction(async (tx) => {
    // Hard delete health/personal data (cascade handles related rows)
    await tx.chatConversation.deleteMany({ where: { userId } });
    await tx.userSoul.deleteMany({ where: { userId } });
    await tx.nutritionPlan.deleteMany({ where: { userId } });
    await tx.backgroundTask.deleteMany({ where: { userId } });
    await tx.notification.deleteMany({ where: { userId } });
    await tx.suggestion.deleteMany({ where: { userId } });
    await tx.refreshToken.deleteMany({ where: { userId } });
    await tx.account.deleteMany({ where: { userId } });

    // Free event registrations with no purchase FK → hard delete
    await tx.eventRegistration.deleteMany({
      where: {
        userId,
        bundlePurchaseId: null,
        eventPurchaseId: null,
      },
    });

    // Delete ClinicalProfile (via user → set null, then delete)
    if (user.clinicalProfileId) {
      await tx.user.update({
        where: { id: userId },
        data: { clinicalProfileId: null },
      });
      await tx.clinicalProfile.delete({
        where: { id: user.clinicalProfileId },
      });
    }

    // Anonymize the User row itself — keep as a financial anchor.
    // Related financial rows (credit txns, purchases) have FK cascade,
    // so we cannot delete the User; instead we null PII fields.
    await tx.user.update({
      where: { id: userId },
      data: {
        email: anonymizedEmail(userId),
        name: null,
        firstName: null,
        lastName: null,
        password: null,
        phone: null,
        dateOfBirth: null,
        avatar: null,
        emailVerificationCode: null,
        passwordResetCode: null,
        preferences: undefined,
        deletedAt: new Date(),
        retentionExpiresAt: tenYearsFromNow,
      },
    });
  });

  // Drop every cache entry tagged to this user (consent + auth guard +
  // any future per-user namespace) in one shot — so the soft-deleted user's
  // cached snapshots can't serve another authenticated request within TTL.
  await invalidateUserCache(userId);

  logger.info({ userId }, "Account deleted (hybrid strategy)");
};

/**
 * Export all user data as a JSON bundle.
 * Encrypted fields are decrypted before export.
 */
export const exportAccount = async (
  userId: string,
): Promise<{ exportedAt: string; data: Record<string, unknown> }> => {
  const prisma = getPrismaClient();
  const key = getEncryptionKey();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      clinicalProfile: true,
      accounts: true,
      consentRecords: true,
      chatConversations: {
        include: {
          messages: true,
          compactedSegments: true,
        },
      },
      userSouls: { orderBy: { version: "desc" }, take: 5 },
      nutritionPlans: true,
      notifications: true,
      creditTransactions: true,
      coursePurchases: true,
      eventPurchases: true,
      bundlePurchases: true,
      eventRegistrations: true,
      courseEnrollments: true,
    },
  });

  if (!user) {
    throw new HttpErrorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
  }

  // Decrypt helpers
  const decryptSafe = <T>(ciphertext: string | null): T | null => {
    if (!ciphertext) return null;
    try {
      return decrypt(ciphertext, key) as unknown as T;
    } catch {
      return null;
    }
  };

  const decryptJsonSafe = <T>(ciphertext: string | null): T | null => {
    if (!ciphertext) return null;
    try {
      return decryptJson<T>(ciphertext, key);
    } catch {
      return null;
    }
  };

  const clinicalProfile = user.clinicalProfile
    ? {
        ...user.clinicalProfile,
        // Decrypt health data into flat fields, remove the blob
        healthData: decryptJsonSafe(user.clinicalProfile.encryptedHealthData),
        encryptedHealthData: undefined,
      }
    : null;

  const chatConversations = user.chatConversations.map((c) => ({
    id: c.id,
    title: c.title,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    messages: c.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: decryptSafe<string>(m.content),
      createdAt: m.createdAt,
    })),
    compactedSegments: c.compactedSegments.map((s) => ({
      id: s.id,
      topic: s.topic,
      payload: decryptJsonSafe(s.encryptedPayload),
      messageCount: s.messageCount,
      tokenCount: s.tokenCount,
      compactedBy: s.compactedBy,
      createdAt: s.createdAt,
    })),
  }));

  const userSouls = user.userSouls.map((s) => ({
    id: s.id,
    version: s.version,
    content: decryptSafe<string>(s.content),
    updatedBy: s.updatedBy,
    createdAt: s.createdAt,
  }));

  const nutritionPlans = user.nutritionPlans.map((p) => ({
    ...p,
    content: decryptJsonSafe(p.encryptedContent),
    encryptedContent: undefined,
  }));

  return {
    exportedAt: new Date().toISOString(),
    data: {
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        createdAt: user.createdAt,
      },
      clinicalProfile,
      consentRecords: user.consentRecords,
      chatConversations,
      userSouls,
      nutritionPlans,
      accounts: user.accounts,
      notifications: user.notifications,
      creditTransactions: user.creditTransactions,
      purchases: {
        courses: user.coursePurchases,
        events: user.eventPurchases,
        bundles: user.bundlePurchases,
      },
      eventRegistrations: user.eventRegistrations,
      courseEnrollments: user.courseEnrollments,
    },
  };
};
