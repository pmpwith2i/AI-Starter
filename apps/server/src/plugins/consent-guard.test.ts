import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import type { ConsentPurpose } from "@repo/server-sdk/schemas";

// Fake getConsentStatus dispatcher used by the guard.
const stubStatus = {
  consents: [],
  currentVersions: { privacyPolicy: "v1", terms: "v1" },
  mandatoryMissing: [] as ConsentPurpose[],
};

mock.module("../routes/consent/consent.service.js", {
  namedExports: {
    getConsentStatus: mock.fn(async () => stubStatus),
    // The guard reads from the cached variant after the @repo/cache wiring.
    // Dispatching to the same stubStatus keeps the guard behaviour under test.
    getConsentStatusCached: mock.fn(async () => stubStatus),
  },
});

const { consentGuard, ConsentRequiredError } =
  await import("./consent-guard.js");

const makeRequest = (userId: string | null = "user-1") =>
  ({
    user: userId ? { id: userId } : null,
  }) as unknown as import("fastify").FastifyRequest;

describe("consentGuard", () => {
  it("allows the request when no mandatory purpose is missing", async () => {
    stubStatus.mandatoryMissing = [];
    const guard = consentGuard(["health_data_processing"]);
    await guard(makeRequest());
  });

  it("throws ConsentRequiredError when a required purpose is missing", async () => {
    stubStatus.mandatoryMissing = ["health_data_processing", "privacy_policy"];
    const guard = consentGuard(["health_data_processing"]);
    await assert.rejects(
      () => guard(makeRequest()),
      (err: unknown) => {
        assert.ok(err instanceof ConsentRequiredError);
        assert.equal(err.statusCode, 403);
        assert.deepEqual(err.missing, ["health_data_processing"]);
        return true;
      },
    );
  });

  it("ignores unrelated missing purposes", async () => {
    stubStatus.mandatoryMissing = ["marketing_communications"];
    const guard = consentGuard(["health_data_processing"]);
    await guard(makeRequest());
  });

  it("throws when the request is unauthenticated (defence in depth)", async () => {
    stubStatus.mandatoryMissing = [];
    const guard = consentGuard(["health_data_processing"]);
    await assert.rejects(() => guard(makeRequest(null)));
  });
});
