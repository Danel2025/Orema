/**
 * API Routes pour les produits
 * Migré vers Supabase
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/db";
import { getEtablissementId } from "@/lib/etablissement";
import { produitSchema } from "@/schemas/produit.schema";
import { sanitizeSearchTerm } from "@/lib/utils/sanitize";

function getTauxTvaEnum(taux: number): "STANDARD" | "REDUIT" | "EXONERE" {
  if (taux === 0) return "EXONERE";
  if (taux === 10) return "REDUIT";
  return "STANDARD";
}

function serializeProduit<T extends Record<string, unknown>>(produit: T): T {
  const serialized = { ...produit } as Record<string, unknown>;
  if (serialized.prix_vente !== undefined) serialized.prixVente = Number(serialized.prix_vente);
  if (serialized.prix_achat !== undefined) serialized.prixAchat = Number(serialized.prix_achat);
  if (Array.isArray(serialized.supplements_produits)) {
    serialized.supplements = serialized.supplements_produits.map(
      (sup: Record<string, unknown>) => ({
        ...sup,
        prix: sup.prix !== undefined ? Number(sup.prix) : null,
      })
    );
  }
  return serialized as T;
}

/**
 * GET /api/produits - Récupère tous les produits avec filtres
 */
export async function GET(request: NextRequest) {
  try {
    const etablissementId = await getEtablissementId();
    const { searchParams } = new URL(request.url);
    const supabase = await createClient();

    const search = searchParams.get("search");
    const categorieId = searchParams.get("categorieId");
    const actif = searchParams.get("actif");
    const codeBarre = searchParams.get("codeBarre");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Construire la requête
    let query = supabase
      .from("produits")
      .select(
        `
        *,
        categories(id, nom, couleur, icone),
        supplements_produits(id, nom, prix)
      `,
        { count: "exact" }
      )
      .eq("etablissement_id", etablissementId);

    if (actif !== null && actif !== undefined && actif !== "") {
      query = query.eq("actif", actif === "true");
    }
    if (categorieId) query = query.eq("categorie_id", categorieId);
    if (codeBarre) query = query.eq("code_barre", codeBarre);
    if (search) {
      const cleanSearch = sanitizeSearchTerm(search);
      if (cleanSearch) {
        query = query.or(
          `nom.ilike.%${cleanSearch}%,description.ilike.%${cleanSearch}%,code_barre.ilike.%${cleanSearch}%`
        );
      }
    }

    const {
      data: produits,
      count,
      error,
    } = await query.order("nom", { ascending: true }).range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: (produits || []).map(serializeProduit),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/produits error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des produits" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/produits - Crée un nouveau produit
 */
export async function POST(request: NextRequest) {
  try {
    const etablissementId = await getEtablissementId();
    const body = await request.json();
    const supabase = await createClient();

    const validation = produitSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Données invalides", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Vérifier l'unicité du nom
    const { data: existing } = await supabase
      .from("produits")
      .select("id")
      .eq("etablissement_id", etablissementId)
      .eq("nom", data.nom)
      .eq("categorie_id", data.categorieId)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Un produit avec ce nom existe déjà dans cette catégorie" },
        { status: 409 }
      );
    }

    // Vérifier que la catégorie existe
    const { data: categorie } = await supabase
      .from("categories")
      .select("id")
      .eq("id", data.categorieId)
      .eq("etablissement_id", etablissementId)
      .single();

    if (!categorie) {
      return NextResponse.json({ success: false, error: "Catégorie non trouvée" }, { status: 404 });
    }

    const { data: produit, error } = await supabase
      .from("produits")
      .insert({
        nom: data.nom,
        description: data.description,
        code_barre: data.codeBarre,
        image: data.image,
        prix_vente: data.prixVente,
        prix_achat: data.prixAchat,
        taux_tva: getTauxTvaEnum(data.tauxTva),
        categorie_id: data.categorieId,
        gerer_stock: data.gererStock,
        stock_actuel: data.stockActuel,
        stock_min: data.stockMin,
        stock_max: data.stockMax,
        unite: data.unite,
        disponible_direct: data.disponibleDirect,
        disponible_table: data.disponibleTable,
        disponible_livraison: data.disponibleLivraison,
        disponible_emporter: data.disponibleEmporter,
        actif: data.actif,
        etablissement_id: etablissementId,
      })
      .select(`*, categories(id, nom, couleur, icone)`)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: serializeProduit(produit) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/produits error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la création du produit" },
      { status: 500 }
    );
  }
}
