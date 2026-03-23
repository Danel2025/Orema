"use client";

/**
 * Onglet Activite / Audit - Detail etablissement
 * Timeline verticale des evenements avec filtres
 */

import { useState } from "react";
import { Box, Flex, Text, Badge, Button, Select } from "@radix-ui/themes";
import {
  ClockCounterClockwise,
  SignIn,
  PencilSimple,
  Trash,
  CurrencyCircleDollar,
  Package,
  Warning,
  ShieldCheck,
  ArrowClockwise,
  FunnelSimple,
  CaretDown,
  UserCircle,
  Receipt,
  Export,
} from "@phosphor-icons/react";
import type { IconWeight } from "@phosphor-icons/react";
import { motion } from "motion/react";

interface AuditEvent {
  id: string;
  action: string;
  entite: string;
  entiteId?: string;
  description: string;
  utilisateurNom?: string;
  utilisateurEmail?: string;
  createdAt: string;
  severity?: "info" | "warning" | "danger";
  ancienneValeur?: string | null;
  nouvelleValeur?: string | null;
}

interface AuditTabProps {
  events: AuditEvent[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onFilterChange?: (filters: { action?: string; userId?: string; dateRange?: string }) => void;
  users?: Array<{ id: string; nom: string; prenom: string }>;
}

const actionConfig: Record<
  string,
  {
    icon: React.ComponentType<{ size?: number; weight?: IconWeight; style?: React.CSSProperties }>;
    label: string;
    severity: "info" | "warning" | "danger";
  }
> = {
  CREATE: { icon: Package, label: "Creation", severity: "info" },
  UPDATE: { icon: PencilSimple, label: "Modification", severity: "info" },
  DELETE: { icon: Trash, label: "Suppression", severity: "danger" },
  LOGIN: { icon: SignIn, label: "Connexion", severity: "info" },
  LOGOUT: { icon: SignIn, label: "Deconnexion", severity: "info" },
  CAISSE_OUVERTURE: { icon: Receipt, label: "Ouverture caisse", severity: "info" },
  CAISSE_CLOTURE: { icon: Receipt, label: "Cloture caisse", severity: "info" },
  ANNULATION_VENTE: { icon: CurrencyCircleDollar, label: "Annulation vente", severity: "danger" },
  REMISE_APPLIQUEE: { icon: CurrencyCircleDollar, label: "Remise appliquee", severity: "warning" },
  SUSPENSION: { icon: Warning, label: "Suspension", severity: "danger" },
  REACTIVATION: { icon: ShieldCheck, label: "Reactivation", severity: "info" },
  IMPERSONATION: { icon: UserCircle, label: "Impersonation", severity: "warning" },
  EXPORT: { icon: Export, label: "Export", severity: "info" },
};

const severityColors: Record<string, string> = {
  info: "var(--blue-9)",
  warning: "var(--amber-9)",
  danger: "var(--red-9)",
};

const severityBgColors: Record<string, string> = {
  info: "var(--blue-a3)",
  warning: "var(--amber-a3)",
  danger: "var(--red-a3)",
};

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "A l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem.`;
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function AuditTab({
  events,
  isLoading,
  hasMore,
  onLoadMore,
  onFilterChange,
  users,
}: AuditTabProps) {
  const [actionFilter, setActionFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const handleFilterChange = (type: string, value: string) => {
    const newFilters: { action?: string; userId?: string; dateRange?: string } = {};

    if (type === "action") {
      setActionFilter(value);
      newFilters.action = value === "all" ? undefined : value;
    } else if (type === "user") {
      setUserFilter(value);
      newFilters.userId = value === "all" ? undefined : value;
    } else if (type === "date") {
      setDateFilter(value);
      newFilters.dateRange = value === "all" ? undefined : value;
    }

    onFilterChange?.(newFilters);
  };

  return (
    <Box>
      {/* Filtres */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Flex gap="3" mb="5" align="end" wrap="wrap">
          <Flex align="center" gap="2">
            <FunnelSimple size={16} weight="bold" style={{ color: "var(--gray-9)" }} />
            <Text size="2" color="gray" weight="medium">
              Filtres
            </Text>
          </Flex>

          <Select.Root value={actionFilter} onValueChange={(v) => handleFilterChange("action", v)}>
            <Select.Trigger placeholder="Type d'action" variant="surface" />
            <Select.Content>
              <Select.Item value="all">Toutes les actions</Select.Item>
              <Select.Separator />
              {Object.entries(actionConfig).map(([action, config]) => (
                <Select.Item key={action} value={action}>
                  {config.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>

          {users && users.length > 0 ? <Select.Root value={userFilter} onValueChange={(v) => handleFilterChange("user", v)}>
              <Select.Trigger placeholder="Utilisateur" variant="surface" />
              <Select.Content>
                <Select.Item value="all">Tous les utilisateurs</Select.Item>
                <Select.Separator />
                {users.map((user) => (
                  <Select.Item key={user.id} value={user.id}>
                    {user.prenom} {user.nom}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root> : null}

          <Select.Root value={dateFilter} onValueChange={(v) => handleFilterChange("date", v)}>
            <Select.Trigger placeholder="Periode" variant="surface" />
            <Select.Content>
              <Select.Item value="all">Toutes les dates</Select.Item>
              <Select.Separator />
              <Select.Item value="today">Aujourd'hui</Select.Item>
              <Select.Item value="week">Cette semaine</Select.Item>
              <Select.Item value="month">Ce mois</Select.Item>
              <Select.Item value="quarter">Ce trimestre</Select.Item>
            </Select.Content>
          </Select.Root>
        </Flex>
      </motion.div>

      {/* Timeline */}
      <Box
        style={{
          position: "relative",
          paddingLeft: 32,
        }}
      >
        {/* Ligne verticale */}
        <Box
          style={{
            position: "absolute",
            left: 15,
            top: 0,
            bottom: 0,
            width: 2,
            background: "var(--gray-a4)",
          }}
        />

        {isLoading && events.length === 0 ? (
          <Flex direction="column" gap="4">
            {Array.from({ length: 5 }).map((_, i) => (
              <AuditEventSkeleton key={i} />
            ))}
          </Flex>
        ) : events.length === 0 ? (
          <Flex
            direction="column"
            align="center"
            justify="center"
            py="8"
            gap="2"
            style={{ paddingLeft: 0 }}
          >
            <ClockCounterClockwise size={32} weight="duotone" style={{ color: "var(--gray-8)" }} />
            <Text color="gray" size="2">
              Aucune activite enregistree
            </Text>
          </Flex>
        ) : (
          <Flex direction="column" gap="1">
            {events.map((event, index) => {
              const config = actionConfig[event.action] || {
                icon: ClockCounterClockwise,
                label: event.action,
                severity: "info",
              };
              const severity = event.severity || config.severity;
              const Icon = config.icon;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.03 }}
                >
                  <Flex gap="3" py="3">
                    {/* Point sur la timeline */}
                    <Box
                      style={{
                        position: "absolute",
                        left: 8,
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: severityBgColors[severity],
                        border: `2px solid ${severityColors[severity]}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: 2,
                      }}
                    />

                    {/* Contenu de l'evenement */}
                    <Box style={{ flex: 1 }}>
                      <Flex align="center" gap="2" mb="1">
                        <Icon
                          size={14}
                          weight="bold"
                          style={{ color: severityColors[severity] }}
                        />
                        <Badge
                          variant="soft"
                          size="1"
                          color={
                            severity === "danger"
                              ? "red"
                              : severity === "warning"
                                ? "amber"
                                : "blue"
                          }
                        >
                          {config.label}
                        </Badge>
                        <Text size="1" color="gray">
                          {getRelativeTime(event.createdAt)}
                        </Text>
                      </Flex>

                      <Text size="2" style={{ display: "block", marginBottom: 4 }}>
                        {event.description}
                      </Text>

                      {event.utilisateurNom ? <Flex align="center" gap="1">
                          <UserCircle size={12} weight="bold" style={{ color: "var(--gray-8)" }} />
                          <Text size="1" color="gray">
                            {event.utilisateurNom}
                            {event.utilisateurEmail ? ` (${event.utilisateurEmail})` : null}
                          </Text>
                        </Flex> : null}
                    </Box>
                  </Flex>
                </motion.div>
              );
            })}
          </Flex>
        )}

        {/* Bouton charger plus */}
        {hasMore ? <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Flex justify="center" py="4">
              <Button
                variant="soft"
                color="gray"
                onClick={onLoadMore}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <ArrowClockwise size={14} weight="bold" className="animate-spin" />
                    Chargement...
                  </>
                ) : (
                  <>
                    <CaretDown size={14} weight="bold" />
                    Charger plus
                  </>
                )}
              </Button>
            </Flex>
          </motion.div> : null}
      </Box>
    </Box>
  );
}

function AuditEventSkeleton() {
  return (
    <Flex gap="3" py="3">
      <Box
        style={{
          position: "absolute",
          left: 8,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "var(--gray-a3)",
        }}
      />
      <Box style={{ flex: 1 }}>
        <Flex align="center" gap="2" mb="2">
          <Box style={{ width: 60, height: 18, borderRadius: 9999, background: "var(--gray-a3)" }} />
          <Box style={{ width: 80, height: 12, borderRadius: 4, background: "var(--gray-a3)" }} />
        </Flex>
        <Box style={{ width: "80%", height: 14, borderRadius: 4, background: "var(--gray-a3)", marginBottom: 4 }} />
        <Box style={{ width: 120, height: 12, borderRadius: 4, background: "var(--gray-a3)" }} />
      </Box>
    </Flex>
  );
}
