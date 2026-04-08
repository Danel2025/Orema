/**
 * Tests unitaires pour la logique de tarification
 *
 * Teste les validations de remises, marges, prix horaires
 * et les regles d'enforcement par role.
 */

import { describe, it, expect } from "vitest";
import {
  verifierRemiseAutorisee,
  verifierMarge,
  calculerPrixAvecTarifHoraire,
  type ReglesUtilisateur,
} from "@/lib/tarification/client-validation";
import {
  validerRemise,
  validerPrixMinimum,
  validerMarge as validerMargeServeur,
  validerModePaiement,
  validerModificationPrix,
  type EnforcementContext,
} from "@/lib/tarification/enforcement";
import { ROLES_DEFAUT_REMISE } from "@/schemas/tarification.schema";

// ============================================================================
// Verification des remises cote client
// ============================================================================

describe("Verification des remises (client-validation)", () => {
  const reglesAdmin: ReglesUtilisateur = {
    remiseMaxPourcent: 50,
    peutAppliquerRemise: true,
    peutModifierPrix: true,
    plafondRemiseTransaction: 0, // illimite
    necessiteApprobationAuDela: null,
    protectionMargeActive: false,
    margeMinimumGlobale: 0,
    approbationRemiseActive: false,
    tarifsHorairesActifs: false,
  };

  const reglesCaissier: ReglesUtilisateur = {
    remiseMaxPourcent: 5,
    peutAppliquerRemise: true,
    peutModifierPrix: false,
    plafondRemiseTransaction: 5000,
    necessiteApprobationAuDela: 3,
    protectionMargeActive: false,
    margeMinimumGlobale: 0,
    approbationRemiseActive: true,
    tarifsHorairesActifs: false,
  };

  const reglesServeur: ReglesUtilisateur = {
    remiseMaxPourcent: 0,
    peutAppliquerRemise: false,
    peutModifierPrix: false,
    plafondRemiseTransaction: 0,
    necessiteApprobationAuDela: null,
    protectionMargeActive: false,
    margeMinimumGlobale: 0,
    approbationRemiseActive: false,
    tarifsHorairesActifs: false,
  };

  describe("Admin", () => {
    it("autorise une remise de 30% pour un admin", () => {
      const result = verifierRemiseAutorisee(reglesAdmin, 30, 3000);
      expect(result.autorise).toBe(true);
    });

    it("refuse une remise de 60% pour un admin (max 50%)", () => {
      const result = verifierRemiseAutorisee(reglesAdmin, 60, 6000);
      expect(result.autorise).toBe(false);
      expect(result.raison).toContain("50%");
    });
  });

  describe("Caissier", () => {
    it("autorise une remise de 3% pour un caissier", () => {
      const result = verifierRemiseAutorisee(reglesCaissier, 3, 3000);
      // 3% <= 5% max mais > 3% seuil approbation
      // Comme approbationRemiseActive est true et necessiteApprobationAuDela est 3,
      // et pourcentageRemise <= remiseMaxPourcent mais > necessiteApprobationAuDela...
      // La verification du seuil d'approbation se fait meme si <= max
      expect(result.autorise).toBe(true); // 3% = seuil, pas strictement superieur
    });

    it("refuse une remise de 10% pour un caissier (max 5%)", () => {
      const result = verifierRemiseAutorisee(reglesCaissier, 10, 10000);
      expect(result.autorise).toBe(false);
      expect(result.necessiteApprobation).toBe(true);
    });

    it("refuse une remise dont le montant depasse le plafond", () => {
      const result = verifierRemiseAutorisee(reglesCaissier, 2, 6000);
      // 2% est OK, mais montant 6000 > plafond 5000
      expect(result.autorise).toBe(false);
      expect(result.raison).toContain("plafond");
    });

    it("demande approbation au-dela du seuil d'approbation", () => {
      const result = verifierRemiseAutorisee(reglesCaissier, 4, 4000);
      // 4% > 3% (seuil approbation) mais <= 5% (max)
      expect(result.autorise).toBe(false);
      expect(result.necessiteApprobation).toBe(true);
    });
  });

  describe("Serveur", () => {
    it("refuse toute remise pour un serveur", () => {
      const result = verifierRemiseAutorisee(reglesServeur, 5, 500);
      expect(result.autorise).toBe(false);
      expect(result.raison).toContain("ne permet pas");
    });
  });
});

// ============================================================================
// Verification des marges
// ============================================================================

describe("Verification des marges (client-validation)", () => {
  it("valide une marge suffisante", () => {
    // Prix vente 10000, prix achat 6000, marge = (10000-6000)/10000 * 100 = 40%
    const result = verifierMarge(10000, 6000, 20);
    expect(result.valide).toBe(true);
    expect(result.marge).toBeCloseTo(40);
  });

  it("refuse une marge insuffisante", () => {
    // Prix vente 5500, prix achat 5000, marge = (5500-5000)/5500 * 100 = 9.09%
    const result = verifierMarge(5500, 5000, 15);
    expect(result.valide).toBe(false);
    expect(result.raison).toContain("minimum requis");
  });

  it("retourne valide si pas de prix d'achat", () => {
    const result = verifierMarge(10000, null, 20);
    expect(result.valide).toBe(true);
    expect(result.marge).toBe(100);
  });

  it("retourne valide si prix d'achat est zero", () => {
    const result = verifierMarge(10000, 0, 20);
    expect(result.valide).toBe(true);
  });
});

// ============================================================================
// Calcul de prix avec tarif horaire
// ============================================================================

describe("Calcul de prix avec tarif horaire", () => {
  it("applique une majoration en pourcentage", () => {
    // Prix base 10000, majoration +20%
    const result = calculerPrixAvecTarifHoraire(10000, "pourcentage", 20);
    expect(result).toBe(12000);
  });

  it("applique une reduction en pourcentage", () => {
    // Prix base 10000, reduction -15%
    const result = calculerPrixAvecTarifHoraire(10000, "pourcentage", -15);
    expect(result).toBe(8500);
  });

  it("applique un montant fixe positif", () => {
    const result = calculerPrixAvecTarifHoraire(10000, "montant_fixe", 2000);
    expect(result).toBe(12000);
  });

  it("applique un montant fixe negatif (reduction)", () => {
    const result = calculerPrixAvecTarifHoraire(10000, "montant_fixe", -3000);
    expect(result).toBe(7000);
  });

  it("ne permet pas un prix negatif (plancher a 0)", () => {
    const result = calculerPrixAvecTarifHoraire(1000, "montant_fixe", -5000);
    expect(result).toBe(0);
  });

  it("ne permet pas un prix negatif avec pourcentage", () => {
    const result = calculerPrixAvecTarifHoraire(1000, "pourcentage", -150);
    expect(result).toBe(0);
  });

  it("arrondit correctement les resultats en pourcentage", () => {
    // 3333 * 15 / 100 = 499.95 -> arrondi a 500
    const ajustement = Math.round((3333 * 15) / 100);
    expect(ajustement).toBe(500);

    const result = calculerPrixAvecTarifHoraire(3333, "pourcentage", 15);
    expect(result).toBe(3333 + 500);
  });
});

// ============================================================================
// Enforcement cote serveur
// ============================================================================

describe("Enforcement cote serveur", () => {
  const contextAdmin: EnforcementContext = {
    etablissementId: "etab-1",
    userId: "user-1",
    role: "ADMIN",
    remiseMaxPourcent: 50,
    peutAppliquerRemise: true,
    peutModifierPrix: true,
    plafondRemiseTransaction: 0,
    necessiteApprobationAuDela: null,
    protectionMargeActive: true,
    margeMinimumGlobale: 15,
    approbationRemiseActive: false,
  };

  const contextCaissier: EnforcementContext = {
    etablissementId: "etab-1",
    userId: "user-2",
    role: "CAISSIER",
    remiseMaxPourcent: 5,
    peutAppliquerRemise: true,
    peutModifierPrix: false,
    plafondRemiseTransaction: 5000,
    necessiteApprobationAuDela: 3,
    protectionMargeActive: false,
    margeMinimumGlobale: 0,
    approbationRemiseActive: true,
  };

  const contextServeur: EnforcementContext = {
    etablissementId: "etab-1",
    userId: "user-3",
    role: "SERVEUR",
    remiseMaxPourcent: 0,
    peutAppliquerRemise: false,
    peutModifierPrix: false,
    plafondRemiseTransaction: 0,
    necessiteApprobationAuDela: null,
    protectionMargeActive: false,
    margeMinimumGlobale: 0,
    approbationRemiseActive: false,
  };

  describe("validerRemise", () => {
    it("autorise une remise dans les limites", () => {
      const result = validerRemise(contextAdmin, 30, 3000);
      expect(result.valide).toBe(true);
    });

    it("refuse une remise au-dela du maximum", () => {
      const result = validerRemise(contextAdmin, 60, 6000);
      expect(result.valide).toBe(false);
      expect(result.raison).toContain("50%");
    });

    it("refuse toute remise pour un serveur", () => {
      const result = validerRemise(contextServeur, 1, 100);
      expect(result.valide).toBe(false);
    });

    it("refuse un montant de remise au-dela du plafond par transaction", () => {
      const result = validerRemise(contextCaissier, 3, 6000);
      expect(result.valide).toBe(false);
      expect(result.raison).toContain("plafond");
    });

    it("demande approbation au-dela du seuil d'approbation", () => {
      const result = validerRemise(contextCaissier, 4, 4000);
      expect(result.valide).toBe(false);
      expect(result.necessiteApprobation).toBe(true);
    });
  });

  describe("validerPrixMinimum", () => {
    it("valide un montant au-dessus du minimum", () => {
      const result = validerPrixMinimum(5000, 1000);
      expect(result.valide).toBe(true);
    });

    it("refuse un montant en dessous du minimum", () => {
      const result = validerPrixMinimum(500, 1000);
      expect(result.valide).toBe(false);
      expect(result.raison).toContain("minimum requis");
    });

    it("valide si pas de minimum defini (0)", () => {
      const result = validerPrixMinimum(100, 0);
      expect(result.valide).toBe(true);
    });
  });

  describe("validerMarge (serveur)", () => {
    it("valide une marge suffisante", () => {
      const result = validerMargeServeur(10000, 5000, 20);
      // Marge = (10000-5000)/5000 * 100 = 100% > 20%
      expect(result.valide).toBe(true);
    });

    it("refuse une marge insuffisante", () => {
      const result = validerMargeServeur(5100, 5000, 20);
      // Marge = (5100-5000)/5000 * 100 = 2% < 20%
      expect(result.valide).toBe(false);
    });

    it("valide si pas de prix d'achat", () => {
      const result = validerMargeServeur(10000, null, 20);
      expect(result.valide).toBe(true);
    });

    it("valide si prix d'achat est zero", () => {
      const result = validerMargeServeur(10000, 0, 20);
      expect(result.valide).toBe(true);
    });
  });

  describe("validerModePaiement", () => {
    it("valide un mode de paiement actif", () => {
      const result = validerModePaiement("ESPECES", [
        "ESPECES",
        "CARTE_BANCAIRE",
        "AIRTEL_MONEY",
      ]);
      expect(result.valide).toBe(true);
    });

    it("refuse un mode de paiement inactif", () => {
      const result = validerModePaiement("CHEQUE", [
        "ESPECES",
        "CARTE_BANCAIRE",
      ]);
      expect(result.valide).toBe(false);
      expect(result.raison).toContain("CHEQUE");
    });

    it("valide tout si la liste de modes est vide", () => {
      const result = validerModePaiement("ESPECES", []);
      expect(result.valide).toBe(true);
    });
  });

  describe("validerModificationPrix", () => {
    it("autorise un admin a modifier les prix", () => {
      const result = validerModificationPrix(contextAdmin);
      expect(result.valide).toBe(true);
    });

    it("refuse un caissier de modifier les prix", () => {
      const result = validerModificationPrix(contextCaissier);
      expect(result.valide).toBe(false);
    });

    it("refuse un serveur de modifier les prix", () => {
      const result = validerModificationPrix(contextServeur);
      expect(result.valide).toBe(false);
    });
  });
});

// ============================================================================
// Valeurs par defaut des remises par role
// ============================================================================

describe("Valeurs par defaut des remises par role", () => {
  it("definit 100% pour SUPER_ADMIN", () => {
    expect(ROLES_DEFAUT_REMISE["SUPER_ADMIN"]).toBe(100);
  });

  it("definit 50% pour ADMIN", () => {
    expect(ROLES_DEFAUT_REMISE["ADMIN"]).toBe(50);
  });

  it("definit 20% pour MANAGER", () => {
    expect(ROLES_DEFAUT_REMISE["MANAGER"]).toBe(20);
  });

  it("definit 5% pour CAISSIER", () => {
    expect(ROLES_DEFAUT_REMISE["CAISSIER"]).toBe(5);
  });

  it("definit 0% pour SERVEUR", () => {
    expect(ROLES_DEFAUT_REMISE["SERVEUR"]).toBe(0);
  });
});
