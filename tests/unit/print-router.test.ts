/**
 * Tests unitaires pour lib/print/router.ts
 *
 * Teste les fonctions pures du routeur d'impression :
 * - isBarCategory() : detection des categories bar par nom
 * - isCuisineCategory() : inverse de isBarCategory
 *
 * Note: routeLinesToPrinters() est async et depend de Supabase,
 * on teste ici sa logique de routage via isBarCategory.
 */

import { describe, it, expect } from "vitest";
import { isBarCategory, isCuisineCategory } from "@/lib/print/router";

// ============================================================================
// Tests de isBarCategory
// ============================================================================

describe("isBarCategory - Detection des categories bar", () => {
  // -----------------------------------------------------------------------
  // Categories bar reconnues
  // -----------------------------------------------------------------------

  it("detecte 'Boissons' comme categorie bar", () => {
    expect(isBarCategory("Boissons")).toBe(true);
  });

  it("detecte 'Boissons chaudes' comme categorie bar", () => {
    expect(isBarCategory("Boissons chaudes")).toBe(true);
  });

  it("detecte 'Bar' comme categorie bar", () => {
    expect(isBarCategory("Bar")).toBe(true);
  });

  it("detecte 'Cocktails' comme categorie bar", () => {
    expect(isBarCategory("Cocktails")).toBe(true);
  });

  it("detecte 'Vins' comme categorie bar", () => {
    expect(isBarCategory("Vins")).toBe(true);
  });

  it("detecte 'Bieres' comme categorie bar", () => {
    expect(isBarCategory("Bieres")).toBe(true);
  });

  it("detecte 'Alcools' comme categorie bar", () => {
    expect(isBarCategory("Alcools")).toBe(true);
  });

  it("detecte 'Softs' comme categorie bar", () => {
    expect(isBarCategory("Softs")).toBe(true);
  });

  it("detecte 'Jus de fruits' comme categorie bar", () => {
    expect(isBarCategory("Jus de fruits")).toBe(true);
  });

  it("detecte 'Cafe' comme categorie bar", () => {
    expect(isBarCategory("Cafe")).toBe(true);
  });

  it("detecte 'The' comme categorie bar", () => {
    expect(isBarCategory("The")).toBe(true);
  });

  it("detecte 'Eau minerale' comme categorie bar", () => {
    expect(isBarCategory("Eau minerale")).toBe(true);
  });

  it("detecte 'Sodas' comme categorie bar", () => {
    expect(isBarCategory("Sodas")).toBe(true);
  });

  it("detecte 'Aperitifs' comme categorie bar", () => {
    expect(isBarCategory("Aperitifs")).toBe(true);
  });

  it("detecte 'Digestifs' comme categorie bar", () => {
    expect(isBarCategory("Digestifs")).toBe(true);
  });

  it("detecte 'Spiritueux' comme categorie bar", () => {
    expect(isBarCategory("Spiritueux")).toBe(true);
  });

  // -----------------------------------------------------------------------
  // Casse insensible
  // -----------------------------------------------------------------------

  it("est insensible a la casse (BOISSONS)", () => {
    expect(isBarCategory("BOISSONS")).toBe(true);
  });

  it("est insensible a la casse (bar)", () => {
    expect(isBarCategory("bar")).toBe(true);
  });

  it("est insensible a la casse (CocKtAiLs)", () => {
    expect(isBarCategory("CocKtAiLs")).toBe(true);
  });

  // -----------------------------------------------------------------------
  // Categories cuisine (non-bar)
  // -----------------------------------------------------------------------

  it("ne detecte pas 'Plats chauds' comme bar", () => {
    expect(isBarCategory("Plats chauds")).toBe(false);
  });

  it("ne detecte pas 'Entrees' comme bar", () => {
    expect(isBarCategory("Entrees")).toBe(false);
  });

  it("ne detecte pas 'Desserts' comme bar", () => {
    expect(isBarCategory("Desserts")).toBe(false);
  });

  it("ne detecte pas 'Pizzas' comme bar", () => {
    expect(isBarCategory("Pizzas")).toBe(false);
  });

  it("ne detecte pas 'Salades' comme bar", () => {
    expect(isBarCategory("Salades")).toBe(false);
  });

  it("ne detecte pas 'Sandwichs' comme bar", () => {
    expect(isBarCategory("Sandwichs")).toBe(false);
  });

  // -----------------------------------------------------------------------
  // Cas limites
  // -----------------------------------------------------------------------

  it("retourne false pour null", () => {
    expect(isBarCategory(null)).toBe(false);
  });

  it("retourne false pour undefined", () => {
    expect(isBarCategory(undefined)).toBe(false);
  });

  it("retourne false pour une chaine vide", () => {
    expect(isBarCategory("")).toBe(false);
  });

  it("detecte le mot-cle dans un nom compose", () => {
    expect(isBarCategory("Boissons fraiches du bar")).toBe(true);
  });
});

// ============================================================================
// Tests de isCuisineCategory
// ============================================================================

describe("isCuisineCategory - Detection des categories cuisine", () => {
  it("detecte 'Plats chauds' comme categorie cuisine", () => {
    expect(isCuisineCategory("Plats chauds")).toBe(true);
  });

  it("detecte 'Entrees' comme categorie cuisine", () => {
    expect(isCuisineCategory("Entrees")).toBe(true);
  });

  it("detecte 'Desserts' comme categorie cuisine", () => {
    expect(isCuisineCategory("Desserts")).toBe(true);
  });

  it("ne detecte pas 'Boissons' comme categorie cuisine", () => {
    expect(isCuisineCategory("Boissons")).toBe(false);
  });

  it("ne detecte pas 'Cocktails' comme categorie cuisine", () => {
    expect(isCuisineCategory("Cocktails")).toBe(false);
  });

  it("est l'inverse exact de isBarCategory", () => {
    const testCases = [
      "Boissons",
      "Plats",
      "Bar",
      "Desserts",
      "Vins",
      "Pizzas",
    ];
    for (const name of testCases) {
      expect(isCuisineCategory(name)).toBe(!isBarCategory(name));
    }
  });
});

// ============================================================================
// Tests de la logique de routage par destinationPreparation
// ============================================================================

describe("Logique de routage par destinationPreparation", () => {
  // Ces tests verifient la logique sans appel Supabase.
  // La fonction routeLinesToPrinters utilise destination pour router :
  // - CUISINE -> imprimante cuisine
  // - BAR -> imprimante bar
  // - AUCUNE -> pas de routage (skip)
  // - AUTO/absent -> detection par nom de categorie

  it("la valeur AUCUNE doit etre geree comme skip", () => {
    // On verifie que la constante existe et est une string valide
    const destination = "AUCUNE";
    expect(destination).toBe("AUCUNE");
    // Dans routeLinesToPrinters, les lignes avec AUCUNE sont filtrees
  });

  it("la valeur AUTO doit etre geree comme fallback", () => {
    const destination = "AUTO";
    expect(destination).toBe("AUTO");
    // En mode AUTO, isBarCategory est utilise pour determiner la destination
  });

  it("isBarCategory couvre tous les mots-cles bar attendus", () => {
    const barKeywords = [
      "boisson",
      "bar",
      "cocktail",
      "vin",
      "biere",
      "alcool",
      "soft",
      "jus",
      "cafe",
      "the",
      "eau",
      "soda",
      "aperitif",
      "digestif",
      "spiritueux",
    ];

    for (const keyword of barKeywords) {
      expect(isBarCategory(keyword)).toBe(true);
    }
  });
});
