"use server";

/**
 * Server Actions pour les notifications admin (SUPER_ADMIN)
 */

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/lib/auth";
import { createAlertSchema, type CreateAlertInput } from "@/schemas/admin-etablissement.schema";
import {
  getAdminNotifications,
  markNotificationsRead,
  markAllNotificationsRead,
  getUnreadNotificationCount,
  createAdminNotification,
  type NotificationAdmin,
} from "@/lib/db/queries/notifications-admin";
import type { PaginatedResult } from "@/lib/db/types";

type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Récupère les notifications admin avec pagination et filtres
 */
export async function getNotifications(
  filters?: {
    lue?: boolean;
    type?: string;
    etablissement_id?: string;
  },
  pagination?: { page?: number; pageSize?: number }
): Promise<ActionResult<PaginatedResult<NotificationAdmin>>> {
  try {
    await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    const result = await getAdminNotifications(supabase, filters, pagination);

    return { success: true, data: result };
  } catch (error) {
    console.error("Erreur getNotifications:", error);
    return { success: false, error: "Erreur lors de la récupération des notifications" };
  }
}

/**
 * Marque des notifications comme lues
 */
export async function markAsRead(
  notificationIds: string[]
): Promise<ActionResult> {
  try {
    await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    if (notificationIds.length === 0) {
      return { success: false, error: "Aucune notification sélectionnée" };
    }

    await markNotificationsRead(supabase, notificationIds);

    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("Erreur markAsRead:", error);
    return { success: false, error: "Erreur lors du marquage des notifications" };
  }
}

/**
 * Marque toutes les notifications comme lues
 */
export async function markAllAsRead(): Promise<ActionResult> {
  try {
    await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    await markAllNotificationsRead(supabase);

    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("Erreur markAllAsRead:", error);
    return { success: false, error: "Erreur lors du marquage des notifications" };
  }
}

/**
 * Compte les notifications non lues
 */
export async function getUnreadCount(): Promise<ActionResult<number>> {
  try {
    await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    const count = await getUnreadNotificationCount(supabase);

    return { success: true, data: count };
  } catch (error) {
    console.error("Erreur getUnreadCount:", error);
    return { success: false, error: "Erreur lors du comptage" };
  }
}

/**
 * Créer une alerte/notification admin
 */
export async function createAlert(
  input: CreateAlertInput
): Promise<ActionResult<NotificationAdmin>> {
  try {
    await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    // Validation
    const validated = createAlertSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: "Données invalides" };
    }

    const notification = await createAdminNotification(supabase, {
      type: validated.data.type,
      titre: validated.data.titre,
      message: validated.data.message,
      etablissement_id: validated.data.etablissement_id,
    });

    revalidatePath("/admin");

    return { success: true, data: notification };
  } catch (error) {
    console.error("Erreur createAlert:", error);
    return { success: false, error: "Erreur lors de la création de l'alerte" };
  }
}
