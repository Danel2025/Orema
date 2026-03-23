/**
 * Requêtes Supabase pour les clients
 */

import type { DbClient } from "../client";
import type {
  Client,
  ClientInsert,
  ClientUpdate,
  PaginationOptions,
  PaginatedResult,
} from "../types";
import {
  getPaginationParams,
  createPaginatedResult,
  getErrorMessage,
  serializePrices,
  PRICE_FIELDS,
} from "../utils";
import { sanitizeSearchTerm } from "@/lib/utils/sanitize";

const CLIENT_PRICE_FIELDS = PRICE_FIELDS.clients;

/**
 * Récupère tous les clients d'un établissement
 */
export async function getClients(
  client: DbClient,
  etablissementId: string,
  options?: {
    actif?: boolean;
    search?: string;
  }
): Promise<Client[]> {
  let query = client
    .from("clients")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .order("nom", { ascending: true });

  if (options?.actif !== undefined) {
    query = query.eq("actif", options.actif);
  }

  if (options?.search) {
    const cleanSearch = sanitizeSearchTerm(options.search);
    if (cleanSearch) {
      query = query.or(
        `nom.ilike.%${cleanSearch}%,prenom.ilike.%${cleanSearch}%,telephone.ilike.%${cleanSearch}%,email.ilike.%${cleanSearch}%`
      );
    }
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return (data ?? []).map((row) => serializePrices(row, [...CLIENT_PRICE_FIELDS]));
}

/**
 * Récupère les clients paginés
 */
export async function getClientsPaginated(
  client: DbClient,
  etablissementId: string,
  options?: PaginationOptions & {
    actif?: boolean;
    search?: string;
    sortBy?: "nom" | "created_at" | "points_fidelite";
    sortOrder?: "asc" | "desc";
  }
): Promise<PaginatedResult<Client>> {
  const { offset, limit, page, pageSize } = getPaginationParams(options);
  const sortBy = options?.sortBy ?? "nom";
  const sortOrder = options?.sortOrder ?? "asc";

  let query = client
    .from("clients")
    .select("*", { count: "exact" })
    .eq("etablissement_id", etablissementId)
    .order(sortBy, { ascending: sortOrder === "asc" })
    .range(offset, offset + limit - 1);

  if (options?.actif !== undefined) {
    query = query.eq("actif", options.actif);
  }

  if (options?.search) {
    const cleanSearch = sanitizeSearchTerm(options.search);
    if (cleanSearch) {
      query = query.or(
        `nom.ilike.%${cleanSearch}%,prenom.ilike.%${cleanSearch}%,telephone.ilike.%${cleanSearch}%,email.ilike.%${cleanSearch}%`
      );
    }
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  const serialized = (data ?? []).map((row) => serializePrices(row, [...CLIENT_PRICE_FIELDS]));
  return createPaginatedResult(serialized, count ?? 0, { page, pageSize });
}

/**
 * Récupère un client par son ID
 */
export async function getClientById(client: DbClient, id: string): Promise<Client | null> {
  const { data, error } = await client.from("clients").select("*").eq("id", id).single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(getErrorMessage(error));
  }

  return serializePrices(data, [...CLIENT_PRICE_FIELDS]);
}

/**
 * Recherche un client par téléphone
 */
export async function getClientByTelephone(
  client: DbClient,
  etablissementId: string,
  telephone: string
): Promise<Client | null> {
  const { data, error } = await client
    .from("clients")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .eq("telephone", telephone)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(getErrorMessage(error));
  }

  return serializePrices(data, [...CLIENT_PRICE_FIELDS]);
}

/**
 * Crée un nouveau client
 */
export async function createClient(client: DbClient, data: ClientInsert): Promise<Client> {
  const { data: newClient, error } = await client.from("clients").insert(data).select().single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return serializePrices(newClient, [...CLIENT_PRICE_FIELDS]);
}

/**
 * Met à jour un client
 */
export async function updateClient(
  client: DbClient,
  id: string,
  data: ClientUpdate
): Promise<Client> {
  const { data: updated, error } = await client
    .from("clients")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return serializePrices(updated, [...CLIENT_PRICE_FIELDS]);
}

/**
 * Supprime un client (soft delete via actif=false)
 */
export async function deleteClient(client: DbClient, id: string): Promise<void> {
  const { error } = await client
    .from("clients")
    .update({ actif: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Met à jour les points de fidélité d'un client
 */
export async function updateClientPoints(
  client: DbClient,
  id: string,
  pointsToAdd: number
): Promise<Client> {
  // Récupérer les points actuels
  const currentClient = await getClientById(client, id);
  if (!currentClient) {
    throw new Error("Client non trouvé");
  }

  const newPoints = currentClient.points_fidelite + pointsToAdd;

  return updateClient(client, id, { points_fidelite: newPoints });
}

/**
 * Met à jour le solde prépayé d'un client
 */
export async function updateClientSoldePrepaye(
  client: DbClient,
  id: string,
  montant: number
): Promise<Client> {
  const currentClient = await getClientById(client, id);
  if (!currentClient) {
    throw new Error("Client non trouvé");
  }

  const newSolde = currentClient.solde_prepaye + montant;

  return updateClient(client, id, { solde_prepaye: newSolde });
}

/**
 * Met à jour le solde crédit d'un client
 */
export async function updateClientSoldeCredit(
  client: DbClient,
  id: string,
  montant: number
): Promise<Client> {
  const currentClient = await getClientById(client, id);
  if (!currentClient) {
    throw new Error("Client non trouvé");
  }

  const newSolde = currentClient.solde_credit + montant;

  return updateClient(client, id, { solde_credit: newSolde });
}

/**
 * Compte le nombre de clients
 */
export async function countClients(
  client: DbClient,
  etablissementId: string,
  options?: { actif?: boolean }
): Promise<number> {
  let query = client
    .from("clients")
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
