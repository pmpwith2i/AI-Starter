// Canonical node:test pattern for backend services.
//   1. mock.module() declared BEFORE the dynamic import
//   2. Import the module under test via `await import(...)` AFTER mocks
//   3. Use node:assert/strict
//
// Run: pnpm --filter @repo/server test
// Runner flag: --import=tsx/esm --experimental-test-module-mocks --conditions=development

import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

const findFirst = mock.fn(async () => null);
const create = mock.fn(async (args: { data: Record<string, unknown> }) => ({
  id: "cuid_1",
  title: args.data.title,
  encryptedNotes: args.data.encryptedNotes ?? null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
}));

mock.module("@repo/db", {
  namedExports: {
    getPrismaClient: () => ({ example: { findFirst, create } }),
  },
});

mock.module("@repo/crypto", {
  namedExports: {
    encrypt: (s: string) => `enc:${s}`,
    decrypt: (s: string) => s.replace(/^enc:/, ""),
  },
});

mock.module("../../services/retention-windows.js", {
  namedExports: {
    resolveRetentionExpiry: () => new Date("2030-01-01T00:00:00.000Z"),
  },
});

const { createExample, getExample, ExampleNotFoundError } = await import(
  "./example.service.js"
);

describe("createExample", () => {
  it("returns the SDK shape directly with cleartext notes", async () => {
    const result = await createExample("user_1", { title: "x", notes: "secret" });
    assert.equal(result.title, "x");
    assert.equal(result.notes, "secret");
    assert.equal(result.createdAt, "2026-01-01T00:00:00.000Z");
  });

  it("encrypts notes at the boundary", async () => {
    await createExample("user_1", { title: "x", notes: "secret" });
    const lastCallArgs = create.mock.calls.at(-1)!.arguments[0];
    assert.equal(lastCallArgs.data.encryptedNotes, "enc:secret");
  });
});

describe("getExample", () => {
  it("throws ExampleNotFoundError when row missing", async () => {
    await assert.rejects(
      () => getExample("user_1", "nope"),
      (err: unknown) => err instanceof ExampleNotFoundError,
    );
  });
});
