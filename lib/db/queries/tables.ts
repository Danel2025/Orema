/**
 * Requêtes Supabase pour les tables et zones
 */

import type { DbClient } from "../client";
import type {
  Table,
  TableInsert,
  TableUpdate,
  TableWithRelations,
  Zone,
  ZoneInsert,
  ZoneUpdate,
  StatutTable,
} from "../types";
import { getErrorMessage } from "../utils";

// ================== ZONES ==================

/**
 * Récupère toutes les zones d'un établissement
 */
export async function getZones(
  client: DbClient,
  etablissementId: string,
  options?: { active?: boolean }
): Promise<Zone[]> {
  let query = client
    .from("zones")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .order("ordre", { ascending: true });

  if (options?.active !== undefined) {
    query = query.eq("active", options.active);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return data ?? [];
}

/**
 * Récupère une zone par son ID
 */
export async function getZoneById(client: DbClient, id: string): Promise<Zone | null> {
  const { data, error } = await client.from("zones").select("*").eq("id", id).single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(getErrorMessage(error));
  }

  return data;
}

/**
 * Crée une nouvelle zone
 */
export async function createZone(client: DbClient, data: ZoneInsert): Promise<Zone> {
  const { data: zone, error } = await client.from("zones").insert(data).select().single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return zone;
}

/**
 * Met à jour une zone
 */
export async function updateZone(client: DbClient, id: string, data: ZoneUpdate): Promise<Zone> {
  const { data: zone, error } = await client
    .from("zones")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return zone;
}

/**
 * Supprime une zone
 */
export async function deleteZone(client: DbClient, id: string): Promise<void> {
  const { error } = await client.from("zones").delete().eq("id", id);

  if (error) {
    throw new Error(getErrorMessage(error));
  }
}

// ================== TABLES ==================

/**
 * Récupère toutes les tables d'un établissement
 */
export async function getTables(
  client: DbClient,
  etablissementId: string,
  options?: {
    active?: boolean;
    zoneId?: string;
    statut?: StatutTable;
  }
): Promise<Table[]> {
  let query = client
    .from("tables")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .order("numero", { ascending: true });

  if (options?.active !== undefined) {
    query = query.eq("active", options.active);
  }

  if (options?.zoneId) {
    query = query.eq("zone_id", options.zoneId);
  }

  if (options?.statut) {
    query = query.eq("statut", options.statut);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return (data ?? []) as Table[];
}

/**
 * Récupère une table par son ID
 */
export async function getTableById(client: DbClient, id: string): Promise<Table | null> {
  const { data, error } = await client.from("tables").select("*").eq("id", id).single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(getErrorMessage(error));
  }

  return data as Table;
}

/**
 * Récupère une table par son numéro
 */
export async function getTableByNumero(
  client: DbClient,
  etablissementId: string,
  numero: string
): Promise<Table | null> {
  const { data, error } = await client
    .from("tables")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .eq("numero", numero)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(getErrorMessage(error));
  }

  return data;
}

/**
 * Crée une nouvelle table
 */
export async function createTable(client: DbClient, data: TableInsert): Promise<Table> {
  const { data: table, error } = await client.from("tables").insert(data).select().single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return table;
}

/**
 * Met à jour une table
 */
export async function updateTable(client: DbClient, id: string, data: TableUpdate): Promise<Table> {
  const { data: table, error } = await client
    .from("tables")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return table;
}

/**
 * Met à jour le statut d'une table
 */
export async function updateTableStatut(
  client: DbClient,
  id: string,
  statut: StatutTable
): Promise<Table> {
  return updateTable(client, id, { statut });
}

/**
 * Met à jour la position d'une table
 */
export async function updateTablePosition(
  client: DbClient,
  id: string,
  position: { x: number; y: number }
): Promise<Table> {
  return updateTable(client, id, {
    position_x: position.x,
    position_y: position.y,
  });
}

/**
 * Supprime une table
 */
export async function deleteTable(client: DbClient, id: string): Promise<void> {
  const { error } = await client.from("tables").delete().eq("id", id);

  if (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Compte les tables par statut
 */
export async function countTablesByStatut(
  client: DbClient,
  etablissementId: string
): Promise<Record<StatutTable, number>> {
  const { data, error } = await client
    .from("tables")
    .select("statut")
    .eq("etablissement_id", etablissementId)
    .eq("active", true);

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  const counts: Record<StatutTable, number> = {
    LIBRE: 0,
    OCCUPEE: 0,
    EN_PREPARATION: 0,
    ADDITION: 0,
    A_NETTOYER: 0,
  };

  for (const table of data ?? []) {
    counts[table.statut as keyof typeof counts]++;
  }

  return counts;
}

/**
 * Récupère les tables libres
 */
export async function getTablesLibres(client: DbClient, etablissementId: string): Promise<Table[]> {
  const { data, error } = await client
    .from("tables")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .eq("active", true)
    .eq("statut", "LIBRE")
    .order("numero", { ascending: true });

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return data ?? [];
}

/**
 * Vérifie si un numéro de table existe déjà
 */
export async function tableNumeroExists(
  client: DbClient,
  etablissementId: string,
  numero: string,
  excludeId?: string
): Promise<boolean> {
  let query = client
    .from("tables")
    .select("id", { count: "exact", head: true })
    .eq("etablissement_id", etablissementId)
    .eq("numero", numero);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { count } = await query;

  return (count ?? 0) > 0;
}

/**
 * Compte le nombre de tables d'un établissement
 */
export async function countTables(
  client: DbClient,
  etablissementId: string,
  options?: { zoneId?: string; active?: boolean }
): Promise<number> {
  let query = client
    .from("tables")
    .select("*", { count: "exact", head: true })
    .eq("etablissement_id", etablissementId);

  if (options?.zoneId) {
    query = query.eq("zone_id", options.zoneId);
  }

  if (options?.active !== undefined) {
    query = query.eq("active", options.active);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return count ?? 0;
}

/**
 * Compte le nombre de zones d'un établissement
 */
export async function countZones(client: DbClient, etablissementId: string): Promise<number> {
  const { count, error } = await client
    .from("zones")
    .select("*", { count: "exact", head: true })
    .eq("etablissement_id", etablissementId);

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return count ?? 0;
}

/**
 * Vérifie si un nom de zone existe déjà
 */
export async function zoneNomExists(
  client: DbClient,
  etablissementId: string,
  nom: string,
  excludeId?: string
): Promise<boolean> {
  let query = client
    .from("zones")
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
 * Met à jour l'ordre de plusieurs zones (batch)
 */
export async function updateZonesOrder(
  client: DbClient,
  orders: Array<{ id: string; ordre: number }>
): Promise<void> {
  // Supabase ne supporte pas les transactions côté client,
  // donc on fait des updates séquentiels
  for (const { id, ordre } of orders) {
    const { error } = await client
      .from("zones")
      .update({ ordre, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      throw new Error(getErrorMessage(error));
    }
  }
}

/**
 * Met à jour les positions de plusieurs tables (batch)
 */
export async function updateTablesPositions(
  client: DbClient,
  positions: Array<{ id: string; position_x: number; position_y: number }>
): Promise<void> {
  for (const { id, position_x, position_y } of positions) {
    const { error } = await client
      .from("tables")
      .update({
        position_x,
        position_y,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw new Error(getErrorMessage(error));
    }
  }
}

/**
 * Récupère les zones avec le nombre de tables associées
 */
export async function getZonesWithTableCount(
  client: DbClient,
  etablissementId: string,
  options?: { active?: boolean }
): Promise<Array<Zone & { _count: { tables: number } }>> {
  let query = client
    .from("zones")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .order("ordre", { ascending: true });

  if (options?.active !== undefined) {
    query = query.eq("active", options.active);
  }

  const { data: zones, error } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  // Pour chaque zone, compter les tables
  const zonesWithCount = await Promise.all(
    (zones ?? []).map(async (zone) => {
      const tableCount = await countTables(client, etablissementId, { zoneId: zone.id });
      return {
        ...zone,
        _count: { tables: tableCount },
      };
    })
  );

  return zonesWithCount;
}

/**
 * Récupère la dernière zone pour calculer l'ordre
 */
export async function getLastZone(client: DbClient, etablissementId: string): Promise<Zone | null> {
  const { data, error } = await client
    .from("zones")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .order("ordre", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(getErrorMessage(error));
  }

  return data;
}
