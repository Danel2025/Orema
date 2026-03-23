/**
 * Schemas Zod pour le systeme d'abonnement et de facturation
 *
 * Importe les slugs et cycles depuis lib/config/plans.ts (source de verite).
 */

import { z } from "zod";
import { PLAN_SLUGS, BILLING_CYCLES } from "@/lib/config/plans";

// ============================================================================
// ENUMS REUTILISABLES
// ============================================================================

export const planSlugSchema = z.enum(
  PLAN_SLUGS as unknown as [string, ...string[]],
  { message: "Plan invalide" }
);

export const billingCycleSchema = z.enum(
  BILLING_CYCLES as unknown as [string, ...string[]],
  { message: "Cycle de facturation invalide" }
);

export const subscriptionStatusSchema = z.enum(
  ["actif", "en_essai", "expire", "annule", "suspendu"],
  { message: "Statut d'abonnement invalide" }
);

export const paymentMethodSchema = z.enum(
  ["stripe", "monetbil_airtel", "monetbil_moov", "virement", "especes", "gratuit"],
  { message: "Methode de paiement invalide" }
);

export const paymentStatusSchema = z.enum(
  ["en_attente", "reussi", "echoue", "rembourse"],
  { message: "Statut de paiement invalide" }
);

export const invoiceStatusSchema = z.enum(
  ["brouillon", "emise", "payee", "en_retard", "annulee"],
  { message: "Statut de facture invalide" }
);

// ============================================================================
// ABONNEMENT
// ============================================================================

export const createSubscriptionSchema = z.object({
  etablissement_id: z.string().uuid("ID d'etablissement invalide"),
  plan: planSlugSchema,
  billing_cycle: billingCycleSchema.default("mensuel"),
  methode_paiement: paymentMethodSchema.optional(),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;

export const updateSubscriptionSchema = z.object({
  plan: planSlugSchema.optional(),
  billing_cycle: billingCycleSchema.optional(),
  statut: subscriptionStatusSchema.optional(),
  // Overrides admin des quotas
  max_utilisateurs: z.coerce
    .number()
    .int()
    .min(1, "Au moins 1 utilisateur")
    .max(1000, "Maximum 1000 utilisateurs")
    .optional(),
  max_produits: z.coerce
    .number()
    .int()
    .min(10, "Au moins 10 produits")
    .max(100000, "Maximum 100 000 produits")
    .optional(),
  max_ventes_mois: z.coerce
    .number()
    .int()
    .min(100, "Au moins 100 ventes/mois")
    .max(10000000, "Maximum 10 000 000 ventes/mois")
    .optional(),
});

export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;

export const changeSubscriptionPlanSchema = z.object({
  nouveau_plan: planSlugSchema,
  billing_cycle: billingCycleSchema,
});

export type ChangeSubscriptionPlanInput = z.infer<typeof changeSubscriptionPlanSchema>;

// ============================================================================
// PAIEMENT
// ============================================================================

export const createPaymentSchema = z.object({
  etablissement_id: z.string().uuid("ID d'etablissement invalide"),
  montant: z.coerce
    .number()
    .int()
    .min(1, "Le montant doit etre superieur a 0"),
  methode: paymentMethodSchema,
  reference_externe: z
    .string()
    .max(255, "La reference ne peut pas depasser 255 caracteres")
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  periode_debut: z.string().datetime({ message: "Date de debut invalide" }),
  periode_fin: z.string().datetime({ message: "Date de fin invalide" }),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

// ============================================================================
// FACTURE
// ============================================================================

export const invoiceFilterSchema = z.object({
  etablissement_id: z.string().uuid().optional(),
  statut: z
    .enum(["all", "brouillon", "emise", "payee", "en_retard", "annulee"])
    .optional(),
  dateDebut: z.string().optional(),
  dateFin: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(5).max(100).optional().default(20),
});

export type InvoiceFilterInput = z.infer<typeof invoiceFilterSchema>;
