import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { config as baseConfig } from "./base.js";
import { defineConfig } from "eslint/config";
import reactPlugin from "eslint-plugin-react";
import pluginRouter from '@tanstack/eslint-plugin-router'

/**
 * A custom ESLint configuration for React apps.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const reactConfig = defineConfig([
  ...baseConfig,
  eslintPluginPrettier,
  ...pluginRouter.configs['flat/recommended'],
  reactPlugin.configs.flat.recommended,
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,
  {
    ignores: [
      "node_modules",
      "dist",
      "build",
      "coverage",
      ".turbo",
    ],
  },
  {
    rules: {
      "no-console": "error",
      "prettier/prettier": "error",
      "react/react-in-jsx-scope": "off",
    },
  },
]);
