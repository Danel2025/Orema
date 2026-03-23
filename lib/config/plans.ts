/**
 * Configuration centralisee des plans tarifaires Orema N+
 *
 * SOURCE DE VERITE UNIQUE pour tous les plans, quotas, features et prix.
 * Tous les autres fichiers (schemas, composants, migrations) doivent
 * importer depuis ce fichier.
 */

// ============================================================================
// TYPES
// ============================================================================

export const PLAN_SLUGS = ["essentiel", "pro", "business", "enterprise"] as const;
export type PlanSlug = (typeof PLAN_SLUGS)[number];

export const BILLING_CYCLES = ["mensuel", "annuel"] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

export interface PlanQuotas {
  max_utilisateurs: number;
  max_produits: number;
  max_ventes_mois: number;
  max_etablissements: number;
}

export interface PlanFeatures {
  tables_salle: boolean;
  multi_imprimantes: boolean;
  stocks_avances: boolean;
  mode_hors_ligne: "basique" | "complet";
  rapports: "basique" | "complets" | "complets_export" | "personnalises";
  mobile_money: boolean;
  support: "email" | "prioritaire" | "telephone" | "dedie_24_7";
}

export interface PlanPricing {
  mensuel: number; // FCFA par mois
  annuel: number; // FCFA par an
  sur_devis: boolean;
}

export interface PlanMetadata {
  essai_gratuit_jours: number; // 0 = pas d'essai
  ordre_affichage: number;
  badge?: string; // ex: "Populaire"
  description: string;
}

export interface PlanConfig {
  slug: PlanSlug;
  nom: string;
  pricing: PlanPricing;
  quotas: PlanQuotas;
  features: PlanFeatures;
  metadata: PlanMetadata;
}

// ============================================================================
// CONFIGURATION DES PLANS
// ============================================================================

export const PLANS: Record<PlanSlug, PlanConfig> = {
  essentiel: {
    slug: "essentiel",
    nom: "Essentiel",
    pricing: {
      mensuel: 0,
      annuel: 0,
      sur_devis: false,
    },
    quotas: {
      max_utilisateurs: 2,
      max_produits: 50,
      max_ventes_mois: 500,
      max_etablissements: 1,
    },
    features: {
      tables_salle: false,
      multi_imprimantes: false,
      stocks_avances: false,
      mode_hors_ligne: "basique",
      rapports: "basique",
      mobile_money: false,
      support: "email",
    },
    metadata: {
      essai_gratuit_jours: 0,
      ordre_affichage: 1,
      description: "Pour demarrer gratuitement avec les fonctionnalites de base",
    },
  },

  pro: {
    slug: "pro",
    nom: "Pro",
    pricing: {
      mensuel: 7_500,
      annuel: 75_000,
      sur_devis: false,
    },
    quotas: {
      max_utilisateurs: 5,
      max_produits: 500,
      max_ventes_mois: 5_000,
      max_etablissements: 1,
    },
    features: {
      tables_salle: true,
      multi_imprimantes: true,
      stocks_avances: true,
      mode_hors_ligne: "complet",
      rapports: "complets",
      mobile_money: true,
      support: "prioritaire",
    },
    metadata: {
      essai_gratuit_jours: 14,
      ordre_affichage: 2,
      badge: "Populaire",
      description: "Pour les commerces en croissance avec toutes les fonctionnalites",
    },
  },

  business: {
    slug: "business",
    nom: "Business",
    pricing: {
      mensuel: 22_500,
      annuel: 225_000,
      sur_devis: false,
    },
    quotas: {
      max_utilisateurs: 20,
      max_produits: 5_000,
      max_ventes_mois: 50_000,
      max_etablissements: 3,
    },
    features: {
      tables_salle: true,
      multi_imprimantes: true,
      stocks_avances: true,
      mode_hors_ligne: "complet",
      rapports: "complets_export",
      mobile_money: true,
      support: "telephone",
    },
    metadata: {
      essai_gratuit_jours: 14,
      ordre_affichage: 3,
      description: "Pour les entreprises multi-sites avec besoins avances",
    },
  },

  enterprise: {
    slug: "enterprise",
    nom: "Enterprise",
    pricing: {
      mensuel: 0,
      annuel: 0,
      sur_devis: true,
    },
    quotas: {
      max_utilisateurs: 1_000,
      max_produits: 100_000,
      max_ventes_mois: 10_000_000,
      max_etablissements: 999,
    },
    features: {
      tables_salle: true,
      multi_imprimantes: true,
      stocks_avances: true,
      mode_hors_ligne: "complet",
      rapports: "personnalises",
      mobile_money: true,
      support: "dedie_24_7",
    },
    metadata: {
      essai_gratuit_jours: 0,
      ordre_affichage: 4,
      description: "Solution sur mesure pour les grands groupes et franchises",
    },
  },
} as const;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Recupere la config d'un plan par son slug
 */
export function getPlanBySlug(slug: PlanSlug): PlanConfig {
  return PLANS[slug];
}

/**
 * Recupere le prix d'un plan selon le cycle de facturation
 */
export function getPlanPrice(slug: PlanSlug, cycle: BillingCycle): number {
  return PLANS[slug].pricing[cycle];
}

/**
 * Recupere le prix mensuel effectif (annuel divise par 12 si annuel)
 */
export function getPlanMonthlyPrice(slug: PlanSlug, cycle: BillingCycle): number {
  if (cycle === "annuel") {
    return Math.round(PLANS[slug].pricing.annuel / 12);
  }
  return PLANS[slug].pricing.mensuel;
}

/**
 * Calcule l'economie annuelle entre mensuel et annuel
 */
export function getAnnualSavings(slug: PlanSlug): number {
  const plan = PLANS[slug];
  if (!plan || plan.pricing.sur_devis) return 0;
  return plan.pricing.mensuel * 12 - plan.pricing.annuel;
}

/**
 * Verifie si une feature est activee pour un plan
 */
export function isPlanFeatureEnabled(
  slug: PlanSlug,
  feature: keyof PlanFeatures
): boolean {
  const value = PLANS[slug].features[feature];
  if (typeof value === "boolean") return value;
  // Pour les features a valeurs (mode_hors_ligne, rapports, support)
  // toute valeur non-"basique" est consideree comme "activee"
  return value !== "basique" && value !== "email";
}

/**
 * Recupere les quotas d'un plan
 */
export function getPlanQuotas(slug: PlanSlug): PlanQuotas {
  return PLANS[slug].quotas;
}

/**
 * Verifie si un plan est gratuit
 */
export function isPlanFree(slug: PlanSlug): boolean {
  const plan = PLANS[slug];
  return plan.pricing.mensuel === 0 && !plan.pricing.sur_devis;
}

/**
 * Verifie si un plan a un essai gratuit
 */
export function hasTrial(slug: PlanSlug): boolean {
  return PLANS[slug].metadata.essai_gratuit_jours > 0;
}

/**
 * Retourne la liste ordonnee des plans pour l'affichage
 */
export function getOrderedPlans(): PlanConfig[] {
  return Object.values(PLANS).sort(
    (a, b) => a.metadata.ordre_affichage - b.metadata.ordre_affichage
  );
}

/**
 * Verifie si un upgrade est possible entre deux plans
 */
export function canUpgrade(from: PlanSlug, to: PlanSlug): boolean {
  return (
    PLANS[from].metadata.ordre_affichage < PLANS[to].metadata.ordre_affichage
  );
}

/**
 * Verifie si un downgrade est possible entre deux plans
 */
export function canDowngrade(from: PlanSlug, to: PlanSlug): boolean {
  return (
    PLANS[from].metadata.ordre_affichage > PLANS[to].metadata.ordre_affichage
  );
}

/**
 * Mapping des anciens slugs vers les nouveaux (pour migrations)
 */
export const LEGACY_PLAN_MAPPING: Record<string, PlanSlug> = {
  gratuit: "essentiel",
  starter: "pro",
  pro: "pro",
  enterprise: "enterprise",
};

/**
 * Resout un slug (potentiellement legacy) vers le slug actuel
 */
export function resolvePlanSlug(slug: string): PlanSlug {
  if (PLAN_SLUGS.includes(slug as PlanSlug)) {
    return slug as PlanSlug;
  }
  return LEGACY_PLAN_MAPPING[slug] ?? "essentiel";
}

/**
 * Labels pour l'affichage des plans
 */
export const PLAN_LABELS: Record<PlanSlug, string> = {
  essentiel: "Essentiel",
  pro: "Pro",
  business: "Business",
  enterprise: "Enterprise",
};

/**
 * Labels pour l'affichage des cycles de facturation
 */
export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  mensuel: "Mensuel",
  annuel: "Annuel",
};
