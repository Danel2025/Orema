/**
 * Tests E2E - Plan de salle / Gestion des tables
 *
 * Teste les fonctionnalites du plan de salle:
 * - Redirection vers login si non authentifie
 * - Affichage du header avec titre et sous-titre
 * - Statistiques des tables (total, libres, occupees, etc.)
 * - Legende des statuts colores
 * - Selecteur de zone
 * - Boutons d'action (Actualiser, Ajouter une table)
 * - Plan de salle interactif
 */

import { test, expect } from "@playwright/test";

// =============================================================================
// TESTS SANS AUTHENTIFICATION
// =============================================================================

test.describe("Plan de salle - Accès sans authentification", () => {
  test("redirige vers /login quand non authentifie", async ({ page }) => {
    await page.goto("/salle");
    await expect(page).toHaveURL(/\/login/);
  });
});

// =============================================================================
// TESTS - HEADER
// =============================================================================

test.describe("Plan de salle - Header", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/salle");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("affiche le titre 'Plan de salle'", async ({ page }) => {
    const heading = page.getByRole("heading", { name: /plan de salle/i });
    await expect(heading).toBeVisible();
  });

  test("affiche le sous-titre avec le nombre de tables", async ({ page }) => {
    const subtitle = page.getByText(/gestion des tables et zones/i);
    await expect(subtitle).toBeVisible();

    // Le sous-titre contient le nombre de tables
    await expect(subtitle).toContainText(/\d+ tables/);
  });
});

// =============================================================================
// TESTS - STATISTIQUES DES TABLES
// =============================================================================

test.describe("Plan de salle - Statistiques", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/salle");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("affiche les statistiques 'Total'", async ({ page }) => {
    await expect(page.getByText("Total").first()).toBeVisible();
  });

  test("affiche les statistiques 'Libres'", async ({ page }) => {
    await expect(page.getByText("Libres")).toBeVisible();
  });

  test("affiche les statistiques 'Occupees'", async ({ page }) => {
    await expect(page.getByText(/occup[eé]es/i)).toBeVisible();
  });

  test("affiche les statistiques 'En préparation'", async ({ page }) => {
    await expect(page.getByText(/en pr[eé]paration/i).first()).toBeVisible();
  });

  test("affiche les statistiques 'Addition'", async ({ page }) => {
    await expect(page.getByText("Addition").first()).toBeVisible();
  });

  test("affiche les statistiques 'A nettoyer'", async ({ page }) => {
    await expect(page.getByText(/[aà] nettoyer/i).first()).toBeVisible();
  });

  test("affiche les couverts disponibles", async ({ page }) => {
    await expect(page.getByText(/couverts disponibles/i)).toBeVisible();
    await expect(page.getByText(/couverts$/i).first()).toBeVisible();
  });

  test("les valeurs statistiques sont des nombres", async ({ page }) => {
    const totalStat = page.getByText("Total").first();
    await expect(totalStat).toBeVisible();

    // Le nombre est dans un element adjacent (frere)
    const totalValue = totalStat.locator("..").locator("span").first();
    const text = await totalValue.textContent();
    expect(text).toMatch(/\d+/);
  });
});

// =============================================================================
// TESTS - LEGENDE DES STATUTS
// =============================================================================

test.describe("Plan de salle - Legende des statuts", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/salle");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("affiche le statut 'Libre' dans la legende", async ({ page }) => {
    await expect(page.getByText("Libre").first()).toBeVisible();
  });

  test("affiche le statut 'Occupee' dans la legende", async ({ page }) => {
    await expect(page.getByText(/occup[eé]e$/i).first()).toBeVisible();
  });

  test("affiche le statut 'En préparation' dans la legende", async ({ page }) => {
    await expect(page.getByText(/en pr[eé]paration/i).first()).toBeVisible();
  });

  test("affiche le statut 'Addition demandee' dans la legende", async ({ page }) => {
    await expect(page.getByText(/addition demand[eé]e/i)).toBeVisible();
  });

  test("affiche le statut 'A nettoyer' dans la legende", async ({ page }) => {
    await expect(page.getByText(/[àa] nettoyer/i).first()).toBeVisible();
  });
});

// =============================================================================
// TESTS - FILTRE PAR ZONE
// =============================================================================

test.describe("Plan de salle - Filtre par zone", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/salle");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("affiche le selecteur de zone avec 'Toutes les zones'", async ({ page }) => {
    const zoneTrigger = page.getByText(/toutes les zones/i);
    await expect(zoneTrigger.first()).toBeVisible();
  });
});

// =============================================================================
// TESTS - BOUTONS D'ACTION
// =============================================================================

test.describe("Plan de salle - Boutons d'action", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/salle");
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

  test("le bouton 'Actualiser' fonctionne sans erreur", async ({ page }) => {
    const actualiserButton = page.getByRole("button", { name: /actualiser/i });
    await actualiserButton.click();

    // La page ne doit pas crasher apres le rafraichissement
    await expect(page.getByRole("heading", { name: /plan de salle/i })).toBeVisible();
  });

  test("affiche le bouton 'Ajouter une table'", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /ajouter une table/i });
    await expect(addButton).toBeVisible();
  });

  test("le bouton 'Ajouter une table' ouvre le formulaire si autorise", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /ajouter une table/i });
    await expect(addButton).toBeVisible();

    const isEnabled = await addButton.isEnabled();
    if (!isEnabled) {
      // Le bouton est desactive pour les roles serveur/caissier - c'est attendu
      test.skip();
      return;
    }

    await addButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });
});

// =============================================================================
// TESTS - PLAN DE SALLE INTERACTIF
// =============================================================================

test.describe("Plan de salle - Zone interactive", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/salle");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("la page affiche du contenu (non vide)", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /plan de salle/i })).toBeVisible();
    await expect(page.locator("body")).not.toBeEmpty();
  });
});

// =============================================================================
// TESTS - FORMULAIRE D'AJOUT DE TABLE
// =============================================================================

test.describe("Plan de salle - Formulaire d'ajout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/salle");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");

    const addButton = page.getByRole("button", { name: /ajouter une table/i });
    const isEnabled = await addButton.isEnabled();
    if (!isEnabled) {
      test.skip();
      return;
    }

    await addButton.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
  });

  test("le formulaire contient le champ numero", async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    const numeroField = dialog.getByLabel(/num[eé]ro/i).first();
    await expect(numeroField).toBeVisible();
  });

  test("le formulaire contient le champ capacite", async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    const capaciteField = dialog.getByLabel(/capacit/i).first();
    await expect(capaciteField).toBeVisible();
  });

  test("le formulaire peut etre ferme avec Escape", async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(dialog).not.toBeVisible({ timeout: 3000 });
  });
});

// =============================================================================
// TESTS - RESPONSIVE
// =============================================================================

test.describe("Plan de salle - Responsive", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/salle");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("le titre reste visible sur tablette (768x1024)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole("heading", { name: /plan de salle/i })).toBeVisible();
  });
});
