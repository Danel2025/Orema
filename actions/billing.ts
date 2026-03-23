"use server";

/**
 * Server Actions pour la facturation des abonnements
 *
 * Gere l'initiation des paiements (Monetbil / Stripe),
 * la verification de statut et la recuperation des factures.
 *
 * Tables utilisees:
 * - paiements_abonnement (colonnes: montant, devise, methode, statut, reference_externe, provider_payload, periode_debut, periode_fin)
 * - factures_abonnement (colonnes: numero, montant_ht, tva, montant_ttc, statut, pdf_url, date_echeance, date_paiement)
 */

import { getCurrentUser, requireAnyRole } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  initMonetbilPayment,
  generateMonetbilReference,
  checkMonetbilPayment,
  createStripeCheckoutSession,
  getOrCreateStripeCustomer,
  formatGabonPhone,
  type SubscriptionPaymentProvider,
} from "@/lib/payments";
import type { ActionResult } from "@/lib/action-types";
import {
  PLANS,
  PLAN_SLUGS,
  resolvePlanSlug,
  getPlanPrice as getConfigPlanPrice,
  isPlanFree,
  type PlanSlug,
  type BillingCycle,
} from "@/lib/config/plans";

// ============================================================================
// TYPES
// ============================================================================

interface InitiatePaymentInput {
  planSlug: string;
  billingCycle: BillingCycle;
  paymentMethod: SubscriptionPaymentProvider;
  phone?: string;
}

interface PaymentStatusInfo {
  status: string;
  provider: string;
  amount: number;
  planSlug: string;
  paidAt: string | null;
}

interface InvoiceInfo {
  id: string;
  numero: string;
  montantTtc: number;
  statut: string;
  periodeDebut: string;
  periodeFin: string;
  datePaiement: string | null;
  createdAt: string;
}

// ============================================================================
// PLAN PRICING (depuis la config centralisee)
// ============================================================================

function getPlanPrice(
  planSlug: string,
  billingCycle: BillingCycle
): number | null {
  if (!PLAN_SLUGS.includes(planSlug as PlanSlug)) return null;
  return getConfigPlanPrice(planSlug as PlanSlug, billingCycle);
}

// ============================================================================
// INITIATE PAYMENT
// ============================================================================

/**
 * Initie un paiement d'abonnement.
 *
 * Selon le paymentMethod:
 * - "monetbil": cree un paiement Monetbil et retourne l'URL du widget
 * - "stripe": cree une Checkout Session Stripe et retourne l'URL
 *
 * @returns URL de paiement vers laquelle rediriger l'utilisateur
 */
export async function initiatePayment(
  input: InitiatePaymentInput
): Promise<ActionResult<{ paymentUrl: string; referenceInterne?: string }>> {
  const user = await requireAnyRole(["ADMIN", "SUPER_ADMIN"]);
  if (!user.etablissementId)
    return { success: false, error: "Aucun etablissement associe" };

  const { planSlug, billingCycle, paymentMethod, phone } = input;

  // Validation du plan
  const amount = getPlanPrice(planSlug, billingCycle);
  if (amount === null) {
    return { success: false, error: `Plan "${planSlug}" inconnu` };
  }
  const resolvedSlug = resolvePlanSlug(planSlug);
  if (isPlanFree(resolvedSlug)) {
    return {
      success: false,
      error: "Le plan Essentiel est gratuit, pas de paiement necessaire",
    };
  }
  if (PLANS[resolvedSlug].pricing.sur_devis) {
    return {
      success: false,
      error: "Le plan Enterprise est sur devis. Contactez-nous.",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const supabase = createServiceClient();

  // Calculer les periodes
  const now = new Date();
  const periodEnd = new Date(now);
  if (billingCycle === "annuel") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  if (paymentMethod === "monetbil") {
    // Monetbil (Airtel Money)
    const paymentRef = generateMonetbilReference();

    // Enregistrer le paiement en DB avant l'appel API
    await supabase.from("paiements_abonnement").insert({
      etablissement_id: user.etablissementId,
      montant: amount,
      devise: "XAF",
      methode: "monetbil_airtel",
      statut: "en_attente",
      reference_externe: paymentRef,
      provider_payload: {
        plan_slug: planSlug,
        billing_cycle: billingCycle,
      },
      periode_debut: now.toISOString(),
      periode_fin: periodEnd.toISOString(),
    } as never);

    const formattedPhone = phone ? formatGabonPhone(phone) : undefined;

    const result = await initMonetbilPayment({
      amount,
      phone: formattedPhone,
      description: `Abonnement Orema N+ - Plan ${planSlug} (${billingCycle})`,
      returnUrl: `${baseUrl}/parametres/abonnement?payment=done&ref=${paymentRef}`,
      notifyUrl: `${baseUrl}/api/webhooks/monetbil`,
      paymentRef,
      email: user.email ?? undefined,
    });

    if (!result.success || !result.paymentUrl) {
      // Marquer comme echoue
      await supabase
        .from("paiements_abonnement")
        .update({ statut: "echoue" } as never)
        .eq("reference_externe", paymentRef);

      return { success: false, error: result.error ?? "Echec initiation Monetbil" };
    }

    return {
      success: true,
      data: {
        paymentUrl: result.paymentUrl,
        referenceInterne: paymentRef,
      },
    };
  } else if (paymentMethod === "stripe") {
    // Stripe (carte bancaire)
    // Recuperer ou creer le customer Stripe
    const email = user.email ?? "";
    let customerId: string | undefined;

    if (email) {
      try {
        customerId = await getOrCreateStripeCustomer({
          email,
          etablissementId: user.etablissementId,
          name: user.nom ?? undefined,
        });
      } catch (error) {
        console.error("[Billing] Erreur creation customer Stripe:", error);
      }
    }

    const result = await createStripeCheckoutSession({
      planSlug,
      billingCycle,
      customerId,
      customerEmail: customerId ? undefined : email,
      successUrl: `${baseUrl}/parametres/abonnement?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/parametres/abonnement?payment=cancelled`,
      etablissementId: user.etablissementId,
    });

    if (!result.success || !result.paymentUrl) {
      return { success: false, error: result.error ?? "Echec creation session Stripe" };
    }

    return {
      success: true,
      data: {
        paymentUrl: result.paymentUrl,
        referenceInterne: result.providerSessionId,
      },
    };
  }

  return { success: false, error: `Methode de paiement "${paymentMethod}" non supportee` };
}

// ============================================================================
// PAYMENT STATUS
// ============================================================================

/**
 * Verifie le statut d'un paiement d'abonnement.
 */
export async function getPaymentStatus(
  paymentRef: string
): Promise<ActionResult<PaymentStatusInfo>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Non authentifie" };
  if (!user.etablissementId)
    return { success: false, error: "Aucun etablissement associe" };

  const supabase = await createClient();

  const { data } = await supabase
    .from("paiements_abonnement")
    .select("statut, methode, montant, provider_payload, created_at")
    .eq("reference_externe", paymentRef)
    .eq("etablissement_id", user.etablissementId)
    .single();

  const payment = data as {
    statut: string;
    methode: string;
    montant: number;
    provider_payload: Record<string, unknown> | null;
    created_at: string;
  } | null;

  if (!payment) {
    return { success: false, error: "Paiement non trouve" };
  }

  // Si en attente et Monetbil, verifier aupres de l'API
  if (payment.statut === "en_attente" && payment.methode.startsWith("monetbil")) {
    const check = await checkMonetbilPayment(paymentRef);
    if (check && check.status === "success") {
      // Mettre a jour en DB au cas ou le webhook n'a pas encore ete recu
      const serviceClient = createServiceClient();
      await serviceClient
        .from("paiements_abonnement")
        .update({ statut: "reussi", updated_at: new Date().toISOString() } as never)
        .eq("reference_externe", paymentRef)
        .eq("statut", "en_attente");

      return {
        success: true,
        data: {
          status: "reussi",
          provider: payment.methode,
          amount: payment.montant,
          planSlug: (payment.provider_payload?.plan_slug as string) ?? "unknown",
          paidAt: new Date().toISOString(),
        },
      };
    }
  }

  return {
    success: true,
    data: {
      status: payment.statut,
      provider: payment.methode,
      amount: payment.montant,
      planSlug: (payment.provider_payload?.plan_slug as string) ?? "unknown",
      paidAt: payment.statut === "reussi" ? payment.created_at : null,
    },
  };
}

// ============================================================================
// INVOICES
// ============================================================================

/**
 * Recupere les factures d'un etablissement.
 */
export async function getInvoices(): Promise<ActionResult<InvoiceInfo[]>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Non authentifie" };
  if (!user.etablissementId)
    return { success: false, error: "Aucun etablissement associe" };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("factures_abonnement")
    .select("id, numero, montant_ttc, statut, periode_debut, periode_fin, date_paiement, created_at")
    .eq("etablissement_id", user.etablissementId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[Billing] Erreur recuperation factures:", error);
    return { success: false, error: "Erreur lors de la recuperation des factures" };
  }

  const rows = (data ?? []) as Array<{
    id: string;
    numero: string;
    montant_ttc: number;
    statut: string;
    periode_debut: string;
    periode_fin: string;
    date_paiement: string | null;
    created_at: string;
  }>;

  const invoices: InvoiceInfo[] = rows.map((row) => ({
    id: row.id,
    numero: row.numero,
    montantTtc: row.montant_ttc,
    statut: row.statut,
    periodeDebut: row.periode_debut,
    periodeFin: row.periode_fin,
    datePaiement: row.date_paiement,
    createdAt: row.created_at,
  }));

  return { success: true, data: invoices };
}

/**
 * Recupere l'URL de telechargement d'une facture.
 * Pour les factures Stripe, retourne le lien PDF Stripe.
 * Pour Monetbil, genere un PDF interne (TODO).
 */
export async function downloadInvoice(
  invoiceId: string
): Promise<ActionResult<{ url: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Non authentifie" };
  if (!user.etablissementId)
    return { success: false, error: "Aucun etablissement associe" };

  const supabase = await createClient();

  const { data } = await supabase
    .from("factures_abonnement")
    .select("id, etablissement_id, pdf_url")
    .eq("id", invoiceId)
    .single();

  const facture = data as {
    id: string;
    etablissement_id: string;
    pdf_url: string | null;
  } | null;

  if (!facture) {
    return { success: false, error: "Facture non trouvee" };
  }

  if (facture.etablissement_id !== user.etablissementId) {
    return { success: false, error: "Accès non autorisé" };
  }

  if (facture.pdf_url) {
    return { success: true, data: { url: facture.pdf_url } };
  }

  // Fallback: pas de PDF disponible
  return {
    success: false,
    error: "Le téléchargement PDF n'est pas encore disponible pour cette facture",
  };
}
