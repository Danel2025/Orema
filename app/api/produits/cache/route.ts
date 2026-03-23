/**
 * API Route pour le cache des produits (mode hors-ligne)
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

    const { data: produits } = await supabase
      .from("produits")
      .select(
        `
        id, nom, prix_vente, taux_tva, categorie_id,
        disponible_direct, disponible_table, disponible_livraison, disponible_emporter,
        gerer_stock, stock_actuel, image,
        categories(nom)
      `
      )
      .eq("etablissement_id", etablissementId)
      .eq("actif", true)
      .order("nom", { ascending: true });

    // Transformer pour compatibilité frontend
    const transformed = (produits || []).map((p) => ({
      id: p.id,
      nom: p.nom,
      prixVente: Number(p.prix_vente),
      tauxTva: p.taux_tva,
      categorieId: p.categorie_id,
      categorie: p.categories,
      disponibleDirect: p.disponible_direct,
      disponibleTable: p.disponible_table,
      disponibleLivraison: p.disponible_livraison,
      disponibleEmporter: p.disponible_emporter,
      gererStock: p.gerer_stock,
      stockActuel: p.stock_actuel,
      image: p.image,
    }));

    return NextResponse.json({
      produits: transformed,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Erreur cache produits:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des produits" },
      { status: 500 }
    );
  }
}
