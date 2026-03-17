/**
 * API Routes pour un produit spécifique
 * Migré vers Supabase
 */

import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/db";
import { getEtablissementId } from "@/lib/etablissement";
import { produitSchema } from "@/schemas/produit.schema";
import { getSession } from "@/lib/auth/session";
import { isValidId } from "@/lib/utils/sanitize";
import type { Role } from "@/lib/db/types";

/**
 * Roles autorises a modifier les produits
 */
const PRODUCT_WRITE_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

/**
 * Schema Zod strict pour le PATCH partiel de produits.
 * .strict() rejette tout champ inconnu pour empecher
 * l'injection de champs arbitraires dans la requete Supabase.
 */
const produitPatchSchema = z.object({
  nom: z.string().min(2).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  code_barre: z.string().max(50).nullable().optional(),
  image: z.string().max(500).nullable().optional(),
  prix_vente: z.number().int().positive().optional(),
  prix_achat: z.number().int().positive().nullable().optional(),
  taux_tva: z.enum(["STANDARD", "REDUIT", "EXONERE"]).optional(),
  categorie_id: z.string().optional(),
  gerer_stock: z.boolean().optional(),
  stock_actuel: z.number().int().nonnegative().nullable().optional(),
  stock_min: z.number().int().nonnegative().nullable().optional(),
  stock_max: z.number().int().nonnegative().nullable().optional(),
  unite: z.string().max(20).nullable().optional(),
  disponible_direct: z.boolean().optional(),
  disponible_table: z.boolean().optional(),
  disponible_livraison: z.boolean().optional(),
  disponible_emporter: z.boolean().optional(),
  actif: z.boolean().optional(),
}).strict();

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
    serialized.supplements = serialized.supplements_produits.map((sup: Record<string, unknown>) => ({
      ...sup,
      prix: sup.prix !== undefined ? Number(sup.prix) : null,
    }));
  }
  return serialized as T;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const etablissementId = await getEtablissementId();
    const { id } = await params;
    const supabase = await createClient();

    const { data: produit } = await supabase
      .from("produits")
      .select(`*, categories(id, nom, couleur, icone), supplements_produits(id, nom, prix)`)
      .eq("id", id)
      .eq("etablissement_id", etablissementId)
      .single();

    if (!produit) {
      return NextResponse.json({ success: false, error: "Produit non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: serializeProduit(produit) });
  } catch (error) {
    console.error("GET /api/produits/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération du produit" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const etablissementId = await getEtablissementId();
    const { id } = await params;
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

    // Vérifier que le produit existe
    const { data: existing } = await supabase
      .from("produits")
      .select("id")
      .eq("id", id)
      .eq("etablissement_id", etablissementId)
      .single();

    if (!existing) {
      return NextResponse.json({ success: false, error: "Produit non trouvé" }, { status: 404 });
    }

    // Vérifier l'unicité du nom
    const { data: duplicate } = await supabase
      .from("produits")
      .select("id")
      .eq("etablissement_id", etablissementId)
      .eq("nom", data.nom)
      .eq("categorie_id", data.categorieId)
      .neq("id", id)
      .single();

    if (duplicate) {
      return NextResponse.json(
        { success: false, error: "Un produit avec ce nom existe déjà dans cette catégorie" },
        { status: 409 }
      );
    }

    const { data: produit, error } = await supabase
      .from("produits")
      .update({
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
      })
      .eq("id", id)
      .select(`*, categories(id, nom, couleur, icone)`)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: serializeProduit(produit) });
  } catch (error) {
    console.error("PUT /api/produits/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise à jour du produit" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verification d'authentification
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Non authentifie" },
        { status: 401 }
      );
    }

    // 2. Verification du role (SUPER_ADMIN, ADMIN, MANAGER uniquement)
    if (!PRODUCT_WRITE_ROLES.includes(session.role)) {
      return NextResponse.json(
        { success: false, error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    const etablissementId = await getEtablissementId();
    const { id } = await params;

    // 3. Validation de l'ID (UUID ou CUID)
    if (!isValidId(id)) {
      return NextResponse.json(
        { success: false, error: "Identifiant invalide" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // 4. Validation stricte du body avec Zod (.strict() rejette les champs inconnus)
    const validation = produitPatchSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Donnees invalides", details: validation.error.issues },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // 5. Verifier que le body valide contient au moins un champ
    if (Object.keys(validatedData).length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucun champ a mettre a jour" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 6. Verifier que le produit existe et appartient a l'etablissement
    const { data: existing } = await supabase
      .from("produits")
      .select("id")
      .eq("id", id)
      .eq("etablissement_id", etablissementId)
      .single();

    if (!existing) {
      return NextResponse.json({ success: false, error: "Produit non trouve" }, { status: 404 });
    }

    // 7. Mise a jour avec les donnees validees uniquement
    const { data: produit, error } = await supabase
      .from("produits")
      .update({ ...validatedData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(`*, categories(id, nom, couleur, icone)`)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: serializeProduit(produit) });
  } catch (error) {
    console.error("PATCH /api/produits/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise a jour du produit" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const etablissementId = await getEtablissementId();
    const { id } = await params;
    const supabase = await createClient();

    // Vérifier que le produit existe
    const { data: produit } = await supabase
      .from("produits")
      .select("id")
      .eq("id", id)
      .eq("etablissement_id", etablissementId)
      .single();

    if (!produit) {
      return NextResponse.json({ success: false, error: "Produit non trouvé" }, { status: 404 });
    }

    // Vérifier qu'il n'y a pas de ventes associées
    const { count } = await supabase
      .from("lignes_vente")
      .select("*", { count: "exact", head: true })
      .eq("produit_id", id);

    if (count && count > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Impossible de supprimer ce produit car il a été vendu ${count} fois. Désactivez-le plutôt.`,
        },
        { status: 409 }
      );
    }

    // Supprimer les suppléments
    await supabase.from("supplements_produits").delete().eq("produit_id", id);

    // Supprimer le produit
    const { error } = await supabase.from("produits").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/produits/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la suppression du produit" },
      { status: 500 }
    );
  }
}
