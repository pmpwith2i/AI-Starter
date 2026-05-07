import { createHash } from "node:crypto";
import { comparePassword, getPrismaClient } from "@repo/db";
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
 * Delete a user's account using the hybrid GDPR strategy:
 *  - Hard delete: refresh tokens, notifications.
 *  - Retain as-is: ConsentRecord (10-year accountability), AuditLog.
 *  - Anonymize the User row itself (kept as anchor for the audit trail).
 *
 * As you scaffold domains, extend the transaction below to hard-delete the
 * user's domain rows (chats, plans, registrations, etc.) and to retain
 * financial records (purchases, ledger entries) per local tax law (typically
 * 10 years in the EU).
 */
export const deleteAccount = async (
  userId: string,
  password: string,
): Promise<void> => {
  const prisma = getPrismaClient();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true },
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
    await tx.refreshToken.deleteMany({ where: { userId } });
    await tx.notification.deleteMany({ where: { userId } });

    // Anonymize the User row itself — keep as an audit anchor.
    await tx.user.update({
      where: { id: userId },
      data: {
        email: anonymizedEmail(userId),
        firstName: null,
        lastName: null,
        password: "",
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

  await invalidateUserCache(userId);
  logger.info({ userId }, "Account deleted (anonymized)");
};

/**
 * Export all user data as a JSON bundle.
 * Extend `include` as you scaffold domains so users can exercise their
 * Art. 20 (data portability) right.
 */
export const exportAccount = async (
  userId: string,
): Promise<{ exportedAt: string; data: Record<string, unknown> }> => {
  const prisma = getPrismaClient();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      consentRecords: true,
      notifications: true,
    },
  });

  if (!user) {
    throw new HttpErrorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
  }

  return {
    exportedAt: new Date().toISOString(),
    data: {
      profile: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        createdAt: user.createdAt,
      },
      consentRecords: user.consentRecords,
      notifications: user.notifications,
    },
  };
};
