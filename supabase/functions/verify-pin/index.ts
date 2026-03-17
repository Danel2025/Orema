/**
 * Supabase Edge Function : verify-pin
 *
 * Verifie le code PIN d'un employe cote serveur.
 * Utilise scrypt (Node.js crypto compat) pour comparer avec le hash en base.
 *
 * Securite :
 *   - Rate limiting par IP (max 5 tentatives / 5 minutes)
 *   - Requiert un etablissement_id pour limiter le scope de la recherche
 *   - CORS restreint a l'origine de l'app
 *
 * Deploiement :
 *   supabase functions deploy verify-pin --project-ref htfbmlmwtqskoifwtusn
 *
 * Appele depuis le mobile via :
 *   supabase.functions.invoke('verify-pin', { body: { pin: '1234', etablissement_id: '...' } })
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEYLEN = 64;

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

const allowedOrigin =
  Deno.env.get("APP_ORIGIN") || Deno.env.get("NEXT_PUBLIC_APP_URL") || "*";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(
  body: Record<string, unknown>,
  status = 200
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// Rate limiting en memoire (par IP, max 5 tentatives / 5 minutes)
// ---------------------------------------------------------------------------

const rateLimitMap = new Map<
  string,
  { count: number; resetAt: number }
>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return false;
  }

  entry.count++;
  return true;
}

// Nettoyage periodique des entrees expirees (eviter fuite memoire)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now >= entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 60_000); // toutes les minutes

// ---------------------------------------------------------------------------
// PIN verification
// ---------------------------------------------------------------------------

async function verifyPinHash(
  pin: string,
  hashedPin: string
): Promise<boolean> {
  try {
    const [salt, hash] = hashedPin.split(":");
    if (!salt || !hash) return false;
    const hashBuffer = Buffer.from(hash, "hex");
    const derivedKey = (await scryptAsync(pin, salt, KEYLEN)) as Buffer;
    return timingSafeEqual(hashBuffer, derivedKey);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Handler principal
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // --- Rate limiting par IP ---
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(clientIp)) {
    return jsonResponse(
      {
        error:
          "Trop de tentatives. Veuillez reessayer dans quelques minutes.",
      },
      429
    );
  }

  try {
    const { pin, etablissement_id: etablissementId } = await req.json();

    // --- Validation des entrees ---
    if (!pin || typeof pin !== "string" || !/^\d{4,6}$/.test(pin)) {
      return jsonResponse(
        { error: "PIN invalide (4-6 chiffres requis)" },
        400
      );
    }

    if (!etablissementId || typeof etablissementId !== "string") {
      return jsonResponse(
        { error: "etablissement_id requis" },
        400
      );
    }

    // Creer un client Supabase avec la service_role key (bypass RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Recuperer les utilisateurs actifs avec un PIN, filtre par etablissement
    const { data: utilisateurs, error } = await supabase
      .from("utilisateurs")
      .select("id, email, nom, prenom, role, pin_code, etablissement_id")
      .eq("actif", true)
      .eq("etablissement_id", etablissementId)
      .not("pin_code", "is", null);

    if (error || !utilisateurs) {
      return jsonResponse({ error: "Erreur serveur" }, 500);
    }

    // Verifier le PIN contre chaque utilisateur de l'etablissement
    for (const user of utilisateurs) {
      if (!user.pin_code) continue;
      const isValid = await verifyPinHash(pin, user.pin_code);
      if (isValid) {
        // PIN valide - retourner les infos utilisateur (sans le hash)
        return jsonResponse({
          id: user.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          role: user.role,
          etablissement_id: user.etablissement_id,
        });
      }
    }

    // Aucun PIN ne correspond
    return jsonResponse({ error: "Code PIN incorrect" }, 401);
  } catch {
    return jsonResponse({ error: "Erreur interne" }, 500);
  }
});
