import { ApiError } from "@repo/server-sdk";
import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

import { notifySessionExpired, tryRefresh } from "../auth/session-events";

/**
 * On 401: try the refresh-token flow once. If it succeeds we invalidate the
 * failing query so it retries with the fresh token; if it fails we hand
 * control to the AuthProvider which clears state → layouts redirect to login.
 */
async function handle401(queryKey?: unknown[]): Promise<void> {
  const refreshed = await tryRefresh();
  if (refreshed) {
    if (queryKey) {
      void queryClient.invalidateQueries({ queryKey });
    } else {
      void queryClient.invalidateQueries();
    }
    return;
  }
  await notifySessionExpired();
}

const isUnauthorized = (error: unknown): boolean =>
  error instanceof ApiError && error.statusCode === 401;

/**
 * Singleton TanStack Query client for the mobile app.
 *
 * Defaults aim at "fresh enough without thrashing" UX on a phone:
 * - 30s `staleTime` so widgets don't refetch on every screen focus
 * - 5min cache retention so navigating away and back is instant
 * - retry skipped for 4xx (client errors are deterministic) but does 2 retries
 *   for 5xx / network blips
 *
 * Auth context calls `queryClient.clear()` on logout (or on session-expired)
 * to drop any user-scoped payload from memory before the next user signs in.
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (isUnauthorized(error)) {
        void handle401(query.queryKey as unknown[]);
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (isUnauthorized(error)) {
        void handle401();
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError) {
          if (error.statusCode >= 400 && error.statusCode < 500) return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
