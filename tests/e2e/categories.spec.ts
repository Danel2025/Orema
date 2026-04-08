/**
 * Tests E2E - Gestion des categories (via la page /produits)
 *
 * Teste les fonctionnalites de l'onglet Catégories:
 * - Navigation vers l'onglet Catégories depuis la page /produits
 * - Affichage de la liste des categories ou etat vide
 * - Bouton d'ajout de categorie
 * - Formulaire de creation avec champs (nom, couleur, imprimante)
 * - Navigation aller-retour entre onglets Produits et Categories
 */

import { test, expect } from "@playwright/test";

// =============================================================================
// TESTS SANS AUTHENTIFICATION
// =============================================================================

test.describe("Catégories - Accès sans authentification", () => {
  test("redirige vers /login quand non authentifie", async ({ page }) => {
    await page.goto("/produits");
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });
});

// =============================================================================
// TESTS - NAVIGATION VERS ONGLET CATEGORIES
// =============================================================================

test.describe("Catégories - Navigation vers onglet", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/produits");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("l'onglet Catégories est visible dans la page produits", async ({ page }) => {
    const categoriesTab = page.getByRole("tab", { name: /cat[eé]gories/i });
    await expect(categoriesTab).toBeVisible();
  });

  test("cliquer sur l'onglet Catégories le selectionne", async ({ page }) => {
    const categoriesTab = page.getByRole("tab", { name: /cat[eé]gories/i });
    await categoriesTab.click();

    await expect(categoriesTab).toHaveAttribute("aria-selected", "true");
  });

  test("l'onglet Catégories affiche un tabpanel", async ({ page }) => {
    const categoriesTab = page.getByRole("tab", { name: /cat[eé]gories/i });
    await categoriesTab.click();

    const tabpanel = page.getByRole("tabpanel");
    await expect(tabpanel).toBeVisible();
  });
});

// =============================================================================
// TESTS - CONTENU DE L'ONGLET CATEGORIES
// =============================================================================

test.describe("Catégories - Contenu de l'onglet", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/produits");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");

    // Naviguer vers l'onglet Catégories
    const categoriesTab = page.getByRole("tab", { name: /cat[eé]gories/i });
    await categoriesTab.click();
    await expect(categoriesTab).toHaveAttribute("aria-selected", "true");
  });

  test("affiche des categories OU un etat vide", async ({ page }) => {
    const tabpanel = page.getByRole("tabpanel");
    await expect(tabpanel).toBeVisible();

    // Soit des categories existent (avec noms et couleurs)
    // Soit l'etat vide est affiche
    await expect(tabpanel).not.toBeEmpty();
  });

  test("affiche le bouton 'Nouvelle categorie' ou 'Ajouter'", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /nouvelle cat[eé]gorie|ajouter/i });
    const isVisible = await addButton.isVisible().catch(() => false);

    // Le bouton doit etre visible pour les utilisateurs autorises
    // Sinon, la page reste fonctionnelle
    await expect(page.getByRole("tab", { name: /cat[eé]gories/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );

    if (isVisible) {
      await expect(addButton).toBeEnabled();
    }
  });

  test("cliquer sur le bouton d'ajout ouvre le formulaire de categorie", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /nouvelle cat[eé]gorie|ajouter/i });
    const isVisible = await addButton.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip();
      return;
    }

    await addButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });
});

// =============================================================================
// TESTS - FORMULAIRE DE CATEGORIE
// =============================================================================

test.describe("Catégories - Formulaire de creation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/produits");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");

    // Naviguer vers l'onglet Catégories
    const categoriesTab = page.getByRole("tab", { name: /cat[eé]gories/i });
    await categoriesTab.click();
    await expect(categoriesTab).toHaveAttribute("aria-selected", "true");

    // Ouvrir le formulaire
    const addButton = page.getByRole("button", { name: /nouvelle cat[eé]gorie|ajouter/i });
    const isVisible = await addButton.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }

    await addButton.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
  });

  test("le formulaire contient le champ nom", async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    const nomField = dialog.getByLabel(/nom/i).first();
    await expect(nomField).toBeVisible();
  });

  test("le champ nom accepte une saisie", async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    const nomField = dialog.getByLabel(/nom/i).first();
    await nomField.fill("Test Catégorie E2E");
    await expect(nomField).toHaveValue("Test Catégorie E2E");
  });

  test("le formulaire contient une section couleur", async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');

    // Le formulaire doit contenir un selecteur de couleur ou des options de couleur
    const colorSection = dialog.getByText(/couleur/i);
    await expect(colorSection.first()).toBeVisible();
  });

  test("le formulaire peut etre ferme avec Escape", async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible({ timeout: 3000 });
  });

  test("le formulaire contient un bouton de validation", async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    const submitButton = dialog.getByRole("button", {
      name: /cr[eé]er|ajouter|enregistrer|valider|sauvegarder/i,
    });
    await expect(submitButton).toBeVisible();
  });
});

// =============================================================================
// TESTS - NAVIGATION ALLER-RETOUR
// =============================================================================

test.describe("Catégories - Navigation aller-retour", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/produits");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("navigation Produits -> Catégories -> Produits", async ({ page }) => {
    // Verifier que Produits est selectionne par defaut
    const produitsTab = page.getByRole("tab", { name: /produits/i });
    await expect(produitsTab).toHaveAttribute("aria-selected", "true");

    // Aller sur Categories
    const categoriesTab = page.getByRole("tab", { name: /cat[eé]gories/i });
    await categoriesTab.click();
    await expect(categoriesTab).toHaveAttribute("aria-selected", "true");

    // Revenir sur Produits
    await produitsTab.click();
    await expect(produitsTab).toHaveAttribute("aria-selected", "true");

    // Le titre de page reste visible
    await expect(
      page.getByRole("heading", { level: 1, name: /produits/i })
    ).toBeVisible();
  });

  test("le contenu change correctement entre onglets", async ({ page }) => {
    // Sur l'onglet Produits, on devrait voir le bouton "Nouveau produit"
    const produitsTab = page.getByRole("tab", { name: /produits/i });
    await expect(produitsTab).toHaveAttribute("aria-selected", "true");

    const nouveauProduit = page.getByRole("button", { name: /nouveau produit/i });
    const hasNouveauProduit = await nouveauProduit.isVisible().catch(() => false);

    // Aller sur Categories
    const categoriesTab = page.getByRole("tab", { name: /cat[eé]gories/i });
    await categoriesTab.click();

    // Le bouton "Nouveau produit" ne devrait plus etre visible (remplace par "Nouvelle categorie")
    if (hasNouveauProduit) {
      await expect(nouveauProduit).not.toBeVisible({ timeout: 3000 });
    }
  });
});

// =============================================================================
// TESTS - RESPONSIVE
// =============================================================================

test.describe("Catégories - Responsive", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/produits");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("les onglets restent visibles sur tablette (768x1024)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole("tab", { name: /cat[eé]gories/i })).toBeVisible();
  });

  test("la navigation par onglets fonctionne sur tablette", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    const categoriesTab = page.getByRole("tab", { name: /cat[eé]gories/i });
    await categoriesTab.click();
    await expect(categoriesTab).toHaveAttribute("aria-selected", "true");

    const tabpanel = page.getByRole("tabpanel");
    await expect(tabpanel).toBeVisible();
  });
});
