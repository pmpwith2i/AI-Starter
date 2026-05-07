import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time string equality. Never throws on malformed input; non-strings
 * return false. Compares UTF-8 byte sequences so multi-byte characters don't
 * falsely collide with same-character-length ASCII strings.
 */
export const timingSafeEquals = (a: unknown, b: unknown): boolean => {
  if (typeof a !== "string" || typeof b !== "string") return false;

  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");

  // Comparing buffers of different lengths with timingSafeEqual throws.
  // We still do a constant-time-ish pass over one of the buffers to avoid a
  // short-circuit on length, then return false.
  if (ab.length !== bb.length) {
    // Burn roughly equivalent time so a caller can't distinguish length mismatch
    // from a content mismatch via wall-clock timing. A reference compare against
    // itself is enough; the attacker never sees the result.
    timingSafeEqual(ab, ab);
    return false;
  }

  return timingSafeEqual(ab, bb);
};
