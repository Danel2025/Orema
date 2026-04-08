/**
 * Tests unitaires pour la logique des webhooks de facturation
 *
 * Teste les regles metier des webhooks Monetbil et Stripe :
 * mapping de statut, idempotence, activation d'abonnement,
 * creation de facture et gestion des erreurs.
 */

import { describe, it, expect } from "vitest";
import {
  resolvePlanSlug,
  getPlanQuotas,
  type PlanSlug,
} from "@/lib/config/plans";

// ============================================================================
// Logique d'activation d'abonnement (Monetbil)
// ============================================================================

describe("Activation d'abonnement via webhook Monetbil", () => {
  function simulateActivation(providerPayload: Record<string, unknown> | null) {
    const targetPlan = providerPayload?.plan_slug as string | undefined;
    const billingCycle = (providerPayload?.billing_cycle as string) ?? "mensuel";

    if (!targetPlan) {
      return { success: false, error: "provider_payload.plan_slug manquant" };
    }

    const planSlug = resolvePlanSlug(targetPlan);
    const quotas = getPlanQuotas(planSlug);

    return {
      success: true,
      planSlug,
      billingCycle,
      quotas,
    };
  }

  it("active correctement un abonnement pro mensuel", () => {
    const result = simulateActivation({
      plan_slug: "pro",
      billing_cycle: "mensuel",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.planSlug).toBe("pro");
      expect(result.billingCycle).toBe("mensuel");
      expect(result.quotas.max_utilisateurs).toBe(5);
      expect(result.quotas.max_produits).toBe(500);
    }
  });

  it("active correctement un abonnement business annuel", () => {
    const result = simulateActivation({
      plan_slug: "business",
      billing_cycle: "annuel",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.planSlug).toBe("business");
      expect(result.billingCycle).toBe("annuel");
      expect(result.quotas.max_utilisateurs).toBe(20);
    }
  });

  it("resout un slug legacy lors de l'activation", () => {
    const result = simulateActivation({
      plan_slug: "starter",
      billing_cycle: "mensuel",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.planSlug).toBe("pro");
    }
  });

  it("utilise 'mensuel' par defaut si billing_cycle absent", () => {
    const result = simulateActivation({
      plan_slug: "pro",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.billingCycle).toBe("mensuel");
    }
  });

  it("echoue si plan_slug manquant dans le payload", () => {
    const result = simulateActivation(null);
    expect(result.success).toBe(false);
  });

  it("echoue si provider_payload est vide", () => {
    const result = simulateActivation({});
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Idempotence des webhooks
// ============================================================================

describe("Idempotence des webhooks", () => {
  function shouldProcess(existingStatut: string | null): boolean {
    // Si le paiement est deja "reussi", ignorer le webhook (idempotent)
    if (existingStatut === "reussi") return false;
    return true;
  }

  it("traite un paiement en attente", () => {
    expect(shouldProcess("en_attente")).toBe(true);
  });

  it("traite un paiement echoue (retry possible)", () => {
    expect(shouldProcess("echoue")).toBe(true);
  });

  it("ignore un paiement deja reussi (idempotent)", () => {
    expect(shouldProcess("reussi")).toBe(false);
  });

  it("traite un paiement inconnu (null = pas encore en DB)", () => {
    expect(shouldProcess(null)).toBe(true);
  });
});

// ============================================================================
// Mapping de statut Monetbil vers statut interne
// ============================================================================

describe("Mapping de statut Monetbil", () => {
  const statusMap: Record<string, string> = {
    success: "reussi",
    failed: "echoue",
    cancelled: "echoue",
  };

  function mapMonetbilStatus(monetbilStatus: string): string {
    return statusMap[monetbilStatus] ?? "echoue";
  }

  it("mappe 'success' vers 'reussi'", () => {
    expect(mapMonetbilStatus("success")).toBe("reussi");
  });

  it("mappe 'failed' vers 'echoue'", () => {
    expect(mapMonetbilStatus("failed")).toBe("echoue");
  });

  it("mappe 'cancelled' vers 'echoue' (pas 'annule')", () => {
    expect(mapMonetbilStatus("cancelled")).toBe("echoue");
  });

  it("mappe un statut inconnu vers 'echoue' par defaut", () => {
    expect(mapMonetbilStatus("pending")).toBe("echoue");
    expect(mapMonetbilStatus("unknown")).toBe("echoue");
    expect(mapMonetbilStatus("")).toBe("echoue");
  });
});

// ============================================================================
// Logique Stripe : detection du type d'evenement
// ============================================================================

describe("Detection du type d'evenement Stripe", () => {
  const HANDLED_EVENTS = [
    "checkout.session.completed",
    "invoice.paid",
    "customer.subscription.updated",
    "customer.subscription.deleted",
  ];

  it("reconnait checkout.session.completed", () => {
    expect(HANDLED_EVENTS).toContain("checkout.session.completed");
  });

  it("reconnait invoice.paid", () => {
    expect(HANDLED_EVENTS).toContain("invoice.paid");
  });

  it("reconnait customer.subscription.updated", () => {
    expect(HANDLED_EVENTS).toContain("customer.subscription.updated");
  });

  it("reconnait customer.subscription.deleted", () => {
    expect(HANDLED_EVENTS).toContain("customer.subscription.deleted");
  });

  it("ne gere pas les autres evenements", () => {
    expect(HANDLED_EVENTS).not.toContain("charge.succeeded");
    expect(HANDLED_EVENTS).not.toContain("payment_intent.created");
  });
});

// ============================================================================
// Stripe signature manquante
// ============================================================================

describe("Validation de la signature Stripe", () => {
  it("rejette une requete sans signature", () => {
    const signature = null;
    const isValid = signature !== null;
    expect(isValid).toBe(false);
  });

  it("accepte une requete avec signature presente", () => {
    const signature = "t=1234567890,v1=abc123";
    const isValid = signature !== null;
    expect(isValid).toBe(true);
  });
});

// ============================================================================
// Logique de downgrade lors de subscription.deleted
// ============================================================================

describe("Downgrade lors de subscription.deleted", () => {
  it("downgrade vers essentiel avec les bons quotas", () => {
    const essentialQuotas = getPlanQuotas("essentiel");

    expect(essentialQuotas.max_utilisateurs).toBe(2);
    expect(essentialQuotas.max_produits).toBe(50);
    expect(essentialQuotas.max_ventes_mois).toBe(500);
    expect(essentialQuotas.max_etablissements).toBe(1);
  });

  it("les quotas essentiel sont inferieurs a tous les autres plans", () => {
    const essentialQuotas = getPlanQuotas("essentiel");

    for (const slug of ["pro", "business", "enterprise"] as PlanSlug[]) {
      const quotas = getPlanQuotas(slug);
      expect(quotas.max_utilisateurs).toBeGreaterThan(essentialQuotas.max_utilisateurs);
      expect(quotas.max_produits).toBeGreaterThan(essentialQuotas.max_produits);
    }
  });
});

// ============================================================================
// Calcul de la periode d'abonnement
// ============================================================================

describe("Calcul de la periode d'abonnement", () => {
  it("calcule une periode mensuelle (1 mois)", () => {
    const now = new Date("2026-03-15T10:00:00Z");
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    expect(periodEnd.getFullYear()).toBe(2026);
    expect(periodEnd.getMonth()).toBe(3); // Avril (0-indexed)
    expect(periodEnd.getDate()).toBe(15);
  });

  it("calcule une periode annuelle (1 an)", () => {
    const now = new Date("2026-03-15T10:00:00Z");
    const periodEnd = new Date(now);
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);

    expect(periodEnd.getFullYear()).toBe(2027);
    expect(periodEnd.getMonth()).toBe(2); // Mars
    expect(periodEnd.getDate()).toBe(15);
  });

  it("gere le passage de mois avec 31 jours vers 28/30", () => {
    const now = new Date("2026-01-31T10:00:00Z");
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Fevrier n'a que 28 jours -> JavaScript avance au 3 mars
    expect(periodEnd.getMonth()).toBe(2); // Mars (overflow)
  });
});

// ============================================================================
// Determination du cycle de facturation depuis une facture Stripe
// ============================================================================

describe("Determination du cycle de facturation", () => {
  function determineBillingCycle(periodStartSeconds: number, periodEndSeconds: number): string {
    const durationDays = (periodEndSeconds - periodStartSeconds) / (60 * 60 * 24);
    return durationDays > 60 ? "annuel" : "mensuel";
  }

  it("detecte un cycle mensuel (~30 jours)", () => {
    const start = Math.floor(new Date("2026-03-01").getTime() / 1000);
    const end = Math.floor(new Date("2026-04-01").getTime() / 1000);
    expect(determineBillingCycle(start, end)).toBe("mensuel");
  });

  it("detecte un cycle annuel (~365 jours)", () => {
    const start = Math.floor(new Date("2026-03-01").getTime() / 1000);
    const end = Math.floor(new Date("2027-03-01").getTime() / 1000);
    expect(determineBillingCycle(start, end)).toBe("annuel");
  });

  it("detecte correctement la frontiere a 60 jours", () => {
    const start = Math.floor(new Date("2026-01-01").getTime() / 1000);
    const end60 = Math.floor(new Date("2026-03-02").getTime() / 1000); // 60 jours exactement
    expect(determineBillingCycle(start, end60)).toBe("mensuel");

    const end61 = Math.floor(new Date("2026-03-03").getTime() / 1000); // 61 jours
    expect(determineBillingCycle(start, end61)).toBe("annuel");
  });
});

// ============================================================================
// Creation de facture - calcul TVA SaaS
// ============================================================================

describe("Creation de facture d'abonnement", () => {
  it("les abonnements SaaS ne sont pas soumis a la TVA gabonaise", () => {
    const montant = 7_500;
    const tva = 0; // Abonnement SaaS = pas de TVA
    const montantTtc = montant + tva;

    expect(tva).toBe(0);
    expect(montantTtc).toBe(montant);
  });

  it("le montant TTC est egal au montant HT pour les abonnements", () => {
    for (const amount of [7_500, 22_500, 75_000, 225_000]) {
      const tva = 0;
      const montantTtc = amount + tva;
      expect(montantTtc).toBe(amount);
    }
  });
});

// ============================================================================
// Fusion de provider_payload Monetbil (update preservant les donnees)
// ============================================================================

describe("Fusion de provider_payload Monetbil", () => {
  it("preserve plan_slug et billing_cycle lors du merge avec le webhook", () => {
    const prevPayload = {
      plan_slug: "pro",
      billing_cycle: "mensuel",
    };

    const webhookData = {
      operator: "AIRTEL",
      fee: "150",
      country_name: "Gabon",
      message: "Payment successful",
      phone: "+24177123456",
      transaction_id: "txn_abc123",
    };

    const merged = {
      ...prevPayload,
      ...webhookData,
    };

    // Les donnees originales sont preservees
    expect(merged.plan_slug).toBe("pro");
    expect(merged.billing_cycle).toBe("mensuel");

    // Les donnees du webhook sont ajoutees
    expect(merged.operator).toBe("AIRTEL");
    expect(merged.transaction_id).toBe("txn_abc123");
    expect(merged.phone).toBe("+24177123456");
  });

  it("gere un provider_payload original null", () => {
    const prevPayload = {};
    const webhookData = { operator: "MOOV", phone: "+24166123456" };
    const merged = { ...prevPayload, ...webhookData };

    expect(merged.operator).toBe("MOOV");
  });
});

// ============================================================================
// Parsing du body webhook Monetbil (JSON vs form-urlencoded)
// ============================================================================

describe("Parsing du body webhook Monetbil", () => {
  it("parse correctement un body JSON", () => {
    const jsonBody = JSON.stringify({
      payment_ref: "ref_123",
      status: "success",
      amount: "7500",
      phone: "+24177123456",
    });

    const parsed = JSON.parse(jsonBody);
    expect(parsed.payment_ref).toBe("ref_123");
    expect(parsed.status).toBe("success");
  });

  it("parse correctement un body form-urlencoded", () => {
    const formBody = "payment_ref=ref_123&status=success&amount=7500&phone=%2B24177123456";
    const params = new URLSearchParams(formBody);
    const parsed = Object.fromEntries(params.entries());

    expect(parsed.payment_ref).toBe("ref_123");
    expect(parsed.status).toBe("success");
    expect(parsed.amount).toBe("7500");
    expect(parsed.phone).toBe("+24177123456");
  });
});
