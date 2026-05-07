import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  clearKeyCache,
  generateKey,
  getEncryptionKey,
} from "./key-provider.js";

describe("@repo/crypto — key-provider", () => {
  const originalKey = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    clearKeyCache();
  });

  afterEach(() => {
    clearKeyCache();
    if (originalKey) {
      process.env.ENCRYPTION_KEY = originalKey;
    } else {
      delete process.env.ENCRYPTION_KEY;
    }
  });

  describe("getEncryptionKey", () => {
    it("throws when ENCRYPTION_KEY is not set", () => {
      delete process.env.ENCRYPTION_KEY;
      assert.throws(() => getEncryptionKey(), /ENCRYPTION_KEY/);
    });

    it("throws when ENCRYPTION_KEY is not valid hex", () => {
      process.env.ENCRYPTION_KEY = "not-hex";
      assert.throws(() => getEncryptionKey(), /64-character hex/);
    });

    it("throws when ENCRYPTION_KEY is the wrong length", () => {
      process.env.ENCRYPTION_KEY = "abcd".repeat(10); // 40 chars, not 64
      assert.throws(() => getEncryptionKey(), /64-character hex/);
    });

    it("returns a 32-byte Buffer when ENCRYPTION_KEY is valid", () => {
      process.env.ENCRYPTION_KEY = "a".repeat(64);
      const key = getEncryptionKey();
      assert.equal(key.length, 32);
    });

    it("caches the key across calls", () => {
      process.env.ENCRYPTION_KEY = "a".repeat(64);
      const key1 = getEncryptionKey();
      // Mutate the env var — cached key should still be returned
      process.env.ENCRYPTION_KEY = "b".repeat(64);
      const key2 = getEncryptionKey();
      assert.deepEqual(key1, key2);
    });
  });

  describe("generateKey", () => {
    it("returns a 64-character hex string", () => {
      const key = generateKey();
      assert.equal(key.length, 64);
      assert.match(key, /^[0-9a-f]{64}$/);
    });

    it("produces a different key on each call", () => {
      const a = generateKey();
      const b = generateKey();
      assert.notEqual(a, b);
    });
  });
});
