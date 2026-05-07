import {
  queryOptions,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  NotificationsQuery,
  NotificationsResponse,
  NotificationCountResponse,
} from "@repo/server-sdk";
import { sdk, getAccessToken } from "@/lib/api/client";
import { handleMutationError } from "@/lib/api/mutation-error-handler";
import { notificationKeys } from "./notification.keys";

export const notificationsQueryOptions = (query?: NotificationsQuery) =>
  queryOptions<NotificationsResponse>({
    queryKey: notificationKeys.list(query),
    queryFn: () => sdk.notifications.list(query, getAccessToken() ?? undefined),
  });

export const unreadCountQueryOptions = () =>
  queryOptions<NotificationCountResponse>({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => sdk.notifications.unreadCount(getAccessToken() ?? undefined),
    refetchInterval: 30_000,
  });

export const useNotifications = (query?: NotificationsQuery) =>
  useQuery(notificationsQueryOptions(query));

export const useUnreadCount = () => useQuery(unreadCountQueryOptions());

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      sdk.notifications.markRead(id, getAccessToken() ?? undefined),
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: notificationKeys.all,
      });

      const previousLists = queryClient.getQueriesData<NotificationsResponse>({
        queryKey: notificationKeys.lists(),
      });

      queryClient.setQueriesData<NotificationsResponse>(
        { queryKey: notificationKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((n) => (n.id === id ? { ...n, read: true } : n)),
          };
        },
      );

      const previousCount = queryClient.getQueryData<NotificationCountResponse>(
        notificationKeys.unreadCount(),
      );
      if (previousCount && previousCount.unreadCount > 0) {
        queryClient.setQueryData<NotificationCountResponse>(
          notificationKeys.unreadCount(),
          { unreadCount: previousCount.unreadCount - 1 },
        );
      }

      return { previousLists, previousCount };
    },
    onError: (err, _id, context) => {
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data);
        }
      }
      if (context?.previousCount) {
        queryClient.setQueryData(
          notificationKeys.unreadCount(),
          context.previousCount,
        );
      }
      handleMutationError(err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      sdk.notifications.markAllRead(getAccessToken() ?? undefined),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: notificationKeys.all,
      });

      const previousLists = queryClient.getQueriesData<NotificationsResponse>({
        queryKey: notificationKeys.lists(),
      });

      queryClient.setQueriesData<NotificationsResponse>(
        { queryKey: notificationKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((n) => ({ ...n, read: true })),
          };
        },
      );

      queryClient.setQueryData<NotificationCountResponse>(
        notificationKeys.unreadCount(),
        { unreadCount: 0 },
      );

      return { previousLists };
    },
    onError: (err, _vars, context) => {
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data);
        }
      }
      handleMutationError(err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};
