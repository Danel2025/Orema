/**
 * Requêtes Supabase pour les notifications admin
 */

import type { DbClient } from "../client";
import type { PaginationOptions, PaginatedResult } from "../types";
import { getPaginationParams, createPaginatedResult, getErrorMessage } from "../utils";

// ============================================================================
// TYPES
// ============================================================================

export interface NotificationAdmin {
  id: string;
  type: string;
  titre: string;
  message: string;
  lue: boolean;
  etablissement_id: string | null;
  created_at: string;
  etablissement_nom?: string;
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Récupère les notifications admin avec pagination
 */
export async function getAdminNotifications(
  client: DbClient,
  filters?: {
    lue?: boolean;
    type?: string;
    etablissement_id?: string;
  },
  pagination?: PaginationOptions
): Promise<PaginatedResult<NotificationAdmin>> {
  const { offset, limit, page, pageSize } = getPaginationParams(pagination);

  let query = client
    .from("notifications_admin")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters?.lue !== undefined) {
    query = query.eq("lue", filters.lue);
  }

  if (filters?.type) {
    query = query.eq("type", filters.type);
  }

  if (filters?.etablissement_id) {
    query = query.eq("etablissement_id", filters.etablissement_id);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  // Enrichir avec les noms d'établissements
  const notifications = data ?? [];
  const etabIds = [
    ...new Set(notifications.filter((n) => n.etablissement_id).map((n) => n.etablissement_id!)),
  ];

  const etabMap = new Map<string, string>();
  if (etabIds.length > 0) {
    const { data: etabs } = await client
      .from("etablissements")
      .select("id, nom")
      .in("id", etabIds);

    for (const e of etabs ?? []) {
      etabMap.set(e.id, e.nom);
    }
  }

  const enriched: NotificationAdmin[] = notifications.map((n) => ({
    ...n,
    etablissement_nom: n.etablissement_id ? etabMap.get(n.etablissement_id) : undefined,
  }));

  return createPaginatedResult(enriched, count ?? 0, { page, pageSize });
}

/**
 * Marque des notifications comme lues
 */
export async function markNotificationsRead(
  client: DbClient,
  notificationIds: string[]
): Promise<void> {
  const { error } = await client
    .from("notifications_admin")
    .update({ lue: true })
    .in("id", notificationIds);

  if (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Marque toutes les notifications comme lues
 */
export async function markAllNotificationsRead(client: DbClient): Promise<void> {
  const { error } = await client
    .from("notifications_admin")
    .update({ lue: true })
    .eq("lue", false);

  if (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Compte les notifications non lues
 */
export async function getUnreadNotificationCount(client: DbClient): Promise<number> {
  const { count, error } = await client
    .from("notifications_admin")
    .select("id", { count: "exact", head: true })
    .eq("lue", false);

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return count ?? 0;
}

/**
 * Crée une notification/alerte admin
 */
export async function createAdminNotification(
  client: DbClient,
  data: {
    type: string;
    titre: string;
    message: string;
    etablissement_id?: string;
  }
): Promise<NotificationAdmin> {
  const { data: notification, error } = await client
    .from("notifications_admin")
    .insert({
      type: data.type,
      titre: data.titre,
      message: data.message,
      etablissement_id: data.etablissement_id ?? null,
      lue: false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return notification;
}
