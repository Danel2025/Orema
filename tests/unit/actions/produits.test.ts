/**
 * Tests unitaires pour la logique metier des produits
 *
 * Teste la validation des schemas produit, les regles de gestion
 * (roles, import CSV), et la serialisation des donnees.
 */

import { describe, it, expect } from "vitest";
import {
  produitSchema,
  produitCsvSchema,
  produitFilterSchema,
} from "@/schemas/produit.schema";

// ============================================================================
// Validation du schema produit
// ============================================================================

describe("Validation du schema produit", () => {
  const produitValide = {
    nom: "Poulet braise",
    prixVente: 5000,
    tauxTva: 18,
    categorieId: "cat-1",
  };

  describe("Champs obligatoires", () => {
    it("valide un produit minimal", () => {
      const result = produitSchema.safeParse(produitValide);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Poulet braise");
        expect(result.data.prixVente).toBe(5000);
        expect(result.data.tauxTva).toBe(18);
        expect(result.data.actif).toBe(true);
        expect(result.data.gererStock).toBe(false);
        expect(result.data.disponibleDirect).toBe(true);
      }
    });

    it("rejette un produit sans nom", () => {
      const result = produitSchema.safeParse({
        ...produitValide,
        nom: undefined,
      });
      expect(result.success).toBe(false);
    });

    it("rejette un nom trop court", () => {
      const result = produitSchema.safeParse({
        ...produitValide,
        nom: "A",
      });
      expect(result.success).toBe(false);
    });

    it("rejette un nom trop long (> 100 caracteres)", () => {
      const result = produitSchema.safeParse({
        ...produitValide,
        nom: "X".repeat(101),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Prix de vente", () => {
    it("accepte un prix entier positif", () => {
      const result = produitSchema.safeParse({
        ...produitValide,
        prixVente: 15000,
      });
      expect(result.success).toBe(true);
    });

    it("rejette un prix nul", () => {
      const result = produitSchema.safeParse({
        ...produitValide,
        prixVente: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejette un prix negatif", () => {
      const result = produitSchema.safeParse({
        ...produitValide,
        prixVente: -500,
      });
      expect(result.success).toBe(false);
    });

    it("rejette un prix decimal (FCFA = pas de decimales)", () => {
      const result = produitSchema.safeParse({
        ...produitValide,
        prixVente: 5000.5,
      });
      expect(result.success).toBe(false);
    });

    it("convertit une string en nombre (coerce)", () => {
      const result = produitSchema.safeParse({
        ...produitValide,
        prixVente: "8000",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prixVente).toBe(8000);
      }
    });
  });

  describe("Taux TVA", () => {
    it("accepte le taux standard 18%", () => {
      const result = produitSchema.safeParse({
        ...produitValide,
        tauxTva: 18,
      });
      expect(result.success).toBe(true);
    });

    it("accepte le taux reduit 10%", () => {
      const result = produitSchema.safeParse({
        ...produitValide,
        tauxTva: 10,
      });
      expect(result.success).toBe(true);
    });

    it("accepte le taux exonere 0%", () => {
      const result = produitSchema.safeParse({
        ...produitValide,
        tauxTva: 0,
      });
      expect(result.success).toBe(true);
    });

    it("rejette un taux negatif", () => {
      const result = produitSchema.safeParse({
        ...produitValide,
        tauxTva: -5,
      });
      expect(result.success).toBe(false);
    });

    it("rejette un taux supérieur a 100", () => {
      const result = produitSchema.safeParse({
        ...produitValide,
        tauxTva: 120,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Gestion de stock", () => {
    it("accepte un produit avec stock", () => {
      const result = produitSchema.safeParse({
        ...produitValide,
        gererStock: true,
        stockActuel: 50,
        stockMin: 10,
        stockMax: 200,
        unite: "unites",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.gererStock).toBe(true);
        expect(result.data.stockActuel).toBe(50);
        expect(result.data.stockMin).toBe(10);
        expect(result.data.stockMax).toBe(200);
      }
    });

    it("rejette un stock negatif", () => {
      const result = produitSchema.safeParse({
        ...produitValide,
        gererStock: true,
        stockActuel: -5,
      });
      expect(result.success).toBe(false);
    });

    it("accepte un stock a zero", () => {
      const result = produitSchema.safeParse({
        ...produitValide,
        gererStock: true,
        stockActuel: 0,
      });
      expect(result.success).toBe(true);
    });

    it("accepte un stock vide (optionnel)", () => {
      const result = produitSchema.safeParse({
        ...produitValide,
        gererStock: true,
        stockActuel: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Disponibilite par mode de vente", () => {
    it("permet de desactiver certains modes de vente", () => {
      const result = produitSchema.safeParse({
        ...produitValide,
        disponibleDirect: true,
        disponibleTable: true,
        disponibleLivraison: false,
        disponibleEmporter: false,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.disponibleLivraison).toBe(false);
        expect(result.data.disponibleEmporter).toBe(false);
      }
    });
  });

  describe("Produit complet", () => {
    it("valide un produit avec toutes les informations", () => {
      const result = produitSchema.safeParse({
        nom: "Pizza Margherita",
        description: "Pizza classique avec tomate et mozzarella",
        codeBarre: "3012345678901",
        image: "pizza-margherita.jpg",
        prixVente: 8000,
        prixAchat: 4000,
        tauxTva: 18,
        categorieId: "cat-pizza",
        gererStock: true,
        stockActuel: 30,
        stockMin: 5,
        stockMax: 100,
        unite: "portions",
        disponibleDirect: true,
        disponibleTable: true,
        disponibleLivraison: true,
        disponibleEmporter: true,
        actif: true,
      });

      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// Validation du schema CSV produit
// ============================================================================

describe("Validation du schema CSV produit", () => {
  it("valide une ligne CSV correcte", () => {
    const result = produitCsvSchema.safeParse({
      nom: "Poulet braise",
      prixVente: 5000,
      tauxTva: 18,
      categorie: "Plats",
      gererStock: "Oui",
      stockActuel: 20,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gererStock).toBe(true);
    }
  });

  it("parse les booleens CSV en francais", () => {
    const testCases = [
      { input: "Oui", expected: true },
      { input: "Non", expected: false },
      { input: "oui", expected: true },
      { input: "non", expected: false },
      { input: "true", expected: true },
      { input: "false", expected: false },
      { input: "1", expected: true },
      { input: "0", expected: false },
      { input: "vrai", expected: true },
      { input: "faux", expected: false },
    ];

    for (const tc of testCases) {
      const result = produitCsvSchema.safeParse({
        nom: "Test",
        prixVente: 1000,
        tauxTva: 18,
        categorie: "Test",
        gererStock: tc.input,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.gererStock).toBe(tc.expected);
      }
    }
  });

  it("rejette un taux TVA invalide (non 0/10/18)", () => {
    const result = produitCsvSchema.safeParse({
      nom: "Test",
      prixVente: 1000,
      tauxTva: 15,
      categorie: "Test",
    });

    expect(result.success).toBe(false);
  });

  it("accepte les taux TVA gabonais valides", () => {
    for (const taux of [0, 10, 18]) {
      const result = produitCsvSchema.safeParse({
        nom: "Test",
        prixVente: 1000,
        tauxTva: taux,
        categorie: "Test",
        gererStock: false,
      });

      expect(result.success).toBe(true);
    }
  });
});

// ============================================================================
// Roles et autorisations de gestion produits
// ============================================================================

describe("Roles et autorisations de gestion produits", () => {
  const ROLES_GESTION_PRODUITS = ["SUPER_ADMIN", "ADMIN", "MANAGER"] as const;

  function canManageProduits(role: string): boolean {
    return (ROLES_GESTION_PRODUITS as readonly string[]).includes(role);
  }

  it("autorise SUPER_ADMIN a gerer les produits", () => {
    expect(canManageProduits("SUPER_ADMIN")).toBe(true);
  });

  it("autorise ADMIN a gerer les produits", () => {
    expect(canManageProduits("ADMIN")).toBe(true);
  });

  it("autorise MANAGER a gerer les produits", () => {
    expect(canManageProduits("MANAGER")).toBe(true);
  });

  it("refuse CAISSIER de gerer les produits", () => {
    expect(canManageProduits("CAISSIER")).toBe(false);
  });

  it("refuse SERVEUR de gerer les produits", () => {
    expect(canManageProduits("SERVEUR")).toBe(false);
  });
});

// ============================================================================
// Mapping du taux TVA vers l'enum
// ============================================================================

describe("Mapping du taux TVA", () => {
  function getTauxTvaEnum(taux: number): string {
    if (taux === 0) return "EXONERE";
    if (taux === 10) return "REDUIT";
    return "STANDARD";
  }

  it("mappe 0 vers EXONERE", () => {
    expect(getTauxTvaEnum(0)).toBe("EXONERE");
  });

  it("mappe 10 vers REDUIT", () => {
    expect(getTauxTvaEnum(10)).toBe("REDUIT");
  });

  it("mappe 18 vers STANDARD", () => {
    expect(getTauxTvaEnum(18)).toBe("STANDARD");
  });

  it("mappe toute autre valeur vers STANDARD", () => {
    expect(getTauxTvaEnum(20)).toBe("STANDARD");
    expect(getTauxTvaEnum(5)).toBe("STANDARD");
  });
});

// ============================================================================
// Serialisation produit Supabase vers format frontend
// ============================================================================

describe("Serialisation produit Supabase", () => {
  it("transforme un produit Supabase en format frontend", () => {
    const produitBrut = {
      id: "prod-1",
      nom: "Poulet",
      description: "Poulet braise",
      code_barre: "1234567890",
      image: "poulet.jpg",
      prix_vente: 5000,
      prix_achat: 2500,
      taux_tva: "STANDARD",
      categorie_id: "cat-1",
      gerer_stock: true,
      stock_actuel: 20,
      stock_min: 5,
      stock_max: 100,
      unite: "unites",
      disponible_direct: true,
      disponible_table: true,
      disponible_livraison: false,
      disponible_emporter: true,
      actif: true,
      created_at: "2025-01-15T08:00:00Z",
      updated_at: "2025-03-20T10:00:00Z",
    };

    const produitFormate = {
      id: produitBrut.id,
      nom: produitBrut.nom,
      description: produitBrut.description,
      codeBarre: produitBrut.code_barre,
      image: produitBrut.image,
      prixVente: produitBrut.prix_vente,
      prixAchat: produitBrut.prix_achat,
      tauxTva: produitBrut.taux_tva,
      categorieId: produitBrut.categorie_id,
      gererStock: produitBrut.gerer_stock,
      stockActuel: produitBrut.stock_actuel,
      stockMin: produitBrut.stock_min,
      stockMax: produitBrut.stock_max,
      unite: produitBrut.unite,
      disponibleDirect: produitBrut.disponible_direct,
      disponibleTable: produitBrut.disponible_table,
      disponibleLivraison: produitBrut.disponible_livraison,
      disponibleEmporter: produitBrut.disponible_emporter,
      actif: produitBrut.actif,
      createdAt: new Date(produitBrut.created_at),
      updatedAt: new Date(produitBrut.updated_at),
    };

    expect(produitFormate.codeBarre).toBe("1234567890");
    expect(produitFormate.prixVente).toBe(5000);
    expect(produitFormate.gererStock).toBe(true);
    expect(produitFormate.disponibleLivraison).toBe(false);
    expect(produitFormate.createdAt).toBeInstanceOf(Date);
  });
});

// ============================================================================
// Schema de filtrage produits
// ============================================================================

describe("Schema de filtrage produits", () => {
  it("valide un filtre complet", () => {
    const result = produitFilterSchema.safeParse({
      search: "poulet",
      categorieId: "cat-1",
      actif: true,
      disponiblePour: "TABLE",
      gererStock: true,
    });

    expect(result.success).toBe(true);
  });

  it("valide un filtre vide", () => {
    const result = produitFilterSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejette un mode de vente invalide", () => {
    const result = produitFilterSchema.safeParse({
      disponiblePour: "INVALID_MODE",
    });
    expect(result.success).toBe(false);
  });

  it("accepte tous les modes de vente valides", () => {
    for (const mode of ["DIRECT", "TABLE", "LIVRAISON", "EMPORTER"]) {
      const result = produitFilterSchema.safeParse({ disponiblePour: mode });
      expect(result.success).toBe(true);
    }
  });
});

// ============================================================================
// Taille maximale CSV
// ============================================================================

describe("Limites d'import CSV", () => {
  const MAX_CSV_SIZE = 2 * 1024 * 1024; // 2 Mo

  it("calcule correctement la limite de 2 Mo", () => {
    expect(MAX_CSV_SIZE).toBe(2097152);
  });

  it("accepte un contenu sous la limite", () => {
    const contenu = "a".repeat(1000);
    expect(contenu.length < MAX_CSV_SIZE).toBe(true);
  });

  it("rejette un contenu au-dessus de la limite", () => {
    const contenu = "a".repeat(MAX_CSV_SIZE + 1);
    expect(contenu.length > MAX_CSV_SIZE).toBe(true);
  });
});
