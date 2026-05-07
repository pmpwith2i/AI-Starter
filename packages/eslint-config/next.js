import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import reactHooks from "eslint-plugin-react-hooks";
import reactPlugin from "eslint-plugin-react";
import nextPlugin from "@next/eslint-plugin-next";
import { config as baseConfig } from "./base.js";
import { defineConfig } from "eslint/config";

/**
 * A custom ESLint configuration for Next.js apps.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const nextConfig = defineConfig([
  ...baseConfig,
  eslintPluginPrettier,
  reactPlugin.configs.flat.recommended,
  reactHooks.configs.flat.recommended,
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  {
    ignores: ["node_modules", "dist", "build", "coverage", ".turbo", ".next"],
  },
  {
    settings: {
      react: {
        version: "19",
      },
    },
    rules: {
      "no-console": "error",
      "prettier/prettier": "error",
      "react/react-in-jsx-scope": "off",
    },
  },
]);
