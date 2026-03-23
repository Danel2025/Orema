"use client";

/**
 * OrderCard - Carte de commande reutilisable pour Cuisine et Bar
 *
 * Affiche les details d'une commande avec ses lignes,
 * le temps ecoule, et les boutons d'action pour changer le statut.
 *
 * Ce composant est generique et ne contient aucune logique
 * specifique a la cuisine ou au bar.
 */

import { useState, useEffect, useCallback } from "react";
import { Badge, Box, Button, Card, Flex, Text } from "@/components/ui";
import { Separator } from "@radix-ui/themes";
import {
  Clock,
  ArrowRight,
  Check,
  Warning,
  User,
  MapPin,
  Note,
  HashStraight,
  Plus,
} from "@phosphor-icons/react";
import type { PendingOrder, PendingOrderLine } from "@/actions/preparation";
import type { StatutPreparation } from "@/lib/db/types";

// ============================================================================
// TYPES
// ============================================================================

interface OrderCardProps {
  order: PendingOrder;
  onStatusChange: (ligneId: string, newStatus: StatutPreparation) => void;
  onBulkStatusChange: (ligneIds: string[], newStatus: StatutPreparation) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const TYPE_VENTE_LABELS: Record<string, string> = {
  SUR_PLACE: "Table",
  DIRECT: "Direct",
  A_EMPORTER: "Emporter",
  LIVRAISON: "Livraison",
};

const TYPE_VENTE_COLORS: Record<string, "blue" | "orange" | "green" | "violet"> = {
  SUR_PLACE: "blue",
  DIRECT: "orange",
  A_EMPORTER: "green",
  LIVRAISON: "violet",
};

/**
 * Determine le statut dominant d'une commande en fonction de ses lignes.
 * Priorite : EN_ATTENTE > EN_PREPARATION > PRETE
 */
function getDominantStatus(lignes: PendingOrderLine[]): StatutPreparation {
  if (lignes.some((l) => l.statut_preparation === "EN_ATTENTE")) return "EN_ATTENTE";
  if (lignes.some((l) => l.statut_preparation === "EN_PREPARATION")) return "EN_PREPARATION";
  return "PRETE";
}

/**
 * Calcule le temps ecoule en minutes depuis une date donnee
 */
function getElapsedMinutes(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

/**
 * Formate le temps ecoule en texte lisible
 */
function formatElapsed(minutes: number): string {
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ============================================================================
// SOUS-COMPOSANT : LIGNE DE COMMANDE
// ============================================================================

function OrderLine({ ligne }: { ligne: PendingOrderLine }) {
  return (
    <Flex align="start" gap="2" py="1">
      <Badge
        variant="solid"
        color="gray"
        size="1"
        highContrast
        style={{ minWidth: 24, textAlign: "center", fontVariantNumeric: "tabular-nums" }}
      >
        {ligne.quantite}
      </Badge>
      <Box style={{ flex: 1, minWidth: 0 }}>
        <Text size="2" weight="medium" style={{ display: "block" }}>
          {ligne.produit_nom}
        </Text>
        {ligne.supplements.length > 0 && (
          <Flex gap="1" wrap="wrap" mt="1">
            {ligne.supplements.map((sup, i) => (
              <Badge key={i} variant="outline" color="gray" size="1">
                <Plus size={10} weight="bold" />
                {sup.nom}
              </Badge>
            ))}
          </Flex>
        )}
        {ligne.notes ? <Flex align="center" gap="1" mt="1">
            <Note size={12} style={{ color: "var(--amber-10)", flexShrink: 0 }} />
            <Text size="1" color="amber" style={{ fontStyle: "italic" }}>
              {ligne.notes}
            </Text>
          </Flex> : null}
      </Box>
    </Flex>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function OrderCard({ order, onStatusChange, onBulkStatusChange }: OrderCardProps) {
  const [elapsed, setElapsed] = useState(() => getElapsedMinutes(order.created_at));

  // Timer qui met a jour le temps ecoule toutes les secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(getElapsedMinutes(order.created_at));
    }, 1000);
    return () => clearInterval(interval);
  }, [order.created_at]);

  const dominantStatus = getDominantStatus(order.lignes);
  const isUrgent = dominantStatus === "EN_ATTENTE" && elapsed >= 15;

  // Determine l'action suivante basee sur le statut dominant
  const getNextStatus = useCallback((): StatutPreparation | null => {
    switch (dominantStatus) {
      case "EN_ATTENTE":
        return "EN_PREPARATION";
      case "EN_PREPARATION":
        return "PRETE";
      case "PRETE":
        return "SERVIE";
      default:
        return null;
    }
  }, [dominantStatus]);

  const getActionLabel = useCallback((): string => {
    switch (dominantStatus) {
      case "EN_ATTENTE":
        return "Commencer";
      case "EN_PREPARATION":
        return "Pret !";
      case "PRETE":
        return "Servi";
      default:
        return "";
    }
  }, [dominantStatus]);

  const getActionColor = useCallback((): "orange" | "blue" | "green" => {
    switch (dominantStatus) {
      case "EN_ATTENTE":
        return "blue";
      case "EN_PREPARATION":
        return "green";
      case "PRETE":
        return "green";
      default:
        return "blue";
    }
  }, [dominantStatus]);

  const getActionIcon = useCallback(() => {
    switch (dominantStatus) {
      case "EN_ATTENTE":
        return <ArrowRight size={16} weight="bold" />;
      case "EN_PREPARATION":
        return <Check size={16} weight="bold" />;
      case "PRETE":
        return <Check size={16} weight="bold" />;
      default:
        return null;
    }
  }, [dominantStatus]);

  const nextStatus = getNextStatus();

  // Action individuelle sur une ligne
  const handleLineAction = (ligne: PendingOrderLine) => {
    let lineNext: StatutPreparation | null = null;
    switch (ligne.statut_preparation) {
      case "EN_ATTENTE":
        lineNext = "EN_PREPARATION";
        break;
      case "EN_PREPARATION":
        lineNext = "PRETE";
        break;
      case "PRETE":
        lineNext = "SERVIE";
        break;
    }
    if (lineNext) {
      onStatusChange(ligne.id, lineNext);
    }
  };

  // Action en masse sur toutes les lignes ayant le statut dominant
  const handleBulkAction = () => {
    if (!nextStatus) return;
    const eligibleIds = order.lignes
      .filter((l) => l.statut_preparation === dominantStatus)
      .map((l) => l.id);
    if (eligibleIds.length > 0) {
      onBulkStatusChange(eligibleIds, nextStatus);
    }
  };

  // Couleur du temps ecoule
  const timerColor = isUrgent ? "red" : elapsed >= 10 ? "orange" : "gray";

  return (
    <Card
      size="2"
      style={{
        backgroundColor: isUrgent ? "var(--red-a2)" : undefined,
        animation: isUrgent ? "urgentPulse 2s ease-in-out infinite" : undefined,
        transition: "all 0.2s ease",
        border: "none",
        boxShadow: "0 2px 8px -3px var(--gray-a5)",
      }}
    >
      <Flex direction="column" gap="3">
        {/* Header : numero ticket + type + timer */}
        <Flex justify="between" align="center" gap="2">
          <Flex align="center" gap="2">
            <Flex align="center" gap="1">
              <HashStraight size={16} weight="bold" style={{ color: "var(--gray-10)" }} />
              <Text
                size="3"
                weight="bold"
                style={{
                  fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                }}
              >
                {order.numero_ticket}
              </Text>
            </Flex>
            <Badge
              color={TYPE_VENTE_COLORS[order.type_vente] ?? "gray"}
              variant="soft"
              size="1"
            >
              {TYPE_VENTE_LABELS[order.type_vente] ?? order.type_vente}
            </Badge>
          </Flex>

          {/* Timer */}
          <Flex align="center" gap="1">
            {isUrgent ? <Warning
                size={16}
                weight="fill"
                style={{ color: "var(--red-9)", animation: "urgentPulse 1s ease-in-out infinite" }}
              /> : null}
            <Clock
              size={14}
              weight={elapsed >= 10 ? "fill" : "regular"}
              style={{ color: `var(--${timerColor}-10)` }}
            />
            <Text
              size="1"
              weight="bold"
              style={{
                color: `var(--${timerColor}-11)`,
                fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatElapsed(elapsed)}
            </Text>
          </Flex>
        </Flex>

        {/* Info table + serveur */}
        {(order.table_numero || order.serveur_nom) ? <Flex gap="3" wrap="wrap">
            {order.table_numero ? <Flex align="center" gap="1">
                <MapPin size={14} style={{ color: "var(--gray-9)" }} />
                <Text size="1" color="gray">
                  Table {order.table_numero}
                  {order.table_zone ? ` - ${order.table_zone}` : ""}
                </Text>
              </Flex> : null}
            {order.serveur_nom ? <Flex align="center" gap="1">
                <User size={14} style={{ color: "var(--gray-9)" }} />
                <Text size="1" color="gray">
                  {order.serveur_nom}
                </Text>
              </Flex> : null}
          </Flex> : null}

        <Separator size="4" />

        {/* Liste des items */}
        <Flex direction="column" gap="1">
          {order.lignes.map((ligne) => (
            <Box
              key={ligne.id}
              onClick={() => handleLineAction(ligne)}
              style={{
                cursor: "pointer",
                borderRadius: "var(--radius-2)",
                padding: "2px 4px",
                margin: "-2px -4px",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--gray-a3)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              }}
            >
              <OrderLine ligne={ligne} />
            </Box>
          ))}
        </Flex>

        {/* Bouton d'action principal */}
        {nextStatus ? <Button
            variant="solid"
            color={getActionColor()}
            size="2"
            onClick={handleBulkAction}
            style={{
              cursor: "pointer",
              width: "100%",
              fontWeight: 600,
            }}
          >
            {getActionIcon()}
            {getActionLabel()} ({order.lignes.filter((l) => l.statut_preparation === dominantStatus).length})
          </Button> : null}
      </Flex>
    </Card>
  );
}
