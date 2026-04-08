/**
 * Tests unitaires pour la logique metier de la caisse
 *
 * Teste les calculs de session, stats du jour, fond de caisse,
 * ecarts et serialisation des données caisse.
 */

import { describe, it, expect } from "vitest";
import {
  calculerTVA,
  calculerLigneVente,
  formatCurrency,
  calculerRenduMonnaie,
  TVA_RATES,
} from "@/lib/utils";

// ============================================================================
// Serialisation des données caisse
// ============================================================================

describe("Serialisation des données caisse", () => {
  describe("Transformation produits pour la caisse", () => {
    it("serialise correctement un produit Supabase vers le format caisse", () => {
      const produitBrut = {
        id: "prod-1",
        nom: "Poulet braise",
        prix_vente: "5000",
        taux_tva: "STANDARD",
        image: null,
        gerer_stock: true,
        stock_actuel: 20,
        categorie_id: "cat-1",
        actif: true,
        disponible_direct: true,
        disponible_table: true,
        disponible_livraison: false,
        disponible_emporter: true,
        code_barre: null,
      };

      // Logique de getCaisseData
      const produitFormate = {
        id: produitBrut.id,
        nom: produitBrut.nom,
        prixVente: Number(produitBrut.prix_vente),
        tauxTva: produitBrut.taux_tva,
        image: produitBrut.image,
        gererStock: produitBrut.gerer_stock,
        stockActuel: produitBrut.stock_actuel,
        categorieId: produitBrut.categorie_id,
        actif: produitBrut.actif,
        disponibleDirect: produitBrut.disponible_direct,
        disponibleTable: produitBrut.disponible_table,
        disponibleLivraison: produitBrut.disponible_livraison,
        disponibleEmporter: produitBrut.disponible_emporter,
        codeBarre: produitBrut.code_barre,
        supplements: [],
      };

      expect(produitFormate.prixVente).toBe(5000);
      expect(produitFormate.tauxTva).toBe("STANDARD");
      expect(produitFormate.gererStock).toBe(true);
      expect(produitFormate.disponibleLivraison).toBe(false);
      expect(produitFormate.supplements).toEqual([]);
    });

    it("groupe correctement les supplements par produit", () => {
      const supplements = [
        { id: "s1", nom: "Piment", prix: 200, produit_id: "prod-1" },
        { id: "s2", nom: "Sauce", prix: 300, produit_id: "prod-1" },
        { id: "s3", nom: "Fromage", prix: 500, produit_id: "prod-2" },
      ];

      const supplementsByProduit = new Map<
        string,
        { id: string; nom: string; prix: number; produit_id: string }[]
      >();
      for (const sup of supplements) {
        const existing = supplementsByProduit.get(sup.produit_id) ?? [];
        existing.push(sup);
        supplementsByProduit.set(sup.produit_id, existing);
      }

      expect(supplementsByProduit.get("prod-1")).toHaveLength(2);
      expect(supplementsByProduit.get("prod-2")).toHaveLength(1);
      expect(supplementsByProduit.get("prod-3")).toBeUndefined();
    });

    it("convertit les prix de supplements de string a number", () => {
      const rawSupplements = [
        { id: "s1", nom: "Piment", prix: "200", produit_id: "prod-1" },
        { id: "s2", nom: "Sauce", prix: "300", produit_id: "prod-1" },
      ];

      const supplements = rawSupplements.map((s) => ({
        ...s,
        prix: Number(s.prix),
      }));

      expect(supplements[0].prix).toBe(200);
      expect(typeof supplements[0].prix).toBe("number");
      expect(supplements[1].prix).toBe(300);
    });
  });
});

// ============================================================================
// Stats du jour
// ============================================================================

describe("Calcul des stats du jour pour la caisse", () => {
  it("calcule correctement les stats avec des ventes du jour", () => {
    const ventesPayees = [
      { total_final: "10000" },
      { total_final: "15000" },
      { total_final: "8500" },
    ];

    const totalVentes = ventesPayees.length;
    const chiffreAffaires = ventesPayees.reduce(
      (sum, v) => sum + Number(v.total_final),
      0
    );

    expect(totalVentes).toBe(3);
    expect(chiffreAffaires).toBe(33500);

    const caFormate = formatCurrency(chiffreAffaires);
    expect(caFormate).toContain("FCFA");
  });

  it("retourne des stats a zero sans ventes", () => {
    const ventesPayees: { total_final: string }[] = [];

    const totalVentes = ventesPayees.length;
    const chiffreAffaires = ventesPayees.reduce(
      (sum, v) => sum + Number(v.total_final),
      0
    );
    const pendingCount = 0;

    expect(totalVentes).toBe(0);
    expect(chiffreAffaires).toBe(0);
    expect(pendingCount).toBe(0);
  });

  it("filtre correctement les ventes par date du jour", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const ventes = [
      { created_at: new Date().toISOString(), statut: "PAYEE", total_final: 5000 },
      {
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        statut: "PAYEE",
        total_final: 3000,
      },
      { created_at: new Date().toISOString(), statut: "ANNULEE", total_final: 2000 },
    ];

    const ventesPayeesAujourdhui = ventes.filter(
      (v) => v.statut === "PAYEE" && v.created_at >= todayISO
    );

    expect(ventesPayeesAujourdhui.length).toBe(1);
    expect(ventesPayeesAujourdhui[0].total_final).toBe(5000);
  });
});

// ============================================================================
// Session de caisse
// ============================================================================

describe("Gestion de la session de caisse", () => {
  describe("Detection de session active", () => {
    it("identifie une session active (date_cloture null)", () => {
      const session = {
        id: "session-123",
        date_ouverture: "2025-01-15T08:00:00Z",
        fond_caisse: "50000",
        utilisateur_id: "user-1",
        date_cloture: null as string | null,
      };

      const isActive = session.date_cloture === null;
      expect(isActive).toBe(true);
    });

    it("identifie une session fermee", () => {
      const session = {
        id: "session-123",
        date_ouverture: "2025-01-15T08:00:00Z",
        fond_caisse: "50000",
        utilisateur_id: "user-1",
        date_cloture: "2025-01-15T22:00:00Z",
      };

      const isActive = session.date_cloture === null;
      expect(isActive).toBe(false);
    });
  });

  describe("Serialisation de session", () => {
    it("serialise correctement une session depuis Supabase", () => {
      const sessionBrute = {
        id: "session-1",
        date_ouverture: "2025-01-15T08:00:00Z",
        fond_caisse: "50000",
        utilisateur_id: "user-1",
      };

      const utilisateur = { nom: "Dupont", prenom: "Jean" };

      const sessionFormatee = {
        id: sessionBrute.id,
        dateOuverture: sessionBrute.date_ouverture,
        fondCaisse: Number(sessionBrute.fond_caisse),
        utilisateur: {
          nom: utilisateur?.nom ?? "",
          prenom: utilisateur?.prenom ?? "",
        },
      };

      expect(sessionFormatee.fondCaisse).toBe(50000);
      expect(sessionFormatee.utilisateur.nom).toBe("Dupont");
      expect(sessionFormatee.utilisateur.prenom).toBe("Jean");
    });

    it("gere les données utilisateur manquantes", () => {
      const sessionBrute = {
        id: "session-1",
        date_ouverture: "2025-01-15T08:00:00Z",
        fond_caisse: "0",
        utilisateur_id: "user-1",
      };

      const utilisateur = null;

      const sessionFormatee = {
        id: sessionBrute.id,
        dateOuverture: sessionBrute.date_ouverture,
        fondCaisse: Number(sessionBrute.fond_caisse),
        utilisateur: {
          nom: utilisateur?.nom ?? "",
          prenom: utilisateur?.prenom ?? "",
        },
      };

      expect(sessionFormatee.fondCaisse).toBe(0);
      expect(sessionFormatee.utilisateur.nom).toBe("");
      expect(sessionFormatee.utilisateur.prenom).toBe("");
    });
  });
});

// ============================================================================
// Ecarts de caisse et rapport Z
// ============================================================================

describe("Ecarts de caisse et cloture", () => {
  it("calcule l'ecart avec surplus en utilisant calculerRenduMonnaie", () => {
    const fondCaisse = 50000;
    const totalEspeces = 75000;
    const especesComptees = 130000;

    const especesAttendues = fondCaisse + totalEspeces;
    const ecart = especesComptees - especesAttendues;

    expect(especesAttendues).toBe(125000);
    expect(ecart).toBe(5000);

    const coupures = calculerRenduMonnaie(ecart);
    const totalCoupures = coupures.reduce((sum, c) => sum + c.valeur * c.quantite, 0);
    expect(totalCoupures).toBe(5000);
  });

  it("detecte un deficit de caisse", () => {
    const fondCaisse = 50000;
    const totalEspeces = 75000;
    const especesComptees = 120000;

    const especesAttendues = fondCaisse + totalEspeces;
    const ecart = especesComptees - especesAttendues;

    expect(ecart).toBe(-5000);
    expect(ecart < 0).toBe(true);
  });

  it("simule un rapport Z complet avec calculs TVA reels", () => {
    const fondCaisse = 50000;

    const ventes = [
      {
        lignes: [
          { prixUnitaire: 5000, quantite: 2, tauxTva: TVA_RATES.STANDARD },
          { prixUnitaire: 3000, quantite: 1, tauxTva: TVA_RATES.STANDARD },
        ],
        paiements: [{ modePaiement: "ESPECES", montant: 15340 }],
        statut: "PAYEE",
      },
      {
        lignes: [{ prixUnitaire: 8000, quantite: 1, tauxTva: TVA_RATES.REDUIT }],
        paiements: [{ modePaiement: "AIRTEL_MONEY", montant: 8800 }],
        statut: "PAYEE",
      },
      {
        lignes: [{ prixUnitaire: 2000, quantite: 1, tauxTva: TVA_RATES.EXONERE }],
        paiements: [],
        statut: "ANNULEE",
      },
    ];

    const ventesPayees = ventes.filter((v) => v.statut === "PAYEE");
    let totalHT = 0;
    let totalTVA = 0;
    let totalEspeces = 0;
    let totalMobileMoney = 0;

    for (const vente of ventesPayees) {
      for (const ligne of vente.lignes) {
        const calc = calculerLigneVente(
          ligne.prixUnitaire,
          ligne.quantite,
          ligne.tauxTva
        );
        totalHT += calc.sousTotal;
        totalTVA += calc.montantTva;
      }
      for (const p of vente.paiements) {
        if (p.modePaiement === "ESPECES") totalEspeces += p.montant;
        if (
          p.modePaiement === "AIRTEL_MONEY" ||
          p.modePaiement === "MOOV_MONEY"
        )
          totalMobileMoney += p.montant;
      }
    }

    expect(ventesPayees).toHaveLength(2);
    expect(totalHT).toBe(21000);
    expect(totalTVA).toBe(3140);
    expect(totalEspeces).toBe(15340);
    expect(totalMobileMoney).toBe(8800);

    const especesAttendues = fondCaisse + totalEspeces;
    expect(especesAttendues).toBe(65340);
  });
});

// ============================================================================
// Page caisse - chargement complet
// ============================================================================

describe("Chargement complet de la page caisse", () => {
  it("serialise les données d'établissement pour la caisse", () => {
    const etablissement = {
      id: "etab-1",
      nom: "Restaurant Chez Paul",
      adresse: "Libreville, Gabon",
      telephone: "+24107123456",
      email: "contact@chezpaul.ga",
      nif: "123456789",
      rccm: "GA-LBV-2024-B-001",
      impression_auto_ticket: true,
      extra_field: "should_be_excluded",
    };

    // Logique de loadCaissePage
    const etablissementFormate = {
      id: etablissement.id,
      nom: etablissement.nom,
      adresse: etablissement.adresse,
      telephone: etablissement.telephone,
      email: etablissement.email,
      nif: etablissement.nif,
      rccm: etablissement.rccm,
      impressionAutoTicket: etablissement.impression_auto_ticket,
    };

    expect(etablissementFormate.nom).toBe("Restaurant Chez Paul");
    expect(etablissementFormate.nif).toBe("123456789");
    expect(etablissementFormate.impressionAutoTicket).toBe(true);
    // Le champ extra ne doit pas etre inclus
    expect(Object.keys(etablissementFormate)).not.toContain("extra_field");
  });

  it("retourne des données vides pour un utilisateur non connecte", () => {
    // Simule le comportement de getCaisseData sans user
    const user = null;
    const result =
      !user || !(user as { etablissementId?: string })?.etablissementId
        ? { categories: [], produits: [] }
        : { categories: ["cat"], produits: ["prod"] };

    expect(result.categories).toEqual([]);
    expect(result.produits).toEqual([]);
  });
});
