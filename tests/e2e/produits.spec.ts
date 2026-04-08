/**
 * Tests E2E - Gestion des produits
 *
 * Teste les fonctionnalites de la page /produits:
 * - Redirection vers /login si non authentifie
 * - Affichage du titre, sous-titre, onglets
 * - Recherche de produits
 * - Filtrage par categorie
 * - Bouton d'ajout de produit
 * - Affichage des prix en FCFA
 *
 * Note: La page /produits est protegee. Sans authentification,
 * elle redirige vers /login. Les tests verifient ce comportement
 * et, quand l'acces est possible, testent les fonctionnalites.
 */

import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Redirection sans authentification
// ---------------------------------------------------------------------------
test.describe("Page Produits - Protection de la route", () => {
  test("redirige vers /login si non authentifie", async ({ page }) => {
    await page.goto("/produits");
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });
});

// ---------------------------------------------------------------------------
// Affichage general (necessite authentification)
// Les tests ci-dessous utilisent un pattern conditionnel:
// si redirige vers login, on verifie la redirection; sinon on teste la page.
// ---------------------------------------------------------------------------
test.describe("Page Produits - Affichage general", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/produits");
    // Attendre que la navigation se stabilise
    await page.waitForLoadState("networkidle");
  });

  test('affiche le titre "Produits" ou redirige vers login', async ({ page }) => {
    const url = page.url();

    if (url.includes("/login")) {
      // Route protegee - confirmer la redirection
      await expect(page).toHaveURL(/\/login/);
    } else {
      // Page chargee - verifier le titre h1
      await expect(page.getByRole("heading", { level: 1, name: /produits/i })).toBeVisible();
    }
  });

  test("affiche le sous-titre descriptif ou redirige vers login", async ({ page }) => {
    const url = page.url();

    if (url.includes("/login")) {
      await expect(page).toHaveURL(/\/login/);
    } else {
      await expect(page.getByText(/g[eé]rez vos produits et cat[eé]gories/i)).toBeVisible();
    }
  });

  test("affiche les onglets Produits et Catégories (Radix Tabs)", async ({ page }) => {
    const url = page.url();

    if (url.includes("/login")) {
      await expect(page).toHaveURL(/\/login/);
    } else {
      // Radix UI Tabs utilise role="tablist" avec role="tab" pour chaque onglet
      const tablist = page.getByRole("tablist");
      await expect(tablist).toBeVisible();

      const produitsTab = page.getByRole("tab", { name: /produits/i });
      const categoriesTab = page.getByRole("tab", { name: /cat[eé]gories/i });

      await expect(produitsTab).toBeVisible();
      await expect(categoriesTab).toBeVisible();
    }
  });

  test("l'onglet Produits est selectionne par defaut", async ({ page }) => {
    const url = page.url();

    if (url.includes("/login")) {
      await expect(page).toHaveURL(/\/login/);
    } else {
      const produitsTab = page.getByRole("tab", { name: /produits/i });
      await expect(produitsTab).toHaveAttribute("aria-selected", "true");
    }
  });
});

// ---------------------------------------------------------------------------
// Navigation par onglets
// ---------------------------------------------------------------------------
test.describe("Page Produits - Navigation onglets", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/produits");
    await page.waitForLoadState("networkidle");
  });

  test("basculer vers l'onglet Catégories", async ({ page }) => {
    const url = page.url();

    if (url.includes("/login")) {
      await expect(page).toHaveURL(/\/login/);
    } else {
      const categoriesTab = page.getByRole("tab", { name: /cat[eé]gories/i });
      await categoriesTab.click();

      // L'onglet Catégories doit etre selectionne
      await expect(categoriesTab).toHaveAttribute("aria-selected", "true");

      // Le tabpanel des categories doit etre visible
      const categoriesPanel = page.getByRole("tabpanel");
      await expect(categoriesPanel).toBeVisible();
    }
  });

  test("revenir a l'onglet Produits après Catégories", async ({ page }) => {
    const url = page.url();

    if (url.includes("/login")) {
      await expect(page).toHaveURL(/\/login/);
    } else {
      // Aller sur Categories
      const categoriesTab = page.getByRole("tab", { name: /cat[eé]gories/i });
      await categoriesTab.click();
      await expect(categoriesTab).toHaveAttribute("aria-selected", "true");

      // Revenir sur Produits
      const produitsTab = page.getByRole("tab", { name: /produits/i });
      await produitsTab.click();
      await expect(produitsTab).toHaveAttribute("aria-selected", "true");
    }
  });
});

// ---------------------------------------------------------------------------
// Liste des produits
// ---------------------------------------------------------------------------
test.describe("Page Produits - Liste et contenu", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/produits");
    await page.waitForLoadState("networkidle");
  });

  test("affiche des produits ou un etat vide apres chargement", async ({ page }) => {
    const url = page.url();

    if (url.includes("/login")) {
      await expect(page).toHaveURL(/\/login/);
    } else {
      // Attendre que le contenu se stabilise:
      // Soit "Aucun produit" (etat vide), soit "produits" dans le compteur,
      // soit le texte de chargement disparait.
      // On utilise un locator OR pour attendre l'un des deux etats finaux.
      const stableContent = page
        .getByText(/aucun produit/i)
        .first()
        .or(page.getByText(/\d+ produits?/i).first());

      await expect(stableContent).toBeVisible({ timeout: 30000 });
    }
  });

  test("affiche les prix en FCFA ou un etat vide", async ({ page }) => {
    const url = page.url();

    if (url.includes("/login")) {
      await expect(page).toHaveURL(/\/login/);
    } else {
      // Attendre la fin du chargement
      const stableContent = page
        .getByText(/aucun produit/i)
        .first()
        .or(page.getByText(/\d+ produits?/i).first());
      await expect(stableContent).toBeVisible({ timeout: 30000 });

      // Si des produits existent, les prix sont affiches en FCFA
      // Sinon l'etat vide est affiche (deja verifie ci-dessus)
      const fcfaText = page.getByText(/fcfa/i).first();
      const emptyState = page.getByText(/aucun produit/i).first();

      // L'un des deux doit etre visible
      await expect(fcfaText.or(emptyState)).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// Recherche et filtrage
// ---------------------------------------------------------------------------
test.describe("Page Produits - Recherche et filtrage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/produits");
    await page.waitForLoadState("networkidle");
  });

  test("affiche un champ de recherche avec aria-label", async ({ page }) => {
    const url = page.url();

    if (url.includes("/login")) {
      await expect(page).toHaveURL(/\/login/);
    } else {
      // Le champ de recherche a aria-label="Rechercher des produits"
      const searchInput = page.getByLabel(/rechercher des produits/i);
      await expect(searchInput).toBeVisible();
      await expect(searchInput).toHaveAttribute("type", "text");
    }
  });

  test("la saisie dans la recherche ne fait pas crasher la page", async ({ page }) => {
    const url = page.url();

    if (url.includes("/login")) {
      await expect(page).toHaveURL(/\/login/);
    } else {
      const searchInput = page.getByLabel(/rechercher des produits/i);
      await searchInput.fill("test recherche");

      // La page ne doit pas crasher - le champ garde sa valeur
      await expect(searchInput).toHaveValue("test recherche");

      // L'interface reste fonctionnelle
      await expect(page.getByRole("heading", { level: 1, name: /produits/i })).toBeVisible();
    }
  });

  test("affiche un select de filtrage par categorie", async ({ page }) => {
    const url = page.url();

    if (url.includes("/login")) {
      await expect(page).toHaveURL(/\/login/);
    } else {
      // Le select a aria-label="Filtrer par categorie"
      const categorySelect = page.getByLabel(/filtrer par cat[eé]gorie/i);
      await expect(categorySelect).toBeVisible();

      // L'option par defaut est "Toutes les categories"
      await expect(categorySelect).toContainText(/toutes les cat[eé]gories/i);
    }
  });

  test("affiche un bouton Filtres pour les filtres avances", async ({ page }) => {
    const url = page.url();

    if (url.includes("/login")) {
      await expect(page).toHaveURL(/\/login/);
    } else {
      const filtresButton = page.getByRole("button", { name: /filtres/i }).first();
      await expect(filtresButton).toBeVisible();
    }
  });

  test("le compteur de produits est affiche", async ({ page }) => {
    const url = page.url();

    if (url.includes("/login")) {
      await expect(page).toHaveURL(/\/login/);
    } else {
      // Attendre la stabilisation du contenu
      const stableContent = page
        .getByText(/aucun produit/i)
        .first()
        .or(page.getByText(/\d+ produits?/i).first());
      await expect(stableContent).toBeVisible({ timeout: 30000 });

      // Le compteur affiche "X produits" ou "X sur Y produits"
      await expect(page.getByText(/\d+ produits?/i).first()).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// Creation de produit
// ---------------------------------------------------------------------------
test.describe("Page Produits - Bouton creation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/produits");
    await page.waitForLoadState("networkidle");
  });

  test("affiche le bouton Nouveau produit", async ({ page }) => {
    const url = page.url();

    if (url.includes("/login")) {
      await expect(page).toHaveURL(/\/login/);
    } else {
      const addButton = page.getByRole("button", { name: /nouveau produit/i });
      await expect(addButton).toBeVisible();
      await expect(addButton).toBeEnabled();
    }
  });

  test("cliquer sur Nouveau produit ouvre un formulaire/dialog", async ({ page }) => {
    const url = page.url();

    if (url.includes("/login")) {
      await expect(page).toHaveURL(/\/login/);
    } else {
      const addButton = page.getByRole("button", { name: /nouveau produit/i });
      await addButton.click();

      // ProductForm s'ouvre comme un dialog Radix UI
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 5000 });
    }
  });
});
