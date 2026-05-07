// apps/server/src/routes/example/example.module.ts
//
// Pattern:
//   - one Fastify plugin per domain
//   - schema imported from @repo/server-sdk
//   - handler is a one-liner that calls the service
//   - preHandler stack: authenticate -> consentGuard([...purposes])
//   - config carries audit metadata; the onResponse hook persists the AuditLog row

import type { FastifyInstance } from "fastify";
import type { FromSchema } from "json-schema-to-ts";
import {
  POST_EXAMPLE_ROUTE_SCHEMA,
  GET_EXAMPLE_ROUTE_SCHEMA,
} from "@repo/server-sdk/schemas";
import { audit } from "../../services/audit-builder.js";
import { createExample, getExample } from "./example.service.js";

export default async (fastify: FastifyInstance) => {
  fastify.post<{
    Body: FromSchema<typeof POST_EXAMPLE_ROUTE_SCHEMA.body>;
    Reply: FromSchema<(typeof POST_EXAMPLE_ROUTE_SCHEMA.response)[200]>;
  }>("/", {
    schema: POST_EXAMPLE_ROUTE_SCHEMA,
    preHandler: [
      fastify.authenticate,
      fastify.consentGuard(["health_data_processing"]),
    ],
    config: { ...audit("example", "create", ["title", "notes"]) },
    handler: async (request) => createExample(request.user.id, request.body),
  });

  fastify.get<{
    Params: FromSchema<typeof GET_EXAMPLE_ROUTE_SCHEMA.params>;
    Reply: FromSchema<(typeof GET_EXAMPLE_ROUTE_SCHEMA.response)[200]>;
  }>("/:id", {
    schema: GET_EXAMPLE_ROUTE_SCHEMA,
    preHandler: [fastify.authenticate],
    config: { ...audit("example", "read") },
    handler: async (request) => getExample(request.user.id, request.params.id),
  });
};
