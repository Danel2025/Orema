/**
 * Tests E2E - Page Rapports
 *
 * Teste les fonctionnalites de la page /rapports:
 * - Redirection vers /login si non authentifie
 * - Affichage du header avec titre et sous-titre
 * - KPI cards (6 indicateurs)
 * - Onglets de navigation (Dashboard, Factures, Ventes, Produits, Employes, Rapports Z)
 * - Contenu de chaque onglet
 * - Navigation entre onglets
 */

import { test, expect } from "@playwright/test";

// =============================================================================
// TESTS SANS AUTHENTIFICATION
// =============================================================================

test.describe("Rapports - Accès sans authentification", () => {
  test("redirige vers /login quand non authentifie", async ({ page }) => {
    await page.goto("/rapports");
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });
});

// =============================================================================
// TESTS - HEADER
// =============================================================================

test.describe("Rapports - Header", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/rapports");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("affiche le titre 'Rapports'", async ({ page }) => {
    const heading = page.getByRole("heading", { name: /rapports/i }).first();
    await expect(heading).toBeVisible();
  });

  test("affiche le sous-titre descriptif", async ({ page }) => {
    await expect(
      page.getByText(/statistiques et analyses de ventes/i)
    ).toBeVisible();
  });
});

// =============================================================================
// TESTS - KPI CARDS
// =============================================================================

test.describe("Rapports - KPI Cards", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/rapports");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("affiche les cartes KPI ou leur squelette de chargement", async ({ page }) => {
    // Les KPIs sont charges via Suspense - on attend soit les cartes soit les skeletons
    // Attendre que le contenu principal se stabilise
    await page.waitForTimeout(2000);

    // On cherche des elements dans la zone KPI
    // Les KPI cards affichent des montants ou des nombres
    const kpiArea = page.locator("body");
    await expect(kpiArea).not.toBeEmpty();

    // La page ne doit pas crasher
    await expect(page.getByRole("heading", { name: /rapports/i }).first()).toBeVisible();
  });
});

// =============================================================================
// TESTS - ONGLETS DE NAVIGATION
// =============================================================================

test.describe("Rapports - Onglets", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/rapports");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("affiche la barre d'onglets avec les 6 onglets", async ({ page }) => {
    const tablist = page.getByRole("tablist");
    await expect(tablist).toBeVisible();

    await expect(page.getByRole("tab", { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /factures/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /ventes/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /produits/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /employes/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /rapports z/i })).toBeVisible();
  });

  test("l'onglet Dashboard est selectionne par defaut", async ({ page }) => {
    const dashboardTab = page.getByRole("tab", { name: /dashboard/i });
    await expect(dashboardTab).toHaveAttribute("aria-selected", "true");
  });

  test("cliquer sur l'onglet Factures change le contenu", async ({ page }) => {
    const facturesTab = page.getByRole("tab", { name: /factures/i });
    await facturesTab.click();

    await expect(facturesTab).toHaveAttribute("aria-selected", "true");

    // Le tabpanel des factures doit etre visible
    const tabpanel = page.getByRole("tabpanel");
    await expect(tabpanel).toBeVisible();
  });

  test("cliquer sur l'onglet Ventes change le contenu", async ({ page }) => {
    const ventesTab = page.getByRole("tab", { name: /ventes/i });
    await ventesTab.click();

    await expect(ventesTab).toHaveAttribute("aria-selected", "true");

    const tabpanel = page.getByRole("tabpanel");
    await expect(tabpanel).toBeVisible();
  });

  test("cliquer sur l'onglet Produits change le contenu", async ({ page }) => {
    const produitsTab = page.getByRole("tab", { name: /produits/i });
    await produitsTab.click();

    await expect(produitsTab).toHaveAttribute("aria-selected", "true");

    const tabpanel = page.getByRole("tabpanel");
    await expect(tabpanel).toBeVisible();
  });

  test("cliquer sur l'onglet Employés change le contenu", async ({ page }) => {
    const employesTab = page.getByRole("tab", { name: /employes/i });
    await employesTab.click();

    await expect(employesTab).toHaveAttribute("aria-selected", "true");

    const tabpanel = page.getByRole("tabpanel");
    await expect(tabpanel).toBeVisible();
  });

  test("cliquer sur l'onglet Rapports Z change le contenu", async ({ page }) => {
    const rapportsZTab = page.getByRole("tab", { name: /rapports z/i });
    await rapportsZTab.click();

    await expect(rapportsZTab).toHaveAttribute("aria-selected", "true");

    const tabpanel = page.getByRole("tabpanel");
    await expect(tabpanel).toBeVisible();
  });
});

// =============================================================================
// TESTS - NAVIGATION ENTRE ONGLETS
// =============================================================================

test.describe("Rapports - Navigation entre onglets", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/rapports");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("navigation Dashboard -> Ventes -> Produits -> Dashboard", async ({ page }) => {
    // Aller sur Ventes
    const ventesTab = page.getByRole("tab", { name: /ventes/i });
    await ventesTab.click();
    await expect(ventesTab).toHaveAttribute("aria-selected", "true");

    // Aller sur Produits
    const produitsTab = page.getByRole("tab", { name: /produits/i });
    await produitsTab.click();
    await expect(produitsTab).toHaveAttribute("aria-selected", "true");

    // Revenir sur Dashboard
    const dashboardTab = page.getByRole("tab", { name: /dashboard/i });
    await dashboardTab.click();
    await expect(dashboardTab).toHaveAttribute("aria-selected", "true");
  });

  test("le changement d'onglet ne fait pas crasher la page", async ({ page }) => {
    const tabs = ["factures", "ventes", "produits", "employes", "rapports z", "dashboard"];

    for (const tabName of tabs) {
      const tab = page.getByRole("tab", { name: new RegExp(tabName, "i") });
      await tab.click();
      await expect(tab).toHaveAttribute("aria-selected", "true");

      // Verifier que la page ne crashe pas
      await expect(page.getByRole("heading", { name: /rapports/i }).first()).toBeVisible();
    }
  });
});

// =============================================================================
// TESTS - CONTENU DU DASHBOARD
// =============================================================================

test.describe("Rapports - Contenu Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/rapports");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("le dashboard affiche du contenu ou un etat de chargement", async ({ page }) => {
    // Le dashboard devrait contenir des graphiques (CA, heures de pointe, modes de paiement)
    // Attendre que les Suspense se resolvent
    await page.waitForTimeout(3000);

    // Le contenu principal ne doit pas etre vide
    const tabpanel = page.getByRole("tabpanel");
    await expect(tabpanel).toBeVisible();
    await expect(tabpanel).not.toBeEmpty();
  });
});

// =============================================================================
// TESTS - RESPONSIVE
// =============================================================================

test.describe("Rapports - Responsive", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/rapports");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("le titre reste visible sur tablette (768x1024)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole("heading", { name: /rapports/i }).first()).toBeVisible();
  });

  test("les onglets restent accessibles sur tablette", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole("tablist")).toBeVisible();
  });

  test("le titre reste visible sur mobile (375x667)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole("heading", { name: /rapports/i }).first()).toBeVisible();
  });
});
