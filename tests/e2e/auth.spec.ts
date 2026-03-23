/**
 * Tests E2E - Flow d'authentification et protection des routes
 *
 * Teste:
 * - Protection des routes (redirection vers /login si non authentifie)
 * - Affichage et fonctionnement de la page login
 * - Navigation entre pages d'authentification
 * - Connexion avec identifiants invalides
 */

import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Protection des routes - Redirection sans authentification
// ---------------------------------------------------------------------------
test.describe("Protection des routes - Redirection vers /login", () => {
  test("la page /caisse redirige vers /login si non authentifie", async ({ page }) => {
    await page.goto("/caisse");
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test("la page /produits redirige vers /login si non authentifie", async ({ page }) => {
    await page.goto("/produits");
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test("la page /rapports redirige vers /login si non authentifie", async ({ page }) => {
    await page.goto("/rapports");
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test("la page /salle redirige vers /login si non authentifie", async ({ page }) => {
    await page.goto("/salle");
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test("la page /clients redirige vers /login si non authentifie", async ({ page }) => {
    await page.goto("/clients");
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test("la page /employes redirige vers /login si non authentifie", async ({ page }) => {
    await page.goto("/employes");
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test("la page /stocks redirige vers /login si non authentifie", async ({ page }) => {
    await page.goto("/stocks");
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test("la page /parametres redirige vers /login si non authentifie", async ({ page }) => {
    await page.goto("/parametres");
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test("la page /livraison redirige vers /login si non authentifie", async ({ page }) => {
    await page.goto("/livraison");
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test("la page /dashboard redirige vers /login si non authentifie", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });
});

// ---------------------------------------------------------------------------
// Page de login - Verification complete
// ---------------------------------------------------------------------------
test.describe("Page de login - Elements et fonctionnement", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("la page de login affiche le titre et le sous-titre", async ({ page }) => {
    await expect(page.locator("h2")).toContainText(/connexion/i);
    await expect(page.getByText(/acc[eé]dez [aà] votre espace/i)).toBeVisible();
  });

  test("le formulaire de login contient email, mot de passe et bouton", async ({ page }) => {
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();

    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toContainText(/connecter/i);
  });

  test("le lien vers la connexion PIN est present", async ({ page }) => {
    const pinLink = page.getByRole("link", { name: /pin/i });
    await expect(pinLink).toBeVisible();
    await expect(pinLink).toHaveAttribute("href", "/login/pin");
  });

  test("le lien vers la creation de compte est present", async ({ page }) => {
    const registerLink = page.getByRole("link", { name: /cr[eé]er/i });
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toHaveAttribute("href", "/register");
  });

  test("le footer affiche le copyright", async ({ page }) => {
    await expect(page.getByText(/or[eé]ma n\+.*pos.*2026/i)).toBeVisible();
  });

  test("connexion avec identifiants invalides affiche une erreur", async ({ page }) => {
    await page.locator("#email").fill("faux@orema.ga");
    await page.locator("#password").fill("mauvaisMotDePasse");
    await page.locator('button[type="submit"]').click();

    // Le toast Sonner affiche "Email ou mot de passe incorrect"
    // Sonner rend les toasts dans un élément [data-sonner-toast] avec le texte dans [data-title]
    const toastOrMessage = page
      .locator('[data-sonner-toast] [data-title], [role="status"], [role="alert"]')
      .filter({ hasText: /incorrect|invalide|erreur/i })
      .first();
    await expect(toastOrMessage).toBeVisible({ timeout: 10000 });
  });

  test("le bouton passe en etat loading apres soumission", async ({ page }) => {
    await page.locator("#email").fill("test@orema.ga");
    await page.locator("#password").fill("password123");
    await page.locator('button[type="submit"]').click();

    // Le texte du bouton change pendant le chargement
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toContainText(/en cours/i);
  });
});

// ---------------------------------------------------------------------------
// Navigation entre pages d'authentification
// ---------------------------------------------------------------------------
test.describe("Navigation entre pages d'authentification", () => {
  test("navigation login -> PIN -> login", async ({ page }) => {
    await page.goto("/login");

    // Aller vers la page PIN
    const pinLink = page.getByRole("link", { name: /pin/i });
    await pinLink.click();
    await expect(page).toHaveURL(/\/login\/pin/);
    await expect(page.getByText(/connexion rapide par pin/i)).toBeVisible();

    // Retour vers la page login
    const backLink = page.getByRole("link", { name: /retour|connexion normale/i });
    await backLink.click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator("h2")).toContainText(/connexion/i);
  });

  test("navigation login -> inscription", async ({ page }) => {
    await page.goto("/login");

    const registerLink = page.getByRole("link", { name: /cr[eé]er/i });
    await registerLink.click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByText(/cr[eé]er un compte/i)).toBeVisible();
  });

  test("navigation inscription -> login", async ({ page }) => {
    await page.goto("/register");

    // La page d'inscription a un lien "Se connecter"
    const loginLink = page.getByRole("link", { name: /connecter/i });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute("href", "/login");

    await loginLink.click();
    await expect(page).toHaveURL(/\/login$/);
  });
});

// ---------------------------------------------------------------------------
// Pages publiques accessibles sans auth
// ---------------------------------------------------------------------------
test.describe("Pages publiques accessibles sans authentification", () => {
  test("la page /login est accessible", async ({ page }) => {
    const response = await page.goto("/login");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("h2")).toContainText(/connexion/i);
  });

  test("la page /register est accessible", async ({ page }) => {
    const response = await page.goto("/register");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByText(/cr[eé]er un compte/i)).toBeVisible();
  });

  test("la page /login/pin est accessible", async ({ page }) => {
    const response = await page.goto("/login/pin");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByText(/connexion rapide par pin/i)).toBeVisible();
  });
});
