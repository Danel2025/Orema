/**
 * API Route pour le cache des catégories (mode hors-ligne)
 * Migré vers Supabase
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/db";
import { getEtablissementId } from "@/lib/etablissement";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const etablissementId = await getEtablissementId();
    const supabase = await createClient();

    const { data: categories } = await supabase
      .from("categories")
      .select("id, nom, couleur, ordre")
      .eq("etablissement_id", etablissementId)
      .order("ordre", { ascending: true });

    return NextResponse.json({
      categories: categories || [],
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Erreur cache catégories:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des catégories" },
      { status: 500 }
    );
  }
}
