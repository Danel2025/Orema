"use server";

/**
 * Server Actions pour la gestion des suppléments de produits
 * Migré vers Supabase
 */

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/db";
import { getEtablissementId } from "@/lib/etablissement";
import { z } from "zod";

const supplementSchema = z.object({
  nom: z.string().min(1, "Le nom est requis").max(50, "50 caractères maximum"),
  prix: z.coerce
    .number()
    .min(0, "Le prix doit être positif ou nul")
    .int("Le prix doit être un entier"),
});

export type SupplementFormData = z.infer<typeof supplementSchema>;

/**
 * Récupère les suppléments d'un produit
 */
export async function getSupplements(produitId: string) {
  const etablissementId = await getEtablissementId();
  const supabase = createServiceClient();

  const { data: produit } = await supabase
    .from("produits")
    .select("id")
    .eq("id", produitId)
    .eq("etablissement_id", etablissementId)
    .single();

  if (!produit) return { success: false, error: "Produit non trouvé" };

  const { data: supplements } = await supabase
    .from("supplements_produits")
    .select("*")
    .eq("produit_id", produitId)
    .order("nom", { ascending: true });

  return {
    success: true,
    data: (supplements || []).map((s) => ({ ...s, prix: Number(s.prix) })),
  };
}

/**
 * Crée un nouveau supplément pour un produit
 */
export async function createSupplement(produitId: string, data: SupplementFormData) {
  try {
    const etablissementId = await getEtablissementId();
    const validation = supplementSchema.safeParse(data);
    if (!validation.success)
      return { success: false, error: validation.error.issues[0]?.message || "Données invalides" };

    const supabase = createServiceClient();

    const { data: produit } = await supabase
      .from("produits")
      .select("id")
      .eq("id", produitId)
      .eq("etablissement_id", etablissementId)
      .single();

    if (!produit) return { success: false, error: "Produit non trouvé" };

    const { data: existing } = await supabase
      .from("supplements_produits")
      .select("id")
      .eq("produit_id", produitId)
      .eq("nom", validation.data.nom)
      .single();

    if (existing) return { success: false, error: "Un supplément avec ce nom existe déjà" };

    const { data: supplement, error } = await supabase
      .from("supplements_produits")
      .insert({ nom: validation.data.nom, prix: validation.data.prix, produit_id: produitId })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/produits");
    return { success: true, data: { ...supplement, prix: Number(supplement.prix) } };
  } catch (error) {
    console.error("Erreur création supplément:", error);
    return { success: false, error: "Erreur lors de la création" };
  }
}

/**
 * Met à jour un supplément
 */
export async function updateSupplement(id: string, data: SupplementFormData) {
  try {
    const etablissementId = await getEtablissementId();
    const validation = supplementSchema.safeParse(data);
    if (!validation.success)
      return { success: false, error: validation.error.issues[0]?.message || "Données invalides" };

    const supabase = createServiceClient();

    const { data: existing } = await supabase
      .from("supplements_produits")
      .select("*, produits!inner(etablissement_id)")
      .eq("id", id)
      .single();

    if (
      !existing ||
      (existing.produits as { etablissement_id: string }).etablissement_id !== etablissementId
    ) {
      return { success: false, error: "Supplément non trouvé" };
    }

    const { data: duplicate } = await supabase
      .from("supplements_produits")
      .select("id")
      .eq("produit_id", existing.produit_id)
      .eq("nom", validation.data.nom)
      .neq("id", id)
      .single();

    if (duplicate) return { success: false, error: "Un supplément avec ce nom existe déjà" };

    const { data: supplement, error } = await supabase
      .from("supplements_produits")
      .update({ nom: validation.data.nom, prix: validation.data.prix })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/produits");
    return { success: true, data: { ...supplement, prix: Number(supplement.prix) } };
  } catch (error) {
    console.error("Erreur mise à jour supplément:", error);
    return { success: false, error: "Erreur lors de la mise à jour" };
  }
}

/**
 * Supprime un supplément
 */
export async function deleteSupplement(id: string) {
  try {
    const etablissementId = await getEtablissementId();
    const supabase = createServiceClient();

    const { data: existing } = await supabase
      .from("supplements_produits")
      .select("*, produits!inner(etablissement_id)")
      .eq("id", id)
      .single();

    if (
      !existing ||
      (existing.produits as { etablissement_id: string }).etablissement_id !== etablissementId
    ) {
      return { success: false, error: "Supplément non trouvé" };
    }

    await supabase.from("supplements_produits").delete().eq("id", id);

    revalidatePath("/produits");
    return { success: true };
  } catch (error) {
    console.error("Erreur suppression supplément:", error);
    return { success: false, error: "Erreur lors de la suppression" };
  }
}
