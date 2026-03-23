/**
 * Schémas de validation pour la gestion admin des établissements
 */

import { z } from "zod";
import {
  PLAN_SLUGS,
  PLAN_LABELS,
  type PlanSlug,
  PLANS as PLAN_CONFIG,
} from "@/lib/config/plans";

/**
 * Plans d'abonnement disponibles
 * Re-exporte depuis la source de verite lib/config/plans.ts
 */
export const PLANS = {
  ESSENTIEL: "essentiel",
  PRO: "pro",
  BUSINESS: "business",
  ENTERPRISE: "enterprise",
} as const;

export const planLabels: Record<string, string> = { ...PLAN_LABELS };

/**
 * Statuts d'établissement
 */
export const STATUTS_ETABLISSEMENT = {
  ACTIF: "actif",
  SUSPENDU: "suspendu",
  EN_ESSAI: "en_essai",
} as const;

export const statutLabels: Record<string, string> = {
  actif: "Actif",
  suspendu: "Suspendu",
  en_essai: "En essai",
};

/**
 * Schéma de création d'un établissement
 */
export const createEtablissementSchema = z.object({
  nom: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  adresse: z
    .string()
    .max(255, "L'adresse ne peut pas dépasser 255 caractères")
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  telephone: z
    .string()
    .min(8, "Le téléphone doit contenir au moins 8 caractères")
    .max(20, "Le téléphone ne peut pas dépasser 20 caractères"),
  email: z
    .string()
    .email("L'adresse email n'est pas valide")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val)),
  nif: z
    .string()
    .max(50, "Le NIF ne peut pas dépasser 50 caractères")
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  rccm: z
    .string()
    .max(50, "Le RCCM ne peut pas dépasser 50 caractères")
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  plan: z.enum(["essentiel", "pro", "business", "enterprise"]).default("essentiel"),
});

export type CreateEtablissementFormData = z.infer<typeof createEtablissementSchema>;

/**
 * Schéma pour les filtres de recherche
 */
export const etablissementFilterSchema = z.object({
  search: z.string().optional(),
  statut: z.enum(["all", "actif", "suspendu", "en_essai"]).optional(),
  plan: z.enum(["all", "essentiel", "pro", "business", "enterprise"]).optional(),
  sortBy: z
    .enum(["nom", "created_at", "chiffre_affaires", "nb_utilisateurs", "nb_ventes"])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(5).max(100).optional(),
});

export type EtablissementFilterData = z.infer<typeof etablissementFilterSchema>;

// ============================================================================
// MODIFICATION D'ÉTABLISSEMENT
// ============================================================================

export const updateEtablissementSchema = createEtablissementSchema
  .omit({ plan: true })
  .partial();

export type UpdateEtablissementFormData = z.infer<typeof updateEtablissementSchema>;

// ============================================================================
// SUSPENSION
// ============================================================================

export const suspendEtablissementSchema = z.object({
  motif: z
    .string()
    .min(5, "Le motif doit contenir au moins 5 caractères")
    .max(500, "Le motif ne peut pas dépasser 500 caractères"),
});

export type SuspendEtablissementInput = z.infer<typeof suspendEtablissementSchema>;

// ============================================================================
// ABONNEMENT / QUOTAS
// ============================================================================

export const updateAbonnementSchema = z.object({
  plan: z.enum(["essentiel", "pro", "business", "enterprise"], {
    message: "Plan invalide",
  }),
  max_utilisateurs: z.coerce
    .number()
    .int()
    .min(1, "Au moins 1 utilisateur")
    .max(1000, "Maximum 1000 utilisateurs"),
  max_produits: z.coerce
    .number()
    .int()
    .min(10, "Au moins 10 produits")
    .max(100000, "Maximum 100 000 produits"),
  max_ventes_mois: z.coerce
    .number()
    .int()
    .min(100, "Au moins 100 ventes/mois")
    .max(10000000, "Maximum 10 000 000 ventes/mois"),
});

export type UpdateAbonnementInput = z.infer<typeof updateAbonnementSchema>;

/** Quotas par defaut selon le plan - derives de la source de verite */
export const PLAN_QUOTAS = Object.fromEntries(
  PLAN_SLUGS.map((slug) => [
    slug,
    {
      max_utilisateurs: PLAN_CONFIG[slug].quotas.max_utilisateurs,
      max_produits: PLAN_CONFIG[slug].quotas.max_produits,
      max_ventes_mois: PLAN_CONFIG[slug].quotas.max_ventes_mois,
    },
  ])
) as Record<PlanSlug, { max_utilisateurs: number; max_produits: number; max_ventes_mois: number }>;

// ============================================================================
// FACTURE
// ============================================================================

export const createFactureSchema = z.object({
  montant: z.coerce
    .number()
    .int()
    .min(1, "Le montant doit être supérieur à 0"),
  notes: z
    .string()
    .max(500, "Les notes ne peuvent pas dépasser 500 caractères")
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  date_echeance: z.string().optional(),
});

export type CreateFactureInput = z.infer<typeof createFactureSchema>;

export const factureFilterSchema = z.object({
  statut: z.enum(["all", "en_attente", "payee", "en_retard"]).optional(),
  dateDebut: z.string().optional(),
  dateFin: z.string().optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(5).max(100).optional(),
});

export type FactureFilterData = z.infer<typeof factureFilterSchema>;

// ============================================================================
// BULK SETTINGS
// ============================================================================

export const bulkSettingsSchema = z.object({
  etablissement_ids: z
    .array(z.string().uuid("ID d'établissement invalide"))
    .min(1, "Sélectionnez au moins un établissement"),
  settings: z
    .object({
      taux_tva_standard: z.coerce.number().min(0).max(100).optional(),
      taux_tva_reduit: z.coerce.number().min(0).max(100).optional(),
      modes_paiement_actifs: z.array(z.string()).optional(),
      longueur_pin_minimum: z.coerce.number().int().min(4).max(8).optional(),
      tentatives_login_max: z.coerce.number().int().min(1).max(10).optional(),
      session_timeout: z.coerce.number().int().min(5).max(480).optional(),
    })
    .refine((data) => Object.values(data).some((v) => v !== undefined), {
      message: "Au moins un paramètre doit être spécifié",
    }),
});

export type BulkSettingsInput = z.infer<typeof bulkSettingsSchema>;

export const bulkSuspendSchema = z.object({
  etablissement_ids: z
    .array(z.string().uuid("ID d'établissement invalide"))
    .min(1, "Sélectionnez au moins un établissement"),
  motif: z
    .string()
    .min(5, "Le motif doit contenir au moins 5 caractères")
    .max(500, "Le motif ne peut pas dépasser 500 caractères"),
});

export type BulkSuspendInput = z.infer<typeof bulkSuspendSchema>;

export const bulkReactivateSchema = z.object({
  etablissement_ids: z
    .array(z.string().uuid("ID d'établissement invalide"))
    .min(1, "Sélectionnez au moins un établissement"),
});

export type BulkReactivateInput = z.infer<typeof bulkReactivateSchema>;

// ============================================================================
// AUDIT FILTERS
// ============================================================================

export const auditFiltersSchema = z.object({
  action: z.string().optional(),
  entite: z.string().optional(),
  utilisateur_id: z.string().optional(),
  dateDebut: z.string().optional(),
  dateFin: z.string().optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(5).max(100).optional(),
});

export type AuditFiltersInput = z.infer<typeof auditFiltersSchema>;

// ============================================================================
// EXPORT
// ============================================================================

export const exportDataSchema = z.object({
  format: z.enum(["csv", "json"], {
    message: "Format invalide (csv ou json)",
  }),
  sections: z
    .array(z.enum(["produits", "ventes", "clients", "utilisateurs"]))
    .min(1, "Sélectionnez au moins une section"),
});

export type ExportDataInput = z.infer<typeof exportDataSchema>;

// ============================================================================
// NOTIFICATION ADMIN
// ============================================================================

export const createAlertSchema = z.object({
  type: z.enum(["INFO", "WARNING", "ERROR", "SUCCESS"]),
  titre: z
    .string()
    .min(2, "Le titre doit contenir au moins 2 caractères")
    .max(200, "Le titre ne peut pas dépasser 200 caractères"),
  message: z
    .string()
    .min(2, "Le message doit contenir au moins 2 caractères")
    .max(1000, "Le message ne peut pas dépasser 1000 caractères"),
  etablissement_id: z.string().uuid().optional(),
});

export type CreateAlertInput = z.infer<typeof createAlertSchema>;
