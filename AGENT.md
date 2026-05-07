# AGENT.md — {{PROJECT_NAME}}

> This file is the **working contract** for any AI agent (or human) touching this repository. It is shorter than CLAUDE.md and meant to be read top-to-bottom before every session. CLAUDE.md is the encyclopedia; AGENT.md is the operating manual.

## What this project is

{{ONE_LINER}}

Audience: {{AUDIENCE}}.
Domain: {{CATEGORY}} / {{PRIMARY_DOMAIN}}.
Sensitive data tier: {{DATA_CLASS}}.

## Stack (locked — do not deviate without ADR)

- **Monorepo**: Turborepo + pnpm workspaces, Node 22, strict TypeScript
- **API**: Fastify 5 (`apps/server`)
- **DB**: Postgres + Prisma (`packages/db`), encrypted columns via `@repo/crypto`
- **SDK**: `@repo/server-sdk` — JSON Schemas + typed fetch client (single source of truth for types)
- **Dashboard**: Vite + React 19 + TanStack Router/Query + Tailwind + shadcn/ui (`apps/dashboard`)
- **Marketing**: Next.js 16 RSC (`apps/marketing`)
- **Mobile**: Expo + React Native + Expo Router + NativeWind (`apps/mobile`)
- **Tests**: `node:test` + `tsx` (server), Vitest (dashboard pure helpers), Storybook (visual)

## The five laws (non-negotiable)

1. **Schema first, types derived.** JSON Schema (`as const`) → `FromSchema<typeof X>` everywhere. NO parallel `interface`.
2. **No mappers.** Prisma rows flow through services into SDK shapes returned verbatim.
3. **GDPR by default.** Sensitive columns encrypted via `@repo/crypto`. Mutating routes gated by `consentGuard` + `audit()`.
4. **Realtime everywhere.** Every new model gets a PG trigger + topic + invalidation map entry (or a documented exception).
5. **Design system mandatory.** Read `design/*.md` BEFORE touching UI. Run `impeccable:audit` before any frontend PR.

## Workflow for ANY change

1. Read `.claude/bootstrap-answers.json` (interview answers — context for tone, audience, domain).
2. Read `design/tokens.md` if change touches UI.
3. Open a plan via the `Plan` agent if change is non-trivial (more than 1 file).
4. Implement using the type-cascade order:
   1. Prisma migration / schema
   2. JSON Schema in `@repo/server-sdk`
   3. Error codes
   4. SDK client
   5. Service (encrypts at boundary)
   6. Module (route)
   7. PG trigger + realtime auth
   8. Dashboard hook
   9. Dashboard component
   10. Mobile screen (if applicable)
   11. Tests (`node:test` for server, Vitest for pure helpers)
5. Run `pnpm lint && pnpm build && pnpm test` from repo root. Fix every error.
6. Update `CLAUDE.md` if a new architectural fact was introduced.
7. Commit with imperative subject; squash-merge to `main`.

## Forbidden patterns

- `any` / `@ts-ignore` (TypeScript strict, no exceptions)
- Parallel TS interfaces that mirror a JSON Schema shape (use `FromSchema`)
- Mapper functions between Prisma and SDK shapes
- `console.log` (use Pino logger)
- Hardcoding currency / dates / colors (use helpers + tokens)
- `===` on secrets (use `timingSafeEquals`)
- Plain HTTP for webhooks (use HMAC via `signWebhookBody`)
- Deleting from `audit_logs` or `consent_records` (DB-level REVOKE enforces this)

## When you're stuck

- Type errors after a schema change → run the cascade in order, top to bottom. The compiler is your map.
- LP/optimizer/agent failure → use the `diagnose` skill (reproduce → minimise → instrument → fix → regression-test).
- "Should I add this?" → does the change have a JSON Schema? If no, write the schema first.
- "Should I write a mapper?" → no.

## Tooling — installed skills your agents should use

- `use-sdk` — adding a new SDK domain
- `tanstack-router` — file-based routing setup
- `fastify-best-practices` — server route patterns
- `node-best-practices` — Node + TypeScript patterns
- `vercel-react-best-practices` — React/Next.js performance
- `vercel-composition-patterns` — component API design
- `impeccable:*` — design system + UI quality
- `gdpr-compliance:gdpr-compliance` — GDPR audit / DPA / privacy policy
- `iso27001:iso27001` — ISO 27001 control gap analysis
- `tdd` — when test-first is the right move
- `diagnose` — hard bugs / regressions

## Files an agent must read first

- `AGENT.md` (this file)
- `CLAUDE.md` (project encyclopedia)
- `design/tone.md` + `design/tokens.md` (any UI work)
- `.claude/bootstrap-answers.json` (interview context)
- The schema file for the domain you're touching: `packages/server-sdk/src/schemas/<domain>.schema.ts`
