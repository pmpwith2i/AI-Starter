import { describe, it, before, after, mock } from "node:test";
import assert from "node:assert/strict";
import Fastify, { type FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import { errorHandlerPlugin } from "./error-handler.plugin.js";

// ─── Module mocks ──────────────────────────────────────────────────────────────

const TEST_SECRET = "test-jwt-secret";
const TEST_ISSUER = "oncologo-patient";
const TEST_AUDIENCE = "oncologo-patient";

mock.module("../constants/env.constants.js", {
  namedExports: {
    ENVIRONMENT_VARIABLES: {
      JWT_SECRET_KEY: TEST_SECRET,
      LOG_LEVEL: "silent",
      NODE_ENV: "test",
    },
    isDev: false,
  },
});

// The auth-guard imports `#src/lib/cache.js` to wrap `lookupActiveUser` via
// `cache.wrap(...)`. In tests we mock the cache to a pass-through: `wrap`
// returns the origin function untouched, so each call goes straight to the
// mocked `findUnique` below. The real cache pulls in Pino + config which
// aren't wanted inside a unit test.
mock.module("../lib/cache.js", {
  namedExports: {
    cache: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      wrap: (origin: any) => origin,
      invalidateTags: async () => 0,
      backend: {},
    },
    invalidateUserCache: async () => 0,
    userTag: (id: string) => `user:${id}`,
  },
});

// Per-test override: tests that need a non-default tokenVersion reassign
// `currentUser` before calling inject().
let currentUser: {
  id: string;
  deletedAt: Date | null;
  tokenVersion: number;
} = {
  id: "user-1",
  deletedAt: null,
  tokenVersion: 0,
};

mock.module("@repo/db", {
  namedExports: {
    getPrismaClient: () => ({
      user: {
        findUnique: async () => currentUser,
      },
    }),
  },
});

// ─── Import after mocks ────────────────────────────────────────────────────────

const { authGuardPlugin } = await import("./auth-guard.plugin.js");

// ─── Helpers ────────────────────────────────────────────────────────────────────

const buildTestApp = async (): Promise<FastifyInstance> => {
  const app = Fastify({ logger: false });
  await app.register(errorHandlerPlugin);
  await app.register(authGuardPlugin);

  app.get("/protected", { onRequest: [app.authenticate] }, async (request) => ({
    userId: request.user?.id,
  }));

  await app.ready();
  return app;
};

// ─── Tests ──────────────────────────────────────────────────────────────────────

describe("authGuardPlugin", () => {
  let app: FastifyInstance;

  before(async () => {
    app = await buildTestApp();
  });

  after(async () => {
    await app.close();
  });

  it("returns 401 without Authorization header", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/protected",
    });

    assert.equal(res.statusCode, 401);
    const body = JSON.parse(res.payload) as { code: string };
    assert.equal(body.code, "UNAUTHORIZED");
  });

  it("returns 401 with invalid token", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/protected",
      headers: { authorization: "Bearer invalid.token.here" },
    });

    assert.equal(res.statusCode, 401);
    const body = JSON.parse(res.payload) as { code: string };
    assert.equal(body.code, "UNAUTHORIZED");
  });

  it("returns 401 with expired token", async () => {
    const token = jwt.sign({ sub: "user-1", tokenVersion: 0 }, TEST_SECRET, {
      expiresIn: "-1s",
      issuer: TEST_ISSUER,
      audience: TEST_AUDIENCE,
    });

    const res = await app.inject({
      method: "GET",
      url: "/protected",
      headers: { authorization: `Bearer ${token}` },
    });

    assert.equal(res.statusCode, 401);
    const body = JSON.parse(res.payload) as { code: string };
    assert.equal(body.code, "UNAUTHORIZED");
  });

  it("returns 401 with wrong secret", async () => {
    const token = jwt.sign({ sub: "user-1" }, "wrong-secret", {
      expiresIn: "1h",
      issuer: TEST_ISSUER,
      audience: TEST_AUDIENCE,
    });

    const res = await app.inject({
      method: "GET",
      url: "/protected",
      headers: { authorization: `Bearer ${token}` },
    });

    assert.equal(res.statusCode, 401);
  });

  it("returns 401 with token signed with mismatched issuer", async () => {
    const token = jwt.sign({ sub: "user-1", tokenVersion: 0 }, TEST_SECRET, {
      expiresIn: "1h",
      issuer: "oncologo-pro",
      audience: TEST_AUDIENCE,
    });

    const res = await app.inject({
      method: "GET",
      url: "/protected",
      headers: { authorization: `Bearer ${token}` },
    });

    assert.equal(res.statusCode, 401);
  });

  it("returns 401 with token signed with mismatched audience", async () => {
    const token = jwt.sign({ sub: "user-1", tokenVersion: 0 }, TEST_SECRET, {
      expiresIn: "1h",
      issuer: TEST_ISSUER,
      audience: "some-other-app",
    });

    const res = await app.inject({
      method: "GET",
      url: "/protected",
      headers: { authorization: `Bearer ${token}` },
    });

    assert.equal(res.statusCode, 401);
  });

  it("returns 200 with valid token and sets request.user.id", async () => {
    currentUser = { id: "user-1", deletedAt: null, tokenVersion: 0 };
    const token = jwt.sign({ sub: "user-1", tokenVersion: 0 }, TEST_SECRET, {
      expiresIn: "1h",
      issuer: TEST_ISSUER,
      audience: TEST_AUDIENCE,
    });

    const res = await app.inject({
      method: "GET",
      url: "/protected",
      headers: { authorization: `Bearer ${token}` },
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload) as { userId: string };
    assert.equal(body.userId, "user-1");
  });

  it("returns 401 when token tokenVersion is stale (user's current version is higher)", async () => {
    // Simulate post-resetPassword state: DB bumped to 1, token still carries 0.
    currentUser = { id: "user-1", deletedAt: null, tokenVersion: 1 };
    const token = jwt.sign({ sub: "user-1", tokenVersion: 0 }, TEST_SECRET, {
      expiresIn: "1h",
      issuer: TEST_ISSUER,
      audience: TEST_AUDIENCE,
    });

    const res = await app.inject({
      method: "GET",
      url: "/protected",
      headers: { authorization: `Bearer ${token}` },
    });

    assert.equal(res.statusCode, 401);
    const body = JSON.parse(res.payload) as { code: string };
    assert.equal(body.code, "UNAUTHORIZED");
  });

  it("returns 401 when token is missing the tokenVersion claim", async () => {
    currentUser = { id: "user-1", deletedAt: null, tokenVersion: 0 };
    const token = jwt.sign({ sub: "user-1" }, TEST_SECRET, {
      expiresIn: "1h",
      issuer: TEST_ISSUER,
      audience: TEST_AUDIENCE,
    });

    const res = await app.inject({
      method: "GET",
      url: "/protected",
      headers: { authorization: `Bearer ${token}` },
    });

    assert.equal(res.statusCode, 401);
    const body = JSON.parse(res.payload) as { code: string };
    assert.equal(body.code, "UNAUTHORIZED");
  });
});
