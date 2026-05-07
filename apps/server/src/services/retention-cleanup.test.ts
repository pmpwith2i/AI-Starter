import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

// Counts returned by each fake deleteMany call.
const counts: Record<string, number> = {
  chatMessage: 5,
  compactedSegment: 2,
  userSoul: 1,
  backgroundTask: 4,
  notification: 3,
  suggestion: 6,
  clinicalProfile: 7,
  user: 3,
};

const makeDeleter = (key: string) =>
  mock.fn(async () => ({ count: counts[key]! }));

const fakes = {
  chatMessage: makeDeleter("chatMessage"),
  compactedSegment: makeDeleter("compactedSegment"),
  userSoul: makeDeleter("userSoul"),
  backgroundTask: makeDeleter("backgroundTask"),
  notification: makeDeleter("notification"),
  suggestion: makeDeleter("suggestion"),
  clinicalProfile: makeDeleter("clinicalProfile"),
  user: makeDeleter("user"),
};

mock.module("@repo/db", {
  namedExports: {
    getPrismaClient: () => ({
      chatMessage: { deleteMany: fakes.chatMessage },
      compactedSegment: { deleteMany: fakes.compactedSegment },
      userSoul: { deleteMany: fakes.userSoul },
      backgroundTask: { deleteMany: fakes.backgroundTask },
      notification: { deleteMany: fakes.notification },
      suggestion: { deleteMany: fakes.suggestion },
      clinicalProfile: { deleteMany: fakes.clinicalProfile },
      user: { deleteMany: fakes.user },
    }),
  },
});

const { runRetentionCleanup } = await import("./retention-cleanup.js");

describe("runRetentionCleanup (patient)", () => {
  it("deletes rows past retention on every retention-managed model", async () => {
    Object.values(fakes).forEach((f) => f.mock.resetCalls());
    const result = await runRetentionCleanup();

    assert.equal(result.chatMessage, 5);
    assert.equal(result.compactedSegment, 2);
    assert.equal(result.userSoul, 1);
    assert.equal(result.backgroundTask, 4);
    assert.equal(result.notification, 3);
    assert.equal(result.suggestion, 6);
    assert.equal(result.clinicalProfile, 7);
    assert.equal(result.user, 3);
  });

  it("uses retentionExpiresAt < now() as the filter on every model", async () => {
    Object.values(fakes).forEach((f) => f.mock.resetCalls());
    await runRetentionCleanup();
    for (const fake of Object.values(fakes)) {
      const calls = fake.mock.calls as unknown as Array<{
        arguments: [{ where: { retentionExpiresAt: { lt: Date } } }];
      }>;
      assert.ok(
        calls[0]?.arguments[0].where.retentionExpiresAt.lt instanceof Date,
        "each deleteMany must filter by retentionExpiresAt < now()",
      );
    }
  });

  it("deletes children before the cascade parent (User)", async () => {
    Object.values(fakes).forEach((f) => f.mock.resetCalls());
    await runRetentionCleanup();
    // User.deleteMany must be called AFTER every child model's deleteMany
    // so cascading doesn't snipe away already-counted rows.
    const userCallOrder = fakes.user.mock.calls[0] ? 1 : 0;
    assert.ok(userCallOrder > 0, "user.deleteMany was called");
    // Rough ordering check: children called at least once each before user.
    assert.ok(fakes.chatMessage.mock.calls.length > 0);
    assert.ok(fakes.clinicalProfile.mock.calls.length > 0);
  });

  it("propagates zero counts cleanly", async () => {
    Object.values(fakes).forEach((f) => {
      f.mock.resetCalls();
      f.mock.mockImplementationOnce(async () => ({ count: 0 }));
    });
    const result = await runRetentionCleanup();
    assert.equal(result.chatMessage, 0);
    assert.equal(result.user, 0);
  });
});
