import { defineConfig } from "@lingui/cli";

export default defineConfig({
  sourceLocale: "it",
  locales: ["it"],
  catalogs: [
    {
      path: "<rootDir>/src/locales/{locale}/messages",
      include: ["src"],
    },
  ],
});
