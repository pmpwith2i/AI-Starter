import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { signWebhookBody, verifyWebhookSignature } from "./webhook-sign.js";

const SECRET = "a-test-webhook-secret-chosen-for-tests-only";
const BODY = JSON.stringify({ status: "confirmed", appointmentId: "a-1" });

describe("webhook HMAC signing", () => {
  it("produces a deterministic signature for fixed inputs", () => {
    const ts = 1_700_000_000;
    const sig1 = signWebhookBody(SECRET, ts, BODY);
    const sig2 = signWebhookBody(SECRET, ts, BODY);
    assert.equal(sig1, sig2);
    assert.ok(sig1.startsWith("sha256="));
  });

  it("different bodies produce different signatures", () => {
    const ts = 1_700_000_000;
    const sig1 = signWebhookBody(SECRET, ts, BODY);
    const sig2 = signWebhookBody(SECRET, ts, BODY + "x");
    assert.notEqual(sig1, sig2);
  });

  it("different secrets produce different signatures", () => {
    const ts = 1_700_000_000;
    const sig1 = signWebhookBody(SECRET, ts, BODY);
    const sig2 = signWebhookBody(SECRET + "x", ts, BODY);
    assert.notEqual(sig1, sig2);
  });

  it("verify returns true for a fresh signature", () => {
    const ts = Math.floor(Date.now() / 1000);
    const sig = signWebhookBody(SECRET, ts, BODY);
    assert.equal(
      verifyWebhookSignature(SECRET, ts, BODY, sig, { now: ts }),
      true,
    );
  });

  it("verify rejects a stale timestamp beyond the skew window", () => {
    const tsOld = 1_700_000_000;
    const sig = signWebhookBody(SECRET, tsOld, BODY);
    const now = tsOld + 10 * 60; // 10 minutes later, window is 5 min
    assert.equal(
      verifyWebhookSignature(SECRET, tsOld, BODY, sig, { now }),
      false,
    );
  });

  it("verify rejects a future timestamp beyond the skew window", () => {
    const ts = 1_700_000_000;
    const sig = signWebhookBody(SECRET, ts, BODY);
    const now = ts - 10 * 60; // 10 minutes before signature; attacker pushed clock
    assert.equal(verifyWebhookSignature(SECRET, ts, BODY, sig, { now }), false);
  });

  it("verify rejects a tampered signature", () => {
    const ts = Math.floor(Date.now() / 1000);
    const sig = signWebhookBody(SECRET, ts, BODY);
    const bad = sig.replace(/.$/, (c) => (c === "a" ? "b" : "a"));
    assert.equal(
      verifyWebhookSignature(SECRET, ts, BODY, bad, { now: ts }),
      false,
    );
  });

  it("verify rejects empty / malformed signature without throwing", () => {
    const ts = Math.floor(Date.now() / 1000);
    assert.equal(
      verifyWebhookSignature(SECRET, ts, BODY, "", { now: ts }),
      false,
    );
    assert.equal(
      verifyWebhookSignature(SECRET, ts, BODY, "sha256=", { now: ts }),
      false,
    );
    assert.equal(
      verifyWebhookSignature(SECRET, ts, BODY, "wrong-prefix=abcd", {
        now: ts,
      }),
      false,
    );
  });
});
