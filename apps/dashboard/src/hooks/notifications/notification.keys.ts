import type { NotificationsQuery } from "@repo/server-sdk";

export const notificationKeys = {
  all: ["notifications"],
  lists: () => [...notificationKeys.all, "list"],
  list: (query?: NotificationsQuery) => [
    ...notificationKeys.lists(),
    query ?? {},
  ],
  unreadCount: () => [...notificationKeys.all, "unread-count"],
};
