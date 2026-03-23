/**
 * Tests unitaires pour schemas/ecran.schema.ts
 *
 * Teste le schema Zod de validation des ecrans d'affichage (KDS)
 */

import { describe, it, expect } from "vitest";
import { ecranSchema, typeEcranOptions } from "@/schemas/ecran.schema";
import type { EcranFormData } from "@/schemas/ecran.schema";

// ============================================================================
// Tests du schema ecranSchema
// ============================================================================

describe("ecranSchema - Validation des ecrans d'affichage", () => {
  const validEcran = {
    nom: "Ecran Cuisine",
    type: "CUISINE" as const,
  };

  // -----------------------------------------------------------------------
  // Cas valides
  // -----------------------------------------------------------------------

  it("valide un ecran minimal (nom + type)", () => {
    const result = ecranSchema.safeParse(validEcran);
    expect(result.success).toBe(true);
  });

  it("valide un ecran complet avec toutes les options", () => {
    const result = ecranSchema.safeParse({
      nom: "Ecran Bar Principal",
      type: "BAR",
      categories: ["550e8400-e29b-41d4-a716-446655440000"],
      son_actif: false,
      delai_urgence_minutes: 30,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.son_actif).toBe(false);
      expect(result.data.delai_urgence_minutes).toBe(30);
    }
  });

  it("valide le type CUISINE", () => {
    const result = ecranSchema.safeParse({ ...validEcran, type: "CUISINE" });
    expect(result.success).toBe(true);
  });

  it("valide le type BAR", () => {
    const result = ecranSchema.safeParse({ ...validEcran, type: "BAR" });
    expect(result.success).toBe(true);
  });

  it("valide le type PERSONNALISE", () => {
    const result = ecranSchema.safeParse({ ...validEcran, type: "PERSONNALISE" });
    expect(result.success).toBe(true);
  });

  it("applique les valeurs par defaut", () => {
    const result = ecranSchema.safeParse(validEcran);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.son_actif).toBe(true);
      expect(result.data.delai_urgence_minutes).toBe(15);
    }
  });

  it("accepte categories null", () => {
    const result = ecranSchema.safeParse({ ...validEcran, categories: null });
    expect(result.success).toBe(true);
  });

  it("accepte categories vide", () => {
    const result = ecranSchema.safeParse({ ...validEcran, categories: [] });
    expect(result.success).toBe(true);
  });

  it("accepte des UUIDs valides dans categories", () => {
    const result = ecranSchema.safeParse({
      ...validEcran,
      categories: [
        "550e8400-e29b-41d4-a716-446655440000",
        "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      ],
    });
    expect(result.success).toBe(true);
  });

  it("coerce les strings numeriques pour delai_urgence_minutes", () => {
    const result = ecranSchema.safeParse({
      ...validEcran,
      delai_urgence_minutes: "20",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.delai_urgence_minutes).toBe(20);
    }
  });

  // -----------------------------------------------------------------------
  // Cas invalides - nom
  // -----------------------------------------------------------------------

  it("rejette un nom trop court (< 2 caracteres)", () => {
    const result = ecranSchema.safeParse({ ...validEcran, nom: "A" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("nom");
    }
  });

  it("rejette un nom trop long (> 100 caracteres)", () => {
    const result = ecranSchema.safeParse({
      ...validEcran,
      nom: "x".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejette un nom vide", () => {
    const result = ecranSchema.safeParse({ ...validEcran, nom: "" });
    expect(result.success).toBe(false);
  });

  // -----------------------------------------------------------------------
  // Cas invalides - type
  // -----------------------------------------------------------------------

  it("rejette un type invalide", () => {
    const result = ecranSchema.safeParse({ ...validEcran, type: "INVALID" });
    expect(result.success).toBe(false);
  });

  it("rejette un type vide", () => {
    const result = ecranSchema.safeParse({ ...validEcran, type: "" });
    expect(result.success).toBe(false);
  });

  it("rejette sans type", () => {
    const result = ecranSchema.safeParse({ nom: "Ecran Test" });
    expect(result.success).toBe(false);
  });

  // -----------------------------------------------------------------------
  // Cas invalides - delai_urgence_minutes
  // -----------------------------------------------------------------------

  it("rejette un delai inferieur a 1 minute", () => {
    const result = ecranSchema.safeParse({
      ...validEcran,
      delai_urgence_minutes: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejette un delai superieur a 120 minutes", () => {
    const result = ecranSchema.safeParse({
      ...validEcran,
      delai_urgence_minutes: 121,
    });
    expect(result.success).toBe(false);
  });

  it("rejette un delai negatif", () => {
    const result = ecranSchema.safeParse({
      ...validEcran,
      delai_urgence_minutes: -5,
    });
    expect(result.success).toBe(false);
  });

  // -----------------------------------------------------------------------
  // Cas invalides - categories
  // -----------------------------------------------------------------------

  it("rejette des categories avec des UUIDs invalides", () => {
    const result = ecranSchema.safeParse({
      ...validEcran,
      categories: ["not-a-uuid"],
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Tests des typeEcranOptions
// ============================================================================

describe("typeEcranOptions - Options de type d'ecran", () => {
  it("contient 3 options", () => {
    expect(typeEcranOptions).toHaveLength(3);
  });

  it("contient les types CUISINE, BAR et PERSONNALISE", () => {
    const values = typeEcranOptions.map((o) => o.value);
    expect(values).toContain("CUISINE");
    expect(values).toContain("BAR");
    expect(values).toContain("PERSONNALISE");
  });

  it("chaque option a un value et un label", () => {
    for (const option of typeEcranOptions) {
      expect(option.value).toBeDefined();
      expect(option.label).toBeDefined();
      expect(typeof option.value).toBe("string");
      expect(typeof option.label).toBe("string");
    }
  });
});

// ============================================================================
// Tests du type EcranFormData
// ============================================================================

describe("EcranFormData - Type infere du schema", () => {
  it("le type infere correspond aux champs attendus", () => {
    const validData: EcranFormData = {
      nom: "Test",
      type: "CUISINE",
      categories: null,
      son_actif: true,
      delai_urgence_minutes: 15,
    };

    const result = ecranSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});
