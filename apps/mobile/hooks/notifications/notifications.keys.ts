export const notificationsKeys = {
  all: ["notifications"] as const,
  unreadCount: () => [...notificationsKeys.all, "unreadCount"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...notificationsKeys.all, "list", filters ?? {}] as const,
};
