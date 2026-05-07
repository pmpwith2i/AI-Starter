import { getPrismaClient } from "@repo/db";
import type { ConsentPurpose as PrismaConsentPurpose } from "@repo/db";
import { hashIp } from "@repo/crypto";
import {
  MANDATORY_CONSENT_PURPOSES,
  type ConsentPurpose,
} from "@repo/server-sdk/schemas";
import { ENVIRONMENT_VARIABLES } from "#src/constants/env.constants.js";
import { cache, invalidateUserCache, userTag } from "#src/lib/cache.js";

/** TTL ms for the cached consent status. Short enough that a missed
 * invalidation is not catastrophic; long enough to shed significant DB load
 * on hot endpoints (hot endpoints) that run the guard
 * on every request. */
const CONSENT_CACHE_TTL_MS = 30_000;

/** Hashed IP write-helper — Art. 32 minimisation on consent rows. */
const ip = (raw: string | undefined): string | undefined =>
  hashIp(raw) ?? undefined;

export interface ConsentGrantInput {
  purpose: ConsentPurpose;
  granted: boolean;
  policyVersion: string;
}

export interface ConsentStatus {
  consents: {
    purpose: ConsentPurpose;
    granted: boolean;
    grantedAt: string | null;
    revokedAt: string | null;
    policyVersion: string;
  }[];
  currentVersions: {
    privacyPolicy: string;
    terms: string;
  };
  mandatoryMissing: ConsentPurpose[];
}

/** Version-mapped mandatory purposes: what counts as "valid" vs "outdated". */
const versionForPurpose = (purpose: ConsentPurpose): string => {
  if (purpose === "privacy_policy" || purpose === "health_data_processing") {
    return ENVIRONMENT_VARIABLES.PRIVACY_POLICY_VERSION;
  }
  if (purpose === "terms_of_service") {
    return ENVIRONMENT_VARIABLES.TERMS_VERSION;
  }
  // Other purposes don't have a central version — accept any non-empty string
  return "any";
};

/**
 * Get consent status for a user, including which mandatory consents are missing.
 * Missing = not granted OR granted with an outdated policy version.
 */
export const getConsentStatus = async (
  userId: string,
): Promise<ConsentStatus> => {
  const prisma = getPrismaClient();
  const records = await prisma.consentRecord.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const currentVersions = {
    privacyPolicy: ENVIRONMENT_VARIABLES.PRIVACY_POLICY_VERSION,
    terms: ENVIRONMENT_VARIABLES.TERMS_VERSION,
  };

  // Map records to response shape
  const consents = records.map((r) => ({
    purpose: r.purpose as ConsentPurpose,
    granted: r.granted,
    grantedAt: r.grantedAt?.toISOString() ?? null,
    revokedAt: r.revokedAt?.toISOString() ?? null,
    policyVersion: r.policyVersion,
  }));

  // Compute mandatory missing
  const grantedPurposes = new Map<ConsentPurpose, (typeof consents)[number]>();
  for (const c of consents) {
    grantedPurposes.set(c.purpose, c);
  }

  const mandatoryMissing: ConsentPurpose[] = [];
  for (const purpose of MANDATORY_CONSENT_PURPOSES) {
    const record = grantedPurposes.get(purpose);
    if (!record || !record.granted) {
      mandatoryMissing.push(purpose);
      continue;
    }
    const expectedVersion = versionForPurpose(purpose);
    if (expectedVersion !== "any" && record.policyVersion !== expectedVersion) {
      mandatoryMissing.push(purpose);
    }
  }

  return { consents, currentVersions, mandatoryMissing };
};

/**
 * Cached variant of `getConsentStatus`, wrapped via the shared `@repo/cache`
 * facade. Returns the same shape as the origin; the only observable difference
 * is that successive calls within `CONSENT_CACHE_TTL_MS` don't hit the DB.
 *
 * Every mutation path (grant/withdraw/account-delete) must invalidate
 * `user:${userId}` via `cache.invalidateTags(...)` for correctness.
 */
export const getConsentStatusCached = cache.wrap(getConsentStatus, {
  namespace: "consent",
  ttlMs: CONSENT_CACHE_TTL_MS,
  keyFn: (userId) => userId,
  tags: (userId) => [userTag(userId)],
  singleFlight: true,
});

/**
 * Evict every cached entry tagged to this user (consent + auth lookup + any
 * future per-user namespace). Delegates to the shared `invalidateUserCache`
 * so that a single call wipes the full user footprint in the cache.
 *
 * Kept as a semantic alias so consent-mutation call-sites read as
 * "invalidate consent" at the point of use.
 */
export const invalidateConsentCache = async (userId: string): Promise<void> => {
  await invalidateUserCache(userId);
};

/**
 * Grant (or revoke) one or more consents atomically.
 * Upserts the ConsentRecord row per purpose.
 */
export const grantConsents = async (
  userId: string,
  grants: ConsentGrantInput[],
  context: { ipAddress?: string; userAgent?: string } = {},
): Promise<number> => {
  const prisma = getPrismaClient();

  await prisma.$transaction(async (tx) => {
    for (const g of grants) {
      await tx.consentRecord.upsert({
        where: {
          userId_purpose: {
            userId,
            purpose: g.purpose as PrismaConsentPurpose,
          },
        },
        update: {
          granted: g.granted,
          grantedAt: g.granted ? new Date() : undefined,
          revokedAt: g.granted ? null : new Date(),
          policyVersion: g.policyVersion,
          ipAddress: ip(context.ipAddress),
          userAgent: context.userAgent,
        },
        create: {
          userId,
          purpose: g.purpose as PrismaConsentPurpose,
          granted: g.granted,
          grantedAt: g.granted ? new Date() : null,
          revokedAt: g.granted ? null : new Date(),
          policyVersion: g.policyVersion,
          collectedVia: "api",
          ipAddress: ip(context.ipAddress),
          userAgent: context.userAgent,
        },
      });
    }
  });

  await invalidateConsentCache(userId);

  return grants.length;
};

/**
 * Withdraw a single consent by setting granted=false and revokedAt=now.
 */
export const withdrawConsent = async (
  userId: string,
  purpose: ConsentPurpose,
  context: { ipAddress?: string; userAgent?: string } = {},
): Promise<void> => {
  const prisma = getPrismaClient();
  await prisma.consentRecord.upsert({
    where: {
      userId_purpose: {
        userId,
        purpose: purpose as PrismaConsentPurpose,
      },
    },
    update: {
      granted: false,
      revokedAt: new Date(),
      ipAddress: ip(context.ipAddress),
      userAgent: context.userAgent,
    },
    create: {
      userId,
      purpose: purpose as PrismaConsentPurpose,
      granted: false,
      revokedAt: new Date(),
      policyVersion: versionForPurpose(purpose),
      collectedVia: "api",
      ipAddress: ip(context.ipAddress),
      userAgent: context.userAgent,
    },
  });

  await invalidateConsentCache(userId);
};

/**
 * Creates ConsentRecord rows for all mandatory purposes on new user signup.
 * Uses collectedVia="signup" for audit.
 */
export const createInitialConsents = async (
  userId: string,
  grants: ConsentGrantInput[],
  context: { ipAddress?: string; userAgent?: string } = {},
): Promise<void> => {
  const prisma = getPrismaClient();
  await prisma.consentRecord.createMany({
    data: grants.map((g) => ({
      userId,
      purpose: g.purpose as PrismaConsentPurpose,
      granted: g.granted,
      grantedAt: g.granted ? new Date() : null,
      revokedAt: g.granted ? null : new Date(),
      policyVersion: g.policyVersion,
      collectedVia: "signup",
      ipAddress: ip(context.ipAddress),
      userAgent: context.userAgent,
    })),
  });
};
