"use server";

/**
 * Server Actions pour les notifications
 *
 * CRUD et broadcast de notifications in-app.
 */

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getNotifications,
  countUnreadNotifications,
  createNotification,
  createNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteReadNotifications,
  type NotificationRow,
  type NotificationInsert,
} from "@/lib/db/queries/notifications";
import type { TypeNotification } from "@/schemas/notification.schema";

// ============================================================================
// Types
// ============================================================================

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// Lecture
// ============================================================================

/**
 * Recupere les notifications de l'utilisateur courant
 */
export async function fetchNotifications(options?: {
  lue?: boolean;
  type?: TypeNotification;
  limit?: number;
}): Promise<ActionResult<NotificationRow[]>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Non authentifie" };

  try {
    const supabase = await createClient();
    const notifications = await getNotifications(supabase, user.userId, options);
    return { success: true, data: notifications };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Compte les notifications non lues
 */
export async function fetchUnreadCount(): Promise<ActionResult<number>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Non authentifie" };

  try {
    const supabase = await createClient();
    const count = await countUnreadNotifications(supabase, user.userId);
    return { success: true, data: count };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

// ============================================================================
// Ecriture
// ============================================================================

/**
 * Cree une notification pour un utilisateur specifique
 */
export async function creerNotification(params: {
  type: TypeNotification;
  titre: string;
  message: string;
  donnees?: Record<string, unknown>;
  lien?: string;
  utilisateurId: string;
}): Promise<ActionResult<NotificationRow>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Non authentifie" };
  if (!user.etablissementId) return { success: false, error: "Pas d'etablissement" };

  try {
    const supabase = await createClient();
    const notification = await createNotification(supabase, {
      type: params.type,
      titre: params.titre,
      message: params.message,
      donnees: params.donnees || {},
      lien: params.lien || null,
      utilisateur_id: params.utilisateurId,
      etablissement_id: user.etablissementId,
    });
    return { success: true, data: notification };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Envoie une notification a tous les utilisateurs d'un etablissement,
 * filtres optionnellement par role.
 */
export async function broadcastNotification(params: {
  type: TypeNotification;
  titre: string;
  message: string;
  donnees?: Record<string, unknown>;
  lien?: string;
  roles?: string[];
}): Promise<ActionResult<number>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Non authentifie" };
  if (!user.etablissementId) return { success: false, error: "Pas d'etablissement" };

  try {
    const supabase = await createClient();

    // Recuperer les utilisateurs cibles
    let query = supabase
      .from("utilisateurs")
      .select("id")
      .eq("etablissement_id", user.etablissementId)
      .eq("actif", true);

    if (params.roles && params.roles.length > 0) {
      query = query.in("role", params.roles as any);
    }

    const { data: users, error: usersError } = await query;

    if (usersError) {
      return { success: false, error: usersError.message };
    }

    if (!users || users.length === 0) {
      return { success: true, data: 0 };
    }

    const notifications: NotificationInsert[] = users.map((u) => ({
      type: params.type,
      titre: params.titre,
      message: params.message,
      donnees: params.donnees || {},
      lien: params.lien || null,
      utilisateur_id: u.id,
      etablissement_id: user.etablissementId!,
    }));

    const created = await createNotifications(supabase, notifications);
    return { success: true, data: created.length };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

// ============================================================================
// Mise a jour
// ============================================================================

/**
 * Marque une notification comme lue
 */
export async function marquerCommeLue(
  notificationId: string
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Non authentifie" };

  try {
    const supabase = await createClient();
    await markNotificationAsRead(supabase, notificationId, user.userId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Marque toutes les notifications comme lues
 */
export async function marquerToutesLues(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Non authentifie" };

  try {
    const supabase = await createClient();
    await markAllNotificationsAsRead(supabase, user.userId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

// ============================================================================
// Suppression
// ============================================================================

/**
 * Supprime une notification
 */
export async function supprimerNotification(
  notificationId: string
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Non authentifie" };

  try {
    const supabase = await createClient();
    await deleteNotification(supabase, notificationId, user.userId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Supprime toutes les notifications lues
 */
export async function supprimerNotificationsLues(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Non authentifie" };

  try {
    const supabase = await createClient();
    await deleteReadNotifications(supabase, user.userId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}
