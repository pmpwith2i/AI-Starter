import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { encrypt, decrypt, encryptJson, decryptJson } from "./cipher.js";

const makeKey = () => randomBytes(32);

describe("@repo/crypto — cipher", () => {
  describe("encrypt / decrypt round-trip", () => {
    it("round-trips simple ASCII strings", () => {
      const key = makeKey();
      const plaintext = "Hello, world!";
      const ct = encrypt(plaintext, key);
      assert.equal(decrypt(ct, key), plaintext);
    });

    it("round-trips UTF-8 strings with accents and emoji", () => {
      const key = makeKey();
      const plaintext = "Paziente — con allergia al glutine 🥐";
      const ct = encrypt(plaintext, key);
      assert.equal(decrypt(ct, key), plaintext);
    });

    it("round-trips the empty string", () => {
      const key = makeKey();
      const ct = encrypt("", key);
      assert.equal(decrypt(ct, key), "");
    });

    it("round-trips long strings (>1KB)", () => {
      const key = makeKey();
      const plaintext = "A".repeat(2048);
      const ct = encrypt(plaintext, key);
      assert.equal(decrypt(ct, key), plaintext);
    });
  });

  describe("IV uniqueness", () => {
    it("produces different ciphertexts for the same plaintext (random IV)", () => {
      const key = makeKey();
      const plaintext = "same input";
      const ct1 = encrypt(plaintext, key);
      const ct2 = encrypt(plaintext, key);
      assert.notEqual(
        ct1,
        ct2,
        "Two encryptions of the same input must differ",
      );
      // But both decrypt back to the same plaintext
      assert.equal(decrypt(ct1, key), plaintext);
      assert.equal(decrypt(ct2, key), plaintext);
    });
  });

  describe("tamper detection", () => {
    it("throws when the ciphertext byte stream is modified", () => {
      const key = makeKey();
      const ct = encrypt("secret", key);
      // Flip a byte in the middle
      const buf = Buffer.from(ct, "base64");
      buf[20] = (buf[20]! + 1) & 0xff;
      const tampered = buf.toString("base64");
      assert.throws(() => decrypt(tampered, key));
    });

    it("throws when a different key is used", () => {
      const key1 = makeKey();
      const key2 = makeKey();
      const ct = encrypt("secret", key1);
      assert.throws(() => decrypt(ct, key2));
    });

    it("throws on malformed base64 / too short ciphertext", () => {
      const key = makeKey();
      assert.throws(() => decrypt("abc", key));
    });
  });

  describe("encryptJson / decryptJson", () => {
    it("round-trips an object", () => {
      const key = makeKey();
      const obj = {
        diagnosis: "Carcinoma",
        therapy: null,
        doses: [1, 2, 3],
        notes: "",
      };
      const ct = encryptJson(obj, key);
      assert.deepEqual(decryptJson(ct, key), obj);
    });

    it("round-trips null", () => {
      const key = makeKey();
      const ct = encryptJson(null, key);
      assert.equal(decryptJson(ct, key), null);
    });

    it("round-trips arrays", () => {
      const key = makeKey();
      const arr = ["a", "b", { nested: true }];
      const ct = encryptJson(arr, key);
      assert.deepEqual(decryptJson(ct, key), arr);
    });
  });
});
