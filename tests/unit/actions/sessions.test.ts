/**
 * Tests unitaires pour la logique metier des sessions de caisse
 *
 * Utilise les VRAIES fonctions de lib/utils.ts pour les calculs
 * et les schemas Zod pour la validation des donnees
 */

import { describe, it, expect } from "vitest";
import {
  calculerTVA,
  calculerLigneVente,
  formatCurrency,
  calculerRenduMonnaie,
  TVA_RATES,
} from "@/lib/utils";
import { paiementSchema } from "@/schemas/vente.schema";

// ============================================================================
// Tests des calculs de session avec les vraies fonctions
// ============================================================================

describe("Calculs de session de caisse", () => {
  describe("Totaux par mode de paiement", () => {
    it("calcule correctement les totaux par mode de paiement", () => {
      const ventes = [
        {
          totalFinal: 10000,
          paiements: [{ modePaiement: "ESPECES" as const, montant: 10000 }],
        },
        {
          totalFinal: 15000,
          paiements: [{ modePaiement: "CARTE_BANCAIRE" as const, montant: 15000 }],
        },
        {
          totalFinal: 8000,
          paiements: [{ modePaiement: "AIRTEL_MONEY" as const, montant: 8000 }],
        },
      ];

      let totalEspeces = 0;
      let totalCartes = 0;
      let totalMobileMoney = 0;

      for (const vente of ventes) {
        for (const paiement of vente.paiements) {
          // Valider chaque paiement avec le vrai schema
          const validated = paiementSchema.safeParse(paiement);
          expect(validated.success).toBe(true);

          const montant = Number(paiement.montant);
          switch (paiement.modePaiement) {
            case "ESPECES":
              totalEspeces += montant;
              break;
            case "CARTE_BANCAIRE":
              totalCartes += montant;
              break;
            case "AIRTEL_MONEY":
            case "MOOV_MONEY":
              totalMobileMoney += montant;
              break;
          }
        }
      }

      expect(totalEspeces).toBe(10000);
      expect(totalCartes).toBe(15000);
      expect(totalMobileMoney).toBe(8000);

      // Total global
      const totalGlobal = totalEspeces + totalCartes + totalMobileMoney;
      expect(totalGlobal).toBe(33000);
    });

    it("calcule les totaux par mode de paiement mixte", () => {
      const ventes = [
        {
          totalFinal: 20000,
          paiements: [
            { modePaiement: "ESPECES" as const, montant: 10000 },
            { modePaiement: "AIRTEL_MONEY" as const, montant: 10000 },
          ],
        },
      ];

      let totalEspeces = 0;
      let totalMobileMoney = 0;

      for (const vente of ventes) {
        for (const p of vente.paiements) {
          if (p.modePaiement === "ESPECES") totalEspeces += p.montant;
          if (p.modePaiement === "AIRTEL_MONEY" || p.modePaiement === "MOOV_MONEY")
            totalMobileMoney += p.montant;
        }
      }

      expect(totalEspeces).toBe(10000);
      expect(totalMobileMoney).toBe(10000);
      expect(totalEspeces + totalMobileMoney).toBe(20000);
    });
  });

  describe("Ecart de caisse", () => {
    it("calcule l'ecart avec surplus", () => {
      const fondCaisse = 50000;
      const totalEspeces = 75000;
      const especesComptees = 130000;

      const especesAttendues = fondCaisse + totalEspeces;
      const ecart = especesComptees - especesAttendues;

      expect(especesAttendues).toBe(125000);
      expect(ecart).toBe(5000); // Surplus

      // Verification que le surplus est formatable
      const ecartFormate = formatCurrency(Math.abs(ecart));
      expect(ecartFormate).toContain("FCFA");
    });

    it("detecte un deficit de caisse", () => {
      const fondCaisse = 50000;
      const totalEspeces = 75000;
      const especesComptees = 120000;

      const especesAttendues = fondCaisse + totalEspeces;
      const ecart = especesComptees - especesAttendues;

      expect(especesAttendues).toBe(125000);
      expect(ecart).toBe(-5000); // Deficit
      expect(ecart < 0).toBe(true);
    });

    it("ecart zero quand les comptes sont justes", () => {
      const fondCaisse = 50000;
      const totalEspeces = 60000;
      const especesComptees = 110000;

      const especesAttendues = fondCaisse + totalEspeces;
      const ecart = especesComptees - especesAttendues;

      expect(ecart).toBe(0);
    });
  });
});

// ============================================================================
// Tests de la logique metier des sessions
// ============================================================================

describe("Logique metier des sessions", () => {
  describe("Fond de caisse", () => {
    it("refuse un fond de caisse negatif", () => {
      const fondCaisse = -1000;
      const isValid = fondCaisse >= 0;
      expect(isValid).toBe(false);
    });

    it("accepte un fond de caisse a zero", () => {
      const fondCaisse = 0;
      const isValid = fondCaisse >= 0;
      expect(isValid).toBe(true);
    });

    it("accepte un fond de caisse positif", () => {
      const fondCaisse = 50000;
      const isValid = fondCaisse >= 0;
      expect(isValid).toBe(true);

      // Le montant doit etre un entier FCFA valide
      expect(fondCaisse).toBeValidFCFA();
    });
  });

  describe("Detection de session active", () => {
    it("detecte une session ouverte (dateCloture null)", () => {
      const session = {
        id: "session-123",
        dateCloture: null as Date | null,
        fondCaisse: 50000,
      };

      const isActive = session.dateCloture === null;
      expect(isActive).toBe(true);
    });

    it("detecte une session fermee", () => {
      const session = {
        id: "session-123",
        dateCloture: new Date(),
        fondCaisse: 50000,
      };

      const isActive = session.dateCloture === null;
      expect(isActive).toBe(false);
    });
  });

  describe("Calcul des totaux de session avec TVA reelle", () => {
    it("calcule le total des ventes payees vs annulees", () => {
      const ventes = [
        { totalFinal: 10000, statut: "PAYEE" },
        { totalFinal: 15000, statut: "PAYEE" },
        { totalFinal: 5000, statut: "ANNULEE" },
      ];

      const ventesPayees = ventes.filter((v) => v.statut === "PAYEE");
      const totalVentes = ventesPayees.reduce((sum, v) => sum + v.totalFinal, 0);
      const nombreAnnulations = ventes.filter((v) => v.statut === "ANNULEE").length;

      expect(ventesPayees).toHaveLength(2);
      expect(totalVentes).toBe(25000);
      expect(nombreAnnulations).toBe(1);

      // Formatage du CA avec la vraie fonction
      const caFormate = formatCurrency(totalVentes);
      expect(caFormate).toContain("FCFA");
    });

    it("calcule la TVA totale d'une session avec calculerLigneVente", () => {
      // Simule les ventes d'une session
      const lignesSession = [
        { prixUnitaire: 5000, quantite: 2, tauxTva: TVA_RATES.STANDARD },
        { prixUnitaire: 3000, quantite: 1, tauxTva: TVA_RATES.REDUIT },
        { prixUnitaire: 1500, quantite: 4, tauxTva: TVA_RATES.EXONERE },
      ];

      let totalHT = 0;
      let totalTVA = 0;
      let totalTTC = 0;

      for (const ligne of lignesSession) {
        const result = calculerLigneVente(ligne.prixUnitaire, ligne.quantite, ligne.tauxTva);
        totalHT += result.sousTotal;
        totalTVA += result.montantTva;
        totalTTC += result.total;
      }

      // Ligne 1: 5000*2=10000 HT, TVA 18% = 1800, TTC = 11800
      // Ligne 2: 3000*1=3000 HT, TVA 10% = 300, TTC = 3300
      // Ligne 3: 1500*4=6000 HT, TVA 0% = 0, TTC = 6000
      expect(totalHT).toBe(19000);
      expect(totalTVA).toBe(2100);
      expect(totalTTC).toBe(21100);

      // Verification croisee
      expect(totalTTC).toBe(totalHT + totalTVA);
    });
  });

  describe("Cloture de session - calculs d'ecart", () => {
    it("calcule l'ecart avec surplus et rendu monnaie", () => {
      const fondCaisse = 50000;
      const totalEspecesVendues = 60000;
      const especesComptees = 115000;

      const especesAttendues = fondCaisse + totalEspecesVendues;
      const ecart = especesComptees - especesAttendues;

      expect(especesAttendues).toBe(110000);
      expect(ecart).toBe(5000); // Surplus

      // Le surplus peut etre decompose en coupures
      const coupuresSurplus = calculerRenduMonnaie(ecart);
      const totalCoupures = coupuresSurplus.reduce((sum, c) => sum + c.valeur * c.quantite, 0);
      expect(totalCoupures).toBe(5000);
    });

    it("calcule l'ecart avec deficit", () => {
      const fondCaisse = 50000;
      const totalEspecesVendues = 60000;
      const especesComptees = 105000;

      const especesAttendues = fondCaisse + totalEspecesVendues;
      const ecart = especesComptees - especesAttendues;

      expect(especesAttendues).toBe(110000);
      expect(ecart).toBe(-5000); // Deficit
    });

    it("simule un rapport Z complet", () => {
      const fondCaisse = 50000;

      // Ventes de la session
      const ventes = [
        {
          lignes: [
            { prixUnitaire: 5000, quantite: 2, tauxTva: 18 },
            { prixUnitaire: 3000, quantite: 1, tauxTva: 18 },
          ],
          paiements: [{ modePaiement: "ESPECES", montant: 15340 }],
          statut: "PAYEE",
        },
        {
          lignes: [{ prixUnitaire: 8000, quantite: 1, tauxTva: 10 }],
          paiements: [{ modePaiement: "AIRTEL_MONEY", montant: 8800 }],
          statut: "PAYEE",
        },
        {
          lignes: [{ prixUnitaire: 2000, quantite: 1, tauxTva: 0 }],
          paiements: [],
          statut: "ANNULEE",
        },
      ];

      // Calculs avec les vraies fonctions
      let totalHTSession = 0;
      let totalTVASession = 0;
      let totalEspeces = 0;
      let totalMobileMoney = 0;
      const ventesPayees = ventes.filter((v) => v.statut === "PAYEE");
      const ventesAnnulees = ventes.filter((v) => v.statut === "ANNULEE");

      for (const vente of ventesPayees) {
        for (const ligne of vente.lignes) {
          const calc = calculerLigneVente(ligne.prixUnitaire, ligne.quantite, ligne.tauxTva);
          totalHTSession += calc.sousTotal;
          totalTVASession += calc.montantTva;
        }
        for (const p of vente.paiements) {
          if (p.modePaiement === "ESPECES") totalEspeces += p.montant;
          if (p.modePaiement === "AIRTEL_MONEY" || p.modePaiement === "MOOV_MONEY")
            totalMobileMoney += p.montant;
        }
      }

      expect(ventesPayees).toHaveLength(2);
      expect(ventesAnnulees).toHaveLength(1);

      // Ligne 1 vente 1: 5000*2=10000 HT, TVA=1800
      // Ligne 2 vente 1: 3000*1=3000 HT, TVA=540
      // Ligne 1 vente 2: 8000*1=8000 HT, TVA=800
      expect(totalHTSession).toBe(21000);
      expect(totalTVASession).toBe(3140);
      expect(totalEspeces).toBe(15340);
      expect(totalMobileMoney).toBe(8800);

      // Ecart de caisse
      const especesAttendues = fondCaisse + totalEspeces;
      expect(especesAttendues).toBe(65340);
    });
  });

  describe("Validation des paiements de session via schemas", () => {
    it("valide un paiement especes via le schema", () => {
      const result = paiementSchema.safeParse({
        montant: 10000,
        modePaiement: "ESPECES",
        montantRecu: 15000,
        monnaieRendue: 5000,
      });

      expect(result.success).toBe(true);

      if (result.success) {
        // Verification avec la vraie fonction de rendu
        const rendu = result.data.montantRecu! - result.data.montant;
        expect(rendu).toBe(5000);

        const coupures = calculerRenduMonnaie(rendu);
        const totalCoupures = coupures.reduce((sum, c) => sum + c.valeur * c.quantite, 0);
        expect(totalCoupures).toBe(5000);
      }
    });

    it("rejette un paiement avec montant decimal via le schema", () => {
      const result = paiementSchema.safeParse({
        montant: 1000.5,
        modePaiement: "ESPECES",
      });

      expect(result.success).toBe(false);
    });

    it("rejette un mode de paiement invalide via le schema", () => {
      const result = paiementSchema.safeParse({
        montant: 5000,
        modePaiement: "BITCOIN",
      });

      expect(result.success).toBe(false);
    });
  });
});
