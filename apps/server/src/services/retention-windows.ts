/**
 * Retention windows for the patient platform.
 *
 * GDPR Art. 5(1)(e) — storage limitation. Every row of personal data that
 * falls under this service is created with `retentionExpiresAt = createdAt
 * + N months`. The hourly `runRetentionCleanup` job DELETEs expired rows.
 *
 * Windows are set in months rather than days so leap years / DST don't skew
 * boundaries. Values are ops-tunable — tweak here, reseed, and the next
 * cleanup pass picks them up.
 */

export type PatientRetentionModel =
  | "chat_message"
  | "compacted_segment"
  | "user_soul"
  | "background_task"
  | "notification"
  | "suggestion"
  | "prevy_user_analysis";

export const RETENTION_WINDOW_MONTHS: Record<PatientRetentionModel, number> = {
  // Chat + LLM byproducts: keep long enough for a user to review recent history,
  // not so long that it accumulates indefinitely.
  chat_message: 24,
  compacted_segment: 36,
  user_soul: 36,
  // Background tasks are operational artefacts; short window.
  background_task: 6,
  // Notifications + suggestions are ephemeral UI surfaces.
  notification: 24,
  suggestion: 24,
  // Prevy history: the product-level analysis is platform-wide cache and not
  // scoped here — only the per-user join is retention-bounded. 24 months.
  prevy_user_analysis: 24,
};

const MS_PER_MONTH = (365.25 / 12) * 24 * 60 * 60 * 1000;

/**
 * Compute the `retentionExpiresAt` Date for a given model, starting from
 * `createdAt` (defaults to now).
 */
export const resolveRetentionExpiry = (
  model: PatientRetentionModel,
  createdAt: Date = new Date(),
): Date => {
  const months = RETENTION_WINDOW_MONTHS[model];
  return new Date(createdAt.getTime() + months * MS_PER_MONTH);
};
