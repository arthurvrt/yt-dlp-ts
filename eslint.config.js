import {defineConfig} from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  {parser: "@typescript-eslint/parser"},
  {plugins: ["@typescript-eslint/eslint-plugin", "unused-imports"]},
  {files: ["**/*.{js,mjs,cjs,ts}"]},
  {
    extends: [
      "plugin:@typescript-eslint/recommended",
      "plugin:prettier/recommended",
    ],
  },
  {ignorePatterns: [".eslintrc.js"]},
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: {globals: globals.browser},
  },
  {
    rules: {
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
  tseslint.configs.recommended,
]);
