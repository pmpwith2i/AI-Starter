/// <reference types="vitest" />
import { defineConfig, loadEnv } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import tsconfigPaths from "vite-tsconfig-paths";

import { tanstackRouter } from "@tanstack/router-plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { lingui } from "@lingui/vite-plugin";

const config = defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return {
    plugins: [
      devtools(),
      tsconfigPaths({ projects: ["./tsconfig.json"] }),
      tailwindcss(),
      tanstackRouter({ target: "react", autoCodeSplitting: true }),
      viteReact({
        babel: {
          plugins: ["@lingui/babel-plugin-lingui-macro"],
        },
      }),
      lingui(),
    ],
    server: {
      proxy: {},
    },
    test: {
      // Default environment is `node` so pure-helper tests stay fast.
      // Future component tests can opt-in per file with the magic
      // comment `// @vitest-environment jsdom` at the top of the file.
      environment: "node",
      globals: false,
      include: ["src/**/*.test.{ts,tsx}"],
    },
  };
});

export default config;
