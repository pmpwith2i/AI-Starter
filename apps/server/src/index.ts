import { buildApp } from "#src/app.js";
import { ENVIRONMENT_VARIABLES } from "#src/constants/env.constants.js";
import { logger } from "#src/logger.js";
import { prismaConnect, prismaDisconnect } from "@repo/db";
import closeWithGrace from "close-with-grace";
import { startTicketGc, stopTicketGc } from "#src/services/realtime-ticket.js";
import {
  startRetentionCleanup,
  stopRetentionCleanup,
} from "#src/services/retention-cleanup.js";

async function main(): Promise<void> {
  await prismaConnect(ENVIRONMENT_VARIABLES.DATABASE_URL, {
    info: (msg: string) => logger.info(msg),
    debug: (msg: string) => logger.debug(msg),
  });

  const fastify = await buildApp();
  await fastify.listen({
    port: ENVIRONMENT_VARIABLES.SERVER_PORT,
    host: ENVIRONMENT_VARIABLES.HOST,
  });
  logger.info(fastify.printRoutes());

  startRetentionCleanup();
  startTicketGc();

  closeWithGrace(async ({ signal, err }) => {
    if (err) {
      logger.error(err, "Shutting down due to error");
    } else {
      logger.info({ signal }, "Shutting down gracefully");
    }
    stopRetentionCleanup();
    stopTicketGc();
    await fastify.close();
    await prismaDisconnect();
  });
}

main().catch((err) => {
  logger.error(err, "Failed to start server");
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error({ reason, promise }, "Unhandled promise rejection");
});

process.on("uncaughtException", (err) => {
  logger.error(err, "Uncaught exception");
  process.exit(1);
});
