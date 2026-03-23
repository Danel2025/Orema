"use client";

/**
 * Hook bridge qui connecte les sources Realtime existantes
 * au systeme de notifications.
 *
 * Transforme les evenements de commandes, stock et tables
 * en notifications persistantes via les Server Actions.
 */

import { useCallback, useRef } from "react";
import { useRealtimeOrders } from "./useRealtimeOrders";
import { useRealtimeStock } from "./useRealtimeStock";
import { useRealtimeTables } from "./useRealtimeTables";
import { useRealtimeNotifications } from "./useRealtimeNotifications";
import { broadcastNotification } from "@/actions/notifications";
import type { LigneVente } from "@/lib/db/types";
import type { LowStockAlert } from "./useRealtimeStock";

interface UseNotificationBridgeOptions {
  utilisateurId: string | null | undefined;
  etablissementId: string | null | undefined;
  enabled?: boolean;
}

export function useNotificationBridge({
  utilisateurId,
  etablissementId,
  enabled = true,
}: UseNotificationBridgeOptions) {
  // Eviter les broadcasts en double avec un Set de cles recentes
  const recentBroadcasts = useRef(new Set<string>());

  const dedupe = useCallback((key: string): boolean => {
    if (recentBroadcasts.current.has(key)) return true;
    recentBroadcasts.current.add(key);
    // Nettoyer apres 10 secondes
    setTimeout(() => recentBroadcasts.current.delete(key), 10_000);
    return false;
  }, []);

  // 1. Souscription aux notifications (charge + realtime)
  const { notifications, unreadCount } = useRealtimeNotifications({
    utilisateurId,
    enabled,
  });

  // 2. Bridge: nouvelles commandes → notification cuisine/bar
  const handleNewOrder = useCallback(
    async (ligne: LigneVente) => {
      const key = `order-${ligne.id}`;
      if (dedupe(key)) return;

      await broadcastNotification({
        type: "COMMANDE",
        titre: "Nouvelle commande",
        message: `${ligne.quantite}x Produit - Table en preparation`,
        donnees: {
          ligneVenteId: ligne.id,
          venteId: ligne.vente_id,
          produitId: ligne.produit_id,
          quantite: ligne.quantite,
        },
        lien: "/caisse",
        roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "CAISSIER"],
      }).catch((err) => console.error("[NotificationBridge] Erreur broadcast commande:", err));
    },
    [dedupe]
  );

  // 3. Bridge: stock bas → notification managers
  const handleLowStock = useCallback(
    async (alert: LowStockAlert) => {
      const key = `stock-${alert.produitId}`;
      if (dedupe(key)) return;

      await broadcastNotification({
        type: "STOCK",
        titre: "Stock bas",
        message: `${alert.nom} — ${alert.stockActuel} restant(s) (seuil: ${alert.seuilAlerte})`,
        donnees: {
          produitId: alert.produitId,
          stockActuel: alert.stockActuel,
          seuilAlerte: alert.seuilAlerte,
        },
        lien: "/stocks",
        roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
      }).catch((err) => console.error("[NotificationBridge] Erreur broadcast stock:", err));
    },
    [dedupe]
  );

  // Souscriptions Realtime existantes avec bridge
  useRealtimeOrders({
    etablissementId,
    enabled,
    onNewOrder: handleNewOrder,
  });

  useRealtimeStock({
    etablissementId,
    enabled,
    onLowStock: handleLowStock,
  });

  useRealtimeTables({
    etablissementId,
    enabled,
  });

  return { notifications, unreadCount };
}
