import { describe, it, mock, before, after } from "node:test";
import assert from "node:assert/strict";
import Fastify, { type FastifyInstance } from "fastify";

// ─── Module mocks ──────────────────────────────────────────────────────────────

let mockPrismaQueryThrows = false;

mock.module("@repo/db", {
  namedExports: {
    getPrismaClient: () => ({
      $queryRaw: async () => {
        if (mockPrismaQueryThrows) throw new Error("connection refused");
        return [{ "?column?": 1 }];
      },
    }),
  },
});

// ─── Import module under test ────────────────────────────────────────────────

const { dbPlugin } = await import("./db.plugin.js");
const { healthCheckPlugin } = await import("./health.plugin.js");

const buildTestApp = async (): Promise<FastifyInstance> => {
  const app = Fastify({ logger: false });
  await app.register(dbPlugin);
  await app.register(healthCheckPlugin);
  await app.ready();
  return app;
};

describe("GET /health", () => {
  let app: FastifyInstance;

  before(async () => {
    app = await buildTestApp();
  });

  after(async () => {
    await app.close();
  });

  it("returns 200 when all systems are healthy", async () => {
    mockPrismaQueryThrows = false;

    const res = await app.inject({ method: "GET", url: "/health" });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload) as {
      status: string;
      checks: { postgres: string };
    };
    assert.equal(body.status, "ok");
    assert.equal(body.checks.postgres, "ok");
  });

  it("returns 503 when PostgreSQL is down", async () => {
    mockPrismaQueryThrows = true;

    const res = await app.inject({ method: "GET", url: "/health" });

    assert.equal(res.statusCode, 503);
    const body = JSON.parse(res.payload) as {
      status: string;
      checks: { postgres: string };
    };
    assert.equal(body.status, "degraded");
    assert.equal(body.checks.postgres, "down");
  });
});
