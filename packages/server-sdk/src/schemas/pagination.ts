export const PAGINATION_QUERY_SCHEMA = {
  type: "object",
  properties: {
    page: { type: "integer", minimum: 1, default: 1 },
    limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
  },
  additionalProperties: false,
} as const;

export const paginationResponseSchema = {
  type: "object",
  required: ["page", "limit", "total", "totalPages"],
  additionalProperties: false,
  properties: {
    page: { type: "integer" },
    limit: { type: "integer" },
    total: { type: "integer" },
    totalPages: { type: "integer" },
  },
} as const;

export const ID_PARAMS_SCHEMA = {
  type: "object",
  required: ["id"],
  additionalProperties: false,
  properties: {
    id: { type: "string" },
  },
} as const;
