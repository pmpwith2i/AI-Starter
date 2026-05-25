---
name: type-cascade-stack
description: Personalize a freshly cloned `metaimed-starter` (or compatible type-cascade monorepo) by interviewing the user about project name, primary domain, audience, tone and brand, then rendering AGENT.md, CLAUDE.md, and design/*.md from the answers, generating ENCRYPTION_KEY + JWT_SECRET_KEY, installing dependencies, bringing up docker-compose, applying the initial Prisma migration + triggers, and finally spawning checkpoint agents in sequence (design system → auth vertical → first CRUD domain → deploy infra) with user review between each. Use when the user opens a fresh clone of this starter and asks to "initialize the project", "personalize the starter", "set up the new project", "let's begin", "start building" or any first-day greenfield request. Skip cloning — assume the working directory is already a starter clone.
---

# type-cascade-stack

You're inside a **fresh clone of `metaimed-starter`** (or a compatible monorepo with the same shape). The starter ships:

- Turborepo + pnpm + Node 22 monorepo
- `apps/server` (Fastify 5) — auth + consent + legal + account + audit + realtime, no domain logic
- `apps/dashboard` (Vite + React 19 + TanStack Router/Query) — auth/profile/consent screens, no domain UI
- `apps/website` (Next.js 16) — marketing skeleton with privacy/terms placeholders
- `apps/mobile` (Expo) — auth screens skeleton
- `packages/{ai,crypto,email,db,server-sdk,eslint-config,typescript-config}` — pure infrastructure
- `design/`, `AGENT.md`, `CLAUDE.md` as **placeholder templates** waiting for personalization

Your job is the **first 30 minutes**: interview, personalize, install, then hand off to checkpoint agents who build the first vertical.

## Workflow (top-to-bottom — do not skip)

### 1. Interview the user

Run [INTERVIEW.md](INTERVIEW.md). Five sequential `AskUserQuestion` rounds collect: project name + pitch, category + primary domain, sensitive-data class, surfaces to keep, tone + brand hue — plus an optional sixth round for legal/company identity. **Stop and wait between rounds.** Persist answers to `.claude/bootstrap-answers.json`.

### 2. Confirm

Echo the answers back as one tight paragraph and ask: "Confirm or revisit which round?" Only proceed on explicit `yes`/`go`.

### 3. Personalize in place

```bash
bash .claude/skills/type-cascade-stack/scripts/personalize.sh
```

The script:
- reads `.claude/bootstrap-answers.json`
- substitutes **every** `{{...}}` token in `AGENT.md`, `CLAUDE.md`, `README.md`, `design/*.md`, and the source tree (`.ts`/`.tsx`/`.po`) — using interview answers, falling back to tone/category-derived defaults so no raw placeholder survives
- sets the root `package.json` name and the mobile `app.json` identity (name, slug, scheme, `com.<project>.app` bundle id)
- generates `ENCRYPTION_KEY` (`openssl rand -hex 32`) and `JWT_SECRET_KEY` into `apps/server/.env`, and creates `packages/db/.env` with `DATABASE_URL` (Prisma reads it from the db package's own cwd)
- runs `pnpm install` (the `@repo/db` `postinstall` runs `prisma generate`)
- starts `docker compose up -d` (Postgres)
- runs `pnpm --filter @repo/db exec prisma migrate dev --name init`
- applies `prisma/raw_sql/triggers.sql` + `prisma/raw_sql/permissions.sql` + seed
- removes any `apps/<surface>/` folder the user did NOT pick in round 4 (`marketing` → `apps/website`, `mobile` → `apps/mobile`)
- ends with a scan that lists any remaining `{{...}}` placeholders

> Native `apps/mobile/ios` + `android` are not committed — Expo regenerates them from `app.json` via `prebuild` on first `ios`/`android` run.

### 4. Generate the design system

Invoke `impeccable:teach-impeccable` to gather durable design context, then `impeccable:normalize` against `design/tokens.md`. The four design files become the source of truth every later agent consults before touching UI in `apps/website`, `apps/dashboard`, `apps/mobile`.

### 5. Spawn checkpoint agents

See [AGENTS.md](AGENTS.md) for the four prompts. Sequence is fixed; each depends on the previous one's commit:

1. **design-system-agent** — applies `design/tokens.md` + impeccable normalization to all surfaces. Pause for review.
2. **auth-vertical-agent** — patient signup, login, email verification, password reset using the canonical `domain-module` pattern. Pause for review.
3. **first-domain-agent** — scaffolds the `{{PRIMARY_DOMAIN}}` end-to-end (Prisma model + schema + module + service + SDK client + dashboard hook + component + mobile screen + PG trigger + realtime). Uses the `use-sdk` skill internally. Pause for review.
4. **deploy-infra-agent** — CDK stacks (ECR + bastion + ECS + pipeline) + `.github/workflows/migrate.yml`. Opens a PR; does NOT merge.

After each agent returns, summarize the diff to the user and wait for explicit `proceed` before spawning the next.

### 6. Compliance gate

Run the final pass per AGENTS.md (gdpr-compliance + iso27001 + security-review + `pnpm lint && build && test`). Surface findings to the user. Tag `v0.1.0` only after they're addressed.

## Core principles (locked into AGENT.md + CLAUDE.md)

1. **Schema first, types derived.** JSON Schema (`as const`) → `FromSchema<typeof X>`. No parallel `interface`.
2. **One SDK, three consumers.** Server validates with the schemas; dashboard + mobile import them + a typed fetch client.
3. **No mappers.** Prisma rows flow through services into SDK shapes returned verbatim. `mapEntityToDto` is forbidden.
4. **GDPR by default.** Sensitive columns encrypted via `@repo/crypto`. Mutating routes gated by `consentGuard` + `audit()`.
5. **Realtime everywhere.** New model → PG trigger → topic → invalidation map.
6. **Design system mandatory.** `design/*.md` is read first. `impeccable:audit` gates frontend PRs.

## Adding a new domain (post-personalization)

See [ARCHITECTURE.md](ARCHITECTURE.md) for the 11-step type-cascade flow.

## Deeper background

- [INTERVIEW.md](INTERVIEW.md) — the questions to ask, in order
- [AGENTS.md](AGENTS.md) — full prompts for the four checkpoint agents
- [ARCHITECTURE.md](ARCHITECTURE.md) — type-cascade pattern, no-mapper rule, error envelope
- [GDPR.md](GDPR.md) — encryption, consent, audit, retention, ISO 27001 mapping
- [REALTIME.md](REALTIME.md) — PG triggers, WebSocket auth, invalidation map

## Review checklist (run before declaring personalization done)

- [ ] `.claude/bootstrap-answers.json` written with all required keys.
- [ ] `pnpm install` clean, `pnpm lint` clean from repo root.
- [ ] `docker compose up -d` reports healthy Postgres.
- [ ] `packages/db/.env` exists with a `DATABASE_URL` (in sync with `apps/server/.env`).
- [ ] Initial Prisma migration applied; `triggers.sql` + `permissions.sql` executed.
- [ ] `design/tone.md`, `brand.md`, `tokens.md`, `components.md` populated with substituted values.
- [ ] `AGENT.md` + `CLAUDE.md` reflect the interview answers — the script's leftover-placeholder scan reports **none**.
- [ ] `apps/server/.env` has non-empty `ENCRYPTION_KEY` and `JWT_SECRET_KEY`.
- [ ] Mobile (if kept): `app.json` identity is set; no "Oncologo"/placeholder strings remain.
- [ ] Surfaces the user did NOT pick are removed.
