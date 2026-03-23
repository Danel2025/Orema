"use client";

/**
 * Centre de notifications admin
 * Liste des notifications avec groupement par date, filtres et actions
 */

import { useState, useMemo } from "react";
import {
  Box,
  Flex,
  Text,
  Heading,
  Button,
  Badge,
  Select,
  ScrollArea,
  Skeleton,
} from "@radix-ui/themes";
import {
  Bell,
  BellRinging,
  CheckCircle,
  Checks,
  Funnel,
  Warning,
  WarningCircle,
  Info,
  Lightning,
  CaretDown,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import type { NotificationAdmin, NotificationType } from "../shared/types";

// ── Types ───────────────────────────────────────────────────────────────

interface NotificationsCenterProps {
  notifications: NotificationAdmin[];
  isLoading?: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

type FilterType = "all" | NotificationType;
type FilterLu = "all" | "lu" | "non_lu";

// ── Helpers ─────────────────────────────────────────────────────────────

const notificationTypeConfig: Record<
  NotificationType,
  { label: string; color: string; icon: typeof Bell }
> = {
  quota_atteint: { label: "Quota atteint", color: "amber", icon: Warning },
  inactivite: { label: "Inactivite", color: "gray", icon: Info },
  expiration: { label: "Expiration", color: "red", icon: WarningCircle },
  erreur: { label: "Erreur", color: "red", icon: WarningCircle },
  info: { label: "Information", color: "blue", icon: Info },
  alerte: { label: "Alerte", color: "orange", icon: Lightning },
};

function groupByDate(notifications: NotificationAdmin[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; items: NotificationAdmin[] }[] = [
    { label: "Aujourd'hui", items: [] },
    { label: "Hier", items: [] },
    { label: "Cette semaine", items: [] },
    { label: "Plus ancien", items: [] },
  ];

  for (const notif of notifications) {
    const date = new Date(notif.timestamp);
    if (date >= today) {
      groups[0].items.push(notif);
    } else if (date >= yesterday) {
      groups[1].items.push(notif);
    } else if (date >= weekAgo) {
      groups[2].items.push(notif);
    } else {
      groups[3].items.push(notif);
    }
  }

  return groups.filter((g) => g.items.length > 0);
}

function formatNotifTime(timestamp: string | Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "A l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Notification Item ───────────────────────────────────────────────────

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: NotificationAdmin;
  onMarkRead: (id: string) => void;
}) {
  const config = notificationTypeConfig[notification.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Box
        px="4"
        py="3"
        style={{
          background: notification.lu
            ? "transparent"
            : "var(--accent-a2)",
          borderRadius: 10,
          border: notification.lu
            ? "1px solid var(--gray-a3)"
            : "1px solid var(--accent-a4)",
          cursor: notification.lu ? "default" : "pointer",
          transition: "all 0.15s ease",
        }}
        onClick={() => {
          if (!notification.lu) onMarkRead(notification.id);
        }}
        onMouseEnter={(e) => {
          if (!notification.lu)
            e.currentTarget.style.background = "var(--accent-a3)";
        }}
        onMouseLeave={(e) => {
          if (!notification.lu)
            e.currentTarget.style.background = "var(--accent-a2)";
          else e.currentTarget.style.background = "transparent";
        }}
      >
        <Flex gap="3" align="start">
          {/* Icone */}
          <Flex
            align="center"
            justify="center"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: `var(--${config.color}-a3)`,
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            <Icon
              size={18}
              weight="duotone"
              style={{ color: `var(--${config.color}-9)` }}
            />
          </Flex>

          {/* Contenu */}
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Flex align="center" gap="2" mb="1">
              <Text size="2" weight={notification.lu ? "regular" : "bold"}>
                {notification.titre}
              </Text>
              {!notification.lu && (
                <Box
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--accent-9)",
                    flexShrink: 0,
                  }}
                />
              )}
            </Flex>
            <Text
              size="2"
              color="gray"
              style={{
                display: "block",
                lineHeight: 1.4,
              }}
            >
              {notification.message}
            </Text>
            <Flex align="center" gap="3" mt="2">
              <Text size="1" color="gray">
                {formatNotifTime(notification.timestamp)}
              </Text>
              <Badge
                size="1"
                variant="soft"
                color={config.color as "amber" | "gray" | "red" | "blue" | "orange"}
              >
                {config.label}
              </Badge>
              {notification.actionUrl && notification.actionLabel ? <Button
                  size="1"
                  variant="ghost"
                  color="blue"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = notification.actionUrl!;
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {notification.actionLabel}
                </Button> : null}
            </Flex>
          </Box>
        </Flex>
      </Box>
    </motion.div>
  );
}

// ── Skeleton ────────────────────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <Flex direction="column" gap="3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Box
          key={i}
          p="4"
          style={{
            borderRadius: 10,
            border: "1px solid var(--gray-a3)",
          }}
        >
          <Flex gap="3" align="start">
            <Skeleton
              style={{ width: 36, height: 36, borderRadius: 8 }}
            />
            <Box style={{ flex: 1 }}>
              <Skeleton style={{ height: 16, width: "60%", marginBottom: 8 }} />
              <Skeleton style={{ height: 14, width: "90%", marginBottom: 6 }} />
              <Skeleton style={{ height: 12, width: "30%" }} />
            </Box>
          </Flex>
        </Box>
      ))}
    </Flex>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

export function NotificationsCenter({
  notifications,
  isLoading = false,
  onMarkRead,
  onMarkAllRead,
  onLoadMore,
  hasMore = false,
}: NotificationsCenterProps) {
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterLu, setFilterLu] = useState<FilterLu>("all");

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.lu).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (filterType !== "all" && n.type !== filterType) return false;
      if (filterLu === "lu" && !n.lu) return false;
      if (filterLu === "non_lu" && n.lu) return false;
      return true;
    });
  }, [notifications, filterType, filterLu]);

  const groupedNotifications = useMemo(
    () => groupByDate(filteredNotifications),
    [filteredNotifications]
  );

  return (
    <Flex direction="column" gap="5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Flex align="center" justify="between">
          <Flex align="center" gap="3">
            <Box
              p="3"
              style={{
                background: "var(--accent-a3)",
                borderRadius: 8,
              }}
            >
              <BellRinging
                size={24}
                weight="duotone"
                style={{ color: "var(--accent-9)" }}
              />
            </Box>
            <Box>
              <Heading size="6" weight="bold">
                Notifications
              </Heading>
              <Flex align="center" gap="2" mt="1">
                <Text size="2" color="gray">
                  Centre de notifications admin
                </Text>
                {unreadCount > 0 && (
                  <Badge color="red" variant="solid" size="1" radius="full">
                    {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                  </Badge>
                )}
              </Flex>
            </Box>
          </Flex>

          {unreadCount > 0 && (
            <Button
              variant="soft"
              color="gray"
              size="2"
              onClick={onMarkAllRead}
              style={{ cursor: "pointer" }}
            >
              <Checks size={16} weight="bold" />
              Tout marquer comme lu
            </Button>
          )}
        </Flex>
      </motion.div>

      {/* Filtres */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
      >
        <Box
          p="4"
          style={{
            background: "var(--color-background)",
            borderRadius: 12,
            border: "1px solid var(--gray-a4)",
          }}
        >
          <Flex gap="3" align="center" wrap="wrap">
            <Flex align="center" gap="2">
              <Funnel
                size={14}
                weight="bold"
                style={{ color: "var(--gray-9)" }}
              />
              <Text size="2" color="gray" weight="medium">
                Filtres :
              </Text>
            </Flex>

            {/* Type */}
            <Select.Root
              value={filterType}
              onValueChange={(val) => setFilterType(val as FilterType)}
              size="2"
            >
              <Select.Trigger
                placeholder="Type"
                variant="surface"
                style={{ minWidth: 150 }}
              />
              <Select.Content position="popper">
                <Select.Item value="all">Tous les types</Select.Item>
                <Select.Separator />
                {Object.entries(notificationTypeConfig).map(([key, cfg]) => (
                  <Select.Item key={key} value={key}>
                    {cfg.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>

            {/* Lu / Non lu */}
            <Select.Root
              value={filterLu}
              onValueChange={(val) => setFilterLu(val as FilterLu)}
              size="2"
            >
              <Select.Trigger
                variant="surface"
                style={{ minWidth: 130 }}
              />
              <Select.Content position="popper">
                <Select.Item value="all">Toutes</Select.Item>
                <Select.Separator />
                <Select.Item value="non_lu">Non lues</Select.Item>
                <Select.Item value="lu">Lues</Select.Item>
              </Select.Content>
            </Select.Root>

            {/* Compteur resultats */}
            <Text size="2" color="gray" style={{ marginLeft: "auto" }}>
              {filteredNotifications.length} notification
              {filteredNotifications.length > 1 ? "s" : ""}
            </Text>
          </Flex>
        </Box>
      </motion.div>

      {/* Liste des notifications */}
      {isLoading ? (
        <NotificationSkeleton />
      ) : filteredNotifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.16 }}
        >
          <Flex
            direction="column"
            align="center"
            justify="center"
            py="9"
            gap="3"
          >
            <Box
              p="4"
              style={{
                background: "var(--gray-a3)",
                borderRadius: "50%",
              }}
            >
              <Bell
                size={32}
                weight="duotone"
                style={{ color: "var(--gray-8)" }}
              />
            </Box>
            <Heading size="4" color="gray" weight="medium">
              Aucune notification
            </Heading>
            <Text size="2" color="gray">
              {filterType !== "all" || filterLu !== "all"
                ? "Aucune notification ne correspond aux filtres"
                : "Vous n'avez aucune notification pour le moment"}
            </Text>
          </Flex>
        </motion.div>
      ) : (
        <ScrollArea style={{ maxHeight: "calc(100vh - 340px)" }}>
          <Flex direction="column" gap="5">
            <AnimatePresence mode="popLayout">
              {groupedNotifications.map((group) => (
                <motion.div
                  key={group.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box>
                    {/* Label du groupe */}
                    <Flex align="center" gap="2" mb="3">
                      <Text
                        size="1"
                        weight="bold"
                        color="gray"
                        style={{
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {group.label}
                      </Text>
                      <Box
                        style={{
                          flex: 1,
                          height: 1,
                          background: "var(--gray-a4)",
                        }}
                      />
                      <Badge size="1" variant="soft" color="gray">
                        {group.items.length}
                      </Badge>
                    </Flex>

                    {/* Items du groupe */}
                    <Flex direction="column" gap="2">
                      {group.items.map((notif) => (
                        <NotificationItem
                          key={notif.id}
                          notification={notif}
                          onMarkRead={onMarkRead}
                        />
                      ))}
                    </Flex>
                  </Box>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Charger plus */}
            {hasMore && onLoadMore ? <Flex justify="center" py="4">
                <Button
                  variant="soft"
                  color="gray"
                  onClick={onLoadMore}
                  style={{ cursor: "pointer" }}
                >
                  <CaretDown size={16} weight="bold" />
                  Charger plus
                </Button>
              </Flex> : null}
          </Flex>
        </ScrollArea>
      )}
    </Flex>
  );
}
