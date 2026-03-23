/**
 * Tests E2E - Page de connexion
 *
 * Teste les parcours de connexion:
 * - Formulaire email/password (affichage, validation, soumission)
 * - Formulaire PIN (affichage, saisie, validation)
 * - Accessibilite clavier
 * - Responsive mobile/tablette
 */

import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Connexion Email / Password
// ---------------------------------------------------------------------------
test.describe("Page de connexion - Email/Password", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("affiche le formulaire de connexion avec tous les champs", async ({ page }) => {
    // Titre "Connexion"
    await expect(page.locator("h2")).toContainText(/connexion/i);

    // Champ email avec label
    const emailInput = page.locator("#email");
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute("type", "email");

    // Champ mot de passe avec label
    const passwordInput = page.locator("#password");
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Bouton de soumission
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toContainText(/connecter/i);
  });

  test("affiche une erreur pour un email invalide", async ({ page }) => {
    // L'input a type="email", le navigateur bloque la soumission via validation HTML5
    // On vérifie que le champ est invalide côté navigateur
    await page.locator("#email").fill("invalid-email");
    await page.locator("#password").fill("password123");
    await page.locator('button[type="submit"]').click();

    // Le champ email doit être marqué invalide par le navigateur (validation HTML5)
    const emailInput = page.locator("#email");
    const isInvalid = await emailInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    );
    expect(isInvalid).toBe(true);
  });

  test("affiche une erreur pour un mot de passe trop court", async ({ page }) => {
    await page.locator("#email").fill("test@orema.ga");
    await page.locator("#password").fill("12345");
    await page.locator('button[type="submit"]').click();

    // Le schema Zod retourne "au moins 6 caracteres"
    await expect(page.getByText(/au moins 6 caract/i)).toBeVisible();
  });

  test("affiche une erreur pour des identifiants incorrects", async ({ page }) => {
    await page.locator("#email").fill("wrong@orema.ga");
    await page.locator("#password").fill("wrongpassword");
    await page.locator('button[type="submit"]').click();

    // Le toast Sonner affiche "Email ou mot de passe incorrect"
    const toastOrMessage = page
      .locator('[data-sonner-toast] [data-title], [role="status"], [role="alert"]')
      .filter({ hasText: /incorrect|invalide|erreur/i })
      .first();
    await expect(toastOrMessage).toBeVisible({ timeout: 10000 });
  });

  test("le bouton affiche un etat de chargement pendant la soumission", async ({ page }) => {
    await page.locator("#email").fill("test@orema.ga");
    await page.locator("#password").fill("password123");

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Le bouton affiche "Connexion en cours..." pendant le chargement
    await expect(submitButton).toContainText(/en cours/i);
  });

  test("le lien vers la connexion PIN est present et pointe vers /login/pin", async ({ page }) => {
    const pinLink = page.getByRole("link", { name: /pin/i });
    await expect(pinLink).toBeVisible();
    await expect(pinLink).toHaveAttribute("href", "/login/pin");
  });

  test("le lien vers la creation de compte est present et pointe vers /register", async ({
    page,
  }) => {
    const registerLink = page.getByRole("link", { name: /cr[eé]er/i });
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toHaveAttribute("href", "/register");
  });
});

// ---------------------------------------------------------------------------
// Connexion PIN
// ---------------------------------------------------------------------------
test.describe("Page de connexion - PIN", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login/pin");
  });

  test("affiche le formulaire de connexion PIN avec email et champs PIN", async ({ page }) => {
    // Titre "Orema N+"
    await expect(page.getByText(/or[eé]ma n\+/i).first()).toBeVisible();

    // Sous-titre "Connexion rapide par PIN"
    await expect(page.getByText(/connexion rapide par pin/i)).toBeVisible();

    // Champ email
    const emailInput = page.locator("#email");
    await expect(emailInput).toBeVisible();

    // 4 inputs PIN (inputMode="numeric", maxLength=1)
    const pinInputs = page.locator('input[inputmode="numeric"]');
    await expect(pinInputs).toHaveCount(4);
  });

  test("les champs PIN n'acceptent que les chiffres", async ({ page }) => {
    // Saisir une lettre dans le premier champ PIN
    const firstPinInput = page.locator('input[inputmode="numeric"]').first();
    await firstPinInput.fill("a");

    // La valeur doit rester vide (le handler filtre les non-chiffres)
    await expect(firstPinInput).toHaveValue("");
  });

  test("le focus passe automatiquement au champ PIN suivant", async ({ page }) => {
    const pinInputs = page.locator('input[inputmode="numeric"]');

    // Saisir un chiffre dans le premier champ
    await pinInputs.nth(0).fill("1");

    // Le focus doit passer au deuxieme champ
    await expect(pinInputs.nth(1)).toBeFocused();
  });

  test("le lien de retour vers la connexion normale est present", async ({ page }) => {
    const backLink = page.getByRole("link", { name: /retour|connexion normale/i });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/login");
  });

  test("le bouton de soumission est present", async ({ page }) => {
    const submitButton = page.getByRole("button", { name: /connecter/i });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });
});

// ---------------------------------------------------------------------------
// Accessibilite
// ---------------------------------------------------------------------------
test.describe("Accessibilite du formulaire de connexion", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("le formulaire est navigable au clavier (Tab entre champs)", async ({ page }) => {
    // Focus sur le champ email
    const emailInput = page.locator("#email");
    await emailInput.focus();
    await expect(emailInput).toBeFocused();

    // Tab vers le champ mot de passe
    await page.keyboard.press("Tab");
    await expect(page.locator("#password")).toBeFocused();
  });

  test("les champs ont les types HTML corrects pour l'autocompletion", async ({ page }) => {
    const emailInput = page.locator("#email");
    await expect(emailInput).toHaveAttribute("type", "email");
    await expect(emailInput).toHaveAttribute("autocomplete", "email");

    const passwordInput = page.locator("#password");
    await expect(passwordInput).toHaveAttribute("type", "password");
    await expect(passwordInput).toHaveAttribute("autocomplete", "current-password");
  });

  test("le formulaire peut etre soumis avec Enter", async ({ page }) => {
    await page.locator("#email").fill("test@orema.ga");
    await page.locator("#password").fill("password123");
    await page.keyboard.press("Enter");

    // La soumission se declenche : le bouton passe en etat loading
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toContainText(/en cours/i);
  });
});

// ---------------------------------------------------------------------------
// Responsive
// ---------------------------------------------------------------------------
test.describe("Responsive - Page de connexion", () => {
  test("s'affiche correctement sur mobile (375x667)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/login");

    // Les elements principaux doivent etre visibles
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Le titre doit etre visible
    await expect(page.locator("h2")).toContainText(/connexion/i);
  });

  test("s'affiche correctement sur tablette (768x1024)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/login");

    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Navigation entre pages auth
// ---------------------------------------------------------------------------
test.describe("Navigation entre pages auth", () => {
  test("cliquer sur le lien PIN navigue vers /login/pin", async ({ page }) => {
    await page.goto("/login");

    const pinLink = page.getByRole("link", { name: /pin/i });
    await pinLink.click();

    await expect(page).toHaveURL(/\/login\/pin/);
    // Verifier que la page PIN s'affiche
    await expect(page.getByText(/connexion rapide par pin/i)).toBeVisible();
  });

  test("cliquer sur le lien inscription navigue vers /register", async ({ page }) => {
    await page.goto("/login");

    const registerLink = page.getByRole("link", { name: /cr[eé]er/i });
    await registerLink.click();

    await expect(page).toHaveURL(/\/register/);
    // Verifier que la page d'inscription s'affiche
    await expect(page.getByText(/cr[eé]er un compte/i)).toBeVisible();
  });

  test("depuis la page PIN, le lien retour navigue vers /login", async ({ page }) => {
    await page.goto("/login/pin");

    const backLink = page.getByRole("link", { name: /retour|connexion normale/i });
    await backLink.click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator("h2")).toContainText(/connexion/i);
  });
});
