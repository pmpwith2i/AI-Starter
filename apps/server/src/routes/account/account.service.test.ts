import { describe, it, mock, beforeEach } from "node:test";
import assert from "node:assert/strict";

// ─── Shared mocks ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUserFindUnique = mock.fn<(...args: any[]) => Promise<any>>(
  async () => null,
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUserUpdate = mock.fn<(...args: any[]) => Promise<any>>(async () => ({
  id: "user-1",
}));

const buildDeleteManyMock = () =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mock.fn<(...args: any[]) => Promise<any>>(async () => ({ count: 1 }));

const chatConversationDeleteMany = buildDeleteManyMock();
const userSoulDeleteMany = buildDeleteManyMock();
const nutritionPlanDeleteMany = buildDeleteManyMock();
const backgroundTaskDeleteMany = buildDeleteManyMock();
const notificationDeleteMany = buildDeleteManyMock();
const suggestionDeleteMany = buildDeleteManyMock();
const refreshTokenDeleteMany = buildDeleteManyMock();
const accountDeleteMany = buildDeleteManyMock();
const eventRegistrationDeleteMany = buildDeleteManyMock();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const clinicalProfileDelete = mock.fn<(...args: any[]) => Promise<any>>(
  async () => ({ id: "cp-1" }),
);

// Track the order of operations inside the transaction so we can assert it.
const callLog: string[] = [];
const logCall = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  F extends (...args: any[]) => Promise<any>,
>(
  name: string,
  fn: F,
): F =>
  (async (...args: Parameters<F>) => {
    callLog.push(name);
    return fn(...args);
  }) as F;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockTransaction = mock.fn<(...args: any[]) => Promise<any>>(
  async (cb) => {
    const tx = {
      user: { update: logCall("user.update", mockUserUpdate) },
      chatConversation: {
        deleteMany: logCall("chat.deleteMany", chatConversationDeleteMany),
      },
      userSoul: {
        deleteMany: logCall("soul.deleteMany", userSoulDeleteMany),
      },
      nutritionPlan: {
        deleteMany: logCall("nutrition.deleteMany", nutritionPlanDeleteMany),
      },
      backgroundTask: {
        deleteMany: logCall("task.deleteMany", backgroundTaskDeleteMany),
      },
      notification: {
        deleteMany: logCall("notification.deleteMany", notificationDeleteMany),
      },
      suggestion: {
        deleteMany: logCall("suggestion.deleteMany", suggestionDeleteMany),
      },
      refreshToken: {
        deleteMany: logCall("rt.deleteMany", refreshTokenDeleteMany),
      },
      account: {
        deleteMany: logCall("account.deleteMany", accountDeleteMany),
      },
      eventRegistration: {
        deleteMany: logCall("eventReg.deleteMany", eventRegistrationDeleteMany),
      },
      clinicalProfile: {
        delete: logCall("clinicalProfile.delete", clinicalProfileDelete),
      },
    };
    return cb(tx);
  },
);

const mockComparePassword = mock.fn<
  (candidate: string, hashed: string) => Promise<boolean>
>(async () => false);

const mockInvalidateUserCache = mock.fn<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (...args: any[]) => Promise<number>
>(async () => 0);

// ─── Module mocks ──────────────────────────────────────────────────────────

mock.module("@repo/db", {
  namedExports: {
    getPrismaClient: () => ({
      user: { findUnique: mockUserFindUnique, update: mockUserUpdate },
      $transaction: mockTransaction,
    }),
    comparePassword: mockComparePassword,
  },
});

mock.module("@repo/crypto", {
  namedExports: {
    decrypt: () => "",
    decryptJson: () => ({}),
    getEncryptionKey: () => Buffer.alloc(32),
  },
});

mock.module("../../logger.js", {
  namedExports: { logger: { info: () => {}, warn: () => {}, error: () => {} } },
});

mock.module("../../lib/cache.js", {
  namedExports: {
    invalidateUserCache: mockInvalidateUserCache,
    cache: { wrap: <T>(fn: T) => fn, invalidateTags: async () => 0 },
    userTag: (id: string) => `user:${id}`,
  },
});

// ─── Import module under test (after mocks) ────────────────────────────────

const { deleteAccount } = await import("./account.service.js");
const { HttpErrorResponse } =
  await import("../../plugins/error-handler.plugin.js");

// ─── Helpers ───────────────────────────────────────────────────────────────

const resetAllMocks = () => {
  mockUserFindUnique.mock.resetCalls();
  mockUserUpdate.mock.resetCalls();
  mockTransaction.mock.resetCalls();
  mockComparePassword.mock.resetCalls();
  mockInvalidateUserCache.mock.resetCalls();
  chatConversationDeleteMany.mock.resetCalls();
  userSoulDeleteMany.mock.resetCalls();
  nutritionPlanDeleteMany.mock.resetCalls();
  backgroundTaskDeleteMany.mock.resetCalls();
  notificationDeleteMany.mock.resetCalls();
  suggestionDeleteMany.mock.resetCalls();
  refreshTokenDeleteMany.mock.resetCalls();
  accountDeleteMany.mock.resetCalls();
  eventRegistrationDeleteMany.mock.resetCalls();
  clinicalProfileDelete.mock.resetCalls();
  callLog.length = 0;
};

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("deleteAccount", () => {
  beforeEach(resetAllMocks);

  it("throws NOT_FOUND when user does not exist", async () => {
    mockUserFindUnique.mock.mockImplementation(async () => null);

    await assert.rejects(
      () => deleteAccount("ghost", "whatever"),
      (err: unknown) => {
        assert(err instanceof HttpErrorResponse);
        assert.equal(err.errorCode, "NOT_FOUND");
        return true;
      },
    );
  });

  it("throws DELETION_REQUIRES_PASSWORD when user has no password on record", async () => {
    mockUserFindUnique.mock.mockImplementation(async () => ({
      id: "user-1",
      password: null,
      clinicalProfileId: null,
    }));

    await assert.rejects(
      () => deleteAccount("user-1", "anything"),
      (err: unknown) => {
        assert(err instanceof HttpErrorResponse);
        assert.equal(err.errorCode, "DELETION_REQUIRES_PASSWORD");
        return true;
      },
    );
  });

  it("throws INVALID_CREDENTIALS when password does not match", async () => {
    mockUserFindUnique.mock.mockImplementation(async () => ({
      id: "user-1",
      password: "hashed",
      clinicalProfileId: null,
    }));
    mockComparePassword.mock.mockImplementation(async () => false);

    await assert.rejects(
      () => deleteAccount("user-1", "wrong"),
      (err: unknown) => {
        assert(err instanceof HttpErrorResponse);
        assert.equal(err.errorCode, "INVALID_CREDENTIALS");
        return true;
      },
    );

    // No deletes happened.
    assert.equal(mockTransaction.mock.callCount(), 0);
  });

  it("invokes every expected deleteMany + anonymizes user + invalidates cache (happy path)", async () => {
    mockUserFindUnique.mock.mockImplementation(async () => ({
      id: "user-1",
      password: "hashed",
      clinicalProfileId: null,
    }));
    mockComparePassword.mock.mockImplementation(async () => true);

    await deleteAccount("user-1", "correct");

    // Every per-user child was cleaned.
    assert.equal(chatConversationDeleteMany.mock.callCount(), 1);
    assert.equal(userSoulDeleteMany.mock.callCount(), 1);
    assert.equal(nutritionPlanDeleteMany.mock.callCount(), 1);
    assert.equal(backgroundTaskDeleteMany.mock.callCount(), 1);
    assert.equal(notificationDeleteMany.mock.callCount(), 1);
    assert.equal(suggestionDeleteMany.mock.callCount(), 1);
    assert.equal(refreshTokenDeleteMany.mock.callCount(), 1);
    assert.equal(accountDeleteMany.mock.callCount(), 1);
    assert.equal(eventRegistrationDeleteMany.mock.callCount(), 1);

    // User row anonymised (deletedAt + retentionExpiresAt set + PII cleared).
    const updateCalls = mockUserUpdate.mock.calls;
    const anonCall = updateCalls.find(
      (c) =>
        (c.arguments[0] as { data?: { deletedAt?: unknown } }).data
          ?.deletedAt != null,
    );
    assert.ok(anonCall, "expected the anonymization user.update call");
    const anonData = (
      anonCall.arguments[0] as {
        data: Record<string, unknown> & { email: string };
      }
    ).data;
    assert.match(anonData.email, /^deleted_[a-f0-9]{16}@redacted\.local$/);
    assert.equal(anonData.firstName, null);
    assert.equal(anonData.lastName, null);
    assert.equal(anonData.password, null);
    assert.equal(anonData.phone, null);
    assert.ok(anonData.deletedAt instanceof Date);
    assert.ok(anonData.retentionExpiresAt instanceof Date);

    // Cache invalidated exactly once after the transaction.
    assert.equal(mockInvalidateUserCache.mock.callCount(), 1);
    assert.equal(mockInvalidateUserCache.mock.calls[0]!.arguments[0], "user-1");
  });

  it("only deletes free event registrations (bundlePurchaseId=null AND eventPurchaseId=null)", async () => {
    mockUserFindUnique.mock.mockImplementation(async () => ({
      id: "user-1",
      password: "hashed",
      clinicalProfileId: null,
    }));
    mockComparePassword.mock.mockImplementation(async () => true);

    await deleteAccount("user-1", "correct");

    const whereArg = eventRegistrationDeleteMany.mock.calls[0]!
      .arguments[0] as { where: Record<string, unknown> };
    assert.deepEqual(whereArg.where, {
      userId: "user-1",
      bundlePurchaseId: null,
      eventPurchaseId: null,
    });
  });

  it("nulls the user FK before deleting ClinicalProfile (no orphan dangling reference)", async () => {
    mockUserFindUnique.mock.mockImplementation(async () => ({
      id: "user-1",
      password: "hashed",
      clinicalProfileId: "cp-1",
    }));
    mockComparePassword.mock.mockImplementation(async () => true);

    await deleteAccount("user-1", "correct");

    // user.update (null FK) must come BEFORE clinicalProfile.delete.
    const nullFkIdx = callLog.findIndex(
      (l, i) =>
        l === "user.update" &&
        // not the final anonymization update (which comes after the CP delete)
        i < callLog.lastIndexOf("user.update"),
    );
    const cpDeleteIdx = callLog.indexOf("clinicalProfile.delete");
    assert.notEqual(nullFkIdx, -1, "expected FK-null user.update");
    assert.notEqual(cpDeleteIdx, -1, "expected clinicalProfile.delete");
    assert.ok(
      nullFkIdx < cpDeleteIdx,
      `FK null must precede CP delete (got ${nullFkIdx} vs ${cpDeleteIdx})`,
    );
    assert.equal(clinicalProfileDelete.mock.callCount(), 1);
  });

  it("skips ClinicalProfile delete when user has no profile", async () => {
    mockUserFindUnique.mock.mockImplementation(async () => ({
      id: "user-1",
      password: "hashed",
      clinicalProfileId: null,
    }));
    mockComparePassword.mock.mockImplementation(async () => true);

    await deleteAccount("user-1", "correct");

    assert.equal(clinicalProfileDelete.mock.callCount(), 0);
  });
});
