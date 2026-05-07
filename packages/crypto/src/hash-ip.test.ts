import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { hashIp } from "./hash-ip.js";

describe("@repo/crypto — hashIp", () => {
  it("returns null for undefined", () => {
    assert.equal(hashIp(undefined), null);
  });

  it("returns null for empty string", () => {
    assert.equal(hashIp(""), null);
  });

  it("returns null for whitespace-only string", () => {
    assert.equal(hashIp("   "), null);
  });

  it("returns a 16-char hex string for an IPv4", () => {
    const h = hashIp("192.168.1.1");
    assert.ok(h);
    assert.equal(h!.length, 16);
    assert.match(h!, /^[0-9a-f]{16}$/);
  });

  it("returns a 16-char hex string for an IPv6", () => {
    const h = hashIp("2001:0db8:85a3::8a2e:0370:7334");
    assert.ok(h);
    assert.equal(h!.length, 16);
  });

  it("is deterministic — same input → same hash", () => {
    const a = hashIp("10.0.0.1");
    const b = hashIp("10.0.0.1");
    assert.equal(a, b);
  });

  it("different inputs produce different hashes", () => {
    const a = hashIp("10.0.0.1");
    const b = hashIp("10.0.0.2");
    assert.notEqual(a, b);
  });

  it("never throws on unexpected types", () => {
    assert.equal(hashIp(null), null);
    // @ts-expect-error — defensive runtime check, not a valid call signature
    assert.equal(hashIp(42), null);
  });
});
