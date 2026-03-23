"use client";

/**
 * NotificationCenter - Centre de notifications in-app
 *
 * Popover attache au bouton Bell dans le header.
 * Affiche les notifications recentes, permet de les marquer comme lues,
 * de les supprimer et de naviguer vers les liens associes.
 */

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Popover,
  Flex,
  Text,
  Badge,
  Box,
  IconButton,
  Tooltip,
} from "@radix-ui/themes";
import {
  Bell,
  ShoppingCart,
  Package,
  UtensilsCrossed,
  CreditCard,
  Info,
  Truck,
  Calculator,
  Check,
  CheckCheck,
  Trash2,
  X,
} from "lucide-react";
import { useNotificationStore } from "@/stores/notification-store";
import {
  marquerCommeLue,
  marquerToutesLues,
  supprimerNotification,
  supprimerNotificationsLues,
} from "@/actions/notifications";
import type { NotificationData, TypeNotification } from "@/schemas/notification.schema";
import { ScrollArea } from "@/components/ui";

// ============================================================================
// Helpers
// ============================================================================

const TYPE_CONFIG: Record<
  TypeNotification,
  {
    icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
    color: string;
    label: string;
  }
> = {
  COMMANDE: { icon: ShoppingCart, color: "var(--blue-9)", label: "Commande" },
  STOCK: { icon: Package, color: "var(--orange-9)", label: "Stock" },
  TABLE: { icon: UtensilsCrossed, color: "var(--green-9)", label: "Table" },
  PAIEMENT: { icon: CreditCard, color: "var(--green-9)", label: "Paiement" },
  SYSTEME: { icon: Info, color: "var(--gray-9)", label: "Système" },
  LIVRAISON: { icon: Truck, color: "var(--purple-9)", label: "Livraison" },
  CAISSE: { icon: Calculator, color: "var(--accent-9)", label: "Caisse" },
};

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "A l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;

  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;

  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Hier";
  if (diffD < 7) return `Il y a ${diffD}j`;

  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// ============================================================================
// Composant NotificationItem
// ============================================================================

function NotificationItem({
  notification,
  onMarkRead,
  onDismiss,
  onNavigate,
}: {
  notification: NotificationData;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onNavigate: (lien: string) => void;
}) {
  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.SYSTEME;
  const Icon = config.icon;

  return (
    <Box
      style={{
        padding: "10px 12px",
        borderRadius: 8,
        backgroundColor: notification.lue ? "transparent" : "var(--accent-a2)",
        cursor: notification.lien ? "pointer" : "default",
        transition: "background-color 0.15s ease",
      }}
      onClick={() => {
        if (notification.lien) {
          onNavigate(notification.lien);
        }
        if (!notification.lue) {
          onMarkRead(notification.id);
        }
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--gray-a3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = notification.lue
          ? "transparent"
          : "var(--accent-a2)";
      }}
    >
      <Flex gap="3" align="start">
        {/* Icone type */}
        <Box
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            backgroundColor: `color-mix(in srgb, ${config.color} 15%, transparent)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          <Icon size={16} style={{ color: config.color }} />
        </Box>

        {/* Contenu */}
        <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 0 }}>
          <Flex justify="between" align="start" gap="2">
            <Text
              size="2"
              weight={notification.lue ? "regular" : "medium"}
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {notification.titre}
            </Text>
            <Text size="1" color="gray" style={{ flexShrink: 0 }}>
              {formatTimeAgo(notification.created_at)}
            </Text>
          </Flex>

          <Text
            size="1"
            color="gray"
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {notification.message}
          </Text>

          {/* Actions */}
          <Flex gap="2" mt="1">
            {!notification.lue && (
              <Tooltip content="Marquer comme lue">
                <IconButton
                  size="1"
                  variant="ghost"
                  color="gray"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkRead(notification.id);
                  }}
                >
                  <Check size={12} />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip content="Supprimer">
              <IconButton
                size="1"
                variant="ghost"
                color="gray"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(notification.id);
                }}
              >
                <X size={12} />
              </IconButton>
            </Tooltip>
          </Flex>
        </Flex>

        {/* Point non lu */}
        {!notification.lue && (
          <Box
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "var(--accent-9)",
              flexShrink: 0,
              marginTop: 6,
            }}
          />
        )}
      </Flex>
    </Box>
  );
}

// ============================================================================
// Composant NotificationCenter
// ============================================================================

export function NotificationCenter() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isOpen,
    setIsOpen,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  } = useNotificationStore();

  const handleMarkRead = useCallback(
    async (id: string) => {
      markAsRead(id);
      await marquerCommeLue(id).catch(console.error);
    },
    [markAsRead]
  );

  const handleMarkAllRead = useCallback(async () => {
    markAllAsRead();
    await marquerToutesLues().catch(console.error);
  }, [markAllAsRead]);

  const handleDismiss = useCallback(
    async (id: string) => {
      dismissNotification(id);
      await supprimerNotification(id).catch(console.error);
    },
    [dismissNotification]
  );

  const handleClearRead = useCallback(async () => {
    const readIds = notifications.filter((n) => n.lue).map((n) => n.id);
    readIds.forEach((id) => dismissNotification(id));
    await supprimerNotificationsLues().catch(console.error);
  }, [notifications, dismissNotification]);

  const handleNavigate = useCallback(
    (lien: string) => {
      setIsOpen(false);
      router.push(lien);
    },
    [router, setIsOpen]
  );

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger>
        <button
          style={{
            width: 40,
            height: 40,
            border: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ""}`}
        >
          <Bell size={18} style={{ color: "var(--gray-11)" }} />
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                minWidth: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: "var(--red-9)",
                border: "2px solid var(--color-background)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 700,
                color: "white",
                padding: "0 4px",
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Content
        size="2"
        style={{ width: 380, maxHeight: "80vh", padding: 0 }}
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <Flex
          justify="between"
          align="center"
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--gray-a6)",
          }}
        >
          <Flex align="center" gap="2">
            <Text size="3" weight="bold">
              Notifications
            </Text>
            {unreadCount > 0 && (
              <Badge color="red" variant="solid" size="1">
                {unreadCount}
              </Badge>
            )}
          </Flex>
          <Flex gap="1">
            {unreadCount > 0 && (
              <Tooltip content="Tout marquer comme lu">
                <IconButton size="1" variant="ghost" color="gray" onClick={handleMarkAllRead}>
                  <CheckCheck size={14} />
                </IconButton>
              </Tooltip>
            )}
            {notifications.some((n) => n.lue) && (
              <Tooltip content="Supprimer les lues">
                <IconButton size="1" variant="ghost" color="gray" onClick={handleClearRead}>
                  <Trash2 size={14} />
                </IconButton>
              </Tooltip>
            )}
          </Flex>
        </Flex>

        {/* Liste */}
        {notifications.length === 0 ? (
          <Flex
            direction="column"
            align="center"
            justify="center"
            style={{ padding: "40px 16px" }}
            gap="3"
          >
            <Box
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                backgroundColor: "var(--gray-a3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bell size={22} style={{ color: "var(--gray-8)" }} />
            </Box>
            <Text size="2" color="gray">
              Aucune notification
            </Text>
          </Flex>
        ) : (
          <ScrollArea style={{ maxHeight: "calc(80vh - 60px)" }}>
            <Flex direction="column" gap="1" style={{ padding: 8 }}>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkRead}
                  onDismiss={handleDismiss}
                  onNavigate={handleNavigate}
                />
              ))}
            </Flex>
          </ScrollArea>
        )}
      </Popover.Content>
    </Popover.Root>
  );
}
