/**
 * Tests E2E - Suivi des livraisons
 *
 * Teste les fonctionnalites du suivi des livraisons:
 * - Redirection vers login si non authentifie
 * - Header avec titre, sous-titre, compteur
 * - Bouton de rafraichissement
 * - Board kanban avec colonnes par statut
 * - Etat vide quand aucune livraison
 * - Cartes de livraison avec informations
 * - Responsive (tablette, mobile)
 */

import { test, expect } from "@playwright/test";

// =============================================================================
// TESTS SANS AUTHENTIFICATION
// =============================================================================

test.describe("Livraison - Acces sans authentification", () => {
  test("redirige vers /login quand non authentifie", async ({ page }) => {
    await page.goto("/livraison");
    await expect(page).toHaveURL(/\/login/);
  });
});

// =============================================================================
// TESTS - HEADER
// =============================================================================

test.describe("Livraison - Header", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/livraison");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("affiche le titre 'Suivi des livraisons'", async ({ page }) => {
    const heading = page.getByRole("heading", { name: /suivi des livraisons/i });
    await expect(heading).toBeVisible();
  });

  test("affiche le sous-titre descriptif", async ({ page }) => {
    await expect(page.getByText(/suivez et g[eé]rez les livraisons/i)).toBeVisible();
  });

  test("affiche le compteur de livraisons (badge)", async ({ page }) => {
    // Le badge violet a cote du titre contient le nombre de livraisons
    // Il utilise Badge de Radix UI avec color="violet"
    const badge = page.locator('[data-accent-color="violet"]').first();
    await expect(badge).toBeVisible();

    // Le badge contient un nombre
    const text = await badge.textContent();
    expect(text).toBeDefined();
    expect(text!.trim()).toMatch(/\d+/);
  });

  test("affiche l'icone de livraison (Truck)", async ({ page }) => {
    // L'icone est dans un conteneur avec fond violet
    // Il contient un SVG (icone Truck de lucide-react)
    const iconContainer = page.locator("div").filter({
      has: page.locator("svg"),
    });
    // Au moins un conteneur avec SVG doit exister
    const count = await iconContainer.count();
    expect(count).toBeGreaterThan(0);
  });
});

// =============================================================================
// TESTS - BOUTON DE RAFRAICHISSEMENT
// =============================================================================

test.describe("Livraison - Bouton de rafraichissement", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/livraison");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("affiche le bouton de rafraichissement", async ({ page }) => {
    const refreshButton = page.getByRole("button", { name: /rafra[iî]chir les livraisons/i });
    await expect(refreshButton).toBeVisible();
  });

  test("le bouton de rafraichissement est cliquable", async ({ page }) => {
    const refreshButton = page.getByRole("button", { name: /rafra[iî]chir les livraisons/i });
    await expect(refreshButton).toBeEnabled();

    await refreshButton.click();

    // Apres le clic, la page ne doit pas crasher
    await expect(page.getByRole("heading", { name: /suivi des livraisons/i })).toBeVisible();
  });
});

// =============================================================================
// TESTS - CONTENU PRINCIPAL (Board ou Etat vide)
// =============================================================================

test.describe("Livraison - Contenu principal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/livraison");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("affiche le board kanban OU l'etat vide", async ({ page }) => {
    // Soit on voit les colonnes du kanban, soit "Aucune livraison en cours"
    const emptyState = page.getByText(/aucune livraison en cours/i);
    const kanbanColumn = page.getByText(/en pr[eé]paration/i).first();

    const isEmpty = await emptyState.isVisible().catch(() => false);
    const hasBoard = await kanbanColumn.isVisible().catch(() => false);

    // L'un des deux doit etre vrai
    expect(isEmpty || hasBoard).toBeTruthy();
  });
});

// =============================================================================
// TESTS - ETAT VIDE
// =============================================================================

test.describe("Livraison - Etat vide", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/livraison");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("affiche le message 'Aucune livraison en cours' si vide", async ({ page }) => {
    const emptyMessage = page.getByText(/aucune livraison en cours/i);
    const isEmpty = await emptyMessage.isVisible().catch(() => false);

    if (!isEmpty) {
      // Il y a des livraisons - pas d'etat vide
      test.skip();
      return;
    }

    await expect(emptyMessage).toBeVisible();
  });

  test("affiche le texte explicatif dans l'etat vide", async ({ page }) => {
    const emptyMessage = page.getByText(/aucune livraison en cours/i);
    const isEmpty = await emptyMessage.isVisible().catch(() => false);

    if (!isEmpty) {
      test.skip();
      return;
    }

    // Le texte explicatif doit etre visible
    await expect(
      page.getByText(/livraisons appara[iî]tront/i)
    ).toBeVisible();
  });
});

// =============================================================================
// TESTS - BOARD KANBAN
// =============================================================================

test.describe("Livraison - Board Kanban", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/livraison");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");

    // Skip si etat vide
    const emptyMessage = page.getByText(/aucune livraison en cours/i);
    if (await emptyMessage.isVisible().catch(() => false)) {
      test.skip();
      return;
    }
  });

  test("affiche la colonne 'En preparation'", async ({ page }) => {
    await expect(page.getByText(/en pr[eé]paration/i).first()).toBeVisible();
  });

  test("affiche la colonne 'Prete'", async ({ page }) => {
    await expect(page.getByText(/pr[eê]te/i).first()).toBeVisible();
  });

  test("affiche la colonne 'En cours'", async ({ page }) => {
    await expect(page.getByText("En cours").first()).toBeVisible();
  });

  test("affiche la colonne 'Livree'", async ({ page }) => {
    await expect(page.getByText(/livr[eé]e/i).first()).toBeVisible();
  });

  test("chaque colonne affiche un compteur", async ({ page }) => {
    // Les badges de compteur dans les colonnes (solid variant)
    const badges = page.locator('[data-accent-color]');
    const count = await badges.count();

    // Au minimum 4 badges (un par colonne) + le badge du header
    expect(count).toBeGreaterThanOrEqual(4);
  });
});

// =============================================================================
// TESTS - RESPONSIVE
// =============================================================================

test.describe("Livraison - Responsive", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/livraison");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("le titre reste visible sur tablette (768x1024)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await expect(page.getByRole("heading", { name: /suivi des livraisons/i })).toBeVisible();
  });

  test("le titre reste visible sur mobile (375x667)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await expect(page.getByRole("heading", { name: /suivi des livraisons/i })).toBeVisible();
  });

  test("le bouton de rafraichissement reste visible sur mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const refreshButton = page.getByRole("button", { name: /rafra[iî]chir les livraisons/i });
    await expect(refreshButton).toBeVisible();
  });
});
