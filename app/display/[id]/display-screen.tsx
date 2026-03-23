"use client";

/**
 * DisplayScreen - Composant client pour l'ecran d'affichage kiosque
 *
 * Affiche les commandes en 3 colonnes (En attente / En preparation / Pret)
 * Fonctionne SANS session utilisateur - auth par token d'ecran.
 *
 * Utilise les API routes /api/display/orders et /api/display/status
 * au lieu des Server Actions (qui necessitent une session).
 *
 * Reutilise OrderCard de components/cuisine pour l'affichage des commandes.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { Badge, Box, Button, Flex, Heading, IconButton, ScrollArea, Text } from "@/components/ui";
import { Tooltip } from "@radix-ui/themes";
import {
  CookingPot,
  BeerBottle,
  Clock,
  ArrowRight,
  ArrowsClockwise,
  SpeakerHigh,
  SpeakerSlash,
  BellRinging,
  ArrowsOut,
  ArrowsIn,
  SignOut,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useFullscreen } from "@/hooks/useFullscreen";
import { useKdsAlerts } from "@/hooks/useKdsAlerts";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { OrderCard } from "@/components/cuisine/order-card";
import type { PendingOrder } from "@/actions/preparation";
import type { StatutPreparation } from "@/lib/db/types";

// ============================================================================
// TYPES
// ============================================================================

interface DisplayScreenProps {
  ecranId: string;
  ecranNom: string;
  ecranType: "CUISINE" | "BAR" | "PERSONNALISE";
  categories: string[] | null;
  etablissementId: string;
  sonActif: boolean;
  delaiUrgence: number;
}

// ============================================================================
// HELPERS
// ============================================================================

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

function getTypeConfig(ecranType: "CUISINE" | "BAR" | "PERSONNALISE") {
  switch (ecranType) {
    case "BAR":
      return {
        icon: <BeerBottle size={24} weight="fill" />,
        color: "blue" as const,
        accentBg: "var(--blue-a3)",
        accentFg: "var(--blue-9)",
        label: "Bar",
        fetchType: "bar" as const,
      };
    case "CUISINE":
    case "PERSONNALISE":
    default:
      return {
        icon: <CookingPot size={24} weight="fill" />,
        color: "orange" as const,
        accentBg: "var(--orange-a3)",
        accentFg: "var(--orange-9)",
        label: "Cuisine",
        fetchType: "cuisine" as const,
      };
  }
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function DisplayScreen({
  ecranNom,
  ecranType,
  etablissementId,
  sonActif,
  delaiUrgence,
}: DisplayScreenProps) {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const previousOrderIdsRef = useRef<Set<string>>(new Set());
  const tokenRef = useRef<string>("");

  const config = getTypeConfig(ecranType);

  // Extraire le token de l'URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    tokenRef.current = params.get("token") ?? "";
  }, []);

  // Mode plein ecran
  const { isFullscreen, isSupported: fullscreenSupported, toggleFullscreen, enterFullscreen } =
    useFullscreen();

  // Auto-enter fullscreen au montage
  useEffect(() => {
    const timer = setTimeout(() => {
      enterFullscreen().catch(() => {
        // L'utilisateur n'a pas encore interagi - le fullscreen auto est bloque
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [enterFullscreen]);

  // Horloge
  const [clock, setClock] = useState("");
  useEffect(() => {
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
  }, []);

  // Alertes sonores
  const {
    soundEnabled,
    toggleSound,
    newOrderIds,
    newOrderCount,
    acknowledgeAll,
    notifyNewOrder,
  } = useKdsAlerts();

  // Initialiser le son selon la config de l'ecran
  useEffect(() => {
    if (!sonActif && soundEnabled) {
      toggleSound();
    }
    // Seulement au montage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recuperer les commandes via API route
  const fetchOrders = useCallback(async () => {
    if (!tokenRef.current) return;

    try {
      const url = `/api/display/orders?token=${encodeURIComponent(tokenRef.current)}&type=${config.fetchType}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          toast.error("Token expire ou invalide");
        }
        console.error("[DisplayScreen] Fetch error:", errorData);
        return;
      }

      const result = await response.json();
      if (result.success && result.data) {
        const newOrders = result.data as PendingOrder[];

        // Detecter les nouvelles commandes
        const currentIds = previousOrderIdsRef.current;
        for (const order of newOrders) {
          if (!currentIds.has(order.vente_id)) {
            notifyNewOrder(order.vente_id);
          }
        }
        previousOrderIdsRef.current = new Set(newOrders.map((o) => o.vente_id));
        setOrders(newOrders);
      }
    } catch (error) {
      console.error("[DisplayScreen] Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [config.fetchType, notifyNewOrder]);

  // Fetch initial
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Polling toutes les 10 secondes en complement du realtime
  useEffect(() => {
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Ecouter les changements en temps reel
  useRealtimeOrders({
    etablissementId,
    enabled: true,
    onNewOrder: () => {
      fetchOrders();
    },
  });

  // Mettre a jour le statut d'une ligne via API
  const handleStatusChange = useCallback(
    async (ligneVenteId: string, newStatus: StatutPreparation) => {
      if (!tokenRef.current) return;
      setIsUpdating(true);

      try {
        const response = await fetch("/api/display/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: tokenRef.current,
            ligneVenteIds: [ligneVenteId],
            statut: newStatus,
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          toast.error(error.error ?? "Erreur de mise a jour");
          return;
        }

        await fetchOrders();
      } catch (error) {
        console.error("[DisplayScreen] Status update error:", error);
        toast.error("Erreur de mise a jour");
      } finally {
        setIsUpdating(false);
      }
    },
    [fetchOrders]
  );

  // Mettre a jour le statut de plusieurs lignes
  const handleBulkStatusChange = useCallback(
    async (ligneVenteIds: string[], newStatus: StatutPreparation) => {
      if (!tokenRef.current) return;
      setIsUpdating(true);

      try {
        const response = await fetch("/api/display/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: tokenRef.current,
            ligneVenteIds,
            statut: newStatus,
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          toast.error(error.error ?? "Erreur de mise a jour");
          return;
        }

        const result = await response.json();
        toast.success(`${result.data?.count ?? 0} item(s) mis a jour`);
        await fetchOrders();
      } catch (error) {
        console.error("[DisplayScreen] Bulk status update error:", error);
        toast.error("Erreur de mise a jour");
      } finally {
        setIsUpdating(false);
      }
    },
    [fetchOrders]
  );

  // Marquer tout en preparation
  const handleMarkAllInProgress = useCallback(() => {
    const allEnAttenteIds = orders.flatMap((o) =>
      o.lignes.filter((l) => l.statut_preparation === "EN_ATTENTE").map((l) => l.id)
    );
    if (allEnAttenteIds.length === 0) return;
    handleBulkStatusChange(allEnAttenteIds, "EN_PREPARATION");
  }, [orders, handleBulkStatusChange]);

  // Rafraichissement manuel
  const handleRefresh = useCallback(() => {
    fetchOrders();
    toast.success("Commandes rafraichies");
  }, [fetchOrders]);

  // Quitter
  const handleQuit = useCallback(() => {
    setShowQuitConfirm(true);
  }, []);

  const handleConfirmQuit = useCallback(() => {
    window.location.href = "/login";
  }, []);

  const { enAttente, enPreparation, pret } = categorizeOrders(orders);
  const totalOrders = orders.length;
  const isPending = isLoading || isUpdating;

  return (
    <Flex
      direction="column"
      style={{
        height: "100vh",
        width: "100vw",
        padding: 16,
        opacity: isPending ? 0.85 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      {/* Header */}
      <Flex justify="between" align="center" py="2" px="2" mb="3">
        <Flex align="center" gap="3">
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: config.accentBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: config.accentFg }}>{config.icon}</span>
          </div>
          <div>
            <Flex align="center" gap="2">
              <Heading as="h1" size="6" weight="bold">
                {ecranNom}
              </Heading>
              <Badge color={config.color} variant="soft" size="2">
                {totalOrders}
              </Badge>
              {newOrderCount > 0 && (
                <Badge
                  color="red"
                  variant="solid"
                  size="1"
                  highContrast
                  style={{ animation: "kds-badge-pulse 1s ease-in-out infinite", cursor: "pointer" }}
                  onClick={acknowledgeAll}
                >
                  <BellRinging size={12} weight="fill" />
                  {newOrderCount} nouvelle{newOrderCount > 1 ? "s" : ""}
                </Badge>
              )}
            </Flex>
            <Text size="2" color="gray">
              Ecran {config.label}
            </Text>
          </div>
        </Flex>

        <Flex align="center" gap="2">
          {/* Horloge */}
          <Text
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
          </Text>

          {/* Toggle son */}
          <Tooltip content={soundEnabled ? "Desactiver le son" : "Activer le son"}>
            <IconButton
              variant="surface"
              color={soundEnabled ? "green" : "gray"}
              size="2"
              onClick={toggleSound}
              style={{ cursor: "pointer" }}
              aria-label={soundEnabled ? "Desactiver le son" : "Activer le son"}
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
                color={isFullscreen ? config.color : "gray"}
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

          {/* Rafraichir */}
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

          {/* Quitter */}
          <Tooltip content="Quitter l'ecran">
            <IconButton
              variant="surface"
              color="red"
              size="2"
              onClick={handleQuit}
              style={{ cursor: "pointer" }}
              aria-label="Quitter l'ecran"
            >
              <SignOut size={16} weight="bold" />
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
          gap: 16,
        }}
      >
        {/* Colonne En Attente */}
        <Column
          title="En attente"
          count={enAttente.length}
          color="orange"
          icon={<Clock size={18} weight="fill" />}
          orders={enAttente}
          newOrderIds={newOrderIds}
          onStatusChange={handleStatusChange}
          onBulkStatusChange={handleBulkStatusChange}
          headerAction={
            enAttente.length > 0 ? (
              <Tooltip content="Tout passer en preparation">
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
          title="En preparation"
          count={enPreparation.length}
          color="blue"
          icon={ecranType === "BAR" ? <BeerBottle size={18} weight="fill" /> : <CookingPot size={18} weight="fill" />}
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
          icon={
            <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
              <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z" />
            </svg>
          }
          orders={pret}
          newOrderIds={newOrderIds}
          onStatusChange={handleStatusChange}
          onBulkStatusChange={handleBulkStatusChange}
        />
      </div>

      {/* Etat vide */}
      {!isLoading && totalOrders === 0 && (
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap="3"
          style={{
            position: "absolute",
            inset: 0,
            top: 120,
            pointerEvents: "none",
          }}
        >
          {ecranType === "BAR" ? (
            <BeerBottle size={64} weight="duotone" style={{ color: "var(--gray-7)" }} />
          ) : (
            <CookingPot size={64} weight="duotone" style={{ color: "var(--gray-7)" }} />
          )}
          <Text size="4" color="gray" weight="medium">
            Aucune commande en cours
          </Text>
          <Text size="2" color="gray">
            Les nouvelles commandes apparaitront ici automatiquement
          </Text>
        </Flex>
      )}

      {/* Loading initial */}
      {isLoading ? <Flex
          direction="column"
          align="center"
          justify="center"
          gap="3"
          style={{
            position: "absolute",
            inset: 0,
          }}
        >
          <ArrowsClockwise
            size={48}
            weight="bold"
            style={{
              color: "var(--gray-8)",
              animation: "spin 1s linear infinite",
            }}
          />
          <Text size="3" color="gray">
            Chargement des commandes...
          </Text>
        </Flex> : null}

      {/* Modal confirmation quitter */}
      {showQuitConfirm ? <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setShowQuitConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "var(--gray-2)",
              borderRadius: "var(--radius-4)",
              padding: 32,
              maxWidth: 420,
              width: "90%",
              border: "1px solid var(--gray-6)",
            }}
          >
            <Flex direction="column" gap="4" align="center">
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  backgroundColor: "var(--red-a3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SignOut size={28} weight="fill" style={{ color: "var(--red-9)" }} />
              </div>
              <Heading as="h2" size="5" weight="bold" align="center">
                Quitter l'ecran ?
              </Heading>
              <Text size="2" color="gray" align="center">
                Vous allez etre redirige vers la page de connexion. L'ecran cessera d'afficher les commandes.
              </Text>
              <Flex gap="3" mt="2" style={{ width: "100%" }}>
                <Button
                  variant="soft"
                  color="gray"
                  size="3"
                  style={{ flex: 1, cursor: "pointer" }}
                  onClick={() => setShowQuitConfirm(false)}
                >
                  Annuler
                </Button>
                <Button
                  variant="solid"
                  color="red"
                  size="3"
                  style={{ flex: 1, cursor: "pointer" }}
                  onClick={handleConfirmQuit}
                >
                  <SignOut size={16} weight="bold" />
                  Quitter
                </Button>
              </Flex>
            </Flex>
          </div>
        </div> : null}

      {/* Styles */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes urgentPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes kds-new-order-highlight {
          0% { box-shadow: 0 0 0 0 var(--${config.color}-a6); }
          50% { box-shadow: 0 0 16px 4px var(--${config.color}-a6); }
          100% { box-shadow: 0 0 0 0 var(--${config.color}-a6); }
        }
        @keyframes kds-badge-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
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
  icon: React.ReactNode;
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
  icon,
  orders,
  newOrderIds,
  onStatusChange,
  onBulkStatusChange,
  headerAction,
}: ColumnProps) {
  return (
    <Flex
      direction="column"
      style={{
        borderRadius: "var(--radius-3)",
        backgroundColor: `var(--${color}-a2)`,
        border: `1px solid var(--${color}-a5)`,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* Header de colonne */}
      <Box
        p="3"
        style={{
          backgroundColor: `var(--${color}-a3)`,
          borderBottom: `1px solid var(--${color}-a5)`,
        }}
      >
        <Flex justify="between" align="center">
          <Flex align="center" gap="2">
            <span style={{ color: `var(--${color}-11)`, display: "flex" }}>{icon}</span>
            <Text size="2" weight="bold" style={{ color: `var(--${color}-11)` }}>
              {title}
            </Text>
            <Badge color={color} variant="solid" size="1" highContrast>
              {count}
            </Badge>
          </Flex>
          {headerAction}
        </Flex>
      </Box>

      {/* Liste des commandes */}
      <ScrollArea scrollbars="vertical" style={{ flex: 1 }}>
        <Flex direction="column" gap="3" p="3">
          {orders.length === 0 ? (
            <Flex
              direction="column"
              align="center"
              justify="center"
              py="8"
              gap="2"
            >
              <Text size="2" color="gray" style={{ textAlign: "center" }}>
                Aucune commande
              </Text>
            </Flex>
          ) : (
            orders.map((order) => (
              <div
                key={order.vente_id}
                style={{
                  animation: newOrderIds.has(order.vente_id)
                    ? "kds-new-order-highlight 1s ease-in-out 3"
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
