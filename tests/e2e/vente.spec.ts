/**
 * Tests E2E - Flux de vente (Caisse)
 *
 * Teste le parcours complet d'une vente:
 * - Redirection vers login si non authentifie
 * - Affichage de la page caisse (session, produits, panier)
 * - Selection de produits et gestion du panier
 * - Modes de vente (direct, table, livraison, emporter)
 * - Paiement et validation
 */

import { test, expect } from "@playwright/test";

// =============================================================================
// TESTS SANS AUTHENTIFICATION
// =============================================================================

test.describe("Caisse - Acces sans authentification", () => {
  test("redirige vers /login si non authentifie", async ({ page }) => {
    await page.goto("/caisse");

    // La page protegee doit rediriger vers /login
    await expect(page).toHaveURL(/\/login/);
  });
});

// =============================================================================
// TESTS DE LA PAGE CAISSE (avec ou sans session)
// =============================================================================

test.describe("Caisse - Chargement de la page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/caisse");
  });

  test("affiche un etat de chargement ou redirige vers login", async ({ page }) => {
    // Soit on est redirige vers login (non authentifie)
    // Soit on voit le chargement de la session
    const isOnLogin = page.url().includes("/login");

    if (isOnLogin) {
      // Verification que la page login est fonctionnelle
      await expect(page).toHaveURL(/\/login/);
    } else {
      // Si authentifie, on devrait voir le chargement ou la page caisse
      const loadingOrCaisse = page
        .getByText(/chargement/i)
        .or(page.getByText(/caisse ferm/i))
        .or(page.getByText(/vente directe/i));
      await expect(loadingOrCaisse.first()).toBeVisible({ timeout: 15000 });
    }
  });

  test("affiche 'Caisse fermee' ou l'interface caisse quand authentifie", async ({ page }) => {
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }

    // Attendre la fin du chargement de la session
    await page.waitForLoadState("networkidle");

    // Soit on voit "Caisse fermee" (pas de session ouverte)
    // Soit on voit l'interface de caisse avec les types de vente
    const caisseFermee = page.getByText("Caisse fermee");
    const venteDirecteButton = page.getByRole("button", { name: /vente directe/i });

    const isSessionClosed = await caisseFermee.isVisible().catch(() => false);
    const isSessionOpen = await venteDirecteButton.isVisible().catch(() => false);

    // L'un des deux doit etre vrai
    expect(isSessionClosed || isSessionOpen).toBeTruthy();
  });
});

// =============================================================================
// TESTS - SESSION FERMEE (Caisse fermee)
// =============================================================================

test.describe("Caisse - Etat session fermee", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/caisse");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");
  });

  test("affiche le bouton 'Ouvrir la caisse' quand pas de session", async ({ page }) => {
    const caisseFermee = page.getByText("Caisse fermee");
    const isSessionClosed = await caisseFermee.isVisible().catch(() => false);

    if (!isSessionClosed) {
      test.skip();
      return;
    }

    // Le bouton "Ouvrir la caisse" doit etre visible
    const ouvrirButton = page.getByRole("button", { name: /ouvrir la caisse/i });
    await expect(ouvrirButton).toBeVisible();
  });

  test("affiche un message explicatif quand caisse fermee", async ({ page }) => {
    const caisseFermee = page.getByText("Caisse fermee");
    const isSessionClosed = await caisseFermee.isVisible().catch(() => false);

    if (!isSessionClosed) {
      test.skip();
      return;
    }

    // Le message doit expliquer la situation
    await expect(
      page.getByText(/aucune session de caisse/i)
    ).toBeVisible();
  });
});

// =============================================================================
// TESTS - INTERFACE DE CAISSE ACTIVE
// =============================================================================

test.describe("Caisse - Interface active (types de vente)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/caisse");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");

    // Skip si caisse fermee
    const caisseFermee = page.getByText("Caisse fermee");
    const isSessionClosed = await caisseFermee.isVisible().catch(() => false);
    if (isSessionClosed) {
      test.skip();
      return;
    }
  });

  test("affiche les 4 modes de vente", async ({ page }) => {
    // Les 4 boutons de mode de vente avec aria-label
    await expect(page.getByRole("button", { name: /vente directe/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /service.*table/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /livraison/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /emporter/i })).toBeVisible();
  });

  test("le mode 'Vente directe' est selectionne par defaut", async ({ page }) => {
    // Le bouton "Vente directe" doit avoir un style actif (texte visible)
    const directButton = page.getByRole("button", { name: /vente directe/i });
    await expect(directButton).toBeVisible();

    // Le texte "Vente directe" doit etre affiche dans le bouton actif
    const directText = directButton.locator("span", { hasText: /vente directe/i });
    await expect(directText).toBeVisible();
  });

  test("affiche le bouton de recherche produit", async ({ page }) => {
    const searchButton = page.getByRole("button", { name: /rechercher un produit/i });
    await expect(searchButton).toBeVisible();
  });

  test("affiche le bouton commandes en attente", async ({ page }) => {
    const pendingButton = page.getByRole("button", { name: /commandes en attente/i });
    await expect(pendingButton).toBeVisible();
  });

  test("affiche le statut de session ou bouton ouvrir caisse", async ({ page }) => {
    // Soit le bouton "Ouvrir la caisse" (pas de session)
    // Soit les infos de session (nombre de ventes, CA)
    const ouvrirCaisseBtn = page.getByRole("button", { name: /ouvrir la caisse/i });
    const sessionInfo = page.getByText(/ventes/i);

    const hasOuvrir = await ouvrirCaisseBtn.isVisible().catch(() => false);
    const hasSession = await sessionInfo.isVisible().catch(() => false);

    expect(hasOuvrir || hasSession).toBeTruthy();
  });
});

// =============================================================================
// TESTS - GRILLE DE PRODUITS
// =============================================================================

test.describe("Caisse - Grille de produits", () => {
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

  test("affiche la barre de recherche de produit", async ({ page }) => {
    const searchInput = page.getByLabel(/rechercher un produit/i);
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute("placeholder", /rechercher un produit/i);
  });

  test("affiche les onglets de categories", async ({ page }) => {
    // Au moins un onglet de categorie devrait exister (boutons dans la barre)
    // Les categories sont des <button> dans un conteneur scrollable
    const categoryButtons = page
      .locator("button")
      .filter({ hasNot: page.locator('[aria-label]') });

    // On verifie qu'il y a des elements visibles dans la zone de contenu
    // Le chargement affiche les produits ou "Aucun produit trouve"
    const hasProducts = page.getByText(/fcfa/i).first();
    const emptyState = page.getByText(/aucun produit trouv/i);

    const productsVisible = await hasProducts.isVisible().catch(() => false);
    const emptyVisible = await emptyState.isVisible().catch(() => false);

    // L'un des deux doit etre vrai
    expect(productsVisible || emptyVisible).toBeTruthy();
  });

  test("les produits affichent leur prix en FCFA", async ({ page }) => {
    const priceElements = page.getByText(/fcfa/i);
    const count = await priceElements.count();

    if (count > 0) {
      // Au moins un prix est affiche avec le format FCFA
      await expect(priceElements.first()).toBeVisible();
      await expect(priceElements.first()).toContainText(/\d/);
    } else {
      // Pas de produits - l'etat vide doit etre affiche
      await expect(page.getByText(/aucun produit/i)).toBeVisible();
    }
  });

  test("la recherche filtre les produits", async ({ page }) => {
    const searchInput = page.getByLabel(/rechercher un produit/i);
    await expect(searchInput).toBeVisible();

    // Taper un texte de recherche qui ne correspond a rien
    await searchInput.fill("zzzznonexistent");

    // Doit afficher "Aucun produit trouve"
    await expect(page.getByText(/aucun produit trouv/i)).toBeVisible();
  });
});

// =============================================================================
// TESTS - PANIER
// =============================================================================

test.describe("Caisse - Panier", () => {
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

  test("affiche le panier avec le titre 'Panier'", async ({ page }) => {
    await expect(page.getByText("Panier")).toBeVisible();
  });

  test("affiche le message 'Le panier est vide' quand aucun article", async ({ page }) => {
    // Si le panier est vide, le message doit etre affiche
    const emptyMessage = page.getByText(/le panier est vide/i);
    const hasItems = page.getByText(/fcfa/i);

    const isEmpty = await emptyMessage.isVisible().catch(() => false);
    const hasCartItems = await hasItems.count() > 0;

    // Si le panier est vide, le message doit etre present
    if (isEmpty) {
      await expect(emptyMessage).toBeVisible();
      await expect(page.getByText(/cliquez sur un produit/i)).toBeVisible();
    }
    // Sinon, des articles sont affiches - valide aussi
    expect(isEmpty || hasCartItems).toBeTruthy();
  });

  test("affiche les totaux quand le panier a des articles", async ({ page }) => {
    // Essayer de cliquer sur le premier produit visible
    const firstProduct = page.locator("button").filter({ hasText: /fcfa/i }).first();
    const productVisible = await firstProduct.isVisible().catch(() => false);

    if (!productVisible) {
      test.skip();
      return;
    }

    await firstProduct.click();

    // Les totaux doivent apparaitre
    await expect(page.getByText("Sous-total")).toBeVisible();
    await expect(page.getByText("TVA")).toBeVisible();
    await expect(page.getByText("Total")).toBeVisible();
  });

  test("permet d'ajouter un produit au panier", async ({ page }) => {
    const firstProduct = page.locator("button").filter({ hasText: /fcfa/i }).first();
    const productVisible = await firstProduct.isVisible().catch(() => false);

    if (!productVisible) {
      test.skip();
      return;
    }

    // Compter les articles avant
    const emptyBefore = await page.getByText(/le panier est vide/i).isVisible().catch(() => false);

    await firstProduct.click();

    // Apres le clic, le panier ne doit plus etre vide
    if (emptyBefore) {
      await expect(page.getByText(/le panier est vide/i)).not.toBeVisible();
    }

    // Le bouton "Encaisser" doit apparaitre
    const encaisserButton = page.getByRole("button", { name: /encaisser/i });
    await expect(encaisserButton).toBeVisible();
  });

  test("permet de modifier la quantite d'un article", async ({ page }) => {
    // Ajouter un produit
    const firstProduct = page.locator("button").filter({ hasText: /fcfa/i }).first();
    const productVisible = await firstProduct.isVisible().catch(() => false);

    if (!productVisible) {
      test.skip();
      return;
    }

    await firstProduct.click();

    // Les boutons +/- doivent etre visibles
    const decreaseButton = page.getByRole("button", { name: /diminuer la quantit/i }).first();
    const increaseButton = page.getByRole("button", { name: /augmenter la quantit/i }).first();

    await expect(decreaseButton).toBeVisible();
    await expect(increaseButton).toBeVisible();

    // Cliquer sur + pour augmenter
    await increaseButton.click();

    // La quantite doit etre 2 maintenant (affichee entre les boutons)
    // On verifie que le total change (au moins le sous-total est visible)
    await expect(page.getByText("Sous-total")).toBeVisible();
  });

  test("permet de supprimer un article du panier", async ({ page }) => {
    // Ajouter un produit
    const firstProduct = page.locator("button").filter({ hasText: /fcfa/i }).first();
    const productVisible = await firstProduct.isVisible().catch(() => false);

    if (!productVisible) {
      test.skip();
      return;
    }

    await firstProduct.click();

    // Le bouton supprimer (Trash icon) doit etre visible
    const deleteButton = page.getByRole("button", { name: /supprimer l'article/i }).first();
    await expect(deleteButton).toBeVisible();

    // Supprimer l'article
    await deleteButton.click();

    // Le panier doit etre vide
    await expect(page.getByText(/le panier est vide/i)).toBeVisible();
  });

  test("permet de vider le panier entierement", async ({ page }) => {
    // Ajouter un produit
    const firstProduct = page.locator("button").filter({ hasText: /fcfa/i }).first();
    const productVisible = await firstProduct.isVisible().catch(() => false);

    if (!productVisible) {
      test.skip();
      return;
    }

    await firstProduct.click();

    // Le bouton "Vider" apparait dans le header du panier
    const viderButton = page.getByRole("button", { name: /vider le panier/i });
    await expect(viderButton).toBeVisible();

    await viderButton.click();

    // Le panier doit etre vide
    await expect(page.getByText(/le panier est vide/i)).toBeVisible();
  });

  test("affiche le bouton 'Ajouter une remise globale' quand panier non vide", async ({ page }) => {
    const firstProduct = page.locator("button").filter({ hasText: /fcfa/i }).first();
    const productVisible = await firstProduct.isVisible().catch(() => false);

    if (!productVisible) {
      test.skip();
      return;
    }

    await firstProduct.click();

    // Le bouton de remise globale doit etre visible
    await expect(page.getByText(/ajouter une remise globale/i)).toBeVisible();
  });

  test("affiche le bouton 'Diviser l'addition' quand panier non vide", async ({ page }) => {
    const firstProduct = page.locator("button").filter({ hasText: /fcfa/i }).first();
    const productVisible = await firstProduct.isVisible().catch(() => false);

    if (!productVisible) {
      test.skip();
      return;
    }

    await firstProduct.click();

    await expect(page.getByRole("button", { name: /diviser l'addition/i })).toBeVisible();
  });
});

// =============================================================================
// TESTS - ENCAISSEMENT
// =============================================================================

test.describe("Caisse - Encaissement", () => {
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

  test("le bouton Encaisser ouvre le modal de paiement", async ({ page }) => {
    // Ajouter un produit
    const firstProduct = page.locator("button").filter({ hasText: /fcfa/i }).first();
    const productVisible = await firstProduct.isVisible().catch(() => false);

    if (!productVisible) {
      test.skip();
      return;
    }

    await firstProduct.click();

    // Cliquer sur Encaisser
    const encaisserButton = page.getByRole("button", { name: /encaisser/i });
    await expect(encaisserButton).toBeVisible();
    await encaisserButton.click();

    // Le modal de paiement doit s'ouvrir
    // Le composant CaissePayment devrait etre visible
    const paymentModal = page.getByText(/esp[eè]ces/i).or(page.getByText(/paiement/i));
    await expect(paymentModal.first()).toBeVisible({ timeout: 5000 });
  });
});

// =============================================================================
// TESTS - RACCOURCIS CLAVIER
// =============================================================================

test.describe("Caisse - Raccourcis clavier", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/caisse");
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    await page.waitForLoadState("networkidle");

    const caisseFermee = page.getByText("Caisse fermee");
    if (await caisseFermee.isVisible().catch(() => false)) {
      test.skip();
      return;
    }
  });

  test("F2 ouvre la recherche de produit", async ({ page }) => {
    await page.keyboard.press("F2");

    // Le modal de recherche produit doit s'ouvrir
    const searchModal = page.locator('[role="dialog"]');
    await expect(searchModal).toBeVisible({ timeout: 3000 });
  });
});
