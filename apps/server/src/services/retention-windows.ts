/**
 * Retention windows.
 *
 * GDPR Art. 5(1)(e) — storage limitation. Every row of personal data that
 * falls under this service is created with `retentionExpiresAt = createdAt
 * + N months`. The hourly `runRetentionCleanup` job DELETEs expired rows.
 *
 * Windows are set in months rather than days so leap years / DST don't skew
 * boundaries. Values are ops-tunable — tweak here, reseed, and the next
 * cleanup pass picks them up.
 *
 * Add a literal here for every new domain model that carries
 * `retentionExpiresAt`, then add the matching `deleteMany` call in
 * `runRetentionCleanup`.
 */

export type RetentionModel = "notification";

export const RETENTION_WINDOW_MONTHS: Record<RetentionModel, number> = {
  notification: 24,
};

const MS_PER_MONTH = (365.25 / 12) * 24 * 60 * 60 * 1000;

/**
 * Compute the `retentionExpiresAt` Date for a given model, starting from
 * `createdAt` (defaults to now).
 */
export const resolveRetentionExpiry = (
  model: RetentionModel,
  createdAt: Date = new Date(),
): Date => {
  const months = RETENTION_WINDOW_MONTHS[model];
  return new Date(createdAt.getTime() + months * MS_PER_MONTH);
};
