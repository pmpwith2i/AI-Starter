import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts a UTF-8 plaintext string using AES-256-GCM.
 * Returns a base64 string containing: IV (12 bytes) + authTag (16 bytes) + ciphertext.
 * Each call produces a unique ciphertext due to random IV.
 */
export function encrypt(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/**
 * Decrypts a base64 ciphertext produced by `encrypt()`.
 * Throws if the ciphertext is tampered with or the key is wrong.
 */
export function decrypt(ciphertext: string, key: Buffer): string {
  const data = Buffer.from(ciphertext, "base64");
  if (data.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Invalid ciphertext: too short");
  }
  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8",
  );
}

/**
 * Encrypts a JSON-serializable value. Returns base64 ciphertext.
 */
export function encryptJson(value: unknown, key: Buffer): string {
  return encrypt(JSON.stringify(value), key);
}

/**
 * Decrypts a ciphertext and parses the result as JSON.
 */
export function decryptJson<T = unknown>(ciphertext: string, key: Buffer): T {
  return JSON.parse(decrypt(ciphertext, key)) as T;
}
