import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier, // Desactive les regles qui entrent en conflit avec Prettier
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    ".pnpm-store/**",
    // Test files
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    // Scripts et demos
    "scripts/**",
    "remotion-demo/**",
  ]),
  // Regles personnalisees - Orema N+ POS
  {
    rules: {
      // TypeScript strict
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "off", // Desactive car peut causer des problemes
      "@typescript-eslint/consistent-type-imports": ["warn", { prefer: "type-imports" }],
      "@typescript-eslint/ban-ts-comment": ["error", { "ts-nocheck": "allow-with-description" }],

      // React
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react/jsx-no-leaked-render": "warn",
      "react/self-closing-comp": "warn",
      // Desactive pour le contenu francais (apostrophes frequentes)
      "react/no-unescaped-entities": "off",
      // React Compiler: ref access during render (prevRef pattern) et setState en effect - en warning
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",

      // Import/Export
      "import/no-duplicates": "error",
      "import/first": "error",
      "import/newline-after-import": "error",

      // General
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always", { null: "ignore" }],
    },
  },
  // Regles specifiques pour les fichiers de test
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    rules: {
      // Relacher certaines regles dans les tests
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },
]);

export default eslintConfig;
