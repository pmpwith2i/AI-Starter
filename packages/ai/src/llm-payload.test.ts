import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { toLlmPayload, toLlmString } from "./llm-payload.js";

describe("@repo/ai — toLlmPayload", () => {
  it("returns the structurally anonymised object", () => {
    const out = toLlmPayload({
      firstName: "Maria",
      email: "maria@example.com",
      weight: 60,
      conditions: "cancro al seno",
    }) as Record<string, unknown>;
    assert.equal(out.firstName, "Paziente");
    assert.equal(out.email, undefined);
    assert.equal(out.weight, 60);
    assert.equal(out.conditions, "cancro al seno");
  });

  it("handles arrays and nested objects (tool result shapes)", () => {
    const out = toLlmPayload({
      patient: { firstName: "Luca", codiceFiscale: "RSSLCA90A01H501Z" },
      visits: [
        { notes: "ok", patientRecordId: "rec-1", diagnosis: "x" },
        { notes: "followup", email: "x@x.it" },
      ],
    }) as Record<string, unknown>;
    const patient = out.patient as Record<string, unknown>;
    assert.equal(patient.firstName, "Paziente");
    assert.equal(patient.codiceFiscale, undefined);
    const visits = out.visits as Array<Record<string, unknown>>;
    assert.equal(visits[0]!.patientRecordId, undefined);
    assert.equal(visits[0]!.diagnosis, "x");
    assert.equal(visits[1]!.email, undefined);
    assert.equal(visits[1]!.notes, "followup");
  });

  it("strips PII from primitive-only lists of strings (no-op)", () => {
    const out = toLlmPayload(["a", "b", "c"]);
    assert.deepEqual(out, ["a", "b", "c"]);
  });

  it("never mutates the input", () => {
    const input = {
      firstName: "Fixed",
      inner: { email: "x@y.z", keep: 1 },
    };
    const before = JSON.parse(JSON.stringify(input)) as typeof input;
    toLlmPayload(input);
    assert.deepEqual(input, before);
  });
});

describe("@repo/ai — toLlmString", () => {
  it("serialises an object to stable JSON with PII stripped", () => {
    const json = toLlmString({
      firstName: "Maria",
      email: "maria@example.com",
      conditions: "ok",
    });
    assert.ok(
      !json.includes("maria@example.com"),
      "email must not appear in the serialised string",
    );
    assert.ok(!json.includes("Maria"), "first name must be replaced");
    assert.ok(json.includes("Paziente"));
    assert.ok(json.includes("conditions"));
  });

  it("passes through already-stringified primitives untouched", () => {
    assert.equal(toLlmString("hello"), "hello");
    assert.equal(toLlmString(42), "42");
    assert.equal(toLlmString(null), "null");
  });

  it("serialises arrays with stripping", () => {
    const out = toLlmString([{ email: "x@y.z", keep: 1 }]);
    assert.ok(!out.includes("x@y.z"));
    assert.ok(out.includes("keep"));
  });
});
