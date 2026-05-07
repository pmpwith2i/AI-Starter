/**
 * Tiny event bus that lets the (singleton) QueryClient hand control to the
 * AuthProvider on session-related events without circular imports.
 *
 * AuthProvider registers two handlers on mount:
 *   - `refreshHandler`   → called on the first 401, attempts the refresh-token
 *                          flow. Returns `true` if new tokens were stored.
 *   - `sessionExpiredHandler` → called when refresh fails (or no refresh is
 *                          possible). Clears tokens, clears TQ cache, flips
 *                          state to "anonymous" so layouts redirect to
 *                          /welcome.
 *
 * `tryRefresh` is single-flight: simultaneous 401s share the same refresh
 * request. After resolution the promise slot is freed so subsequent failures
 * trigger a fresh attempt.
 */

let refreshHandler: (() => Promise<boolean>) | null = null;
let sessionExpiredHandler: (() => Promise<void>) | null = null;
let inflightRefresh: Promise<boolean> | null = null;

export function setRefreshHandler(
  handler: (() => Promise<boolean>) | null,
): void {
  refreshHandler = handler;
}

export function setSessionExpiredHandler(
  handler: (() => Promise<void>) | null,
): void {
  sessionExpiredHandler = handler;
}

export async function tryRefresh(): Promise<boolean> {
  if (!refreshHandler) return false;
  if (!inflightRefresh) {
    inflightRefresh = refreshHandler().finally(() => {
      inflightRefresh = null;
    });
  }
  return inflightRefresh;
}

export async function notifySessionExpired(): Promise<void> {
  if (sessionExpiredHandler) {
    await sessionExpiredHandler();
  }
}
