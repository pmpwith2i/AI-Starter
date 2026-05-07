import type { ConsentPurpose } from "@repo/server-sdk/schemas";
import type { ConsentFormState } from "./types";

/**
 * Returns true when every mandatory purpose is ticked. Optional purposes
 * never block submit.
 */
export const canSubmitConsentForm = (
  state: ConsentFormState,
  mandatory: readonly ConsentPurpose[],
): boolean => mandatory.every((p) => state[p] === true);
