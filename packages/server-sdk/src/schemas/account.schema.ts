/** DELETE /account — requires password confirmation. Hybrid strategy:
 *  - Hard delete: ClinicalProfile, chats, souls, nutrition plans, etc.
 *  - Anonymize + retain: CreditTransaction, CoursePurchase, EventPurchase, BundlePurchase
 *    (retained for 10 years per Italian tax law).
 *  - Retain as-is: ConsentRecord, AuditLog.
 */
export const DELETE_ACCOUNT_ROUTE_SCHEMA = {
  body: {
    type: "object",
    required: ["password"],
    additionalProperties: false,
    properties: {
      password: { type: "string", minLength: 1 },
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

/** GET /account/export — returns a JSON bundle of all user data. */
export const GET_ACCOUNT_EXPORT_ROUTE_SCHEMA = {
  response: {
    200: {
      type: "object",
      required: ["exportedAt", "data"],
      additionalProperties: false,
      properties: {
        exportedAt: { type: "string" },
        data: {
          type: "object",
          additionalProperties: true,
        },
      },
    },
  },
} as const;
