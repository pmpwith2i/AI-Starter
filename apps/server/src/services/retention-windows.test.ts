import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  RETENTION_WINDOW_MONTHS,
  resolveRetentionExpiry,
} from "./retention-windows.js";

describe("retention windows (patient)", () => {
  it("defines windows for every retention-managed model", () => {
    assert.ok(RETENTION_WINDOW_MONTHS.chat_message > 0);
    assert.ok(RETENTION_WINDOW_MONTHS.compacted_segment > 0);
    assert.ok(RETENTION_WINDOW_MONTHS.user_soul > 0);
    assert.ok(RETENTION_WINDOW_MONTHS.background_task > 0);
    assert.ok(RETENTION_WINDOW_MONTHS.notification > 0);
    assert.ok(RETENTION_WINDOW_MONTHS.suggestion > 0);
  });

  it("resolveRetentionExpiry returns a date N months from createdAt", () => {
    const created = new Date("2026-01-15T10:00:00Z");
    const expiry = resolveRetentionExpiry("chat_message", created);
    const delta = expiry.getTime() - created.getTime() - 0; // ms
    const months = delta / (1000 * 60 * 60 * 24 * (365.25 / 12));
    assert.ok(
      Math.abs(months - RETENTION_WINDOW_MONTHS.chat_message) < 0.1,
      `expected ~${RETENTION_WINDOW_MONTHS.chat_message} months, got ${months}`,
    );
  });

  it("defaults createdAt to now() when omitted", () => {
    const before = Date.now();
    const expiry = resolveRetentionExpiry("notification");
    const after = Date.now();
    assert.ok(expiry.getTime() > before);
    // Expiry must be after now() by at least (months - 1)
    const minMs =
      (RETENTION_WINDOW_MONTHS.notification - 1) * 30 * 24 * 60 * 60 * 1000;
    assert.ok(expiry.getTime() - after > minMs);
  });

  it("produces distinct expiries for distinct windows", () => {
    const created = new Date("2026-01-01");
    const chat = resolveRetentionExpiry("chat_message", created);
    const soul = resolveRetentionExpiry("user_soul", created);
    assert.notEqual(chat.getTime(), soul.getTime());
  });
});
