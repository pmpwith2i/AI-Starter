import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

// ── Mock setup (must come before the dynamic import) ────────────────────────

const fakeDb: {
  consentRecord: {
    findMany: ReturnType<typeof mock.fn>;
    upsert: ReturnType<typeof mock.fn>;
    createMany: ReturnType<typeof mock.fn>;
  };
  $transaction: ReturnType<typeof mock.fn>;
} = {
  consentRecord: {
    findMany: mock.fn(async () => []),
    upsert: mock.fn(async () => ({})),
    createMany: mock.fn(async () => ({ count: 0 })),
  },
  $transaction: mock.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
    return fn(fakeDb);
  }),
};

mock.module("@repo/db", {
  namedExports: {
    getPrismaClient: () => fakeDb,
  },
});

mock.module("#src/constants/env.constants.js", {
  namedExports: {
    ENVIRONMENT_VARIABLES: {
      PRIVACY_POLICY_VERSION: "2026-04-13",
      TERMS_VERSION: "2026-04-13",
    },
  },
});

// Fake cache used by `consent.service.ts` via the shared `@repo/cache` facade.
// We only need to assert that:
//   - getConsentStatusCached is produced via `cache.wrap(origin, ...)`
//   - grant/withdraw call `cache.invalidateTags(["user:<id>"])`
// so a thin spy-based implementation is sufficient. The actual caching
// semantics are covered by the `@repo/cache` package tests.
const invalidateTagsSpy = mock.fn<(tags: readonly string[]) => Promise<number>>(
  async () => 0,
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const wrapSpy = mock.fn<(origin: any, opts: any) => any>((origin) => origin);

mock.module("#src/lib/cache.js", {
  namedExports: {
    cache: {
      wrap: wrapSpy,
      invalidateTags: invalidateTagsSpy,
      backend: {},
    },
    // Mirror the real `invalidateUserCache` which delegates to
    // `cache.invalidateTags([user:${userId}])`. Routing through
    // `invalidateTagsSpy` keeps the existing test assertions valid.
    invalidateUserCache: async (userId: string) =>
      invalidateTagsSpy([`user:${userId}`]),
    userTag: (userId: string) => `user:${userId}`,
  },
});

const {
  getConsentStatus,
  grantConsents,
  withdrawConsent,
  createInitialConsents,
} = await import("./consent.service.js");

describe("consent.service", () => {
  describe("getConsentStatus", () => {
    it("reports all mandatory purposes missing when no records exist", async () => {
      fakeDb.consentRecord.findMany.mock.mockImplementation(async () => []);
      const status = await getConsentStatus("user-1");
      assert.deepEqual(
        [...status.mandatoryMissing].sort(),
        ["terms_of_service", "privacy_policy", "health_data_processing"].sort(),
      );
    });

    it("reports missing purpose as outdated when policyVersion does not match", async () => {
      fakeDb.consentRecord.findMany.mock.mockImplementation(async () => [
        {
          purpose: "privacy_policy",
          granted: true,
          grantedAt: new Date(),
          revokedAt: null,
          policyVersion: "old-version",
        },
        {
          purpose: "terms_of_service",
          granted: true,
          grantedAt: new Date(),
          revokedAt: null,
          policyVersion: "2026-04-13",
        },
        {
          purpose: "health_data_processing",
          granted: true,
          grantedAt: new Date(),
          revokedAt: null,
          policyVersion: "2026-04-13",
        },
      ]);
      const status = await getConsentStatus("user-1");
      assert.ok(status.mandatoryMissing.includes("privacy_policy"));
      assert.ok(!status.mandatoryMissing.includes("terms_of_service"));
    });

    it("reports no mandatory missing when all granted with current versions", async () => {
      fakeDb.consentRecord.findMany.mock.mockImplementation(async () => [
        {
          purpose: "terms_of_service",
          granted: true,
          grantedAt: new Date(),
          revokedAt: null,
          policyVersion: "2026-04-13",
        },
        {
          purpose: "privacy_policy",
          granted: true,
          grantedAt: new Date(),
          revokedAt: null,
          policyVersion: "2026-04-13",
        },
        {
          purpose: "health_data_processing",
          granted: true,
          grantedAt: new Date(),
          revokedAt: null,
          policyVersion: "2026-04-13",
        },
      ]);
      const status = await getConsentStatus("user-1");
      assert.deepEqual(status.mandatoryMissing, []);
    });

    it("returns the current policy versions", async () => {
      fakeDb.consentRecord.findMany.mock.mockImplementation(async () => []);
      const status = await getConsentStatus("user-1");
      assert.equal(status.currentVersions.privacyPolicy, "2026-04-13");
      assert.equal(status.currentVersions.terms, "2026-04-13");
    });
  });

  describe("grantConsents", () => {
    it("upserts one row per grant", async () => {
      fakeDb.consentRecord.upsert.mock.resetCalls();
      const count = await grantConsents("user-1", [
        { purpose: "terms_of_service", granted: true, policyVersion: "v1" },
        { purpose: "privacy_policy", granted: true, policyVersion: "v1" },
      ]);
      assert.equal(count, 2);
      assert.equal(fakeDb.consentRecord.upsert.mock.callCount(), 2);
    });

    it("records grantedAt when granted=true", async () => {
      fakeDb.consentRecord.upsert.mock.resetCalls();
      await grantConsents("user-1", [
        {
          purpose: "marketing_communications",
          granted: true,
          policyVersion: "v1",
        },
      ]);
      const args = fakeDb.consentRecord.upsert.mock.calls[0]!.arguments[0] as {
        create: { grantedAt: Date | null; revokedAt: Date | null };
      };
      assert.ok(args.create.grantedAt instanceof Date);
      assert.equal(args.create.revokedAt, null);
    });

    it("records revokedAt when granted=false", async () => {
      fakeDb.consentRecord.upsert.mock.resetCalls();
      await grantConsents("user-1", [
        {
          purpose: "marketing_communications",
          granted: false,
          policyVersion: "v1",
        },
      ]);
      const args = fakeDb.consentRecord.upsert.mock.calls[0]!.arguments[0] as {
        create: { grantedAt: Date | null; revokedAt: Date | null };
      };
      assert.equal(args.create.grantedAt, null);
      assert.ok(args.create.revokedAt instanceof Date);
    });

    it("invalidates the per-user consent cache after commit", async () => {
      invalidateTagsSpy.mock.resetCalls();
      await grantConsents("user-42", [
        { purpose: "privacy_policy", granted: true, policyVersion: "v1" },
      ]);
      assert.equal(invalidateTagsSpy.mock.callCount(), 1);
      const [tags] = invalidateTagsSpy.mock.calls[0]!.arguments as [
        readonly string[],
      ];
      assert.deepEqual([...tags], ["user:user-42"]);
    });
  });

  describe("withdrawConsent", () => {
    it("upserts a row with granted=false and revokedAt set", async () => {
      fakeDb.consentRecord.upsert.mock.resetCalls();
      await withdrawConsent("user-1", "marketing_communications");
      const args = fakeDb.consentRecord.upsert.mock.calls[0]!.arguments[0] as {
        update: { granted: boolean; revokedAt: Date };
      };
      assert.equal(args.update.granted, false);
      assert.ok(args.update.revokedAt instanceof Date);
    });

    it("invalidates the per-user consent cache after commit", async () => {
      invalidateTagsSpy.mock.resetCalls();
      await withdrawConsent("user-42", "marketing_communications");
      assert.equal(invalidateTagsSpy.mock.callCount(), 1);
      const [tags] = invalidateTagsSpy.mock.calls[0]!.arguments as [
        readonly string[],
      ];
      assert.deepEqual([...tags], ["user:user-42"]);
    });
  });

  describe("cache wiring at module load", () => {
    it("wraps getConsentStatus through the shared cache with a user:<id> tag", () => {
      // The `wrap` spy fires once at module import (when
      // `getConsentStatusCached` is constructed). Verify the namespace,
      // ttl, and tag function shape.
      assert.ok(wrapSpy.mock.callCount() >= 1);
      const call = wrapSpy.mock.calls[0]!;
      const opts = call.arguments[1] as {
        namespace: string;
        ttlMs: number;
        keyFn: (id: string) => string;
        tags: (id: string) => readonly string[];
        singleFlight?: boolean;
      };
      assert.ok(opts, "wrap called with options object");
      assert.equal(opts.namespace, "consent");
      assert.equal(opts.ttlMs, 30_000);
      assert.equal(opts.keyFn("user-1"), "user-1");
      assert.deepEqual([...opts.tags("user-1")], ["user:user-1"]);
      assert.equal(opts.singleFlight, true);
    });
  });

  describe("createInitialConsents", () => {
    it("delegates to createMany with 'signup' as collectedVia", async () => {
      fakeDb.consentRecord.createMany.mock.resetCalls();
      await createInitialConsents("user-1", [
        { purpose: "terms_of_service", granted: true, policyVersion: "v1" },
        { purpose: "privacy_policy", granted: true, policyVersion: "v1" },
      ]);
      assert.equal(fakeDb.consentRecord.createMany.mock.callCount(), 1);
      const args = fakeDb.consentRecord.createMany.mock.calls[0]!
        .arguments[0] as {
        data: Array<{ collectedVia: string }>;
      };
      assert.equal(args.data.length, 2);
      assert.equal(args.data[0]!.collectedVia, "signup");
    });
  });
});
