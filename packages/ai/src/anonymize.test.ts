import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { anonymizeForAI, computeAgeYears } from "./anonymize.js";

describe("@repo/ai — anonymizeForAI", () => {
  it("strips email, phone, dateOfBirth, codiceFiscale", () => {
    const input = {
      email: "maria@example.com",
      phone: "+39 333 1234567",
      dateOfBirth: "1975-06-15",
      codiceFiscale: "RSSMRA75C55F205Z",
      conditions: "breast cancer",
    };
    const out = anonymizeForAI(input) as Record<string, unknown>;
    assert.equal(out.email, undefined);
    assert.equal(out.phone, undefined);
    assert.equal(out.dateOfBirth, undefined);
    assert.equal(out.codiceFiscale, undefined);
    // Health data preserved
    assert.equal(out.conditions, "breast cancer");
  });

  it("replaces name fields with placeholder", () => {
    const out = anonymizeForAI({
      firstName: "Maria",
      lastName: "Rossi",
      name: "Maria Rossi",
      height: 165,
    }) as Record<string, unknown>;
    assert.equal(out.firstName, "Paziente");
    assert.equal(out.lastName, "Paziente");
    assert.equal(out.name, "Paziente");
    assert.equal(out.height, 165);
  });

  it("recurses into nested objects", () => {
    const out = anonymizeForAI({
      patient: {
        firstName: "Luca",
        codiceFiscale: "XXX",
        weight: 80,
      },
      visits: [{ notes: "ok", codiceFiscale: "YYY" }],
    }) as Record<string, unknown>;
    const patient = out.patient as Record<string, unknown>;
    assert.equal(patient.firstName, "Paziente");
    assert.equal(patient.codiceFiscale, undefined);
    assert.equal(patient.weight, 80);
    const visits = out.visits as Array<Record<string, unknown>>;
    assert.equal(visits[0]!.notes, "ok");
    assert.equal(visits[0]!.codiceFiscale, undefined);
  });

  it("does not mutate the input", () => {
    const input = {
      firstName: "Original",
      email: "original@example.com",
      health: { conditions: "x" },
    };
    const snapshot = JSON.parse(JSON.stringify(input)) as typeof input;
    anonymizeForAI(input);
    assert.deepEqual(input, snapshot);
  });

  it("preserves primitives (string, number, boolean, null)", () => {
    assert.equal(anonymizeForAI("hello"), "hello");
    assert.equal(anonymizeForAI(42), 42);
    assert.equal(anonymizeForAI(true), true);
    assert.equal(anonymizeForAI(null), null);
  });

  it("strips userId and clientUserId (pseudonym identifiers)", () => {
    const out = anonymizeForAI({
      userId: "user-123",
      clientUserId: "external-456",
      patientRecordId: "rec-789",
      diagnosis: "test",
    }) as Record<string, unknown>;
    assert.equal(out.userId, undefined);
    assert.equal(out.clientUserId, undefined);
    assert.equal(out.patientRecordId, undefined);
    assert.equal(out.diagnosis, "test");
  });
});

describe("@repo/ai — computeAgeYears", () => {
  it("returns null for null input", () => {
    assert.equal(computeAgeYears(null), null);
  });

  it("returns null for invalid date string", () => {
    assert.equal(computeAgeYears("not-a-date"), null);
  });

  it("computes a plausible age for a known DOB", () => {
    // DOB 20 years ago — expect age between 19 and 21
    const twentyYearsAgo = new Date();
    twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);
    const age = computeAgeYears(twentyYearsAgo);
    assert.ok(age !== null && age >= 19 && age <= 21);
  });
});
