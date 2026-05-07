import type { FromSchema } from "json-schema-to-ts";
import {
  GET_NOTIFICATIONS_ROUTE_SCHEMA,
  GET_NOTIFICATION_COUNT_ROUTE_SCHEMA,
  PUT_NOTIFICATION_READ_ROUTE_SCHEMA,
  PUT_NOTIFICATIONS_READ_ALL_ROUTE_SCHEMA,
} from "../schemas/notification.schema.js";
import { apiFetch } from "./fetcher.js";

export type NotificationsQuery = FromSchema<
  typeof GET_NOTIFICATIONS_ROUTE_SCHEMA.querystring
>;
export type NotificationsResponse = FromSchema<
  (typeof GET_NOTIFICATIONS_ROUTE_SCHEMA.response)[200]
>;
export type NotificationCountResponse = FromSchema<
  (typeof GET_NOTIFICATION_COUNT_ROUTE_SCHEMA.response)[200]
>;
export type MarkReadParams = FromSchema<
  typeof PUT_NOTIFICATION_READ_ROUTE_SCHEMA.params
>;
export type MarkReadResponse = FromSchema<
  (typeof PUT_NOTIFICATION_READ_ROUTE_SCHEMA.response)[200]
>;
export type MarkAllReadResponse = FromSchema<
  (typeof PUT_NOTIFICATIONS_READ_ALL_ROUTE_SCHEMA.response)[200]
>;

export interface NotificationSDK {
  list: (
    query?: NotificationsQuery,
    accessToken?: string,
  ) => Promise<NotificationsResponse>;
  unreadCount: (accessToken?: string) => Promise<NotificationCountResponse>;
  markRead: (id: string, accessToken?: string) => Promise<MarkReadResponse>;
  markAllRead: (accessToken?: string) => Promise<MarkAllReadResponse>;
}

export const createNotificationSDK = (baseUrl: string): NotificationSDK => ({
  list: (query, accessToken) => {
    const params = new URLSearchParams();
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));
    if (query?.unreadOnly) params.set("unreadOnly", "true");
    const qs = params.toString();
    return apiFetch<undefined, NotificationsResponse>({
      baseUrl,
      path: `/notifications${qs ? `?${qs}` : ""}`,
      method: "GET",
      accessToken,
    });
  },

  unreadCount: (accessToken) =>
    apiFetch<undefined, NotificationCountResponse>({
      baseUrl,
      path: "/notifications/count",
      method: "GET",
      accessToken,
    }),

  markRead: (id, accessToken) =>
    apiFetch<undefined, MarkReadResponse>({
      baseUrl,
      path: `/notifications/${id}/read`,
      method: "PUT",
      accessToken,
    }),

  markAllRead: (accessToken) =>
    apiFetch<undefined, MarkAllReadResponse>({
      baseUrl,
      path: "/notifications/read-all",
      method: "PUT",
      accessToken,
    }),
});
