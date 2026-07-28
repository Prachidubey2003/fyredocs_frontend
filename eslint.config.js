// ESLint configuration (flat config).
//
// Two rule choices below are deliberate and are the reason for patterns you will
// see across src/:
//
//   - react-refresh/only-export-components is "warn", not "error". A file that
//     exports both a component and a constant breaks Fast Refresh for that
//     module, which is a dev-experience cost rather than a defect — so it warns,
//     and the ~14 files where the mixed export is intentional carry a top-of-file
//     `/* eslint-disable react-refresh/only-export-components */`. Those
//     directives must stay on line 1 to apply file-wide.
//
//   - @typescript-eslint/no-unused-vars is OFF, matching noUnusedLocals and
//     noUnusedParameters being false in tsconfig.json. The practical effect is
//     that dead variables are not flagged anywhere, so nothing catches a leftover
//     binding after a refactor. Turning it back on is worthwhile; expect an
//     initial batch of findings.
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
);
