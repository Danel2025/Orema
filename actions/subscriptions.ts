"use server";

/**
 * Server Actions pour la gestion des abonnements
 *
 * Gere les operations CRUD sur les abonnements:
 * upgrade, downgrade, annulation, reactivation, consultation.
 *
 * Colonnes sur etablissements: plan, billing_cycle, max_utilisateurs, max_produits,
 *   max_ventes_mois, max_etablissements, stripe_customer_id, monetbil_service_key
 * Table abonnements: statut, date_debut, date_fin, stripe_subscription_id, billing_cycle
 */

import { getCurrentUser, requireAnyRole } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  cancelStripeSubscription,
  reactivateStripeSubscription,
  createStripeCustomerPortalSession,
  type SubscriptionPaymentProvider,
} from "@/lib/payments";
import type { ActionResult } from "@/lib/action-types";
import {
  PLANS,
  PLAN_SLUGS,
  resolvePlanSlug,
  canUpgrade,
  canDowngrade,
  isPlanFree,
  getPlanQuotas,
  type PlanSlug,
  type BillingCycle,
} from "@/lib/config/plans";

// ============================================================================
// TYPES
// ============================================================================

interface SubscriptionInfo {
  plan: string;
  billingCycle: BillingCycle;
  status: string;
  dateDebut: string | null;
  dateFin: string | null;
  stripeSubscriptionId: string | null;
  quotas: {
    utilisateurs: { actuel: number; max: number };
    produits: { actuel: number; max: number };
    ventesMois: { actuel: number; max: number };
  };
}

// ============================================================================
// GET CURRENT SUBSCRIPTION
// ============================================================================

/**
 * Recupere les informations d'abonnement de l'etablissement courant.
 */
export async function getCurrentSubscription(): Promise<
  ActionResult<SubscriptionInfo>
> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Non authentifie" };
  if (!user.etablissementId)
    return { success: false, error: "Aucun etablissement associe" };

  const supabase = await createClient();

  // Recuperer l'etablissement avec ses infos de plan
  const { data: etabData, error: etabError } = await supabase
    .from("etablissements")
    .select("plan, billing_cycle, max_utilisateurs, max_produits, max_ventes_mois, max_etablissements")
    .eq("id", user.etablissementId)
    .single();

  if (etabError || !etabData) {
    return { success: false, error: "Établissement non trouvé" };
  }

  const etab = etabData as {
    plan: string;
    billing_cycle: string;
    max_utilisateurs: number;
    max_produits: number;
    max_ventes_mois: number;
    max_etablissements: number;
  };

  // Recuperer l'abonnement actif depuis la table abonnements
  const { data: aboData } = await supabase
    .from("abonnements" as never)
    .select("statut, date_debut, date_fin, stripe_subscription_id, billing_cycle")
    .eq("etablissement_id", user.etablissementId)
    .in("statut", ["actif", "en_essai"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const abonnement = aboData as {
    statut: string;
    date_debut: string;
    date_fin: string | null;
    stripe_subscription_id: string | null;
    billing_cycle: string;
  } | null;

  // Compter l'utilisation actuelle
  const [utilisateurs, produits, ventesMois] = await Promise.all([
    supabase
      .from("utilisateurs")
      .select("id", { count: "exact", head: true })
      .eq("etablissement_id", user.etablissementId)
      .eq("actif", true),
    supabase
      .from("produits")
      .select("id", { count: "exact", head: true })
      .eq("etablissement_id", user.etablissementId),
    (() => {
      const now = new Date();
      const debutMois = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      ).toISOString();
      return supabase
        .from("ventes")
        .select("id", { count: "exact", head: true })
        .eq("etablissement_id", user.etablissementId)
        .gte("created_at", debutMois);
    })(),
  ]);

  return {
    success: true,
    data: {
      plan: etab.plan,
      billingCycle: (etab.billing_cycle ?? "mensuel") as BillingCycle,
      status: abonnement?.statut ?? "actif",
      dateDebut: abonnement?.date_debut ?? null,
      dateFin: abonnement?.date_fin ?? null,
      stripeSubscriptionId: abonnement?.stripe_subscription_id ?? null,
      quotas: {
        utilisateurs: {
          actuel: utilisateurs.count ?? 0,
          max: etab.max_utilisateurs,
        },
        produits: {
          actuel: produits.count ?? 0,
          max: etab.max_produits,
        },
        ventesMois: {
          actuel: ventesMois.count ?? 0,
          max: etab.max_ventes_mois,
        },
      },
    },
  };
}

// ============================================================================
// UPGRADE PLAN
// ============================================================================

/**
 * Prepare un upgrade de plan.
 *
 * Ne fait pas le paiement directement. Retourne les informations
 * necessaires pour que le frontend initie le paiement via initiatePayment().
 */
export async function upgradePlan(
  newPlan: string,
  billingCycle: BillingCycle,
  paymentMethod: SubscriptionPaymentProvider
): Promise<ActionResult<{ requiresPayment: boolean; amount: number }>> {
  const user = await requireAnyRole(["ADMIN", "SUPER_ADMIN"]);
  if (!user.etablissementId)
    return { success: false, error: "Aucun etablissement associe" };

  // Verifier que le plan existe
  if (!PLAN_SLUGS.includes(newPlan as PlanSlug)) {
    return { success: false, error: `Plan "${newPlan}" inconnu` };
  }

  const newPlanSlug = newPlan as PlanSlug;

  // Verifier que c'est bien un upgrade
  const supabase = await createClient();
  const { data: etab } = await supabase
    .from("etablissements")
    .select("plan")
    .eq("id", user.etablissementId)
    .single();

  const currentPlan = resolvePlanSlug(
    (etab as { plan: string } | null)?.plan ?? "essentiel"
  );

  if (!canUpgrade(currentPlan, newPlanSlug)) {
    return {
      success: false,
      error: `Le plan "${newPlan}" n'est pas un upgrade par rapport a "${currentPlan}"`,
    };
  }

  // Plans speciaux
  if (PLANS[newPlanSlug].pricing.sur_devis) {
    return {
      success: false,
      error: "Le plan Enterprise est sur devis. Contactez-nous.",
    };
  }

  const amount = PLANS[newPlanSlug].pricing[billingCycle];

  return {
    success: true,
    data: { requiresPayment: amount > 0, amount },
  };
}

// ============================================================================
// DOWNGRADE PLAN
// ============================================================================

/**
 * Downgrade vers un plan inferieur.
 *
 * Le downgrade est effectif immediatement pour le plan gratuit,
 * ou a la fin de la periode pour un plan paye.
 */
export async function downgradePlan(
  newPlan: string
): Promise<ActionResult<{ effectiveDate: string }>> {
  const user = await requireAnyRole(["ADMIN", "SUPER_ADMIN"]);
  if (!user.etablissementId)
    return { success: false, error: "Aucun etablissement associe" };

  if (!PLAN_SLUGS.includes(newPlan as PlanSlug)) {
    return { success: false, error: `Plan "${newPlan}" inconnu` };
  }

  const newPlanSlug = newPlan as PlanSlug;

  // createClient pour les lectures, createServiceClient pour les ecritures admin
  const supabase = await createClient();
  const adminClient = createServiceClient();

  // Recuperer les infos de l'etablissement
  const { data: etabData } = await supabase
    .from("etablissements")
    .select("plan, stripe_customer_id")
    .eq("id", user.etablissementId)
    .single();

  const currentEtab = etabData as {
    plan: string;
    stripe_customer_id: string | null;
  } | null;

  if (!currentEtab) {
    return { success: false, error: "Établissement non trouvé" };
  }

  const currentPlanSlug = resolvePlanSlug(currentEtab.plan);

  if (!canDowngrade(currentPlanSlug, newPlanSlug)) {
    return {
      success: false,
      error: `Le plan "${newPlan}" n'est pas un downgrade`,
    };
  }

  // Recuperer l'abonnement actif
  const { data: aboData } = await supabase
    .from("abonnements" as never)
    .select("id, date_fin, stripe_subscription_id")
    .eq("etablissement_id", user.etablissementId)
    .in("statut", ["actif", "en_essai"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const abonnement = aboData as {
    id: string;
    date_fin: string | null;
    stripe_subscription_id: string | null;
  } | null;

  // Verifier les quotas actuels par rapport au nouveau plan
  const newQuotas = getPlanQuotas(newPlanSlug);
  const [utilisateurs, produits] = await Promise.all([
    supabase
      .from("utilisateurs")
      .select("id", { count: "exact", head: true })
      .eq("etablissement_id", user.etablissementId)
      .eq("actif", true),
    supabase
      .from("produits")
      .select("id", { count: "exact", head: true })
      .eq("etablissement_id", user.etablissementId),
  ]);

  const nbUsers = utilisateurs.count ?? 0;
  const nbProduits = produits.count ?? 0;

  if (nbUsers > newQuotas.max_utilisateurs) {
    return {
      success: false,
      error: `Vous avez ${nbUsers} utilisateurs actifs, mais le plan "${newPlan}" n'en autorise que ${newQuotas.max_utilisateurs}. Desactivez des utilisateurs avant de changer de plan.`,
    };
  }

  if (nbProduits > newQuotas.max_produits) {
    return {
      success: false,
      error: `Vous avez ${nbProduits} produits, mais le plan "${newPlan}" n'en autorise que ${newQuotas.max_produits}. Supprimez des produits avant de changer de plan.`,
    };
  }

  // Si Stripe, annuler l'abonnement a la fin de la periode
  if (abonnement?.stripe_subscription_id) {
    try {
      await cancelStripeSubscription(
        abonnement.stripe_subscription_id,
        false
      );
    } catch (error) {
      console.error("[Subscriptions] Erreur annulation Stripe:", error);
    }
  }

  // Determiner la date effective
  let effectiveDate: string;
  if (newPlan === "essentiel" && !abonnement?.date_fin) {
    // Downgrade immediat vers gratuit si pas de periode active
    effectiveDate = new Date().toISOString();

    await adminClient
      .from("etablissements")
      .update({
        plan: newPlan,
        max_utilisateurs: newQuotas.max_utilisateurs,
        max_produits: newQuotas.max_produits,
        max_ventes_mois: newQuotas.max_ventes_mois,
        max_etablissements: newQuotas.max_etablissements,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", user.etablissementId);

    // Mettre a jour l'abonnement
    if (abonnement) {
      await adminClient
        .from("abonnements" as never)
        .update({
          plan: newPlan,
          statut: "actif",
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", abonnement.id);
    }
  } else {
    // Downgrade a la fin de la periode
    effectiveDate = abonnement?.date_fin ?? new Date().toISOString();

    // L'abonnement Stripe est deja annule a la fin de la periode (ci-dessus).
    // Le webhook subscription.deleted appliquera le downgrade automatiquement.
  }

  // Audit log
  await adminClient.from("audit_logs").insert({
    etablissement_id: user.etablissementId,
    utilisateur_id: user.userId,
    action: "DOWNGRADE_PLAN",
    entite: "abonnement",
    entite_id: user.etablissementId,
    description: `Downgrade de ${currentEtab.plan} vers ${newPlan}`,
    ancienne_valeur: JSON.stringify({ plan: currentEtab.plan }),
    nouvelle_valeur: JSON.stringify({ plan: newPlan }),
    created_at: new Date().toISOString(),
  } as never);

  return {
    success: true,
    data: { effectiveDate },
  };
}

// ============================================================================
// CANCEL SUBSCRIPTION
// ============================================================================

/**
 * Annule l'abonnement en cours.
 * L'abonnement reste actif jusqu'a la fin de la periode payee,
 * puis bascule sur le plan Essentiel (gratuit).
 */
export async function cancelSubscription(): Promise<ActionResult> {
  const user = await requireAnyRole(["ADMIN", "SUPER_ADMIN"]);
  if (!user.etablissementId)
    return { success: false, error: "Aucun etablissement associe" };

  const supabase = await createClient();
  const adminClient = createServiceClient();

  // Recuperer le plan actuel
  const { data: etabData } = await supabase
    .from("etablissements")
    .select("plan")
    .eq("id", user.etablissementId)
    .single();

  const currentEtab = etabData as { plan: string } | null;

  if (!currentEtab) {
    return { success: false, error: "Établissement non trouvé" };
  }

  if (currentEtab.plan === "essentiel") {
    return { success: false, error: "Vous êtes déjà sur le plan gratuit" };
  }

  // Recuperer l'abonnement actif
  const { data: aboData } = await supabase
    .from("abonnements" as never)
    .select("id, stripe_subscription_id")
    .eq("etablissement_id", user.etablissementId)
    .in("statut", ["actif", "en_essai"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const abonnement = aboData as {
    id: string;
    stripe_subscription_id: string | null;
  } | null;

  // Si Stripe, annuler l'abonnement a la fin de la periode
  if (abonnement?.stripe_subscription_id) {
    try {
      await cancelStripeSubscription(
        abonnement.stripe_subscription_id,
        false
      );
    } catch (error) {
      console.error("[Subscriptions] Erreur annulation Stripe:", error);
      return {
        success: false,
        error: "Erreur lors de l'annulation de l'abonnement Stripe",
      };
    }
  }

  // Marquer l'abonnement comme annule dans la table abonnements
  if (abonnement) {
    await adminClient
      .from("abonnements" as never)
      .update({
        statut: "annule",
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", abonnement.id);
  }

  // Audit log
  await adminClient.from("audit_logs").insert({
    etablissement_id: user.etablissementId,
    utilisateur_id: user.userId,
    action: "CANCEL_SUBSCRIPTION",
    entite: "abonnement",
    entite_id: user.etablissementId,
    description: `Annulation de l'abonnement ${currentEtab.plan}`,
    ancienne_valeur: JSON.stringify({ plan: currentEtab.plan }),
    nouvelle_valeur: JSON.stringify({ plan: "essentiel" }),
    created_at: new Date().toISOString(),
  } as never);

  return { success: true };
}

// ============================================================================
// REACTIVATE SUBSCRIPTION
// ============================================================================

/**
 * Reactive un abonnement annule (avant la fin de la periode).
 */
export async function reactivateSubscription(): Promise<ActionResult> {
  const user = await requireAnyRole(["ADMIN", "SUPER_ADMIN"]);
  if (!user.etablissementId)
    return { success: false, error: "Aucun etablissement associe" };

  const supabase = await createClient();
  const adminClient = createServiceClient();

  // Recuperer le dernier abonnement annule
  const { data: aboData } = await supabase
    .from("abonnements" as never)
    .select("id, date_fin, stripe_subscription_id, statut")
    .eq("etablissement_id", user.etablissementId)
    .eq("statut", "annule")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  const abonnement = aboData as {
    id: string;
    date_fin: string | null;
    stripe_subscription_id: string | null;
    statut: string;
  } | null;

  if (!abonnement) {
    return { success: false, error: "Aucun abonnement annule a reactiver" };
  }

  // Verifier que la periode n'est pas deja terminee
  if (abonnement.date_fin && new Date() > new Date(abonnement.date_fin)) {
    return {
      success: false,
      error: "La période d'abonnement est terminée. Veuillez souscrire à nouveau.",
    };
  }

  // Si Stripe, reactiver
  if (abonnement.stripe_subscription_id) {
    try {
      await reactivateStripeSubscription(abonnement.stripe_subscription_id);
    } catch (error) {
      console.error("[Subscriptions] Erreur reactivation Stripe:", error);
      return {
        success: false,
        error: "Erreur lors de la reactivation de l'abonnement Stripe",
      };
    }
  }

  // Mettre a jour en DB (ecriture admin)
  await adminClient
    .from("abonnements" as never)
    .update({
      statut: "actif",
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", abonnement.id);

  return { success: true };
}

// ============================================================================
// STRIPE CUSTOMER PORTAL
// ============================================================================

/**
 * Cree une session Stripe Customer Portal pour que le client
 * puisse gerer son abonnement (carte, factures, annulation).
 */
export async function getCustomerPortalUrl(): Promise<
  ActionResult<{ url: string }>
> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Non authentifie" };
  if (!user.etablissementId)
    return { success: false, error: "Aucun etablissement associe" };

  const supabase = await createClient();

  const { data: etabData } = await supabase
    .from("etablissements")
    .select("stripe_customer_id")
    .eq("id", user.etablissementId)
    .single();

  const currentEtab = etabData as {
    stripe_customer_id: string | null;
  } | null;

  if (!currentEtab?.stripe_customer_id) {
    return {
      success: false,
      error: "Aucun compte Stripe associe a cet etablissement",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const result = await createStripeCustomerPortalSession({
    customerId: currentEtab.stripe_customer_id,
    returnUrl: `${baseUrl}/parametres/abonnement`,
  });

  if (!result.url) {
    return {
      success: false,
      error: result.error ?? "Erreur création portail Stripe",
    };
  }

  return { success: true, data: { url: result.url } };
}
