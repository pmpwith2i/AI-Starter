import { getPrismaClient, type PrismaClient } from "@repo/db";
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyInstance {
    db: PrismaClient;
  }
}

export const dbPlugin = fp(async (fastify) => {
  const prisma = getPrismaClient();
  fastify.decorate("db", prisma);
});
