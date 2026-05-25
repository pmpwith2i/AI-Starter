# CLAUDE.md — {{PROJECT_NAME}}

> Project encyclopedia. The deep reference. Read in full once; consult on demand.
>
> Working contract → `AGENT.md`. Design system → `design/*.md`.

## What this project is

{{ONE_LINER}}

- **Category**: {{CATEGORY}}
- **Primary domain**: {{PRIMARY_DOMAIN}} — {{PRIMARY_DOMAIN_DESCRIPTION}}
- **Audience**: {{AUDIENCE}}
- **Sensitive data tier**: {{DATA_CLASS}}
- **Surfaces scaffolded**: {{SURFACES}}

## Build & dev commands

```bash
pnpm install                          # from repo root
docker compose up -d                  # start Postgres
pnpm dev                              # all packages in watch mode
pnpm dev --filter=@repo/server        # only the server
pnpm build                            # build all
pnpm lint                             # zero warnings
pnpm lint:fix
pnpm test                             # node:test (server) + Vitest (dashboard pure helpers)

# Apply PG triggers (run after `prisma db push` or `prisma migrate deploy`):
pnpm --filter @repo/db exec prisma db execute --file prisma/raw_sql/triggers.sql
pnpm --filter @repo/db exec prisma db execute --file prisma/raw_sql/permissions.sql
```

## Architecture

TypeScript monorepo, Turborepo + pnpm. Strict TypeScript, Node 22.

### Apps

- `apps/server` — Fastify 5 API (port 3000)
- `apps/dashboard` — Vite + React 19 + TanStack (port 5173)
- `apps/website` — Next.js 16 marketing (port 4000) — present if scaffolded
- `apps/mobile` — Expo + React Native — present if scaffolded

### Packages

- `@repo/server-sdk` — JSON Schemas + typed fetch client. **The contract.**
- `@repo/db` — Prisma + raw_sql/triggers.sql + raw_sql/permissions.sql
- `@repo/crypto` — AES-256-GCM, HMAC, hashIp, timingSafeEquals
- `@repo/email` — transactional email wrapper (Resend by default)
- `@repo/typescript-config`, `@repo/eslint-config` — shared configs

### Type cascade (the core idea)

```
Prisma schema → JSON Schema (server-sdk) → FromSchema<typeof X> → server handler + dashboard hook + mobile screen
```

Change the schema, the compiler shows every consumer that needs updating. Zero runtime surprises.

## Route conventions

```
apps/server/src/routes/<domain>/
├── <domain>.module.ts    # Fastify plugin registering routes
├── <domain>.service.ts   # Business logic; throws HttpErrorResponse
└── <domain>.module.test.ts (optional)
```

Schemas live in `packages/server-sdk/src/schemas/<domain>.schema.ts` — never duplicated locally.

Standard response envelope for lists: `{ data: T[], pagination: { page, limit, total, totalPages } }`.

## Key conventions

- **File naming**: `kebab-case`. Group by feature/domain, not by type.
- **Imports**: `#src/*` for internal `apps/server` imports (subpath imports). Always `.js` in import strings (ESM).
- **TS**: strict mode, no `any` / `@ts-ignore`. `interface` for object shapes, `type` for unions.
- **Schema types**: `FromSchema<typeof SCHEMA>`, never hand-written interfaces mirroring schemas.
- **Errors**: services throw `HttpErrorResponse`. Global `errorHandlerPlugin` translates them. Codes in `packages/server-sdk/src/schemas/error-codes.ts`.
- **Logger**: Pino only (`console.log` is an ESLint error).
- **Env**: validated at startup via `env-schema`. Keep `.env.example` synced.
- **DB**: snake_case columns via `@map()`, camelCase in TS.
- **Rate limit**: `@fastify/rate-limit` with `global: false`; per-route `config.rateLimit`. AI endpoints MUST have a rate limit.
- **SSE**: call `reply.hijack()` before writing to `reply.raw`. Let `@fastify/cors` handle CORS.
- **Graceful shutdown**: `close-with-grace` in `index.ts` (delay 10000).
- **Security headers**: `@fastify/helmet` registered before CORS.
- **Auth**: JWT (30 min) + UUID refresh tokens with rotation. Refresh-token reuse detection (revoke whole family). Token version on every JWT.
- **Realtime**: every new model → PG trigger + topic + dashboard invalidation. Documented exceptions only.

## GDPR + ISO 27001 architecture

Decided up front, baked into every domain. See `design/`-adjacent doc `docs/gdpr.md` for the full PRD; quick summary:

- **Encryption**: `@repo/crypto` (AES-256-GCM, IV per-encryption). Key from `ENCRYPTION_KEY` env var, sourced from secret manager in prod.
- **`ConsentRecord`**: 6 purposes (`terms_of_service`, `privacy_policy`, `health_data_processing`, `ai_data_processing`, `marketing_communications`, `third_party_payments`). Versioned by `policyVersion`. Never deleted.
- **`AuditLog`**: append-only. `REVOKE UPDATE, DELETE ON audit_logs FROM app_user` enforced via `permissions.sql`.
- **`consentGuard([...])` Fastify preHandler** rejects requests with HTTP 403 + `CONSENT_REQUIRED` if any mandatory purpose is missing.
- **`audit("entity", "action", ["fields"])`** Fastify config decorator + `onResponse` hook persists the audit row.
- **Retention**: `retentionExpiresAt` on every sensitive table; hourly cleanup. Audit + consent + financial records excluded.
- **AI pseudonymization**: every LLM call wraps payloads through `toLlmPayload` from `@repo/ai` (strips email/phone/names/identifiers, dates of birth → age years).
- **Webhook hardening**: HMAC-signed bodies via `signWebhookBody` + `verifyWebhookSignature`.
- **IP hashing**: `hashIp()` produces a 16-char SHA-256 prefix. Stored hashed everywhere (audit log, consent record).
- **Pino redact**: `*.email`, `*.firstName`, `*.lastName`, `*.phone`, `*.codiceFiscale`, `*.dateOfBirth`, `*.to`, `req.body.email`, `req.body.password`.

## Design system

`design/` is the single source of truth for tone, brand, tokens, components. Every UI agent reads `design/tone.md` + `design/tokens.md` BEFORE touching JSX. `impeccable:audit` runs as a gate before any frontend PR.

Per-surface differentiation: marketing + dashboard share the primary hue ({{PRIMARY_HUE}}); mobile shares the same. If a Pro platform is later added, shift the hue by ~25° to differentiate.

## Frontend conventions

### Dashboard

- TanStack Router file-based routes; loaders for initial data; TanStack Query for mutations.
- Hooks per domain: `hooks/<domain>/<domain>.keys.ts` + `use-<domain>.ts`.
- Components per domain: `components/<domain>/`.
- Pure helpers in `lib/<feature>/<helper>.ts` with co-located `.test.ts` (Vitest). Never inline in components.
- Resource routing: every viewable resource has its own route with URL param. Never `useState`-toggle between list and detail.
- Storybook: every presentational component has a `<name>.stories.tsx`. Components calling hooks must pre-populate `QueryClientProvider` caches.
- i18n: Lingui — `<Trans>` for JSX, `t` macro via `useLingui()` for strings.
- Accessibility: icon-only buttons MUST have `aria-label`; tab-like selectors use `aria-pressed` or `role="tablist"`; mutation hooks include `onError` with toast.

### Marketing

- Next.js 16 RSC-first. `'use client'` only when interactivity needed.
- SEO: `buildMetadata()` helper + JSON-LD via `JsonLdScript` component. `sitemap.ts` + `robots.ts` + `manifest.ts` automatic.
- Cached fetchers in `src/lib/data/<domain>.ts` via `React.cache()` so `generateMetadata` and the page share one round-trip.
- Asset assumption: no real brand assets initially — fall back to dynamic `ImageResponse` for OG, gradient initials for avatars, explicit empty states for testimonials.

### Mobile

- Expo + Expo Router (file-based routes).
- Reuses `@repo/server-sdk` types directly. No mobile-specific DTO.
- Auth tokens in `expo-secure-store`. Bearer-mode SDK fetcher.
- WebSocket realtime via `?ticket=` flow (same as dashboard).
- Token persistence + auth provider in `apps/mobile/src/lib/auth.ts`.

## Testing

- **Backend**: bullet-proof. `node:test` + `tsx` with `mock.module()` BEFORE the dynamic import. Cover happy path + every error code path + every encryption boundary.
- **Frontend pure helpers**: Vitest, co-located. No React rendering — pure inputs/outputs.
- **Frontend components**: Storybook (visual). NOT unit-tested in V1.

## Git workflow

- Branches: `feature/<desc>` or `fix/<desc>`.
- Commits: imperative ("Add X").
- Squash-merge to `main`.
- Never `--no-verify`. Never force-push to `main`.

## Plan mode

- Interview the user relentlessly about every aspect of the plan until shared understanding is reached.
- Make plans concise. Sacrifice grammar for concision.
- End each plan with a list of unresolved questions.
- When code/architectural choice is not stated, ASK — do not assume.

## Execution mode

- After any code change: run `pnpm lint && pnpm build`. Do not skip.
- After any change: update relevant `README.md` and `CLAUDE.md` sections.

---

## Project log (append-only — recent decisions)

### {{TODAY_ISO}} — Project initialized

Bootstrapped via the `type-cascade-stack` skill. Interview answers persisted at `.claude/bootstrap-answers.json`.
