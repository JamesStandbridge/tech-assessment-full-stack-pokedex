import eslintReact from "@eslint-react/eslint-plugin";
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores([
    "dist",
    "coverage",
    "node_modules",
    "src/api/schema.gen.ts",
    ".features-gen",
    "playwright-report",
    "test-results",
    ".lighthouseci",
  ]),
  js.configs.recommended,
  {
    files: ["**/*.{js,cjs}"],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat["recommended-latest"],
      jsxA11y.flatConfigs.strict,
      eslintReact.configs["strict-type-checked"],
    ],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.browser },
    },
    rules: {
      "@typescript-eslint/switch-exhaustiveness-check": [
        "error",
        { considerDefaultExhaustiveForUnions: false, requireDefaultForNonUnion: true },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/prefer-readonly": "error",
      "no-restricted-syntax": [
        "error",
        { selector: "TSEnumDeclaration", message: "Use a union of string literals." },
        { selector: "ExportDefaultDeclaration", message: "Use named exports." },
      ],
      "max-lines": ["error", { max: 200 }],
      "max-lines-per-function": ["error", { max: 40, skipBlankLines: true, skipComments: true }],
      complexity: ["error", 10],
      "max-params": ["error", 3],
      "max-depth": ["error", 3],
      "no-console": "error",
      eqeqeq: "error",
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "e2e/**/*.ts"],
    rules: { "max-lines-per-function": "off" },
  },
  {
    files: ["src/test/recorded/**"],
    rules: { "max-lines": "off" },
  },
  {
    files: ["scripts/**/*.ts"],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ["*.config.ts", "e2e/playwright.config.ts"],
    languageOptions: { globals: { ...globals.node } },
    rules: { "no-restricted-syntax": "off" },
  },
]);
