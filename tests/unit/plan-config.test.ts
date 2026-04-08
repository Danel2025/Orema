/**
 * Tests unitaires pour la configuration des plans tarifaires
 *
 * Teste tous les helpers de lib/config/plans.ts :
 * upgrade/downgrade, prix, quotas, essai gratuit, resolution de slug, etc.
 */

import { describe, it, expect } from "vitest";
import {
  PLANS,
  PLAN_SLUGS,
  canUpgrade,
  canDowngrade,
  getPlanPrice,
  getPlanMonthlyPrice,
  getAnnualSavings,
  isPlanFree,
  hasTrial,
  resolvePlanSlug,
  getOrderedPlans,
  getPlanQuotas,
  getPlanBySlug,
  isPlanFeatureEnabled,
  PLAN_LABELS,
  BILLING_CYCLE_LABELS,
  LEGACY_PLAN_MAPPING,
} from "@/lib/config/plans";

// ============================================================================
// canUpgrade
// ============================================================================

describe("canUpgrade", () => {
  it("autorise essentiel vers pro", () => {
    expect(canUpgrade("essentiel", "pro")).toBe(true);
  });

  it("autorise essentiel vers business", () => {
    expect(canUpgrade("essentiel", "business")).toBe(true);
  });

  it("autorise essentiel vers enterprise", () => {
    expect(canUpgrade("essentiel", "enterprise")).toBe(true);
  });

  it("autorise pro vers business", () => {
    expect(canUpgrade("pro", "business")).toBe(true);
  });

  it("autorise pro vers enterprise", () => {
    expect(canUpgrade("pro", "enterprise")).toBe(true);
  });

  it("autorise business vers enterprise", () => {
    expect(canUpgrade("business", "enterprise")).toBe(true);
  });

  it("refuse business vers pro (downgrade)", () => {
    expect(canUpgrade("business", "pro")).toBe(false);
  });

  it("refuse pro vers essentiel (downgrade)", () => {
    expect(canUpgrade("pro", "essentiel")).toBe(false);
  });

  it("refuse essentiel vers essentiel (meme plan)", () => {
    expect(canUpgrade("essentiel", "essentiel")).toBe(false);
  });

  it("refuse pro vers pro (meme plan)", () => {
    expect(canUpgrade("pro", "pro")).toBe(false);
  });

  it("refuse enterprise vers business (downgrade)", () => {
    expect(canUpgrade("enterprise", "business")).toBe(false);
  });
});

// ============================================================================
// canDowngrade
// ============================================================================

describe("canDowngrade", () => {
  it("autorise pro vers essentiel", () => {
    expect(canDowngrade("pro", "essentiel")).toBe(true);
  });

  it("autorise business vers pro", () => {
    expect(canDowngrade("business", "pro")).toBe(true);
  });

  it("autorise business vers essentiel", () => {
    expect(canDowngrade("business", "essentiel")).toBe(true);
  });

  it("autorise enterprise vers business", () => {
    expect(canDowngrade("enterprise", "business")).toBe(true);
  });

  it("refuse essentiel vers pro (upgrade)", () => {
    expect(canDowngrade("essentiel", "pro")).toBe(false);
  });

  it("refuse pro vers business (upgrade)", () => {
    expect(canDowngrade("pro", "business")).toBe(false);
  });

  it("refuse essentiel vers essentiel (meme plan)", () => {
    expect(canDowngrade("essentiel", "essentiel")).toBe(false);
  });
});

// ============================================================================
// getPlanPrice
// ============================================================================

describe("getPlanPrice", () => {
  it("retourne 0 pour essentiel mensuel", () => {
    expect(getPlanPrice("essentiel", "mensuel")).toBe(0);
  });

  it("retourne 0 pour essentiel annuel", () => {
    expect(getPlanPrice("essentiel", "annuel")).toBe(0);
  });

  it("retourne 7500 pour pro mensuel", () => {
    expect(getPlanPrice("pro", "mensuel")).toBe(7_500);
  });

  it("retourne 75000 pour pro annuel", () => {
    expect(getPlanPrice("pro", "annuel")).toBe(75_000);
  });

  it("retourne 22500 pour business mensuel", () => {
    expect(getPlanPrice("business", "mensuel")).toBe(22_500);
  });

  it("retourne 225000 pour business annuel", () => {
    expect(getPlanPrice("business", "annuel")).toBe(225_000);
  });

  it("retourne 0 pour enterprise (sur devis)", () => {
    expect(getPlanPrice("enterprise", "mensuel")).toBe(0);
    expect(getPlanPrice("enterprise", "annuel")).toBe(0);
  });
});

// ============================================================================
// getPlanMonthlyPrice
// ============================================================================

describe("getPlanMonthlyPrice", () => {
  it("retourne le prix mensuel direct pour cycle mensuel", () => {
    expect(getPlanMonthlyPrice("pro", "mensuel")).toBe(7_500);
  });

  it("retourne le prix annuel divise par 12 pour cycle annuel", () => {
    // 75000 / 12 = 6250
    expect(getPlanMonthlyPrice("pro", "annuel")).toBe(6_250);
  });

  it("retourne 0 pour essentiel quel que soit le cycle", () => {
    expect(getPlanMonthlyPrice("essentiel", "mensuel")).toBe(0);
    expect(getPlanMonthlyPrice("essentiel", "annuel")).toBe(0);
  });

  it("retourne le prix mensuel correct pour business annuel", () => {
    // 225000 / 12 = 18750
    expect(getPlanMonthlyPrice("business", "annuel")).toBe(18_750);
  });

  it("retourne le prix mensuel direct pour business mensuel", () => {
    expect(getPlanMonthlyPrice("business", "mensuel")).toBe(22_500);
  });
});

// ============================================================================
// getAnnualSavings
// ============================================================================

describe("getAnnualSavings", () => {
  it("calcule l'economie annuelle pour pro", () => {
    // 7500 * 12 - 75000 = 90000 - 75000 = 15000
    expect(getAnnualSavings("pro")).toBe(15_000);
  });

  it("calcule l'economie annuelle pour business", () => {
    // 22500 * 12 - 225000 = 270000 - 225000 = 45000
    expect(getAnnualSavings("business")).toBe(45_000);
  });

  it("retourne 0 pour essentiel (gratuit)", () => {
    expect(getAnnualSavings("essentiel")).toBe(0);
  });

  it("retourne 0 pour enterprise (sur devis)", () => {
    expect(getAnnualSavings("enterprise")).toBe(0);
  });
});

// ============================================================================
// isPlanFree
// ============================================================================

describe("isPlanFree", () => {
  it("retourne true pour essentiel", () => {
    expect(isPlanFree("essentiel")).toBe(true);
  });

  it("retourne false pour pro", () => {
    expect(isPlanFree("pro")).toBe(false);
  });

  it("retourne false pour business", () => {
    expect(isPlanFree("business")).toBe(false);
  });

  it("retourne false pour enterprise (sur devis, pas gratuit)", () => {
    expect(isPlanFree("enterprise")).toBe(false);
  });
});

// ============================================================================
// hasTrial
// ============================================================================

describe("hasTrial", () => {
  it("retourne false pour essentiel (pas d'essai)", () => {
    expect(hasTrial("essentiel")).toBe(false);
  });

  it("retourne true pour pro (14 jours d'essai)", () => {
    expect(hasTrial("pro")).toBe(true);
    expect(PLANS.pro.metadata.essai_gratuit_jours).toBe(14);
  });

  it("retourne true pour business (14 jours d'essai)", () => {
    expect(hasTrial("business")).toBe(true);
    expect(PLANS.business.metadata.essai_gratuit_jours).toBe(14);
  });

  it("retourne false pour enterprise (pas d'essai)", () => {
    expect(hasTrial("enterprise")).toBe(false);
  });
});

// ============================================================================
// resolvePlanSlug
// ============================================================================

describe("resolvePlanSlug", () => {
  it("resout les slugs actuels sans changement", () => {
    expect(resolvePlanSlug("essentiel")).toBe("essentiel");
    expect(resolvePlanSlug("pro")).toBe("pro");
    expect(resolvePlanSlug("business")).toBe("business");
    expect(resolvePlanSlug("enterprise")).toBe("enterprise");
  });

  it("resout le slug legacy 'gratuit' vers 'essentiel'", () => {
    expect(resolvePlanSlug("gratuit")).toBe("essentiel");
  });

  it("resout le slug legacy 'starter' vers 'pro'", () => {
    expect(resolvePlanSlug("starter")).toBe("pro");
  });

  it("retourne 'essentiel' par defaut pour un slug inconnu", () => {
    expect(resolvePlanSlug("inconnu")).toBe("essentiel");
    expect(resolvePlanSlug("")).toBe("essentiel");
    expect(resolvePlanSlug("premium")).toBe("essentiel");
  });

  it("le mapping legacy contient les bons slugs", () => {
    expect(LEGACY_PLAN_MAPPING.gratuit).toBe("essentiel");
    expect(LEGACY_PLAN_MAPPING.starter).toBe("pro");
    expect(LEGACY_PLAN_MAPPING.pro).toBe("pro");
    expect(LEGACY_PLAN_MAPPING.enterprise).toBe("enterprise");
  });
});

// ============================================================================
// getOrderedPlans
// ============================================================================

describe("getOrderedPlans", () => {
  it("retourne 4 plans", () => {
    const plans = getOrderedPlans();
    expect(plans).toHaveLength(4);
  });

  it("retourne les plans dans l'ordre d'affichage croissant", () => {
    const plans = getOrderedPlans();
    expect(plans[0].slug).toBe("essentiel");
    expect(plans[1].slug).toBe("pro");
    expect(plans[2].slug).toBe("business");
    expect(plans[3].slug).toBe("enterprise");
  });

  it("chaque plan a un ordre d'affichage unique", () => {
    const plans = getOrderedPlans();
    const ordres = plans.map((p) => p.metadata.ordre_affichage);
    const unique = new Set(ordres);
    expect(unique.size).toBe(4);
  });
});

// ============================================================================
// getPlanQuotas
// ============================================================================

describe("getPlanQuotas", () => {
  it("retourne les bons quotas pour essentiel", () => {
    const quotas = getPlanQuotas("essentiel");
    expect(quotas.max_utilisateurs).toBe(2);
    expect(quotas.max_produits).toBe(50);
    expect(quotas.max_ventes_mois).toBe(500);
    expect(quotas.max_etablissements).toBe(1);
  });

  it("retourne les bons quotas pour pro", () => {
    const quotas = getPlanQuotas("pro");
    expect(quotas.max_utilisateurs).toBe(5);
    expect(quotas.max_produits).toBe(500);
    expect(quotas.max_ventes_mois).toBe(5_000);
    expect(quotas.max_etablissements).toBe(1);
  });

  it("retourne les bons quotas pour business", () => {
    const quotas = getPlanQuotas("business");
    expect(quotas.max_utilisateurs).toBe(20);
    expect(quotas.max_produits).toBe(5_000);
    expect(quotas.max_ventes_mois).toBe(50_000);
    expect(quotas.max_etablissements).toBe(3);
  });

  it("retourne les quotas tres eleves pour enterprise", () => {
    const quotas = getPlanQuotas("enterprise");
    expect(quotas.max_utilisateurs).toBe(1_000);
    expect(quotas.max_produits).toBe(100_000);
    expect(quotas.max_ventes_mois).toBe(10_000_000);
    expect(quotas.max_etablissements).toBe(999);
  });

  it("les quotas croissent avec le niveau du plan", () => {
    const orderedSlugs = ["essentiel", "pro", "business", "enterprise"] as const;
    for (let i = 0; i < orderedSlugs.length - 1; i++) {
      const lower = getPlanQuotas(orderedSlugs[i]);
      const upper = getPlanQuotas(orderedSlugs[i + 1]);
      expect(upper.max_utilisateurs).toBeGreaterThanOrEqual(lower.max_utilisateurs);
      expect(upper.max_produits).toBeGreaterThanOrEqual(lower.max_produits);
      expect(upper.max_ventes_mois).toBeGreaterThanOrEqual(lower.max_ventes_mois);
    }
  });
});

// ============================================================================
// getPlanBySlug
// ============================================================================

describe("getPlanBySlug", () => {
  it("retourne la configuration complete d'un plan", () => {
    const plan = getPlanBySlug("pro");
    expect(plan.slug).toBe("pro");
    expect(plan.nom).toBe("Pro");
    expect(plan.pricing).toBeDefined();
    expect(plan.quotas).toBeDefined();
    expect(plan.features).toBeDefined();
    expect(plan.metadata).toBeDefined();
  });
});

// ============================================================================
// isPlanFeatureEnabled
// ============================================================================

describe("isPlanFeatureEnabled", () => {
  it("essentiel n'a pas les tables de salle", () => {
    expect(isPlanFeatureEnabled("essentiel", "tables_salle")).toBe(false);
  });

  it("pro a les tables de salle", () => {
    expect(isPlanFeatureEnabled("pro", "tables_salle")).toBe(true);
  });

  it("essentiel n'a pas le mobile money", () => {
    expect(isPlanFeatureEnabled("essentiel", "mobile_money")).toBe(false);
  });

  it("pro a le mobile money", () => {
    expect(isPlanFeatureEnabled("pro", "mobile_money")).toBe(true);
  });

  it("essentiel a un support 'email' (considere comme non-active)", () => {
    expect(isPlanFeatureEnabled("essentiel", "support")).toBe(false);
  });

  it("pro a un support 'prioritaire' (considere comme active)", () => {
    expect(isPlanFeatureEnabled("pro", "support")).toBe(true);
  });

  it("essentiel a un mode hors-ligne 'basique' (considere comme non-active)", () => {
    expect(isPlanFeatureEnabled("essentiel", "mode_hors_ligne")).toBe(false);
  });

  it("pro a un mode hors-ligne 'complet' (considere comme active)", () => {
    expect(isPlanFeatureEnabled("pro", "mode_hors_ligne")).toBe(true);
  });
});

// ============================================================================
// Labels
// ============================================================================

describe("Labels et constantes", () => {
  it("PLAN_LABELS contient tous les plans", () => {
    for (const slug of PLAN_SLUGS) {
      expect(PLAN_LABELS[slug]).toBeDefined();
      expect(typeof PLAN_LABELS[slug]).toBe("string");
    }
  });

  it("BILLING_CYCLE_LABELS contient mensuel et annuel", () => {
    expect(BILLING_CYCLE_LABELS.mensuel).toBe("Mensuel");
    expect(BILLING_CYCLE_LABELS.annuel).toBe("Annuel");
  });

  it("PLAN_SLUGS contient exactement 4 plans", () => {
    expect(PLAN_SLUGS).toHaveLength(4);
    expect(PLAN_SLUGS).toContain("essentiel");
    expect(PLAN_SLUGS).toContain("pro");
    expect(PLAN_SLUGS).toContain("business");
    expect(PLAN_SLUGS).toContain("enterprise");
  });
});

// ============================================================================
// Coherence des prix
// ============================================================================

describe("Coherence des prix entre plans", () => {
  it("le prix mensuel du pro est inférieur au business", () => {
    expect(getPlanPrice("pro", "mensuel")).toBeLessThan(
      getPlanPrice("business", "mensuel")
    );
  });

  it("le prix annuel est toujours inférieur a 12x le mensuel", () => {
    for (const slug of ["pro", "business"] as const) {
      const annuel = getPlanPrice(slug, "annuel");
      const mensuel12 = getPlanPrice(slug, "mensuel") * 12;
      expect(annuel).toBeLessThan(mensuel12);
    }
  });

  it("tous les prix sont des entiers (FCFA sans decimales)", () => {
    for (const slug of PLAN_SLUGS) {
      expect(Number.isInteger(getPlanPrice(slug, "mensuel"))).toBe(true);
      expect(Number.isInteger(getPlanPrice(slug, "annuel"))).toBe(true);
    }
  });
});
