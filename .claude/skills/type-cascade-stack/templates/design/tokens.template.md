# Design — Tokens

> Canonical token table. Every consumer (Tailwind config, NativeWind config, CSS custom properties) reads these values verbatim. **Never define a token in code that isn't listed here first.**

## Color (OKLCh, perceptually uniform)

### Primary ramp — hue `{{PRIMARY_HUE}}`

| Token | Light | Dark |
|---|---|---|
| `primary-50` | `oklch(0.97 0.02 {{PRIMARY_HUE}})` | `oklch(0.18 0.04 {{PRIMARY_HUE}})` |
| `primary-100` | `oklch(0.94 0.04 {{PRIMARY_HUE}})` | `oklch(0.22 0.06 {{PRIMARY_HUE}})` |
| `primary-300` | `oklch(0.78 0.10 {{PRIMARY_HUE}})` | `oklch(0.45 0.12 {{PRIMARY_HUE}})` |
| `primary-500` | `oklch(0.58 0.14 {{PRIMARY_HUE}})` | `oklch(0.65 0.14 {{PRIMARY_HUE}})` |
| `primary-700` | `oklch(0.42 0.12 {{PRIMARY_HUE}})` | `oklch(0.78 0.12 {{PRIMARY_HUE}})` |
| `primary-900` | `oklch(0.28 0.08 {{PRIMARY_HUE}})` | `oklch(0.92 0.06 {{PRIMARY_HUE}})` |

### Neutral ramp (for text + surfaces)

| Token | Light | Dark |
|---|---|---|
| `neutral-50` | `oklch(0.99 0 0)` | `oklch(0.12 0 0)` |
| `neutral-200` | `oklch(0.92 0 0)` | `oklch(0.22 0 0)` |
| `neutral-500` | `oklch(0.55 0 0)` | `oklch(0.55 0 0)` |
| `neutral-700` | `oklch(0.30 0 0)` | `oklch(0.78 0 0)` |
| `neutral-900` | `oklch(0.10 0 0)` | `oklch(0.95 0 0)` |

### Semantic

- `success`: `oklch(0.65 0.15 145)`
- `warning`: `oklch(0.78 0.16 75)`
- `danger`: `oklch(0.58 0.20 25)`
- `info`: `oklch(0.65 0.10 230)`

## Spacing (4px base)

`0, 1=4px, 2=8px, 3=12px, 4=16px, 5=20px, 6=24px, 8=32px, 10=40px, 12=48px, 16=64px, 20=80px`

## Radius

`sm=4px, md=8px, lg=10px (default for dashboard/mobile), xl=16px, full=9999px`

Marketing site uses `md=8px` as default (slightly smaller, more "professional" feel).

## Shadow (8 levels, oklch-based for theme parity)

```css
--shadow-xs: 0 1px 2px oklch(0 0 0 / 0.05);
--shadow-sm: 0 1px 3px oklch(0 0 0 / 0.08);
--shadow-md: 0 4px 6px oklch(0 0 0 / 0.10);
--shadow-lg: 0 10px 15px oklch(0 0 0 / 0.12);
--shadow-xl: 0 20px 25px oklch(0 0 0 / 0.14);
```

## Typography scale

| Token | Size | Line-height | Use |
|---|---|---|---|
| `display` | 48px | 1.1 | Hero headlines |
| `h1` | 32px | 1.2 | Page titles |
| `h2` | 24px | 1.25 | Section headings |
| `h3` | 20px | 1.3 | Subsection headings |
| `body` | 16px | 1.5 | Default body |
| `body-sm` | 14px | 1.5 | Secondary body |
| `caption` | 12px | 1.4 | Metadata, labels |

## Font weights

`regular=400, medium=500, semibold=600, bold=700`

## Z-index scale

`base=0, sticky=10, dropdown=50, modal=100, toast=200, tooltip=500`

## Theme storage

- **Dashboard / mobile**: `localStorage` key `{{PROJECT_KEBAB}}-ui-theme` → `light | dark | system`
- **Marketing site**: same key, hydrated via `<ThemeProvider>` from a cookie for SSR no-flash

## How agents apply this

1. **Marketing (Next.js)**: token table → `apps/marketing/src/styles/globals.css` as CSS custom properties under `:root` + `[data-theme="dark"]`. Tailwind config imports them via `theme.extend.colors`.
2. **Dashboard (Vite)**: same table → `apps/dashboard/src/styles/globals.css` + `tailwind.config.ts`.
3. **Mobile (Expo)**: same table → `apps/mobile/src/theme/tokens.ts` exporting a typed `tokens` object consumed by NativeWind or Tamagui.

When adding a new token: add it here FIRST, then run `impeccable:normalize` against each surface to propagate.
