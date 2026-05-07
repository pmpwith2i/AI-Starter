import type { ConsentPurpose } from "@repo/server-sdk/schemas";

/**
 * Per-purpose boolean state backing the consent form UI. Covers every
 * defined purpose so the helpers never have to guess.
 */
export type ConsentFormState = Record<ConsentPurpose, boolean>;

export interface ConsentPolicyVersions {
  privacyPolicy: string;
  terms: string;
}
