/**
 * Webhook Monetbil - Route Handler
 *
 * Recoit les notifications de paiement de Monetbil.
 * Monetbil envoie un POST avec les details du paiement
 * apres que le client ait paye via le widget.
 *
 * IMPORTANT: Ce endpoint est public (pas d'auth).
 * La validation se fait via verification croisee avec l'API Monetbil.
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  validateMonetbilWebhook,
  type MonetbilWebhookPayload,
} from "@/lib/payments";
import { resolvePlanSlug, getPlanQuotas } from "@/lib/config/plans";
import {
  createFactureAbonnementSafe,
} from "@/lib/db/queries/abonnements";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: MonetbilWebhookPayload;

  try {
    // Monetbil envoie les webhooks en application/x-www-form-urlencoded ou JSON
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      payload = await request.json();
    } else {
      // Form-urlencoded
      const text = await request.text();
      const params = new URLSearchParams(text);
      payload = Object.fromEntries(
        params.entries()
      ) as unknown as MonetbilWebhookPayload;
    }
  } catch (error) {
    console.error("[Webhook Monetbil] Erreur parsing body:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const paymentRef = payload.payment_ref;
  const status = payload.status;

  console.log(
    `[Webhook Monetbil] Recu: payment_ref=${paymentRef} status=${status} amount=${payload.amount} phone=***${payload.phone?.slice(-4) || "????"}`
  );

  // Validation du webhook
  const isValid = await validateMonetbilWebhook(
    payload as unknown as Record<string, unknown>
  );
  if (!isValid) {
    console.error("[Webhook Monetbil] Webhook invalide:", paymentRef);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    // Idempotency: verifier si ce paiement a deja ete traite
    const { data: existing } = await supabase
      .from("paiements_abonnement")
      .select("id, statut, reference_externe")
      .eq("reference_externe", paymentRef)
      .single();

    const existingRow = existing as {
      id: string;
      statut: string;
      reference_externe: string | null;
    } | null;

    if (existingRow && existingRow.statut === "reussi") {
      console.log(
        `[Webhook Monetbil] Paiement deja traite: ${paymentRef} - ignore`
      );
      return NextResponse.json({ received: true });
    }

    // Mapper le statut Monetbil vers notre statut interne
    // Note: "cancelled" mappe vers "echoue" car la colonne statut en DB
    // n'accepte pas "annule" pour les paiements (seulement: en_attente, reussi, echoue, rembourse)
    const statusMap: Record<string, string> = {
      success: "reussi",
      failed: "echoue",
      cancelled: "echoue",
    };
    const internalStatus = statusMap[status] ?? "echoue";

    if (existingRow) {
      // Recuperer le provider_payload existant pour preserver plan_slug et billing_cycle
      const { data: existingPayload } = await supabase
        .from("paiements_abonnement")
        .select("provider_payload")
        .eq("id", existingRow.id)
        .single();

      const prevPayload = (existingPayload as { provider_payload: Record<string, unknown> | null } | null)?.provider_payload ?? {};

      // Mettre a jour le paiement existant (fusion des payloads pour conserver plan_slug/billing_cycle)
      const { error: updateError } = await supabase
        .from("paiements_abonnement")
        .update({
          statut: internalStatus,
          reference_externe: payload.transaction_id ?? existingRow.reference_externe,
          provider_payload: {
            ...prevPayload,
            operator: payload.operator,
            fee: payload.fee,
            country: payload.country_name,
            message: payload.message,
            phone: payload.phone,
            transaction_id: payload.transaction_id,
          },
        } as never)
        .eq("id", existingRow.id);

      if (updateError) {
        console.error(`[Webhook Monetbil] Erreur update paiement ${existingRow.id}:`, updateError.message);
      }

      // Si succes, mettre a jour l'abonnement de l'etablissement
      if (internalStatus === "reussi") {
        await activateSubscription(supabase, existingRow.id);
      }
    } else {
      console.warn(
        `[Webhook Monetbil] Paiement inconnu: ${paymentRef} - pas de paiements_abonnement correspondant`
      );
    }

    // Creer la facture si paiement reussi
    if (internalStatus === "reussi" && existingRow) {
      await createInvoice(supabase, existingRow.id, payload);
    }

    console.log(
      `[Webhook Monetbil] Traite: ${paymentRef} -> ${internalStatus}`
    );

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook Monetbil] Erreur traitement:", error);
    // Retourner 200 quand meme pour eviter les retries indefinis
    return NextResponse.json({ received: true, error: "Processing error" });
  }
}

// ============================================================================
// HELPERS
// ============================================================================

async function activateSubscription(
  supabase: ReturnType<typeof createServiceClient>,
  paiementId: string
) {
  // Recuperer les details du paiement (inclut provider_payload avec le plan cible)
  const { data } = await supabase
    .from("paiements_abonnement")
    .select("etablissement_id, periode_debut, periode_fin, montant, methode, provider_payload")
    .eq("id", paiementId)
    .single();

  const payment = data as {
    etablissement_id: string;
    periode_debut: string;
    periode_fin: string;
    montant: number;
    methode: string;
    provider_payload: Record<string, unknown> | null;
  } | null;

  if (!payment) return;

  // Le plan cible est stocke dans provider_payload lors de l'initiation du paiement
  // (cf. actions/billing.ts -> initiatePayment)
  const targetPlan = payment.provider_payload?.plan_slug as string | undefined;
  const billingCycle = (payment.provider_payload?.billing_cycle as string) ?? "mensuel";

  if (!targetPlan) {
    console.error(
      `[Webhook Monetbil] provider_payload.plan_slug manquant pour paiement ${paiementId}`
    );
    return;
  }

  const planSlug = resolvePlanSlug(targetPlan);
  const quotas = getPlanQuotas(planSlug);

  // Mettre a jour l'etablissement avec le plan cible et le cycle de facturation
  const { error: etabUpdateError } = await supabase
    .from("etablissements")
    .update({
      plan: planSlug,
      billing_cycle: billingCycle,
      max_utilisateurs: quotas.max_utilisateurs,
      max_produits: quotas.max_produits,
      max_ventes_mois: quotas.max_ventes_mois,
      max_etablissements: quotas.max_etablissements,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", payment.etablissement_id);

  if (etabUpdateError) {
    console.error(`[Webhook Monetbil] Erreur update etablissement ${payment.etablissement_id}:`, etabUpdateError.message);
  }

  // Mettre a jour ou creer l'abonnement dans la table abonnements
  // D'abord tenter un update sur l'abonnement actif ou en essai
  const { data: existingAbo } = await supabase
    .from("abonnements" as never)
    .select("id, statut")
    .eq("etablissement_id", payment.etablissement_id)
    .in("statut", ["actif", "en_essai", "annule"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existingAbo) {
    const { error: aboUpdateError } = await supabase
      .from("abonnements" as never)
      .update({
        plan: planSlug,
        statut: "actif",
        billing_cycle: billingCycle,
        date_debut: payment.periode_debut,
        date_fin: payment.periode_fin,
        prix_mensuel: payment.montant,
        monetbil_payment_id: paiementId,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", (existingAbo as { id: string }).id);

    if (aboUpdateError) {
      console.error(`[Webhook Monetbil] Erreur update abonnement ${payment.etablissement_id}:`, aboUpdateError.message);
    }
  } else {
    // Creer un nouvel abonnement si aucun n'existe
    const { error: aboInsertError } = await supabase
      .from("abonnements" as never)
      .insert({
        etablissement_id: payment.etablissement_id,
        plan: planSlug,
        statut: "actif",
        billing_cycle: billingCycle,
        date_debut: payment.periode_debut,
        date_fin: payment.periode_fin,
        prix_mensuel: payment.montant,
        monetbil_payment_id: paiementId,
        quota_utilisateurs: quotas.max_utilisateurs,
        quota_produits: quotas.max_produits,
        quota_ventes_mois: quotas.max_ventes_mois,
        quota_etablissements: quotas.max_etablissements,
      } as never);

    if (aboInsertError) {
      console.error(`[Webhook Monetbil] Erreur insert abonnement ${payment.etablissement_id}:`, aboInsertError.message);
    }
  }

  console.log(
    `[Webhook Monetbil] Abonnement active: ${payment.etablissement_id} -> ${planSlug}`
  );
}

async function createInvoice(
  supabase: ReturnType<typeof createServiceClient>,
  paiementId: string,
  _payload: MonetbilWebhookPayload
) {
  const { data } = await supabase
    .from("paiements_abonnement")
    .select("etablissement_id, periode_debut, periode_fin, montant")
    .eq("id", paiementId)
    .single();

  const payment = data as {
    etablissement_id: string;
    periode_debut: string;
    periode_fin: string;
    montant: number;
  } | null;

  if (!payment) return;

  const montantHt = payment.montant;
  const tva = 0; // Les abonnements SaaS ne sont pas soumis a la TVA gabonaise
  const montantTtc = montantHt + tva;

  const facture = await createFactureAbonnementSafe(supabase, {
    etablissement_id: payment.etablissement_id,
    periode_debut: payment.periode_debut,
    periode_fin: payment.periode_fin,
    montant_ht: montantHt,
    tva,
    montant_ttc: montantTtc,
    date_echeance: new Date().toISOString(),
    statut: "payee",
  });

  console.log(
    `[Webhook Monetbil] Facture creee: ${facture.numero} - ${montantTtc} FCFA`
  );
}
