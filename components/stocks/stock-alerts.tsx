"use client";

/**
 * StockAlerts - Liste des produits en alerte ou rupture de stock
 * Notifications visuelles avec possibilité d'action rapide
 */

import { useState } from "react";
import {
  Card,
  Flex,
  Text,
  Badge,
  Button,
  Box,
  IconButton,
  Tooltip,
  Tabs,
} from "@radix-ui/themes";
import { ScrollArea } from "@/components/ui";
import {
  AlertTriangle,
  XCircle,
  Plus,
  Bell,
  BellOff,
  Package,
} from "lucide-react";
import type { AlerteStock } from "@/schemas/stock.schema";

interface StockAlertsProps {
  alertes: AlerteStock[];
  onCreateMovement: (produitId: string, produitNom: string) => void;
}

export function StockAlerts({ alertes, onCreateMovement }: StockAlertsProps) {
  const [filter, setFilter] = useState<"all" | "RUPTURE" | "ALERTE">("all");

  const ruptures = alertes.filter((a) => a.statut === "RUPTURE");
  const alertesOnly = alertes.filter((a) => a.statut === "ALERTE");

  const filteredAlertes =
    filter === "all"
      ? alertes
      : filter === "RUPTURE"
      ? ruptures
      : alertesOnly;

  if (alertes.length === 0) {
    return (
      <Card>
        <Flex
          direction="column"
          align="center"
          justify="center"
          py="6"
          gap="3"
        >
          <Box
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              backgroundColor: "var(--green-a3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BellOff size={28} style={{ color: "var(--green-9)" }} />
          </Box>
          <Text size="3" weight="medium" color="green">
            Aucune alerte de stock
          </Text>
          <Text size="2" color="gray" align="center">
            Tous les produits ont un stock suffisant
          </Text>
        </Flex>
      </Card>
    );
  }

  return (
    <Card>
      <Flex direction="column" gap="4">
        {/* En-tête */}
        <Flex justify="between" align="center">
          <Flex align="center" gap="2">
            <Bell size={18} style={{ color: "var(--accent-9)" }} />
            <Text size="3" weight="medium">
              Alertes de stock
            </Text>
            <Badge color="violet" variant="soft">
              {alertes.length}
            </Badge>
          </Flex>
        </Flex>

        {/* Résumé */}
        <Flex gap="3">
          <Box
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 8,
              backgroundColor: "var(--red-a3)",
            }}
          >
            <Flex align="center" gap="2">
              <XCircle size={16} style={{ color: "var(--red-9)" }} />
              <Text size="2" color="red" weight="medium">
                Ruptures: {ruptures.length}
              </Text>
            </Flex>
          </Box>
          <Box
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 8,
              backgroundColor: "var(--violet-a3)",
            }}
          >
            <Flex align="center" gap="2">
              <AlertTriangle size={16} style={{ color: "var(--accent-9)" }} />
              <Text size="2" color="violet" weight="medium">
                Alertes: {alertesOnly.length}
              </Text>
            </Flex>
          </Box>
        </Flex>

        {/* Onglets de filtrage */}
        <Tabs.Root value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <Tabs.List>
            <Tabs.Trigger value="all">
              Tous ({alertes.length})
            </Tabs.Trigger>
            <Tabs.Trigger value="RUPTURE">
              <Flex align="center" gap="1">
                <XCircle size={12} />
                Ruptures ({ruptures.length})
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value="ALERTE">
              <Flex align="center" gap="1">
                <AlertTriangle size={12} />
                Alertes ({alertesOnly.length})
              </Flex>
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>

        {/* Liste des alertes */}
        <ScrollArea style={{ maxHeight: 400 }}>
          <Flex direction="column" gap="2">
            {filteredAlertes.map((alerte) => (
              <Box
                key={alerte.id}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor:
                    alerte.statut === "RUPTURE"
                      ? "var(--red-a2)"
                      : "var(--violet-a2)",
                  border: `1px solid ${
                    alerte.statut === "RUPTURE"
                      ? "var(--red-a6)"
                      : "var(--violet-a6)"
                  }`,
                }}
              >
                <Flex justify="between" align="center" gap="3">
                  <Flex direction="column" gap="1" style={{ flex: 1 }}>
                    <Flex align="center" gap="2">
                      {alerte.statut === "RUPTURE" ? (
                        <XCircle size={14} style={{ color: "var(--red-9)" }} />
                      ) : (
                        <AlertTriangle
                          size={14}
                          style={{ color: "var(--accent-9)" }}
                        />
                      )}
                      <Text size="2" weight="medium">
                        {alerte.nom}
                      </Text>
                    </Flex>
                    <Flex align="center" gap="3">
                      <Flex align="center" gap="1">
                        <Box
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            backgroundColor: alerte.categorie.couleur,
                          }}
                        />
                        <Text size="1" color="gray">
                          {alerte.categorie.nom}
                        </Text>
                      </Flex>
                      <Text size="1" color="gray">
                        Stock: {alerte.stockActuel} / Min: {alerte.stockMin}{" "}
                        {alerte.unite || ""}
                      </Text>
                    </Flex>
                  </Flex>

                  <Flex align="center" gap="2">
                    <Badge
                      color={alerte.statut === "RUPTURE" ? "red" : "violet"}
                      variant="soft"
                    >
                      {alerte.statut === "RUPTURE" ? "Rupture" : "Alerte"}
                    </Badge>
                    <Tooltip content="Réapprovisionner">
                      <IconButton
                        size="1"
                        variant="soft"
                        color={alerte.statut === "RUPTURE" ? "red" : "violet"}
                        onClick={() => onCreateMovement(alerte.id, alerte.nom)}
                      >
                        <Plus size={14} />
                      </IconButton>
                    </Tooltip>
                  </Flex>
                </Flex>
              </Box>
            ))}
          </Flex>
        </ScrollArea>
      </Flex>
    </Card>
  );
}

/**
 * Widget compact pour la sidebar ou le dashboard
 */
export function StockAlertsWidget({
  alertes,
  onViewAll,
}: {
  alertes: AlerteStock[];
  onViewAll: () => void;
}) {
  const ruptures = alertes.filter((a) => a.statut === "RUPTURE").length;
  const alertesCount = alertes.filter((a) => a.statut === "ALERTE").length;

  if (alertes.length === 0) {
    return null;
  }

  return (
    <Box
      style={{
        padding: 12,
        borderRadius: 8,
        backgroundColor:
          ruptures > 0 ? "var(--red-a3)" : "var(--violet-a3)",
        border: `1px solid ${
          ruptures > 0 ? "var(--red-a6)" : "var(--violet-a6)"
        }`,
      }}
    >
      <Flex justify="between" align="center">
        <Flex align="center" gap="2">
          {ruptures > 0 ? (
            <XCircle size={16} style={{ color: "var(--red-9)" }} />
          ) : (
            <AlertTriangle size={16} style={{ color: "var(--accent-9)" }} />
          )}
          <Flex direction="column">
            <Text size="2" weight="medium">
              {ruptures > 0 ? `${ruptures} rupture(s)` : `${alertesCount} alerte(s)`}
            </Text>
            <Text size="1" color="gray">
              {ruptures > 0 && alertesCount > 0
                ? `+ ${alertesCount} alerte(s)`
                : "Stock bas"}
            </Text>
          </Flex>
        </Flex>
        <Button size="1" variant="soft" color={ruptures > 0 ? "red" : "violet"} onClick={onViewAll}>
          Voir
        </Button>
      </Flex>
    </Box>
  );
}
