import { HttpErrorResponse } from "#src/plugins/error-handler.plugin.js";
import {
  ERROR_CODES,
  GET_PROFILE_ROUTE_SCHEMA,
  POST_COMPLETE_ONBOARDING_ROUTE_SCHEMA,
  POST_UPLOAD_AVATAR_ROUTE_SCHEMA,
  PUT_PROFILE_ROUTE_SCHEMA,
} from "@repo/server-sdk/schemas";
import type { FastifyInstance } from "fastify";
import type { FromSchema } from "json-schema-to-ts";
import {
  completeOnboarding,
  getProfile,
  updateProfile,
  uploadAvatar,
} from "./profile.service.js";

export default async (fastify: FastifyInstance) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get<{
    Reply: {
      200: FromSchema<(typeof GET_PROFILE_ROUTE_SCHEMA.response)["200"]>;
    };
  }>("/", {
    schema: GET_PROFILE_ROUTE_SCHEMA,
    handler: async (request) => {
      return getProfile(request.user!.id);
    },
  });

  fastify.put<{
    Body: FromSchema<typeof PUT_PROFILE_ROUTE_SCHEMA.body>;
    Reply: {
      200: FromSchema<(typeof PUT_PROFILE_ROUTE_SCHEMA.response)["200"]>;
    };
  }>("/", {
    schema: PUT_PROFILE_ROUTE_SCHEMA,
    handler: async (request) => {
      return updateProfile(request.user!.id, request.body);
    },
  });

  fastify.post<{
    Reply: {
      200: FromSchema<
        (typeof POST_COMPLETE_ONBOARDING_ROUTE_SCHEMA.response)["200"]
      >;
    };
  }>("/complete-onboarding", {
    schema: POST_COMPLETE_ONBOARDING_ROUTE_SCHEMA,
    handler: async (request) => {
      return completeOnboarding(request.user!.id);
    },
  });

  fastify.post<{
    Reply: {
      200: FromSchema<(typeof POST_UPLOAD_AVATAR_ROUTE_SCHEMA.response)["200"]>;
    };
  }>("/avatar", {
    schema: POST_UPLOAD_AVATAR_ROUTE_SCHEMA,
    handler: async (request) => {
      const data = await request.file();
      if (!data) {
        throw new HttpErrorResponse(
          "No file uploaded",
          400,
          ERROR_CODES.NO_FILE_UPLOADED,
        );
      }

      const buffer = await data.toBuffer();
      return uploadAvatar(request.user!.id, buffer, data.mimetype);
    },
  });
};
