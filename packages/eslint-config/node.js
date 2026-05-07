import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import { config as baseConfig } from "./base.js";
import { defineConfig } from "eslint/config";

/**
 * A custom ESLint configuration for Node.js services.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const nodeConfig = defineConfig([
  ...baseConfig,
  eslintPluginPrettier,
  {
    ignores: [
      "node_modules",
      "dist",
      "build",
      "coverage",
      "cdk.out",
      ".turbo",
    ],
  },
  {
    rules: {
      "no-console": "error",
      "prettier/prettier": "error",
    },
  },
]);
