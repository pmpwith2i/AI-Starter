# Starter TODOs — known cleanups on first build

This list captures domain-residue that survived the strip-from-oncologo.it operation. Run `pnpm build` after `pnpm install` and the TypeScript compiler will surface most of these. Fix as you encounter them — none of them are conceptual blockers.

## Dashboard (`apps/dashboard`)

- **Stories of stripped components** — some `*.stories.tsx` files still reference deleted hook keys (`eventKeys`, `nutritionKeys`, etc.). Delete the offending stories or rewrite them once you scaffold the corresponding domain.
  ```bash
  find apps/dashboard/src/components -name '*.stories.tsx'
  ```
- **`profile-form.stories.tsx` / `clinical-profile-section.stories.tsx`** — may import from deleted hook keys. Either drop them or repoint to surviving keys.
- **`onboarding-flow`** — references `clinical-profile` keys. Either keep onboarding minimal (drop the clinical step) or scaffold the clinical-profile domain via `use-sdk` skill.
- **`useAuth`** (`hooks/use-auth.ts`) — may include props (`onboardingCompleted`) tied to clinical-profile data. Audit + simplify if you want a leaner auth context.
- **`routeTree.gen.ts` was deleted** — TanStack Router will regenerate it on `pnpm dev`. Just run dev once before committing.

## Server (`apps/server`)

- **`logger.ts`** — copied verbatim from oncologo. Check for any `oncologo`-specific tags / context fields.
- **`audit-log.service.ts`** — generic, but verify it doesn't reference deleted models. If it imports `Plan` / `CreditTransaction` / etc. from `@repo/db`, those don't exist in the starter schema.
- **`auth.service.ts`** — likely fine (auth is generic), but verify it doesn't try to read a `planId` field (oncologo-specific signup wired credits via a default Plan row).
- **`profile.service.ts`** — uses `@repo/crypto` for clinical-profile fields by default in oncologo; in the starter, profile is just first/last name. If `profile.service.ts` references `ClinicalProfile`, simplify.
- **`consent.service.ts`** — generic, should compile.
- **`account.service.ts` (DELETE /account)** — references many domain models for the cascade-delete path. Audit + simplify to only delete `RefreshToken`, `Notification`, `ConsentRecord` (or whatever survives in the starter schema).
- **`prisma.config.ts` + generated client** — re-generate via `pnpm --filter @repo/db exec prisma generate`.

## Website (`apps/website`)

- **`page.tsx`** (homepage) — composes deleted marketing widgets (`HeroSearch`, `BlogPreview`, etc.). Replace with a placeholder hero + CTA pointing at the dashboard.
- **`sitemap.ts`** — fetches blog/events/specialists; trim to just the static pages you ship.
- **`layout.tsx`** — may inject brand strings tied to oncologo. De-brand.

## Mobile (`apps/mobile`)

- **`(app)/index.tsx`** + **`(app)/_layout.tsx`** — likely import from deleted domain folders (`healthcare`, `nutrition`, etc.). Replace with minimal home screen + tab bar.
- **`hooks/notifications/`** — should work; verify the SDK import paths.

## Recommended first command sequence

```bash
pnpm install                                  # may warn about missing peer deps for stripped packages
pnpm --filter @repo/db exec prisma generate   # regenerate the typed client
pnpm --filter @repo/server build              # surfaces every server import error
pnpm --filter @repo/dashboard build           # then dashboard
pnpm --filter @repo/website build             # then website
pnpm --filter @repo/mobile typecheck          # mobile uses Expo's typecheck, not build
```

Fix each error in the file the compiler points to. Most fixes are 1–3 line deletions of an unused import or a now-empty case branch.

## When everything compiles

- Delete this file (`STARTER-TODO.md`).
- Run the `type-cascade-stack` skill from a Claude Code session inside the repo to start the interview + checkpoint-agent flow.
