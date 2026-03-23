/**
 * Tests unitaires pour schemas/vente.schema.ts
 *
 * Teste les schemas de validation Zod pour les ventes
 */

import { describe, it, expect } from "vitest";
import {
  ligneVenteSchema,
  remiseSchema,
  venteSchema,
  paiementSchema,
  paiementCompletSchema,
  venteFilterSchema,
} from "@/schemas/vente.schema";

// ============================================================================
// Tests du schema ligneVenteSchema
// ============================================================================

describe("ligneVenteSchema - Ligne de vente", () => {
  it("valide une ligne correcte", () => {
    const result = ligneVenteSchema.safeParse({
      produitId: "prod-123",
      quantite: 2,
    });

    expect(result.success).toBe(true);
  });

  it("valide une ligne avec notes", () => {
    const result = ligneVenteSchema.safeParse({
      produitId: "prod-123",
      quantite: 1,
      notes: "Sans oignons",
    });

    expect(result.success).toBe(true);
  });

  it("rejette un produitId vide", () => {
    const result = ligneVenteSchema.safeParse({
      produitId: "",
      quantite: 1,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Le produit est requis");
    }
  });

  it("rejette une quantite negative", () => {
    const result = ligneVenteSchema.safeParse({
      produitId: "prod-123",
      quantite: -1,
    });

    expect(result.success).toBe(false);
  });

  it("rejette une quantite nulle", () => {
    const result = ligneVenteSchema.safeParse({
      produitId: "prod-123",
      quantite: 0,
    });

    expect(result.success).toBe(false);
  });

  it("rejette une quantite decimale", () => {
    const result = ligneVenteSchema.safeParse({
      produitId: "prod-123",
      quantite: 1.5,
    });

    expect(result.success).toBe(false);
  });

  it("rejette des notes trop longues", () => {
    const result = ligneVenteSchema.safeParse({
      produitId: "prod-123",
      quantite: 1,
      notes: "x".repeat(201), // > 200 caracteres
    });

    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Tests du schema remiseSchema
// ============================================================================

describe("remiseSchema - Remise", () => {
  it("valide une remise en pourcentage", () => {
    const result = remiseSchema.safeParse({
      type: "POURCENTAGE",
      valeur: 10,
    });

    expect(result.success).toBe(true);
  });

  it("valide une remise en montant fixe", () => {
    const result = remiseSchema.safeParse({
      type: "MONTANT_FIXE",
      valeur: 1000,
    });

    expect(result.success).toBe(true);
  });

  it("rejette un type de remise invalide", () => {
    const result = remiseSchema.safeParse({
      type: "INVALID",
      valeur: 10,
    });

    expect(result.success).toBe(false);
  });

  it("rejette une valeur negative", () => {
    const result = remiseSchema.safeParse({
      type: "POURCENTAGE",
      valeur: -5,
    });

    expect(result.success).toBe(false);
  });

  it("rejette une valeur nulle", () => {
    const result = remiseSchema.safeParse({
      type: "POURCENTAGE",
      valeur: 0,
    });

    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Tests du schema venteSchema
// ============================================================================

describe("venteSchema - Creation de vente", () => {
  const validVente = {
    type: "DIRECT" as const,
    lignes: [{ produitId: "prod-1", quantite: 2 }],
  };

  it("valide une vente directe simple", () => {
    const result = venteSchema.safeParse(validVente);
    expect(result.success).toBe(true);
  });

  it("valide tous les types de vente", () => {
    const types = ["DIRECT", "TABLE", "LIVRAISON", "EMPORTER"] as const;

    for (const type of types) {
      const result = venteSchema.safeParse({ ...validVente, type });
      expect(result.success).toBe(true);
    }
  });

  it("valide une vente sur table", () => {
    const result = venteSchema.safeParse({
      ...validVente,
      type: "TABLE",
      tableId: "table-1",
    });

    expect(result.success).toBe(true);
  });

  it("valide une vente avec client", () => {
    const result = venteSchema.safeParse({
      ...validVente,
      clientId: "client-1",
    });

    expect(result.success).toBe(true);
  });

  it("valide une vente avec remise", () => {
    const result = venteSchema.safeParse({
      ...validVente,
      remise: {
        type: "POURCENTAGE",
        valeur: 10,
      },
    });

    expect(result.success).toBe(true);
  });

  it("valide une livraison avec adresse", () => {
    const result = venteSchema.safeParse({
      ...validVente,
      type: "LIVRAISON",
      adresseLivraison: "Quartier Louis, Libreville",
      fraisLivraison: 2000,
    });

    expect(result.success).toBe(true);
  });

  it("rejette une vente sans lignes", () => {
    const result = venteSchema.safeParse({
      type: "DIRECT",
      lignes: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Au moins un produit doit être ajouté à la vente"
      );
    }
  });

  it("rejette un type de vente invalide", () => {
    const result = venteSchema.safeParse({
      type: "INVALID",
      lignes: validVente.lignes,
    });

    expect(result.success).toBe(false);
  });

  it("valide une vente avec plusieurs lignes", () => {
    const result = venteSchema.safeParse({
      type: "DIRECT",
      lignes: [
        { produitId: "prod-1", quantite: 2 },
        { produitId: "prod-2", quantite: 1 },
        { produitId: "prod-3", quantite: 3 },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejette des frais de livraison negatifs", () => {
    const result = venteSchema.safeParse({
      ...validVente,
      fraisLivraison: -500,
    });

    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Tests du schema paiementSchema
// ============================================================================

describe("paiementSchema - Paiement", () => {
  it("valide un paiement en especes", () => {
    const result = paiementSchema.safeParse({
      montant: 10000,
      modePaiement: "ESPECES",
      montantRecu: 10000,
      monnaieRendue: 0,
    });

    expect(result.success).toBe(true);
  });

  it("valide tous les modes de paiement", () => {
    const modes = [
      "ESPECES",
      "CARTE_BANCAIRE",
      "AIRTEL_MONEY",
      "MOOV_MONEY",
      "CHEQUE",
      "VIREMENT",
      "COMPTE_CLIENT",
      "MIXTE",
    ] as const;

    for (const modePaiement of modes) {
      const result = paiementSchema.safeParse({
        montant: 5000,
        modePaiement,
      });
      expect(result.success).toBe(true);
    }
  });

  it("valide un paiement Mobile Money avec reference", () => {
    const result = paiementSchema.safeParse({
      montant: 5000,
      modePaiement: "AIRTEL_MONEY",
      reference: "TX123456789",
    });

    expect(result.success).toBe(true);
  });

  it("rejette un montant nul", () => {
    const result = paiementSchema.safeParse({
      montant: 0,
      modePaiement: "ESPECES",
    });

    expect(result.success).toBe(false);
  });

  it("rejette un montant negatif", () => {
    const result = paiementSchema.safeParse({
      montant: -1000,
      modePaiement: "ESPECES",
    });

    expect(result.success).toBe(false);
  });

  it("rejette un montant decimal", () => {
    const result = paiementSchema.safeParse({
      montant: 1000.5, // FCFA sans centimes
      modePaiement: "ESPECES",
    });

    expect(result.success).toBe(false);
  });

  it("rejette un mode de paiement invalide", () => {
    const result = paiementSchema.safeParse({
      montant: 5000,
      modePaiement: "BITCOIN", // non supporte
    });

    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Tests du schema paiementCompletSchema
// ============================================================================

describe("paiementCompletSchema - Paiement complet", () => {
  it("valide un paiement complet", () => {
    const result = paiementCompletSchema.safeParse({
      venteId: "vente-123",
      paiements: [{ montant: 10000, modePaiement: "ESPECES" }],
    });

    expect(result.success).toBe(true);
  });

  it("valide un paiement mixte", () => {
    const result = paiementCompletSchema.safeParse({
      venteId: "vente-123",
      paiements: [
        { montant: 5000, modePaiement: "ESPECES" },
        { montant: 5000, modePaiement: "AIRTEL_MONEY", reference: "TX123" },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejette sans venteId", () => {
    const result = paiementCompletSchema.safeParse({
      venteId: "",
      paiements: [{ montant: 10000, modePaiement: "ESPECES" }],
    });

    expect(result.success).toBe(false);
  });

  it("rejette sans paiements", () => {
    const result = paiementCompletSchema.safeParse({
      venteId: "vente-123",
      paiements: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Au moins un mode de paiement est requis");
    }
  });
});

// ============================================================================
// Tests du schema venteFilterSchema
// ============================================================================

describe("venteFilterSchema - Filtres de vente", () => {
  it("valide un filtre vide", () => {
    const result = venteFilterSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("valide un filtre par dates", () => {
    const result = venteFilterSchema.safeParse({
      dateDebut: new Date("2025-01-01"),
      dateFin: new Date("2025-01-31"),
    });

    expect(result.success).toBe(true);
  });

  it("valide un filtre par type", () => {
    const result = venteFilterSchema.safeParse({
      type: "TABLE",
    });

    expect(result.success).toBe(true);
  });

  it("valide un filtre par statut", () => {
    const result = venteFilterSchema.safeParse({
      statut: "PAYEE",
    });

    expect(result.success).toBe(true);
  });

  it("valide un filtre combine", () => {
    const result = venteFilterSchema.safeParse({
      dateDebut: new Date("2025-01-01"),
      type: "DIRECT",
      statut: "PAYEE",
      utilisateurId: "user-123",
    });

    expect(result.success).toBe(true);
  });

  it("rejette un type invalide", () => {
    const result = venteFilterSchema.safeParse({
      type: "INVALID",
    });

    expect(result.success).toBe(false);
  });

  it("rejette un statut invalide", () => {
    const result = venteFilterSchema.safeParse({
      statut: "INVALID",
    });

    expect(result.success).toBe(false);
  });
});
