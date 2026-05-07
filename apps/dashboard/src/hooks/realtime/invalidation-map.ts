import type { QueryClient } from "@tanstack/react-query";
import { notificationKeys } from "@/hooks/notifications/notification.keys";

/**
 * Maps realtime entity names (first segment of a topic) to TanStack Query keys
 * that should be invalidated when a change event arrives.
 *
 * Add entries here as new domain key files are created.
 */
const ENTITY_KEY_MAP: Record<string, readonly unknown[][]> = {
  notifications: [notificationKeys.all],
  consent: [["consent"]],
};

export const invalidateByEntity = (
  queryClient: QueryClient,
  entity: string,
): void => {
  const keys = ENTITY_KEY_MAP[entity];
  if (!keys) return;
  for (const key of keys) {
    void queryClient.invalidateQueries({ queryKey: key as unknown[] });
  }
};
