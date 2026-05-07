import { createHash } from "node:crypto";

/**
 * GDPR-friendly IP hashing for audit + consent logs.
 *
 * Produces a 16-char SHA-256 prefix — enough entropy to distinguish events
 * from different sources without exposing the raw IP address (Art. 32).
 * Returns `null` when the input is missing, empty, or not a string. Never
 * throws.
 */
export const hashIp = (ip: string | null | undefined): string | null => {
  if (typeof ip !== "string") return null;
  const trimmed = ip.trim();
  if (trimmed.length === 0) return null;
  return createHash("sha256").update(trimmed).digest("hex").slice(0, 16);
};
