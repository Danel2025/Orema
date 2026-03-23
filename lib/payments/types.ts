/**
 * Types communs pour les integrations de paiement (abonnements)
 *
 * Monetbil (Airtel Money Gabon) et Stripe (cartes bancaires)
 */

// ============================================================================
// PAYMENT PROVIDERS
// ============================================================================

// BillingCycle re-exporte depuis la source de verite lib/config/plans.ts
import type { BillingCycle } from "@/lib/config/plans";

export type SubscriptionPaymentProvider = "monetbil" | "stripe";
export type { BillingCycle };

// ============================================================================
// PAYMENT INTENT
// ============================================================================

export interface PaymentIntent {
  /** ID unique interne */
  id: string;
  /** Provider de paiement */
  provider: SubscriptionPaymentProvider;
  /** Slug du plan (essentiel, pro, business, enterprise) */
  planSlug: string;
  /** Cycle de facturation */
  billingCycle: BillingCycle;
  /** Montant en FCFA (sans decimales) */
  amount: number;
  /** ID de l'etablissement */
  etablissementId: string;
  /** URL de redirection apres paiement reussi */
  successUrl?: string;
  /** URL de redirection apres annulation */
  cancelUrl?: string;
  /** Metadata supplementaire */
  metadata?: Record<string, string>;
}

// ============================================================================
// PAYMENT RESULT
// ============================================================================

export interface PaymentResult {
  success: boolean;
  /** URL de paiement (redirection ou widget) */
  paymentUrl?: string;
  /** ID de la session/transaction chez le provider */
  providerSessionId?: string;
  /** Reference interne */
  referenceInterne?: string;
  error?: string;
}

// ============================================================================
// WEBHOOK EVENT
// ============================================================================

export interface WebhookEvent {
  /** Provider source */
  provider: SubscriptionPaymentProvider;
  /** Type d'evenement */
  type: WebhookEventType;
  /** ID de la transaction chez le provider */
  providerTransactionId: string;
  /** Reference interne (notre reference) */
  referenceInterne?: string;
  /** Montant en FCFA */
  amount?: number;
  /** Statut du paiement */
  status: ProviderPaymentStatus;
  /** Donnees brutes du webhook */
  rawData: Record<string, unknown>;
}

export type WebhookEventType =
  | "payment.success"
  | "payment.failed"
  | "payment.cancelled"
  | "subscription.created"
  | "subscription.updated"
  | "subscription.deleted"
  | "invoice.paid"
  | "invoice.payment_failed";

/**
 * Statut de paiement cote provider (Monetbil/Stripe).
 * Distinct du PaymentStatus defini dans types/subscription.ts
 * qui represente le statut interne en DB (en_attente, reussi, echoue, rembourse).
 */
export type ProviderPaymentStatus =
  | "pending"
  | "success"
  | "failed"
  | "cancelled"
  | "expired";

// ============================================================================
// SUBSCRIPTION PAYMENT
// ============================================================================

export interface SubscriptionPayment {
  id: string;
  etablissement_id: string;
  provider: SubscriptionPaymentProvider;
  provider_subscription_id: string | null;
  provider_customer_id: string | null;
  plan_slug: string;
  billing_cycle: BillingCycle;
  amount: number;
  status: SubscriptionPaymentStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export type SubscriptionPaymentStatus =
  | "active"
  | "past_due"
  | "cancelled"
  | "trialing"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid";

// ============================================================================
// INVOICE
// ============================================================================

export interface Invoice {
  id: string;
  etablissement_id: string;
  provider: SubscriptionPaymentProvider;
  provider_invoice_id: string | null;
  amount: number;
  status: InvoiceStatus;
  plan_slug: string;
  billing_cycle: BillingCycle;
  payment_method: string | null;
  phone?: string | null;
  paid_at: string | null;
  created_at: string;
}

export type InvoiceStatus = "draft" | "open" | "paid" | "void" | "uncollectible";

// ============================================================================
// MONETBIL-SPECIFIC
// ============================================================================

export interface MonetbilPaymentParams {
  amount: number;
  phone?: string;
  description?: string;
  returnUrl: string;
  notifyUrl: string;
  /** Reference interne pour tracking */
  paymentRef: string;
  /** Email du client (optionnel) */
  email?: string;
  /** Nom du client (optionnel) */
  firstName?: string;
  lastName?: string;
}

export interface MonetbilPaymentResponse {
  payment_url: string;
}

export interface MonetbilCheckPaymentResponse {
  payment_ref: string;
  status: "success" | "failed" | "cancelled";
  amount: string;
  phone: string;
  transaction_id: string;
  message?: string;
}

export interface MonetbilWebhookPayload {
  service: string;
  transaction_id: string;
  payment_ref: string;
  phone_lock: string;
  status: "success" | "failed" | "cancelled";
  amount: string;
  fee: string;
  phone: string;
  message: string;
  country_name: string;
  country_iso: string;
  currency: string;
  operator: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  item_ref?: string;
}

// ============================================================================
// STRIPE-SPECIFIC
// ============================================================================

export interface StripeCheckoutParams {
  planSlug: string;
  billingCycle: BillingCycle;
  /** Stripe Customer ID (existant ou sera cree) */
  customerId?: string;
  /** Email pour creer le customer */
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  etablissementId: string;
  metadata?: Record<string, string>;
}

export interface StripeCustomerPortalParams {
  customerId: string;
  returnUrl: string;
}
