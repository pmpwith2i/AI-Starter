import { getPrismaClient } from "@repo/db";
import { logger } from "#src/logger.js";

/**
 * Retention cleanup (Art. 5(1)(e)).
 *
 * Deletes rows whose `retentionExpiresAt` has passed. Idempotent: already-
 * deleted rows are simply not selected. Runs at boot and on an hourly
 * interval.
 *
 * Scope: User (post-anonymisation hard delete), ClinicalProfile, plus six
 * child models with their own per-model retention windows (chat, compacted
 * segments, souls, background tasks, notifications, suggestions). Cascades
 * are preserved — the `deleteMany` calls only hit rows past their window.
 *
 * Not included: append-only ledgers (AuditLog, ConsentRecord, CreditTransaction,
 * CoursePurchase, EventPurchase, BundlePurchase) — they need long-term
 * retention for accountability / tax law.
 */
export interface RetentionCleanupReport {
  chatMessage: number;
  compactedSegment: number;
  userSoul: number;
  backgroundTask: number;
  notification: number;
  suggestion: number;
  clinicalProfile: number;
  user: number;
}

export const runRetentionCleanup =
  async (): Promise<RetentionCleanupReport> => {
    const prisma = getPrismaClient();
    const now = new Date();
    const where = { retentionExpiresAt: { lt: now } };

    // Delete child-model rows first so their cascade-targets aren't sniped
    // out from under them by the User delete below.
    const chatMessage = await prisma.chatMessage.deleteMany({ where });
    const compactedSegment = await prisma.compactedSegment.deleteMany({
      where,
    });
    const userSoul = await prisma.userSoul.deleteMany({ where });
    // Background tasks: only delete terminal-state rows. A task stuck in
    // `running` (executor hang, OOM kill) past its retention window is
    // operationally interesting — leave it for the heartbeat scanner /
    // orphan-recovery hooks to surface, not silently delete.
    const backgroundTask = await prisma.backgroundTask.deleteMany({
      where: {
        retentionExpiresAt: { lt: now },
        status: { in: ["completed", "failed"] },
      },
    });
    const notification = await prisma.notification.deleteMany({ where });
    const suggestion = await prisma.suggestion.deleteMany({ where });
    const clinicalProfile = await prisma.clinicalProfile.deleteMany({ where });
    const user = await prisma.user.deleteMany({ where });

    const report: RetentionCleanupReport = {
      chatMessage: chatMessage.count,
      compactedSegment: compactedSegment.count,
      userSoul: userSoul.count,
      backgroundTask: backgroundTask.count,
      notification: notification.count,
      suggestion: suggestion.count,
      clinicalProfile: clinicalProfile.count,
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
