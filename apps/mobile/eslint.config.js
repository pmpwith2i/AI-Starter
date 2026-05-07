import { reactConfig } from "@repo/eslint-config/react";
import globals from "globals";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...reactConfig,
  {
    ignores: [
      "node_modules",
      ".expo",
      "ios",
      "android",
      "dist",
      "expo-env.d.ts",
      "nativewind-env.d.ts",
      // Expo + Metro + Babel config files use CommonJS — exclude them from
      // the strict TS/ESM rules.
      "babel.config.js",
      "metro.config.js",
      "tailwind.config.js",
      "*.config.cjs",
    ],
  },
  // Expo Router file routes — allow non-component exports (Stack screen
  // options often live alongside the component).
  {
    files: ["app/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  // Mobile UI primitives + auth context export both components and shared
  // helpers. Allow the export shape upstream RN libs use as-is. Reanimated
  // shared values (`scale.value = …`) are flagged by react-compiler's
  // immutability check — that's a known incompatibility with reanimated.
  {
    files: ["components/ui/**/*.{ts,tsx}", "lib/auth/auth-context.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
    },
  },
  // Disable React 19 / react-compiler strict hints across mobile while
  // upstream RN libs catch up. Re-enable per-file as you refactor.
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react/prop-types": "off",
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        __DEV__: "readonly",
      },
    },
  },
];
