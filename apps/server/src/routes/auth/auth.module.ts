import { FastifyInstance } from "fastify";
import { FromSchema } from "json-schema-to-ts";

import {
  POST_LOGIN_ROUTE_SCHEMA,
  POST_SIGNUP_ROUTE_SCHEMA,
  POST_REFRESH_ROUTE_SCHEMA,
  POST_LOGOUT_ROUTE_SCHEMA,
  POST_VERIFY_EMAIL_ROUTE_SCHEMA,
  POST_RESEND_VERIFICATION_CODE_ROUTE_SCHEMA,
  POST_FORGOT_PASSWORD_ROUTE_SCHEMA,
  POST_RESET_PASSWORD_ROUTE_SCHEMA,
  ERROR_CODES,
} from "@repo/server-sdk/schemas";

import {
  loginUser,
  registerUser,
  refreshAccessToken,
  logoutUser,
  verifyEmail,
  resendVerificationCode,
  forgotPassword,
  resetPassword,
} from "./auth.service.js";
import {
  setAuthCookies,
  clearAuthCookies,
  getRefreshTokenFromCookies,
} from "#src/lib/auth-cookies.js";
import { HttpErrorResponse } from "#src/plugins/error-handler.plugin.js";

export default async (fastify: FastifyInstance) => {
  fastify.post<{
    Body: FromSchema<typeof POST_LOGIN_ROUTE_SCHEMA.body>;
    Reply: {
      200: FromSchema<(typeof POST_LOGIN_ROUTE_SCHEMA.response)[200]>;
    };
  }>("/login", {
    schema: POST_LOGIN_ROUTE_SCHEMA,
    config: {
      rateLimit: {
        max: 5,
        timeWindow: "1 minute",
      },
    },
    handler: async (request, reply) => {
      const { email, password } = request.body;
      const result = await loginUser(email, password);
      setAuthCookies(reply, result.accessToken, result.refreshToken);
      return reply.status(200).send(result);
    },
  });

  fastify.post<{
    Body: FromSchema<typeof POST_SIGNUP_ROUTE_SCHEMA.body>;
    Reply: {
      201: FromSchema<(typeof POST_SIGNUP_ROUTE_SCHEMA.response)[201]>;
    };
  }>("/signup", {
    schema: POST_SIGNUP_ROUTE_SCHEMA,
    config: {
      rateLimit: {
        max: 5,
        timeWindow: "1 minute",
      },
    },
    handler: async (request, reply) => {
      const { email, password, firstName, lastName } = request.body;
      const result = await registerUser(email, password, firstName, lastName, {
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"],
      });
      setAuthCookies(reply, result.accessToken, result.refreshToken);
      return reply.status(201).send(result);
    },
  });

  fastify.post<{
    Body: FromSchema<typeof POST_REFRESH_ROUTE_SCHEMA.body>;
    Reply: {
      200: FromSchema<(typeof POST_REFRESH_ROUTE_SCHEMA.response)[200]>;
    };
  }>("/refresh", {
    schema: POST_REFRESH_ROUTE_SCHEMA,
    config: {
      rateLimit: {
        max: 10,
        timeWindow: "1 minute",
      },
    },
    handler: async (request, reply) => {
      // Support refresh token from body (legacy) or cookie
      const refreshToken =
        request.body.refreshToken ||
        getRefreshTokenFromCookies(request.headers.cookie);

      if (!refreshToken) {
        throw new HttpErrorResponse(
          "Refresh token is required",
          400,
          ERROR_CODES.INVALID_REFRESH_TOKEN,
        );
      }

      const result = await refreshAccessToken(refreshToken);
      setAuthCookies(reply, result.accessToken, result.refreshToken);
      return reply.status(200).send(result);
    },
  });

  fastify.post<{
    Body: FromSchema<typeof POST_LOGOUT_ROUTE_SCHEMA.body>;
    Reply: {
      200: FromSchema<(typeof POST_LOGOUT_ROUTE_SCHEMA.response)[200]>;
    };
  }>("/logout", {
    schema: POST_LOGOUT_ROUTE_SCHEMA,
    handler: async (request, reply) => {
      // Support refresh token from body (legacy) or cookie
      const refreshToken =
        request.body.refreshToken ||
        getRefreshTokenFromCookies(request.headers.cookie) ||
        "";
      await logoutUser(refreshToken);
      clearAuthCookies(reply);
      return reply.status(200).send({ message: "Logged out" });
    },
  });

  // --- Email verification (authenticated) ---

  fastify.post<{
    Body: FromSchema<typeof POST_VERIFY_EMAIL_ROUTE_SCHEMA.body>;
    Reply: {
      200: FromSchema<(typeof POST_VERIFY_EMAIL_ROUTE_SCHEMA.response)[200]>;
    };
  }>("/verify-email", {
    schema: POST_VERIFY_EMAIL_ROUTE_SCHEMA,
    preHandler: [fastify.authenticate],
    config: {
      rateLimit: {
        max: 5,
        timeWindow: "1 minute",
      },
    },
    handler: async (request) => {
      const { code } = request.body;
      return verifyEmail(request.user!.id, code);
    },
  });

  fastify.post<{
    Reply: {
      200: FromSchema<
        (typeof POST_RESEND_VERIFICATION_CODE_ROUTE_SCHEMA.response)[200]
      >;
    };
  }>("/resend-verification-code", {
    schema: POST_RESEND_VERIFICATION_CODE_ROUTE_SCHEMA,
    preHandler: [fastify.authenticate],
    config: {
      rateLimit: {
        max: 3,
        timeWindow: "10 minutes",
      },
    },
    handler: async (request) => {
      return resendVerificationCode(request.user!.id);
    },
  });

  // --- Password reset (public) ---

  fastify.post<{
    Body: FromSchema<typeof POST_FORGOT_PASSWORD_ROUTE_SCHEMA.body>;
    Reply: {
      200: FromSchema<(typeof POST_FORGOT_PASSWORD_ROUTE_SCHEMA.response)[200]>;
    };
  }>("/forgot-password", {
    schema: POST_FORGOT_PASSWORD_ROUTE_SCHEMA,
    config: {
      rateLimit: {
        max: 5,
        timeWindow: "1 minute",
      },
    },
    handler: async (request) => {
      const { email } = request.body;
      await forgotPassword(email);
      return {
        message:
          "Se l'indirizzo è associato a un account, riceverai un codice via email.",
      };
    },
  });

  fastify.post<{
    Body: FromSchema<typeof POST_RESET_PASSWORD_ROUTE_SCHEMA.body>;
    Reply: {
      200: FromSchema<(typeof POST_RESET_PASSWORD_ROUTE_SCHEMA.response)[200]>;
    };
  }>("/reset-password", {
    schema: POST_RESET_PASSWORD_ROUTE_SCHEMA,
    config: {
      rateLimit: {
        max: 5,
        timeWindow: "1 minute",
      },
    },
    handler: async (request) => {
      const { email, code, newPassword } = request.body;
      await resetPassword(email, code, newPassword);
      return { message: "Password aggiornata con successo." };
    },
  });
};
