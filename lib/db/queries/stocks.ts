/**
 * Requêtes Supabase pour les mouvements de stock
 */

import type { DbClient } from "../client";
import type {
  MouvementStock,
  MouvementStockInsert,
  TypeMouvement,
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

const STOCK_PRICE_FIELDS = PRICE_FIELDS.mouvements_stock;

/**
 * Récupère les mouvements de stock d'un produit
 */
export async function getMouvementsStock(
  client: DbClient,
  produitId: string,
  options?: {
    type?: TypeMouvement;
    dateDebut?: string;
    dateFin?: string;
  }
): Promise<MouvementStock[]> {
  let query = client
    .from("mouvements_stock")
    .select("*")
    .eq("produit_id", produitId)
    .order("created_at", { ascending: false });

  if (options?.type) {
    query = query.eq("type", options.type);
  }

  if (options?.dateDebut) {
    query = query.gte("created_at", options.dateDebut);
  }

  if (options?.dateFin) {
    query = query.lte("created_at", options.dateFin);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return (data ?? []).map((row) => serializePrices(row, [...STOCK_PRICE_FIELDS]));
}

/**
 * Récupère les mouvements de stock paginés
 */
export async function getMouvementsStockPaginated(
  client: DbClient,
  produitId: string,
  options?: PaginationOptions & {
    type?: TypeMouvement;
    dateDebut?: string;
    dateFin?: string;
  }
): Promise<PaginatedResult<MouvementStock>> {
  const { offset, limit, page, pageSize } = getPaginationParams(options);

  let query = client
    .from("mouvements_stock")
    .select("*", { count: "exact" })
    .eq("produit_id", produitId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (options?.type) {
    query = query.eq("type", options.type);
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

  const serialized = (data ?? []).map((row) => serializePrices(row, [...STOCK_PRICE_FIELDS]));
  return createPaginatedResult(serialized, count ?? 0, { page, pageSize });
}

/**
 * Crée un mouvement de stock
 */
export async function createMouvementStock(
  client: DbClient,
  data: MouvementStockInsert
): Promise<MouvementStock> {
  const { data: mouvement, error } = await client
    .from("mouvements_stock")
    .insert(data)
    .select()
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return serializePrices(mouvement, [...STOCK_PRICE_FIELDS]);
}

/**
 * Enregistre une entrée de stock
 */
export async function enregistrerEntreeStock(
  client: DbClient,
  produitId: string,
  quantite: number,
  options?: {
    motif?: string;
    reference?: string;
    prixUnitaire?: number;
    quantiteAvant: number;
  }
): Promise<MouvementStock> {
  const quantiteAvant = options?.quantiteAvant ?? 0;
  const quantiteApres = quantiteAvant + quantite;

  return createMouvementStock(client, {
    produit_id: produitId,
    type: "ENTREE",
    quantite,
    quantite_avant: quantiteAvant,
    quantite_apres: quantiteApres,
    motif: options?.motif,
    reference: options?.reference,
    prix_unitaire: options?.prixUnitaire,
  });
}

/**
 * Enregistre une sortie de stock
 */
export async function enregistrerSortieStock(
  client: DbClient,
  produitId: string,
  quantite: number,
  options?: {
    motif?: string;
    reference?: string;
    quantiteAvant: number;
  }
): Promise<MouvementStock> {
  const quantiteAvant = options?.quantiteAvant ?? 0;
  const quantiteApres = quantiteAvant - quantite;

  return createMouvementStock(client, {
    produit_id: produitId,
    type: "SORTIE",
    quantite,
    quantite_avant: quantiteAvant,
    quantite_apres: quantiteApres,
    motif: options?.motif,
    reference: options?.reference,
  });
}

/**
 * Enregistre un ajustement de stock
 */
export async function enregistrerAjustementStock(
  client: DbClient,
  produitId: string,
  nouvelleQuantite: number,
  options?: {
    motif?: string;
    quantiteAvant: number;
  }
): Promise<MouvementStock> {
  const quantiteAvant = options?.quantiteAvant ?? 0;
  const quantite = Math.abs(nouvelleQuantite - quantiteAvant);

  return createMouvementStock(client, {
    produit_id: produitId,
    type: "AJUSTEMENT",
    quantite,
    quantite_avant: quantiteAvant,
    quantite_apres: nouvelleQuantite,
    motif: options?.motif ?? "Ajustement manuel",
  });
}

/**
 * Enregistre une perte de stock
 */
export async function enregistrerPerteStock(
  client: DbClient,
  produitId: string,
  quantite: number,
  options?: {
    motif?: string;
    quantiteAvant: number;
  }
): Promise<MouvementStock> {
  const quantiteAvant = options?.quantiteAvant ?? 0;
  const quantiteApres = quantiteAvant - quantite;

  return createMouvementStock(client, {
    produit_id: produitId,
    type: "PERTE",
    quantite,
    quantite_avant: quantiteAvant,
    quantite_apres: quantiteApres,
    motif: options?.motif ?? "Perte",
  });
}

/**
 * Enregistre un inventaire
 */
export async function enregistrerInventaire(
  client: DbClient,
  produitId: string,
  quantiteComptee: number,
  options?: {
    motif?: string;
    quantiteAvant: number;
  }
): Promise<MouvementStock> {
  const quantiteAvant = options?.quantiteAvant ?? 0;
  const quantite = Math.abs(quantiteComptee - quantiteAvant);

  return createMouvementStock(client, {
    produit_id: produitId,
    type: "INVENTAIRE",
    quantite,
    quantite_avant: quantiteAvant,
    quantite_apres: quantiteComptee,
    motif: options?.motif ?? "Inventaire",
  });
}

/**
 * Calcule le total des entrées pour un produit sur une période
 */
export async function getTotalEntrees(
  client: DbClient,
  produitId: string,
  dateDebut?: string,
  dateFin?: string
): Promise<number> {
  let query = client
    .from("mouvements_stock")
    .select("quantite")
    .eq("produit_id", produitId)
    .eq("type", "ENTREE");

  if (dateDebut) {
    query = query.gte("created_at", dateDebut);
  }

  if (dateFin) {
    query = query.lte("created_at", dateFin);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return (data ?? []).reduce((sum, row) => sum + (row.quantite ?? 0), 0);
}

/**
 * Calcule le total des sorties pour un produit sur une période
 */
export async function getTotalSorties(
  client: DbClient,
  produitId: string,
  dateDebut?: string,
  dateFin?: string
): Promise<number> {
  let query = client
    .from("mouvements_stock")
    .select("quantite")
    .eq("produit_id", produitId)
    .in("type", ["SORTIE", "PERTE"]);

  if (dateDebut) {
    query = query.gte("created_at", dateDebut);
  }

  if (dateFin) {
    query = query.lte("created_at", dateFin);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return (data ?? []).reduce((sum, row) => sum + (row.quantite ?? 0), 0);
}
