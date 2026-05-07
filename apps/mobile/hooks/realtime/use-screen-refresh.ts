import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

/**
 * Pull-to-refresh helper that invalidates a list of broad domain keys.
 *
 * Why broad keys instead of `query.refetch()` per query? Two reasons:
 *
 * 1. **One source of truth.** The same domain keys drive realtime invalidation
 *    via `hooks/realtime/invalidation-map.ts`. Pull-to-refresh and WS-driven
 *    invalidation behave identically — neither needs to know about specific
 *    queries inside child widgets.
 *
 * 2. **Add-a-widget-without-touching-refresh.** The home screen has many
 *    self-contained widgets (TodayWidget, NextEventWidget, ...). With manual
 *    `refetch()` calls the parent must enumerate every widget's hook —
 *    they drift the moment a new widget lands. With this hook the parent
 *    declares the screen's domains and any new query under those keys is
 *    refreshed for free.
 *
 * Usage:
 * ```tsx
 * const { refreshing, onRefresh } = useScreenRefresh([
 *   notificationsKeys.all,
 *   nutritionKeys.all,
 *   eventsKeys.all,
 * ]);
 * <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} />
 * ```
 */
export function useScreenRefresh(domainKeys: readonly (readonly unknown[])[]): {
  refreshing: boolean;
  onRefresh: () => void;
} {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void Promise.all(
      domainKeys.map((key) =>
        queryClient.invalidateQueries({ queryKey: key }),
      ),
    ).finally(() => {
      setRefreshing(false);
    });
    // domainKeys is expected to be a stable reference (declared at module
    // scope or wrapped in useMemo by the caller). Invalidate-on-array-rebuild
    // is intentional — if the screen's domains change at runtime, treat that
    // as a new screen mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, domainKeys]);

  return { refreshing, onRefresh };
}
