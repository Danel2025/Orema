/**
 * Requetes Supabase pour les notifications
 */

import type { DbClient } from "../client";
import type { PaginationOptions, PaginatedResult } from "../types";
import { getPaginationParams, createPaginatedResult, getErrorMessage } from "../utils";
import type { TypeNotification } from "@/schemas/notification.schema";

// ============================================================================
// Types locaux (en attendant la regeneration des types Supabase)
// ============================================================================

export interface NotificationRow {
  id: string;
  type: TypeNotification;
  titre: string;
  message: string;
  lue: boolean;
  donnees: Record<string, unknown>;
  lien: string | null;
  utilisateur_id: string;
  etablissement_id: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationInsert {
  type: TypeNotification;
  titre: string;
  message: string;
  lue?: boolean;
  donnees?: Record<string, unknown>;
  lien?: string | null;
  utilisateur_id: string;
  etablissement_id: string;
}

// ============================================================================
// Lecture
// ============================================================================

/**
 * Recupere les notifications d'un utilisateur
 */
export async function getNotifications(
  client: DbClient,
  utilisateurId: string,
  options?: {
    lue?: boolean;
    type?: TypeNotification;
    limit?: number;
  }
): Promise<NotificationRow[]> {
  let query = (client as any)
    .from("notifications")
    .select("*")
    .eq("utilisateur_id", utilisateurId)
    .order("created_at", { ascending: false });

  if (options?.lue !== undefined) {
    query = query.eq("lue", options.lue);
  }

  if (options?.type) {
    query = query.eq("type", options.type);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  } else {
    query = query.limit(100);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erreur chargement notifications: ${getErrorMessage(error)}`);
  }

  return (data as unknown as NotificationRow[]) || [];
}

/**
 * Recupere les notifications paginées
 */
export async function getNotificationsPaginated(
  client: DbClient,
  utilisateurId: string,
  pagination?: PaginationOptions,
  options?: {
    lue?: boolean;
    type?: TypeNotification;
  }
): Promise<PaginatedResult<NotificationRow>> {
  const { offset, limit, page, pageSize } = getPaginationParams(pagination);

  let query = (client as any)
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("utilisateur_id", utilisateurId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (options?.lue !== undefined) {
    query = query.eq("lue", options.lue);
  }

  if (options?.type) {
    query = query.eq("type", options.type);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erreur chargement notifications: ${getErrorMessage(error)}`);
  }

  return createPaginatedResult(
    (data as unknown as NotificationRow[]) || [],
    count || 0,
    { page, pageSize }
  );
}

/**
 * Compte les notifications non lues
 */
export async function countUnreadNotifications(
  client: DbClient,
  utilisateurId: string
): Promise<number> {
  const { count, error } = await (client as any)
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("utilisateur_id", utilisateurId)
    .eq("lue", false);

  if (error) {
    throw new Error(`Erreur comptage notifications: ${getErrorMessage(error)}`);
  }

  return count || 0;
}

// ============================================================================
// Ecriture
// ============================================================================

/**
 * Cree une notification
 */
export async function createNotification(
  client: DbClient,
  notification: NotificationInsert
): Promise<NotificationRow> {
  const { data, error } = await (client as any)
    .from("notifications")
    .insert(notification)
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur creation notification: ${getErrorMessage(error)}`);
  }

  return data as unknown as NotificationRow;
}

/**
 * Cree plusieurs notifications (broadcast)
 */
export async function createNotifications(
  client: DbClient,
  notifications: NotificationInsert[]
): Promise<NotificationRow[]> {
  if (notifications.length === 0) return [];

  const { data, error } = await (client as any)
    .from("notifications")
    .insert(notifications)
    .select();

  if (error) {
    throw new Error(`Erreur creation notifications: ${getErrorMessage(error)}`);
  }

  return (data as unknown as NotificationRow[]) || [];
}

/**
 * Marque une notification comme lue
 */
export async function markNotificationAsRead(
  client: DbClient,
  notificationId: string,
  utilisateurId: string
): Promise<void> {
  const { error } = await (client as any)
    .from("notifications")
    .update({ lue: true })
    .eq("id", notificationId)
    .eq("utilisateur_id", utilisateurId);

  if (error) {
    throw new Error(`Erreur marquage notification: ${getErrorMessage(error)}`);
  }
}

/**
 * Marque toutes les notifications d'un utilisateur comme lues
 */
export async function markAllNotificationsAsRead(
  client: DbClient,
  utilisateurId: string
): Promise<void> {
  const { error } = await (client as any)
    .from("notifications")
    .update({ lue: true })
    .eq("utilisateur_id", utilisateurId)
    .eq("lue", false);

  if (error) {
    throw new Error(`Erreur marquage notifications: ${getErrorMessage(error)}`);
  }
}

/**
 * Supprime une notification
 */
export async function deleteNotification(
  client: DbClient,
  notificationId: string,
  utilisateurId: string
): Promise<void> {
  const { error } = await (client as any)
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("utilisateur_id", utilisateurId);

  if (error) {
    throw new Error(`Erreur suppression notification: ${getErrorMessage(error)}`);
  }
}

/**
 * Supprime toutes les notifications lues d'un utilisateur
 */
export async function deleteReadNotifications(
  client: DbClient,
  utilisateurId: string
): Promise<void> {
  const { error } = await (client as any)
    .from("notifications")
    .delete()
    .eq("utilisateur_id", utilisateurId)
    .eq("lue", true);

  if (error) {
    throw new Error(`Erreur suppression notifications lues: ${getErrorMessage(error)}`);
  }
}
