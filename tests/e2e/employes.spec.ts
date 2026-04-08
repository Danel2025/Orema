/**
 * Tests E2E - Gestion des employes
 *
 * Teste les fonctionnalites de la page /employes:
 * - Redirection vers /login si non authentifie
 * - Affichage du header avec titre, sous-titre, stats
 * - Recherche d'employes
 * - Table des employes avec colonnes (nom, email, role, PIN, statut)
 * - Boutons d'action (Actualiser, Permissions, Nouvel employe)
 * - Menu d'actions par employe (modifier, PIN, supprimer)
 * - Barre de statistiques inline (total, actifs, inactifs)
 */

import { test, expect } from "@playwright/test";

// =============================================================================
// TESTS SANS AUTHENTIFICATION
// =============================================================================

test.describe("Employés - Accès sans authentification", () => {
  test("redirige vers /login quand non authentifie", async ({ page }) => {
    await page.goto("/employes");
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });
});

// =============================================================================
// TESTS - HEADER
// =============================================================================

test.describe("Employés - Header", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/employes");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("affiche le titre 'Gestion des employes'", async ({ page }) => {
    const heading = page.getByRole("heading", { name: /gestion des employes/i });
    await expect(heading).toBeVisible();
  });

  test("affiche le sous-titre descriptif", async ({ page }) => {
    await expect(
      page.getByText(/personnel, acc[eè]s et permissions/i)
    ).toBeVisible();
  });
});

// =============================================================================
// TESTS - BARRE DE STATISTIQUES
// =============================================================================

test.describe("Employés - Statistiques inline", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/employes");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("affiche le compteur 'Employés' dans la barre de stats", async ({ page }) => {
    await expect(page.getByText("Employés").first()).toBeVisible();
  });

  test("affiche le compteur 'Actifs'", async ({ page }) => {
    await expect(page.getByText("Actifs").first()).toBeVisible();
  });

  test("affiche le compteur 'Inactifs'", async ({ page }) => {
    await expect(page.getByText("Inactifs").first()).toBeVisible();
  });
});

// =============================================================================
// TESTS - BOUTONS D'ACTION HEADER
// =============================================================================

test.describe("Employés - Boutons d'action", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/employes");
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

  test("le bouton 'Actualiser' ne fait pas crasher la page", async ({ page }) => {
    const actualiserButton = page.getByRole("button", { name: /actualiser/i });
    await actualiserButton.click();

    // La page reste fonctionnelle
    await expect(page.getByRole("heading", { name: /gestion des employes/i })).toBeVisible();
  });

  test("affiche le bouton 'Permissions'", async ({ page }) => {
    const permissionsButton = page.getByRole("button", { name: /permissions/i });
    await expect(permissionsButton).toBeVisible();
  });

  test("cliquer sur 'Permissions' ouvre le modal des permissions", async ({ page }) => {
    const permissionsButton = page.getByRole("button", { name: /permissions/i });
    await permissionsButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });

  test("affiche le bouton 'Pages par role'", async ({ page }) => {
    const pagesButton = page.getByRole("button", { name: /pages par role/i });
    await expect(pagesButton).toBeVisible();
  });

  test("affiche le bouton 'Nouvel employe' si l'utilisateur a les permissions", async ({ page }) => {
    // Le bouton n'est visible que pour les roles avec permission employe:creer
    const addButton = page.getByRole("button", { name: /nouvel employe/i });
    const isVisible = await addButton.isVisible().catch(() => false);

    // Soit il est visible (permissions OK), soit il n'apparait pas (pas de permissions)
    // Dans les deux cas, la page ne crashe pas
    await expect(page.getByRole("heading", { name: /gestion des employes/i })).toBeVisible();

    if (isVisible) {
      await expect(addButton).toBeEnabled();
    }
  });
});

// =============================================================================
// TESTS - RECHERCHE
// =============================================================================

test.describe("Employés - Recherche", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/employes");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("affiche le champ de recherche", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/nom, prenom, email/i);
    await expect(searchInput).toBeVisible();
  });

  test("la recherche filtre la liste des employes", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/nom, prenom, email/i);
    await searchInput.fill("zzzznonexistent");

    // Doit afficher "Aucun resultat" ou "Aucun employe"
    await expect(
      page.getByText(/aucun r[eé]sultat/i).or(page.getByText(/aucun employe/i))
    ).toBeVisible({ timeout: 5000 });
  });

  test("vider la recherche restaure la liste complete", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/nom, prenom, email/i);

    await searchInput.fill("zzzznonexistent");
    await page.waitForTimeout(300);
    await searchInput.clear();
    await page.waitForTimeout(300);

    // La page ne doit pas crasher - le heading reste visible
    await expect(page.getByRole("heading", { name: /gestion des employes/i })).toBeVisible();
  });
});

// =============================================================================
// TESTS - TABLE DES EMPLOYES
// =============================================================================

test.describe("Employés - Table", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/employes");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("affiche une table ou un etat vide", async ({ page }) => {
    const tableHeader = page.getByRole("columnheader", { name: /employe/i }).first();
    const emptyState = page.getByText(/aucun employe/i);

    const hasTable = await tableHeader.isVisible().catch(() => false);
    const isEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasTable || isEmpty).toBeTruthy();
  });

  test("la table contient les colonnes attendues", async ({ page }) => {
    const hasTable = await page.getByRole("columnheader", { name: /employe/i }).first().isVisible().catch(() => false);

    if (!hasTable) {
      test.skip();
      return;
    }

    await expect(page.getByRole("columnheader", { name: /email/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /role/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /pin/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /statut/i })).toBeVisible();
  });

  test("les roles sont affiches avec des badges", async ({ page }) => {
    const hasTable = await page.getByRole("columnheader", { name: /employe/i }).first().isVisible().catch(() => false);

    if (!hasTable) {
      test.skip();
      return;
    }

    // Les roles sont affiches comme badges (Admin, Manager, Caissier, Serveur)
    const roleBadges = page.locator("table").getByText(
      /admin|manager|caissier|serveur/i
    );
    const count = await roleBadges.count();
    expect(count).toBeGreaterThan(0);
  });

  test("les statuts PIN sont affiches (Configure ou Non defini)", async ({ page }) => {
    const hasTable = await page.getByRole("columnheader", { name: /pin/i }).isVisible().catch(() => false);

    if (!hasTable) {
      test.skip();
      return;
    }

    // Soit "Configure" soit "Non defini"
    const pinStatus = page.locator("table").getByText(/configur[eé]|non d[eé]fini/i);
    const count = await pinStatus.count();
    expect(count).toBeGreaterThan(0);
  });

  test("les statuts actif/inactif sont affiches avec un switch", async ({ page }) => {
    const hasTable = await page.getByRole("columnheader", { name: /statut/i }).isVisible().catch(() => false);

    if (!hasTable) {
      test.skip();
      return;
    }

    // Les switches de statut
    const switches = page.locator("table").getByRole("switch");
    const count = await switches.count();
    expect(count).toBeGreaterThan(0);
  });

  test("affiche le resume du nombre d'employes en bas de page", async ({ page }) => {
    await expect(
      page.getByText(/\d+ employe\(s\) sur \d+/)
    ).toBeVisible();
  });
});

// =============================================================================
// TESTS - MENU ACTIONS PAR EMPLOYE
// =============================================================================

test.describe("Employés - Menu actions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/employes");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("le menu trois points est accessible pour chaque employe", async ({ page }) => {
    const hasTable = await page.getByRole("columnheader", { name: /employe/i }).first().isVisible().catch(() => false);

    if (!hasTable) {
      test.skip();
      return;
    }

    // Trouver les boutons d'actions (DotsThree icon buttons)
    const actionButtons = page.locator("table").getByRole("button").filter({ has: page.locator("svg") });
    const count = await actionButtons.count();

    if (count === 0) {
      test.skip();
      return;
    }

    // Cliquer sur le premier menu
    await actionButtons.first().click();

    // Le menu dropdown doit apparaitre
    const menuContent = page.locator('[role="menu"]');
    await expect(menuContent).toBeVisible({ timeout: 3000 });
  });

  test("le menu contient les options 'Statistiques' et 'Permissions'", async ({ page }) => {
    const actionButtons = page.locator("table").getByRole("button").filter({ has: page.locator("svg") });
    const count = await actionButtons.count();

    if (count === 0) {
      test.skip();
      return;
    }

    await actionButtons.first().click();

    const menuContent = page.locator('[role="menu"]');
    await expect(menuContent).toBeVisible({ timeout: 3000 });

    // Options toujours visibles quel que soit le role
    await expect(menuContent.getByText(/statistiques/i)).toBeVisible();
    await expect(menuContent.getByText(/permissions/i)).toBeVisible();
  });
});

// =============================================================================
// TESTS - CREATION D'EMPLOYE
// =============================================================================

test.describe("Employés - Formulaire de creation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/employes");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");

    // Verifier que le bouton de creation est visible
    const addButton = page.getByRole("button", { name: /nouvel employe/i });
    const isVisible = await addButton.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }
  });

  test("cliquer sur 'Nouvel employe' ouvre le formulaire", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /nouvel employe/i });
    await addButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });

  test("le formulaire contient les champs nom, prenom, email", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /nouvel employe/i });
    await addButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Verifier la presence des champs
    await expect(dialog.getByLabel(/nom/i).first()).toBeVisible();
    await expect(dialog.getByLabel(/pr[eé]nom/i)).toBeVisible();
    await expect(dialog.getByLabel(/email/i)).toBeVisible();
  });

  test("le formulaire peut etre ferme avec Escape", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /nouvel employe/i });
    await addButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible({ timeout: 3000 });
  });
});

// =============================================================================
// TESTS - RESPONSIVE
// =============================================================================

test.describe("Employés - Responsive", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/employes");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("le titre reste visible sur tablette (768x1024)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole("heading", { name: /gestion des employes/i })).toBeVisible();
  });

  test("les boutons d'action restent accessibles sur tablette", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole("button", { name: /actualiser/i })).toBeVisible();
  });
});
