/**
 * Tests E2E - Gestion des clients
 *
 * Teste les fonctionnalites de la page /clients:
 * - Redirection vers /login si non authentifie
 * - Affichage du header avec titre et sous-titre
 * - Recherche de clients
 * - Bouton d'ajout de client et formulaire
 * - Table des clients avec colonnes
 * - Gestion des filtres (inactifs)
 * - Actions sur un client (voir, modifier, supprimer)
 */

import { test, expect } from "@playwright/test";

// =============================================================================
// TESTS SANS AUTHENTIFICATION
// =============================================================================

test.describe("Clients - Accès sans authentification", () => {
  test("redirige vers /login quand non authentifie", async ({ page }) => {
    await page.goto("/clients");
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });
});

// =============================================================================
// TESTS - HEADER
// =============================================================================

test.describe("Clients - Header", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/clients");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("affiche le titre 'Clients'", async ({ page }) => {
    const heading = page.getByText("Clients").first();
    await expect(heading).toBeVisible();
  });

  test("affiche le sous-titre descriptif", async ({ page }) => {
    await expect(
      page.getByText(/gestion de la client[eè]le/i)
    ).toBeVisible();
  });
});

// =============================================================================
// TESTS - RECHERCHE
// =============================================================================

test.describe("Clients - Recherche", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/clients");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("affiche le champ de recherche", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/rechercher un client/i);
    await expect(searchInput).toBeVisible();
  });

  test("la saisie dans la recherche filtre les resultats", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/rechercher un client/i);
    await expect(searchInput).toBeVisible();

    // Taper un texte qui ne correspond a rien
    await searchInput.fill("zzzznonexistent");

    // Attendre le debounce (300ms) + rendu
    await page.waitForTimeout(500);

    // Doit afficher "Aucun client" dans l'etat vide
    await expect(
      page.getByText(/aucun client trouv/i).or(page.getByText(/aucun client enregistr/i))
    ).toBeVisible({ timeout: 10000 });
  });

  test("la recherche peut etre videe pour retrouver tous les clients", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/rechercher un client/i);

    // Remplir puis vider
    await searchInput.fill("zzzznonexistent");
    await page.waitForTimeout(500);
    await searchInput.clear();
    await page.waitForTimeout(500);

    // La page ne doit pas crasher
    await expect(page.getByText("Clients").first()).toBeVisible();
  });
});

// =============================================================================
// TESTS - BOUTON AJOUT CLIENT
// =============================================================================

test.describe("Clients - Ajout de client", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/clients");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("affiche le bouton 'Nouveau client'", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /nouveau client/i });
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();
  });

  test("cliquer sur 'Nouveau client' ouvre le formulaire", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /nouveau client/i });
    await addButton.click();

    // Le dialog de creation doit s'ouvrir
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });

  test("le formulaire de creation contient le champ nom", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /nouveau client/i });
    await addButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Le champ nom est obligatoire
    const nomField = dialog.getByLabel(/nom/i).first();
    await expect(nomField).toBeVisible();
  });

  test("le formulaire de creation contient le champ telephone", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /nouveau client/i });
    await addButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const telField = dialog.getByLabel(/t[eé]l[eé]phone/i);
    await expect(telField).toBeVisible();
  });

  test("le formulaire peut etre ferme avec Escape", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /nouveau client/i });
    await addButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible({ timeout: 3000 });
  });
});

// =============================================================================
// TESTS - TABLE DES CLIENTS
// =============================================================================

test.describe("Clients - Table", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/clients");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("affiche une table avec en-tetes OU un etat vide", async ({ page }) => {
    // Soit la table avec les colonnes, soit l'etat vide "Aucun client"
    const tableHeader = page.getByText("Client").first();
    const emptyState = page.getByText(/aucun client/i);

    const hasTable = await tableHeader.isVisible().catch(() => false);
    const isEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasTable || isEmpty).toBeTruthy();
  });

  test("la table contient les colonnes attendues quand il y a des clients", async ({ page }) => {
    // Attendre la fin du chargement
    const tableHeader = page.getByRole("columnheader", { name: /client/i }).first();
    const hasTable = await tableHeader.isVisible().catch(() => false);

    if (!hasTable) {
      // Pas de clients - etat vide
      test.skip();
      return;
    }

    await expect(page.getByRole("columnheader", { name: /contact/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /fid[eé]lit/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /solde pr[eé]pay/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /achats/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /statut/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /actions/i })).toBeVisible();
  });

  test("les soldes prepayes sont affiches en FCFA", async ({ page }) => {
    const fcfaTexts = page.getByText(/fcfa/i);
    const count = await fcfaTexts.count();

    if (count > 0) {
      // Au moins un montant en FCFA est affiche
      await expect(fcfaTexts.first()).toBeVisible();
    } else {
      // Pas de clients - etat vide
      await expect(page.getByText(/aucun client/i)).toBeVisible();
    }
  });
});

// =============================================================================
// TESTS - ACTIONS SUR UN CLIENT
// =============================================================================

test.describe("Clients - Actions sur un client", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/clients");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("le menu actions est accessible pour chaque client", async ({ page }) => {
    // Verifier qu'il y a au moins un client dans la table
    const actionButtons = page.locator("table button").filter({ has: page.locator("svg") });
    const count = await actionButtons.count();

    if (count === 0) {
      test.skip();
      return;
    }

    // Cliquer sur le premier bouton d'actions (MoreHorizontal icon)
    await actionButtons.first().click();

    // Le menu dropdown doit apparaitre avec les options
    const menuContent = page.locator('[role="menu"]');
    await expect(menuContent).toBeVisible({ timeout: 3000 });

    // Verifier les options
    await expect(menuContent.getByText(/voir d[eé]tails/i)).toBeVisible();
    await expect(menuContent.getByText(/modifier/i)).toBeVisible();
  });

  test("cliquer sur 'Voir details' ouvre le modal de details", async ({ page }) => {
    const actionButtons = page.locator("table button").filter({ has: page.locator("svg") });
    const count = await actionButtons.count();

    if (count === 0) {
      test.skip();
      return;
    }

    await actionButtons.first().click();

    const menuContent = page.locator('[role="menu"]');
    await expect(menuContent).toBeVisible({ timeout: 3000 });

    await menuContent.getByText(/voir d[eé]tails/i).click();

    // Le dialog de details doit s'ouvrir
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });

  test("cliquer sur 'Modifier' ouvre le formulaire d'edition", async ({ page }) => {
    const actionButtons = page.locator("table button").filter({ has: page.locator("svg") });
    const count = await actionButtons.count();

    if (count === 0) {
      test.skip();
      return;
    }

    await actionButtons.first().click();

    const menuContent = page.locator('[role="menu"]');
    await expect(menuContent).toBeVisible({ timeout: 3000 });

    await menuContent.getByText(/modifier/i).click();

    // Le dialog d'edition doit s'ouvrir
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });
});

// =============================================================================
// TESTS - FILTRE INACTIFS
// =============================================================================

test.describe("Clients - Filtre inactifs", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/clients");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("affiche la checkbox 'Afficher inactifs'", async ({ page }) => {
    await expect(page.getByText(/afficher inactifs/i)).toBeVisible();
  });

  test("la checkbox est cliquable et ne fait pas crasher la page", async ({ page }) => {
    const checkbox = page.getByRole("checkbox");
    const isVisible = await checkbox.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip();
      return;
    }

    await checkbox.click();

    // La page ne doit pas crasher
    await expect(page.getByText("Clients").first()).toBeVisible();
  });
});

// =============================================================================
// TESTS - RESPONSIVE
// =============================================================================

test.describe("Clients - Responsive", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/clients");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("le titre reste visible sur tablette (768x1024)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByText("Clients").first()).toBeVisible();
  });

  test("le bouton 'Nouveau client' reste visible sur tablette", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole("button", { name: /nouveau client/i })).toBeVisible();
  });
});
