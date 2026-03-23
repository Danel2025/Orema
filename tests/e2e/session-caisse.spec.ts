/**
 * Tests E2E - Session de caisse
 *
 * Teste les fonctionnalites d'ouverture et fermeture de session:
 * - Redirection vers login si non authentifie
 * - Affichage de "Caisse fermee" sans session active
 * - Bouton "Ouvrir la caisse" et dialog d'ouverture
 * - Session active: statut, popover avec details
 * - Cloture de session
 */

import { test, expect } from "@playwright/test";

// =============================================================================
// TESTS SANS AUTHENTIFICATION
// =============================================================================

test.describe("Session caisse - Acces sans authentification", () => {
  test("redirige vers /login quand non authentifie", async ({ page }) => {
    await page.goto("/caisse");
    await expect(page).toHaveURL(/\/login/);
  });
});

// =============================================================================
// TESTS - CAISSE FERMEE (pas de session active)
// =============================================================================

test.describe("Session caisse - Caisse fermee", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/caisse");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("affiche 'Caisse fermee' quand aucune session n'est ouverte", async ({ page }) => {
    const caisseFermee = page.getByText("Caisse fermee");
    const isSessionClosed = await caisseFermee.isVisible().catch(() => false);

    if (!isSessionClosed) {
      // Session deja ouverte - verifier qu'on a l'interface caisse
      await expect(page.getByRole("button", { name: /vente directe/i })).toBeVisible();
      return;
    }

    await expect(caisseFermee).toBeVisible();
  });

  test("affiche le message explicatif quand caisse fermee", async ({ page }) => {
    const caisseFermee = page.getByText("Caisse fermee");
    const isSessionClosed = await caisseFermee.isVisible().catch(() => false);

    if (!isSessionClosed) {
      test.skip();
      return;
    }

    await expect(
      page.getByText(/aucune session de caisse n'est ouverte/i)
    ).toBeVisible();

    // Message d'avertissement
    await expect(
      page.getByText(/toutes les ventes seront enregistr/i)
    ).toBeVisible();
  });

  test("affiche le bouton 'Ouvrir la caisse'", async ({ page }) => {
    const caisseFermee = page.getByText("Caisse fermee");
    const isSessionClosed = await caisseFermee.isVisible().catch(() => false);

    if (!isSessionClosed) {
      test.skip();
      return;
    }

    const ouvrirButton = page.getByRole("button", { name: /ouvrir la caisse/i });
    await expect(ouvrirButton).toBeVisible();
    await expect(ouvrirButton).toBeEnabled();
  });

  test("affiche le bouton 'Actualiser'", async ({ page }) => {
    const caisseFermee = page.getByText("Caisse fermee");
    const isSessionClosed = await caisseFermee.isVisible().catch(() => false);

    if (!isSessionClosed) {
      test.skip();
      return;
    }

    const actualiserButton = page.getByRole("button", { name: /actualiser/i });
    await expect(actualiserButton).toBeVisible();
  });

  test("clic sur 'Ouvrir la caisse' ouvre le dialog d'ouverture", async ({ page }) => {
    const caisseFermee = page.getByText("Caisse fermee");
    const isSessionClosed = await caisseFermee.isVisible().catch(() => false);

    if (!isSessionClosed) {
      test.skip();
      return;
    }

    const ouvrirButton = page.getByRole("button", { name: /ouvrir la caisse/i });
    await ouvrirButton.click();

    // Le dialog doit s'ouvrir
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });
});

// =============================================================================
// TESTS - DIALOG D'OUVERTURE DE SESSION
// =============================================================================

test.describe("Session caisse - Dialog d'ouverture", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/caisse");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");

    // On a besoin que la caisse soit fermee pour tester le dialog
    const caisseFermee = page.getByText("Caisse fermee");
    const isSessionClosed = await caisseFermee.isVisible().catch(() => false);

    if (!isSessionClosed) {
      test.skip();
      return;
    }

    // Ouvrir le dialog
    const ouvrirButton = page.getByRole("button", { name: /ouvrir la caisse/i });
    await ouvrirButton.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
  });

  test("le dialog contient un champ 'Fond de caisse'", async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    const fondCaisseInput = dialog.getByLabel(/fond de caisse/i);
    await expect(fondCaisseInput).toBeVisible();
  });

  test("le champ 'Fond de caisse' accepte un montant", async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    const fondCaisseInput = dialog.getByLabel(/fond de caisse/i);
    await fondCaisseInput.fill("50000");
    await expect(fondCaisseInput).toHaveValue("50000");
  });

  test("le dialog contient un bouton de validation", async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    const submitButton = dialog.getByRole("button", { name: /ouvrir|valider|confirmer/i });
    await expect(submitButton).toBeVisible();
  });

  test("le dialog peut etre ferme avec Escape", async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(dialog).not.toBeVisible({ timeout: 3000 });
  });
});

// =============================================================================
// TESTS - SESSION ACTIVE (statut dans le header)
// =============================================================================

test.describe("Session caisse - Session active", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/caisse");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");

    // Skip si caisse fermee
    const caisseFermee = page.getByText("Caisse fermee");
    if (await caisseFermee.isVisible().catch(() => false)) {
      test.skip();
      return;
    }
  });

  test("affiche le compteur de ventes dans le header", async ({ page }) => {
    await expect(page.getByText(/ventes/i).first()).toBeVisible();
  });

  test("affiche le chiffre d'affaires en FCFA", async ({ page }) => {
    const fcfaTexts = page.getByText(/fcfa/i);
    const count = await fcfaTexts.count();
    expect(count).toBeGreaterThan(0);
  });

  test("affiche la duree de la session au format XhMM", async ({ page }) => {
    const durationText = page.getByText(/\d+h\d{2}/);
    await expect(durationText.first()).toBeVisible();
  });

  test("le clic sur le statut ouvre un popover avec les details", async ({ page }) => {
    const sessionButton = page.locator("button").filter({ hasText: /ventes/ }).first();
    const isVisible = await sessionButton.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip();
      return;
    }

    await sessionButton.click();

    await expect(page.getByText("Session active")).toBeVisible({ timeout: 3000 });
  });

  test("le popover affiche les informations du caissier", async ({ page }) => {
    const sessionButton = page.locator("button").filter({ hasText: /ventes/ }).first();
    const isVisible = await sessionButton.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip();
      return;
    }

    await sessionButton.click();
    await expect(page.getByText("Session active")).toBeVisible({ timeout: 3000 });

    await expect(page.getByText("Caissier")).toBeVisible();
    await expect(page.getByText(/fond de caisse/i)).toBeVisible();
  });

  test("le popover affiche les totaux par mode de paiement", async ({ page }) => {
    const sessionButton = page.locator("button").filter({ hasText: /ventes/ }).first();
    const isVisible = await sessionButton.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip();
      return;
    }

    await sessionButton.click();
    await expect(page.getByText("Session active")).toBeVisible({ timeout: 3000 });

    await expect(page.getByText("Paiements")).toBeVisible();
    await expect(page.getByText("Especes")).toBeVisible();
    await expect(page.getByText("Cartes")).toBeVisible();
    await expect(page.getByText("Mobile Money")).toBeVisible();
  });

  test("le popover contient le bouton 'Cloturer la caisse'", async ({ page }) => {
    const sessionButton = page.locator("button").filter({ hasText: /ventes/ }).first();
    const isVisible = await sessionButton.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip();
      return;
    }

    await sessionButton.click();
    await expect(page.getByText("Session active")).toBeVisible({ timeout: 3000 });

    const cloturerButton = page.getByRole("button", { name: /cl[oô]turer la caisse/i });
    await expect(cloturerButton).toBeVisible();
  });
});

// =============================================================================
// TESTS - CLOTURE DE SESSION
// =============================================================================

test.describe("Session caisse - Cloture", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/caisse");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");

    // Skip si caisse fermee
    const caisseFermee = page.getByText("Caisse fermee");
    if (await caisseFermee.isVisible().catch(() => false)) {
      test.skip();
      return;
    }
  });

  test("le bouton 'Cloturer la caisse' ouvre le dialog de cloture", async ({ page }) => {
    // Ouvrir le popover de session
    const sessionButton = page.locator("button").filter({ hasText: /ventes/ }).first();
    const isVisible = await sessionButton.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip();
      return;
    }

    await sessionButton.click();
    await expect(page.getByText("Session active")).toBeVisible({ timeout: 3000 });

    // Cliquer sur "Clôturer la caisse"
    const cloturerButton = page.getByRole("button", { name: /cl[oô]turer la caisse/i });
    await cloturerButton.click();

    // Le dialog de cloture doit s'ouvrir
    const closeDialog = page.locator('[role="dialog"]');
    await expect(closeDialog).toBeVisible({ timeout: 5000 });
  });
});

// =============================================================================
// TESTS - PAGE RAPPORTS
// =============================================================================

test.describe("Session caisse - Page rapports", () => {
  test("la page rapports redirige vers login si non authentifie", async ({ page }) => {
    await page.goto("/rapports");
    await expect(page).toHaveURL(/\/login/);
  });
});
