// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format

import { reactConfig } from "@repo/eslint-config/react";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...reactConfig,
  // TanStack Router route files export both `Route` (a non-component) and
  // a page component from the same file. This is the standard pattern but
  // trips react-refresh/only-export-components. Disable for route files.
  {
    files: ["src/routes/**/*.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  // TypeScript handles prop validation — the react/prop-types rule is
  // redundant and fires false positives on shadcn/ui components.
  {
    rules: {
      "react/prop-types": "off",
    },
  },
];
