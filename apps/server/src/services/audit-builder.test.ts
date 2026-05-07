import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { audit } from "./audit-builder.js";

describe("audit() builder", () => {
  it("returns a config.audit-shaped object", () => {
    const cfg = audit("clinical_profile", "read");
    assert.deepEqual(cfg, {
      audit: { entity: "clinical_profile", action: "read" },
    });
  });

  it("passes through an optional fields array", () => {
    const cfg = audit("clinical_profile", "update", ["height", "weight"]);
    assert.deepEqual(cfg, {
      audit: {
        entity: "clinical_profile",
        action: "update",
        fields: ["height", "weight"],
      },
    });
  });

  it("supports system-actor flag for internal bridge routes", () => {
    const cfg = audit("internal_bridge", "read", undefined, {
      actorType: "system",
    });
    assert.equal(cfg.audit.actorType, "system");
  });
});
