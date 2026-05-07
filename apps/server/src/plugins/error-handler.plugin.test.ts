import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import Fastify, { type FastifyInstance } from "fastify";
import {
  errorHandlerPlugin,
  HttpErrorResponse,
} from "./error-handler.plugin.js";

const buildTestApp = async (): Promise<FastifyInstance> => {
  const app = Fastify({ logger: false });
  await app.register(errorHandlerPlugin);

  app.get("/http-error", async () => {
    throw new HttpErrorResponse("Not found", 404, "RESOURCE_NOT_FOUND");
  });

  app.get("/unhandled", async () => {
    throw new Error("something broke");
  });

  app.post(
    "/validated",
    {
      schema: {
        body: {
          type: "object",
          required: ["name"],
          properties: { name: { type: "string" } },
        },
      },
    },
    async (request) => request.body,
  );

  await app.ready();
  return app;
};

describe("errorHandlerPlugin", () => {
  let app: FastifyInstance;

  before(async () => {
    app = await buildTestApp();
  });

  after(async () => {
    await app.close();
  });

  it("returns structured response for HttpErrorResponse", async () => {
    const res = await app.inject({ method: "GET", url: "/http-error" });

    assert.equal(res.statusCode, 404);
    const body = JSON.parse(res.payload) as {
      status: string;
      message: string;
      code: string;
    };
    assert.equal(body.status, "error");
    assert.equal(body.message, "Not found");
    assert.equal(body.code, "RESOURCE_NOT_FOUND");
  });

  it("returns VALIDATION_ERROR for schema validation failures", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/validated",
      payload: {},
    });

    assert.equal(res.statusCode, 400);
    const body = JSON.parse(res.payload) as {
      status: string;
      code: string;
    };
    assert.equal(body.status, "error");
    assert.equal(body.code, "VALIDATION_ERROR");
  });

  it("does not leak validation schema internals", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/validated",
      payload: {},
    });

    const body = JSON.parse(res.payload) as Record<string, unknown>;
    assert.equal(body.schema, undefined, "schema should not be in response");
  });

  it("returns 500 with generic message for unhandled errors", async () => {
    const res = await app.inject({ method: "GET", url: "/unhandled" });

    assert.equal(res.statusCode, 500);
    const body = JSON.parse(res.payload) as {
      status: string;
      message: string;
    };
    assert.equal(body.status, "error");
    assert.equal(
      body.message,
      "An unexpected error occurred. Please try again later.",
    );
  });
});
