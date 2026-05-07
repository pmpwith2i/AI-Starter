import type { FastifyInstance } from "fastify";
import type { FromSchema } from "json-schema-to-ts";
import {
  GET_NOTIFICATIONS_ROUTE_SCHEMA,
  GET_NOTIFICATION_COUNT_ROUTE_SCHEMA,
  PUT_NOTIFICATION_READ_ROUTE_SCHEMA,
  PUT_NOTIFICATIONS_READ_ALL_ROUTE_SCHEMA,
} from "@repo/server-sdk/schemas";
import {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "./notification.service.js";
import { emailVerifiedGuard } from "#src/plugins/email-verified-guard.js";

export default async (fastify: FastifyInstance) => {
  fastify.addHook("preHandler", fastify.authenticate);
  fastify.addHook("preHandler", emailVerifiedGuard);

  fastify.get<{
    Querystring: FromSchema<typeof GET_NOTIFICATIONS_ROUTE_SCHEMA.querystring>;
    Reply: {
      200: FromSchema<(typeof GET_NOTIFICATIONS_ROUTE_SCHEMA.response)[200]>;
    };
  }>("/", {
    schema: GET_NOTIFICATIONS_ROUTE_SCHEMA,
    handler: async (request) => {
      const { page = 1, limit = 20, unreadOnly = false } = request.query;
      return listNotifications({
        userId: request.user!.id,
        page,
        limit,
        unreadOnly,
      });
    },
  });

  fastify.get<{
    Reply: {
      200: FromSchema<
        (typeof GET_NOTIFICATION_COUNT_ROUTE_SCHEMA.response)[200]
      >;
    };
  }>("/count", {
    schema: GET_NOTIFICATION_COUNT_ROUTE_SCHEMA,
    handler: async (request) => {
      const unreadCount = await getUnreadCount(request.user!.id);
      return { unreadCount };
    },
  });

  fastify.put<{
    Params: FromSchema<typeof PUT_NOTIFICATION_READ_ROUTE_SCHEMA.params>;
    Reply: {
      200: FromSchema<
        (typeof PUT_NOTIFICATION_READ_ROUTE_SCHEMA.response)[200]
      >;
    };
  }>("/:id/read", {
    schema: PUT_NOTIFICATION_READ_ROUTE_SCHEMA,
    handler: async (request) => {
      await markAsRead(request.user!.id, request.params.id);
      return { success: true };
    },
  });

  fastify.put<{
    Reply: {
      200: FromSchema<
        (typeof PUT_NOTIFICATIONS_READ_ALL_ROUTE_SCHEMA.response)[200]
      >;
    };
  }>("/read-all", {
    schema: PUT_NOTIFICATIONS_READ_ALL_ROUTE_SCHEMA,
    handler: async (request) => {
      const updatedCount = await markAllAsRead(request.user!.id);
      return { success: true, updatedCount };
    },
  });
};
