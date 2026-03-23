// @ts-nocheck — Tables pas encore dans types/supabase.ts (migrations non appliquées). Supprimer après `pnpm db:types`.
/**
 * Requêtes Supabase pour l'historique des changements de prix
 */

import type { DbClient } from "../client";
import type { PaginationOptions, PaginatedResult } from "../types";
import {
  getPaginationParams,
  createPaginatedResult,
  getErrorMessage,
  serializePrices,
} from "../utils";

const HISTORIQUE_PRIX_FIELDS = [
  "ancien_prix",
  "nouveau_prix",
] as const;

/**
 * Récupère l'historique des prix paginé avec filtres optionnels
 */
export async function getHistoriquePrix(
  client: DbClient,
  etablissementId: string,
  options?: PaginationOptions & {
    produitId?: string;
    dateDebut?: string;
    dateFin?: string;
  }
): Promise<PaginatedResult<Record<string, unknown>>> {
  const { offset, limit, page, pageSize } = getPaginationParams(options);

  let query = client
    .from("historique_prix")
    .select("*, produits(nom)", { count: "exact" })
    .eq("etablissement_id", etablissementId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (options?.produitId) {
    query = query.eq("produit_id", options.produitId);
  }

  if (options?.dateDebut) {
    query = query.gte("created_at", options.dateDebut);
  }

  if (options?.dateFin) {
    query = query.lte("created_at", options.dateFin);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  const serialized = (data ?? []).map((row) =>
    serializePrices(row, [...HISTORIQUE_PRIX_FIELDS])
  );

  return createPaginatedResult(serialized, count ?? 0, { page, pageSize });
}

/**
 * Crée une entrée dans l'historique des prix
 */
export async function createHistoriquePrix(
  client: DbClient,
  data: {
    produit_id: string;
    etablissement_id: string;
    ancien_prix: number;
    nouveau_prix: number;
    modifie_par: string;
    raison?: string;
  }
) {
  const { data: historique, error } = await client
    .from("historique_prix")
    .insert(data)
    .select()
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return serializePrices(historique, [...HISTORIQUE_PRIX_FIELDS]);
}

/**
 * Récupère l'historique des prix d'un produit spécifique
 */
export async function getHistoriquePrixProduit(
  client: DbClient,
  produitId: string
) {
  const { data, error } = await client
    .from("historique_prix")
    .select("*")
    .eq("produit_id", produitId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return (data ?? []).map((row) =>
    serializePrices(row, [...HISTORIQUE_PRIX_FIELDS])
  );
}
