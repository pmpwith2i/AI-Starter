import fp from "fastify-plugin";

export const healthCheckPlugin = fp(async (fastify) => {
  fastify.get(
    "/health",
    {
      schema: {
        description: "Health check endpoint",
        tags: ["Health"],
        response: {
          200: {
            description: "All systems operational",
            type: "object",
            additionalProperties: false,
            properties: {
              status: { type: "string", enum: ["ok"] },
              timestamp: { type: "string", format: "date-time" },
              checks: {
                type: "object",
                additionalProperties: false,
                properties: {
                  postgres: { type: "string" },
                },
                required: ["postgres"],
              },
            },
            required: ["status", "timestamp", "checks"],
          },
          503: {
            description: "One or more systems degraded",
            type: "object",
            additionalProperties: false,
            properties: {
              status: { type: "string", enum: ["degraded"] },
              timestamp: { type: "string", format: "date-time" },
              checks: {
                type: "object",
                additionalProperties: false,
                properties: {
                  postgres: { type: "string" },
                },
                required: ["postgres"],
              },
            },
            required: ["status", "timestamp", "checks"],
          },
        },
      },
    },
    async (_request, reply) => {
      const checks = {
        postgres: "down" as string,
      };

      try {
        await fastify.db.$queryRaw`SELECT 1`;
        checks.postgres = "ok";
      } catch {
        checks.postgres = "down";
      }
      const healthy = checks.postgres === "ok";

      return reply.status(healthy ? 200 : 503).send({
        status: healthy ? "ok" : "degraded",
        timestamp: new Date().toISOString(),
        checks,
      });
    },
  );
});
