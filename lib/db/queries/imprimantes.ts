/**
 * Requêtes Supabase pour les imprimantes
 */

import type { DbClient } from "../client";
import type {
  Imprimante,
  ImprimanteInsert,
  ImprimanteUpdate,
  TypeImprimante,
  TypeConnexion,
} from "../types";
import { getErrorMessage } from "../utils";

/**
 * Récupère toutes les imprimantes d'un établissement
 */
export async function getImprimantes(
  client: DbClient,
  etablissementId: string,
  options?: {
    actif?: boolean;
    type?: TypeImprimante;
    typeConnexion?: TypeConnexion;
  }
): Promise<Imprimante[]> {
  let query = client
    .from("imprimantes")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .order("nom", { ascending: true });

  if (options?.actif !== undefined) {
    query = query.eq("actif", options.actif);
  }

  if (options?.type) {
    query = query.eq("type", options.type);
  }

  if (options?.typeConnexion) {
    query = query.eq("type_connexion", options.typeConnexion);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return data ?? [];
}

/**
 * Récupère une imprimante par son ID
 */
export async function getImprimanteById(client: DbClient, id: string): Promise<Imprimante | null> {
  const { data, error } = await client.from("imprimantes").select("*").eq("id", id).single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(getErrorMessage(error));
  }

  return data;
}

/**
 * Récupère l'imprimante ticket (principale)
 */
export async function getImprimanteTicket(
  client: DbClient,
  etablissementId: string
): Promise<Imprimante | null> {
  const { data, error } = await client
    .from("imprimantes")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .eq("type", "TICKET")
    .eq("actif", true)
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(getErrorMessage(error));
  }

  return data;
}

/**
 * Récupère les imprimantes cuisine actives
 */
export async function getImprimantesCuisine(
  client: DbClient,
  etablissementId: string
): Promise<Imprimante[]> {
  return getImprimantes(client, etablissementId, {
    actif: true,
    type: "CUISINE",
  });
}

/**
 * Récupère les imprimantes bar actives
 */
export async function getImprimantesBar(
  client: DbClient,
  etablissementId: string
): Promise<Imprimante[]> {
  return getImprimantes(client, etablissementId, {
    actif: true,
    type: "BAR",
  });
}

/**
 * Crée une nouvelle imprimante
 */
export async function createImprimante(
  client: DbClient,
  data: ImprimanteInsert
): Promise<Imprimante> {
  const { data: imprimante, error } = await client
    .from("imprimantes")
    .insert(data)
    .select()
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return imprimante;
}

/**
 * Met à jour une imprimante
 */
export async function updateImprimante(
  client: DbClient,
  id: string,
  data: ImprimanteUpdate
): Promise<Imprimante> {
  const { data: imprimante, error } = await client
    .from("imprimantes")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return imprimante;
}

/**
 * Supprime une imprimante
 */
export async function deleteImprimante(client: DbClient, id: string): Promise<void> {
  const { error } = await client.from("imprimantes").delete().eq("id", id);

  if (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Active/désactive une imprimante
 */
export async function toggleImprimante(
  client: DbClient,
  id: string,
  actif: boolean
): Promise<Imprimante> {
  return updateImprimante(client, id, { actif });
}

/**
 * Vérifie si un nom d'imprimante existe déjà
 */
export async function imprimanteNomExists(
  client: DbClient,
  etablissementId: string,
  nom: string,
  excludeId?: string
): Promise<boolean> {
  let query = client
    .from("imprimantes")
    .select("id", { count: "exact", head: true })
    .eq("etablissement_id", etablissementId)
    .eq("nom", nom);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { count } = await query;

  return (count ?? 0) > 0;
}

/**
 * Compte les imprimantes par type
 */
export async function countImprimantesByType(
  client: DbClient,
  etablissementId: string
): Promise<Record<TypeImprimante, number>> {
  const { data, error } = await client
    .from("imprimantes")
    .select("type")
    .eq("etablissement_id", etablissementId)
    .eq("actif", true);

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  const counts: Record<TypeImprimante, number> = {
    TICKET: 0,
    CUISINE: 0,
    BAR: 0,
  };

  for (const imp of data ?? []) {
    counts[imp.type as keyof typeof counts]++;
  }

  return counts;
}
