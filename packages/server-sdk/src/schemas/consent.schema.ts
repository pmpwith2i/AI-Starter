export const CONSENT_PURPOSES = [
  "terms_of_service",
  "privacy_policy",
  "health_data_processing",
  "ai_data_processing",
  "marketing_communications",
  "third_party_stripe",
] as const;

export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number];

/** Purposes that MUST be granted before a patient can access the dashboard. */
export const MANDATORY_CONSENT_PURPOSES: readonly ConsentPurpose[] = [
  "terms_of_service",
  "privacy_policy",
  "health_data_processing",
];

const consentRecordObject = {
  type: "object",
  required: ["purpose", "granted", "grantedAt", "revokedAt", "policyVersion"],
  additionalProperties: false,
  properties: {
    purpose: { type: "string", enum: [...CONSENT_PURPOSES] },
    granted: { type: "boolean" },
    grantedAt: { type: ["string", "null"] },
    revokedAt: { type: ["string", "null"] },
    policyVersion: { type: "string" },
  },
} as const;

/** GET /consent/status — returns consent state + the current policy versions. */
export const GET_CONSENT_STATUS_ROUTE_SCHEMA = {
  response: {
    200: {
      type: "object",
      required: ["consents", "currentVersions", "mandatoryMissing"],
      additionalProperties: false,
      properties: {
        consents: { type: "array", items: consentRecordObject },
        currentVersions: {
          type: "object",
          required: ["privacyPolicy", "terms"],
          additionalProperties: false,
          properties: {
            privacyPolicy: { type: "string" },
            terms: { type: "string" },
          },
        },
        mandatoryMissing: {
          type: "array",
          items: { type: "string", enum: [...CONSENT_PURPOSES] },
        },
      },
    },
  },
} as const;

/** POST /consent/grant — grant one or more consents in a single call. */
export const POST_CONSENT_GRANT_ROUTE_SCHEMA = {
  body: {
    type: "object",
    required: ["grants"],
    additionalProperties: false,
    properties: {
      grants: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          required: ["purpose", "granted", "policyVersion"],
          additionalProperties: false,
          properties: {
            purpose: { type: "string", enum: [...CONSENT_PURPOSES] },
            granted: { type: "boolean" },
            policyVersion: { type: "string" },
          },
        },
      },
    },
  },
  response: {
    200: {
      type: "object",
      required: ["success", "granted"],
      additionalProperties: false,
      properties: {
        success: { type: "boolean" },
        granted: { type: "integer" },
      },
    },
  },
} as const;

/** POST /consent/withdraw — revoke a single consent. */
export const POST_CONSENT_WITHDRAW_ROUTE_SCHEMA = {
  body: {
    type: "object",
    required: ["purpose"],
    additionalProperties: false,
    properties: {
      purpose: { type: "string", enum: [...CONSENT_PURPOSES] },
    },
  },
  response: {
    200: {
      type: "object",
      required: ["success"],
      additionalProperties: false,
      properties: {
        success: { type: "boolean" },
      },
    },
  },
} as const;
