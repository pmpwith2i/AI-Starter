import { getPrismaClient } from "@repo/db";
import { logger } from "#src/logger.js";

/**
 * Retention cleanup (Art. 5(1)(e)).
 *
 * Deletes rows whose `retentionExpiresAt` has passed. Idempotent: already-
 * deleted rows are simply not selected. Runs at boot and on an hourly
 * interval.
 *
 * Starter scope: Notification (per-user) + User (post-anonymisation hard
 * delete). Add a `prisma.<model>.deleteMany({ where })` call below for every
 * new domain model that carries `retentionExpiresAt`.
 *
 * Not included: append-only ledgers (AuditLog, ConsentRecord) — they need
 * long-term retention for accountability.
 */
export interface RetentionCleanupReport {
  notification: number;
  user: number;
}

export const runRetentionCleanup =
  async (): Promise<RetentionCleanupReport> => {
    const prisma = getPrismaClient();
    const now = new Date();
    const where = { retentionExpiresAt: { lt: now } };

    const notification = await prisma.notification.deleteMany({ where });
    const user = await prisma.user.deleteMany({ where });

    const report: RetentionCleanupReport = {
      notification: notification.count,
      user: user.count,
    };

    const total = Object.values(report).reduce((a, b) => a + b, 0);
    if (total > 0) {
      logger.info(report, "Retention cleanup deleted expired rows");
    }

    return report;
  };

const DEFAULT_INTERVAL_MS = 60 * 60 * 1000;

let handle: ReturnType<typeof setInterval> | null = null;

export const startRetentionCleanup = (
  intervalMs: number = DEFAULT_INTERVAL_MS,
): void => {
  if (handle) return;
  void runRetentionCleanup().catch((err) => {
    logger.error({ err }, "Initial retention cleanup failed");
  });
  handle = setInterval(() => {
    runRetentionCleanup().catch((err) => {
      logger.error({ err }, "Periodic retention cleanup failed");
    });
  }, intervalMs);
  logger.info({ intervalMs }, "Retention cleanup scheduler started");
};

export const stopRetentionCleanup = (): void => {
  if (!handle) return;
  clearInterval(handle);
  handle = null;
  logger.info("Retention cleanup scheduler stopped");
};
