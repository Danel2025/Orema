/**
 * Tests unitaires pour le champ destinationPreparation dans categorie.schema.ts
 *
 * Teste la validation du nouveau champ destinationPreparation
 * et les options de destination disponibles
 */

import { describe, it, expect } from "vitest";
import {
  categorieSchema,
  destinationOptions,
  type DestinationPreparation,
} from "@/schemas/categorie.schema";

// ============================================================================
// Tests du champ destinationPreparation dans categorieSchema
// ============================================================================

describe("categorieSchema - destinationPreparation", () => {
  const validCategorie = {
    nom: "Boissons",
    couleur: "#f97316",
    ordre: 0,
    actif: true,
  };

  // -----------------------------------------------------------------------
  // Valeurs valides
  // -----------------------------------------------------------------------

  it("accepte la valeur AUTO", () => {
    const result = categorieSchema.safeParse({
      ...validCategorie,
      destinationPreparation: "AUTO",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.destinationPreparation).toBe("AUTO");
    }
  });

  it("accepte la valeur CUISINE", () => {
    const result = categorieSchema.safeParse({
      ...validCategorie,
      destinationPreparation: "CUISINE",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.destinationPreparation).toBe("CUISINE");
    }
  });

  it("accepte la valeur BAR", () => {
    const result = categorieSchema.safeParse({
      ...validCategorie,
      destinationPreparation: "BAR",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.destinationPreparation).toBe("BAR");
    }
  });

  it("accepte la valeur AUCUNE", () => {
    const result = categorieSchema.safeParse({
      ...validCategorie,
      destinationPreparation: "AUCUNE",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.destinationPreparation).toBe("AUCUNE");
    }
  });

  // -----------------------------------------------------------------------
  // Valeur par defaut
  // -----------------------------------------------------------------------

  it("applique la valeur par defaut AUTO quand non specifie", () => {
    const result = categorieSchema.safeParse(validCategorie);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.destinationPreparation).toBe("AUTO");
    }
  });

  // -----------------------------------------------------------------------
  // Valeurs invalides
  // -----------------------------------------------------------------------

  it("rejette une valeur invalide", () => {
    const result = categorieSchema.safeParse({
      ...validCategorie,
      destinationPreparation: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("rejette une valeur vide", () => {
    const result = categorieSchema.safeParse({
      ...validCategorie,
      destinationPreparation: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejette une valeur numerique", () => {
    const result = categorieSchema.safeParse({
      ...validCategorie,
      destinationPreparation: 123,
    });
    expect(result.success).toBe(false);
  });

  it("rejette une valeur en minuscules", () => {
    const result = categorieSchema.safeParse({
      ...validCategorie,
      destinationPreparation: "cuisine",
    });
    expect(result.success).toBe(false);
  });

  // -----------------------------------------------------------------------
  // Integration avec le schema complet
  // -----------------------------------------------------------------------

  it("valide un schema complet avec destinationPreparation", () => {
    const result = categorieSchema.safeParse({
      nom: "Plats chauds",
      couleur: "#ef4444",
      icone: "UtensilsCrossed",
      ordre: 1,
      actif: true,
      imprimanteId: null,
      destinationPreparation: "CUISINE",
    });
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Tests des destinationOptions
// ============================================================================

describe("destinationOptions - Options de destination disponibles", () => {
  it("contient 4 options", () => {
    expect(destinationOptions).toHaveLength(4);
  });

  it("contient les 4 valeurs de destination", () => {
    const values = destinationOptions.map((o) => o.value);
    expect(values).toContain("AUTO");
    expect(values).toContain("CUISINE");
    expect(values).toContain("BAR");
    expect(values).toContain("AUCUNE");
  });

  it("chaque option a value, label et description", () => {
    for (const option of destinationOptions) {
      expect(option.value).toBeDefined();
      expect(option.label).toBeDefined();
      expect(option.description).toBeDefined();
      expect(typeof option.value).toBe("string");
      expect(typeof option.label).toBe("string");
      expect(typeof option.description).toBe("string");
    }
  });

  it("les labels sont en francais", () => {
    const labels = destinationOptions.map((o) => o.label);
    expect(labels).toContain("Automatique");
    expect(labels).toContain("Cuisine");
    expect(labels).toContain("Bar");
    expect(labels).toContain("Aucune");
  });

  it("l'option AUTO a une description sur la detection automatique", () => {
    const autoOption = destinationOptions.find((o) => o.value === "AUTO");
    expect(autoOption).toBeDefined();
    expect(autoOption!.description).toMatch(/[Dd][eé]tection/);
  });

  it("l'option AUCUNE mentionne l'absence de bon de préparation", () => {
    const aucuneOption = destinationOptions.find((o) => o.value === "AUCUNE");
    expect(aucuneOption).toBeDefined();
    expect(aucuneOption!.description).toMatch(/[Pp]as de bon/);
  });
});

// ============================================================================
// Tests du type DestinationPreparation
// ============================================================================

describe("DestinationPreparation - Type exporte", () => {
  it("le type accepte les 4 valeurs valides", () => {
    const valeurs: DestinationPreparation[] = ["AUTO", "CUISINE", "BAR", "AUCUNE"];
    expect(valeurs).toHaveLength(4);
    // Verification TypeScript au compile-time - si ce code compile, le type est correct
  });
});
