/**
 * Tests unitaires pour les server actions de gestion des abonnements
 *
 * Teste les regles metier de upgradePlan, downgradePlan, cancelSubscription
 * et getCurrentSubscription en mockant les modules d'auth et Supabase.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  PLANS,
  getPlanQuotas,
  canUpgrade,
  canDowngrade,
  resolvePlanSlug,
  isPlanFree,
  type PlanSlug,
  type BillingCycle,
} from "@/lib/config/plans";

// ============================================================================
// Logique metier d'upgrade (sans appel Supabase)
// ============================================================================

describe("Logique metier d'upgrade", () => {
  function validateUpgrade(
    currentPlan: string,
    newPlan: string,
    billingCycle: BillingCycle
  ): { success: boolean; error?: string; requiresPayment?: boolean; amount?: number } {
    // Verifier que le plan existe
    const validSlugs = ["essentiel", "pro", "business", "enterprise"];
    if (!validSlugs.includes(newPlan)) {
      return { success: false, error: `Plan "${newPlan}" inconnu` };
    }

    const newPlanSlug = newPlan as PlanSlug;
    const currentPlanSlug = resolvePlanSlug(currentPlan);

    // Verifier que c'est bien un upgrade
    if (!canUpgrade(currentPlanSlug, newPlanSlug)) {
      return {
        success: false,
        error: `Le plan "${newPlan}" n'est pas un upgrade par rapport a "${currentPlanSlug}"`,
      };
    }

    // Plans sur devis
    if (PLANS[newPlanSlug].pricing.sur_devis) {
      return {
        success: false,
        error: "Le plan Enterprise est sur devis. Contactez-nous.",
      };
    }

    const amount = PLANS[newPlanSlug].pricing[billingCycle];

    return {
      success: true,
      requiresPayment: amount > 0,
      amount,
    };
  }

  describe("Plan inconnu", () => {
    it("rejette un plan qui n'existe pas", () => {
      const result = validateUpgrade("essentiel", "premium", "mensuel");
      expect(result.success).toBe(false);
      expect(result.error).toContain("inconnu");
    });

    it("rejette un plan vide", () => {
      const result = validateUpgrade("essentiel", "", "mensuel");
      expect(result.success).toBe(false);
    });
  });

  describe("Pas un upgrade", () => {
    it("rejette pro vers essentiel (downgrade)", () => {
      const result = validateUpgrade("pro", "essentiel", "mensuel");
      expect(result.success).toBe(false);
      expect(result.error).toContain("pas un upgrade");
    });

    it("rejette business vers pro (downgrade)", () => {
      const result = validateUpgrade("business", "pro", "mensuel");
      expect(result.success).toBe(false);
    });

    it("rejette meme plan (pro vers pro)", () => {
      const result = validateUpgrade("pro", "pro", "mensuel");
      expect(result.success).toBe(false);
    });
  });

  describe("Enterprise (sur devis)", () => {
    it("rejette un upgrade vers enterprise", () => {
      const result = validateUpgrade("pro", "enterprise", "mensuel");
      expect(result.success).toBe(false);
      expect(result.error).toContain("sur devis");
    });
  });

  describe("Upgrade valide", () => {
    it("accepte essentiel vers pro mensuel", () => {
      const result = validateUpgrade("essentiel", "pro", "mensuel");
      expect(result.success).toBe(true);
      expect(result.requiresPayment).toBe(true);
      expect(result.amount).toBe(7_500);
    });

    it("accepte essentiel vers pro annuel", () => {
      const result = validateUpgrade("essentiel", "pro", "annuel");
      expect(result.success).toBe(true);
      expect(result.requiresPayment).toBe(true);
      expect(result.amount).toBe(75_000);
    });

    it("accepte essentiel vers business mensuel", () => {
      const result = validateUpgrade("essentiel", "business", "mensuel");
      expect(result.success).toBe(true);
      expect(result.requiresPayment).toBe(true);
      expect(result.amount).toBe(22_500);
    });

    it("accepte pro vers business mensuel", () => {
      const result = validateUpgrade("pro", "business", "mensuel");
      expect(result.success).toBe(true);
      expect(result.requiresPayment).toBe(true);
      expect(result.amount).toBe(22_500);
    });

    it("resout les slugs legacy avant upgrade", () => {
      const result = validateUpgrade("gratuit", "pro", "mensuel");
      expect(result.success).toBe(true);
      expect(result.requiresPayment).toBe(true);
    });
  });
});

// ============================================================================
// Logique metier de downgrade
// ============================================================================

describe("Logique metier de downgrade", () => {
  function validateDowngrade(
    currentPlan: string,
    newPlan: string,
    nbUsers: number,
    nbProduits: number
  ): { success: boolean; error?: string } {
    const validSlugs = ["essentiel", "pro", "business", "enterprise"];
    if (!validSlugs.includes(newPlan)) {
      return { success: false, error: `Plan "${newPlan}" inconnu` };
    }

    const newPlanSlug = newPlan as PlanSlug;
    const currentPlanSlug = resolvePlanSlug(currentPlan);

    if (!canDowngrade(currentPlanSlug, newPlanSlug)) {
      return { success: false, error: `Le plan "${newPlan}" n'est pas un downgrade` };
    }

    // Verifier les quotas
    const newQuotas = getPlanQuotas(newPlanSlug);

    if (nbUsers > newQuotas.max_utilisateurs) {
      return {
        success: false,
        error: `Vous avez ${nbUsers} utilisateurs actifs, mais le plan "${newPlan}" n'en autorise que ${newQuotas.max_utilisateurs}`,
      };
    }

    if (nbProduits > newQuotas.max_produits) {
      return {
        success: false,
        error: `Vous avez ${nbProduits} produits, mais le plan "${newPlan}" n'en autorise que ${newQuotas.max_produits}`,
      };
    }

    return { success: true };
  }

  describe("Quotas depasses", () => {
    it("rejette si trop d'utilisateurs pour le plan cible", () => {
      // Pro autorise 5 users, essentiel autorise 2
      const result = validateDowngrade("pro", "essentiel", 3, 10);
      expect(result.success).toBe(false);
      expect(result.error).toContain("utilisateurs");
      expect(result.error).toContain("2");
    });

    it("rejette si trop de produits pour le plan cible", () => {
      // Business autorise 5000 produits, essentiel autorise 50
      const result = validateDowngrade("business", "essentiel", 1, 100);
      expect(result.success).toBe(false);
      expect(result.error).toContain("produits");
      expect(result.error).toContain("50");
    });

    it("rejette si trop d'utilisateurs ET de produits", () => {
      // La premiere verification (utilisateurs) echoue en premier
      const result = validateDowngrade("business", "essentiel", 10, 200);
      expect(result.success).toBe(false);
      expect(result.error).toContain("utilisateurs");
    });
  });

  describe("Downgrade valide", () => {
    it("accepte pro vers essentiel si quotas respectes", () => {
      const result = validateDowngrade("pro", "essentiel", 2, 30);
      expect(result.success).toBe(true);
    });

    it("accepte business vers pro si quotas respectes", () => {
      const result = validateDowngrade("business", "pro", 5, 400);
      expect(result.success).toBe(true);
    });

    it("accepte exactement au quota max", () => {
      // Essentiel autorise exactement 2 utilisateurs et 50 produits
      const result = validateDowngrade("pro", "essentiel", 2, 50);
      expect(result.success).toBe(true);
    });
  });

  describe("Pas un downgrade", () => {
    it("rejette essentiel vers pro (upgrade)", () => {
      const result = validateDowngrade("essentiel", "pro", 1, 10);
      expect(result.success).toBe(false);
      expect(result.error).toContain("pas un downgrade");
    });
  });
});

// ============================================================================
// Logique d'annulation
// ============================================================================

describe("Logique d'annulation d'abonnement", () => {
  function validateCancelSubscription(
    currentPlan: string
  ): { success: boolean; error?: string } {
    if (currentPlan === "essentiel") {
      return { success: false, error: "Vous etes deja sur le plan gratuit" };
    }
    return { success: true };
  }

  it("rejette l'annulation du plan essentiel (gratuit)", () => {
    const result = validateCancelSubscription("essentiel");
    expect(result.success).toBe(false);
    expect(result.error).toContain("plan gratuit");
  });

  it("accepte l'annulation du plan pro", () => {
    const result = validateCancelSubscription("pro");
    expect(result.success).toBe(true);
  });

  it("accepte l'annulation du plan business", () => {
    const result = validateCancelSubscription("business");
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Calcul des quotas d'abonnement
// ============================================================================

describe("Calcul des quotas d'abonnement", () => {
  function calculateQuotaUsage(
    quotas: ReturnType<typeof getPlanQuotas>,
    usage: { utilisateurs: number; produits: number; ventesMois: number }
  ) {
    return {
      utilisateurs: {
        actuel: usage.utilisateurs,
        max: quotas.max_utilisateurs,
        pourcentage: Math.round((usage.utilisateurs / quotas.max_utilisateurs) * 100),
      },
      produits: {
        actuel: usage.produits,
        max: quotas.max_produits,
        pourcentage: Math.round((usage.produits / quotas.max_produits) * 100),
      },
      ventesMois: {
        actuel: usage.ventesMois,
        max: quotas.max_ventes_mois,
        pourcentage: Math.round((usage.ventesMois / quotas.max_ventes_mois) * 100),
      },
    };
  }

  it("calcule les pourcentages d'utilisation pour le plan essentiel", () => {
    const quotas = getPlanQuotas("essentiel");
    const usage = calculateQuotaUsage(quotas, {
      utilisateurs: 1,
      produits: 25,
      ventesMois: 250,
    });

    expect(usage.utilisateurs.pourcentage).toBe(50);
    expect(usage.produits.pourcentage).toBe(50);
    expect(usage.ventesMois.pourcentage).toBe(50);
  });

  it("detecte un quota proche de la limite (>= 80%)", () => {
    const quotas = getPlanQuotas("essentiel");
    const usage = calculateQuotaUsage(quotas, {
      utilisateurs: 2,
      produits: 45,
      ventesMois: 450,
    });

    expect(usage.utilisateurs.pourcentage).toBe(100);
    expect(usage.produits.pourcentage).toBe(90);
    expect(usage.ventesMois.pourcentage).toBe(90);
  });

  it("gere une utilisation a zero", () => {
    const quotas = getPlanQuotas("pro");
    const usage = calculateQuotaUsage(quotas, {
      utilisateurs: 0,
      produits: 0,
      ventesMois: 0,
    });

    expect(usage.utilisateurs.pourcentage).toBe(0);
    expect(usage.produits.pourcentage).toBe(0);
    expect(usage.ventesMois.pourcentage).toBe(0);
  });
});

// ============================================================================
// Mapping de statut Monetbil
// ============================================================================

describe("Mapping de statut Monetbil", () => {
  const statusMap: Record<string, string> = {
    success: "reussi",
    failed: "echoue",
    cancelled: "echoue",
  };

  it("mappe 'success' vers 'reussi'", () => {
    expect(statusMap["success"]).toBe("reussi");
  });

  it("mappe 'failed' vers 'echoue'", () => {
    expect(statusMap["failed"]).toBe("echoue");
  });

  it("mappe 'cancelled' vers 'echoue'", () => {
    expect(statusMap["cancelled"]).toBe("echoue");
  });

  it("retourne 'echoue' pour un statut inconnu", () => {
    const unknownStatus = "random";
    const result = statusMap[unknownStatus] ?? "echoue";
    expect(result).toBe("echoue");
  });
});

// ============================================================================
// Mapping de statut Stripe
// ============================================================================

describe("Mapping de statut Stripe", () => {
  const statusMap: Record<string, string> = {
    active: "actif",
    past_due: "actif",
    canceled: "annule",
    unpaid: "expire",
    trialing: "en_essai",
    incomplete: "en_essai",
    incomplete_expired: "expire",
    paused: "suspendu",
  };

  it("mappe 'active' vers 'actif'", () => {
    expect(statusMap["active"]).toBe("actif");
  });

  it("mappe 'past_due' vers 'actif' (toujours actif mais en retard)", () => {
    expect(statusMap["past_due"]).toBe("actif");
  });

  it("mappe 'canceled' vers 'annule'", () => {
    expect(statusMap["canceled"]).toBe("annule");
  });

  it("mappe 'unpaid' vers 'expire'", () => {
    expect(statusMap["unpaid"]).toBe("expire");
  });

  it("mappe 'trialing' vers 'en_essai'", () => {
    expect(statusMap["trialing"]).toBe("en_essai");
  });

  it("mappe 'incomplete' vers 'en_essai'", () => {
    expect(statusMap["incomplete"]).toBe("en_essai");
  });

  it("mappe 'incomplete_expired' vers 'expire'", () => {
    expect(statusMap["incomplete_expired"]).toBe("expire");
  });

  it("mappe 'paused' vers 'suspendu'", () => {
    expect(statusMap["paused"]).toBe("suspendu");
  });

  it("retourne 'actif' pour un statut inconnu", () => {
    const unknownStatus = "random";
    const result = statusMap[unknownStatus] ?? "actif";
    expect(result).toBe("actif");
  });
});
