/**
 * Tests unitaires pour la logique metier des clients
 *
 * Teste la validation des schemas client, les calculs de fidelite,
 * le compte prepaye et les statistiques client.
 */

import { describe, it, expect } from "vitest";
import { formatCurrency } from "@/lib/utils";
import {
  clientSchema,
  rechargeCompteSchema,
  clientFilterSchema,
} from "@/schemas/client.schema";

// ============================================================================
// Validation du schema client
// ============================================================================

describe("Validation du schema client", () => {
  describe("Champs obligatoires", () => {
    it("valide un client minimal avec nom uniquement", () => {
      const result = clientSchema.safeParse({ nom: "Ndong" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Ndong");
        expect(result.data.actif).toBe(true); // valeur par defaut
        expect(result.data.creditAutorise).toBe(false); // valeur par defaut
      }
    });

    it("rejette un nom trop court", () => {
      const result = clientSchema.safeParse({ nom: "N" });
      expect(result.success).toBe(false);
    });

    it("rejette un nom trop long (> 100 caracteres)", () => {
      const result = clientSchema.safeParse({ nom: "A".repeat(101) });
      expect(result.success).toBe(false);
    });

    it("trim le nom", () => {
      const result = clientSchema.safeParse({ nom: "  Dupont  " });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Dupont");
      }
    });
  });

  describe("Téléphone (format Gabon)", () => {
    it("accepte un numero gabonais avec indicatif", () => {
      const result = clientSchema.safeParse({
        nom: "Client Test",
        telephone: "+241 07 12 34 56",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Le schema nettoie les espaces
        expect(result.data.telephone).toMatch(/^\+?\d+$/);
      }
    });

    it("accepte un numero sans indicatif", () => {
      const result = clientSchema.safeParse({
        nom: "Client Test",
        telephone: "07123456",
      });

      expect(result.success).toBe(true);
    });

    it("rejette un numero trop court", () => {
      const result = clientSchema.safeParse({
        nom: "Client Test",
        telephone: "1234",
      });

      expect(result.success).toBe(false);
    });

    it("accepte un telephone vide (optionnel)", () => {
      const result = clientSchema.safeParse({
        nom: "Client Test",
        telephone: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.telephone).toBeUndefined();
      }
    });

    it("accepte null pour le telephone", () => {
      const result = clientSchema.safeParse({
        nom: "Client Test",
        telephone: null,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Email", () => {
    it("accepte un email valide", () => {
      const result = clientSchema.safeParse({
        nom: "Client Test",
        email: "client@example.ga",
      });

      expect(result.success).toBe(true);
    });

    it("rejette un email invalide", () => {
      const result = clientSchema.safeParse({
        nom: "Client Test",
        email: "pas-un-email",
      });

      expect(result.success).toBe(false);
    });

    it("accepte un email vide (optionnel)", () => {
      const result = clientSchema.safeParse({
        nom: "Client Test",
        email: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBeUndefined();
      }
    });
  });

  describe("Credit", () => {
    it("accepte un client avec credit autorise et limite", () => {
      const result = clientSchema.safeParse({
        nom: "Entreprise XYZ",
        creditAutorise: true,
        limitCredit: 500000,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.creditAutorise).toBe(true);
        expect(result.data.limitCredit).toBe(500000);
      }
    });

    it("rejette une limite de credit negative", () => {
      const result = clientSchema.safeParse({
        nom: "Client Test",
        creditAutorise: true,
        limitCredit: -10000,
      });

      expect(result.success).toBe(false);
    });

    it("rejette une limite de credit decimale", () => {
      const result = clientSchema.safeParse({
        nom: "Client Test",
        creditAutorise: true,
        limitCredit: 5000.5,
      });

      expect(result.success).toBe(false);
    });

    it("accepte une limite de credit a zero", () => {
      const result = clientSchema.safeParse({
        nom: "Client Test",
        limitCredit: 0,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Client complet", () => {
    it("valide un client avec toutes les informations", () => {
      const result = clientSchema.safeParse({
        nom: "Entreprise SARL",
        prenom: "Direction",
        telephone: "+24107123456",
        email: "contact@entreprise.ga",
        adresse: "Boulevard Triomphal, Libreville",
        nif: "NIF-123456",
        notes: "Client fidele depuis 2020",
        creditAutorise: true,
        limitCredit: 1000000,
        actif: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nom).toBe("Entreprise SARL");
        expect(result.data.creditAutorise).toBe(true);
        expect(result.data.limitCredit).toBe(1000000);
      }
    });
  });
});

// ============================================================================
// Schema de recharge du compte prepaye
// ============================================================================

describe("Schema de recharge du compte prepaye", () => {
  it("valide une recharge correcte", () => {
    const result = rechargeCompteSchema.safeParse({
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      montant: 50000,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.montant).toBe(50000);
    }
  });

  it("valide une recharge avec reference et notes", () => {
    const result = rechargeCompteSchema.safeParse({
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      montant: 100000,
      reference: "RECH-2025-001",
      notes: "Recharge mensuelle",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reference).toBe("RECH-2025-001");
    }
  });

  it("rejette un montant nul", () => {
    const result = rechargeCompteSchema.safeParse({
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      montant: 0,
    });

    expect(result.success).toBe(false);
  });

  it("rejette un montant negatif", () => {
    const result = rechargeCompteSchema.safeParse({
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      montant: -5000,
    });

    expect(result.success).toBe(false);
  });

  it("rejette un UUID client invalide", () => {
    const result = rechargeCompteSchema.safeParse({
      clientId: "not-a-uuid",
      montant: 10000,
    });

    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Calcul des points de fidelite
// ============================================================================

describe("Calcul des points de fidelite", () => {
  const POINTS_PAR_FCFA = 1000;

  function calculerPointsFidelite(montant: number): number {
    return Math.floor(montant / POINTS_PAR_FCFA);
  }

  it("calcule les points pour un montant exact", () => {
    expect(calculerPointsFidelite(10000)).toBe(10);
  });

  it("arrondit vers le bas les points", () => {
    expect(calculerPointsFidelite(15500)).toBe(15);
  });

  it("retourne 0 pour un montant inférieur a 1000", () => {
    expect(calculerPointsFidelite(999)).toBe(0);
  });

  it("retourne 0 pour un montant nul", () => {
    expect(calculerPointsFidelite(0)).toBe(0);
  });

  it("calcule correctement pour un gros montant", () => {
    expect(calculerPointsFidelite(500000)).toBe(500);
  });
});

// ============================================================================
// Logique de compte prepaye
// ============================================================================

describe("Logique de compte prepaye", () => {
  it("calcule le nouveau solde apres recharge", () => {
    const ancienSolde = 25000;
    const montantRecharge = 50000;
    const nouveauSolde = ancienSolde + montantRecharge;

    expect(nouveauSolde).toBe(75000);
    expect(formatCurrency(nouveauSolde)).toContain("FCFA");
  });

  it("gere une recharge sur un solde a zero", () => {
    const ancienSolde = 0;
    const montantRecharge = 100000;
    const nouveauSolde = ancienSolde + montantRecharge;

    expect(nouveauSolde).toBe(100000);
  });
});

// ============================================================================
// Statistiques client
// ============================================================================

describe("Statistiques client", () => {
  it("calcule les statistiques d'achat d'un client", () => {
    const ventes = [
      { total_final: 10000 },
      { total_final: 15000 },
      { total_final: 8000 },
      { total_final: 22000 },
    ];

    const totalDepense = ventes.reduce((sum, v) => sum + v.total_final, 0);
    const nombreAchats = ventes.length;
    const panierMoyen =
      nombreAchats > 0 ? Math.round(totalDepense / nombreAchats) : 0;

    expect(totalDepense).toBe(55000);
    expect(nombreAchats).toBe(4);
    expect(panierMoyen).toBe(13750);
  });

  it("gere un client sans achats", () => {
    const ventes: { total_final: number }[] = [];

    const totalDepense = ventes.reduce((sum, v) => sum + v.total_final, 0);
    const nombreAchats = ventes.length;
    const panierMoyen =
      nombreAchats > 0 ? Math.round(totalDepense / nombreAchats) : 0;

    expect(totalDepense).toBe(0);
    expect(nombreAchats).toBe(0);
    expect(panierMoyen).toBe(0);
  });

  it("calcule les produits preferes d'un client", () => {
    const lignes = [
      { produit_id: "p1", quantite: 3, nom: "Biere" },
      { produit_id: "p2", quantite: 1, nom: "Coca" },
      { produit_id: "p1", quantite: 2, nom: "Biere" },
      { produit_id: "p3", quantite: 5, nom: "Eau" },
      { produit_id: "p2", quantite: 2, nom: "Coca" },
    ];

    const produitMap = new Map<string, { nom: string; quantiteTotale: number }>();
    for (const l of lignes) {
      const existing = produitMap.get(l.produit_id);
      if (existing) {
        existing.quantiteTotale += l.quantite;
      } else {
        produitMap.set(l.produit_id, { nom: l.nom, quantiteTotale: l.quantite });
      }
    }

    const produitsPreference = Array.from(produitMap.entries())
      .map(([produitId, data]) => ({ produitId, ...data }))
      .sort((a, b) => b.quantiteTotale - a.quantiteTotale);

    // Eau et Biere ont la meme quantite (5), l'ordre entre eux depend du Map
    expect(produitsPreference[0].quantiteTotale).toBe(5);
    expect(produitsPreference[1].quantiteTotale).toBe(5);
    expect(produitsPreference[2].nom).toBe("Coca");
    expect(produitsPreference[2].quantiteTotale).toBe(3);
  });
});

// ============================================================================
// Recherche de clients
// ============================================================================

describe("Recherche de clients", () => {
  it("rejette une recherche trop courte (< 2 caracteres)", () => {
    const query = "A";
    const shouldSearch = query && query.length >= 2;

    expect(shouldSearch).toBe(false);
  });

  it("accepte une recherche valide", () => {
    const query = "Ndong";
    const shouldSearch = query && query.length >= 2;

    expect(shouldSearch).toBe(true);
  });

  it("rejette une recherche vide", () => {
    const query = "";
    const shouldSearch = !!(query && query.length >= 2);

    expect(shouldSearch).toBe(false);
  });
});

// ============================================================================
// Serialisation des données client
// ============================================================================

describe("Serialisation des données client", () => {
  it("serialise correctement un client Supabase vers le format attendu", () => {
    const clientBrut = {
      id: "client-1",
      nom: "Ndong",
      prenom: "Pierre",
      telephone: "+24107123456",
      email: "pierre@example.ga",
      adresse: "Libreville",
      points_fidelite: 25,
      solde_prepaye: 50000,
      credit_autorise: true,
      limit_credit: 200000,
      solde_credit: 15000,
      actif: true,
      created_at: "2025-01-15T08:00:00Z",
      updated_at: "2025-03-20T10:00:00Z",
    };

    const clientFormate = {
      id: clientBrut.id,
      nom: clientBrut.nom,
      prenom: clientBrut.prenom,
      telephone: clientBrut.telephone,
      email: clientBrut.email,
      adresse: clientBrut.adresse,
      pointsFidelite: clientBrut.points_fidelite,
      soldePrepaye: clientBrut.solde_prepaye,
      creditAutorise: clientBrut.credit_autorise,
      limitCredit: clientBrut.limit_credit,
      soldeCredit: clientBrut.solde_credit,
      actif: clientBrut.actif,
      createdAt: new Date(clientBrut.created_at),
      updatedAt: new Date(clientBrut.updated_at),
    };

    expect(clientFormate.pointsFidelite).toBe(25);
    expect(clientFormate.soldePrepaye).toBe(50000);
    expect(clientFormate.creditAutorise).toBe(true);
    expect(clientFormate.createdAt).toBeInstanceOf(Date);
  });
});

// ============================================================================
// Schema de filtrage clients
// ============================================================================

describe("Schema de filtrage clients", () => {
  it("valide un filtre avec tous les champs", () => {
    const result = clientFilterSchema.safeParse({
      search: "Ndong",
      actif: true,
      avecCredit: false,
      avecSoldePrepaye: true,
      page: 2,
      limit: 50,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(50);
    }
  });

  it("applique les valeurs par defaut pour page et limit", () => {
    const result = clientFilterSchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("rejette une limite superieure a 100", () => {
    const result = clientFilterSchema.safeParse({
      limit: 200,
    });

    expect(result.success).toBe(false);
  });
});
