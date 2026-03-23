"use client";

/**
 * Centre de notifications admin (GLOBAL)
 * Affiche toutes les alertes : quotas, inactivite, expirations, erreurs
 */

import { useEffect, useState, useCallback } from "react";
import { Box } from "@radix-ui/themes";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "@/actions/admin/etablissements-notifications";
import { NotificationsCenter } from "@/components/admin/etablissements/advanced/notifications-center";
import type { NotificationAdmin, NotificationType } from "@/components/admin/etablissements/shared/types";

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loadNotifications = useCallback(
    async (pageToLoad: number, append = false) => {
      if (!append) setIsLoading(true);
      try {
        const result = await getNotifications(
          {},
          { page: pageToLoad, pageSize: PAGE_SIZE }
        );

        if (result.success && result.data) {
          const items = result.data.data || [];
          const mapped: NotificationAdmin[] = items.map((n) => ({
            id: n.id,
            type: mapNotificationType(n.type),
            titre: n.titre || "Notification",
            message: n.message || "",
            timestamp: n.created_at || new Date().toISOString(),
            lu: n.lue || false,
          }));

          if (append) {
            setNotifications((prev) => [...prev, ...mapped]);
          } else {
            setNotifications(mapped);
          }

          setHasMore(
            (result.data.count ?? 0) > pageToLoad * PAGE_SIZE
          );
        }
      } catch (error) {
        toast.error("Erreur lors du chargement des notifications");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadNotifications(1);
  }, [loadNotifications]);

  const handleMarkRead = async (id: string) => {
    // Update optimiste
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lu: true } : n))
    );

    const result = await markAsRead([id]);
    if (!result.success) {
      // Rollback
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lu: false } : n))
      );
      toast.error("Erreur lors du marquage");
    }
  };

  const handleMarkAllRead = async () => {
    // Update optimiste
    setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));

    const result = await markAllAsRead();
    if (!result.success) {
      // Recharger pour avoir l'etat reel
      loadNotifications(1);
      toast.error("Erreur lors du marquage");
    } else {
      toast.success("Toutes les notifications marquees comme lues");
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadNotifications(nextPage, true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Box>
        <NotificationsCenter
          notifications={notifications}
          isLoading={isLoading}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
        />
      </Box>
    </motion.div>
  );
}

function mapNotificationType(type: string): NotificationType {
  const validTypes: NotificationType[] = [
    "quota_atteint",
    "inactivite",
    "expiration",
    "erreur",
    "info",
    "alerte",
  ];
  if (validTypes.includes(type as NotificationType)) {
    return type as NotificationType;
  }
  return "info";
}
