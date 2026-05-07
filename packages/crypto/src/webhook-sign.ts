import { createHmac } from "node:crypto";
import { timingSafeEquals } from "./timing-safe.js";

/** Maximum clock skew between sender and receiver (seconds). */
const DEFAULT_SKEW_SECONDS = 5 * 60;

const SIGNATURE_PREFIX = "sha256=";

/**
 * Produce an HMAC-SHA256 signature over `${timestamp}.${body}`.
 * Timestamp is embedded so the receiver can reject replays beyond a skew
 * window without needing a nonce store.
 *
 * Output: `sha256=<hex>`.
 */
export const signWebhookBody = (
  secret: string,
  timestamp: number,
  body: string,
): string => {
  const hmac = createHmac("sha256", secret);
  hmac.update(`${timestamp}.${body}`);
  return `${SIGNATURE_PREFIX}${hmac.digest("hex")}`;
};

export interface VerifyWebhookOptions {
  /** Maximum allowed clock skew in seconds. Defaults to 5 minutes. */
  skewSeconds?: number;
  /** Override of `now` (seconds since epoch) — used by tests. */
  now?: number;
}

/**
 * Verify a webhook signature produced by `signWebhookBody`. Returns true when
 * (a) the prefix is present, (b) the timestamp is within the skew window, and
 * (c) the HMAC matches constant-time. Never throws.
 */
export const verifyWebhookSignature = (
  secret: string,
  timestamp: number,
  body: string,
  signature: string,
  options?: VerifyWebhookOptions,
): boolean => {
  if (typeof signature !== "string") return false;
  if (!signature.startsWith(SIGNATURE_PREFIX)) return false;

  const skew = options?.skewSeconds ?? DEFAULT_SKEW_SECONDS;
  const now = options?.now ?? Math.floor(Date.now() / 1000);

  if (Math.abs(now - timestamp) > skew) return false;

  const expected = signWebhookBody(secret, timestamp, body);
  return timingSafeEquals(expected, signature);
};
