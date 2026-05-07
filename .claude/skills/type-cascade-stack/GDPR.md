# GDPR + ISO 27001 — encryption, consent, audit

The encryption layer is not retrofitted. Every new sensitive column starts encrypted, every mutating route is gated by `consentGuard`, every action emits an `AuditLog`. This is what makes the project ready for ISO/IEC 27001 Annex A and GDPR Art. 5/25/32 by default.

## `@repo/crypto` — the single chokepoint

```ts
// packages/crypto/src/index.ts (excerpt)
export const encrypt = (plaintext: string): string => { /* AES-256-GCM */ };
export const decrypt = (ciphertext: string): string => { /* … */ };
export const encryptJson = <T>(value: T): string => encrypt(JSON.stringify(value));
export const decryptJson = <T>(ciphertext: string): T => JSON.parse(decrypt(ciphertext));
export const signWebhookBody = (secret, ts, body) => { /* HMAC-SHA256 */ };
export const verifyWebhookSignature = (secret, ts, body, sig) => { /* timing-safe */ };
export const timingSafeEquals = (a: string, b: string): boolean => { /* … */ };
export const hashIp = (ip: string | null): string | null => { /* sha256 prefix */ };
```

**Algorithm**: AES-256-GCM, random 12-byte IV per encryption, 16-byte auth tag. On-disk format is `base64(IV || tag || ciphertext)`.

**Key source**: `ENCRYPTION_KEY` env var (hex-encoded 32 bytes). In production it must come from AWS Secrets Manager / GCP Secret Manager / Vault, never from a `.env` checked into git. The server boots loud-fail if the key is missing or malformed.

**Never use `===` on secrets.** Verification codes, API keys, admin secrets, webhook signatures all go through `timingSafeEquals`.

## Encrypted-column recipe

When a Prisma column carries health data, identifiers, or free-text the user wrote, store ciphertext in-place:

```prisma
// packages/db/prisma/schema.prisma
model PatientNotes {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  encryptedNotes String @map("encrypted_notes")  // <-- always String, always encrypted
  createdAt DateTime @default(now()) @map("created_at")
  retentionExpiresAt DateTime @map("retention_expires_at")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("patient_notes")
}
```

The service is the single point that encrypts/decrypts:

```ts
// apps/server/src/routes/patient-notes/patient-notes.service.ts
import { encrypt, decrypt } from "@repo/crypto";
import { resolveRetentionExpiry } from "../../services/retention-windows.js";

export const createPatientNote = async (userId: string, body: CreatePatientNoteBody): Promise<PatientNoteResponse> => {
  const row = await prisma.patientNotes.create({
    data: {
      userId,
      encryptedNotes: encrypt(body.notes),
      retentionExpiresAt: resolveRetentionExpiry("patient_notes", new Date()),
    },
  });
  return { id: row.id, notes: body.notes, createdAt: row.createdAt.toISOString() };
};

export const getPatientNote = async (userId: string, id: string): Promise<PatientNoteResponse> => {
  const row = await prisma.patientNotes.findFirst({ where: { id, userId } });
  if (!row) throw new HttpErrorResponse("Not found", 404, "PATIENT_NOTE_NOT_FOUND");
  return { id: row.id, notes: decrypt(row.encryptedNotes), createdAt: row.createdAt.toISOString() };
};
```

Schema returns cleartext (`notes: string`); DB row holds ciphertext. The frontend never knows.

## Consent — `ConsentRecord` + `consentGuard`

```prisma
model ConsentRecord {
  id            String   @id @default(cuid())
  userId        String   @map("user_id")
  purpose       ConsentPurpose
  policyVersion String   @map("policy_version")
  grantedAt     DateTime? @map("granted_at")
  withdrawnAt   DateTime? @map("withdrawn_at")
  ipAddressHash String?  @map("ip_address_hash")
  userAgent     String?  @map("user_agent")
  @@map("consent_records")
}

enum ConsentPurpose {
  terms_of_service
  privacy_policy
  health_data_processing
  ai_data_processing
  marketing_communications
  third_party_payments
}
```

Mandatory purposes are configured per platform (e.g. patient: `[terms_of_service, privacy_policy, health_data_processing]`). The Fastify `consentGuard(["health_data_processing"])` preHandler rejects requests with HTTP 403 + `CONSENT_REQUIRED` if any mandatory purpose is missing or the user's consent version < `PRIVACY_POLICY_VERSION`. Bumping the env var forces re-consent.

Versioning is the lever. Never delete consent rows — they survive account deletion for 10-year accountability (Art. 7(1) GDPR).

## Audit log — append-only

```prisma
model AuditLog {
  id            String   @id @default(cuid())
  actorId       String?  @map("actor_id")
  actorType     ActorType @map("actor_type")  // user | admin | system
  targetId      String?  @map("target_id")
  targetModel   String?  @map("target_model")
  action        AuditAction                   // read | create | update | delete | export
  fields        String[]                      // names only, NEVER values
  reason        String?
  ipAddressHash String?  @map("ip_address_hash")
  userAgent     String?  @map("user_agent")
  createdAt     DateTime @default(now()) @map("created_at")
  @@map("audit_logs")
}
```

Postgres hardening in `packages/db/prisma/raw_sql/permissions.sql`:

```sql
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    REVOKE UPDATE, DELETE ON audit_logs FROM app_user;
    REVOKE DELETE ON consent_records FROM app_user;
  END IF;
END $$;
```

Production must run the API as `app_user`, not `postgres`. The REVOKEs make the audit trail tamper-evident at the DB layer.

The `audit(entity, action, fields?, { actorType? })` helper builds a typed `config.audit` object; an `onResponse` Fastify hook auto-creates the `AuditLog` row. Service-layer writes (e.g. inside transactions) call `createAuditEntry()` directly.

## Retention — Art. 5(1)(e)

Every encrypted/sensitive table carries `retentionExpiresAt`, populated on every write via `resolveRetentionExpiry(modelName, createdAt)`. Per-model windows live in `services/retention-windows.ts` and are ops-tunable (chat 24m, notes 60m, audit-log excluded).

`startRetentionCleanup()` runs on boot + hourly. Idempotent. Append-only ledgers (`AuditLog`, `ConsentRecord`, `*Purchase`) are intentionally excluded.

## AI pseudonymization — `@repo/ai` boundary

Every LLM call goes through `toLlmPayload(value)` which strips PII (email, phone, names, identifiers, dates of birth → age) before serialization. The base agent loop wraps every tool return value through this helper too — any domain tool cannot accidentally leak raw user data into the conversation history.

System prompts explicitly instruct: "do not echo identifiers; refer to the user as 'Paziente'/'Patient'".

## Data subject rights — `DELETE /account` + `GET /account/export`

- **Delete**: hybrid strategy. Hard-delete health/personal data + chats + souls + nutrition plans. Anonymize the `User` row (null PII, email → `deleted_<sha256>@redacted.local`, `deletedAt = now()`, `retentionExpiresAt = now + 10y`). Retain financial + audit + consent rows linked by the anonymized anchor. Requires password confirmation.
- **Export**: returns a JSON bundle with all encrypted fields decrypted into cleartext.

Auth guard MUST select `deletedAt` and reject `deletedAt !== null` users at every request.

## ISO 27001 controls hit by this layout

| Annex A | Control | Where |
|---|---|---|
| A.5.34 | Privacy + PII protection | encryption layer + consent + audit |
| A.8.10 | Information deletion | retention cleanup + DELETE /account |
| A.8.11 | Data masking | `anonymizeForAI` + `hashIp` |
| A.8.24 | Use of cryptography | `@repo/crypto` AES-256-GCM, key in secret manager |
| A.5.31 | Legal/regulatory requirements | mandatory consent purposes + privacy/terms version env vars |
| A.8.15 | Logging | `AuditLog` append-only + REVOKE UPDATE/DELETE |
| A.5.18 | Access rights | `authenticate` + role guard + token version invalidation |

## Pino redaction

Pino logger config redacts `*.email`, `*.firstName`, `*.lastName`, `*.phone`, `*.codiceFiscale`, `*.dateOfBirth`, `*.to`, `req.body.email`, `req.body.password`. Log analytics pipelines are downstream consumers of the audit log, not of raw request bodies.

## Webhook hardening — Art. 32 confidentiality

Internal/external webhooks are signed via `signWebhookBody(secret, timestamp, body)` and verified with `verifyWebhookSignature` on the receiver, with a 5-minute clock-skew window. Leaking the API key alone is not enough to forge a request.

## Quick checklist for a new sensitive feature

- [ ] New Prisma model uses `encryptedX` columns for any free-text or identifier.
- [ ] Service calls `encrypt`/`decrypt` at the boundary. No cleartext leaves the service to the DB; no ciphertext leaves the service to the SDK.
- [ ] Route registers `consentGuard([...])` preHandler with the right purpose(s).
- [ ] Route has `config: audit("entity", "action", ["fieldNames"])` — field names only, never values.
- [ ] Model has `retentionExpiresAt`; populated on every write; window registered in `retention-windows.ts`.
- [ ] If the route hits an LLM, the input is wrapped with `toLlmPayload`.
- [ ] If the route exposes a webhook, body is signed/verified.
