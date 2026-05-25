# Design — Component Library

> Canonical component inventory. Every surface (marketing / dashboard / mobile) implements its own version of these, but the **API + tokens + behavior** must match this spec. Cross-surface drift is a bug.

## Component principles

1. **Composition over props** — boolean prop proliferation is a smell. Prefer compound components / render props (see `vercel-composition-patterns` skill).
2. **No accidental overrides** — components export a `className` slot only when truly needed; otherwise variants are exhaustive.
3. **Accessible defaults** — every interactive element has a discernible name. Icon-only buttons MUST carry `aria-label`. Tab/select elements use proper ARIA roles + keyboard navigation.
4. **Empty states are first-class** — every list/table/card grid component has an `<Empty />` variant that names the next action.
5. **Loading states use skeletons, not spinners** — skeletons preserve layout, spinners cause layout shift.

## Inventory (V1)

### Atoms

| Component | Variants | Notes |
|---|---|---|
| `Button` | primary / secondary / ghost / destructive — sizes sm/md/lg | Icon-only requires `aria-label` |
| `Input` | text / email / password / number / textarea | Always paired with `<Label>` |
| `Label` | required-marker variant | Reads `for` from `Input.id` |
| `Badge` | neutral / success / warning / danger / info | Used for status, counts |
| `Avatar` | with image / initials fallback | Initials = first letter of given+family name |
| `Spinner` | sm/md/lg | NOT for full-page loading — use Skeleton |
| `Skeleton` | rect / circle / text-line | Animation: `prefers-reduced-motion`-safe pulse |

### Molecules

| Component | Notes |
|---|---|
| `FormField` | Label + Input + helper-text + error-text. ARIA `aria-describedby` wired automatically. |
| `Card` | header / body / footer slots; default radius `lg`. |
| `Tabs` | shadcn pattern; arrow-key navigation; URL-driven state via TanStack Router search params (dashboard) |
| `Sheet` (mobile drawer) | side / bottom variants; drags-to-dismiss on mobile |
| `Toast` | success / error / info; ARIA `role="status"`; auto-dismisses after 5s |

### Organisms

| Component | Notes |
|---|---|
| `DashboardLayout` | sidebar + main content + sticky header (web). Built on the shadcn `Sidebar` pattern. |
| `MobileTabBar` | bottom nav for Expo; 3–5 destinations max |
| `DataTable` | TanStack Table + virtualization for >200 rows; pagination from SDK envelope |
| `EmptyState` | icon + heading + body + primary action |
| `Price` | currency formatter wrapping the pure helper in `lib/pricing/format-price.ts` |

### Marketing-specific

| Component | Notes |
|---|---|
| `HeroSearch` | search input + CTA above the fold |
| `TrustBar` | logos / metrics row |
| `ValuePillars` | 3–4 column feature grid; static, server-rendered |
| `FaqSection` | accordion + `faqJsonLd()` schema injection |
| `BlogCard` | cover + title + excerpt + reading-time |

### Forbidden by tone

- **Modal stacking** — only one modal open at a time; opening a second closes the first.
- **Confirm dialogs for safe actions** — only destructive ops or actions ≥ ⟨threshold⟩ require confirmation.
- **Hover-only affordances** on touch devices — every hover state has a tap-equivalent.

## Storybook coverage

Every component above lives under `apps/dashboard/src/components/<atomic>/` with a co-located `<name>.stories.tsx`. Stories that consume hooks (`useQuery`, `useMutation`) wrap in `QueryClientProvider` with `queryClient.setQueryData()` to pre-populate caches. Both `Default` and `Empty` stories required where applicable.

Mobile components mirror dashboard components but use Expo + NativeWind/Tamagui equivalents. They DO NOT reuse JSX directly — only tokens + behavior contracts.

## Adding a new component (process)

1. Sketch in `design/components.md` (this file) under the right category.
2. Run `impeccable:frontend-design` to draft a polished implementation.
3. Apply `impeccable:harden` for edge cases (loading, error, empty, overflow, i18n length).
4. Run `impeccable:audit` before opening a PR.
5. Add the Storybook story + accessibility check.

## Cross-surface contract checklist

- [ ] Same component name across surfaces (`Button` not `WebButton`/`MobileButton`).
- [ ] Same prop names + types where the surface allows (some props are platform-specific — document them).
- [ ] Same tokens consumed (no hard-coded colors).
- [ ] Same accessibility contract (label requirements, focus-visible, keyboard nav).
- [ ] Same empty/loading/error states.
