"use client";

/**
 * NotificationBridgeProvider
 *
 * Monte le hook useNotificationBridge qui connecte
 * les sources Realtime existantes au systeme de notifications.
 * Doit etre place a l'interieur de AuthProvider.
 */

import { useAuth } from "@/lib/auth/context";
import { useNotificationBridge } from "@/hooks/useNotificationBridge";

export function NotificationBridgeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  useNotificationBridge({
    utilisateurId: user?.userId,
    etablissementId: user?.etablissementId,
    enabled: !!user,
  });

  return <>{children}</>;
}
