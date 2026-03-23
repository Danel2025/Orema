/**
 * Tests E2E - Onglet Ecrans dans les parametres
 *
 * Teste:
 * - La page /parametres redirige vers /login si non authentifie
 * - Les tests avec auth sont skips car necessitent une session
 */

import { test, expect } from "@playwright/test";

test.describe("Parametres - Protection d'acces", () => {
  test("la page /parametres redirige vers /login si non authentifie", async ({ page }) => {
    await page.goto("/parametres");
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });
});

test.describe("Parametres - Onglet Ecrans (necessite auth)", () => {
  // Ces tests necessitent une session authentifiee
  // Ils sont skips car la CI n'a pas de credentials

  test.skip("l'onglet Ecrans est accessible dans les parametres", async ({ page }) => {
    // Necessite auth - skip
    await page.goto("/parametres");
    await page.getByRole("tab", { name: /[eé]crans/i }).click();
    await expect(page.getByText(/[eé]crans d'affichage/i)).toBeVisible();
  });

  test.skip("le bouton Ajouter un ecran est visible", async ({ page }) => {
    // Necessite auth - skip
    await page.goto("/parametres");
    await page.getByRole("tab", { name: /[eé]crans/i }).click();
    await expect(
      page.getByRole("button", { name: /ajouter/i })
    ).toBeVisible();
  });
});
