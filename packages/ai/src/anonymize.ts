/**
 * GDPR pseudonymization helper for AI data flows.
 *
 * Before sending user/patient data to an external AI provider (OpenRouter/OpenAI),
 * strip direct identifiers that are not required for the AI to function.
 *
 * Keeps: health data relevant for medical reasoning (conditions, allergies,
 *        weight, height, sex, age, dietary preferences).
 * Strips: names, email, phone, date of birth, national identifiers (codice fiscale),
 *         patient IDs, addresses.
 *
 * Never mutates the input — always returns a new object.
 */

/**
 * Keys whose values are stripped (or, for `firstName` / `lastName` / `name`,
 * replaced with the "Paziente" placeholder) before any LLM prompt is built.
 *
 * Design note: this list intentionally targets PATIENT identifiers. Public
 * professional identifiers like `professionalName` are NOT in this list —
 * doctors are not data subjects in the patient–AI interaction, they are
 * public-facing figures in a medical directory whose names belong to the
 * functional context of an appointment / visit summary. Add a new key here
 * only when its value identifies a patient or end user.
 */
const PII_KEYS = new Set([
  "firstName",
  "lastName",
  "name",
  "email",
  "phone",
  "dateOfBirth",
  "codiceFiscale",
  "codice_fiscale",
  "address",
  "userId",
  "user_id",
  "patientRecordId",
  "patient_record_id",
  "clientUserId",
  "client_user_id",
]);

const NAME_PLACEHOLDER = "Paziente";

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Recursively strip PII from any JSON-serializable value.
 * - Keys in PII_KEYS are removed (or name-like keys replaced with placeholder).
 * - Nested objects and arrays are traversed.
 * - Primitives are returned as-is.
 */
export function anonymizeForAI<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => anonymizeForAI(v)) as unknown as T;
  }
  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) {
      if (key === "firstName" || key === "lastName" || key === "name") {
        // Replace with placeholder instead of removing, so structure stays
        // predictable for the AI.
        result[key] = NAME_PLACEHOLDER;
        continue;
      }
      if (PII_KEYS.has(key)) {
        // Strip entirely
        continue;
      }
      result[key] = anonymizeForAI(v);
    }
    return result as unknown as T;
  }
  return value;
}

/**
 * Compute an age in years from a date of birth (without exposing DOB itself).
 * Used to feed "age" to the AI while keeping the exact DOB private.
 */
export function computeAgeYears(dob: Date | string | null): number | null {
  if (!dob) return null;
  const d = typeof dob === "string" ? new Date(dob) : dob;
  if (Number.isNaN(d.getTime())) return null;
  const diffMs = Date.now() - d.getTime();
  return Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
}
