/**
 * Client Stripe pour les paiements d'abonnements par carte bancaire
 *
 * Utilise Stripe Checkout Sessions pour les paiements
 * et Stripe Customer Portal pour la gestion des abonnements.
 *
 * Variables d'environnement requises:
 * - STRIPE_SECRET_KEY
 * - STRIPE_WEBHOOK_SECRET
 * - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
 */

import Stripe from "stripe";
import type {
  StripeCheckoutParams,
  StripeCustomerPortalParams,
  PaymentResult,
  BillingCycle,
} from "./types";

// ============================================================================
// SINGLETON
// ============================================================================

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "[Stripe] STRIPE_SECRET_KEY manquante. Configurez la variable d'environnement."
    );
  }

  stripeInstance = new Stripe(secretKey, {
    apiVersion: "2026-02-25.clover",
    typescript: true,
  });

  return stripeInstance;
}

// ============================================================================
// STRIPE PRICE MAPPING
// ============================================================================

/**
 * Mapping des plans vers les Stripe Price IDs.
 *
 * Ces IDs doivent etre configures dans le dashboard Stripe
 * et references via des variables d'environnement.
 *
 * Convention: STRIPE_PRICE_{PLAN}_{CYCLE}
 * Ex: STRIPE_PRICE_PRO_MENSUEL, STRIPE_PRICE_PRO_ANNUEL
 */
function getStripePriceId(planSlug: string, billingCycle: BillingCycle): string {
  const envKey = `STRIPE_PRICE_${planSlug.toUpperCase()}_${billingCycle.toUpperCase()}`;
  const priceId = process.env[envKey];

  if (!priceId) {
    throw new Error(
      `[Stripe] Variable d'environnement ${envKey} manquante. ` +
        `Configurez le Price ID Stripe pour le plan "${planSlug}" cycle "${billingCycle}".`
    );
  }

  return priceId;
}

// ============================================================================
// CUSTOMER MANAGEMENT
// ============================================================================

/**
 * Recupere ou cree un Stripe Customer pour un etablissement.
 */
export async function getOrCreateStripeCustomer(params: {
  email: string;
  etablissementId: string;
  name?: string;
}): Promise<string> {
  const stripe = getStripe();

  // Chercher un customer existant par metadata
  const existing = await stripe.customers.list({
    limit: 1,
    email: params.email,
  });

  if (existing.data.length > 0) {
    const customer = existing.data[0];
    // Mettre a jour les metadata si necessaire
    if (customer.metadata?.etablissement_id !== params.etablissementId) {
      await stripe.customers.update(customer.id, {
        metadata: {
          etablissement_id: params.etablissementId,
        },
      });
    }
    return customer.id;
  }

  // Creer un nouveau customer
  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: {
      etablissement_id: params.etablissementId,
    },
  });

  console.log(
    `[Stripe] Customer cree: ${customer.id} pour etablissement ${params.etablissementId}`
  );

  return customer.id;
}

// ============================================================================
// CHECKOUT SESSION
// ============================================================================

/**
 * Cree une Stripe Checkout Session pour un abonnement.
 *
 * L'utilisateur est redirige vers la page de paiement Stripe,
 * puis revient sur notre site apres paiement.
 */
export async function createStripeCheckoutSession(
  params: StripeCheckoutParams
): Promise<PaymentResult> {
  const stripe = getStripe();

  try {
    const priceId = getStripePriceId(params.planSlug, params.billingCycle);

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        etablissement_id: params.etablissementId,
        plan_slug: params.planSlug,
        billing_cycle: params.billingCycle,
        ...params.metadata,
      },
      subscription_data: {
        metadata: {
          etablissement_id: params.etablissementId,
          plan_slug: params.planSlug,
          billing_cycle: params.billingCycle,
        },
      },
      currency: "xaf",
      locale: "fr",
    };

    // Associer un customer existant ou utiliser l'email
    if (params.customerId) {
      sessionParams.customer = params.customerId;
    } else if (params.customerEmail) {
      sessionParams.customer_email = params.customerEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log(
      `[Stripe] Checkout Session creee: ${session.id} - plan=${params.planSlug} cycle=${params.billingCycle}`
    );

    return {
      success: true,
      paymentUrl: session.url ?? undefined,
      providerSessionId: session.id,
    };
  } catch (error) {
    console.error("[Stripe] Erreur creation Checkout Session:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors de la creation de la session Stripe",
    };
  }
}

// ============================================================================
// CUSTOMER PORTAL
// ============================================================================

/**
 * Cree une session Stripe Customer Portal.
 *
 * Permet au client de gerer son abonnement (changer de plan,
 * modifier les infos de paiement, annuler, etc.)
 */
export async function createStripeCustomerPortalSession(
  params: StripeCustomerPortalParams
): Promise<{ url: string | null; error?: string }> {
  const stripe = getStripe();

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl,
    });

    return { url: session.url };
  } catch (error) {
    console.error("[Stripe] Erreur creation Customer Portal:", error);
    return {
      url: null,
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors de la creation du portail Stripe",
    };
  }
}

// ============================================================================
// WEBHOOK VERIFICATION
// ============================================================================

/**
 * Construit et verifie un evenement webhook Stripe.
 *
 * Utilise la signature du header pour s'assurer que le webhook
 * provient bien de Stripe.
 */
export function constructStripeWebhookEvent(
  body: string,
  signature: string
): Stripe.Event {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error(
      "[Stripe] STRIPE_WEBHOOK_SECRET manquante. Configurez la variable d'environnement."
    );
  }

  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

/**
 * Annule un abonnement Stripe a la fin de la periode en cours.
 */
export async function cancelStripeSubscription(
  subscriptionId: string,
  immediately = false
): Promise<Stripe.Subscription> {
  const stripe = getStripe();

  if (immediately) {
    return stripe.subscriptions.cancel(subscriptionId);
  }

  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Reactive un abonnement Stripe annule (avant la fin de periode).
 */
export async function reactivateStripeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const stripe = getStripe();

  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Recupere les details d'un abonnement Stripe.
 */
export async function getStripeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const stripe = getStripe();
  return stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Recupere les factures Stripe d'un customer.
 */
export async function getStripeInvoices(
  customerId: string,
  limit = 10
): Promise<Stripe.Invoice[]> {
  const stripe = getStripe();
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
  });
  return invoices.data;
}
