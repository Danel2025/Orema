/**
 * Requêtes Supabase pour les factures admin des établissements
 */

import type { DbClient } from "../client";
import type { PaginationOptions, PaginatedResult } from "../types";
import { getPaginationParams, createPaginatedResult, getErrorMessage } from "../utils";

// ============================================================================
// TYPES
// ============================================================================

export interface FactureAdmin {
  id: string;
  etablissement_id: string;
  abonnement_id: string | null;
  numero: string;
  montant: number;
  devise: string;
  statut: string;
  date_emission: string;
  date_echeance: string | null;
  pdf_url: string | null;
  notes: string | null;
  created_at: string;
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Crée une facture pour un établissement
 */
export async function createFacture(
  client: DbClient,
  data: {
    etablissement_id: string;
    montant: number;
    notes?: string;
    date_echeance?: string;
  }
): Promise<FactureAdmin> {
  // Générer un numéro de facture unique
  const now = new Date();
  const prefix = `FA-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const { count } = await client
    .from("factures")
    .select("id", { count: "exact", head: true })
    .ilike("numero", `${prefix}%`);

  const numero = `${prefix}-${String((count ?? 0) + 1).padStart(4, "0")}`;

  const { data: facture, error } = await client
    .from("factures")
    .insert({
      etablissement_id: data.etablissement_id,
      numero,
      montant: data.montant,
      statut: "brouillon",
      notes: data.notes ?? null,
      date_echeance: data.date_echeance ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return facture;
}

/**
 * Liste les factures d'un établissement avec pagination et filtres
 */
export async function listFactures(
  client: DbClient,
  etablissementId: string,
  filters?: {
    statut?: string;
    dateDebut?: string;
    dateFin?: string;
  },
  pagination?: PaginationOptions
): Promise<PaginatedResult<FactureAdmin>> {
  const { offset, limit, page, pageSize } = getPaginationParams(pagination);

  let query = client
    .from("factures")
    .select("*", { count: "exact" })
    .eq("etablissement_id", etablissementId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters?.statut && filters.statut !== "all") {
    query = query.eq("statut", filters.statut);
  }

  if (filters?.dateDebut) {
    query = query.gte("created_at", filters.dateDebut);
  }

  if (filters?.dateFin) {
    query = query.lte("created_at", filters.dateFin);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return createPaginatedResult((data ?? []) as FactureAdmin[], count ?? 0, { page, pageSize });
}

/**
 * Récupère le détail d'une facture
 */
export async function getFactureById(
  client: DbClient,
  factureId: string
): Promise<FactureAdmin | null> {
  const { data, error } = await client
    .from("factures")
    .select("*")
    .eq("id", factureId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(getErrorMessage(error));
  }

  return data;
}

/**
 * Marque une facture comme payée
 */
export async function markFacturePaid(
  client: DbClient,
  factureId: string
): Promise<FactureAdmin> {
  const { data, error } = await client
    .from("factures")
    .update({
      statut: "payee",
    })
    .eq("id", factureId)
    .select()
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return data;
}
