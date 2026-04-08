/**
 * Enforcement des quotas de plan côté serveur
 *
 * Helper centralisé pour vérifier les limites de quotas (produits, utilisateurs, ventes)
 * et l'accès aux features selon le plan de l'établissement.
 *
 * Les limites max viennent de la DB (colonnes max_*) car l'admin peut les overrider.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PLANS,
  PLAN_SLUGS,
  resolvePlanSlug,
  type PlanSlug,
  type PlanFeatures,
} from "@/lib/config/plans";

// ============================================================================
// TYPES
// ============================================================================

export interface QuotaCheck {
  allowed: boolean;
  current: number;
  max: number;
  message?: string;
}

export interface FeatureCheck {
  allowed: boolean;
  requiredPlan: string;
  message?: string;
}

/** Options pour bypass les vérifications (SUPER_ADMIN) */
export interface EnforcementOptions {
  userRole?: string;
}

const BYPASS_QUOTA: QuotaCheck = { allowed: true, current: 0, max: Infinity };
const BYPASS_FEATURE: FeatureCheck = { allowed: true, requiredPlan: "" };

function isSuperAdmin(options?: EnforcementOptions): boolean {
  return options?.userRole === "SUPER_ADMIN";
}

// ============================================================================
// HELPERS INTERNES
// ============================================================================

const FEATURE_LABELS: Record<keyof PlanFeatures, string> = {
  tables_salle: "Gestion des tables",
  multi_imprimantes: "Multi-imprimantes",
  stocks_avances: "Stocks avancés",
  mode_hors_ligne: "Mode hors-ligne complet",
  rapports: "Rapports avancés",
  mobile_money: "Mobile Money",
  support: "Support avancé",
};

interface EtablissementQuotas {
  plan: string;
  max_produits: number;
  max_utilisateurs: number;
  max_ventes_mois: number;
}

/**
 * Récupère les quotas de l'établissement depuis la DB
 */
async function getEtablissementQuotas(
  supabase: SupabaseClient,
  etablissementId: string
): Promise<EtablissementQuotas> {
  const { data, error } = await supabase
    .from("etablissements")
    .select("plan, max_produits, max_utilisateurs, max_ventes_mois")
    .eq("id", etablissementId)
    .single();

  if (error || !data) {
    throw new Error("Impossible de récupérer les informations de l'établissement");
  }

  return data as EtablissementQuotas;
}

/**
 * Trouve le plan supérieur suivant dans l'ordre d'affichage
 */
function getNextPlan(currentSlug: string): string {
  const resolved = resolvePlanSlug(currentSlug);
  const currentOrder = PLANS[resolved].metadata.ordre_affichage;

  for (const slug of PLAN_SLUGS) {
    if (PLANS[slug].metadata.ordre_affichage > currentOrder) {
      return PLANS[slug].nom;
    }
  }

  return "Enterprise";
}

/**
 * Trouve le plan minimum requis pour une feature
 */
function getMinimumPlanForFeature(feature: keyof PlanFeatures): string {
  for (const slug of PLAN_SLUGS) {
    const value = PLANS[slug].features[feature];
    const enabled =
      typeof value === "boolean"
        ? value
        : value !== "basique" && value !== "email";
    if (enabled) {
      return PLANS[slug].nom;
    }
  }
  return "Enterprise";
}

// ============================================================================
// FONCTIONS PUBLIQUES
// ============================================================================

/**
 * Vérifie si on peut ajouter un produit.
 * Lit max_produits depuis etablissements et COUNT les produits existants.
 */
export async function checkProductQuota(
  supabase: SupabaseClient,
  etablissementId: string,
  options?: EnforcementOptions
): Promise<QuotaCheck> {
  if (isSuperAdmin(options)) return BYPASS_QUOTA;
  const etab = await getEtablissementQuotas(supabase, etablissementId);

  const { count, error } = await supabase
    .from("produits")
    .select("id", { count: "exact", head: true })
    .eq("etablissement_id", etablissementId);

  if (error) {
    throw new Error("Impossible de compter les produits");
  }

  const current = count ?? 0;
  const max = etab.max_produits;
  const planNom = PLANS[resolvePlanSlug(etab.plan)]?.nom ?? etab.plan;
  const nextPlan = getNextPlan(etab.plan);

  return {
    allowed: current < max,
    current,
    max,
    message:
      current >= max
        ? `Vous avez atteint la limite de ${max} produits sur le plan ${planNom}. Passez au plan ${nextPlan} pour en ajouter davantage.`
        : undefined,
  };
}

/**
 * Vérifie si on peut ajouter un utilisateur actif.
 * Lit max_utilisateurs et COUNT les utilisateurs actifs.
 */
export async function checkUserQuota(
  supabase: SupabaseClient,
  etablissementId: string,
  options?: EnforcementOptions
): Promise<QuotaCheck> {
  if (isSuperAdmin(options)) return BYPASS_QUOTA;
  const etab = await getEtablissementQuotas(supabase, etablissementId);

  const { count, error } = await supabase
    .from("utilisateurs")
    .select("id", { count: "exact", head: true })
    .eq("etablissement_id", etablissementId)
    .eq("actif", true);

  if (error) {
    throw new Error("Impossible de compter les utilisateurs");
  }

  const current = count ?? 0;
  const max = etab.max_utilisateurs;
  const planNom = PLANS[resolvePlanSlug(etab.plan)]?.nom ?? etab.plan;
  const nextPlan = getNextPlan(etab.plan);

  return {
    allowed: current < max,
    current,
    max,
    message:
      current >= max
        ? `Vous avez atteint la limite de ${max} utilisateurs actifs. Passez au plan ${nextPlan}.`
        : undefined,
  };
}

/**
 * Vérifie si on peut créer une vente ce mois.
 * Lit max_ventes_mois et COUNT les ventes du mois en cours.
 */
export async function checkSalesQuota(
  supabase: SupabaseClient,
  etablissementId: string,
  options?: EnforcementOptions
): Promise<QuotaCheck> {
  if (isSuperAdmin(options)) return BYPASS_QUOTA;
  const etab = await getEtablissementQuotas(supabase, etablissementId);

  const now = new Date();
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count, error } = await supabase
    .from("ventes")
    .select("id", { count: "exact", head: true })
    .eq("etablissement_id", etablissementId)
    .gte("created_at", debutMois);

  if (error) {
    throw new Error("Impossible de compter les ventes du mois");
  }

  const current = count ?? 0;
  const max = etab.max_ventes_mois;
  const planNom = PLANS[resolvePlanSlug(etab.plan)]?.nom ?? etab.plan;
  const nextPlan = getNextPlan(etab.plan);

  return {
    allowed: current < max,
    current,
    max,
    message:
      current >= max
        ? `Vous avez atteint la limite de ${max} ventes par mois. Passez au plan ${nextPlan}.`
        : undefined,
  };
}

/**
 * Vérifie si une feature est accessible pour cet établissement.
 * Lit le plan depuis etablissements puis vérifie dans PLANS[plan].features.
 */
export async function checkFeatureAccess(
  supabase: SupabaseClient,
  etablissementId: string,
  feature: keyof PlanFeatures,
  options?: EnforcementOptions
): Promise<FeatureCheck> {
  if (isSuperAdmin(options)) return BYPASS_FEATURE;
  const { data, error } = await supabase
    .from("etablissements")
    .select("plan")
    .eq("id", etablissementId)
    .single();

  if (error || !data) {
    throw new Error("Impossible de récupérer le plan de l'établissement");
  }

  const slug = resolvePlanSlug(data.plan);
  const featureValue = PLANS[slug].features[feature];
  const allowed =
    typeof featureValue === "boolean"
      ? featureValue
      : featureValue !== "basique" && featureValue !== "email";

  const requiredPlan = getMinimumPlanForFeature(feature);
  const featureLabel = FEATURE_LABELS[feature];

  return {
    allowed,
    requiredPlan,
    message: !allowed
      ? `La fonctionnalité ${featureLabel} nécessite le plan ${requiredPlan}.`
      : undefined,
  };
}
