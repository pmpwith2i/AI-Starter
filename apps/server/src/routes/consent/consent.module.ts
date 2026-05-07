import type { FastifyInstance } from "fastify";
import type { FromSchema } from "json-schema-to-ts";
import {
  GET_CONSENT_STATUS_ROUTE_SCHEMA,
  POST_CONSENT_GRANT_ROUTE_SCHEMA,
  POST_CONSENT_WITHDRAW_ROUTE_SCHEMA,
} from "@repo/server-sdk/schemas";
import {
  getConsentStatus,
  grantConsents,
  withdrawConsent,
} from "./consent.service.js";
import { audit } from "#src/services/audit-builder.js";

export default async (fastify: FastifyInstance) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get<{
    Reply: {
      200: FromSchema<(typeof GET_CONSENT_STATUS_ROUTE_SCHEMA.response)[200]>;
    };
  }>("/status", {
    schema: GET_CONSENT_STATUS_ROUTE_SCHEMA,
    handler: async (request) => {
      return getConsentStatus(request.user!.id);
    },
  });

  fastify.post<{
    Body: FromSchema<typeof POST_CONSENT_GRANT_ROUTE_SCHEMA.body>;
    Reply: {
      200: FromSchema<(typeof POST_CONSENT_GRANT_ROUTE_SCHEMA.response)[200]>;
    };
  }>("/grant", {
    schema: POST_CONSENT_GRANT_ROUTE_SCHEMA,
    config: {
      rateLimit: { max: 20, timeWindow: "1 minute" },
      ...audit("consent", "create"),
    },
    handler: async (request) => {
      const granted = await grantConsents(
        request.user!.id,
        request.body.grants,
        {
          ipAddress: request.ip,
          userAgent: request.headers["user-agent"],
        },
      );
      return { success: true, granted };
    },
  });

  fastify.post<{
    Body: FromSchema<typeof POST_CONSENT_WITHDRAW_ROUTE_SCHEMA.body>;
    Reply: {
      200: FromSchema<
        (typeof POST_CONSENT_WITHDRAW_ROUTE_SCHEMA.response)[200]
      >;
    };
  }>("/withdraw", {
    schema: POST_CONSENT_WITHDRAW_ROUTE_SCHEMA,
    config: {
      rateLimit: { max: 20, timeWindow: "1 minute" },
      ...audit("consent", "update"),
    },
    handler: async (request) => {
      await withdrawConsent(request.user!.id, request.body.purpose, {
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"],
      });
      return { success: true };
    },
  });
};
