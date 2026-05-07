# Design — Brand

> Single source of truth for brand vocabulary. Marketing site, dashboard, and mobile all consume the values defined here via `tokens.md`.

## Brand essence

- **Name**: {{PROJECT_NAME}}
- **One-liner**: {{ONE_LINER}}
- **Why we exist**: {{MISSION}}

## Color story

### Primary

- **Hue (OKLCh)**: `{{PRIMARY_HUE}}` — see `tokens.md` for the full ramp.
- **Why this hue**: {{PRIMARY_REASON}} (e.g. "Steel blue conveys clinical trust without sterility.")

### Secondary / accent

- **Hue (OKLCh)**: `{{SECONDARY_HUE}}` — used sparingly for status, badges, success states.

### Per-surface differentiation

If multiple platforms exist (patient + pro), each shifts the hue by ~25° to avoid identity confusion (e.g. patient 245, pro 220). Document the offsets here:

- Patient: `oklch(L C {{PRIMARY_HUE}})`
- Pro (if applicable): `oklch(L C {{PRO_HUE}})`
- Marketing: same as patient

### Forbidden combinations

- Pure black on pure white (use neutrals from the ramp)
- Two saturated hues fighting (one accent at a time)
- Red for anything except destructive actions

## Typography

- **Sans**: {{FONT_SANS}} (default: Geist) — body, headings, navigation
- **Mono**: {{FONT_MONO}} (default: Geist Mono) — code, data, identifiers
- **Hierarchy**: 6 levels — h1 (display), h2 (section), h3 (subsection), body, body-small, caption

## Iconography

- **Library**: {{ICON_LIBRARY}} (default: Lucide React)
- **Stroke weight**: 1.5px consistently
- **Size scale**: 16 / 20 / 24 / 32 px
- **Filled vs outline**: outline by default; filled only for active/selected states

## Motion

- **Default**: 150ms ease-out for state changes, 250ms for layout shifts
- **Forbidden**: bouncy springs on full-viewport elements (mobile lag risk)
- **`prefers-reduced-motion`**: respected at all times — fall back to instant transitions

## Logo + assets

- **Logo SVG**: `apps/marketing/public/logo.svg` (fill via `currentColor` so it adapts to themes)
- **Favicon / app icon**: generated dynamically via Next `icon.tsx` + Expo `app.json` icon
- **OG image**: generated via `ImageResponse` in marketing `app/opengraph-image.tsx`

## Voice / tagline candidates

{{TAGLINE_CANDIDATES}}

## Anti-patterns

- Stock photography of fake-smiling people
- AI-generated brand-style illustrations (uncanny valley)
- Generic SaaS landing-page hero with floating UI screenshots
- Hero copy that brags about features instead of stating outcomes
