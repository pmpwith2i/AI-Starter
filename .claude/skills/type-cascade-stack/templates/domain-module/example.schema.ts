// packages/server-sdk/src/schemas/example.schema.ts
//
// Pattern: every route is one `as const` JSON Schema object with `body`/`params`/`response`.
// `additionalProperties: false` everywhere. Every type the server and dashboard need
// is derived via `FromSchema<typeof X>` — never hand-written.

import { FromSchema } from "json-schema-to-ts";

export const POST_EXAMPLE_ROUTE_SCHEMA = {
  body: {
    type: "object",
    required: ["title"],
    additionalProperties: false,
    properties: {
      title: { type: "string", minLength: 1, maxLength: 200 },
      notes: { type: "string", maxLength: 5000 },
    },
  },
  response: {
    200: {
      type: "object",
      required: ["id", "title", "createdAt"],
      additionalProperties: false,
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        notes: { type: ["string", "null"] },
        createdAt: { type: "string", format: "date-time" },
      },
    },
  },
} as const;

export type CreateExampleBody = FromSchema<typeof POST_EXAMPLE_ROUTE_SCHEMA.body>;
export type ExampleResponse = FromSchema<(typeof POST_EXAMPLE_ROUTE_SCHEMA.response)[200]>;

export const GET_EXAMPLE_ROUTE_SCHEMA = {
  params: {
    type: "object",
    required: ["id"],
    additionalProperties: false,
    properties: { id: { type: "string" } },
  },
  response: {
    200: POST_EXAMPLE_ROUTE_SCHEMA.response[200],
  },
} as const;

export type ExampleParams = FromSchema<typeof GET_EXAMPLE_ROUTE_SCHEMA.params>;
