import { CONSENT_PURPOSES } from "@repo/server-sdk/schemas";
import type { ConsentPurpose } from "@repo/server-sdk/schemas";
import type { ConsentFormState, ConsentPolicyVersions } from "./types";

interface ConsentGrant {
  purpose: ConsentPurpose;
  granted: boolean;
  policyVersion: string;
}

/**
 * Map the purpose to the policy version the user is agreeing against.
 * Mirrors the server's `versionForPurpose` in consent.service.ts so we
 * don't store stale versions by accident.
 */
const versionForPurpose = (
  purpose: ConsentPurpose,
  versions: ConsentPolicyVersions,
): string => {
  if (purpose === "privacy_policy" || purpose === "health_data_processing") {
    return versions.privacyPolicy;
  }
  if (purpose === "terms_of_service") {
    return versions.terms;
  }
  // No dedicated version track for ai/marketing/stripe yet — static "1".
  return "1";
};

/**
 * Build the POST /consent/grant payload: one entry per purpose (including
 * declined ones, so the audit trail records an explicit decision).
 */
export const buildConsentGrants = (
  state: ConsentFormState,
  versions: ConsentPolicyVersions,
): ConsentGrant[] =>
  CONSENT_PURPOSES.map((purpose) => ({
    purpose,
    granted: state[purpose] === true,
    policyVersion: versionForPurpose(purpose, versions),
  }));
