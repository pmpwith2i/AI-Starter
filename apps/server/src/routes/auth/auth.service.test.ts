import { describe, it, mock, beforeEach } from "node:test";
import assert from "node:assert/strict";

// ─── Shared mock refs ────────────────────────────────────────────────────────

// Default user shape returned by findUnique / create — mirrors the columns
// the service actually reads. Tests override fields per case via
// `mockImplementation`.
const buildFakeUser = (overrides: Record<string, unknown> = {}) => ({
  id: "user-1",
  email: "user@example.com",
  password: "hashed",
  firstName: null,
  lastName: null,
  emailVerified: false,
  onboardingCompleted: false,
  ...overrides,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFindUnique = mock.fn<(...args: any[]) => Promise<any>>(
  async () => null,
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockCreate = mock.fn<(...args: any[]) => Promise<any>>(async () =>
  buildFakeUser({ id: "user-new" }),
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAccountCreate = mock.fn<(...args: any[]) => Promise<any>>(
  async () => ({ id: "account-new" }),
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPlanFindFirst = mock.fn<(...args: any[]) => Promise<any>>(
  async () => ({
    id: "plan-default",
    code: "free",
    isDefault: true,
    creditsPerPeriod: 50,
    periodType: "monthly",
  }),
);
const mockComparePassword = mock.fn<
  (candidate: string, hashed: string) => Promise<boolean>
>(async () => false);
const mockHashPassword = mock.fn<(password: string) => Promise<string>>(
  async () => "hashed-password",
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUserUpdate = mock.fn<(...args: any[]) => Promise<any>>(async () =>
  buildFakeUser(),
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockRefreshTokenFindUnique = mock.fn<(...args: any[]) => Promise<any>>(
  async () => null,
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockRefreshTokenCreate = mock.fn<(...args: any[]) => Promise<any>>(
  async () => ({ id: "rt-1" }),
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockRefreshTokenDelete = mock.fn<(...args: any[]) => Promise<any>>(
  async () => ({ id: "rt-1" }),
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockRefreshTokenDeleteMany = mock.fn<(...args: any[]) => Promise<any>>(
  async () => ({ count: 1 }),
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockRefreshTokenUpdate = mock.fn<(...args: any[]) => Promise<any>>(
  async () => ({ id: "rt-1" }),
);

// The transaction mock needs to expose the same shape as the real prisma
// client because both `registerUser` (uses `tx.user.create` + `tx.account.create`)
// and `refreshAccessToken` (uses `tx.refreshToken.findUnique` + `tx.refreshToken.delete`)
// run their critical sections inside `$transaction(async (tx) => ...)`.
const mockConsentCreateMany = mock.fn(async () => ({ count: 2 }));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockTransaction = mock.fn<(...args: any[]) => Promise<any>>(
  async (fnOrArray) => {
    // Array form: used by the rotation path to commit update+create atomically.
    if (Array.isArray(fnOrArray)) {
      return Promise.all(fnOrArray);
    }
    const tx = {
      user: { create: mockCreate },
      account: { create: mockAccountCreate },
      refreshToken: {
        findUnique: mockRefreshTokenFindUnique,
        delete: mockRefreshTokenDelete,
        update: mockRefreshTokenUpdate,
        create: mockRefreshTokenCreate,
      },
      consentRecord: { createMany: mockConsentCreateMany },
    };
    return fnOrArray(tx);
  },
);

// ─── Module mocks ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFindUniqueOrThrow = mock.fn<(...args: any[]) => Promise<any>>(
  async () => ({ tokenVersion: 0 }),
);

mock.module("@repo/db", {
  namedExports: {
    getPrismaClient: () => ({
      user: {
        findUnique: mockFindUnique,
        findUniqueOrThrow: mockFindUniqueOrThrow,
        create: mockCreate,
        update: mockUserUpdate,
      },
      refreshToken: {
        findUnique: mockRefreshTokenFindUnique,
        create: mockRefreshTokenCreate,
        delete: mockRefreshTokenDelete,
        deleteMany: mockRefreshTokenDeleteMany,
        update: mockRefreshTokenUpdate,
      },
      plan: {
        findFirst: mockPlanFindFirst,
      },
      $transaction: mockTransaction,
    }),
    comparePassword: mockComparePassword,
    hashPassword: mockHashPassword,
  },
});

mock.module("../../constants/env.constants.js", {
  namedExports: {
    ENVIRONMENT_VARIABLES: {
      JWT_SECRET_KEY: "test-secret",
      JWT_EXPIRY: "30m",
      REFRESH_TOKEN_EXPIRY_SECONDS: 604800,
      RESEND_API_KEY: "test-key",
      EMAIL_FROM: "noreply@test.com",
    },
    isDev: true,
  },
});

mock.module("../../lib/email.js", {
  namedExports: {
    getEmailClient: () => ({
      sendVerificationEmail: () => {},
      sendPasswordResetEmail: () => {},
    }),
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockInvalidateUserCache = mock.fn<(...args: any[]) => Promise<number>>(
  async () => 0,
);
mock.module("../../lib/cache.js", {
  namedExports: {
    invalidateUserCache: mockInvalidateUserCache,
    cache: {
      wrap: <T>(fn: T) => fn,
      invalidateTags: async () => 0,
      backend: {},
    },
    userTag: (id: string) => `user:${id}`,
  },
});

// ─── Import module under test (after mocks) ───────────────────────────────────

const {
  loginUser,
  registerUser,
  refreshAccessToken,
  logoutUser,
  verifyEmail,
  resendVerificationCode,
  forgotPassword,
  resetPassword,
} = await import("./auth.service.js");
const { HttpErrorResponse } =
  await import("../../plugins/error-handler.plugin.js");

// ─── loginUser ────────────────────────────────────────────────────────────────

describe("loginUser", () => {
  beforeEach(() => {
    mockFindUnique.mock.resetCalls();
    mockComparePassword.mock.resetCalls();
    mockRefreshTokenCreate.mock.resetCalls();
    mockUserUpdate.mock.resetCalls();
    mockUserUpdate.mock.mockImplementation(async () => buildFakeUser());
  });

  it("throws INVALID_CREDENTIALS when user is not found", async () => {
    mockFindUnique.mock.mockImplementation(async () => null);

    await assert.rejects(
      () => loginUser("nobody@example.com", "pass"),
      (err: unknown) => {
        assert(err instanceof HttpErrorResponse);
        assert.equal(err.errorCode, "INVALID_CREDENTIALS");
        return true;
      },
    );
  });

  it("throws PASSWORD_NOT_SET when user has no password", async () => {
    mockFindUnique.mock.mockImplementation(async () => ({
      id: "user-1",
      password: null,
    }));

    await assert.rejects(
      () => loginUser("user@example.com", "pass"),
      (err: unknown) => {
        assert(err instanceof HttpErrorResponse);
        assert.equal(err.errorCode, "PASSWORD_NOT_SET");
        return true;
      },
    );
  });

  it("throws INVALID_CREDENTIALS when password does not match", async () => {
    mockFindUnique.mock.mockImplementation(async () => ({
      id: "user-1",
      password: "hashed",
    }));
    mockComparePassword.mock.mockImplementation(async () => false);

    await assert.rejects(
      () => loginUser("user@example.com", "wrong"),
      (err: unknown) => {
        assert(err instanceof HttpErrorResponse);
        assert.equal(err.errorCode, "INVALID_CREDENTIALS");
        return true;
      },
    );
  });

  it("returns userId, accessToken, and refreshToken on success", async () => {
    mockFindUnique.mock.mockImplementation(async () => ({
      id: "user-1",
      password: "hashed",
    }));
    mockComparePassword.mock.mockImplementation(async () => true);

    const result = await loginUser("user@example.com", "correct");
    assert.equal(result.userId, "user-1");
    assert.ok(result.accessToken.length > 0, "accessToken must be non-empty");
    assert.ok(result.refreshToken.length > 0, "refreshToken must be non-empty");
    assert.equal(mockRefreshTokenCreate.mock.callCount(), 1);
  });

  it("embeds the user's current tokenVersion into the signed access token", async () => {
    mockFindUnique.mock.mockImplementation(async () => ({
      id: "user-1",
      password: "hashed",
      tokenVersion: 7,
    }));
    mockComparePassword.mock.mockImplementation(async () => true);

    const result = await loginUser("user@example.com", "correct");
    // Decode without verifying — we just want the payload.
    const [, payloadB64] = result.accessToken.split(".");
    const payload = JSON.parse(
      Buffer.from(payloadB64!, "base64url").toString("utf-8"),
    ) as { sub?: string; tokenVersion?: number };
    assert.equal(payload.sub, "user-1");
    assert.equal(payload.tokenVersion, 7);
  });

  it("starts a fresh token family on every login (device isolation)", async () => {
    mockFindUnique.mock.mockImplementation(async () => ({
      id: "user-1",
      password: "hashed",
    }));
    mockComparePassword.mock.mockImplementation(async () => true);

    await loginUser("user@example.com", "correct");
    const args1 = mockRefreshTokenCreate.mock.calls[0]!.arguments[0] as {
      data: { familyId: string };
    };
    await loginUser("user@example.com", "correct");
    const args2 = mockRefreshTokenCreate.mock.calls[1]!.arguments[0] as {
      data: { familyId: string };
    };

    assert.ok(args1.data.familyId.length > 0);
    assert.ok(args2.data.familyId.length > 0);
    assert.notEqual(
      args1.data.familyId,
      args2.data.familyId,
      "each login must belong to a distinct family",
    );
  });
});

// ─── loginUser — account lockout ──────────────────────────────────────────────

describe("loginUser — account lockout", () => {
  beforeEach(() => {
    mockFindUnique.mock.resetCalls();
    mockComparePassword.mock.resetCalls();
    mockUserUpdate.mock.resetCalls();
    mockUserUpdate.mock.mockImplementation(async () => buildFakeUser());
  });

  const buildLockedUser = (overrides: Record<string, unknown> = {}) =>
    buildFakeUser({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastFailedLoginAt: null,
      ...overrides,
    });

  it("throws ACCOUNT_LOCKED when lockedUntil is in the future, bypassing password check", async () => {
    const lockExpiry = new Date(Date.now() + 60_000);
    mockFindUnique.mock.mockImplementation(async () =>
      buildLockedUser({
        failedLoginAttempts: 10,
        lockedUntil: lockExpiry,
      }),
    );

    await assert.rejects(
      () => loginUser("user@example.com", "anything"),
      (err: unknown) => {
        assert(err instanceof HttpErrorResponse);
        assert.equal(err.errorCode, "ACCOUNT_LOCKED");
        assert.equal(err.statusCode, 429);
        // retryAfterSeconds exposed to the dashboard so it can render the cooldown.
        const retryAfter = (err.details as { retryAfterSeconds?: number })
          ?.retryAfterSeconds;
        assert.ok(typeof retryAfter === "number" && retryAfter > 0);
        return true;
      },
    );
    // Password not compared when locked.
    assert.equal(mockComparePassword.mock.callCount(), 0);
  });

  it("unlocks automatically when lockedUntil is in the past and resets counter", async () => {
    mockFindUnique.mock.mockImplementation(async () =>
      buildLockedUser({
        failedLoginAttempts: 10,
        lockedUntil: new Date(Date.now() - 60_000),
        lastFailedLoginAt: new Date(Date.now() - 60_000),
      }),
    );
    mockComparePassword.mock.mockImplementation(async () => true);

    await loginUser("user@example.com", "correct");

    // Successful login must reset counter + lockedUntil.
    const updateArgs = mockUserUpdate.mock.calls[0]!.arguments[0] as {
      data: {
        failedLoginAttempts: number;
        lockedUntil: null;
        lastFailedLoginAt: null;
      };
    };
    assert.equal(updateArgs.data.failedLoginAttempts, 0);
    assert.equal(updateArgs.data.lockedUntil, null);
    assert.equal(updateArgs.data.lastFailedLoginAt, null);
  });

  it("increments failedLoginAttempts on wrong password without locking before threshold", async () => {
    mockFindUnique.mock.mockImplementation(async () =>
      buildLockedUser({
        failedLoginAttempts: 3,
        lastFailedLoginAt: new Date(Date.now() - 30_000),
      }),
    );
    mockComparePassword.mock.mockImplementation(async () => false);

    await assert.rejects(
      () => loginUser("user@example.com", "wrong"),
      (err: unknown) => {
        assert(err instanceof HttpErrorResponse);
        assert.equal(err.errorCode, "INVALID_CREDENTIALS");
        return true;
      },
    );

    const updateArgs = mockUserUpdate.mock.calls[0]!.arguments[0] as {
      data: {
        failedLoginAttempts: number;
        lockedUntil: Date | null;
      };
    };
    assert.equal(updateArgs.data.failedLoginAttempts, 4);
    assert.equal(updateArgs.data.lockedUntil, null);
  });

  it("locks for 1 minute at the 10th failed attempt", async () => {
    mockFindUnique.mock.mockImplementation(async () =>
      buildLockedUser({
        failedLoginAttempts: 9,
        lastFailedLoginAt: new Date(Date.now() - 30_000),
      }),
    );
    mockComparePassword.mock.mockImplementation(async () => false);

    await assert.rejects(() => loginUser("user@example.com", "wrong"));

    const updateArgs = mockUserUpdate.mock.calls[0]!.arguments[0] as {
      data: { failedLoginAttempts: number; lockedUntil: Date };
    };
    assert.equal(updateArgs.data.failedLoginAttempts, 10);
    assert.ok(updateArgs.data.lockedUntil instanceof Date);
    const lockMs = updateArgs.data.lockedUntil.getTime() - Date.now();
    // ~1 minute lock (tolerate a few ms of drift).
    assert.ok(lockMs > 55_000 && lockMs <= 61_000, `got ${lockMs}ms`);
  });

  it("locks for 15 minutes at the 20th failed attempt", async () => {
    mockFindUnique.mock.mockImplementation(async () =>
      buildLockedUser({
        failedLoginAttempts: 19,
        lastFailedLoginAt: new Date(Date.now() - 30_000),
      }),
    );
    mockComparePassword.mock.mockImplementation(async () => false);

    await assert.rejects(() => loginUser("user@example.com", "wrong"));

    const updateArgs = mockUserUpdate.mock.calls[0]!.arguments[0] as {
      data: { failedLoginAttempts: number; lockedUntil: Date };
    };
    assert.equal(updateArgs.data.failedLoginAttempts, 20);
    const lockMs = updateArgs.data.lockedUntil.getTime() - Date.now();
    assert.ok(lockMs > 14 * 60_000 && lockMs <= 16 * 60_000);
  });

  it("locks for 1 hour at the 30th failed attempt", async () => {
    mockFindUnique.mock.mockImplementation(async () =>
      buildLockedUser({
        failedLoginAttempts: 29,
        lastFailedLoginAt: new Date(Date.now() - 30_000),
      }),
    );
    mockComparePassword.mock.mockImplementation(async () => false);

    await assert.rejects(() => loginUser("user@example.com", "wrong"));

    const updateArgs = mockUserUpdate.mock.calls[0]!.arguments[0] as {
      data: { failedLoginAttempts: number; lockedUntil: Date };
    };
    assert.equal(updateArgs.data.failedLoginAttempts, 30);
    const lockMs = updateArgs.data.lockedUntil.getTime() - Date.now();
    assert.ok(lockMs > 59 * 60_000 && lockMs <= 61 * 60_000);
  });

  it("resets counter to 1 if last failed attempt was more than 15 minutes ago", async () => {
    const oldFail = new Date(Date.now() - 16 * 60_000);
    mockFindUnique.mock.mockImplementation(async () =>
      buildLockedUser({
        failedLoginAttempts: 9,
        lastFailedLoginAt: oldFail,
      }),
    );
    mockComparePassword.mock.mockImplementation(async () => false);

    await assert.rejects(() => loginUser("user@example.com", "wrong"));

    const updateArgs = mockUserUpdate.mock.calls[0]!.arguments[0] as {
      data: { failedLoginAttempts: number; lockedUntil: Date | null };
    };
    assert.equal(updateArgs.data.failedLoginAttempts, 1);
    assert.equal(updateArgs.data.lockedUntil, null);
  });

  it("clears counter on successful login", async () => {
    mockFindUnique.mock.mockImplementation(async () =>
      buildLockedUser({
        failedLoginAttempts: 5,
        lastFailedLoginAt: new Date(Date.now() - 60_000),
      }),
    );
    mockComparePassword.mock.mockImplementation(async () => true);

    await loginUser("user@example.com", "correct");

    const updateArgs = mockUserUpdate.mock.calls[0]!.arguments[0] as {
      data: {
        failedLoginAttempts: number;
        lockedUntil: null;
        lastFailedLoginAt: null;
      };
    };
    assert.equal(updateArgs.data.failedLoginAttempts, 0);
    assert.equal(updateArgs.data.lockedUntil, null);
    assert.equal(updateArgs.data.lastFailedLoginAt, null);
  });
});

// ─── registerUser ─────────────────────────────────────────────────────────────

describe("registerUser", () => {
  beforeEach(() => {
    mockFindUnique.mock.resetCalls();
    mockCreate.mock.resetCalls();
    mockAccountCreate.mock.resetCalls();
    mockHashPassword.mock.resetCalls();
    mockTransaction.mock.resetCalls();
    mockRefreshTokenCreate.mock.resetCalls();
    mockPlanFindFirst.mock.resetCalls();
    mockCreate.mock.mockImplementation(async () =>
      buildFakeUser({ id: "user-new" }),
    );
    mockTransaction.mock.mockImplementation(async (fn) => {
      const tx = {
        user: { create: mockCreate },
        account: { create: mockAccountCreate },
        refreshToken: {
          findUnique: mockRefreshTokenFindUnique,
          delete: mockRefreshTokenDelete,
        },
        consentRecord: { createMany: mockConsentCreateMany },
      };
      return fn(tx);
    });
  });

  it("throws EMAIL_ALREADY_EXISTS when email already exists", async () => {
    mockFindUnique.mock.mockImplementation(async () => ({
      id: "existing",
    }));

    await assert.rejects(
      () => registerUser("taken@example.com", "Password1", "Test", "User"),
      (err: unknown) => {
        assert(err instanceof HttpErrorResponse);
        assert.equal(err.errorCode, "EMAIL_ALREADY_EXISTS");
        return true;
      },
    );
  });

  it("returns userId, accessToken, and refreshToken on success", async () => {
    mockFindUnique.mock.mockImplementation(async () => null);

    const result = await registerUser(
      "new@example.com",
      "Password1",
      "Test",
      "User",
    );
    assert.equal(result.userId, "user-new");
    assert.ok(result.accessToken.length > 0);
    assert.ok(result.refreshToken.length > 0);
    assert.equal(mockHashPassword.mock.callCount(), 1);
    assert.equal(mockTransaction.mock.callCount(), 1);
    assert.equal(mockRefreshTokenCreate.mock.callCount(), 1);
  });
});

// ─── refreshAccessToken ───────────────────────────────────────────────────────

describe("refreshAccessToken", () => {
  beforeEach(() => {
    mockRefreshTokenFindUnique.mock.resetCalls();
    mockRefreshTokenCreate.mock.resetCalls();
    mockRefreshTokenDelete.mock.resetCalls();
    mockRefreshTokenDeleteMany.mock.resetCalls();
    mockRefreshTokenUpdate.mock.resetCalls();
    // Reset transaction to a shape that supports the array form used by
    // rotation (update+create) — other describe blocks override this with
    // callback-only implementations.
    mockTransaction.mock.mockImplementation(async (fnOrArray) => {
      if (Array.isArray(fnOrArray)) return Promise.all(fnOrArray);
      const tx = {
        user: { create: mockCreate },
        account: { create: mockAccountCreate },
        refreshToken: {
          findUnique: mockRefreshTokenFindUnique,
          delete: mockRefreshTokenDelete,
          update: mockRefreshTokenUpdate,
          create: mockRefreshTokenCreate,
        },
        consentRecord: { createMany: mockConsentCreateMany },
      };
      return fnOrArray(tx);
    });
  });

  it("throws INVALID_REFRESH_TOKEN when token not found", async () => {
    mockRefreshTokenFindUnique.mock.mockImplementation(async () => null);

    await assert.rejects(
      () => refreshAccessToken("bad-token"),
      (err: unknown) => {
        assert(err instanceof HttpErrorResponse);
        assert.equal(err.errorCode, "INVALID_REFRESH_TOKEN");
        return true;
      },
    );
  });

  it("rotates tokens on success and preserves the family id", async () => {
    mockRefreshTokenFindUnique.mock.mockImplementation(async () => ({
      id: "rt-1",
      token: "old-token",
      userId: "user-1",
      familyId: "fam-1",
      revokedAt: null,
      expiresAt: new Date(Date.now() + 3600000),
    }));

    const result = await refreshAccessToken("old-token");
    assert.ok(result.accessToken.length > 0);
    assert.ok(result.refreshToken.length > 0);

    // Old token marked revoked (update), new token created in same family.
    assert.equal(mockRefreshTokenUpdate.mock.callCount(), 1);
    const updateArgs = mockRefreshTokenUpdate.mock.calls[0]!.arguments[0] as {
      where: { id: string };
      data: { revokedAt: Date };
    };
    assert.equal(updateArgs.where.id, "rt-1");
    assert.ok(updateArgs.data.revokedAt instanceof Date);

    assert.equal(mockRefreshTokenCreate.mock.callCount(), 1);
    const createArgs = mockRefreshTokenCreate.mock.calls[0]!.arguments[0] as {
      data: { familyId: string; userId: string };
    };
    assert.equal(createArgs.data.familyId, "fam-1");
    assert.equal(createArgs.data.userId, "user-1");

    // Delete is NOT called on the rotation path — rotation is update+create.
    assert.equal(mockRefreshTokenDelete.mock.callCount(), 0);
  });

  it("bumps tokenVersion and invalidates cache on refresh token reuse detection", async () => {
    mockRefreshTokenFindUnique.mock.mockImplementation(async () => ({
      id: "rt-1",
      token: "R1-stolen",
      userId: "user-1",
      familyId: "fam-1",
      revokedAt: new Date(Date.now() - 60_000),
      expiresAt: new Date(Date.now() + 3600000),
    }));
    mockInvalidateUserCache.mock.resetCalls();
    mockUserUpdate.mock.resetCalls();

    await assert.rejects(() => refreshAccessToken("R1-stolen"));

    // User.update called with tokenVersion increment
    assert.equal(mockUserUpdate.mock.callCount(), 1);
    const updateArgs = mockUserUpdate.mock.calls[0]!.arguments[0] as {
      where: { id: string };
      data: Record<string, unknown>;
    };
    assert.equal(updateArgs.where.id, "user-1");
    assert.deepEqual(updateArgs.data.tokenVersion, { increment: 1 });
    assert.equal(mockInvalidateUserCache.mock.callCount(), 1);
  });

  it("throws REFRESH_TOKEN_REUSE_DETECTED and wipes the family on replay of a revoked token", async () => {
    // The attacker replays R1 AFTER the legitimate rotation to R2 — R1 in
    // the DB has revokedAt set to the rotation moment.
    mockRefreshTokenFindUnique.mock.mockImplementation(async () => ({
      id: "rt-1",
      token: "R1-stolen",
      userId: "user-1",
      familyId: "fam-1",
      revokedAt: new Date(Date.now() - 60_000),
      expiresAt: new Date(Date.now() + 3600000),
    }));

    await assert.rejects(
      () => refreshAccessToken("R1-stolen"),
      (err: unknown) => {
        assert(err instanceof HttpErrorResponse);
        assert.equal(err.errorCode, "REFRESH_TOKEN_REUSE_DETECTED");
        assert.equal(err.statusCode, 401);
        return true;
      },
    );

    // Whole family wiped (both the legitimate R2 and any further rotations).
    assert.equal(mockRefreshTokenDeleteMany.mock.callCount(), 1);
    const args = mockRefreshTokenDeleteMany.mock.calls[0]!.arguments[0] as {
      where: { familyId: string };
    };
    assert.equal(args.where.familyId, "fam-1");

    // No new token issued on a reuse event.
    assert.equal(mockRefreshTokenCreate.mock.callCount(), 0);
    assert.equal(mockRefreshTokenUpdate.mock.callCount(), 0);
  });

  it("throws INVALID_REFRESH_TOKEN when token is expired (but not revoked)", async () => {
    mockRefreshTokenFindUnique.mock.mockImplementation(async () => ({
      id: "rt-expired",
      token: "old-token",
      userId: "user-1",
      familyId: "fam-1",
      revokedAt: null,
      expiresAt: new Date(Date.now() - 60_000),
    }));

    await assert.rejects(
      () => refreshAccessToken("old-token"),
      (err: unknown) => {
        assert(err instanceof HttpErrorResponse);
        assert.equal(err.errorCode, "INVALID_REFRESH_TOKEN");
        return true;
      },
    );

    // Expired ≠ reuse: no family wipe, no rotation.
    assert.equal(mockRefreshTokenDeleteMany.mock.callCount(), 0);
    assert.equal(mockRefreshTokenCreate.mock.callCount(), 0);
  });
});

// ─── logoutUser ───────────────────────────────────────────────────────────────

describe("logoutUser", () => {
  beforeEach(() => {
    mockRefreshTokenDeleteMany.mock.resetCalls();
  });

  it("deletes the refresh token from the database", async () => {
    await logoutUser("some-token");
    assert.equal(mockRefreshTokenDeleteMany.mock.callCount(), 1);
  });
});

// ─── verifyEmail ─────────────────────────────────────────────────────────────

describe("verifyEmail", () => {
  beforeEach(() => {
    mockFindUnique.mock.resetCalls();
    mockUserUpdate.mock.resetCalls();
  });

  it("returns verified: true if already verified (idempotent)", async () => {
    mockFindUnique.mock.mockImplementation(async () =>
      buildFakeUser({ emailVerified: true }),
    );
    const result = await verifyEmail("user-1", "123456");
    assert.deepEqual(result, { verified: true });
    assert.equal(mockUserUpdate.mock.callCount(), 0);
  });

  it("throws VERIFICATION_CODE_EXPIRED when no code exists", async () => {
    mockFindUnique.mock.mockImplementation(async () =>
      buildFakeUser({
        emailVerificationCode: null,
        emailVerificationExpires: null,
      }),
    );

    await assert.rejects(
      () => verifyEmail("user-1", "123456"),
      (err: unknown) => {
        assert(err instanceof HttpErrorResponse);
        assert.equal(err.errorCode, "VERIFICATION_CODE_EXPIRED");
        return true;
      },
    );
  });

  it("throws VERIFICATION_CODE_EXPIRED when code has expired", async () => {
    mockFindUnique.mock.mockImplementation(async () =>
      buildFakeUser({
        emailVerificationCode: "123456",
        emailVerificationExpires: new Date(Date.now() - 60000),
        emailVerificationAttempts: 0,
      }),
    );

    await assert.rejects(
      () => verifyEmail("user-1", "123456"),
      (err: unknown) => {
        assert(err instanceof HttpErrorResponse);
        assert.equal(err.errorCode, "VERIFICATION_CODE_EXPIRED");
        return true;
      },
    );
  });

  it("throws VERIFICATION_CODE_INVALIDATED after max attempts", async () => {
    mockFindUnique.mock.mockImplementation(async () =>
      buildFakeUser({
        emailVerificationCode: "123456",
        emailVerificationExpires: new Date(Date.now() + 900000),
        emailVerificationAttempts: 5,
      }),
    );

    await assert.rejects(
      () => verifyEmail("user-1", "wrong"),
      (err: unknown) => {
        assert(err instanceof HttpErrorResponse);
        assert.equal(err.errorCode, "VERIFICATION_CODE_INVALIDATED");
        return true;
      },
    );
  });

  it("throws VERIFICATION_CODE_INVALID on wrong code and increments attempts", async () => {
    mockFindUnique.mock.mockImplementation(async () =>
      buildFakeUser({
        emailVerificationCode: "123456",
        emailVerificationExpires: new Date(Date.now() + 900000),
        emailVerificationAttempts: 2,
      }),
    );

    await assert.rejects(
      () => verifyEmail("user-1", "000000"),
      (err: unknown) => {
        assert(err instanceof HttpErrorResponse);
        assert.equal(err.errorCode, "VERIFICATION_CODE_INVALID");
        return true;
      },
    );
    assert.equal(mockUserUpdate.mock.callCount(), 1);
  });

  it("sets emailVerified to true on correct code", async () => {
    mockFindUnique.mock.mockImplementation(async () =>
      buildFakeUser({
        emailVerificationCode: "123456",
        emailVerificationExpires: new Date(Date.now() + 900000),
        emailVerificationAttempts: 0,
      }),
    );

    const result = await verifyEmail("user-1", "123456");
    assert.deepEqual(result, { verified: true });
    assert.equal(mockUserUpdate.mock.callCount(), 1);
    const updateArg = mockUserUpdate.mock.calls[0].arguments[0] as {
      data: { emailVerified: boolean };
    };
    assert.equal(updateArg.data.emailVerified, true);
  });
});

// ─── resendVerificationCode ──────────────────────────────────────────────────

describe("resendVerificationCode", () => {
  beforeEach(() => {
    mockFindUnique.mock.resetCalls();
    mockUserUpdate.mock.resetCalls();
  });

  it("throws ALREADY_VERIFIED when user is already verified", async () => {
    mockFindUnique.mock.mockImplementation(async () =>
      buildFakeUser({ emailVerified: true }),
    );

    await assert.rejects(
      () => resendVerificationCode("user-1"),
      (err: unknown) => {
        assert(err instanceof HttpErrorResponse);
        assert.equal(err.errorCode, "ALREADY_VERIFIED");
        return true;
      },
    );
  });

  it("returns sent: false when a valid code still exists (anti-spam)", async () => {
    mockFindUnique.mock.mockImplementation(async () =>
      buildFakeUser({
        emailVerificationCode: "123456",
        emailVerificationExpires: new Date(Date.now() + 900000),
      }),
    );

    const result = await resendVerificationCode("user-1");
    assert.equal(result.sent, false);
    assert.equal(mockUserUpdate.mock.callCount(), 0);
  });

  it("generates and sends a new code when no valid code exists", async () => {
    mockFindUnique.mock.mockImplementation(async () =>
      buildFakeUser({
        emailVerificationCode: null,
        emailVerificationExpires: null,
        firstName: "Mario",
      }),
    );

    const result = await resendVerificationCode("user-1");
    assert.equal(result.sent, true);
    assert.equal(mockUserUpdate.mock.callCount(), 1);
  });
});

// ─── forgotPassword ──────────────────────────────────────────────────────────

describe("forgotPassword", () => {
  beforeEach(() => {
    mockFindUnique.mock.resetCalls();
    mockUserUpdate.mock.resetCalls();
  });

  it("silently returns when user not found (anti-enumeration)", async () => {
    mockFindUnique.mock.mockImplementation(async () => null);

    await forgotPassword("nonexistent@example.com");
    assert.equal(mockUserUpdate.mock.callCount(), 0);
  });

  it("generates and saves a reset code for valid patient", async () => {
    mockFindUnique.mock.mockImplementation(async () => buildFakeUser());

    await forgotPassword("user@example.com");
    assert.equal(mockUserUpdate.mock.callCount(), 1);
  });
});

// ─── resetPassword ───────────────────────────────────────────────────────────

describe("resetPassword", () => {
  beforeEach(() => {
    mockFindUnique.mock.resetCalls();
    mockUserUpdate.mock.resetCalls();
    mockHashPassword.mock.resetCalls();
    mockRefreshTokenDeleteMany.mock.resetCalls();
    mockTransaction.mock.resetCalls();
  });

  it("throws RESET_CODE_EXPIRED when user not found (generic error)", async () => {
    mockFindUnique.mock.mockImplementation(async () => null);

    await assert.rejects(
      () => resetPassword("nobody@example.com", "123456", "NewPass1"),
      (err: unknown) => {
        assert(err instanceof HttpErrorResponse);
        assert.equal(err.errorCode, "RESET_CODE_EXPIRED");
        return true;
      },
    );
  });

  it("throws RESET_CODE_EXPIRED when no code exists", async () => {
    mockFindUnique.mock.mockImplementation(async () =>
      buildFakeUser({ passwordResetCode: null, passwordResetExpires: null }),
    );

    await assert.rejects(
      () => resetPassword("user@example.com", "123456", "NewPass1"),
      (err: unknown) => {
        assert(err instanceof HttpErrorResponse);
        assert.equal(err.errorCode, "RESET_CODE_EXPIRED");
        return true;
      },
    );
  });

  it("throws RESET_CODE_EXPIRED when code has expired", async () => {
    mockFindUnique.mock.mockImplementation(async () =>
      buildFakeUser({
        passwordResetCode: "123456",
        passwordResetExpires: new Date(Date.now() - 60000),
        passwordResetAttempts: 0,
      }),
    );

    await assert.rejects(
      () => resetPassword("user@example.com", "123456", "NewPass1"),
      (err: unknown) => {
        assert(err instanceof HttpErrorResponse);
        assert.equal(err.errorCode, "RESET_CODE_EXPIRED");
        return true;
      },
    );
  });

  it("throws RESET_CODE_INVALIDATED after max attempts", async () => {
    mockFindUnique.mock.mockImplementation(async () =>
      buildFakeUser({
        passwordResetCode: "123456",
        passwordResetExpires: new Date(Date.now() + 900000),
        passwordResetAttempts: 5,
      }),
    );

    await assert.rejects(
      () => resetPassword("user@example.com", "wrong", "NewPass1"),
      (err: unknown) => {
        assert(err instanceof HttpErrorResponse);
        assert.equal(err.errorCode, "RESET_CODE_INVALIDATED");
        return true;
      },
    );
  });

  it("throws RESET_CODE_INVALID on wrong code", async () => {
    mockFindUnique.mock.mockImplementation(async () =>
      buildFakeUser({
        passwordResetCode: "123456",
        passwordResetExpires: new Date(Date.now() + 900000),
        passwordResetAttempts: 2,
      }),
    );

    await assert.rejects(
      () => resetPassword("user@example.com", "000000", "NewPass1"),
      (err: unknown) => {
        assert(err instanceof HttpErrorResponse);
        assert.equal(err.errorCode, "RESET_CODE_INVALID");
        return true;
      },
    );
    assert.equal(mockUserUpdate.mock.callCount(), 1);
  });

  it("updates password and invalidates sessions on correct code", async () => {
    mockFindUnique.mock.mockImplementation(async () =>
      buildFakeUser({
        passwordResetCode: "123456",
        passwordResetExpires: new Date(Date.now() + 900000),
        passwordResetAttempts: 0,
      }),
    );

    // resetPassword uses $transaction([...]) with an array (batch transaction)
    mockTransaction.mock.mockImplementation(async (arg) => {
      if (Array.isArray(arg)) return arg;
      return arg();
    });

    await resetPassword("user@example.com", "123456", "NewPassword1");
    assert.equal(mockHashPassword.mock.callCount(), 1);
  });

  it("bumps tokenVersion on successful reset and invalidates user cache", async () => {
    mockFindUnique.mock.mockImplementation(async () =>
      buildFakeUser({
        passwordResetCode: "123456",
        passwordResetExpires: new Date(Date.now() + 900000),
        passwordResetAttempts: 0,
        tokenVersion: 3,
      }),
    );
    mockTransaction.mock.mockImplementation(async (arg) => {
      if (Array.isArray(arg)) return arg;
      return arg();
    });
    mockInvalidateUserCache.mock.resetCalls();

    await resetPassword("user@example.com", "123456", "NewPassword1");

    const updateArgs = mockUserUpdate.mock.calls
      .map((c) => c.arguments[0] as { data: Record<string, unknown> })
      .find((a) => "password" in a.data);
    assert.ok(updateArgs, "expected a user.update call that sets password");
    assert.deepEqual(updateArgs.data.tokenVersion, { increment: 1 });
    assert.equal(mockInvalidateUserCache.mock.callCount(), 1);
    assert.equal(mockInvalidateUserCache.mock.calls[0]!.arguments[0], "user-1");
  });

  it("clears account lockout on successful reset", async () => {
    mockFindUnique.mock.mockImplementation(async () =>
      buildFakeUser({
        passwordResetCode: "123456",
        passwordResetExpires: new Date(Date.now() + 900000),
        passwordResetAttempts: 0,
        failedLoginAttempts: 25,
        lockedUntil: new Date(Date.now() + 15 * 60_000),
        lastFailedLoginAt: new Date(),
      }),
    );

    mockTransaction.mock.mockImplementation(async (arg) => {
      if (Array.isArray(arg)) return arg;
      return arg();
    });

    await resetPassword("user@example.com", "123456", "NewPassword1");

    // The user.update inside resetPassword must carry the unlock fields.
    const updateArgs = mockUserUpdate.mock.calls
      .map((c) => c.arguments[0] as { data: Record<string, unknown> })
      .find((a) => "password" in a.data);
    assert.ok(updateArgs, "expected a user.update call that sets password");
    assert.equal(updateArgs.data.failedLoginAttempts, 0);
    assert.equal(updateArgs.data.lockedUntil, null);
    assert.equal(updateArgs.data.lastFailedLoginAt, null);
  });
});
