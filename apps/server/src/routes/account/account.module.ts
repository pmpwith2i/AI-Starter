import type { FastifyInstance } from "fastify";
import type { FromSchema } from "json-schema-to-ts";
import {
  DELETE_ACCOUNT_ROUTE_SCHEMA,
  GET_ACCOUNT_EXPORT_ROUTE_SCHEMA,
} from "@repo/server-sdk/schemas";
import { deleteAccount, exportAccount } from "./account.service.js";
import { audit } from "#src/services/audit-builder.js";

export default async (fastify: FastifyInstance) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.delete<{
    Body: FromSchema<typeof DELETE_ACCOUNT_ROUTE_SCHEMA.body>;
    Reply: {
      200: FromSchema<(typeof DELETE_ACCOUNT_ROUTE_SCHEMA.response)[200]>;
    };
  }>("/", {
    schema: DELETE_ACCOUNT_ROUTE_SCHEMA,
    config: {
      rateLimit: { max: 1, timeWindow: "1 day" },
      ...audit("user_account", "delete"),
    },
    handler: async (request) => {
      await deleteAccount(request.user!.id, request.body.password);
      return { success: true };
    },
  });

  fastify.get<{
    Reply: {
      200: FromSchema<(typeof GET_ACCOUNT_EXPORT_ROUTE_SCHEMA.response)[200]>;
    };
  }>("/export", {
    schema: GET_ACCOUNT_EXPORT_ROUTE_SCHEMA,
    config: {
      rateLimit: { max: 2, timeWindow: "1 day" },
      ...audit("user_account", "export"),
    },
    handler: async (request) => {
      return exportAccount(request.user!.id);
    },
  });
};
