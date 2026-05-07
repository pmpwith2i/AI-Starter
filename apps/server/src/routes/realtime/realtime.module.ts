import type { FastifyInstance } from "fastify";
import type { FromSchema } from "json-schema-to-ts";
import { issueTicket } from "#src/services/realtime-ticket.js";

/** Inlined here because it's the only realtime HTTP route and nothing else
 *  in the SDK consumes it today. If a second realtime route is added this
 *  should move into `@repo/server-sdk/schemas/realtime.ts`. */
const POST_REALTIME_TICKET_ROUTE_SCHEMA = {
  description:
    "Issue a short-lived single-use ticket for the WebSocket /ws handshake. " +
    "Replaces passing a long-lived JWT as a query param.",
  tags: ["realtime"],
  response: {
    200: {
      type: "object",
      required: ["ticket", "expiresInSeconds"],
      additionalProperties: false,
      properties: {
        ticket: { type: "string" },
        expiresInSeconds: { type: "number" },
      },
    },
  },
} as const;

export default async (fastify: FastifyInstance) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.post<{
    Reply: {
      200: FromSchema<(typeof POST_REALTIME_TICKET_ROUTE_SCHEMA.response)[200]>;
    };
  }>("/ticket", {
    schema: POST_REALTIME_TICKET_ROUTE_SCHEMA,
    config: {
      rateLimit: { max: 60, timeWindow: "1 minute" },
    },
    handler: async (request) => {
      const ticket = issueTicket(request.user!.id);
      return { ticket, expiresInSeconds: 30 };
    },
  });
};
