# metaimed-starter

> Type-cascade monorepo starter. Clone this repo, open it in Claude Code, invoke the `type-cascade-stack` skill, and the skill will interview you, personalize the placeholders, install everything, and spawn checkpoint agents that ship the first vertical.

## What you get out of the box

- **Turborepo + pnpm + Node 22** monorepo with strict TypeScript.
- **Apps**:
  - `apps/server` — Fastify 5 API. Auth (signup + login + email verify + password reset), refresh-token rotation with reuse detection, account-lockout tiers, JWT with `tokenVersion`, consent enforcement, audit log, retention cleanup, realtime PG triggers + WebSocket. **Zero domain logic.**
  - `apps/dashboard` — Vite + React 19 + TanStack Router/Query + shadcn/ui. Auth flow + profile + consent screens. Sidebar layout. **Zero domain UI.**
  - `apps/website` — Next.js 16 marketing skeleton. Privacy/terms pages, SEO infra. **Zero domain pages.**
  - `apps/mobile` — Expo + Expo Router + NativeWind. Auth screens. **Zero domain screens.**
- **Packages**:
  - `@repo/server-sdk` — JSON Schemas + typed fetch client (single source of truth for types). `auth`, `consent`, `legal`, `account`, `notification`, `profile`.
  - `@repo/db` — Prisma + `User + RefreshToken + ConsentRecord + AuditLog + Notification`. Postgres triggers + permissions hardening.
  - `@repo/crypto` — AES-256-GCM, HMAC, hashIp, timingSafeEquals.
  - `@repo/email` — Resend wrapper with verification + password-reset templates.
  - `@repo/ai` — `LlmProvider`, base agent loop, `anonymizeForAI`, `toLlmPayload`. Provider-agnostic via OpenRouter.
  - `@repo/eslint-config`, `@repo/typescript-config` — shared configs.
- **Compliance baked in**: `consentGuard`, `audit()`, retention windows, IP hashing, AI pseudonymization, JWT `tokenVersion`, refresh-token reuse detection, REVOKE on `audit_logs` + `consent_records`.
- **Realtime**: PG `LISTEN/NOTIFY` triggers + WebSocket manager with ticket-flow auth.
- **20 skills** under `.claude/skills/` (type-cascade-stack, use-sdk, fastify-best-practices, vercel-react-best-practices, tdd, diagnose, etc.) — all the working-style guidance the agents need.

## How to use

```bash
git clone <this-repo> my-project
cd my-project
```

Open the project in Claude Code (or any agent runner) and say:

> Set up the new project.

The `type-cascade-stack` skill will:

1. **Interview** you (5 rounds: project name + pitch, primary domain, sensitive-data class, surfaces to keep, tone + brand hue).
2. **Personalize** every `{{...}}` placeholder in `AGENT.md`, `CLAUDE.md`, `design/*.md`, the source tree, root `package.json`, and the mobile `app.json` identity — from your answers, with tone/category-derived defaults so nothing is left blank.
3. **Generate** `ENCRYPTION_KEY` + `JWT_SECRET_KEY` into `apps/server/.env`, and create `packages/db/.env` (where Prisma reads `DATABASE_URL`).
4. **Drop** any surface (`apps/website`, `apps/mobile`) you didn't pick.
5. **Install** dependencies (auto-runs `prisma generate`), bring up Postgres, run the initial Prisma migration + triggers + permissions + seed.
6. **Generate** the design system via `impeccable:teach-impeccable` + `impeccable:normalize`.
7. **Spawn** four checkpoint agents in sequence (design system → auth vertical → first CRUD domain → deploy infra), pausing for review between each.
8. **Audit** for compliance (`gdpr-compliance:gdpr-compliance` + `iso27001:iso27001` + `security-review`).

By the end of day 1 you have a deployable v0.1.0 with auth + your first domain CRUD + design tokens + CDK pipeline PR ready.

## Manual quick start (without the skill)

```bash
pnpm install                                   # also runs `prisma generate`
docker compose up -d
cp apps/server/.env.example apps/server/.env
cp packages/db/.env.example packages/db/.env   # Prisma reads DATABASE_URL from here
# fill ENCRYPTION_KEY + JWT_SECRET_KEY (openssl rand -hex 32) + RESEND_API_KEY in apps/server/.env
pnpm --filter @repo/db exec prisma migrate dev --name init
pnpm --filter @repo/db exec prisma db execute --file prisma/raw_sql/triggers.sql
pnpm --filter @repo/db exec prisma db execute --file prisma/raw_sql/permissions.sql
pnpm --filter @repo/db exec prisma db seed
pnpm dev
```

Default seed user: `admin@example.com` / `Admin123!`

## Working contract

- **`AGENT.md`** — the operating manual every contributor (human or AI) reads before opening a file.
- **`CLAUDE.md`** — the project encyclopedia, deeper reference.
- **`design/`** — tone, brand, tokens, components. Read first before any UI change.

## The five non-negotiable laws (locked into AGENT.md)

1. Schema first, types derived. JSON Schema (`as const`) → `FromSchema<typeof X>`. No parallel `interface`.
2. No mappers. Prisma rows flow through services into SDK shapes returned verbatim.
3. GDPR by default. Sensitive columns encrypted via `@repo/crypto`. Mutating routes gated by `consentGuard` + `audit()`.
4. Realtime everywhere. New model → PG trigger → topic → invalidation map.
5. Design system mandatory. Read `design/*.md` first. `impeccable:audit` gates frontend PRs.

## License

(Add a license before publishing.)
