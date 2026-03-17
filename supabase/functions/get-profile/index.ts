/**
 * Supabase Edge Function : get-profile
 *
 * Retourne le profil utilisateur depuis la table `utilisateurs`
 * en utilisant la service_role key (bypass RLS).
 *
 * Le mobile envoie l'email de l'utilisateur authentifie.
 * La fonction verifie le JWT puis cherche le profil correspondant.
 *
 * Deploiement :
 *   npx supabase functions deploy get-profile --project-ref htfbmlmwtqskoifwtusn
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // --- JWT verification ---
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Token d'authentification manquant" }, 401);
  }

  const token = authHeader.replace("Bearer ", "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return jsonResponse({ error: "Token invalide ou expire" }, 401);
  }

  // --- Business logic ---
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return jsonResponse({ error: "Email requis" }, 400);
    }

    const { data, error } = await supabase
      .from("utilisateurs")
      .select("id, email, nom, prenom, role, etablissement_id")
      .eq("email", email)
      .single();

    if (error || !data) {
      return jsonResponse({ error: "Utilisateur non trouve" }, 404);
    }

    return jsonResponse(data as Record<string, unknown>);
  } catch {
    return jsonResponse({ error: "Erreur interne" }, 500);
  }
});
