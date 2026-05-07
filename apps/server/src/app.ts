import fastify from "fastify";

import { ENVIRONMENT_VARIABLES, isDev } from "#src/constants/env.constants.js";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import { authGuardPlugin } from "./plugins/auth-guard.plugin.js";
import { dbPlugin } from "./plugins/db.plugin.js";
import { errorHandlerPlugin } from "./plugins/error-handler.plugin.js";
import { healthCheckPlugin } from "./plugins/health.plugin.js";
import { rateLimitPlugin } from "./plugins/rate-limit.plugin.js";
import { realtimePlugin } from "./plugins/realtime/realtime.plugin.js";
import accountModule from "./routes/account/account.module.js";
import authModule from "./routes/auth/auth.module.js";
import consentModule from "./routes/consent/consent.module.js";
import legalModule from "./routes/legal/legal.module.js";
import notificationModule from "./routes/notifications/notification.module.js";
import profileModule from "./routes/profile/profile.module.js";
import realtimeModule from "./routes/realtime/realtime.module.js";
import { registerAuditHook } from "./services/audit-log.service.js";

export const buildApp = async () => {
  const app = fastify({
    trustProxy: true,
  });

  await app.register(helmet, {
    contentSecurityPolicy: isDev ? false : undefined,
  });

  const allowedOrigins = ENVIRONMENT_VARIABLES.ALLOWED_ORIGINS
    ? ENVIRONMENT_VARIABLES.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : [];

  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true);
        return;
      }
      cb(new Error("Not allowed by CORS"), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  });

  await app.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  if (isDev) {
    await app.register(fastifySwagger, {});
    await app.register(fastifySwaggerUI, {
      routePrefix: "/swagger",
      uiConfig: { docExpansion: "full", deepLinking: false },
      staticCSP: true,
    });
  }

  await app.register(errorHandlerPlugin);
  await app.register(dbPlugin);
  await app.register(rateLimitPlugin);
  await app.register(authGuardPlugin);
  await app.register(realtimePlugin);
  registerAuditHook(app);

  app.register(healthCheckPlugin);
  app.register(authModule, { prefix: "/auth" });
  app.register(notificationModule, { prefix: "/notifications" });
  app.register(profileModule, { prefix: "/profile" });
  app.register(consentModule, { prefix: "/consent" });
  app.register(legalModule, { prefix: "/legal" });
  app.register(accountModule, { prefix: "/account" });
  app.register(realtimeModule, { prefix: "/realtime" });

  await app.ready();
  if (isDev) app.swagger();

  return app;
};
