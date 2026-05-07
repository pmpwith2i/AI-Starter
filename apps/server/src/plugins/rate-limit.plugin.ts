import rateLimit from "@fastify/rate-limit";
import fp from "fastify-plugin";

export const rateLimitPlugin = fp(async (fastify) => {
  await fastify.register(rateLimit, {
    global: false,
    max: 5,
    timeWindow: "1 minute",
  });
});
