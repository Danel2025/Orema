import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Environnement de test
    environment: "jsdom",

    // Fichiers a inclure/exclure
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"],

    // APIs globals (describe, it, expect, etc.)
    globals: true,

    // Fichiers de setup
    setupFiles: ["./tests/setup.ts"],

    // Configuration de couverture
    coverage: {
      provider: "v8",
      enabled: false, // Activer avec --coverage
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: [
        "lib/**/*.ts",
        "actions/**/*.ts",
        "schemas/**/*.ts",
        "stores/**/*.ts",
        "components/**/*.tsx",
      ],
      exclude: ["**/*.test.ts", "**/*.spec.ts", "**/index.ts", "**/*.d.ts"],
      thresholds: {
        // Seuils de couverture
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // Reporters
    reporters: ["default"],

    // Options de mocking
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,

    // Sequence
    sequence: {
      shuffle: false,
    },

    // Pool (threads pour performance)
    pool: "threads",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
