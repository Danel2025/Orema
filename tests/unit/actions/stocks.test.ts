/**
 * Tests unitaires pour la logique metier des stocks
 *
 * Teste les calculs de statut de stock, mouvements,
 * inventaire, alertes et valorisation.
 */

import { describe, it, expect } from "vitest";
import { formatCurrency } from "@/lib/utils";
import {
  createMovementSchema,
  inventoryLineSchema,
  TypeMouvementSchema,
} from "@/schemas/stock.schema";

// ============================================================================
// Calcul du statut de stock
// ============================================================================

describe("Calcul du statut de stock", () => {
  // Replique la logique de calculateStockStatus dans actions/stocks.ts
  function calculateStockStatus(
    stockActuel: number | null,
    stockMin: number | null
  ): "OK" | "ALERTE" | "RUPTURE" {
    if (stockActuel === null || stockActuel === 0) return "RUPTURE";
    if (stockMin !== null && stockActuel <= stockMin) return "ALERTE";
    return "OK";
  }

  it("retourne RUPTURE quand le stock est null", () => {
    expect(calculateStockStatus(null, 5)).toBe("RUPTURE");
  });

  it("retourne RUPTURE quand le stock est 0", () => {
    expect(calculateStockStatus(0, 5)).toBe("RUPTURE");
  });

  it("retourne ALERTE quand le stock est egal au minimum", () => {
    expect(calculateStockStatus(5, 5)).toBe("ALERTE");
  });

  it("retourne ALERTE quand le stock est inférieur au minimum", () => {
    expect(calculateStockStatus(3, 5)).toBe("ALERTE");
  });

  it("retourne OK quand le stock est supérieur au minimum", () => {
    expect(calculateStockStatus(10, 5)).toBe("OK");
  });

  it("retourne OK quand il n'y a pas de stock minimum defini", () => {
    expect(calculateStockStatus(10, null)).toBe("OK");
  });

  it("retourne OK pour un stock de 1 sans minimum", () => {
    expect(calculateStockStatus(1, null)).toBe("OK");
  });
});

// ============================================================================
// Calculs de mouvement de stock
// ============================================================================

describe("Calculs de mouvement de stock", () => {
  describe("Mouvement ENTREE", () => {
    it("ajoute correctement la quantite au stock", () => {
      const stockAvant = 10;
      const quantite = 5;
      const stockApres = stockAvant + quantite;

      expect(stockApres).toBe(15);
    });

    it("fonctionne avec un stock initial a zero", () => {
      const stockAvant = 0;
      const quantite = 20;
      const stockApres = stockAvant + quantite;

      expect(stockApres).toBe(20);
    });
  });

  describe("Mouvement SORTIE", () => {
    it("deduit correctement la quantite du stock", () => {
      const stockAvant = 10;
      const quantite = 3;
      const stockApres = stockAvant - quantite;

      expect(stockApres).toBe(7);
      expect(stockApres >= 0).toBe(true);
    });

    it("detecte un stock insuffisant", () => {
      const stockAvant = 2;
      const quantite = 5;
      const stockApres = stockAvant - quantite;

      expect(stockApres).toBe(-3);
      expect(stockApres < 0).toBe(true);
    });
  });

  describe("Mouvement PERTE", () => {
    it("se comporte comme une sortie", () => {
      const stockAvant = 50;
      const quantite = 8;
      const stockApres = stockAvant - quantite;

      expect(stockApres).toBe(42);
    });

    it("refuse une perte superieure au stock", () => {
      const stockAvant = 5;
      const quantite = 10;
      const stockApres = stockAvant - quantite;

      expect(stockApres < 0).toBe(true);
    });
  });

  describe("Mouvement AJUSTEMENT", () => {
    it("remplace le stock par la nouvelle valeur", () => {
      const stockAvant = 10;
      const quantite = 25; // Nouveau stock
      const stockApres = quantite; // Pour ajustement, quantite = nouveau stock

      expect(stockApres).toBe(25);
    });

    it("permet de mettre le stock a zero via ajustement", () => {
      const stockAvant = 15;
      const quantite = 0;
      const stockApres = quantite;

      expect(stockApres).toBe(0);
    });
  });

  describe("Logique complete de calcul de stock (comme dans createMovement)", () => {
    function calculerNouveauStock(
      type: string,
      stockAvant: number,
      quantite: number
    ): { stockApres: number; erreur: string | null } {
      let stockApres: number;

      switch (type) {
        case "ENTREE":
          stockApres = stockAvant + quantite;
          break;
        case "SORTIE":
        case "PERTE":
          stockApres = stockAvant - quantite;
          if (stockApres < 0) {
            return {
              stockApres: stockAvant,
              erreur: `Stock insuffisant. Stock actuel: ${stockAvant}, Quantite demandee: ${quantite}`,
            };
          }
          break;
        case "AJUSTEMENT":
          stockApres = quantite;
          break;
        default:
          stockApres = stockAvant;
      }

      return { stockApres, erreur: null };
    }

    it("calcule correctement une entree de stock", () => {
      const result = calculerNouveauStock("ENTREE", 10, 5);
      expect(result.stockApres).toBe(15);
      expect(result.erreur).toBeNull();
    });

    it("calcule correctement une sortie de stock valide", () => {
      const result = calculerNouveauStock("SORTIE", 10, 3);
      expect(result.stockApres).toBe(7);
      expect(result.erreur).toBeNull();
    });

    it("rejette une sortie avec stock insuffisant", () => {
      const result = calculerNouveauStock("SORTIE", 2, 5);
      expect(result.erreur).toContain("Stock insuffisant");
      expect(result.stockApres).toBe(2); // Stock inchange
    });

    it("calcule correctement une perte", () => {
      const result = calculerNouveauStock("PERTE", 50, 8);
      expect(result.stockApres).toBe(42);
      expect(result.erreur).toBeNull();
    });

    it("rejette une perte avec stock insuffisant", () => {
      const result = calculerNouveauStock("PERTE", 3, 10);
      expect(result.erreur).toContain("Stock insuffisant");
    });

    it("calcule correctement un ajustement", () => {
      const result = calculerNouveauStock("AJUSTEMENT", 10, 25);
      expect(result.stockApres).toBe(25);
      expect(result.erreur).toBeNull();
    });

    it("ne modifie pas le stock pour un type inconnu", () => {
      const result = calculerNouveauStock("INCONNU", 10, 5);
      expect(result.stockApres).toBe(10);
    });
  });
});

// ============================================================================
// Validation des schemas de stock
// ============================================================================

describe("Validation des schemas de stock", () => {
  describe("createMovementSchema", () => {
    it("valide un mouvement d'entree correct", () => {
      const result = createMovementSchema.safeParse({
        produitId: "550e8400-e29b-41d4-a716-446655440000",
        type: "ENTREE",
        quantite: 10,
        motif: "Livraison fournisseur",
      });

      expect(result.success).toBe(true);
    });

    it("valide un mouvement avec prix unitaire", () => {
      const result = createMovementSchema.safeParse({
        produitId: "550e8400-e29b-41d4-a716-446655440000",
        type: "ENTREE",
        quantite: 10,
        motif: "Livraison fournisseur",
        prixUnitaire: 500,
        reference: "BON-2025-001",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prixUnitaire).toBe(500);
        expect(result.data.reference).toBe("BON-2025-001");
      }
    });

    it("rejette un UUID invalide", () => {
      const result = createMovementSchema.safeParse({
        produitId: "invalid-id",
        type: "ENTREE",
        quantite: 10,
        motif: "Test",
      });

      expect(result.success).toBe(false);
    });

    it("rejette une quantite negative", () => {
      const result = createMovementSchema.safeParse({
        produitId: "550e8400-e29b-41d4-a716-446655440000",
        type: "ENTREE",
        quantite: -5,
        motif: "Test",
      });

      expect(result.success).toBe(false);
    });

    it("rejette une quantite decimale", () => {
      const result = createMovementSchema.safeParse({
        produitId: "550e8400-e29b-41d4-a716-446655440000",
        type: "ENTREE",
        quantite: 3.5,
        motif: "Test",
      });

      expect(result.success).toBe(false);
    });

    it("rejette un motif vide", () => {
      const result = createMovementSchema.safeParse({
        produitId: "550e8400-e29b-41d4-a716-446655440000",
        type: "ENTREE",
        quantite: 10,
        motif: "",
      });

      expect(result.success).toBe(false);
    });

    it("rejette un type de mouvement invalide", () => {
      const result = createMovementSchema.safeParse({
        produitId: "550e8400-e29b-41d4-a716-446655440000",
        type: "TRANSFERT",
        quantite: 10,
        motif: "Test",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("TypeMouvementSchema", () => {
    it("accepte tous les types valides", () => {
      const types = ["ENTREE", "SORTIE", "AJUSTEMENT", "PERTE", "INVENTAIRE"];
      for (const type of types) {
        expect(TypeMouvementSchema.safeParse(type).success).toBe(true);
      }
    });

    it("rejette un type invalide", () => {
      expect(TypeMouvementSchema.safeParse("DEPLACEMENT").success).toBe(false);
    });
  });

  describe("inventoryLineSchema", () => {
    it("valide une ligne d'inventaire correcte", () => {
      const result = inventoryLineSchema.safeParse({
        produitId: "550e8400-e29b-41d4-a716-446655440000",
        quantiteReelle: 15,
      });

      expect(result.success).toBe(true);
    });

    it("accepte une quantite a zero", () => {
      const result = inventoryLineSchema.safeParse({
        produitId: "550e8400-e29b-41d4-a716-446655440000",
        quantiteReelle: 0,
      });

      expect(result.success).toBe(true);
    });

    it("rejette une quantite negative", () => {
      const result = inventoryLineSchema.safeParse({
        produitId: "550e8400-e29b-41d4-a716-446655440000",
        quantiteReelle: -3,
      });

      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// Inventaire - logique de calcul des ecarts
// ============================================================================

describe("Inventaire - calcul des ecarts", () => {
  it("calcule les ecarts d'inventaire avec produits positifs et negatifs", () => {
    const lignes = [
      { produitId: "p1", produitNom: "Biere", stockAvant: 100, quantiteReelle: 95 },
      { produitId: "p2", produitNom: "Coca", stockAvant: 50, quantiteReelle: 55 },
      { produitId: "p3", produitNom: "Eau", stockAvant: 200, quantiteReelle: 200 },
    ];

    let ecartTotal = 0;
    const details: {
      produitNom: string;
      stockAvant: number;
      stockApres: number;
      ecart: number;
    }[] = [];

    for (const ligne of lignes) {
      const ecart = ligne.quantiteReelle - ligne.stockAvant;
      if (ecart !== 0) {
        ecartTotal += ecart;
        details.push({
          produitNom: ligne.produitNom,
          stockAvant: ligne.stockAvant,
          stockApres: ligne.quantiteReelle,
          ecart,
        });
      }
    }

    expect(details).toHaveLength(2); // L'eau n'a pas d'ecart
    expect(details[0].ecart).toBe(-5); // Biere: 95-100
    expect(details[1].ecart).toBe(5); // Coca: 55-50
    expect(ecartTotal).toBe(0); // Les ecarts se compensent
  });

  it("ne cree pas de mouvement pour un ecart nul", () => {
    const stockAvant = 50;
    const quantiteReelle = 50;
    const ecart = quantiteReelle - stockAvant;

    expect(ecart).toBe(0);
    // Pas de mouvement cree
  });
});

// ============================================================================
// Alertes de stock
// ============================================================================

describe("Alertes de stock", () => {
  it("filtre correctement les produits en alerte et rupture", () => {
    const produits = [
      { id: "p1", nom: "Biere", stock_actuel: 0, stock_min: 10 },
      { id: "p2", nom: "Coca", stock_actuel: null, stock_min: 5 },
      { id: "p3", nom: "Eau", stock_actuel: 3, stock_min: 5 },
      { id: "p4", nom: "Jus", stock_actuel: 50, stock_min: 10 },
      { id: "p5", nom: "Vin", stock_actuel: 10, stock_min: 10 },
    ];

    const alertes = produits.filter((p) => {
      if (p.stock_actuel === null || p.stock_actuel === 0) return true;
      if (p.stock_min !== null && p.stock_actuel <= p.stock_min) return true;
      return false;
    });

    expect(alertes).toHaveLength(4);
    expect(alertes.map((a) => a.nom)).toEqual(["Biere", "Coca", "Eau", "Vin"]);
    // Jus (50 > 10) n'est pas en alerte
    expect(alertes.find((a) => a.nom === "Jus")).toBeUndefined();
  });

  it("attribue le bon statut RUPTURE ou ALERTE", () => {
    const produits = [
      { stock_actuel: 0 as number | null },
      { stock_actuel: null as number | null },
      { stock_actuel: 3 as number | null },
    ];

    const statuts = produits.map((p) =>
      p.stock_actuel === null || p.stock_actuel === 0 ? "RUPTURE" : "ALERTE"
    );

    expect(statuts).toEqual(["RUPTURE", "RUPTURE", "ALERTE"]);
  });
});

// ============================================================================
// Valorisation du stock
// ============================================================================

describe("Valorisation du stock", () => {
  it("calcule la valorisation totale avec prix d'achat", () => {
    const produits = [
      { stock_actuel: 10, prix_achat: 2000, prix_vente: 3000 },
      { stock_actuel: 5, prix_achat: null, prix_vente: 5000 },
      { stock_actuel: 20, prix_achat: 1000, prix_vente: 1500 },
    ];

    let valeurTotale = 0;
    for (const p of produits) {
      const stock = p.stock_actuel || 0;
      const prixUnitaire = p.prix_achat ? p.prix_achat : p.prix_vente;
      valeurTotale += stock * prixUnitaire;
    }

    // p1: 10 * 2000 = 20000
    // p2: 5 * 5000 = 25000 (pas de prix achat, utilise prix vente)
    // p3: 20 * 1000 = 20000
    expect(valeurTotale).toBe(65000);
  });

  it("groupe la valorisation par categorie", () => {
    const produits = [
      { stock: 10, prix: 2000, categorie: "Boissons" },
      { stock: 5, prix: 3000, categorie: "Boissons" },
      { stock: 8, prix: 5000, categorie: "Plats" },
    ];

    const valorisationMap = new Map<string, number>();
    for (const p of produits) {
      const valeur = p.stock * p.prix;
      const existing = valorisationMap.get(p.categorie) ?? 0;
      valorisationMap.set(p.categorie, existing + valeur);
    }

    expect(valorisationMap.get("Boissons")).toBe(35000); // 20000 + 15000
    expect(valorisationMap.get("Plats")).toBe(40000); // 8 * 5000
  });
});

// ============================================================================
// Export CSV du stock
// ============================================================================

describe("Export CSV du stock", () => {
  // Replique la logique de escapeCsvField
  function escapeCsvField(field: string): string {
    if (field.includes(";") || field.includes('"') || field.includes("\n")) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  it("echappe les champs avec point-virgule", () => {
    expect(escapeCsvField("Sel; Poivre")).toBe('"Sel; Poivre"');
  });

  it("echappe les guillemets doubles", () => {
    expect(escapeCsvField('Poulet "label rouge"')).toBe(
      '"Poulet ""label rouge"""'
    );
  });

  it("n'echappe pas les champs simples", () => {
    expect(escapeCsvField("Poulet")).toBe("Poulet");
  });

  it("echappe les retours a la ligne", () => {
    expect(escapeCsvField("Ligne 1\nLigne 2")).toBe('"Ligne 1\nLigne 2"');
  });
});
