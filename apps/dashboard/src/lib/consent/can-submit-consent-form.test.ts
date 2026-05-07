import { describe, it, expect } from "vitest";
import { canSubmitConsentForm } from "./can-submit-consent-form";
import type { ConsentFormState } from "./types";

const MANDATORY = [
  "terms_of_service",
  "privacy_policy",
  "health_data_processing",
] as const;

const allFalse = (): ConsentFormState => ({
  terms_of_service: false,
  privacy_policy: false,
  health_data_processing: false,
  ai_data_processing: false,
  marketing_communications: false,
  third_party_stripe: false,
});

describe("canSubmitConsentForm", () => {
  it("returns true when every mandatory purpose is ticked", () => {
    const state: ConsentFormState = {
      ...allFalse(),
      terms_of_service: true,
      privacy_policy: true,
      health_data_processing: true,
    };
    expect(canSubmitConsentForm(state, MANDATORY)).toBe(true);
  });

  it("returns false when one mandatory purpose is unticked", () => {
    const state: ConsentFormState = {
      ...allFalse(),
      terms_of_service: true,
      privacy_policy: true,
      // health_data_processing missing
    };
    expect(canSubmitConsentForm(state, MANDATORY)).toBe(false);
  });

  it("returns false for a fully-empty state", () => {
    expect(canSubmitConsentForm(allFalse(), MANDATORY)).toBe(false);
  });

  it("ignores optional purposes — true even if they're all off", () => {
    const state: ConsentFormState = {
      ...allFalse(),
      terms_of_service: true,
      privacy_policy: true,
      health_data_processing: true,
      // all optional false
    };
    expect(canSubmitConsentForm(state, MANDATORY)).toBe(true);
  });

  it("works with a different mandatory list", () => {
    expect(canSubmitConsentForm(allFalse(), [])).toBe(true);
    expect(
      canSubmitConsentForm({ ...allFalse(), privacy_policy: true }, [
        "privacy_policy",
      ]),
    ).toBe(true);
  });
});
