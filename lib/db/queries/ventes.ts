/**
 * Requêtes Supabase pour les ventes
 */

import type { DbClient } from "../client";
import type {
  Vente,
  VenteInsert,
  VenteUpdate,
  VenteWithRelations,
  LigneVente,
  LigneVenteInsert,
  LigneVenteSupplement,
  LigneVenteSupplementInsert,
  Paiement,
  PaiementInsert,
  TypeVente,
  StatutVente,
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

const VENTE_PRICE_FIELDS = PRICE_FIELDS.ventes;
const LIGNE_PRICE_FIELDS = PRICE_FIELDS.lignes_vente;
const PAIEMENT_PRICE_FIELDS = PRICE_FIELDS.paiements;
const SUPPLEMENT_PRICE_FIELDS = PRICE_FIELDS.lignes_vente_supplements;

/**
 * Sérialise une vente avec ses relations
 */
function serializeVente<T extends Vente>(vente: T): T {
  const serialized = serializePrices(vente, [...VENTE_PRICE_FIELDS]) as T;

  // Sérialiser les lignes de vente
  const s = serialized as Record<string, unknown>;
  if ("lignes_vente" in s && Array.isArray(s.lignes_vente)) {
    s.lignes_vente = (s.lignes_vente as LigneVente[]).map((ligne) => {
      const serializedLigne = serializePrices(ligne, [...LIGNE_PRICE_FIELDS]);

      // Sérialiser les supplements de ligne
      if (
        "lignes_vente_supplements" in serializedLigne &&
        Array.isArray(serializedLigne.lignes_vente_supplements)
      ) {
        serializedLigne.lignes_vente_supplements = (
          serializedLigne.lignes_vente_supplements as LigneVenteSupplement[]
        ).map((s) => serializePrices(s, [...SUPPLEMENT_PRICE_FIELDS]));
      }

      return serializedLigne;
    }) as typeof s.lignes_vente;
  }

  // Sérialiser les paiements
  if ("paiements" in s && Array.isArray(s.paiements)) {
    s.paiements = (s.paiements as Paiement[]).map((p) =>
      serializePrices(p, [...PAIEMENT_PRICE_FIELDS])
    ) as typeof s.paiements;
  }

  return serialized;
}

/**
 * Récupère toutes les ventes d'un établissement
 */
export async function getVentes(
  client: DbClient,
  etablissementId: string,
  options?: {
    statut?: StatutVente;
    type?: TypeVente;
    utilisateurId?: string;
    clientId?: string;
    tableId?: string;
    sessionCaisseId?: string;
    dateDebut?: string;
    dateFin?: string;
  }
): Promise<Vente[]> {
  let query = client
    .from("ventes")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .order("created_at", { ascending: false });

  if (options?.statut) {
    query = query.eq("statut", options.statut);
  }

  if (options?.type) {
    query = query.eq("type", options.type);
  }

  if (options?.utilisateurId) {
    query = query.eq("utilisateur_id", options.utilisateurId);
  }

  if (options?.clientId) {
    query = query.eq("client_id", options.clientId);
  }

  if (options?.tableId) {
    query = query.eq("table_id", options.tableId);
  }

  if (options?.sessionCaisseId) {
    query = query.eq("session_caisse_id", options.sessionCaisseId);
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

  return (data ?? []).map((row) => serializePrices(row, [...VENTE_PRICE_FIELDS]));
}

/**
 * Récupère les ventes paginées
 */
export async function getVentesPaginated(
  client: DbClient,
  etablissementId: string,
  options?: PaginationOptions & {
    statut?: StatutVente;
    type?: TypeVente;
    utilisateurId?: string;
    dateDebut?: string;
    dateFin?: string;
  }
): Promise<PaginatedResult<Vente>> {
  const { offset, limit, page, pageSize } = getPaginationParams(options);

  let query = client
    .from("ventes")
    .select("*", { count: "exact" })
    .eq("etablissement_id", etablissementId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (options?.statut) {
    query = query.eq("statut", options.statut);
  }

  if (options?.type) {
    query = query.eq("type", options.type);
  }

  if (options?.utilisateurId) {
    query = query.eq("utilisateur_id", options.utilisateurId);
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

  const serialized = ((data ?? []) as Vente[]).map(serializeVente);
  return createPaginatedResult(serialized, count ?? 0, { page, pageSize });
}

/**
 * Récupère une vente par son ID
 */
export async function getVenteById(client: DbClient, id: string): Promise<Vente | null> {
  const { data, error } = await client.from("ventes").select("*").eq("id", id).single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(getErrorMessage(error));
  }

  return serializeVente(data as Vente);
}

/**
 * Récupère une vente par son numéro de ticket
 */
export async function getVenteByNumeroTicket(
  client: DbClient,
  etablissementId: string,
  numeroTicket: string
): Promise<Vente | null> {
  const { data, error } = await client
    .from("ventes")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .eq("numero_ticket", numeroTicket)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(getErrorMessage(error));
  }

  return serializeVente(data as Vente);
}

/**
 * Récupère la vente en cours pour une table
 */
export async function getVenteEnCoursTable(
  client: DbClient,
  tableId: string
): Promise<Vente | null> {
  const { data, error } = await client
    .from("ventes")
    .select("*")
    .eq("table_id", tableId)
    .eq("statut", "EN_COURS")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(getErrorMessage(error));
  }

  return serializeVente(data as Vente);
}

/**
 * Crée une nouvelle vente
 */
export async function createVente(client: DbClient, data: VenteInsert): Promise<Vente> {
  const { data: vente, error } = await client.from("ventes").insert(data).select().single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return serializePrices(vente, [...VENTE_PRICE_FIELDS]);
}

/**
 * Met à jour une vente
 */
export async function updateVente(client: DbClient, id: string, data: VenteUpdate): Promise<Vente> {
  const { data: vente, error } = await client
    .from("ventes")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return serializePrices(vente, [...VENTE_PRICE_FIELDS]);
}

/**
 * Annule une vente
 */
export async function annulerVente(client: DbClient, id: string): Promise<Vente> {
  return updateVente(client, id, { statut: "ANNULEE" });
}

/**
 * Marque une vente comme payée
 */
export async function marquerVentePayee(client: DbClient, id: string): Promise<Vente> {
  return updateVente(client, id, { statut: "PAYEE" });
}

// ================== LIGNES DE VENTE ==================

/**
 * Crée une ligne de vente
 */
export async function createLigneVente(
  client: DbClient,
  data: LigneVenteInsert
): Promise<LigneVente> {
  const { data: ligne, error } = await client.from("lignes_vente").insert(data).select().single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return serializePrices(ligne, [...LIGNE_PRICE_FIELDS]);
}

/**
 * Crée plusieurs lignes de vente
 */
export async function createLignesVente(
  client: DbClient,
  lignes: LigneVenteInsert[]
): Promise<LigneVente[]> {
  const { data, error } = await client.from("lignes_vente").insert(lignes).select();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return (data ?? []).map((row) => serializePrices(row, [...LIGNE_PRICE_FIELDS]));
}

/**
 * Met à jour le statut de préparation d'une ligne
 */
export async function updateLigneVenteStatut(
  client: DbClient,
  id: string,
  statut: "EN_ATTENTE" | "EN_PREPARATION" | "PRETE" | "SERVIE"
): Promise<LigneVente> {
  const { data: ligne, error } = await client
    .from("lignes_vente")
    .update({ statut_preparation: statut, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return serializePrices(ligne, [...LIGNE_PRICE_FIELDS]);
}

/**
 * Supprime une ligne de vente
 */
export async function deleteLigneVente(client: DbClient, id: string): Promise<void> {
  const { error } = await client.from("lignes_vente").delete().eq("id", id);

  if (error) {
    throw new Error(getErrorMessage(error));
  }
}

// ================== SUPPLEMENTS DE LIGNE ==================

/**
 * Crée un supplément de ligne de vente
 */
export async function createLigneVenteSupplement(
  client: DbClient,
  data: LigneVenteSupplementInsert
): Promise<LigneVenteSupplement> {
  const { data: supplement, error } = await client
    .from("lignes_vente_supplements")
    .insert(data)
    .select()
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return serializePrices(supplement, [...SUPPLEMENT_PRICE_FIELDS]);
}

// ================== PAIEMENTS ==================

/**
 * Crée un paiement
 */
export async function createPaiement(client: DbClient, data: PaiementInsert): Promise<Paiement> {
  const { data: paiement, error } = await client.from("paiements").insert(data).select().single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return serializePrices(paiement, [...PAIEMENT_PRICE_FIELDS]);
}

/**
 * Crée plusieurs paiements
 */
export async function createPaiements(
  client: DbClient,
  paiements: PaiementInsert[]
): Promise<Paiement[]> {
  const { data, error } = await client.from("paiements").insert(paiements).select();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return (data ?? []).map((row) => serializePrices(row, [...PAIEMENT_PRICE_FIELDS]));
}

/**
 * Récupère les paiements d'une vente
 */
export async function getPaiementsVente(client: DbClient, venteId: string): Promise<Paiement[]> {
  const { data, error } = await client.from("paiements").select("*").eq("vente_id", venteId);

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return (data ?? []).map((row) => serializePrices(row, [...PAIEMENT_PRICE_FIELDS]));
}

// ================== STATISTIQUES ==================

/**
 * Compte le nombre de ventes
 */
export async function countVentes(
  client: DbClient,
  etablissementId: string,
  options?: {
    statut?: StatutVente;
    dateDebut?: string;
    dateFin?: string;
  }
): Promise<number> {
  let query = client
    .from("ventes")
    .select("*", { count: "exact", head: true })
    .eq("etablissement_id", etablissementId);

  if (options?.statut) {
    query = query.eq("statut", options.statut);
  }

  if (options?.dateDebut) {
    query = query.gte("created_at", options.dateDebut);
  }

  if (options?.dateFin) {
    query = query.lte("created_at", options.dateFin);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return count ?? 0;
}

/**
 * Calcule le total des ventes sur une période
 */
export async function getTotalVentes(
  client: DbClient,
  etablissementId: string,
  options?: {
    dateDebut?: string;
    dateFin?: string;
  }
): Promise<number> {
  let query = client
    .from("ventes")
    .select("total_final")
    .eq("etablissement_id", etablissementId)
    .eq("statut", "PAYEE");

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

  return (data ?? []).reduce((sum, row) => {
    const total =
      typeof row.total_final === "string" ? parseFloat(row.total_final) : row.total_final;
    return sum + (total ?? 0);
  }, 0);
}
