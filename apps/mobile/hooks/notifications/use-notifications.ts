import { useQuery } from "@tanstack/react-query";

import { sdk } from "../../lib/api/client";
import { notificationsKeys } from "./notifications.keys";

/**
 * Bell-badge unread count. Realtime-driven: the global `notification:user:*`
 * subscription in `app/(app)/_layout.tsx` invalidates `notificationsKeys.all`
 * on every WS event, which covers this query (`notificationsKeys.unreadCount`
 * is nested under `notificationsKeys.all`). No polling needed.
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationsKeys.unreadCount(),
    queryFn: () => sdk.notifications.unreadCount(),
  });
}

export function useNotifications(query?: Parameters<typeof sdk.notifications.list>[0]) {
  return useQuery({
    queryKey: notificationsKeys.list(query as Record<string, unknown> | undefined),
    queryFn: () => sdk.notifications.list(query),
  });
}
