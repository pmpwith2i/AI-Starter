import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { timingSafeEquals } from "./timing-safe.js";

describe("@repo/crypto — timingSafeEquals", () => {
  it("returns true for identical ASCII strings", () => {
    assert.equal(timingSafeEquals("supersecret", "supersecret"), true);
  });

  it("returns true for identical UTF-8 strings with accents", () => {
    assert.equal(timingSafeEquals("paßwörd🔑", "paßwörd🔑"), true);
  });

  it("returns true for two empty strings", () => {
    assert.equal(timingSafeEquals("", ""), true);
  });

  it("returns false for strings that differ in one character", () => {
    assert.equal(timingSafeEquals("supersecret", "supersecrex"), false);
  });

  it("returns false for strings of different lengths", () => {
    assert.equal(timingSafeEquals("short", "shortish"), false);
  });

  it("returns false when one side is empty", () => {
    assert.equal(timingSafeEquals("", "notempty"), false);
    assert.equal(timingSafeEquals("notempty", ""), false);
  });

  it("treats non-string inputs as non-equal, never throws", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assert.equal(timingSafeEquals(undefined as any, "x"), false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assert.equal(timingSafeEquals("x", null as any), false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assert.equal(timingSafeEquals(null as any, undefined as any), false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assert.equal(timingSafeEquals(123 as any, 123 as any), false);
  });

  it("distinguishes strings whose byte lengths collide with character lengths (multi-byte safety)", () => {
    // "café" has 4 characters but 5 bytes in UTF-8 (é = 2 bytes).
    // A buggy implementation could compare bytes of different lengths.
    assert.equal(timingSafeEquals("café", "cafe"), false);
  });
});
