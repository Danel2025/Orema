/**
 * Edge Function: Webhook Mobile Money
 *
 * Reception des callbacks de paiement Airtel Money et Moov Money.
 * Cette fonction est appelee par les providers de paiement mobile
 * pour confirmer les transactions.
 *
 * @endpoint POST /functions/v1/webhook-mobile-money
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Types
interface AirtelMoneyPayload {
  transaction: {
    id: string;
    message: string;
    status_code: string;
    airtel_money_id: string;
  };
  reference: string; // Notre reference interne
  status: "SUCCESS" | "FAILED" | "PENDING";
}

interface MoovMoneyPayload {
  transactionId: string;
  externalReference: string; // Notre reference interne
  status: "SUCCESSFUL" | "FAILED" | "PENDING";
  amount: number;
  currency: string;
}

// Client Supabase avec Service Role
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ---------------------------------------------------------------------------
// Timing-safe string comparison using crypto.subtle.timingSafeEqual
// or manual constant-time fallback
// ---------------------------------------------------------------------------

async function timingSafeCompare(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const aBuf = encoder.encode(a);
  const bBuf = encoder.encode(b);

  // If lengths differ, the signatures don't match.
  // We still run through the comparison to avoid leaking length info via timing.
  if (aBuf.byteLength !== bBuf.byteLength) {
    // Compare bBuf against itself to burn the same amount of time
    const dummy = new Uint8Array(bBuf.byteLength);
    constantTimeEqual(dummy, bBuf);
    return false;
  }

  // Try crypto.subtle.timingSafeEqual (available in newer Deno versions)
  if (
    typeof crypto !== "undefined" &&
    crypto.subtle &&
    typeof (crypto.subtle as Record<string, unknown>).timingSafeEqual ===
      "function"
  ) {
    return (crypto.subtle as unknown as { timingSafeEqual(a: ArrayBuffer, b: ArrayBuffer): boolean })
      .timingSafeEqual(aBuf.buffer, bBuf.buffer);
  }

  // Manual constant-time comparison fallback
  return constantTimeEqual(aBuf, bBuf);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  let result = 0;
  for (let i = 0; i < a.byteLength; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

// ---------------------------------------------------------------------------
// HMAC SHA-256 via Web Crypto (no third-party import needed)
// ---------------------------------------------------------------------------

async function computeHmacSha256Hex(
  secret: string,
  message: string
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message)
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  // Verifier la methode
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.text();

    // Determiner le provider selon les headers
    const provider = detectProvider(req.headers);

    // Verifier la signature du webhook
    const isValid = await verifyWebhookSignature(req.headers, body, provider);
    if (!isValid) {
      console.error(`[Webhook] Signature invalide pour ${provider}`);
      return new Response("Unauthorized", { status: 401 });
    }

    const payload = JSON.parse(body);

    // Traiter selon le provider
    let result;
    if (provider === "airtel") {
      result = await handleAirtelCallback(payload as AirtelMoneyPayload);
    } else if (provider === "moov") {
      result = await handleMoovCallback(payload as MoovMoneyPayload);
    } else {
      return new Response("Unknown provider", { status: 400 });
    }

    if (!result.success) {
      console.error(`[Webhook] Erreur traitement:`, result.error);
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Broadcast pour notification temps reel
    if (result.paiementId) {
      await broadcastPaiementConfirme(result.paiementId, result.reference);
    }

    console.log(`[Webhook] Paiement confirme: ${result.reference}`);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Webhook] Erreur:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Detecte le provider de paiement selon les headers
 */
function detectProvider(headers: Headers): "airtel" | "moov" | "unknown" {
  // Airtel Money utilise un header specifique
  if (headers.get("X-Airtel-Signature")) {
    return "airtel";
  }
  // Moov Money utilise un autre header
  if (headers.get("X-Moov-Signature")) {
    return "moov";
  }
  // Fallback sur le User-Agent ou autre
  const userAgent = headers.get("user-agent") || "";
  if (userAgent.includes("Airtel")) return "airtel";
  if (userAgent.includes("Moov")) return "moov";

  return "unknown";
}

/**
 * Verifie la signature du webhook.
 * TOUJOURS exiger la signature - pas de bypass en dev.
 */
async function verifyWebhookSignature(
  headers: Headers,
  body: string,
  provider: "airtel" | "moov" | "unknown"
): Promise<boolean> {
  const secret =
    provider === "airtel"
      ? Deno.env.get("AIRTEL_WEBHOOK_SECRET")
      : provider === "moov"
        ? Deno.env.get("MOOV_WEBHOOK_SECRET")
        : null;

  if (!secret) {
    console.error(
      `[Webhook] REJET: Secret non configure pour ${provider}. ` +
        `Configurez la variable d'environnement ${provider === "airtel" ? "AIRTEL_WEBHOOK_SECRET" : "MOOV_WEBHOOK_SECRET"}.`
    );
    return false;
  }

  const signature =
    provider === "airtel"
      ? headers.get("X-Airtel-Signature")
      : headers.get("X-Moov-Signature");

  if (!signature) return false;

  // Calculer le HMAC SHA256 via Web Crypto
  const expectedSignature = await computeHmacSha256Hex(secret, body);

  // Comparaison timing-safe pour eviter les attaques par timing
  return timingSafeCompare(signature, expectedSignature);
}

/**
 * Traite un callback Airtel Money
 */
async function handleAirtelCallback(payload: AirtelMoneyPayload): Promise<{
  success: boolean;
  paiementId?: string;
  reference?: string;
  error?: string;
}> {
  const { reference, status, transaction } = payload;

  // Mapper le statut
  const nouveauStatut =
    status === "SUCCESS"
      ? "CONFIRME"
      : status === "FAILED"
        ? "ECHOUE"
        : "EN_ATTENTE";

  // Mettre a jour le paiement en base
  const { data, error } = await supabase
    .from("paiements")
    .update({
      statut: nouveauStatut,
      referenceExterne: transaction.airtel_money_id,
      confirmeAt: nouveauStatut === "CONFIRME" ? new Date().toISOString() : null,
      metadonnees: {
        provider: "airtel_money",
        transactionId: transaction.id,
        statusCode: transaction.status_code,
        message: transaction.message,
      },
    })
    .eq("referenceInterne", reference)
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    paiementId: data?.id,
    reference,
  };
}

/**
 * Traite un callback Moov Money
 */
async function handleMoovCallback(payload: MoovMoneyPayload): Promise<{
  success: boolean;
  paiementId?: string;
  reference?: string;
  error?: string;
}> {
  const { externalReference, status, transactionId, amount } = payload;

  // Mapper le statut
  const nouveauStatut =
    status === "SUCCESSFUL"
      ? "CONFIRME"
      : status === "FAILED"
        ? "ECHOUE"
        : "EN_ATTENTE";

  // Mettre a jour le paiement en base
  const { data, error } = await supabase
    .from("paiements")
    .update({
      statut: nouveauStatut,
      referenceExterne: transactionId,
      confirmeAt: nouveauStatut === "CONFIRME" ? new Date().toISOString() : null,
      metadonnees: {
        provider: "moov_money",
        transactionId,
        amount,
        currency: payload.currency,
      },
    })
    .eq("referenceInterne", externalReference)
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    paiementId: data?.id,
    reference: externalReference,
  };
}

/**
 * Broadcast l'evenement de confirmation de paiement
 */
async function broadcastPaiementConfirme(
  paiementId: string,
  reference?: string
): Promise<void> {
  try {
    // Recuperer les infos du paiement pour le broadcast
    const { data: paiement } = await supabase
      .from("paiements")
      .select("venteId, vente:ventes(etablissementId)")
      .eq("id", paiementId)
      .single();

    if (paiement?.vente?.etablissementId) {
      const channelName = `paiements:${paiement.vente.etablissementId}`;
      await supabase.channel(channelName).send({
        type: "broadcast",
        event: "paiement:confirme",
        payload: {
          paiementId,
          reference,
          venteId: paiement.venteId,
        },
      });
    }
  } catch (error) {
    console.error("[Broadcast] Erreur:", error);
    // Ne pas faire echouer le webhook pour une erreur de broadcast
  }
}
