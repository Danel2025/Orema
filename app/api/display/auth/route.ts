/**
 * API Route pour valider un token d'écran d'affichage
 * GET /api/display/auth?token=xxx
 *
 * Pas de session utilisateur requise - utilise le service client
 * pour valider le token via la fonction RPC validate_display_token
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Valider le token via la fonction RPC
    const { data, error } = await supabase.rpc("validate_display_token", {
      p_token: token,
    });

    if (error) {
      console.error("[display/auth] RPC Error:", error);
      return NextResponse.json(
        { error: "Erreur de validation du token" },
        { status: 500 }
      );
    }

    const result = data as {
      valid: boolean;
      error?: string;
      id?: string;
      nom?: string;
      type?: string;
      categories?: string[] | null;
      etablissement_id?: string;
      son_actif?: boolean;
      delai_urgence_minutes?: number;
    };

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error || "Token invalide" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        nom: result.nom,
        type: result.type,
        categories: result.categories,
        etablissementId: result.etablissement_id,
        sonActif: result.son_actif,
        delaiUrgenceMinutes: result.delai_urgence_minutes,
      },
    });
  } catch (error) {
    console.error("[display/auth] Error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
