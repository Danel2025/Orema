"use client";

/**
 * NotificationItem - Item de notification dans une liste
 * Icône par type, fond coloré si non lu, timestamp relatif
 */

import { Flex, Text, Button } from "@/components/ui";
import {
  Warning,
  Clock,
  Timer,
  XCircle,
  Info,
  Bell,
} from "@phosphor-icons/react";
import type { IconWeight } from "@phosphor-icons/react";
import type { NotificationAdmin, NotificationType } from "./types";

interface NotificationItemProps {
  notification: NotificationAdmin;
  onMarkRead?: () => void;
  onAction?: () => void;
}

const typeConfig: Record<
  NotificationType,
  {
    icon: React.ComponentType<{ size?: number; weight?: IconWeight; style?: React.CSSProperties }>;
    color: string;
    bg: string;
  }
> = {
  quota_atteint: {
    icon: Warning,
    color: "var(--orange-9)",
    bg: "var(--orange-a3)",
  },
  inactivite: {
    icon: Clock,
    color: "var(--gray-9)",
    bg: "var(--gray-a3)",
  },
  expiration: {
    icon: Timer,
    color: "var(--red-9)",
    bg: "var(--red-a3)",
  },
  erreur: {
    icon: XCircle,
    color: "var(--red-9)",
    bg: "var(--red-a3)",
  },
  info: {
    icon: Info,
    color: "var(--blue-9)",
    bg: "var(--blue-a3)",
  },
  alerte: {
    icon: Bell,
    color: "var(--orange-9)",
    bg: "var(--orange-a3)",
  },
};

function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "A l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD === 1) return "Hier";
  if (diffD < 7) return `Il y a ${diffD}j`;
  return d.toLocaleDateString("fr-GA", { day: "numeric", month: "short" });
}

export function NotificationItem({
  notification,
  onMarkRead,
  onAction,
}: NotificationItemProps) {
  const config = typeConfig[notification.type];
  const Icon = config.icon;

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: "12px 16px",
        borderRadius: 8,
        backgroundColor: notification.lu
          ? "transparent"
          : "var(--accent-a2)",
        borderLeft: notification.lu
          ? "3px solid transparent"
          : `3px solid ${config.color}`,
        transition: "background-color 0.2s",
      }}
    >
      {/* Icône */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          backgroundColor: config.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={18} weight="fill" style={{ color: config.color }} />
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Flex justify="between" align="start" gap="2">
          <div style={{ minWidth: 0 }}>
            <Text
              size="2"
              weight={notification.lu ? "regular" : "medium"}
              style={{
                color: "var(--gray-12)",
                display: "block",
              }}
            >
              {notification.titre}
            </Text>
            <Text
              size="1"
              color="gray"
              style={{
                display: "block",
                marginTop: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {notification.message}
            </Text>
          </div>

          <Text
            size="1"
            color="gray"
            style={{ whiteSpace: "nowrap", flexShrink: 0 }}
          >
            {getRelativeTime(notification.timestamp)}
          </Text>
        </Flex>

        {/* Actions */}
        <Flex gap="2" mt="2">
          {notification.actionLabel && onAction ? (
            <Button variant="soft" size="1" onClick={onAction}>
              {notification.actionLabel}
            </Button>
          ) : null}
          {!notification.lu && onMarkRead ? (
            <Button variant="ghost" color="gray" size="1" onClick={onMarkRead}>
              Marquer lu
            </Button>
          ) : null}
        </Flex>
      </div>
    </div>
  );
}
