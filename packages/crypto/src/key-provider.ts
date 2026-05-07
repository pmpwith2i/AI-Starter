import { randomBytes } from "node:crypto";

const EXPECTED_KEY_LENGTH = 32;

let cachedKey: Buffer | null = null;

/**
 * Returns the AES-256 encryption key.
 * Reads from ENCRYPTION_KEY env var (hex-encoded 32-byte key).
 * Caches in memory after first call.
 *
 * In production, the env var should be populated from AWS Secrets Manager
 * before the application starts (e.g., via ECS task definition secrets).
 */
export function getEncryptionKey(): Buffer {
  if (cachedKey) {
    return cachedKey;
  }

  const hexKey = process.env["ENCRYPTION_KEY"];
  if (!hexKey) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is not set. " +
        "Set a 64-character hex string (32 bytes) for AES-256 encryption.",
    );
  }

  if (!/^[0-9a-fA-F]{64}$/.test(hexKey)) {
    throw new Error(
      "ENCRYPTION_KEY must be a 64-character hex string (32 bytes). " +
        `Got ${hexKey.length} characters.`,
    );
  }

  const key = Buffer.from(hexKey, "hex");
  if (key.length !== EXPECTED_KEY_LENGTH) {
    throw new Error(
      `ENCRYPTION_KEY decoded to ${key.length} bytes, expected ${EXPECTED_KEY_LENGTH}.`,
    );
  }

  cachedKey = key;
  return cachedKey;
}

/**
 * Clears the cached key. Useful for testing.
 */
export function clearKeyCache(): void {
  cachedKey = null;
}

/**
 * Generates a random 32-byte key and returns it as a hex string.
 * Useful for generating new keys for development/testing.
 */
export function generateKey(): string {
  return randomBytes(EXPECTED_KEY_LENGTH).toString("hex");
}
