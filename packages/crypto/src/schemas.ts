import { z } from "zod";

/**
 * Encrypted payload schemas — define the JSON shape inside each encrypted blob.
 * Used to validate after decryption and before encryption.
 */

/**
 * ClinicalProfile.encryptedHealthData payload.
 *
 * The entire patient body / lifestyle / clinical context lives inside this
 * encrypted blob — NOT split across plaintext columns. A direct JOIN against
 * `users` reveals nothing about the patient beyond the ID linkage.
 */
export const healthDataPayloadSchema = z.object({
  // Biometrics
  height: z.number().nullable(),
  weight: z.number().nullable(),
  sex: z.string().nullable(),
  age: z.number().nullable().optional(),
  // Lifestyle
  activityLevel: z.string().nullable(),
  breakfastPreference: z.string().nullable(),
  isVegan: z.boolean().nullable(),
  isVegetarian: z.boolean().nullable(),
  dietPreference: z.string().nullable().optional(),
  dislikes: z.string().nullable(),
  // Clinical (special-category, Art. 9)
  allergies: z.string().nullable(),
  bloodType: z.string().nullable(),
  conditions: z.string().nullable(),
  dietaryRestrictions: z.string().nullable(),
  // Onboarding context — drive content prioritization and pre-defaults
  goals: z.array(z.string()).nullable().optional(),
  clinicalStatus: z.string().nullable().optional(),
});
export type HealthDataPayload = z.infer<typeof healthDataPayloadSchema>;

/** Visit.encryptedClinicalData payload */
export const visitClinicalPayloadSchema = z.object({
  diagnosis: z.string().nullable(),
  therapy: z.string().nullable(),
  pastMedicalHistory: z.string().nullable(),
  recentMedicalHistory: z.string().nullable(),
  physiologicalHistory: z.string().nullable(),
  currentTherapies: z.unknown().nullable(),
  examsPerformed: z.string().nullable(),
  physicalExamination: z.string().nullable(),
  prescribedTherapy: z.string().nullable(),
  notes: z.string().nullable(),
  instructions: z.string().nullable(),
  nextAppointmentNotes: z.string().nullable(),
  attachments: z.unknown().nullable(),
});
export type VisitClinicalPayload = z.infer<typeof visitClinicalPayloadSchema>;

/** PatientRecord.encryptedIdentifiers payload */
export const identifiersPayloadSchema = z.object({
  codiceFiscale: z.string().nullable(),
});
export type IdentifiersPayload = z.infer<typeof identifiersPayloadSchema>;

/** CompactedSegment.encryptedPayload payload */
export const segmentPayloadSchema = z.object({
  summary: z.string(),
  keyFacts: z.array(z.string()),
});
export type SegmentPayload = z.infer<typeof segmentPayloadSchema>;

/** Generic notes payload (Appointment, PatientRecord) */
export const notesPayloadSchema = z.object({
  content: z.string().nullable(),
});
export type NotesPayload = z.infer<typeof notesPayloadSchema>;
