# Checkpoint agents

Spawn order is fixed. After each agent returns, summarise the diff to the user, wait for explicit `proceed`, then spawn the next.

Every agent prompt MUST start with this preamble so the agent ingests the working contract:

> Read `AGENT.md`, `CLAUDE.md`, `design/tone.md`, `design/tokens.md`, and `.claude/bootstrap-answers.json` BEFORE writing any code. Follow the type-cascade pattern (no parallel interfaces, no mappers). After every change run `pnpm lint && pnpm build` from repo root and fix any TypeScript error before declaring done. Update CLAUDE.md if you introduce new architectural facts.

Use the `Agent` tool with `subagent_type: "general-purpose"` (or a more specific type if it matches the task — e.g. `Plan` first when the user wants a plan-first checkpoint). Each agent runs in foreground; surface the result back to the user.

---

## 1. design-system-agent

```
description: Apply design system to all surfaces
prompt: |
  <preamble above>

  TASK: Take the four design markdown files in `design/` (tone, brand, tokens, components) and apply them consistently across every scaffolded surface.

  Steps:
  1. Read `.claude/bootstrap-answers.json` to learn surfaces (`marketing`, `dashboard`, `mobile`, `pro`).
  2. Run `impeccable:teach-impeccable` to lock the design context if not already done.
  3. For each surface in the answers:
     - Wire `design/tokens.md` into the actual token source: Tailwind config (marketing + dashboard), Tamagui or NativeWind config (mobile), CSS custom properties under `:root`.
     - Confirm OKLCh primary hue from `primary_hue`. Marketing site uses primary = patient hue; dashboard uses same; mobile uses same; pro (if present) shifts hue by ~25 for visual differentiation per CLAUDE.md.
     - Run `impeccable:normalize` against the surface to flush mismatches.
  4. Add a `<TokenStory />` component per surface that renders all tokens (colors, spacing, typography) for visual review.
  5. Commit as `chore(design): apply tokens + impeccable normalize`.

  REPORT: bullet list of surfaces touched, files modified count per surface, any inconsistencies impeccable flagged that you couldn't auto-fix.
```

---

## 2. auth-vertical-agent

```
description: Patient signup + login + email verify
prompt: |
  <preamble above>

  TASK: Implement the complete patient auth vertical end-to-end, mirroring the canonical flow.

  In scope (server, `apps/server`):
  - JWT access (30 min, includes `iss + aud + tokenVersion`) + refresh-token rotation in `RefreshToken` table with `familyId` + reuse detection.
  - `POST /auth/signup` → creates User, hashes password (argon2 or bcrypt), sets `emailVerified = false`, generates 6-digit code, persists `emailVerificationCode/Expires/Attempts`, fires email via `@repo/email`. Records preliminary `terms_of_service` + `privacy_policy` consent rows in same transaction.
  - `POST /auth/verify-email`, `POST /auth/resend-verification`.
  - `POST /auth/login` (rejects unverified or `deletedAt != null`, account-lockout tiers 10/20/30 → 1m/15m/1h).
  - `POST /auth/refresh` with rotation + reuse detection.
  - `POST /auth/forgot-password` (anti-enumeration: always 200) + `POST /auth/reset-password`.
  - All routes use schemas in `packages/server-sdk/src/schemas/auth.schema.ts`. NO parallel TS interfaces.
  - Audit + consent guards applied per the GDPR contract.

  In scope (dashboard, `apps/dashboard`):
  - Routes `/login`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password`.
  - Auth context + `setAccessTokenProvider` wired into the SDK fetcher.
  - Redirect-after-login flow (preserve deep link in `?redirect=` search param).

  In scope (mobile, `apps/mobile`, if present):
  - Same screens via Expo Router. Reuses `@repo/server-sdk` types verbatim.
  - Token persistence via SecureStore.

  After each block, run `pnpm lint && pnpm build`. Add `node:test` cases for `auth.service.ts` covering signup happy path, lockout progression, refresh-token reuse detection, password reset code expiry. NO frontend tests (Storybook covers visual).

  Commit as `feat(auth): patient signup + login + email verification + password reset`.

  REPORT: list of routes added, list of dashboard screens added, list of test cases added, any TODOs left for the user.
```

---

## 3. first-domain-agent

```
description: Scaffold the first CRUD domain end-to-end
prompt: |
  <preamble above>

  TASK: Scaffold the user's primary domain end-to-end following the 11-step type-cascade flow in ARCHITECTURE.md.

  Use the `use-sdk` skill for the SDK + server wiring portion. Read `.claude/bootstrap-answers.json` for `primary_domain` (PascalCase entity name) and `primary_domain_description`.

  Deliverables (all consumers of the SAME schema file):
  1. Prisma model `<Entity>` with `userId` FK, `createdAt`, `updatedAt`, `retentionExpiresAt`. Sensitive free-text columns stored as `encryptedX String`.
  2. JSON Schema `packages/server-sdk/src/schemas/<entity>.schema.ts` — list/get/create/update/delete bodies + responses.
  3. Error codes added to `error-codes.ts`.
  4. SDK client `packages/server-sdk/src/client/<entity>.ts`.
  5. Service `apps/server/src/routes/<entity>/<entity>.service.ts` — encrypt at write, decrypt at read, throws `HttpErrorResponse`.
  6. Module `apps/server/src/routes/<entity>/<entity>.module.ts` — `authenticate` + `consentGuard` + `audit()` config.
  7. PG trigger in `triggers.sql` + apply via `prisma db execute`.
  8. Topic auth in `realtime-manager.ts`.
  9. Dashboard hook `apps/dashboard/src/hooks/<entity>/`.
  10. Dashboard component + route `/app/<entity>` (list + detail bookmarkable per the resource-routing rule).
  11. Mobile screen (if mobile present): list + detail screens via Expo Router.
  12. Invalidation map updated. Realtime subscribed in `routes/_auth.tsx` + mobile auth provider.

  Backend tests: `<entity>.service.test.ts` with `node:test` + `mock.module()` pattern. Cover create/read/encryption/not-found/delete-cascade.

  Commit as `feat(<entity>): scaffold first domain end-to-end`.

  REPORT: list of files created, the trigger SQL applied, test coverage summary.
```

---

## 4. deploy-infra-agent

```
description: CDK infra + GitHub Actions migrations
prompt: |
  <preamble above>

  TASK: Set up production-ready infra-as-code + CI without merging anything.

  Read `.claude/bootstrap-answers.json` for surfaces (decides how many Fargate services to provision).

  Deliverables:
  1. `infra/cdk/` directory with stacks: `EcrStack` (one repo per Dockerised app), `BastionStack` (SSM tunnel to RDS), `MainStack` (VPC import + ECS cluster + Fargate services + ALBs + service discovery), `PipelineStack` (self-mutating CodePipeline: Source → SelfUpdate → Build → Deploy).
  2. `Dockerfile.<app>` per Fargate service. Run as `USER node`. Multi-stage build.
  3. `docker-compose.yml` already exists — DO NOT touch.
  4. `.github/workflows/migrate.yml` — Prisma migrate via SSM tunnel through bastion. OIDC auth (`AWS_MIGRATE_ROLE_ARN`). Concurrency `db-migrate` + `cancel-in-progress: false`.
  5. `.github/workflows/build.yml` — lint + build + node:test for every PR. Cache pnpm + Turborepo remote cache.
  6. README section: "First deploy" with the explicit `cdk deploy` order.
  7. CDK context vars documented in `cdk.json`: `vpcId`, `rdsSecurityGroupId`, `databaseUrl`, `certificateArn`, `imageTag`.

  GDPR/ISO note: every secret (encryption key, JWT secret, internal API key) lives in AWS Secrets Manager and is injected as `Secrets` parameter on the Fargate task definition — NEVER as plain `Environment`.

  Open a PR (`gh pr create`) titled `chore(infra): CDK stacks + migration workflow`. Do NOT merge.

  REPORT: PR URL, the four stack names, any IAM-role-creation steps the user must do manually before `cdk deploy`.
```

---

## After all four agents complete

Run a final compliance pass:

```
description: Compliance & quality gate
prompt: |
  Run these audits and return a single combined report:
    - `gdpr-compliance:gdpr-compliance` — audit the codebase for GDPR violations
    - `iso27001:iso27001` — gap analysis against Annex A controls
    - `security-review` — security review of all branches
    - `pnpm lint && pnpm build && pnpm test` from repo root
  REPORT: per-audit summary + any P0/P1 findings the user must address before first release.
```

The user reviews the combined report and decides what to fix before tagging `v0.1.0`.
