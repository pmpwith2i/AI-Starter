import { createCache } from "@repo/cache";
import { logger } from "#src/logger.js";

/**
 * Process-wide cache singleton for the patient server.
 *
 * Wires the shared `@repo/cache` facade into the Pino logger so backend
 * failures (currently only the MemoryBackend — a no-op failure-wise — but
 * future Redis may throw) surface as structured `warn` log entries.
 *
 * Consumers should prefer `cache.wrap(...)` over instantiating `cacheFn`
 * directly so that every wrapped function shares the same backend, making
 * `cache.invalidateTags([...])` effective across all namespaces at once.
 *
 * When `REDIS_URL` becomes a real env var, construct the `RedisBackend`
 * here and swap `backend`. No call-site change required.
 */
export const cache = createCache({
  logger: {
    warn: (obj, msg) => logger.warn(obj, msg),
    debug: (obj, msg) => logger.debug(obj, msg),
  },
});

/** Stable tag for every user-scoped cache entry. Any namespace that caches
 * per-user data MUST declare `tags: (userId) => [userTag(userId)]` so a single
 * `invalidateUserCache(userId)` call wipes every trace of that user across
 * every namespace (consent, auth lookup, ...). */
export const userTag = (userId: string): string => `user:${userId}`;

/**
 * Drops every cached entry tagged with `user:${userId}` across every namespace
 * sharing the singleton `cache`. Callers: account deletion, consent mutations,
 * any flow that changes a user's identity/authorization state.
 */
export const invalidateUserCache = async (userId: string): Promise<number> =>
  cache.invalidateTags([userTag(userId)]);
