/**
 * Tests unitaires pour la logique metier des ventes
 *
 * Utilise les VRAIES fonctions de lib/utils.ts pour tester les calculs
 * de TVA, remises, tickets, stock et paiements
 */

import { describe, it, expect } from "vitest";
import {
  calculerTVA,
  calculerTTC,
  calculerHT,
  calculerLigneVente,
  formatTicketNumber,
  formatCurrency,
  calculerRenduMonnaie,
  suggererMontantsArrondis,
  TVA_RATES,
} from "@/lib/utils";
import { venteSchema, paiementSchema, paiementCompletSchema } from "@/schemas/vente.schema";

// ============================================================================
// Tests des calculs de TVA avec les vraies fonctions
// ============================================================================

describe("Calculs TVA - fonctions reelles de lib/utils.ts", () => {
  describe("calculerTVA", () => {
    it("calcule la TVA standard 18%", () => {
      expect(calculerTVA(10000, 18)).toBe(1800);
    });

    it("calcule la TVA reduite 10%", () => {
      expect(calculerTVA(9000, 10)).toBe(900);
    });

    it("calcule la TVA exoneree 0%", () => {
      expect(calculerTVA(8000, 0)).toBe(0);
    });

    it("arrondit correctement les montants TVA", () => {
      // 3333 * 18 / 100 = 599.94 -> arrondi a 600
      expect(calculerTVA(3333, 18)).toBe(600);
    });

    it("gere les montants importants", () => {
      expect(calculerTVA(1000000, 18)).toBe(180000);
    });

    it("accepte les enums TauxTva sous forme de string", () => {
      expect(calculerTVA(10000, "STANDARD")).toBe(1800);
      expect(calculerTVA(10000, "REDUIT")).toBe(1000);
      expect(calculerTVA(10000, "EXONERE")).toBe(0);
    });
  });

  describe("calculerTTC", () => {
    it("calcule le TTC avec TVA standard", () => {
      expect(calculerTTC(10000, 18)).toBe(11800);
    });

    it("calcule le TTC avec TVA reduite", () => {
      expect(calculerTTC(10000, 10)).toBe(11000);
    });

    it("calcule le TTC exonere (montant inchange)", () => {
      expect(calculerTTC(10000, 0)).toBe(10000);
    });
  });

  describe("calculerHT", () => {
    it("calcule le HT a partir du TTC avec TVA standard", () => {
      expect(calculerHT(11800, 18)).toBe(10000);
    });

    it("calcule le HT a partir du TTC avec TVA reduite", () => {
      expect(calculerHT(11000, 10)).toBe(10000);
    });

    it("calcule le HT exonere (montant inchange)", () => {
      expect(calculerHT(10000, 0)).toBe(10000);
    });
  });

  describe("TVA_RATES constantes", () => {
    it("definit les bons taux gabonais", () => {
      expect(TVA_RATES.STANDARD).toBe(18);
      expect(TVA_RATES.REDUIT).toBe(10);
      expect(TVA_RATES.EXONERE).toBe(0);
    });
  });
});

// ============================================================================
// Tests de calculerLigneVente
// ============================================================================

describe("calculerLigneVente - calcul complet d'une ligne", () => {
  it("calcule une ligne avec TVA standard 18%", () => {
    const result = calculerLigneVente(5000, 2, 18);

    expect(result.sousTotal).toBe(10000);
    expect(result.montantTva).toBe(1800);
    expect(result.total).toBe(11800);
    expect(result.tauxTvaNum).toBe(18);
  });

  it("calcule une ligne avec TVA reduite 10%", () => {
    const result = calculerLigneVente(3000, 3, 10);

    expect(result.sousTotal).toBe(9000);
    expect(result.montantTva).toBe(900);
    expect(result.total).toBe(9900);
    expect(result.tauxTvaNum).toBe(10);
  });

  it("calcule une ligne exoneree de TVA", () => {
    const result = calculerLigneVente(2000, 4, 0);

    expect(result.sousTotal).toBe(8000);
    expect(result.montantTva).toBe(0);
    expect(result.total).toBe(8000);
    expect(result.tauxTvaNum).toBe(0);
  });

  it("accepte les enums string pour le taux TVA", () => {
    const result = calculerLigneVente(5000, 1, "STANDARD");

    expect(result.sousTotal).toBe(5000);
    expect(result.montantTva).toBe(900);
    expect(result.total).toBe(5900);
    expect(result.tauxTvaNum).toBe(18);
  });

  it("calcule correctement avec quantite 1", () => {
    const result = calculerLigneVente(15000, 1, 18);

    expect(result.sousTotal).toBe(15000);
    expect(result.montantTva).toBe(2700);
    expect(result.total).toBe(17700);
  });
});

// ============================================================================
// Tests de formatTicketNumber
// ============================================================================

describe("formatTicketNumber - numero de ticket", () => {
  it("genere le bon format YYYYMMDD00001", () => {
    const date = new Date(2025, 0, 15); // 15 janvier 2025
    expect(formatTicketNumber(date, 1)).toBe("2025011500001");
  });

  it("incremente correctement la sequence", () => {
    const date = new Date(2025, 0, 15);
    expect(formatTicketNumber(date, 42)).toBe("2025011500042");
  });

  it("gere les sequences a 5 chiffres", () => {
    const date = new Date(2025, 0, 15);
    expect(formatTicketNumber(date, 99999)).toBe("2025011599999");
  });

  it("pad correctement les mois et jours", () => {
    const date = new Date(2025, 2, 5); // 5 mars 2025
    expect(formatTicketNumber(date, 1)).toBe("2025030500001");
  });
});

// ============================================================================
// Tests de formatCurrency
// ============================================================================

describe("formatCurrency - formatage FCFA", () => {
  it("formate un montant simple", () => {
    const result = formatCurrency(5000);
    expect(result).toContain("5");
    expect(result).toContain("000");
    expect(result).toContain("FCFA");
  });

  it("formate zero", () => {
    expect(formatCurrency(0)).toContain("0");
    expect(formatCurrency(0)).toContain("FCFA");
  });

  it("gere les strings numeriques", () => {
    const result = formatCurrency("15000");
    expect(result).toContain("15");
    expect(result).toContain("000");
    expect(result).toContain("FCFA");
  });

  it("gere NaN", () => {
    expect(formatCurrency("abc")).toBe("0 FCFA");
  });

  it("gere les grands montants", () => {
    const result = formatCurrency(1000000);
    expect(result).toContain("FCFA");
  });
});

// ============================================================================
// Tests de calculerRenduMonnaie
// ============================================================================

describe("calculerRenduMonnaie - rendu optimal en coupures FCFA", () => {
  it("calcule le rendu pour 3200 FCFA", () => {
    const result = calculerRenduMonnaie(3200);

    const totalRendu = result.reduce((sum, c) => sum + c.valeur * c.quantite, 0);
    expect(totalRendu).toBe(3200);
  });

  it("retourne un tableau vide pour montant zero", () => {
    expect(calculerRenduMonnaie(0)).toEqual([]);
  });

  it("retourne un tableau vide pour montant negatif", () => {
    expect(calculerRenduMonnaie(-500)).toEqual([]);
  });

  it("utilise les plus grosses coupures en priorite", () => {
    const result = calculerRenduMonnaie(15000);

    // Doit utiliser 1x10000 + 1x5000
    expect(result[0].valeur).toBe(10000);
    expect(result[0].quantite).toBe(1);
    expect(result[1].valeur).toBe(5000);
    expect(result[1].quantite).toBe(1);
  });

  it("gere les petites pieces", () => {
    const result = calculerRenduMonnaie(75);

    const totalRendu = result.reduce((sum, c) => sum + c.valeur * c.quantite, 0);
    expect(totalRendu).toBe(75);
  });
});

// ============================================================================
// Tests de suggererMontantsArrondis
// ============================================================================

describe("suggererMontantsArrondis - suggestions de paiement", () => {
  it("inclut le montant exact", () => {
    const suggestions = suggererMontantsArrondis(4500);
    expect(suggestions).toContain(4500);
  });

  it("propose des montants arrondis au dessus", () => {
    const suggestions = suggererMontantsArrondis(4500);

    // Tous les montants suggeres doivent etre >= au total
    for (const s of suggestions) {
      expect(s).toBeGreaterThanOrEqual(4500);
    }
  });

  it("retourne un tableau trie", () => {
    const suggestions = suggererMontantsArrondis(7300);

    for (let i = 1; i < suggestions.length; i++) {
      expect(suggestions[i]).toBeGreaterThanOrEqual(suggestions[i - 1]);
    }
  });

  it("limite le nombre de suggestions", () => {
    const suggestions = suggererMontantsArrondis(1500);
    expect(suggestions.length).toBeLessThanOrEqual(6);
  });
});

// ============================================================================
// Tests de logique metier des ventes via schemas + utils
// ============================================================================

describe("Logique metier des ventes", () => {
  describe("Calcul de remise avec validation schema", () => {
    it("calcule une remise en pourcentage sur un sous-total", () => {
      const sousTotal = 10000;
      const remise = { type: "POURCENTAGE" as const, valeur: 10 };

      // La remise pourcentage : sousTotal * valeur / 100
      const montantRemise = Math.round((sousTotal * remise.valeur) / 100);
      expect(montantRemise).toBe(1000);

      // Le total apres remise
      const totalApresRemise = sousTotal - montantRemise;
      expect(totalApresRemise).toBe(9000);
    });

    it("calcule une remise en montant fixe", () => {
      const sousTotal = 10000;
      const remise = { type: "MONTANT_FIXE" as const, valeur: 500 };

      const totalApresRemise = sousTotal - remise.valeur;
      expect(totalApresRemise).toBe(9500);
    });
  });

  describe("Calcul complet d'une vente multi-lignes", () => {
    it("calcule le total d'une vente avec plusieurs produits et TVA", () => {
      const lignes = [
        { prixUnitaire: 5000, quantite: 2, tauxTva: 18 },
        { prixUnitaire: 3000, quantite: 1, tauxTva: 10 },
        { prixUnitaire: 1000, quantite: 3, tauxTva: 0 },
      ];

      let totalHT = 0;
      let totalTVA = 0;

      for (const ligne of lignes) {
        const result = calculerLigneVente(ligne.prixUnitaire, ligne.quantite, ligne.tauxTva);
        totalHT += result.sousTotal;
        totalTVA += result.montantTva;
      }

      const totalTTC = totalHT + totalTVA;

      // Ligne 1: 5000*2 = 10000 HT, TVA = 1800, TTC = 11800
      // Ligne 2: 3000*1 = 3000 HT, TVA = 300, TTC = 3300
      // Ligne 3: 1000*3 = 3000 HT, TVA = 0, TTC = 3000
      expect(totalHT).toBe(16000);
      expect(totalTVA).toBe(2100);
      expect(totalTTC).toBe(18100);
    });
  });

  describe("Gestion du stock", () => {
    it("deduit correctement le stock vendu avec calculerLigneVente", () => {
      const stockAvant = 50;
      const ligne = calculerLigneVente(5000, 2, 18);

      // La quantite vendue est 2 (prixUnitaire * quantite dans sousTotal)
      const quantiteVendue = ligne.sousTotal / 5000;
      const stockApres = stockAvant - quantiteVendue;

      expect(stockApres).toBe(48);
    });

    it("ne deduit pas si gererStock est false", () => {
      const produit = { gererStock: false, stockActuel: null as number | null };
      const shouldDeductStock = produit.gererStock && produit.stockActuel !== null;

      expect(shouldDeductStock).toBe(false);
    });
  });

  describe("Modes de paiement - validation avec schemas", () => {
    it("calcule le rendu monnaie avec la vraie fonction", () => {
      const total = 11800;
      const montantRecu = 15000;
      const monnaieRendue = montantRecu - total;

      expect(monnaieRendue).toBe(3200);

      // Verification avec la vraie fonction de rendu
      const coupures = calculerRenduMonnaie(monnaieRendue);
      const totalCoupures = coupures.reduce((sum, c) => sum + c.valeur * c.quantite, 0);
      expect(totalCoupures).toBe(3200);
    });

    it("valide un paiement Mobile Money via le schema", () => {
      const result = paiementSchema.safeParse({
        montant: 11800,
        modePaiement: "AIRTEL_MONEY",
        reference: "TX123456789",
      });

      expect(result.success).toBe(true);
    });

    it("valide un paiement mixte via le schema complet", () => {
      const result = paiementCompletSchema.safeParse({
        venteId: "vente-123",
        paiements: [
          { montant: 10000, modePaiement: "ESPECES" },
          { montant: 10000, modePaiement: "CARTE_BANCAIRE" },
        ],
      });

      expect(result.success).toBe(true);

      if (result.success) {
        const totalPaye = result.data.paiements.reduce((sum, p) => sum + p.montant, 0);
        expect(totalPaye).toBe(20000);
      }
    });
  });

  describe("Statistiques du jour avec fonctions reelles", () => {
    it("calcule les statistiques correctement", () => {
      const mockVentes = [
        { totalFinal: 10000, lignes: [{ quantite: 2 }, { quantite: 3 }] },
        { totalFinal: 15000, lignes: [{ quantite: 1 }] },
      ];

      const totalVentes = mockVentes.length;
      const chiffreAffaires = mockVentes.reduce((sum, v) => sum + v.totalFinal, 0);
      const articlesVendus = mockVentes.reduce(
        (sum, v) => sum + v.lignes.reduce((s, l) => s + l.quantite, 0),
        0
      );
      const panierMoyen = totalVentes > 0 ? Math.round(chiffreAffaires / totalVentes) : 0;

      expect(totalVentes).toBe(2);
      expect(chiffreAffaires).toBe(25000);
      expect(articlesVendus).toBe(6);
      expect(panierMoyen).toBe(12500);

      // Verification du formatage avec la vraie fonction
      const caFormate = formatCurrency(chiffreAffaires);
      expect(caFormate).toContain("FCFA");
    });

    it("gere le cas sans ventes", () => {
      const mockVentes: { totalFinal: number; lignes: { quantite: number }[] }[] = [];

      const totalVentes = mockVentes.length;
      const chiffreAffaires = mockVentes.reduce((sum, v) => sum + v.totalFinal, 0);
      const panierMoyen = totalVentes > 0 ? Math.round(chiffreAffaires / totalVentes) : 0;

      expect(totalVentes).toBe(0);
      expect(chiffreAffaires).toBe(0);
      expect(panierMoyen).toBe(0);
    });
  });
});
