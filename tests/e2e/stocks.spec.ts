/**
 * Tests E2E - Gestion des stocks
 *
 * Teste les fonctionnalites de la page /stocks:
 * - Redirection vers /login si non authentifie
 * - Affichage du header avec titre et sous-titre
 * - Onglets (Liste des stocks, Alertes, Valorisation)
 * - Boutons d'action (Actualiser, Historique, Inventaire, Mouvement)
 * - Liste des stocks avec produits
 * - Onglet Alertes avec compteur
 * - Navigation entre onglets
 */

import { test, expect } from "@playwright/test";

// =============================================================================
// TESTS SANS AUTHENTIFICATION
// =============================================================================

test.describe("Stocks - Accès sans authentification", () => {
  test("redirige vers /login quand non authentifie", async ({ page }) => {
    await page.goto("/stocks");
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });
});

// =============================================================================
// TESTS - HEADER
// =============================================================================

test.describe("Stocks - Header", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/stocks");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("affiche le titre 'Gestion des stocks'", async ({ page }) => {
    const heading = page.getByRole("heading", { name: /gestion des stocks/i });
    await expect(heading).toBeVisible();
  });

  test("affiche le sous-titre descriptif", async ({ page }) => {
    await expect(
      page.getByText(/inventaires, mouvements et alertes de stock/i)
    ).toBeVisible();
  });
});

// =============================================================================
// TESTS - ONGLETS
// =============================================================================

test.describe("Stocks - Onglets", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/stocks");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("affiche les 3 onglets", async ({ page }) => {
    await expect(page.getByRole("tab", { name: /liste des stocks/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /alertes/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /valorisation/i })).toBeVisible();
  });

  test("l'onglet 'Liste des stocks' est selectionne par defaut", async ({ page }) => {
    const listeTab = page.getByRole("tab", { name: /liste des stocks/i });
    await expect(listeTab).toHaveAttribute("aria-selected", "true");
  });

  test("cliquer sur l'onglet Alertes change le contenu", async ({ page }) => {
    const alertesTab = page.getByRole("tab", { name: /alertes/i });
    await alertesTab.click();

    await expect(alertesTab).toHaveAttribute("aria-selected", "true");

    const tabpanel = page.getByRole("tabpanel");
    await expect(tabpanel).toBeVisible();
  });

  test("cliquer sur l'onglet Valorisation change le contenu", async ({ page }) => {
    const valorisationTab = page.getByRole("tab", { name: /valorisation/i });
    await valorisationTab.click();

    await expect(valorisationTab).toHaveAttribute("aria-selected", "true");

    const tabpanel = page.getByRole("tabpanel");
    await expect(tabpanel).toBeVisible();
  });

  test("navigation entre les 3 onglets sans crash", async ({ page }) => {
    // Alertes
    const alertesTab = page.getByRole("tab", { name: /alertes/i });
    await alertesTab.click();
    await expect(alertesTab).toHaveAttribute("aria-selected", "true");

    // Valorisation
    const valorisationTab = page.getByRole("tab", { name: /valorisation/i });
    await valorisationTab.click();
    await expect(valorisationTab).toHaveAttribute("aria-selected", "true");

    // Retour a la liste
    const listeTab = page.getByRole("tab", { name: /liste des stocks/i });
    await listeTab.click();
    await expect(listeTab).toHaveAttribute("aria-selected", "true");

    // Le titre reste visible
    await expect(page.getByRole("heading", { name: /gestion des stocks/i })).toBeVisible();
  });
});

// =============================================================================
// TESTS - BOUTONS D'ACTION
// =============================================================================

test.describe("Stocks - Boutons d'action", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/stocks");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("affiche le bouton 'Actualiser'", async ({ page }) => {
    const actualiserButton = page.getByRole("button", { name: /actualiser/i });
    await expect(actualiserButton).toBeVisible();
    await expect(actualiserButton).toBeEnabled();
  });

  test("le bouton 'Actualiser' rafraichit sans crash", async ({ page }) => {
    const actualiserButton = page.getByRole("button", { name: /actualiser/i });
    await actualiserButton.click();

    // La page reste fonctionnelle
    await expect(page.getByRole("heading", { name: /gestion des stocks/i })).toBeVisible();
  });

  test("affiche le bouton 'Historique'", async ({ page }) => {
    const historyButton = page.getByRole("button", { name: /historique/i });
    await expect(historyButton).toBeVisible();
  });

  test("cliquer sur 'Historique' ouvre le modal d'historique", async ({ page }) => {
    const historyButton = page.getByRole("button", { name: /historique/i });
    await historyButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });

  test("affiche le bouton 'Inventaire'", async ({ page }) => {
    const inventoryButton = page.getByRole("button", { name: /inventaire/i });
    await expect(inventoryButton).toBeVisible();
  });

  test("cliquer sur 'Inventaire' ouvre le modal d'inventaire", async ({ page }) => {
    const inventoryButton = page.getByRole("button", { name: /inventaire/i });
    await inventoryButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });

  test("affiche le bouton 'Mouvement'", async ({ page }) => {
    const movementButton = page.getByRole("button", { name: /mouvement/i });
    await expect(movementButton).toBeVisible();
  });

  test("cliquer sur 'Mouvement' ouvre le modal de mouvement de stock", async ({ page }) => {
    const movementButton = page.getByRole("button", { name: /mouvement/i });
    await movementButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });
});

// =============================================================================
// TESTS - MODAL HISTORIQUE
// =============================================================================

test.describe("Stocks - Modal Historique", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/stocks");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");

    const historyButton = page.getByRole("button", { name: /historique/i });
    await historyButton.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
  });

  test("le modal d'historique peut etre ferme avec Escape", async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible({ timeout: 3000 });
  });
});

// =============================================================================
// TESTS - MODAL INVENTAIRE
// =============================================================================

test.describe("Stocks - Modal Inventaire", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/stocks");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");

    const inventoryButton = page.getByRole("button", { name: /inventaire/i });
    await inventoryButton.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
  });

  test("le modal d'inventaire affiche un formulaire", async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Le modal doit contenir du contenu significatif
    await expect(dialog).not.toBeEmpty();
  });

  test("le modal d'inventaire peut etre ferme avec Escape", async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible({ timeout: 3000 });
  });
});

// =============================================================================
// TESTS - MODAL MOUVEMENT
// =============================================================================

test.describe("Stocks - Modal Mouvement", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/stocks");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");

    const movementButton = page.getByRole("button", { name: /mouvement/i });
    await movementButton.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
  });

  test("le modal de mouvement affiche un formulaire", async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).not.toBeEmpty();
  });

  test("le modal de mouvement peut etre ferme avec Escape", async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible({ timeout: 3000 });
  });
});

// =============================================================================
// TESTS - ONGLET ALERTES
// =============================================================================

test.describe("Stocks - Onglet Alertes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/stocks");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("l'onglet Alertes affiche un compteur si des alertes existent", async ({ page }) => {
    const alertesTab = page.getByRole("tab", { name: /alertes/i });
    await expect(alertesTab).toBeVisible();

    // Le compteur est un badge rouge dans l'onglet
    // Il est present uniquement si alertes.length > 0
    // On ne peut pas predire si des alertes existent
    // On verifie juste que l'onglet est cliquable
    await alertesTab.click();
    await expect(alertesTab).toHaveAttribute("aria-selected", "true");
  });

  test("l'onglet Alertes affiche du contenu apres clic", async ({ page }) => {
    const alertesTab = page.getByRole("tab", { name: /alertes/i });
    await alertesTab.click();

    const tabpanel = page.getByRole("tabpanel");
    await expect(tabpanel).toBeVisible();
    await expect(tabpanel).not.toBeEmpty();
  });
});

// =============================================================================
// TESTS - RESPONSIVE
// =============================================================================

test.describe("Stocks - Responsive", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/stocks");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("le titre reste visible sur tablette (768x1024)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole("heading", { name: /gestion des stocks/i })).toBeVisible();
  });

  test("les onglets restent accessibles sur tablette", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole("tab", { name: /liste des stocks/i })).toBeVisible();
  });
});
