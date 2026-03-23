/**
 * Tests E2E - Page /display (ecrans d'affichage KDS)
 *
 * Teste:
 * - La page /display existe et repond sans erreur 500
 * - L'API /api/display/auth repond correctement
 * - Acces sans token ou avec token invalide
 */

import { test, expect } from "@playwright/test";

test.describe("Page /display - Ecrans d'affichage", () => {
  test("la page /display/test-id repond sans erreur serveur (status < 500)", async ({ page }) => {
    const response = await page.goto("/display/test-id");
    expect(response).not.toBeNull();
    // La page ne doit pas retourner une erreur 500+
    expect(response!.status()).toBeLessThan(500);
  });

  test("la page /display/test-id sans token affiche un contenu (pas de page blanche)", async ({ page }) => {
    await page.goto("/display/test-id");
    // Attendre que la page se charge
    await page.waitForLoadState("domcontentloaded");

    // La page doit avoir du contenu visible (soit erreur display, soit redirection vers login)
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test("la page /display/test-id avec token invalide repond sans erreur serveur", async ({ page }) => {
    const response = await page.goto("/display/test-id?token=invalid-token-12345");
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(500);
  });
});

test.describe("API /api/display/auth - Validation des tokens", () => {
  test("retourne une erreur (400 ou 401) sans parametre token", async ({ request }) => {
    const response = await request.get("/api/display/auth");
    // Sans token, l'API doit retourner une erreur client (400 ou 401)
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);

    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test("retourne une erreur avec un token invalide", async ({ request }) => {
    const response = await request.get("/api/display/auth?token=fake-invalid-token");

    // Doit retourner 401 (token invalide) ou 500 (erreur RPC si DB non configuree)
    expect(response.status()).toBeGreaterThanOrEqual(400);

    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test("retourne un JSON valide meme en cas d'erreur", async ({ request }) => {
    const response = await request.get("/api/display/auth?token=test");
    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("application/json");
  });
});
