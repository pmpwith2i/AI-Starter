import { randomBytes } from "node:crypto";

/**
 * Short-lived one-time WebSocket tickets.
 *
 * Replaces the previous design where the browser passed a long-lived JWT as
 * `?token=…` on the WebSocket URL (landed in ALB / CloudWatch access logs).
 * A ticket is opaque, single-use, and expires in 30 seconds.
 *
 * In-memory only: acceptable for MVP since the WebSocket handshake and the
 * ticket issuance both hit the same process in single-task deployments. When
 * horizontal scaling is enabled this module should be backed by a shared
 * store (Redis / DB).
 */

interface Entry {
  userId: string;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 30_000;

const store = new Map<string, Entry>();

const makeTicket = (): string => randomBytes(32).toString("base64url");

export interface IssueOptions {
  ttlMs?: number;
  now?: number;
}

/** Returns a fresh one-time ticket bound to `userId`. */
export const issueTicket = (userId: string, opts?: IssueOptions): string => {
  const ttl = opts?.ttlMs ?? DEFAULT_TTL_MS;
  const now = opts?.now ?? Date.now();
  const ticket = makeTicket();
  store.set(ticket, { userId, expiresAt: now + ttl });
  return ticket;
};

export interface ConsumeOptions {
  now?: number;
}

/**
 * Consume a ticket. Returns the associated `userId` on success, or `null` if
 * the ticket is unknown, already consumed, or expired.
 */
export const consumeTicket = (
  ticket: string,
  opts?: ConsumeOptions,
): string | null => {
  const now = opts?.now ?? Date.now();
  const entry = store.get(ticket);
  if (!entry) return null;
  store.delete(ticket);
  if (entry.expiresAt < now) return null;
  return entry.userId;
};

/** Test-only: wipe the store between cases. */
export const _resetTicketStoreForTests = (): void => {
  store.clear();
};

/**
 * Periodic GC for tickets that were issued but never consumed (user navigated
 * away, network dropped before WS upgrade, etc.). Without this, `store` is a
 * monotonically growing Map — a slow but real memory leak in long-lived
 * processes. Runs every minute; a 30-second TTL means at most one minute of
 * stale entries lingers, which is acceptable for an in-memory cache.
 *
 * Safe to call multiple times — `startTicketGc` re-uses the same handle and
 * `stopTicketGc` is a no-op when nothing is scheduled.
 */
const GC_INTERVAL_MS = 60_000;
let gcHandle: NodeJS.Timeout | null = null;

const sweepExpired = (now: number = Date.now()): number => {
  let purged = 0;
  for (const [ticket, entry] of store.entries()) {
    if (entry.expiresAt < now) {
      store.delete(ticket);
      purged++;
    }
  }
  return purged;
};

export const startTicketGc = (): void => {
  if (gcHandle) return;
  gcHandle = setInterval(() => {
    sweepExpired();
  }, GC_INTERVAL_MS);
  // Don't keep the event loop alive just for the GC — the server's lifecycle
  // owns shutdown via `stopTicketGc`.
  if (typeof gcHandle.unref === "function") gcHandle.unref();
};

export const stopTicketGc = (): void => {
  if (gcHandle) {
    clearInterval(gcHandle);
    gcHandle = null;
  }
};

/** Test-only entry point so unit tests can drive GC deterministically. */
export const _sweepExpiredTicketsForTests = (now?: number): number =>
  sweepExpired(now);
