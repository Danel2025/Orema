/**
 * Requêtes Supabase pour les catégories
 */

import type { DbClient } from "../client";
import type {
  Categorie,
  CategorieInsert,
  CategorieUpdate,
  CategorieWithRelations,
  PaginationOptions,
  PaginatedResult,
} from "../types";
import { getPaginationParams, createPaginatedResult, getErrorMessage } from "../utils";

/**
 * Récupère toutes les catégories d'un établissement
 */
export async function getCategories(
  client: DbClient,
  etablissementId: string,
  options?: {
    actif?: boolean;
    withProduits?: boolean;
    withImprimante?: boolean;
  }
): Promise<Categorie[]> {
  let query = client
    .from("categories")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .order("ordre", { ascending: true });

  if (options?.actif !== undefined) {
    query = query.eq("actif", options.actif);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return (data ?? []) as Categorie[];
}

/**
 * Récupère les catégories paginées
 */
export async function getCategoriesPaginated(
  client: DbClient,
  etablissementId: string,
  options?: PaginationOptions & { actif?: boolean }
): Promise<PaginatedResult<Categorie>> {
  const { offset, limit, page, pageSize } = getPaginationParams(options);

  let query = client
    .from("categories")
    .select("*", { count: "exact" })
    .eq("etablissement_id", etablissementId)
    .order("ordre", { ascending: true })
    .range(offset, offset + limit - 1);

  if (options?.actif !== undefined) {
    query = query.eq("actif", options.actif);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return createPaginatedResult(data ?? [], count ?? 0, { page, pageSize });
}

/**
 * Récupère une catégorie par son ID
 */
export async function getCategorieById(
  client: DbClient,
  id: string,
  options?: { withProduits?: boolean; withImprimante?: boolean }
): Promise<CategorieWithRelations | null> {
  const { data, error } = await client.from("categories").select("*").eq("id", id).single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw new Error(getErrorMessage(error));
  }

  return data as CategorieWithRelations;
}

/**
 * Crée une nouvelle catégorie
 */
export async function createCategorie(client: DbClient, data: CategorieInsert): Promise<Categorie> {
  const { data: categorie, error } = await client.from("categories").insert(data).select().single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return categorie;
}

/**
 * Met à jour une catégorie
 */
export async function updateCategorie(
  client: DbClient,
  id: string,
  data: CategorieUpdate
): Promise<Categorie> {
  const { data: categorie, error } = await client
    .from("categories")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return categorie;
}

/**
 * Supprime une catégorie
 */
export async function deleteCategorie(client: DbClient, id: string): Promise<void> {
  const { error } = await client.from("categories").delete().eq("id", id);

  if (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Met à jour l'ordre des catégories
 */
export async function updateCategoriesOrder(
  client: DbClient,
  categories: { id: string; ordre: number }[]
): Promise<void> {
  for (const { id, ordre } of categories) {
    const { error } = await client
      .from("categories")
      .update({ ordre, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      throw new Error(getErrorMessage(error));
    }
  }
}

/**
 * Récupère les catégories avec le nombre de produits en une seule requête
 * Résout le problème N+1 de getCategories + countProduits par catégorie
 */
export async function getCategoriesWithProductCount(
  client: DbClient,
  etablissementId: string,
  options?: { actif?: boolean }
): Promise<(Categorie & { _count: { produits: number } })[]> {
  let query = client
    .from("categories")
    .select("*, produits(count)")
    .eq("etablissement_id", etablissementId)
    .order("ordre", { ascending: true });

  if (options?.actif !== undefined) {
    query = query.eq("actif", options.actif);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return (data ?? []).map((cat) => {
    const { produits, ...rest } = cat as Categorie & { produits: { count: number }[] };
    return {
      ...rest,
      _count: { produits: produits?.[0]?.count ?? 0 },
    };
  });
}

/**
 * Recherche une catégorie par nom exact (case-insensitive)
 * Utilisé pour la vérification d'unicité sans charger toutes les catégories
 */
export async function findCategorieByNom(
  client: DbClient,
  etablissementId: string,
  nom: string,
  excludeId?: string
): Promise<Categorie | null> {
  let query = client
    .from("categories")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .ilike("nom", nom);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.limit(1);

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  if (!data || data.length === 0) return null;
  return data[0] as Categorie;
}

/**
 * Compte le nombre de catégories
 */
export async function countCategories(
  client: DbClient,
  etablissementId: string,
  options?: { actif?: boolean }
): Promise<number> {
  let query = client
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("etablissement_id", etablissementId);

  if (options?.actif !== undefined) {
    query = query.eq("actif", options.actif);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return count ?? 0;
}
