/**
 * Webhook Stripe - Route Handler
 *
 * Recoit les evenements Stripe pour les abonnements par carte bancaire.
 * La signature est verifiee via le STRIPE_WEBHOOK_SECRET.
 *
 * Evenements geres:
 * - checkout.session.completed: paiement initial reussi
 * - invoice.paid: facture payee (renouvellement)
 * - customer.subscription.updated: changement de plan, reactivation
 * - customer.subscription.deleted: annulation definitive
 *
 * IMPORTANT: Ce endpoint est public (pas d'auth).
 * La validation se fait via la signature Stripe.
 */

import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { constructStripeWebhookEvent } from "@/lib/payments";
import { PLANS, resolvePlanSlug, getPlanQuotas } from "@/lib/config/plans";
import {
  createFactureAbonnementSafe,
} from "@/lib/db/queries/abonnements";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.error("[Webhook Stripe] Signature manquante");
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = constructStripeWebhookEvent(body, signature);
  } catch (error) {
    console.error("[Webhook Stripe] Verification signature echouee:", error);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  console.log(
    `[Webhook Stripe] Recu: type=${event.type} id=${event.id}`
  );

  try {
    // Idempotency: verifier via reference_externe dans paiements_abonnement
    // On utilise l'ID reel de la ressource (session.id ou invoice.id) selon le type d'evenement
    // car les handlers inserent avec ces IDs, pas avec event.id
    let idempotencyRef: string | null = null;
    if (event.type === "checkout.session.completed") {
      idempotencyRef = (event.data.object as { id: string }).id; // session.id
    } else if (event.type === "invoice.paid") {
      idempotencyRef = (event.data.object as { id: string }).id; // invoice.id
    }

    if (idempotencyRef) {
      const { data: existingPayment } = await supabase
        .from("paiements_abonnement")
        .select("id, statut")
        .eq("reference_externe", idempotencyRef)
        .single();

      if (existingPayment && (existingPayment as { statut: string }).statut === "reussi") {
        console.log(
          `[Webhook Stripe] Evenement deja traite: ${idempotencyRef} (event=${event.id}) - ignore`
        );
        return NextResponse.json({ received: true });
      }
    }

    // Traiter selon le type d'evenement
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          supabase,
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "invoice.paid":
        await handleInvoicePaid(
          supabase,
          event.data.object as Stripe.Invoice
        );
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          supabase,
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          supabase,
          event.data.object as Stripe.Subscription
        );
        break;

      default:
        console.log(
          `[Webhook Stripe] Evenement non gere: ${event.type}`
        );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook Stripe] Erreur traitement:", error);
    // Retourner 200 pour eviter les retries indefinis de Stripe
    return NextResponse.json({ received: true, error: "Processing error" });
  }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Checkout Session completee.
 * C'est le premier paiement d'un abonnement.
 */
async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createServiceClient>,
  session: Stripe.Checkout.Session
) {
  const etablissementId = session.metadata?.etablissement_id;
  const planSlug = session.metadata?.plan_slug;
  const billingCycle = session.metadata?.billing_cycle;

  if (!etablissementId || !planSlug) {
    console.error(
      "[Webhook Stripe] checkout.session.completed: metadata manquante",
      session.id
    );
    return;
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  // Calculer la periode
  const now = new Date();
  const periodEnd = new Date(now);
  if (billingCycle === "annuel") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  // Enregistrer dans paiements_abonnement
  const { error: insertError } = await supabase.from("paiements_abonnement").insert({
    etablissement_id: etablissementId,
    montant: session.amount_total ? Math.round(session.amount_total) : 0,
    devise: "XAF",
    methode: "stripe",
    statut: "reussi",
    reference_externe: session.id,
    provider_payload: {
      subscription_id: subscriptionId,
      customer_id: customerId,
      plan_slug: planSlug,
      billing_cycle: billingCycle,
    },
    periode_debut: now.toISOString(),
    periode_fin: periodEnd.toISOString(),
  } as never);

  if (insertError) {
    console.error(`[Webhook Stripe] Erreur insert paiement checkout ${session.id}:`, insertError.message);
  }

  // Activer l'abonnement sur l'etablissement
  const resolvedSlug = resolvePlanSlug(planSlug);
  const quotas = getPlanQuotas(resolvedSlug);

  const { error: etabError } = await supabase
    .from("etablissements")
    .update({
      plan: resolvedSlug,
      billing_cycle: billingCycle ?? "mensuel",
      max_utilisateurs: quotas.max_utilisateurs,
      max_produits: quotas.max_produits,
      max_ventes_mois: quotas.max_ventes_mois,
      max_etablissements: quotas.max_etablissements,
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", etablissementId);

  if (etabError) {
    console.error(`[Webhook Stripe] Erreur update etablissement ${etablissementId}:`, etabError.message);
  }

  // Mettre a jour la table abonnements
  const { error: aboError } = await supabase
    .from("abonnements" as never)
    .update({
      plan: resolvedSlug,
      statut: "actif",
      billing_cycle: billingCycle ?? "mensuel",
      stripe_subscription_id: subscriptionId,
      date_debut: now.toISOString(),
      date_fin: periodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq("etablissement_id", etablissementId);

  if (aboError) {
    console.error(`[Webhook Stripe] Erreur update abonnement ${etablissementId}:`, aboError.message);
  }

  // Creer la facture
  await createInvoiceForStripe(supabase, etablissementId, {
    montant: session.amount_total ? Math.round(session.amount_total) : 0,
    periodeDebut: now.toISOString(),
    periodeFin: periodEnd.toISOString(),
  });

  console.log(
    `[Webhook Stripe] Abonnement active: ${etablissementId} -> ${resolvedSlug} (${billingCycle})`
  );
}

/**
 * Facture payee.
 * Inclut les renouvellements automatiques.
 */
async function handleInvoicePaid(
  supabase: ReturnType<typeof createServiceClient>,
  invoice: Stripe.Invoice
) {
  // Stripe SDK v20: invoice.subscription remplace par parent.subscription_details
  const invoiceAny = invoice as unknown as Record<string, unknown>;
  const parentObj = invoice.parent as unknown as Record<string, unknown> | null;
  const subscriptionId =
    parentObj?.subscription_details
      ? (parentObj.subscription_details as Record<string, unknown>)?.subscription as string | undefined
      : (invoiceAny.subscription as string | undefined);

  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : (invoice.customer as { id: string } | null)?.id;

  if (!subscriptionId || !customerId) return;

  // Trouver l'etablissement via le stripe_customer_id
  const { data: etab } = await supabase
    .from("etablissements")
    .select("id, plan")
    .eq("stripe_customer_id" as never, customerId)
    .single();

  const etablissement = etab as { id: string; plan: string } | null;

  if (!etablissement) {
    console.warn(
      `[Webhook Stripe] invoice.paid: etablissement non trouve pour customer ${customerId}`
    );
    return;
  }

  // Determiner la periode
  const line = invoice.lines?.data?.[0];
  const periodeDebut = line?.period?.start
    ? new Date(line.period.start * 1000).toISOString()
    : new Date().toISOString();
  const periodeFin = line?.period?.end
    ? new Date(line.period.end * 1000).toISOString()
    : null;

  // Enregistrer le paiement
  const { error: insertError } = await supabase.from("paiements_abonnement").insert({
    etablissement_id: etablissement.id,
    montant: invoice.amount_paid ?? 0,
    devise: "XAF",
    methode: "stripe",
    statut: "reussi",
    reference_externe: invoice.id,
    provider_payload: {
      subscription_id: subscriptionId,
      customer_id: customerId,
      billing_cycle: determineBillingCycleFromInvoice(invoice),
    },
    periode_debut: periodeDebut,
    periode_fin: periodeFin ?? new Date().toISOString(),
  } as never);

  if (insertError) {
    console.error(`[Webhook Stripe] Erreur insert paiement invoice ${invoice.id}:`, insertError.message);
  }

  // Mettre a jour l'abonnement dans la table abonnements
  if (periodeFin) {
    const { error: aboError } = await supabase
      .from("abonnements" as never)
      .update({
        statut: "actif",
        date_debut: periodeDebut,
        date_fin: periodeFin,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("etablissement_id", etablissement.id)
      .eq("stripe_subscription_id", subscriptionId);

    if (aboError) {
      console.error(`[Webhook Stripe] Erreur update abonnement invoice ${etablissement.id}:`, aboError.message);
    }
  }

  // Creer la facture
  await createInvoiceForStripe(supabase, etablissement.id, {
    montant: invoice.amount_paid ?? 0,
    periodeDebut,
    periodeFin: periodeFin ?? new Date().toISOString(),
  });

  console.log(
    `[Webhook Stripe] Facture payee: ${invoice.id} - ${etablissement.id} - ${invoice.amount_paid} FCFA`
  );
}

/**
 * Abonnement mis a jour (changement de plan, reactivation, etc.)
 */
async function handleSubscriptionUpdated(
  supabase: ReturnType<typeof createServiceClient>,
  subscription: Stripe.Subscription
) {
  const etablissementId = subscription.metadata?.etablissement_id;
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  // Chercher l'etablissement
  let etabId: string | undefined = etablissementId;
  if (!etabId && customerId) {
    const { data } = await supabase
      .from("etablissements")
      .select("id")
      .eq("stripe_customer_id" as never, customerId)
      .single();
    etabId = (data as { id: string } | null)?.id;
  }

  if (!etabId) {
    console.warn(
      `[Webhook Stripe] subscription.updated: etablissement non trouve pour subscription ${subscription.id}`
    );
    return;
  }

  // Mapper le statut Stripe vers le statut abonnement
  const statusMap: Record<string, string> = {
    active: "actif",
    past_due: "actif", // Toujours actif mais en retard
    canceled: "annule",
    unpaid: "expire",
    trialing: "en_essai",
    incomplete: "en_essai",
    incomplete_expired: "expire",
    paused: "suspendu",
  };

  const internalStatus = statusMap[subscription.status] ?? "actif";

  // Mettre a jour la table abonnements
  const abonnementUpdate: Record<string, unknown> = {
    statut: internalStatus,
    stripe_subscription_id: subscription.id,
    updated_at: new Date().toISOString(),
  };

  // Mettre a jour le plan si les metadata sont presentes
  if (subscription.metadata?.plan_slug) {
    const planSlug = resolvePlanSlug(subscription.metadata.plan_slug);
    const quotas = getPlanQuotas(planSlug);

    abonnementUpdate.plan = planSlug;

    // Aussi mettre a jour l'etablissement
    const { error: etabUpdateError } = await supabase
      .from("etablissements")
      .update({
        plan: planSlug,
        max_utilisateurs: quotas.max_utilisateurs,
        max_produits: quotas.max_produits,
        max_ventes_mois: quotas.max_ventes_mois,
        max_etablissements: quotas.max_etablissements,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", etabId);

    if (etabUpdateError) {
      console.error(`[Webhook Stripe] Erreur update etablissement sub.updated ${etabId}:`, etabUpdateError.message);
    }
  }

  // Periode - Stripe SDK v20: current_period sur les items
  const subAny = subscription as unknown as Record<string, unknown>;
  const periodStart = subAny.current_period_start as number | undefined;
  const periodEnd = subAny.current_period_end as number | undefined;
  if (periodStart) {
    abonnementUpdate.date_debut = new Date(periodStart * 1000).toISOString();
  }
  if (periodEnd) {
    abonnementUpdate.date_fin = new Date(periodEnd * 1000).toISOString();
  }

  const { error: aboUpdateError } = await supabase
    .from("abonnements" as never)
    .update(abonnementUpdate as never)
    .eq("etablissement_id", etabId)
    .eq("stripe_subscription_id", subscription.id);

  if (aboUpdateError) {
    console.error(`[Webhook Stripe] Erreur update abonnement sub.updated ${etabId}:`, aboUpdateError.message);
  }

  console.log(
    `[Webhook Stripe] Subscription updated: ${etabId} -> status=${subscription.status}`
  );
}

/**
 * Abonnement supprime/annule definitivement.
 */
async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createServiceClient>,
  subscription: Stripe.Subscription
) {
  const etablissementId = subscription.metadata?.etablissement_id;
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  let etabId: string | undefined = etablissementId;
  if (!etabId && customerId) {
    const { data } = await supabase
      .from("etablissements")
      .select("id")
      .eq("stripe_customer_id" as never, customerId)
      .single();
    etabId = (data as { id: string } | null)?.id;
  }

  if (!etabId) {
    console.warn(
      `[Webhook Stripe] subscription.deleted: etablissement non trouve pour subscription ${subscription.id}`
    );
    return;
  }

  // Downgrade vers le plan essentiel (gratuit)
  const essentialQuotas = getPlanQuotas("essentiel");

  const { error: etabDowngradeError } = await supabase
    .from("etablissements")
    .update({
      plan: "essentiel",
      max_utilisateurs: essentialQuotas.max_utilisateurs,
      max_produits: essentialQuotas.max_produits,
      max_ventes_mois: essentialQuotas.max_ventes_mois,
      max_etablissements: essentialQuotas.max_etablissements,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", etabId);

  if (etabDowngradeError) {
    console.error(`[Webhook Stripe] Erreur downgrade etablissement ${etabId}:`, etabDowngradeError.message);
  }

  // Marquer l'abonnement comme annule
  const { error: aboCancelError } = await supabase
    .from("abonnements" as never)
    .update({
      statut: "annule",
      stripe_subscription_id: null,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("etablissement_id", etabId)
    .eq("stripe_subscription_id", subscription.id);

  if (aboCancelError) {
    console.error(`[Webhook Stripe] Erreur annulation abonnement ${etabId}:`, aboCancelError.message);
  }

  console.log(
    `[Webhook Stripe] Subscription deleted: ${etabId} -> downgrade essentiel`
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function determineBillingCycleFromInvoice(invoice: Stripe.Invoice): string {
  // Determiner si mensuel ou annuel via la duree de la periode
  const line = invoice.lines?.data?.[0];
  if (line?.period?.start && line?.period?.end) {
    const durationDays =
      (line.period.end - line.period.start) / (60 * 60 * 24);
    return durationDays > 60 ? "annuel" : "mensuel";
  }
  return "mensuel";
}

/**
 * Cree une facture dans factures_abonnement pour un paiement Stripe.
 * Utilise createFactureAbonnementSafe pour gerer les race conditions
 * sur le numero de facture (retry automatique en cas de conflit UNIQUE).
 */
async function createInvoiceForStripe(
  supabase: ReturnType<typeof createServiceClient>,
  etablissementId: string,
  details: { montant: number; periodeDebut: string; periodeFin: string }
) {
  const montantHt = details.montant;
  const tva = 0; // Les abonnements SaaS ne sont pas soumis a la TVA gabonaise
  const montantTtc = montantHt + tva;

  const facture = await createFactureAbonnementSafe(supabase, {
    etablissement_id: etablissementId,
    periode_debut: details.periodeDebut,
    periode_fin: details.periodeFin,
    montant_ht: montantHt,
    tva,
    montant_ttc: montantTtc,
    date_echeance: new Date().toISOString(),
    statut: "payee",
  });

  console.log(
    `[Webhook Stripe] Facture creee: ${facture.numero} - ${montantTtc} FCFA`
  );
}
