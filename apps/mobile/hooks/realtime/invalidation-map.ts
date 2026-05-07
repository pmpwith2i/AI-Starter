import type { QueryClient } from "@tanstack/react-query";

/**
 * Maps realtime entity names (the FIRST segment of a WS topic) to TanStack
 * Query keys to invalidate when an event arrives. Add an entry here as you
 * scaffold a new domain on mobile.
 */
const ENTITY_KEY_MAP: Record<string, readonly unknown[][]> = {
  notifications: [["notifications"]],
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
