"use server";

/**
 * Server Actions pour le chargement des donnees de seed/template
 * Permet aux admins de peupler un etablissement avec des categories
 * et produits types pour un restaurant gabonais.
 */

import { revalidatePath } from "next/cache";
import { createServiceClient, db } from "@/lib/db";
import type { TauxTva } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SEED_CATEGORIES, getSeedPreview } from "@/lib/data/seed-templates";

function getTauxTvaEnum(taux: number): TauxTva {
  if (taux === 0) return "EXONERE";
  if (taux === 10) return "REDUIT";
  return "STANDARD";
}

/**
 * Charge les donnees de seed dans un etablissement.
 * Verifie les doublons : ne cree que ce qui n'existe pas deja.
 */
export async function loadSeedData(etablissementId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Vous devez être connecté" };
    }
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return { success: false, error: "Permissions insuffisantes. Rôle ADMIN ou SUPER_ADMIN requis." };
    }

    const supabase = createServiceClient();

    // Recuperer les categories existantes pour cet etablissement
    const existingCategories = await db.getCategories(supabase, etablissementId);
    const existingCategoriesMap = new Map(
      existingCategories.map((c) => [c.nom.toLowerCase(), c])
    );

    let categoriesCreated = 0;
    let produitsCreated = 0;

    for (const seedCat of SEED_CATEGORIES) {
      let categorieId: string;
      const existingCat = existingCategoriesMap.get(seedCat.nom.toLowerCase());

      if (existingCat) {
        // La categorie existe deja, on utilise son ID
        categorieId = existingCat.id;
      } else {
        // Creer la categorie
        const newCat = await db.createCategorie(supabase, {
          nom: seedCat.nom,
          couleur: seedCat.couleur,
          ordre: seedCat.ordre,
          actif: true,
          etablissement_id: etablissementId,
        });
        categorieId = newCat.id;
        categoriesCreated++;
      }

      // Recuperer les produits existants de cette categorie
      const existingProduits = await db.getProduits(supabase, etablissementId, {
        categorieId: categorieId,
      });
      const existingProduitsSet = new Set(
        existingProduits.map((p) => p.nom.toLowerCase())
      );

      // Creer les produits manquants
      for (const seedProd of seedCat.produits) {
        if (!existingProduitsSet.has(seedProd.nom.toLowerCase())) {
          await db.createProduit(supabase, {
            nom: seedProd.nom,
            prix_vente: seedProd.prix_vente,
            taux_tva: getTauxTvaEnum(seedProd.taux_tva),
            categorie_id: categorieId,
            etablissement_id: etablissementId,
            actif: seedProd.disponible,
            disponible_direct: true,
            disponible_table: true,
            disponible_livraison: true,
            disponible_emporter: true,
          });
          produitsCreated++;
        }
      }
    }

    revalidatePath("/produits");

    return {
      success: true,
      categoriesCreated,
      produitsCreated,
    };
  } catch (error) {
    console.error("[loadSeedData] Erreur:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors du chargement des données",
    };
  }
}

/**
 * Supprime toutes les categories et produits de l'etablissement,
 * puis recharge les donnees de seed.
 */
export async function resetAndLoadSeedData(etablissementId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Vous devez être connecté" };
    }
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return { success: false, error: "Permissions insuffisantes. Rôle ADMIN ou SUPER_ADMIN requis." };
    }

    const supabase = createServiceClient();

    // Supprimer tous les produits de l'etablissement
    const { error: produitsError } = await supabase
      .from("produits")
      .delete()
      .eq("etablissement_id", etablissementId);

    if (produitsError) {
      throw new Error(`Erreur suppression produits: ${produitsError.message}`);
    }

    // Supprimer toutes les categories de l'etablissement
    const { error: categoriesError } = await supabase
      .from("categories")
      .delete()
      .eq("etablissement_id", etablissementId);

    if (categoriesError) {
      throw new Error(`Erreur suppression catégories: ${categoriesError.message}`);
    }

    // Recharger les donnees de seed
    const result = await loadSeedData(etablissementId);

    return result;
  } catch (error) {
    console.error("[resetAndLoadSeedData] Erreur:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la réinitialisation des données",
    };
  }
}

/**
 * Retourne un apercu des donnees de seed disponibles.
 * Ne necessite pas d'authentification (lecture seule des templates).
 */
export async function getSeedDataPreview() {
  return getSeedPreview();
}
