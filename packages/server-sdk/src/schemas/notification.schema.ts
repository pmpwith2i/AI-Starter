import { paginationResponseSchema } from "./pagination.js";

const notificationObject = {
  type: "object",
  required: ["id", "type", "title", "body", "read", "createdAt"],
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    type: { type: "string" },
    title: { type: "string" },
    body: { type: "string" },
    read: { type: "boolean" },
    metadata: {},
    createdAt: { type: "string" },
  },
} as const;

export const GET_NOTIFICATIONS_ROUTE_SCHEMA = {
  querystring: {
    type: "object",
    properties: {
      page: { type: "integer", minimum: 1, default: 1 },
      limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
      unreadOnly: { type: "boolean", default: false },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: "object",
      required: ["data", "pagination"],
      additionalProperties: false,
      properties: {
        data: { type: "array", items: notificationObject },
        pagination: paginationResponseSchema,
      },
    },
  },
} as const;

export const GET_NOTIFICATION_COUNT_ROUTE_SCHEMA = {
  response: {
    200: {
      type: "object",
      required: ["unreadCount"],
      additionalProperties: false,
      properties: {
        unreadCount: { type: "integer" },
      },
    },
  },
} as const;

export const PUT_NOTIFICATION_READ_ROUTE_SCHEMA = {
  params: {
    type: "object",
    required: ["id"],
    additionalProperties: false,
    properties: {
      id: { type: "string" },
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

export const PUT_NOTIFICATIONS_READ_ALL_ROUTE_SCHEMA = {
  response: {
    200: {
      type: "object",
      required: ["success", "updatedCount"],
      additionalProperties: false,
      properties: {
        success: { type: "boolean" },
        updatedCount: { type: "integer" },
      },
    },
  },
} as const;
