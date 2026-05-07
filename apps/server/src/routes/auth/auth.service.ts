import { getPrismaClient, comparePassword, hashPassword } from "@repo/db";
import { randomUUID, randomInt } from "crypto";
import jwt from "jsonwebtoken";
import { ENVIRONMENT_VARIABLES } from "#src/constants/env.constants.js";
import { HttpErrorResponse } from "#src/plugins/error-handler.plugin.js";
import { ERROR_CODES } from "@repo/server-sdk/schemas";
import { getEmailClient } from "#src/lib/email.js";
import { timingSafeEquals, hashIp } from "@repo/crypto";
import { JWT_ISSUER, JWT_AUDIENCE } from "#src/constants/auth.constants.js";
import { invalidateUserCache } from "#src/lib/cache.js";

const VERIFICATION_CODE_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const MAX_CODE_ATTEMPTS = 5;

// Progressive account lockout — duration grows with repeated failures so
// credential stuffing / brute force becomes economically unviable. The
// counter resets on successful login, successful password reset, or when
// 15+ minutes pass between failed attempts.
const LOCKOUT_COUNTER_RESET_MS = 15 * 60 * 1000;
const LOCKOUT_TIERS: ReadonlyArray<{
  threshold: number;
  durationMs: number;
}> = [
  { threshold: 30, durationMs: 60 * 60 * 1000 }, // ≥30 fails → 1h
  { threshold: 20, durationMs: 15 * 60 * 1000 }, // ≥20 fails → 15min
  { threshold: 10, durationMs: 60 * 1000 }, //     ≥10 fails → 1min
];

const pickLockoutDuration = (attempts: number): number | null => {
  for (const tier of LOCKOUT_TIERS) {
    if (attempts >= tier.threshold) return tier.durationMs;
  }
  return null;
};

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult extends AuthTokenPair {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  emailVerified: boolean;
  onboardingCompleted: boolean;
}

const signAccessToken = (userId: string, tokenVersion: number): string =>
  jwt.sign(
    { sub: userId, tokenVersion },
    ENVIRONMENT_VARIABLES.JWT_SECRET_KEY,
    {
      expiresIn: ENVIRONMENT_VARIABLES.JWT_EXPIRY,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    } as jwt.SignOptions,
  );

const generateTokenPair = async (
  userId: string,
  tokenVersion: number,
): Promise<AuthTokenPair> => {
  // Fresh login starts a new token family (separate device-session scope for
  // reuse detection). Rotations reuse the existing familyId — see
  // `refreshAccessToken`.
  return issueTokenPair(userId, randomUUID(), tokenVersion);
};

const issueTokenPair = async (
  userId: string,
  familyId: string,
  tokenVersion: number,
): Promise<AuthTokenPair> => {
  const accessToken = signAccessToken(userId, tokenVersion);

  const refreshToken = randomUUID();
  const prisma = getPrismaClient();
  const expiresAt = new Date(
    Date.now() + ENVIRONMENT_VARIABLES.REFRESH_TOKEN_EXPIRY_SECONDS * 1000,
  );

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId, familyId, expiresAt },
  });

  return { accessToken, refreshToken };
};

const generateVerificationCode = (): string =>
  randomInt(100000, 999999).toString();

export const loginUser = async (
  email: string,
  password: string,
): Promise<LoginResult> => {
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user)
    throw new HttpErrorResponse(
      "Email or password is invalid",
      401,
      ERROR_CODES.INVALID_CREDENTIALS,
    );

  // Lockout gate: when lockedUntil is in the future the account is closed
  // regardless of the password. Expired lockouts are ignored (the next failed
  // attempt may re-lock based on the accumulated counter).
  const now = new Date();
  if (user.lockedUntil && user.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil(
      (user.lockedUntil.getTime() - now.getTime()) / 1000,
    );
    throw new HttpErrorResponse(
      "Account temporarily locked after repeated failed attempts",
      429,
      ERROR_CODES.ACCOUNT_LOCKED,
      { retryAfterSeconds, lockedUntil: user.lockedUntil.toISOString() },
    );
  }

  if (!user.password)
    throw new HttpErrorResponse(
      "Password not set — request a reset",
      401,
      ERROR_CODES.PASSWORD_NOT_SET,
    );

  const isMatch = await comparePassword(password, user.password);

  if (!isMatch) {
    // Decide whether the counter keeps growing or resets: more than
    // LOCKOUT_COUNTER_RESET_MS of quiet between attempts clears the history
    // so an honest-but-forgetful user isn't penalised for past mistakes.
    const lastFailAgeMs = user.lastFailedLoginAt
      ? now.getTime() - user.lastFailedLoginAt.getTime()
      : Infinity;
    const baseCount =
      lastFailAgeMs > LOCKOUT_COUNTER_RESET_MS ? 0 : user.failedLoginAttempts;
    const newAttempts = baseCount + 1;
    const lockDurationMs = pickLockoutDuration(newAttempts);
    const newLockedUntil = lockDurationMs
      ? new Date(now.getTime() + lockDurationMs)
      : null;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: newAttempts,
        lockedUntil: newLockedUntil,
        lastFailedLoginAt: now,
      },
    });

    if (newLockedUntil) {
      const retryAfterSeconds = Math.ceil(lockDurationMs! / 1000);
      throw new HttpErrorResponse(
        "Account temporarily locked after repeated failed attempts",
        429,
        ERROR_CODES.ACCOUNT_LOCKED,
        { retryAfterSeconds, lockedUntil: newLockedUntil.toISOString() },
      );
    }

    throw new HttpErrorResponse(
      "Email or password is invalid",
      401,
      ERROR_CODES.INVALID_CREDENTIALS,
    );
  }

  // Successful login — clear lockout state even if it wasn't set, so the
  // row always converges to a known-good baseline.
  if (
    user.failedLoginAttempts > 0 ||
    user.lockedUntil !== null ||
    user.lastFailedLoginAt !== null
  ) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastFailedLoginAt: null,
      },
    });
  }

  const tokens = await generateTokenPair(user.id, user.tokenVersion);
  return {
    userId: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    emailVerified: user.emailVerified,
    onboardingCompleted: user.onboardingCompleted,
    ...tokens,
  };
};

export const registerUser = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  context: { ipAddress?: string; userAgent?: string } = {},
): Promise<LoginResult> => {
  const prisma = getPrismaClient();
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existing)
    throw new HttpErrorResponse(
      "An account with this email already exists",
      409,
      ERROR_CODES.EMAIL_ALREADY_EXISTS,
    );

  const hashedPassword = await hashPassword(password);
  const verificationCode = generateVerificationCode();
  const verificationExpires = new Date(
    Date.now() + VERIFICATION_CODE_EXPIRY_MS,
  );

  // Look up the default plan once outside the transaction (read-only).
  // The boot-time validation guarantees this is always present in production.
  const defaultPlan = await prisma.plan.findFirst({
    where: { isDefault: true },
  });

  if (!defaultPlan) {
    throw new HttpErrorResponse(
      "Server misconfiguration: no default plan available for new signups",
      500,
      ERROR_CODES.DEFAULT_PLAN_MISSING,
    );
  }

  let user;
  try {
    user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          firstName,
          lastName,
          emailVerified: false,
          emailVerificationCode: verificationCode,
          emailVerificationExpires: verificationExpires,
          emailVerificationAttempts: 0,
          registrationPlatform: "web",
          planId: defaultPlan.id,
          planActivatedAt: new Date(),
        },
      });

      await tx.account.create({
        data: {
          userId: created.id,
          provider: "credentials",
        },
      });

      // GDPR — record preliminary consents collected at signup. These survive
      // even if the user abandons before email verification: the signup form
      // required an explicit "I accept the terms" checkbox to submit.
      const now = new Date();
      const ipHashed = hashIp(context.ipAddress) ?? undefined;
      const ua = context.userAgent;
      await tx.consentRecord.createMany({
        data: [
          {
            userId: created.id,
            purpose: "terms_of_service",
            granted: true,
            grantedAt: now,
            policyVersion: ENVIRONMENT_VARIABLES.TERMS_VERSION,
            collectedVia: "signup",
            ipAddress: ipHashed,
            userAgent: ua,
          },
          {
            userId: created.id,
            purpose: "privacy_policy",
            granted: true,
            grantedAt: now,
            policyVersion: ENVIRONMENT_VARIABLES.PRIVACY_POLICY_VERSION,
            collectedVia: "signup",
            ipAddress: ipHashed,
            userAgent: ua,
          },
        ],
      });

      return created;
    });
  } catch (err: unknown) {
    if (
      err != null &&
      typeof err === "object" &&
      "code" in err &&
      err.code === "P2002"
    ) {
      throw new HttpErrorResponse(
        "An account with this email already exists",
        409,
        ERROR_CODES.EMAIL_ALREADY_EXISTS,
      );
    }
    throw err;
  }

  // Send verification email (fire-and-forget — signup succeeds even if email fails)
  const emailClient = getEmailClient();
  emailClient.sendVerificationEmail(user.email, firstName, verificationCode);

  const tokens = await generateTokenPair(user.id, user.tokenVersion);
  return {
    userId: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    emailVerified: user.emailVerified,
    onboardingCompleted: user.onboardingCompleted,
    ...tokens,
  };
};

export const verifyEmail = async (
  userId: string,
  code: string,
): Promise<{ verified: boolean }> => {
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user)
    throw new HttpErrorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);

  // Idempotent: already verified
  if (user.emailVerified) {
    return { verified: true };
  }

  // No code or expired
  if (
    !user.emailVerificationCode ||
    !user.emailVerificationExpires ||
    user.emailVerificationExpires < new Date()
  ) {
    throw new HttpErrorResponse(
      "Il codice di verifica è scaduto. Richiedi un nuovo codice.",
      400,
      ERROR_CODES.VERIFICATION_CODE_EXPIRED,
    );
  }

  // Too many attempts — code invalidated
  if (user.emailVerificationAttempts >= MAX_CODE_ATTEMPTS) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationCode: null,
        emailVerificationExpires: null,
        emailVerificationAttempts: 0,
      },
    });
    throw new HttpErrorResponse(
      "Troppi tentativi errati. Richiedi un nuovo codice.",
      400,
      ERROR_CODES.VERIFICATION_CODE_INVALIDATED,
    );
  }

  // Wrong code — timing-safe compare
  if (!timingSafeEquals(user.emailVerificationCode, code)) {
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerificationAttempts: { increment: 1 } },
    });
    throw new HttpErrorResponse(
      "Codice di verifica non valido.",
      400,
      ERROR_CODES.VERIFICATION_CODE_INVALID,
    );
  }

  // Correct code — verify
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerified: true,
      emailVerificationCode: null,
      emailVerificationExpires: null,
      emailVerificationAttempts: 0,
    },
  });

  // Auth-guard caches `emailVerified` per user — drop the stale entry so the
  // next request reflects the verified state immediately and the
  // emailVerifiedGuard stops blocking.
  await invalidateUserCache(userId);

  return { verified: true };
};

export const resendVerificationCode = async (
  userId: string,
): Promise<{ sent: boolean; message: string }> => {
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user)
    throw new HttpErrorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);

  if (user.emailVerified) {
    throw new HttpErrorResponse(
      "L'email è già stata verificata.",
      400,
      ERROR_CODES.ALREADY_VERIFIED,
    );
  }

  if (
    user.emailVerificationCode &&
    user.emailVerificationExpires &&
    user.emailVerificationExpires > new Date()
  ) {
    return {
      sent: false,
      message: "Codice già inviato, controlla la tua email.",
    };
  }

  // Generate new code
  const code = generateVerificationCode();
  const expires = new Date(Date.now() + VERIFICATION_CODE_EXPIRY_MS);

  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationCode: code,
      emailVerificationExpires: expires,
      emailVerificationAttempts: 0,
    },
  });

  const emailClient = getEmailClient();
  emailClient.sendVerificationEmail(
    user.email,
    user.firstName ?? "Utente",
    code,
  );

  return { sent: true, message: "Nuovo codice inviato alla tua email." };
};

export const forgotPassword = async (email: string): Promise<void> => {
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Anti-enumeration: silently return if user not found
  if (!user) return;

  const code = generateVerificationCode();
  const expires = new Date(Date.now() + VERIFICATION_CODE_EXPIRY_MS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetCode: code,
      passwordResetExpires: expires,
      passwordResetAttempts: 0,
    },
  });

  const emailClient = getEmailClient();
  emailClient.sendPasswordResetEmail(
    user.email,
    user.firstName ?? "Utente",
    code,
  );
};

export const resetPassword = async (
  email: string,
  code: string,
  newPassword: string,
): Promise<void> => {
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Generic error for non-existent user (anti-enumeration)
  if (!user) {
    throw new HttpErrorResponse(
      "Il codice di reset è scaduto. Richiedi un nuovo codice.",
      400,
      ERROR_CODES.RESET_CODE_EXPIRED,
    );
  }

  // No code or expired
  if (
    !user.passwordResetCode ||
    !user.passwordResetExpires ||
    user.passwordResetExpires < new Date()
  ) {
    throw new HttpErrorResponse(
      "Il codice di reset è scaduto. Richiedi un nuovo codice.",
      400,
      ERROR_CODES.RESET_CODE_EXPIRED,
    );
  }

  // Too many attempts
  if (user.passwordResetAttempts >= MAX_CODE_ATTEMPTS) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetCode: null,
        passwordResetExpires: null,
        passwordResetAttempts: 0,
      },
    });
    throw new HttpErrorResponse(
      "Troppi tentativi errati. Richiedi un nuovo codice.",
      400,
      ERROR_CODES.RESET_CODE_INVALIDATED,
    );
  }

  // Wrong code — timing-safe compare
  if (!timingSafeEquals(user.passwordResetCode, code)) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetAttempts: { increment: 1 } },
    });
    throw new HttpErrorResponse(
      "Codice di reset non valido.",
      400,
      ERROR_CODES.RESET_CODE_INVALID,
    );
  }

  // Correct code — update password, clear reset fields, invalidate all sessions
  const hashedPassword = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetCode: null,
        passwordResetExpires: null,
        passwordResetAttempts: 0,
        // Successful reset implies a successful email-based identity proof,
        // which is strictly stronger than an uninterrupted password entry —
        // clear any active account lockout so the user isn't stuck behind
        // a cooldown despite having regained control.
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastFailedLoginAt: null,
        // Bump tokenVersion so every access JWT issued before the reset
        // (up to 30min lifetime) is rejected on next request. Refresh
        // tokens are wiped below — the pair closes the compromise window
        // entirely.
        tokenVersion: { increment: 1 },
      },
    }),
    prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
  ]);
  await invalidateUserCache(user.id);
};

export const refreshAccessToken = async (
  refreshToken: string,
): Promise<AuthTokenPair> => {
  const prisma = getPrismaClient();

  const record = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!record) {
    throw new HttpErrorResponse(
      "Invalid or expired refresh token",
      401,
      ERROR_CODES.INVALID_REFRESH_TOKEN,
    );
  }

  // Reuse detection (OAuth 2.1). If the token was already consumed by a
  // rotation, someone is replaying a leaked token: either the attacker
  // replays the pre-rotation token, or the legitimate client replays after
  // their rotation. In both cases we invalidate the ENTIRE family — both
  // the current valid token and any subsequent rotations — so the attacker
  // loses access and the legitimate user is forced to re-authenticate.
  if (record.revokedAt) {
    // Scorched earth: wipe the family AND bump tokenVersion so any access
    // token still in the attacker's hands becomes invalid on next request.
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { tokenVersion: { increment: 1 } },
      }),
      prisma.refreshToken.deleteMany({
        where: { familyId: record.familyId },
      }),
    ]);
    await invalidateUserCache(record.userId);
    throw new HttpErrorResponse(
      "Refresh token reuse detected — session revoked",
      401,
      ERROR_CODES.REFRESH_TOKEN_REUSE_DETECTED,
    );
  }

  if (record.expiresAt < new Date()) {
    throw new HttpErrorResponse(
      "Invalid or expired refresh token",
      401,
      ERROR_CODES.INVALID_REFRESH_TOKEN,
    );
  }

  // Rotate: mark the presented token as consumed and issue a new one in the
  // same family. The update+create pair runs in a transaction so a crash
  // mid-rotation never leaves a revoked token without a replacement. The new
  // access JWT carries the user's current tokenVersion (fetched fresh, so a
  // concurrent password reset that bumped it is respected).
  const newRefreshToken = randomUUID();
  const expiresAt = new Date(
    Date.now() + ENVIRONMENT_VARIABLES.REFRESH_TOKEN_EXPIRY_SECONDS * 1000,
  );

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: record.userId },
    select: { tokenVersion: true },
  });

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    }),
    prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: record.userId,
        familyId: record.familyId,
        expiresAt,
      },
    }),
  ]);

  const accessToken = signAccessToken(record.userId, user.tokenVersion);

  return { accessToken, refreshToken: newRefreshToken };
};

export const logoutUser = async (refreshToken: string): Promise<void> => {
  const prisma = getPrismaClient();
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
};
