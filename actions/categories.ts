"use server";

/**
 * Server Actions pour la gestion des catégories
 * Migré de Prisma vers Supabase
 */

import { revalidatePath } from "next/cache";
import { createAuthenticatedClient, db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { categorieSchema, type CategorieFormData } from "@/schemas/categorie.schema";

/**
 * Récupère toutes les catégories de l'établissement
 */
export async function getCategories(options?: { includeInactive?: boolean }) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) return [];
  const etablissementId = user.etablissementId;
  const supabase = await createAuthenticatedClient({ userId: user.userId, etablissementId, role: user.role });

  const categories = await db.getCategories(supabase, etablissementId, {
    actif: options?.includeInactive ? undefined : true,
  });

  // Récupérer le count des produits pour chaque catégorie
  const categoriesWithCount = await Promise.all(
    categories.map(async (cat) => {
      const count = await db.countProduits(supabase, etablissementId, {
        categorieId: cat.id,
      });
      return {
        ...cat,
        _count: { produits: count },
      };
    })
  );

  return categoriesWithCount;
}

/**
 * Récupère une catégorie par son ID
 */
export async function getCategorieById(id: string) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) return null;
  const etablissementId = user.etablissementId;
  const supabase = await createAuthenticatedClient({ userId: user.userId, etablissementId, role: user.role });

  const categorie = await db.getCategorieById(supabase, id);

  if (!categorie) {
    return null;
  }

  // Récupérer le count des produits
  const count = await db.countProduits(supabase, etablissementId, {
    categorieId: id,
  });

  return {
    ...categorie,
    _count: { produits: count },
  };
}

/**
 * Crée une nouvelle catégorie
 */
export async function createCategorie(data: CategorieFormData) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) return { success: false, error: "Vous devez être connecté" };
    const etablissementId = user.etablissementId;
    const supabase = await createAuthenticatedClient({ userId: user.userId, etablissementId, role: user.role });

    // Validation
    const validationResult = categorieSchema.safeParse(data);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError?.message || "Données invalides",
      };
    }
    const validatedData = validationResult.data;

    // Vérifier l'unicité du nom
    const existingCategories = await db.getCategories(supabase, etablissementId);
    const existing = existingCategories.find(
      (cat) => cat.nom.toLowerCase() === validatedData.nom.toLowerCase()
    );

    if (existing) {
      return {
        success: false,
        error: "Une catégorie avec ce nom existe déjà",
      };
    }

    // Déterminer l'ordre (dernier + 1)
    const lastOrdre = existingCategories.length > 0
      ? Math.max(...existingCategories.map((c) => c.ordre))
      : 0;

    const ordre = validatedData.ordre || lastOrdre + 1;

    // Créer la catégorie
    const categorie = await db.createCategorie(supabase, {
      nom: validatedData.nom,
      couleur: validatedData.couleur,
      icone: validatedData.icone,
      ordre,
      actif: validatedData.actif,
      imprimante_id: validatedData.imprimanteId,
      etablissement_id: etablissementId,
    });

    revalidatePath("/produits");

    return {
      success: true,
      data: categorie,
    };
  } catch (error) {
    console.error("Erreur lors de la création de la catégorie:", error);
    return {
      success: false,
      error: "Erreur lors de la création de la catégorie",
    };
  }
}

/**
 * Met à jour une catégorie
 */
export async function updateCategorie(id: string, data: CategorieFormData) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) return { success: false, error: "Vous devez être connecté" };
    const etablissementId = user.etablissementId;
    const supabase = await createAuthenticatedClient({ userId: user.userId, etablissementId, role: user.role });

    // Validation
    const validatedData = categorieSchema.parse(data);

    // Vérifier que la catégorie existe (RLS filtre par établissement)
    const existing = await db.getCategorieById(supabase, id);

    if (!existing) {
      return {
        success: false,
        error: "Catégorie non trouvée",
      };
    }

    // Vérifier l'unicité du nom (sauf pour la catégorie actuelle)
    const allCategories = await db.getCategories(supabase, etablissementId);
    const duplicate = allCategories.find(
      (cat) =>
        cat.id !== id &&
        cat.nom.toLowerCase() === validatedData.nom.toLowerCase()
    );

    if (duplicate) {
      return {
        success: false,
        error: "Une catégorie avec ce nom existe déjà",
      };
    }

    // Mettre à jour
    const categorie = await db.updateCategorie(supabase, id, {
      nom: validatedData.nom,
      couleur: validatedData.couleur,
      icone: validatedData.icone,
      ordre: validatedData.ordre,
      actif: validatedData.actif,
      imprimante_id: validatedData.imprimanteId,
    });

    revalidatePath("/produits");

    return {
      success: true,
      data: categorie,
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la catégorie:", error);
    return {
      success: false,
      error: "Erreur lors de la mise à jour de la catégorie",
    };
  }
}

/**
 * Supprime une catégorie
 */
export async function deleteCategorie(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) return { success: false, error: "Vous devez être connecté" };
    const etablissementId = user.etablissementId;
    const supabase = await createAuthenticatedClient({ userId: user.userId, etablissementId, role: user.role });

    // Vérifier que la catégorie existe (RLS filtre par établissement)
    const categorie = await db.getCategorieById(supabase, id);

    if (!categorie) {
      return {
        success: false,
        error: "Catégorie non trouvée",
      };
    }

    // Vérifier qu'il n'y a pas de produits associés
    const produitsCount = await db.countProduits(supabase, etablissementId, {
      categorieId: id,
    });

    if (produitsCount > 0) {
      return {
        success: false,
        error: `Impossible de supprimer cette catégorie car elle contient ${produitsCount} produit(s). Déplacez ou supprimez les produits d'abord.`,
      };
    }

    // Supprimer
    await db.deleteCategorie(supabase, id);

    revalidatePath("/produits");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erreur lors de la suppression de la catégorie:", error);
    return {
      success: false,
      error: "Erreur lors de la suppression de la catégorie",
    };
  }
}

/**
 * Réorganise les catégories (drag & drop)
 */
export async function reorderCategories(orderedIds: string[]) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) return { success: false, error: "Vous devez être connecté" };
    const etablissementId = user.etablissementId;
    const supabase = await createAuthenticatedClient({ userId: user.userId, etablissementId, role: user.role });

    // Vérifier que toutes les catégories appartiennent à l'établissement
    const categories = await db.getCategories(supabase, etablissementId);
    const categoryIds = new Set(categories.map((c) => c.id));

    const validIds = orderedIds.filter((id) => categoryIds.has(id));

    // Mettre à jour l'ordre de chaque catégorie
    await db.updateCategoriesOrder(
      supabase,
      validIds.map((id, index) => ({ id, ordre: index + 1 }))
    );

    revalidatePath("/produits");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erreur lors de la réorganisation des catégories:", error);
    return {
      success: false,
      error: "Erreur lors de la réorganisation des catégories",
    };
  }
}

/**
 * Active/désactive une catégorie
 */
export async function toggleCategorieActif(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) return { success: false, error: "Vous devez être connecté" };
    const supabase = await createAuthenticatedClient({ userId: user.userId, etablissementId: user.etablissementId, role: user.role });

    const categorie = await db.getCategorieById(supabase, id);

    if (!categorie) {
      return {
        success: false,
        error: "Catégorie non trouvée",
      };
    }

    const updated = await db.updateCategorie(supabase, id, {
      actif: !categorie.actif,
    });

    revalidatePath("/produits");

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    console.error("Erreur lors du toggle de la catégorie:", error);
    return {
      success: false,
      error: "Erreur lors de la modification de la catégorie",
    };
  }
}

/**
 * Récupère les imprimantes disponibles
 */
export async function getImprimantes() {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) return [];
  const etablissementId = user.etablissementId;
  const supabase = await createAuthenticatedClient({ userId: user.userId, etablissementId, role: user.role });

  const imprimantes = await db.getImprimantes(supabase, etablissementId, {
    actif: true,
  });

  return imprimantes.map((imp) => ({
    id: imp.id,
    nom: imp.nom,
    type: imp.type,
  }));
}
