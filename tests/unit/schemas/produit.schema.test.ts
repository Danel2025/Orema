/**
 * Tests unitaires pour schemas/produit.schema.ts
 *
 * Teste les schemas de validation Zod pour les produits
 */

import { describe, it, expect } from "vitest";
import { produitSchema, produitFilterSchema, produitCsvSchema } from "@/schemas/produit.schema";

// ============================================================================
// Tests du schema produitSchema
// ============================================================================

describe("produitSchema - Creation/Edition produit", () => {
  const validProduit = {
    nom: "Poulet braise",
    prixVente: 5000,
    tauxTva: 18,
    categorieId: "cat-123",
  };

  it("valide un produit minimal", () => {
    const result = produitSchema.safeParse(validProduit);
    expect(result.success).toBe(true);
  });

  it("valide un produit complet", () => {
    const result = produitSchema.safeParse({
      ...validProduit,
      description: "Poulet braise avec sauce tomate",
      codeBarre: "123456789",
      image: "/images/poulet.jpg",
      prixAchat: 3000,
      gererStock: true,
      stockActuel: 50,
      stockMin: 10,
      stockMax: 100,
      unite: "piece",
      disponibleDirect: true,
      disponibleTable: true,
      disponibleLivraison: true,
      disponibleEmporter: true,
      actif: true,
    });

    expect(result.success).toBe(true);
  });

  it("rejette un nom trop court", () => {
    const result = produitSchema.safeParse({
      ...validProduit,
      nom: "A", // < 2 caracteres
    });

    expect(result.success).toBe(false);
  });

  it("rejette un nom trop long", () => {
    const result = produitSchema.safeParse({
      ...validProduit,
      nom: "x".repeat(101), // > 100 caracteres
    });

    expect(result.success).toBe(false);
  });

  it("rejette un prix de vente negatif", () => {
    const result = produitSchema.safeParse({
      ...validProduit,
      prixVente: -500,
    });

    expect(result.success).toBe(false);
  });

  it("rejette un prix de vente nul", () => {
    const result = produitSchema.safeParse({
      ...validProduit,
      prixVente: 0,
    });

    expect(result.success).toBe(false);
  });

  it("rejette un prix de vente decimal", () => {
    const result = produitSchema.safeParse({
      ...validProduit,
      prixVente: 5000.5, // FCFA sans centimes
    });

    expect(result.success).toBe(false);
  });

  it("coerce les prix string en number", () => {
    const result = produitSchema.safeParse({
      ...validProduit,
      prixVente: "5000",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.prixVente).toBe(5000);
    }
  });

  it("rejette un taux TVA negatif", () => {
    const result = produitSchema.safeParse({
      ...validProduit,
      tauxTva: -5,
    });

    expect(result.success).toBe(false);
  });

  it("rejette un taux TVA > 100%", () => {
    const result = produitSchema.safeParse({
      ...validProduit,
      tauxTva: 105,
    });

    expect(result.success).toBe(false);
  });

  it("valide les taux TVA gabonais", () => {
    const taux = [0, 10, 18];

    for (const tauxTva of taux) {
      const result = produitSchema.safeParse({ ...validProduit, tauxTva });
      expect(result.success).toBe(true);
    }
  });

  it("rejette une categorieId vide", () => {
    const result = produitSchema.safeParse({
      ...validProduit,
      categorieId: "",
    });

    expect(result.success).toBe(false);
  });

  it("gere les valeurs optionnelles vides", () => {
    const result = produitSchema.safeParse({
      ...validProduit,
      description: "",
      codeBarre: null,
      prixAchat: undefined,
    });

    expect(result.success).toBe(true);
  });

  it("applique les valeurs par defaut", () => {
    const result = produitSchema.safeParse(validProduit);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gererStock).toBe(false);
      expect(result.data.disponibleDirect).toBe(true);
      expect(result.data.actif).toBe(true);
    }
  });

  it("rejette un stock negatif", () => {
    const result = produitSchema.safeParse({
      ...validProduit,
      gererStock: true,
      stockActuel: -5,
    });

    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Tests du schema produitFilterSchema
// ============================================================================

describe("produitFilterSchema - Filtres produits", () => {
  it("valide un filtre vide", () => {
    const result = produitFilterSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("valide une recherche textuelle", () => {
    const result = produitFilterSchema.safeParse({
      search: "poulet",
    });

    expect(result.success).toBe(true);
  });

  it("valide un filtre par categorie", () => {
    const result = produitFilterSchema.safeParse({
      categorieId: "cat-123",
    });

    expect(result.success).toBe(true);
  });

  it("valide un filtre par disponibilite", () => {
    const types = ["DIRECT", "TABLE", "LIVRAISON", "EMPORTER"] as const;

    for (const disponiblePour of types) {
      const result = produitFilterSchema.safeParse({ disponiblePour });
      expect(result.success).toBe(true);
    }
  });

  it("valide un filtre par statut actif", () => {
    const result = produitFilterSchema.safeParse({
      actif: true,
    });

    expect(result.success).toBe(true);
  });

  it("valide un filtre par gestion de stock", () => {
    const result = produitFilterSchema.safeParse({
      gererStock: true,
    });

    expect(result.success).toBe(true);
  });

  it("valide un filtre combine", () => {
    const result = produitFilterSchema.safeParse({
      search: "pizza",
      categorieId: "cat-plats",
      actif: true,
      disponiblePour: "LIVRAISON",
    });

    expect(result.success).toBe(true);
  });

  it("rejette une disponibilite invalide", () => {
    const result = produitFilterSchema.safeParse({
      disponiblePour: "INVALID",
    });

    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Tests du schema produitCsvSchema (import CSV)
// ============================================================================

describe("produitCsvSchema - Import CSV", () => {
  const validCsvProduit = {
    nom: "Burger Classic",
    prixVente: 4500,
    tauxTva: 18,
    categorie: "Burgers",
    gererStock: false,
  };

  it("valide une ligne CSV minimale", () => {
    const result = produitCsvSchema.safeParse(validCsvProduit);
    expect(result.success).toBe(true);
  });

  it("valide une ligne CSV complete", () => {
    const result = produitCsvSchema.safeParse({
      ...validCsvProduit,
      description: "Burger avec steak, fromage et salade",
      codeBarre: "123456789012",
      prixAchat: 2500,
      gererStock: true,
      stockActuel: 20,
      stockMin: 5,
      stockMax: 50,
      unite: "piece",
      disponibleDirect: true,
      disponibleTable: true,
      disponibleLivraison: true,
      disponibleEmporter: true,
    });

    expect(result.success).toBe(true);
  });

  it('transforme "oui" en true pour gererStock', () => {
    const result = produitCsvSchema.safeParse({
      ...validCsvProduit,
      gererStock: "oui",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gererStock).toBe(true);
    }
  });

  it('transforme "true" en true pour gererStock', () => {
    const result = produitCsvSchema.safeParse({
      ...validCsvProduit,
      gererStock: "true",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gererStock).toBe(true);
    }
  });

  it('transforme "1" en true pour gererStock', () => {
    const result = produitCsvSchema.safeParse({
      ...validCsvProduit,
      gererStock: "1",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gererStock).toBe(true);
    }
  });

  it("transforme autres valeurs en false pour gererStock", () => {
    const result = produitCsvSchema.safeParse({
      ...validCsvProduit,
      gererStock: "non",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gererStock).toBe(false);
    }
  });

  it("coerce les strings numeriques pour prixVente", () => {
    const result = produitCsvSchema.safeParse({
      ...validCsvProduit,
      prixVente: "4500",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.prixVente).toBe(4500);
    }
  });

  it("rejette un taux TVA invalide", () => {
    const result = produitCsvSchema.safeParse({
      ...validCsvProduit,
      tauxTva: 15, // Non standard au Gabon
    });

    expect(result.success).toBe(false);
  });

  it("accepte uniquement les taux TVA gabonais (0, 10, 18)", () => {
    const validTaux = [0, 10, 18];
    const invalidTaux = [5, 15, 20];

    for (const tauxTva of validTaux) {
      const result = produitCsvSchema.safeParse({ ...validCsvProduit, tauxTva });
      expect(result.success).toBe(true);
    }

    for (const tauxTva of invalidTaux) {
      const result = produitCsvSchema.safeParse({ ...validCsvProduit, tauxTva });
      expect(result.success).toBe(false);
    }
  });

  it("rejette une categorie vide", () => {
    const result = produitCsvSchema.safeParse({
      ...validCsvProduit,
      categorie: "",
    });

    expect(result.success).toBe(false);
  });

  it("gere les valeurs null pour les champs optionnels", () => {
    const result = produitCsvSchema.safeParse({
      ...validCsvProduit,
      description: null,
      codeBarre: null,
      prixAchat: null,
      stockActuel: null,
    });

    expect(result.success).toBe(true);
  });

  it("applique les valeurs par defaut pour disponibilite", () => {
    const result = produitCsvSchema.safeParse(validCsvProduit);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.disponibleDirect).toBe(true);
      expect(result.data.disponibleTable).toBe(true);
      expect(result.data.disponibleLivraison).toBe(true);
      expect(result.data.disponibleEmporter).toBe(true);
    }
  });
});
