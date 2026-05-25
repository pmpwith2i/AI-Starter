# Mobile (`@repo/mobile`)

Expo + Expo Router + NativeWind companion app. Reuses `@repo/server-sdk` types
directly — no mobile-specific DTOs.

## Stack

- **Expo SDK 54** (React 19.1, React Native 0.81, New Architecture enabled)
- **Expo Router 6** — file-based routing under `app/`
- **NativeWind v4** + Tailwind — utility classes sharing the dashboard's OKLCh tokens
- **expo-secure-store** — token storage for bearer auth

## Identity

App name, slug, scheme, and bundle identifier live in `app.json` — the single
source of truth. `personalize.sh` fills them from your interview answers
(`name`, `<project>-mobile` slug, `com.<project>.app` bundle id).

## Setup

From the monorepo root:

```bash
pnpm install
```

## Run

```bash
pnpm --filter @repo/mobile ios       # iOS Simulator
pnpm --filter @repo/mobile android   # Android Emulator
pnpm --filter @repo/mobile start     # Expo Dev Server (QR + multi-target)
```

Native `ios/` and `android/` directories are **not committed** (Continuous
Native Generation). Expo runs `prebuild` automatically on first `ios`/`android`,
generating them from `app.json`. To regenerate explicitly after changing app
identity or plugins:

```bash
pnpm --filter @repo/mobile exec expo prebuild --clean
```

## Structure

```
apps/mobile/
├── app/                   # Expo Router routes (file-based)
│   ├── _layout.tsx        # Root layout
│   └── ...
├── lib/utils.ts           # cn() for conditional NativeWind classes
├── global.css             # Tailwind base + components + utilities
├── tailwind.config.js     # OKLCh tokens inline (mirrors dashboard)
├── metro.config.js        # pnpm monorepo + NativeWind
├── babel.config.js        # babel-preset-expo + nativewind jsxImportSource
├── app.json               # Expo config (identity, scheme, plugins)
└── package.json
```

## Design tokens

Tokens (colors, radii) are **copied inline** into `tailwind.config.js` from the
dashboard (`apps/dashboard/src/styles.css`). Extract a `packages/design-tokens`
only once the drift becomes painful — not before.

## Performance anti-patterns

Rules earned from real bugs. **Do not re-introduce them.**

1. **No continuous animation on full-screen layers.** A `View`/`LinearGradient`
   that covers the viewport must not drive `useAnimatedStyle` from a value that
   changes every frame (`withRepeat`, infinite loops). Each change forces the
   GPU to recompose the whole screen; layered over a scrolling list it causes
   visible jank. Small contained animations (a pulsing dot, a single-card
   shimmer, a 100ms press scale) are fine.
2. **`GlassView` with `isInteractive` doesn't belong behind scrolling content.**
   The tactile distortion costs GPU on every scroll frame.
3. **Long lists → `FlatList`, not `ScrollView` + `.map()`.** Past ~10–15 items
   use `FlatList` (`windowSize={5}`, `maxToRenderPerBatch={6}`,
   `removeClippedSubviews`). Put the header in `ListHeaderComponent`; never nest
   a `FlatList` inside a `ScrollView` on the same axis.
4. **Remote images → `expo-image`**, not RN `Image`. Use
   `cachePolicy="memory-disk"`, `contentFit="cover"`, `transition={180}`.
5. **Expensive validation/transforms inside `useMemo`.** Pages with realtime
   subscriptions re-render on every WebSocket tick; memoize any large
   `safeParse`/transform on the payload.
6. **Custom tab bars use `router.replace`, not `router.push`** — `push`
   accumulates screens on the stack.
7. **Main→main section changes use `animation: "fade"`**, not the default
   slide, for tab-style navigation.

When adding a screen or widget, re-check these. If you must violate one, leave a
comment explaining why.
