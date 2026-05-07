import { describe, it, expect } from "vitest";
import { buildConsentGrants } from "./build-consent-grants";
import type { ConsentFormState } from "./types";

const VERSIONS = { privacyPolicy: "pp-2026-01", terms: "tos-2026-01" };

const allFalse = (): ConsentFormState => ({
  terms_of_service: false,
  privacy_policy: false,
  health_data_processing: false,
  ai_data_processing: false,
  marketing_communications: false,
  third_party_stripe: false,
});

describe("buildConsentGrants", () => {
  it("produces one grant entry per purpose", () => {
    const grants = buildConsentGrants(allFalse(), VERSIONS);
    const purposes = grants.map((g) => g.purpose).sort();
    expect(purposes).toEqual(
      [
        "ai_data_processing",
        "health_data_processing",
        "marketing_communications",
        "privacy_policy",
        "terms_of_service",
        "third_party_stripe",
      ].sort(),
    );
  });

  it("uses privacy-policy version for privacy_policy and health_data_processing", () => {
    const grants = buildConsentGrants(allFalse(), VERSIONS);
    const pp = grants.find((g) => g.purpose === "privacy_policy")!;
    const hdp = grants.find((g) => g.purpose === "health_data_processing")!;
    expect(pp.policyVersion).toBe(VERSIONS.privacyPolicy);
    expect(hdp.policyVersion).toBe(VERSIONS.privacyPolicy);
  });

  it("uses terms version for terms_of_service", () => {
    const grants = buildConsentGrants(allFalse(), VERSIONS);
    const tos = grants.find((g) => g.purpose === "terms_of_service")!;
    expect(tos.policyVersion).toBe(VERSIONS.terms);
  });

  it('uses "1" for optional purposes without a dedicated version track', () => {
    const grants = buildConsentGrants(allFalse(), VERSIONS);
    const ai = grants.find((g) => g.purpose === "ai_data_processing")!;
    const mkt = grants.find((g) => g.purpose === "marketing_communications")!;
    const stripe = grants.find((g) => g.purpose === "third_party_stripe")!;
    expect(ai.policyVersion).toBe("1");
    expect(mkt.policyVersion).toBe("1");
    expect(stripe.policyVersion).toBe("1");
  });

  it("forwards the boolean state unchanged", () => {
    const state: ConsentFormState = {
      ...allFalse(),
      terms_of_service: true,
      privacy_policy: true,
      health_data_processing: true,
      ai_data_processing: true,
      // marketing + stripe remain false — explicit decline
    };
    const grants = buildConsentGrants(state, VERSIONS);
    expect(grants.find((g) => g.purpose === "terms_of_service")!.granted).toBe(
      true,
    );
    expect(grants.find((g) => g.purpose === "privacy_policy")!.granted).toBe(
      true,
    );
    expect(
      grants.find((g) => g.purpose === "health_data_processing")!.granted,
    ).toBe(true);
    expect(
      grants.find((g) => g.purpose === "ai_data_processing")!.granted,
    ).toBe(true);
    expect(
      grants.find((g) => g.purpose === "marketing_communications")!.granted,
    ).toBe(false);
    expect(
      grants.find((g) => g.purpose === "third_party_stripe")!.granted,
    ).toBe(false);
  });

  it("records declined optional purposes as granted:false (explicit decision)", () => {
    const grants = buildConsentGrants(allFalse(), VERSIONS);
    // Every entry is granted:false — we record declines too, for audit.
    expect(grants.every((g) => g.granted === false)).toBe(true);
  });
});
