/**
 * Edge Function: Envoi de SMS
 *
 * Envoie des SMS aux clients pour diverses notifications:
 * - Confirmation de commande
 * - Notification de livraison
 * - Rappel fidélité
 * - Alerte stock bas
 * - Messages personnalisés
 *
 * Providers: Africa's Talking (principal) + Twilio (fallback)
 *
 * @endpoint POST /functions/v1/send-sms
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SMSType =
  | "CONFIRMATION_COMMANDE"
  | "NOTIFICATION_LIVRAISON"
  | "RAPPEL_FIDELITE"
  | "ALERTE_STOCK"
  | "CUSTOM";

interface SMSRequest {
  to: string;
  message: string;
  type: SMSType;
  etablissementId?: string;
  metadata?: Record<string, unknown>;
}

interface SMSProviderResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Rate limiting en mémoire (par établissement, max 100 SMS / heure)
// ---------------------------------------------------------------------------

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_SMS_PER_HOUR = 100;

function checkRateLimit(etablissementId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(etablissementId);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(etablissementId, {
      count: 1,
      resetAt: now + 60 * 60 * 1000, // 1 heure
    });
    return true;
  }

  if (entry.count >= MAX_SMS_PER_HOUR) {
    return false;
  }

  entry.count++;
  return true;
}

// ---------------------------------------------------------------------------
// Validation du numéro gabonais
// ---------------------------------------------------------------------------

/**
 * Valide et formate un numéro de téléphone gabonais.
 * Formats acceptés : +241XXXXXXX, 241XXXXXXX, 0XXXXXXX, XXXXXXX
 * Le numéro doit avoir 7 ou 8 chiffres après l'indicatif 241.
 */
function validateAndFormatPhone(telephone: string): {
  valid: boolean;
  formatted: string;
  error?: string;
} {
  // Nettoyer : retirer espaces, tirets, points, parenthèses
  const cleaned = telephone.replace(/[\s\-\.\(\)]/g, "");

  // Extraire les chiffres
  const digits = cleaned.replace(/\D/g, "");

  let nationalNumber: string;

  if (digits.startsWith("241")) {
    nationalNumber = digits.substring(3);
  } else if (digits.startsWith("00241")) {
    nationalNumber = digits.substring(5);
  } else if (digits.startsWith("0") && digits.length >= 8) {
    nationalNumber = digits.substring(1);
  } else if (digits.length >= 7 && digits.length <= 8) {
    nationalNumber = digits;
  } else {
    return {
      valid: false,
      formatted: "",
      error: "Format de numéro invalide. Utilisez +241XXXXXXX ou 0XXXXXXX",
    };
  }

  // Le numéro national gabonais fait 7 ou 8 chiffres
  if (nationalNumber.length < 7 || nationalNumber.length > 8) {
    return {
      valid: false,
      formatted: "",
      error: `Numéro gabonais invalide: ${nationalNumber.length} chiffres (7-8 attendus)`,
    };
  }

  return {
    valid: true,
    formatted: `+241${nationalNumber}`,
  };
}

// ---------------------------------------------------------------------------
// CORS headers
// ---------------------------------------------------------------------------

const allowedOrigin = Deno.env.get("APP_ORIGIN") || Deno.env.get("NEXT_PUBLIC_APP_URL") || "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// Providers SMS
// ---------------------------------------------------------------------------

async function sendViaAfricasTalking(to: string, message: string): Promise<SMSProviderResponse> {
  const apiKey = Deno.env.get("AFRICASTALKING_API_KEY");
  const username = Deno.env.get("AFRICASTALKING_USERNAME");
  const senderId = Deno.env.get("AFRICASTALKING_SENDER_ID");

  if (!apiKey || !username) {
    return {
      success: false,
      error: "Africa's Talking non configuré (API_KEY ou USERNAME manquant)",
    };
  }

  const params = new URLSearchParams({
    username,
    to,
    message,
  });

  if (senderId) {
    params.set("from", senderId);
  }

  try {
    const response = await fetch("https://api.africastalking.com/version1/messaging", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        apiKey,
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data?.SMSMessageData?.Message || `HTTP ${response.status}`,
      };
    }

    // Africa's Talking retourne les résultats par destinataire
    const recipients = data?.SMSMessageData?.Recipients;
    if (recipients && recipients.length > 0) {
      const recipient = recipients[0];
      // statusCode 101 = envoyé avec succès
      if (recipient.statusCode === 101 || recipient.status === "Success") {
        return {
          success: true,
          messageId: recipient.messageId,
        };
      }
      return {
        success: false,
        error: `${recipient.status}: ${recipient.statusCode}`,
      };
    }

    return {
      success: false,
      error: data?.SMSMessageData?.Message || "Réponse inattendue",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur réseau",
    };
  }
}

async function sendViaTwilio(to: string, message: string): Promise<SMSProviderResponse> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromNumber = Deno.env.get("TWILIO_FROM_NUMBER");

  if (!accountSid || !authToken || !fromNumber) {
    return {
      success: false,
      error: "Twilio non configuré (SID, TOKEN ou FROM manquant)",
    };
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: to,
          From: fromNumber,
          Body: message,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data?.message || `HTTP ${response.status}` };
    }

    return { success: true, messageId: data.sid };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur réseau",
    };
  }
}

/**
 * Envoie un SMS via le provider principal, avec fallback sur le secondaire.
 */
async function sendSMS(to: string, message: string): Promise<SMSProviderResponse> {
  const provider = (Deno.env.get("SMS_PROVIDER") || "africastalking").toLowerCase();

  // Essayer le provider principal
  const primaryResult =
    provider === "twilio"
      ? await sendViaTwilio(to, message)
      : await sendViaAfricasTalking(to, message);

  if (primaryResult.success) {
    return primaryResult;
  }

  // Fallback sur l'autre provider
  console.warn(
    `[SMS] Provider principal (${provider}) a échoué: ${primaryResult.error}. Tentative fallback...`
  );

  const fallbackResult =
    provider === "twilio"
      ? await sendViaAfricasTalking(to, message)
      : await sendViaTwilio(to, message);

  if (fallbackResult.success) {
    return fallbackResult;
  }

  // Les deux ont échoué
  return {
    success: false,
    error: `Tous les providers ont échoué. Principal: ${primaryResult.error}. Fallback: ${fallbackResult.error}`,
  };
}

// ---------------------------------------------------------------------------
// Handler principal
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  // Pré-vol CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // Vérifier l'authentification via JWT Supabase
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Token d'authentification manquant" }, 401);
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return jsonResponse({ error: "Token invalide ou expiré" }, 401);
  }

  // Parser le body
  let body: SMSRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Body JSON invalide" }, 400);
  }

  // Validation des champs obligatoires
  if (!body.to || !body.message) {
    return jsonResponse({ error: "Les champs 'to' et 'message' sont requis" }, 400);
  }

  if (!body.type) {
    body.type = "CUSTOM";
  }

  const validTypes: SMSType[] = [
    "CONFIRMATION_COMMANDE",
    "NOTIFICATION_LIVRAISON",
    "RAPPEL_FIDELITE",
    "ALERTE_STOCK",
    "CUSTOM",
  ];
  if (!validTypes.includes(body.type)) {
    return jsonResponse(
      { error: `Type invalide. Valeurs acceptées: ${validTypes.join(", ")}` },
      400
    );
  }

  // Valider et formater le numéro de téléphone
  const phoneValidation = validateAndFormatPhone(body.to);
  if (!phoneValidation.valid) {
    return jsonResponse({ error: phoneValidation.error }, 400);
  }

  // Récupérer l'établissement de l'utilisateur
  const { data: utilisateur } = await supabase
    .from("utilisateurs")
    .select("id, etablissement_id, role")
    .eq("auth_user_id", user.id)
    .single();

  if (!utilisateur) {
    return jsonResponse({ error: "Utilisateur introuvable" }, 403);
  }

  const etablissementId = body.etablissementId || utilisateur.etablissement_id || "unknown";

  // Vérifier que l'utilisateur a accès à cet établissement
  if (
    body.etablissementId &&
    utilisateur.etablissement_id !== body.etablissementId &&
    utilisateur.role !== "SUPER_ADMIN"
  ) {
    return jsonResponse({ error: "Accès non autorisé à cet établissement" }, 403);
  }

  // Rate limiting
  if (!checkRateLimit(etablissementId)) {
    return jsonResponse(
      {
        error: `Limite de ${MAX_SMS_PER_HOUR} SMS/heure atteinte pour cet établissement`,
      },
      429
    );
  }

  // Envoyer le SMS
  const result = await sendSMS(phoneValidation.formatted, body.message);

  // Logger l'envoi dans la base de données (best-effort, ne bloque pas la réponse)
  try {
    await supabase.from("logs_sms").insert({
      etablissement_id: etablissementId,
      telephone: phoneValidation.formatted,
      message: body.message,
      type: body.type,
      provider: Deno.env.get("SMS_PROVIDER") || "africastalking",
      success: result.success,
      message_id: result.messageId || null,
      error: result.error || null,
      metadata: body.metadata || null,
      user_id: utilisateur.id,
    });
  } catch (logError) {
    console.error("[SMS] Erreur de logging:", logError);
    // Ne pas faire échouer l'envoi pour une erreur de log
  }

  if (!result.success) {
    return jsonResponse({ success: false, error: result.error }, 502);
  }

  return jsonResponse({
    success: true,
    messageId: result.messageId,
  });
});
