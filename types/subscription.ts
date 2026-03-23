/**
 * Types TypeScript pour le systeme d'abonnement et de facturation
 *
 * Importe les types de base depuis lib/config/plans.ts (source de verite).
 */

import type { PlanSlug, BillingCycle } from "@/lib/config/plans";

// ============================================================================
// STATUTS
// ============================================================================

export type SubscriptionStatus = "actif" | "en_essai" | "expire" | "annule" | "suspendu";

export type PaymentStatus = "en_attente" | "reussi" | "echoue" | "rembourse";

export type PaymentMethod =
  | "stripe"
  | "monetbil_airtel"
  | "monetbil_moov"
  | "virement"
  | "especes"
  | "gratuit";

export type InvoiceStatus = "brouillon" | "emise" | "payee" | "en_retard" | "annulee";

// ============================================================================
// ABONNEMENT
// ============================================================================

export interface Subscription {
  id: string;
  etablissement_id: string;
  plan: PlanSlug;
  billing_cycle: BillingCycle;
  statut: SubscriptionStatus;
  date_debut: string;
  date_fin: string | null;
  date_essai_fin: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  monetbil_service_key: string | null;
  // Quotas (peuvent etre overrides par le super admin)
  max_utilisateurs: number;
  max_produits: number;
  max_ventes_mois: number;
  max_etablissements: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PAIEMENT ABONNEMENT
// ============================================================================

export interface SubscriptionPayment {
  id: string;
  etablissement_id: string;
  montant: number;
  devise: string; // XAF
  methode: PaymentMethod;
  statut: PaymentStatus;
  reference_externe: string | null;
  provider_payload: Record<string, unknown> | null;
  periode_debut: string;
  periode_fin: string;
  created_at: string;
}

// ============================================================================
// FACTURE ABONNEMENT
// ============================================================================

export interface SubscriptionInvoice {
  id: string;
  etablissement_id: string;
  numero: string; // ex: FAC-2026-00001
  periode_debut: string;
  periode_fin: string;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  statut: InvoiceStatus;
  pdf_url: string | null;
  date_echeance: string;
  date_paiement: string | null;
  created_at: string;
}

// ============================================================================
// TYPES UTILITAIRES
// ============================================================================

export interface SubscriptionWithDetails extends Subscription {
  etablissement_nom?: string;
  derniere_facture?: SubscriptionInvoice | null;
  dernier_paiement?: SubscriptionPayment | null;
}

export interface BillingOverview {
  abonnement: Subscription;
  factures_recentes: SubscriptionInvoice[];
  paiements_recents: SubscriptionPayment[];
  prochain_paiement: {
    montant: number;
    date: string;
    methode: PaymentMethod;
  } | null;
}
