"use client";

/**
 * BarDisplay - Ecran principal du Bar Display System
 *
 * Meme logique que KitchenDisplay mais filtre sur les categories bar.
 * Affiche les commandes en 3 colonnes selon leur statut de preparation :
 * - En attente (orange)
 * - En preparation (bleu)
 * - Pret (vert)
 *
 * Ecoute les changements en temps reel via useRealtimeOrders
 * et re-fetche les commandes quand un changement est detecte.
 *
 * Inclut alertes sonores et visuelles via useKdsAlerts.
 */

import { useState, useCallback, useTransition, useRef, useEffect } from "react";
import { Badge, Box, Button, Flex, Heading, IconButton, ScrollArea, Text } from "@/components/ui";
import { Tooltip } from "@radix-ui/themes";

import {
  BeerBottle,
  ArrowRight,
  ArrowsClockwise,
  SpeakerHigh,
  SpeakerSlash,
  BellRinging,
  ArrowsOut,
  ArrowsIn,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/context";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { useKdsAlerts } from "@/hooks/useKdsAlerts";
import { useFullscreen } from "@/hooks/useFullscreen";
import {
  getPendingOrders,
  updatePreparationStatus,
  updateBulkPreparationStatus,
} from "@/actions/preparation";
import type { PendingOrder } from "@/actions/preparation";
import type { StatutPreparation } from "@/lib/db/types";
import { OrderCard } from "@/components/cuisine/order-card";

// ============================================================================
// TYPES
// ============================================================================

interface BarDisplayProps {
  initialOrders: PendingOrder[];
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Regroupe les commandes en colonnes selon le statut dominant de chaque commande.
 * Une commande est dans la colonne correspondant a son statut le plus "en retard".
 */
function categorizeOrders(orders: PendingOrder[]) {
  const enAttente: PendingOrder[] = [];
  const enPreparation: PendingOrder[] = [];
  const pret: PendingOrder[] = [];

  for (const order of orders) {
    const hasEnAttente = order.lignes.some((l) => l.statut_preparation === "EN_ATTENTE");
    const hasEnPreparation = order.lignes.some((l) => l.statut_preparation === "EN_PREPARATION");
    const hasPret = order.lignes.some((l) => l.statut_preparation === "PRETE");

    if (hasEnAttente) {
      enAttente.push(order);
    } else if (hasEnPreparation) {
      enPreparation.push(order);
    } else if (hasPret) {
      pret.push(order);
    }
  }

  return { enAttente, enPreparation, pret };
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function BarDisplay({ initialOrders }: BarDisplayProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PendingOrder[]>(initialOrders);
  const [isPending, startTransition] = useTransition();
  const previousOrderIdsRef = useRef<Set<string>>(
    new Set(initialOrders.map((o) => o.vente_id))
  );

  const etablissementId = user?.etablissementId ?? null;

  // Mode plein ecran
  const { isFullscreen, isSupported: fullscreenSupported, toggleFullscreen } = useFullscreen();

  // Horloge pour le mode plein ecran
  const [clock, setClock] = useState("");
  useEffect(() => {
    if (!isFullscreen) return;
    const update = () => {
      setClock(
        new Date().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Africa/Libreville",
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isFullscreen]);

  // Alertes sonores et visuelles
  const {
    soundEnabled,
    toggleSound,
    newOrderIds,
    newOrderCount,
    acknowledgeAll,
    notifyNewOrder,
  } = useKdsAlerts();

  // Fonction de rafraichissement des commandes
  const refreshOrders = useCallback(async () => {
    if (!etablissementId) return;
    const result = await getPendingOrders("bar", etablissementId);
    if (result.success && result.data) {
      // Detecter les nouvelles commandes
      const newOrders = result.data;
      const currentIds = previousOrderIdsRef.current;
      for (const order of newOrders) {
        if (!currentIds.has(order.vente_id)) {
          notifyNewOrder(order.vente_id);
        }
      }
      previousOrderIdsRef.current = new Set(newOrders.map((o) => o.vente_id));
      setOrders(newOrders);
    }
  }, [etablissementId, notifyNewOrder]);

  // Ecoute les changements en temps reel
  useRealtimeOrders({
    etablissementId,
    enabled: !!etablissementId,
    onNewOrder: () => {
      refreshOrders();
    },
  });

  // Met a jour le statut d'une seule ligne
  const handleStatusChange = useCallback(
    (ligneVenteId: string, newStatus: StatutPreparation) => {
      startTransition(async () => {
        const result = await updatePreparationStatus(ligneVenteId, newStatus);
        if (result.success) {
          await refreshOrders();
        } else {
          toast.error(result.error ?? "Erreur lors de la mise à jour");
        }
      });
    },
    [refreshOrders]
  );

  // Met a jour le statut de plusieurs lignes
  const handleBulkStatusChange = useCallback(
    (ligneVenteIds: string[], newStatus: StatutPreparation) => {
      startTransition(async () => {
        const result = await updateBulkPreparationStatus(ligneVenteIds, newStatus);
        if (result.success) {
          toast.success(`${result.data?.count ?? 0} item(s) mis à jour`);
          await refreshOrders();
        } else {
          toast.error(result.error ?? "Erreur lors de la mise à jour");
        }
      });
    },
    [refreshOrders]
  );

  // Marquer toutes les commandes en attente comme "en préparation"
  const handleMarkAllInProgress = useCallback(() => {
    const allEnAttenteIds = orders.flatMap((o) =>
      o.lignes.filter((l) => l.statut_preparation === "EN_ATTENTE").map((l) => l.id)
    );
    if (allEnAttenteIds.length === 0) return;
    handleBulkStatusChange(allEnAttenteIds, "EN_PREPARATION");
  }, [orders, handleBulkStatusChange]);

  // Rafraichissement manuel
  const handleRefresh = useCallback(() => {
    startTransition(async () => {
      await refreshOrders();
      toast.success("Commandes rafraichies");
    });
  }, [refreshOrders]);

  const { enAttente, enPreparation, pret } = categorizeOrders(orders);
  const totalOrders = orders.length;

  return (
    <Flex
      direction="column"
      gap="4"
      style={{
        height: "100%",
        opacity: isPending ? 0.7 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      {/* Header */}
      <Flex justify="between" align="center">
        <Flex align="center" gap="3">
          <BeerBottle size={22} weight="bold" style={{ color: "var(--gray-10)" }} />
          <div>
            <Flex align="center" gap="2">
              <Heading as="h1" size="5" weight="bold" style={{ letterSpacing: "-0.02em" }}>
                Bar
              </Heading>
              <Text
                size="2"
                weight="bold"
                style={{
                  color: "var(--gray-11)",
                  backgroundColor: "var(--gray-a3)",
                  borderRadius: 99,
                  padding: "1px 10px",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {totalOrders}
              </Text>
              {newOrderCount > 0 && (
                <Badge
                  color="red"
                  variant="solid"
                  size="1"
                  highContrast
                  style={{ cursor: "pointer", animation: "kds-badge-pulse 1s ease-in-out infinite" }}
                  onClick={acknowledgeAll}
                >
                  <BellRinging size={12} weight="fill" />
                  {newOrderCount} nouvelle{newOrderCount > 1 ? "s" : ""}
                </Badge>
              )}
            </Flex>
          </div>
        </Flex>

        <Flex align="center" gap="2">
          {/* Horloge en mode plein ecran */}
          {isFullscreen ? <Text
              size="5"
              weight="bold"
              style={{
                fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                fontVariantNumeric: "tabular-nums",
                color: "var(--gray-12)",
                marginRight: 8,
              }}
            >
              {clock}
            </Text> : null}

          {/* Toggle son */}
          <Tooltip content={soundEnabled ? "Désactiver le son" : "Activer le son"}>
            <IconButton
              variant="surface"
              color={soundEnabled ? "green" : "gray"}
              size="2"
              onClick={toggleSound}
              style={{ cursor: "pointer" }}
              aria-label={soundEnabled ? "Désactiver le son" : "Activer le son"}
            >
              {soundEnabled ? (
                <SpeakerHigh size={16} weight="fill" />
              ) : (
                <SpeakerSlash size={16} weight="fill" />
              )}
            </IconButton>
          </Tooltip>

          {/* Toggle plein ecran */}
          {fullscreenSupported ? <Tooltip content={isFullscreen ? "Quitter le plein ecran" : "Plein ecran"}>
              <IconButton
                variant="surface"
                color={isFullscreen ? "blue" : "gray"}
                size="2"
                onClick={() => void toggleFullscreen()}
                style={{ cursor: "pointer" }}
                aria-label={isFullscreen ? "Quitter le plein ecran" : "Plein ecran"}
              >
                {isFullscreen ? (
                  <ArrowsIn size={16} weight="bold" />
                ) : (
                  <ArrowsOut size={16} weight="bold" />
                )}
              </IconButton>
            </Tooltip> : null}

          <Tooltip content="Rafraichir les commandes">
            <IconButton
              variant="surface"
              color="gray"
              size="2"
              onClick={handleRefresh}
              disabled={isPending}
              style={{ cursor: "pointer" }}
              aria-label="Rafraichir les commandes"
            >
              <ArrowsClockwise
                size={16}
                style={{
                  animation: isPending ? "spin 1s linear infinite" : "none",
                }}
              />
            </IconButton>
          </Tooltip>
        </Flex>
      </Flex>

      {/* Colonnes */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 24,
        }}
      >
        {/* Colonne En Attente */}
        <Column
          title="En attente"
          count={enAttente.length}
          color="orange"
          orders={enAttente}
          newOrderIds={newOrderIds}
          onStatusChange={handleStatusChange}
          onBulkStatusChange={handleBulkStatusChange}
          headerAction={
            enAttente.length > 0 ? (
              <Tooltip content="Tout passer en préparation">
                <Button
                  variant="soft"
                  color="orange"
                  size="1"
                  onClick={handleMarkAllInProgress}
                  disabled={isPending}
                  style={{ cursor: "pointer" }}
                >
                  <ArrowRight size={14} weight="bold" />
                  Tout commencer
                </Button>
              </Tooltip>
            ) : null
          }
        />

        {/* Colonne En Preparation */}
        <Column
          title="En préparation"
          count={enPreparation.length}
          color="blue"
          orders={enPreparation}
          newOrderIds={newOrderIds}
          onStatusChange={handleStatusChange}
          onBulkStatusChange={handleBulkStatusChange}
        />

        {/* Colonne Pret */}
        <Column
          title="Pret"
          count={pret.length}
          color="green"
          orders={pret}
          newOrderIds={newOrderIds}
          onStatusChange={handleStatusChange}
          onBulkStatusChange={handleBulkStatusChange}
        />
      </div>

      {/* Etat vide */}
      {totalOrders === 0 && (
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap="5"
          style={{
            position: "absolute",
            inset: 0,
            top: 80,
            pointerEvents: "none",
          }}
        >
          <Flex align="center" gap="3">
            {(["orange", "blue", "green"] as const).map((c, i) => (
              <div
                key={c}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: `var(--${c}-8)`,
                  animation: "kds-dot-pulse 2s ease-in-out infinite",
                  animationDelay: `${i * 0.25}s`,
                }}
              />
            ))}
          </Flex>
          <Flex direction="column" align="center" gap="1">
            <Text size="3" weight="medium" style={{ color: "var(--gray-10)" }}>
              Aucune commande en cours
            </Text>
            <Text size="2" style={{ color: "var(--gray-7)" }}>
              Les nouvelles commandes de boissons apparaitront ici automatiquement
            </Text>
          </Flex>
        </Flex>
      )}

      {/* Styles pour les animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes urgentPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes kds-new-order-glow {
          0%, 100% { box-shadow: 0 2px 8px -3px var(--gray-a5); }
          50% { box-shadow: 0 0 12px 2px var(--blue-a5); }
        }
        @keyframes kds-badge-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes kds-dot-pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.6); opacity: 0.7; }
        }
      `}</style>
    </Flex>
  );
}

// ============================================================================
// SOUS-COMPOSANT : COLONNE
// ============================================================================

interface ColumnProps {
  title: string;
  count: number;
  color: "orange" | "blue" | "green";
  orders: PendingOrder[];
  newOrderIds: Set<string>;
  onStatusChange: (ligneId: string, newStatus: StatutPreparation) => void;
  onBulkStatusChange: (ligneIds: string[], newStatus: StatutPreparation) => void;
  headerAction?: React.ReactNode;
}

function Column({
  title,
  count,
  color,
  orders,
  newOrderIds,
  onStatusChange,
  onBulkStatusChange,
  headerAction,
}: ColumnProps) {
  return (
    <Flex direction="column" style={{ minHeight: 0 }}>
      {/* Header minimaliste : dot + titre + compteur */}
      <Flex align="center" gap="2" style={{ padding: "0 8px 12px", flexShrink: 0 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: `var(--${color}-9)`,
            flexShrink: 0,
          }}
        />
        <Text size="2" weight="bold" style={{ color: "var(--gray-12)" }}>
          {title}
        </Text>
        <Text
          size="2"
          style={{
            color: "var(--gray-8)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {count}
        </Text>
        {headerAction ? <Box style={{ marginLeft: "auto" }}>{headerAction}</Box> : null}
      </Flex>

      {/* Liste des commandes */}
      <ScrollArea scrollbars="vertical" style={{ flex: 1 }}>
        <Flex direction="column" gap="3" style={{ padding: "0 4px 8px" }}>
          {orders.length === 0 ? (
            <Flex
              direction="column"
              align="center"
              justify="center"
              py="9"
            >
              <Text size="2" style={{ color: "var(--gray-7)" }}>
                Aucune commande
              </Text>
            </Flex>
          ) : (
            orders.map((order) => (
              <div
                key={order.vente_id}
                style={{
                  animation: newOrderIds.has(order.vente_id)
                    ? "kds-new-order-glow 1.5s ease-in-out 3"
                    : undefined,
                  borderRadius: "var(--radius-3)",
                }}
              >
                <OrderCard
                  order={order}
                  onStatusChange={onStatusChange}
                  onBulkStatusChange={onBulkStatusChange}
                />
              </div>
            ))
          )}
        </Flex>
      </ScrollArea>
    </Flex>
  );
}
