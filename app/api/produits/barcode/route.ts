/**
 * API Route pour recherche par code-barres
 * Migré vers Supabase
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/db";
import { getEtablissementId } from "@/lib/etablissement";

function serializeProduit<T extends Record<string, unknown>>(produit: T): T {
  const serialized = { ...produit } as Record<string, unknown>;
  if (serialized.prix_vente !== undefined) serialized.prixVente = Number(serialized.prix_vente);
  if (serialized.prix_achat !== undefined) serialized.prixAchat = Number(serialized.prix_achat);
  return serialized as T;
}

export async function GET(request: NextRequest) {
  try {
    const etablissementId = await getEtablissementId();
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Le code-barres est requis" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: produit } = await supabase
      .from("produits")
      .select(
        `
        *,
        categories(id, nom, couleur, icone),
        supplements_produits(id, nom, prix)
      `
      )
      .eq("etablissement_id", etablissementId)
      .eq("code_barre", code)
      .eq("actif", true)
      .single();

    if (!produit) {
      return NextResponse.json(
        { success: false, error: "Produit non trouvé", code },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: serializeProduit(produit),
    });
  } catch (error) {
    console.error("GET /api/produits/barcode error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la recherche du produit" },
      { status: 500 }
    );
  }
}
