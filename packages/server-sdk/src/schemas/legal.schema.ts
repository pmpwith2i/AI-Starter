const legalDocumentObject = {
  type: "object",
  required: ["version", "content", "updatedAt"],
  additionalProperties: false,
  properties: {
    version: { type: "string" },
    content: { type: "string" },
    updatedAt: { type: "string" },
  },
} as const;

export const GET_PRIVACY_POLICY_ROUTE_SCHEMA = {
  response: { 200: legalDocumentObject },
} as const;

export const GET_TERMS_ROUTE_SCHEMA = {
  response: { 200: legalDocumentObject },
} as const;
