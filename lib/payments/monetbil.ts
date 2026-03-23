/**
 * Client Monetbil pour les paiements d'abonnements
 *
 * Monetbil est un aggregateur de paiement mobile money au Gabon
 * qui supporte Airtel Money via un widget web.
 *
 * API Reference: https://www.monetbil.com/
 *
 * Variables d'environnement requises:
 * - MONETBIL_SERVICE_KEY
 *
 * Flow:
 * 1. initPayment() -> retourne une URL de paiement (widget Monetbil)
 * 2. L'utilisateur paye via le widget (Airtel Money, etc.)
 * 3. Monetbil envoie un webhook POST a notre notifyUrl
 * 4. checkPayment() permet de verifier le statut manuellement
 */

import type {
  MonetbilPaymentParams,
  MonetbilPaymentResponse,
  MonetbilCheckPaymentResponse,
  PaymentResult,
} from "./types";

// ============================================================================
// CONFIG
// ============================================================================

const MONETBIL_WIDGET_URL = "https://api.monetbil.com/widget/v2.1";
const MONETBIL_CHECK_URL = "https://api.monetbil.com/payment/v1/checkPayment";

function getServiceKey(): string {
  const key = process.env.MONETBIL_SERVICE_KEY;
  if (!key) {
    throw new Error(
      "[Monetbil] MONETBIL_SERVICE_KEY manquante. Configurez la variable d'environnement."
    );
  }
  return key;
}

// ============================================================================
// INIT PAYMENT
// ============================================================================

/**
 * Initie un paiement via le widget Monetbil.
 *
 * Retourne une URL vers laquelle rediriger l'utilisateur.
 * Le widget Monetbil permet de payer par Airtel Money, carte, etc.
 */
export async function initMonetbilPayment(
  params: MonetbilPaymentParams
): Promise<PaymentResult> {
  const serviceKey = getServiceKey();

  const body = new URLSearchParams({
    amount: String(Math.round(params.amount)),
    phone: params.phone ?? "",
    phone_lock: params.phone ? "true" : "false",
    locale: "fr",
    country: "GA",
    currency: "XAF",
    item_ref: params.paymentRef,
    payment_ref: params.paymentRef,
    return_url: params.returnUrl,
    notify_url: params.notifyUrl,
    ...(params.email && { email: params.email }),
    ...(params.firstName && { first_name: params.firstName }),
    ...(params.lastName && { last_name: params.lastName }),
    ...(params.description && { payment_description: params.description }),
  });

  try {
    const response = await fetch(`${MONETBIL_WIDGET_URL}/${serviceKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[Monetbil] Erreur initiation: ${response.status}`, text);
      return {
        success: false,
        error: `Erreur API Monetbil: ${response.status}`,
      };
    }

    const data: MonetbilPaymentResponse = await response.json();

    if (!data.payment_url) {
      console.error("[Monetbil] Pas d'URL de paiement dans la reponse:", data);
      return {
        success: false,
        error: "Monetbil n'a pas retourne d'URL de paiement",
      };
    }

    console.log(
      `[Monetbil] Paiement initie: ${params.paymentRef} - ${params.amount} FCFA`
    );

    return {
      success: true,
      paymentUrl: data.payment_url,
      referenceInterne: params.paymentRef,
    };
  } catch (error) {
    console.error("[Monetbil] Erreur initiation:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors de l'initiation du paiement Monetbil",
    };
  }
}

// ============================================================================
// CHECK PAYMENT
// ============================================================================

/**
 * Verifie le statut d'un paiement Monetbil.
 *
 * @param paymentId - L'ID de paiement retourne par Monetbil (payment_ref ou transaction_id)
 */
export async function checkMonetbilPayment(
  paymentId: string
): Promise<MonetbilCheckPaymentResponse | null> {
  try {
    const response = await fetch(
      `${MONETBIL_CHECK_URL}?paymentId=${encodeURIComponent(paymentId)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error(
        `[Monetbil] Erreur verification: ${response.status}`,
        text
      );
      return null;
    }

    const data: MonetbilCheckPaymentResponse = await response.json();
    return data;
  } catch (error) {
    console.error("[Monetbil] Erreur verification:", error);
    return null;
  }
}

// ============================================================================
// VALIDATE WEBHOOK
// ============================================================================

/**
 * Valide le payload d'un webhook Monetbil.
 *
 * Monetbil n'utilise pas de signature HMAC. La validation repose sur:
 * 1. La verification du service_key dans le payload
 * 2. La verification du statut via checkPayment()
 *
 * @returns true si le webhook est valide
 */
export async function validateMonetbilWebhook(
  payload: Record<string, unknown>
): Promise<boolean> {
  // Le webhook doit contenir un payment_ref et un status
  if (!payload.payment_ref || !payload.status) {
    console.warn("[Monetbil] Webhook invalide: champs manquants");
    return false;
  }

  // Verification OBLIGATOIRE du service key (protection contre les webhooks
  // provenant d'un autre compte Monetbil ou falsifies)
  const expectedServiceKey = process.env.MONETBIL_SERVICE_KEY;
  if (!payload.service || !expectedServiceKey || payload.service !== expectedServiceKey) {
    console.warn(
      `[Monetbil] Webhook: service_key absent ou ne correspond pas`
    );
    return false;
  }

  // Verification croisee via l'API checkPayment
  const check = await checkMonetbilPayment(String(payload.payment_ref));
  if (!check) {
    console.warn(
      "[Monetbil] Webhook: impossible de verifier le paiement via l'API - rejete par securite"
    );
    // Rejeter le webhook si l'API de verification est indisponible
    // pour eviter d'accepter des webhooks falsifies
    return false;
  }

  // Verifier que le statut correspond
  if (check.status !== payload.status) {
    console.warn(
      `[Monetbil] Webhook: statut divergent - webhook=${payload.status}, api=${check.status}`
    );
    return false;
  }

  return true;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Genere une reference de paiement unique pour Monetbil
 */
export function generateMonetbilReference(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = crypto.randomUUID().slice(0, 8).toUpperCase();
  return `ORE-SUB-${date}-${random}`;
}
