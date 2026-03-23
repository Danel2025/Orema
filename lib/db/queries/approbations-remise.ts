// @ts-nocheck — Tables pas encore dans types/supabase.ts (migrations non appliquées). Supprimer après `pnpm db:types`.
/**
 * Requêtes Supabase pour les approbations de remise
 */

import type { DbClient } from "../client";
import type { PaginationOptions, PaginatedResult } from "../types";
import {
  getPaginationParams,
  createPaginatedResult,
  getErrorMessage,
  serializePrices,
} from "../utils";

const APPROBATION_PRICE_FIELDS = [
  "montant_remise",
  "montant_vente",
] as const;

/**
 * Crée une demande d'approbation de remise
 */
export async function createApprobation(
  client: DbClient,
  etablissementId: string,
  demandeurId: string,
  data: {
    montant_remise: number;
    pourcentage_remise: number;
    montant_vente: number;
    vente_id?: string;
    commentaire?: string;
  }
) {
  const { data: approbation, error } = await client
    .from("approbations_remise")
    .insert({
      etablissement_id: etablissementId,
      demandeur_id: demandeurId,
      montant_remise: data.montant_remise,
      pourcentage_remise: data.pourcentage_remise,
      montant_vente: data.montant_vente,
      vente_id: data.vente_id ?? null,
      commentaire: data.commentaire ?? null,
      statut: "en_attente",
    })
    .select()
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return serializePrices(approbation, [...APPROBATION_PRICE_FIELDS]);
}

/**
 * Récupère les approbations en attente d'un établissement
 */
export async function getApprobationsPending(
  client: DbClient,
  etablissementId: string
) {
  const { data, error } = await client
    .from("approbations_remise")
    .select("*, demandeur:utilisateurs!demandeur_id(nom, prenom)")
    .eq("etablissement_id", etablissementId)
    .eq("statut", "en_attente")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return (data ?? []).map((row) =>
    serializePrices(row, [...APPROBATION_PRICE_FIELDS])
  );
}

/**
 * Met à jour une approbation (approuver ou refuser)
 */
export async function updateApprobation(
  client: DbClient,
  approbationId: string,
  approbateurId: string,
  statut: "approuvee" | "refusee",
  commentaire?: string
) {
  const { data, error } = await client
    .from("approbations_remise")
    .update({
      approbateur_id: approbateurId,
      statut,
      commentaire_reponse: commentaire ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", approbationId)
    .eq("statut", "en_attente") // sécurité : ne modifier que si en attente
    .select()
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return serializePrices(data, [...APPROBATION_PRICE_FIELDS]);
}

/**
 * Récupère l'historique des approbations paginé
 */
export async function getApprobationsHistory(
  client: DbClient,
  etablissementId: string,
  options?: PaginationOptions
): Promise<PaginatedResult<Record<string, unknown>>> {
  const { offset, limit, page, pageSize } = getPaginationParams(options);

  const { data, error, count } = await client
    .from("approbations_remise")
    .select(
      "*, demandeur:utilisateurs!demandeur_id(nom, prenom), approbateur:utilisateurs!approbateur_id(nom, prenom)",
      { count: "exact" }
    )
    .eq("etablissement_id", etablissementId)
    .neq("statut", "en_attente")
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  const serialized = (data ?? []).map((row) =>
    serializePrices(row, [...APPROBATION_PRICE_FIELDS])
  );

  return createPaginatedResult(serialized, count ?? 0, { page, pageSize });
}
