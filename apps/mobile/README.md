# Oncologo Mobile (`@repo/mobile`)

App React Native paziente — Expo SDK 54 + Expo Router 6 + NativeWind v4.

## Stack

- **Expo SDK 54** (React 19.1, React Native 0.81, New Architecture abilitata)
- **Expo Router 6** — routing file-based su `app/`
- **NativeWind v4.2** + Tailwind v3 — utility classes coi token oklch della dashboard
- **expo-glass-effect** — Liquid Glass su iOS 26+, fallback automatico altrove
- **expo-secure-store** — token storage per auth bearer (Step 2)

## Targets

- iOS 16+ (Glass Effect come progressive enhancement su iOS 26+)
- Android API 24+ (Android 7+)
- Bundle ID: `it.oncologo.app`

## Setup

Dalla root del monorepo:

```bash
pnpm install
```

## Run

```bash
pnpm --filter @repo/mobile ios       # Simulator iOS
pnpm --filter @repo/mobile android   # Emulator Android
pnpm --filter @repo/mobile start     # Expo Dev Server (QR + multi-target)
```

Al primo avvio Expo invoca `prebuild` automaticamente e genera le directory native `ios/` e `android/` (gitignorate).

## Struttura

```
apps/mobile/
├── app/
│   ├── _layout.tsx        # Root layout (StatusBar, SafeAreaProvider, Stack)
│   └── index.tsx          # Home placeholder con header GlassView
├── lib/
│   └── utils.ts           # cn() per classi NativeWind condizionali
├── global.css             # Tailwind base + components + utilities
├── tailwind.config.js     # Token oklch inline (no design-tokens package per ora)
├── metro.config.js        # Monorepo pnpm + NativeWind
├── babel.config.js        # babel-preset-expo + jsxImportSource nativewind
├── tsconfig.json          # extends expo/tsconfig.base
├── app.json               # Config Expo (bundle ID, scheme, plugins)
└── package.json
```

## Note design system

I token (colori, raggi) sono **copiati inline** in `tailwind.config.js` dalla dashboard (`apps/dashboard/src/styles.css`). Quando il drift diventa percepibile estraiamo `packages/design-tokens` — non prima.

## Performance — anti-patterns

Regole nate da bug reali risolti. **Non re-introdurli**.

### 1. Niente `withRepeat` (o qualsiasi animazione continua) su layer full-screen

**Regola:** un `<View>` o `<LinearGradient>` che copre il viewport (`StyleSheet.absoluteFillObject` / `flex: 1`) non deve avere `useAnimatedStyle` legato a un valore che cambia di continuo (`withRepeat`, loop su shared value, transform/opacity animate forever).

**Perché:** ogni cambio di valore su un layer full-screen forza la GPU iOS a ricomporre l'intero schermo a quel frame. Sovrapposto a una `FlatList` o `ScrollView` che scorre, lo scroll diventa visibilmente jank. Il sintomo è: pagine main (con il backdrop animato) laggy, pagine di dettaglio (senza il backdrop) smooth.

**Caso storico:** `AppBackdrop` aveva 2 `AnimatedLinearGradient` full-screen con loop infiniti di opacity + translateY. Tutte le pagine principali (Oggi, Nutrizione, Eventi, Corsi, Profilo) erano laggy; le detail (`[eventId]`, `[courseId]`, `[planId]`, `[bundleId]`) — che non usano `AppBackdrop` — erano smooth. Sostituito con un singolo `LinearGradient` statico = jank sparito istantaneamente.

**Eccezione:** animazioni contenute in elementi piccoli (un dot pulsante, una shimmer su una card singola, un MotionPressable scale di 100ms) sono OK. Il problema è la dimensione del layer animato + la durata infinita.

**Reference:** `components/ui/mobile-chrome.tsx` → docstring di `AppBackdrop`.

### 2. `GlassView` con `isInteractive` non va dietro contenuto che scorre

**Regola:** se un `<GlassView>` (Liquid Glass iOS 26+) è sovrapposto a una lista che scorre, NON usare `isInteractive`. La distorsione tattile costa GPU su ogni frame di scroll.

**Caso storico:** `GlassTabBar` con `isInteractive` causava ricomputazione blur ad ogni scroll della lista sotto. Il feedback tattile è già gestito dai `MotionPressable` interni — `isInteractive` era pura decorazione.

### 3. Liste lunghe = `FlatList`, non `ScrollView` + `.map()`

**Regola:** se una lista può superare 10-15 elementi (eventi, corsi, pasti, lezioni) usa `FlatList` con `windowSize={5}` + `maxToRenderPerBatch={6}` + `removeClippedSubviews`. Il header sopra la lista va in `ListHeaderComponent`, **mai annidare `FlatList` dentro `ScrollView`** nello stesso asse (annulla la virtualizzazione).

**Caso storico:** events list aveva 30+ card con hero image + 2 LinearGradient stacked + ombra dentro un `ScrollView`. ~3600 view native montate in una volta. Convertito a `FlatList` → ~⅓ di view montate.

### 4. Cover/avatar = `expo-image`, non `Image` di react-native

**Regola:** ogni `<Image>` con `source` remoto usa `expo-image` con `cachePolicy="memory-disk"`, `contentFit="cover"`, `transition={180}`. Niente flicker bianco al ricarico, cache disco gratuita.

### 5. Costose validazioni Zod (o trasformazioni dati) sempre dentro `useMemo`

**Regola:** se chiami `validateNutritionPayload` (o qualsiasi `safeParse` su payload grandi) nel body di un componente che vive su una pagina con realtime subscriptions, **wrap in `useMemo([raw])`**. Le pagine main si re-renderizzano a ogni evento WebSocket — senza memo riparseresti il payload N volte.

**Caso storico:** `today-widget.tsx` riparseva l'intero piano nutrizionale (centinaia di campi Zod) ad ogni tick dei 4 topic realtime sottoscritti dalla home. `useMemo` legato a `plan?.content` → 1 sola volta.

### 6. Tab bar custom = `router.replace`, non `router.push`

**Regola:** in una bottom tab bar custom (non `<Tabs>` nativo), i tap fanno `router.replace`. Con `router.push` ogni tap accumula uno screen sullo Stack, e con i custom layout di Stack non c'è "tab persistence" automatica.

### 7. Per cambi di sezione main → main, usa `animation: "fade"`, non lo slide di default

**Regola:** in `app/(app)/_layout.tsx`, lo Stack usa `animation: "fade"` con `animationDuration: 180`. La default slide-from-right percepita come "shift" è poco adatta a una navigazione tab-style.

---

Quando aggiungi una nuova schermata o un nuovo widget, ricontrolla queste 7. Se devi violarne una, scrivi un commento sul perché.
