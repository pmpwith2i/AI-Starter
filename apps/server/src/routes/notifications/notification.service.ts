import { getPrismaClient } from "@repo/db";
import { HttpErrorResponse } from "#src/plugins/error-handler.plugin.js";
import { ERROR_CODES } from "@repo/server-sdk/schemas";

interface ListNotificationsParams {
  userId: string;
  page: number;
  limit: number;
  unreadOnly: boolean;
}

export const listNotifications = async ({
  userId,
  page,
  limit,
  unreadOnly,
}: ListNotificationsParams) => {
  const prisma = getPrismaClient();
  const where = {
    userId,
    ...(unreadOnly && { read: false }),
  };

  const [data, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    data: data.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      read: n.read,
      metadata: n.metadata,
      createdAt: n.createdAt.toISOString(),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  const prisma = getPrismaClient();
  return prisma.notification.count({
    where: { userId, read: false },
  });
};

export const markAsRead = async (
  userId: string,
  notificationId: string,
): Promise<void> => {
  const prisma = getPrismaClient();
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new HttpErrorResponse(
      "Notification not found",
      404,
      ERROR_CODES.NOTIFICATION_NOT_FOUND,
    );
  }

  if (!notification.read) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }
};

export const markAllAsRead = async (userId: string): Promise<number> => {
  const prisma = getPrismaClient();
  const result = await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  return result.count;
};

/**
 * Lifecycle notification types. Add a literal here for every notification kind
 * your domain emits — mobile + dashboard switch on these strings to render
 * icons / route on tap. Consumers that don't recognise the type fall back to
 * the default `Bell` icon and no navigation.
 */
export type NotificationType = "welcome" | (string & {});

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  /** Free-form JSON consumed client-side (e.g. `{ planId }` for navigation). */
  metadata?: Record<string, unknown> | null;
}

/**
 * Insert a single Notification row. Triggers the PG `notifications` realtime
 * channel, so the connected mobile/dashboard sessions update their bell badge
 * + panel without polling.
 */
export const createNotification = async (
  input: CreateNotificationInput,
): Promise<void> => {
  const prisma = getPrismaClient();
  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? "",
      metadata: (input.metadata ?? null) as never,
      read: false,
    },
  });
};
