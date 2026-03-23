import { defineConfig, devices } from "@playwright/test";

/**
 * Configuration Playwright pour les tests E2E
 * Orema N+ POS - Gabon
 */

export default defineConfig({
  // Dossier des tests E2E
  testDir: "./tests/e2e",

  // Execution en parallele
  fullyParallel: true,

  // Echouer si test.only est laisse dans le code
  forbidOnly: !!process.env.CI,

  // Nombre de retries en CI
  retries: process.env.CI ? 2 : 0,

  // Workers en parallele
  workers: process.env.CI ? 1 : undefined,

  // Reporter
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],

  // Configuration globale des tests
  use: {
    // URL de base (serveur de dev Next.js)
    baseURL: "http://localhost:3000",

    // Collecter les traces en cas d'echec
    trace: "on-first-retry",

    // Screenshots en cas d'echec
    screenshot: "only-on-failure",

    // Videos en cas d'echec
    video: "on-first-retry",

    // Timeout pour les actions
    actionTimeout: 10000,

    // Timeout pour la navigation
    navigationTimeout: 30000,

    // Ignorer les erreurs HTTPS en dev
    ignoreHTTPSErrors: true,

    // Locale francais (Gabon)
    locale: "fr-GA",

    // Timezone Gabon
    timezoneId: "Africa/Libreville",
  },

  // Timeout global des tests
  timeout: 60000,

  // Expect timeout
  expect: {
    timeout: 10000,
  },

  // Projets (navigateurs)
  projects: [
    // Tests sur Chrome (principal pour POS)
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },

    // Tests sur Firefox
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 1280, height: 800 },
      },
    },

    // Tests sur tablette (usage courant en restauration)
    {
      name: "tablet",
      use: {
        ...devices["iPad Pro 11"],
      },
    },

    // Tests sur mobile (pour les livreurs)
    {
      name: "mobile",
      use: {
        ...devices["Pixel 7"],
      },
    },
  ],

  // Serveur de developpement
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  // Dossier de sortie
  outputDir: "test-results",
});
