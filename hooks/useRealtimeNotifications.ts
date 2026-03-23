"use client";

/**
 * Hook Realtime pour les notifications.
 *
 * Ecoute les nouvelles notifications en temps reel via Supabase Realtime.
 * Charge les notifications initiales puis se met a jour en direct.
 */

import { useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { subscribeToNotifications } from "@/lib/realtime/subscriptions";
import { useNotificationStore } from "@/stores/notification-store";
import { fetchNotifications } from "@/actions/notifications";
import type { NotificationData } from "@/schemas/notification.schema";
import { toast } from "sonner";

interface UseRealtimeNotificationsOptions {
  utilisateurId: string | null | undefined;
  enabled?: boolean;
}

export function useRealtimeNotifications({
  utilisateurId,
  enabled = true,
}: UseRealtimeNotificationsOptions) {
  const supabaseRef = useRef(createClient());
  const initialLoadDone = useRef(false);

  const {
    addNotification,
    setNotifications,
    dismissNotification,
    markAsRead,
    notifications,
    unreadCount,
    preferences,
  } = useNotificationStore();

  // Reset le chargement initial quand l'utilisateur change
  useEffect(() => {
    initialLoadDone.current = false;
  }, [utilisateurId]);

  // Charger les notifications initiales
  useEffect(() => {
    if (!enabled || !utilisateurId || initialLoadDone.current) return;

    const loadInitial = async () => {
      const result = await fetchNotifications({ limit: 50 });
      if (result.success && result.data) {
        setNotifications(result.data as NotificationData[]);
      }
      initialLoadDone.current = true;
    };

    loadInitial();
  }, [enabled, utilisateurId, setNotifications]);

  // Jouer un son de notification
  const playNotificationSound = useCallback(() => {
    if (!preferences.sonActif) return;
    try {
      const audio = new Audio("/sounds/notification.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Ignorer l'erreur si l'audio ne peut pas jouer (autoplay policy)
      });
    } catch {
      // Pas de fichier audio disponible
    }
  }, [preferences.sonActif]);

  // Afficher un toast pour la notification
  const showToast = useCallback((notification: NotificationData) => {
    const typeColors: Record<string, "info" | "success" | "warning" | "error"> = {
      COMMANDE: "info",
      STOCK: "warning",
      TABLE: "info",
      PAIEMENT: "success",
      SYSTEME: "info",
      LIVRAISON: "info",
      CAISSE: "success",
    };

    const toastType = typeColors[notification.type] || "info";

    toast[toastType](notification.titre, {
      description: notification.message,
      duration: 5000,
      action: notification.lien
        ? {
            label: "Voir",
            onClick: () => {
              window.location.href = notification.lien!;
            },
          }
        : undefined,
    });
  }, []);

  // Handler pour les nouvelles notifications
  const handleInsert = useCallback(
    (payload: Record<string, unknown>) => {
      const notification = payload as unknown as NotificationData;
      addNotification(notification);
      showToast(notification);
      playNotificationSound();
    },
    [addNotification, showToast, playNotificationSound]
  );

  // Handler pour les mises a jour
  const handleUpdate = useCallback(
    (payload: Record<string, unknown>) => {
      const notification = payload as unknown as NotificationData;
      if (notification.lue) {
        markAsRead(notification.id);
      }
    },
    [markAsRead]
  );

  // Handler pour les suppressions
  const handleDelete = useCallback(
    (payload: Partial<Record<string, unknown>>) => {
      if (payload.id) {
        dismissNotification(payload.id as string);
      }
    },
    [dismissNotification]
  );

  // Handler erreur
  const handleError = useCallback((err: Error) => {
    console.error("[useRealtimeNotifications]", err.message);
  }, []);

  // Souscription Realtime
  useEffect(() => {
    if (!enabled || !utilisateurId) return;

    const supabase = supabaseRef.current;
    const cleanup = subscribeToNotifications(supabase, utilisateurId, {
      onInsert: handleInsert,
      onUpdate: handleUpdate,
      onDelete: handleDelete,
      onError: handleError,
    });

    return cleanup;
  }, [utilisateurId, enabled, handleInsert, handleUpdate, handleDelete, handleError]);

  return { notifications, unreadCount };
}
