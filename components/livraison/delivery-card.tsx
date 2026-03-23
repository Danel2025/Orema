"use client";

import { useTransition } from "react";
import { Badge, Button, Card, Flex, Text, IconButton } from "@/components/ui";
import { Dialog, Tooltip } from "@radix-ui/themes";
import {
  MapPin,
  Phone,
  Clock,
  User,
  Truck,
  Check,
  X,
  Package,
  ChefHat,
  RotateCcw,
  Info,
} from "lucide-react";
import {
  type HistoriqueLivraison,
  type Livraison,
  type StatutLivraison,
  STATUT_LIVRAISON,
  STATUT_LIVRAISON_LABELS,
  STATUT_LIVRAISON_COLORS,
  TRANSITIONS_AUTORISEES,
} from "@/lib/delivery";
import { formatCurrency, formatTime } from "@/lib/utils";
import { DeliveryTimeline } from "./delivery-timeline";

// ============================================================================
// TYPES
// ============================================================================

interface DeliveryCardProps {
  livraison: Livraison;
  onUpdateStatut?: (livraisonId: string, statut: StatutLivraison, note?: string) => Promise<void>;
  onAssignerLivreur?: (livraisonId: string) => void;
  onVoirDetails?: (livraisonId: string) => void;
  historique?: HistoriqueLivraison[];
  compact?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

const ACTION_CONFIG: Record<
  StatutLivraison,
  {
    label: string;
    icon: typeof Check;
    color: "green" | "blue" | "violet" | "red" | "gray" | "orange";
    nextStatut: StatutLivraison | null;
  }[]
> = {
  EN_PREPARATION: [
    { label: "Prête", icon: Package, color: "blue", nextStatut: STATUT_LIVRAISON.PRETE },
    { label: "Annuler", icon: X, color: "red", nextStatut: STATUT_LIVRAISON.ANNULEE },
  ],
  PRETE: [
    { label: "En livraison", icon: Truck, color: "violet", nextStatut: STATUT_LIVRAISON.EN_COURS },
    { label: "Annuler", icon: X, color: "red", nextStatut: STATUT_LIVRAISON.ANNULEE },
  ],
  EN_COURS: [
    { label: "Livrée", icon: Check, color: "green", nextStatut: STATUT_LIVRAISON.LIVREE },
    { label: "Échouée", icon: X, color: "red", nextStatut: STATUT_LIVRAISON.ECHOUEE },
  ],
  LIVREE: [],
  ECHOUEE: [
    { label: "Retenter", icon: RotateCcw, color: "violet", nextStatut: STATUT_LIVRAISON.EN_COURS },
  ],
  ANNULEE: [],
};

// ============================================================================
// COMPOSANT
// ============================================================================

export function DeliveryCard({
  livraison,
  onUpdateStatut,
  onAssignerLivreur,
  historique,
  compact = false,
}: DeliveryCardProps) {
  const [isPending, startTransition] = useTransition();

  const statutColor = STATUT_LIVRAISON_COLORS[livraison.statut] as
    | "green"
    | "blue"
    | "violet"
    | "red"
    | "gray"
    | "orange";
  const statutLabel = STATUT_LIVRAISON_LABELS[livraison.statut];
  const actions = ACTION_CONFIG[livraison.statut] ?? [];

  const handleStatutChange = (nextStatut: StatutLivraison) => {
    if (!onUpdateStatut) return;
    startTransition(async () => {
      await onUpdateStatut(livraison.id, nextStatut);
    });
  };

  return (
    <Card
      style={{
        padding: compact ? 12 : 16,
        opacity: isPending ? 0.6 : 1,
        transition: "opacity 0.2s ease",
        border: `1px solid var(--${statutColor}-a5)`,
      }}
    >
      <Flex direction="column" gap={compact ? "2" : "3"}>
        {/* Header : ticket + statut */}
        <Flex justify="between" align="center">
          <Text
            size="2"
            weight="bold"
            style={{
              fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
            }}
          >
            #{livraison.numeroTicket}
          </Text>
          <Badge color={statutColor} variant="soft" size="1">
            {statutLabel}
          </Badge>
        </Flex>

        {/* Adresse */}
        <Flex align="start" gap="2">
          <MapPin size={14} style={{ color: "var(--gray-10)", marginTop: 2, flexShrink: 0 }} />
          <Text size="1" color="gray" style={{ lineHeight: 1.4 }}>
            {livraison.adresse}
          </Text>
        </Flex>

        {/* Client + Telephone */}
        <Flex gap="3" wrap="wrap">
          {livraison.clientNom ? (
            <Flex align="center" gap="1">
              <User size={13} style={{ color: "var(--gray-10)" }} />
              <Text size="1" color="gray">
                {livraison.clientNom}
              </Text>
            </Flex>
          ) : null}
          <Flex align="center" gap="1">
            <Phone size={13} style={{ color: "var(--gray-10)" }} />
            <a
              href={`tel:${livraison.telephone}`}
              style={{
                fontSize: "var(--font-size-1)",
                color: "var(--accent-11)",
                textDecoration: "none",
              }}
            >
              {livraison.telephone}
            </a>
          </Flex>
        </Flex>

        {/* Montant + Heure + Livreur */}
        <Flex justify="between" align="center" wrap="wrap" gap="2">
          <Text
            size="2"
            weight="bold"
            style={{
              fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
              color: "var(--gray-12)",
            }}
          >
            {formatCurrency(livraison.montantTotal)}
          </Text>

          <Flex align="center" gap="3">
            {livraison.livreurNom ? (
              <Flex align="center" gap="1">
                <Truck size={13} style={{ color: "var(--violet-10)" }} />
                <Text size="1" color="gray">
                  {livraison.livreurNom}
                </Text>
              </Flex>
            ) : null}

            {livraison.estimationMinutes ? (
              <Flex align="center" gap="1">
                <Clock size={13} style={{ color: "var(--amber-10)" }} />
                <Text size="1" color="gray">
                  ~{livraison.estimationMinutes} min
                </Text>
              </Flex>
            ) : null}

            <Flex align="center" gap="1">
              <Clock size={13} style={{ color: "var(--gray-9)" }} />
              <Text size="1" color="gray">
                {formatTime(livraison.createdAt)}
              </Text>
            </Flex>
          </Flex>
        </Flex>

        {/* Frais de livraison si present */}
        {livraison.fraisLivraison > 0 && (
          <Text size="1" color="gray">
            Frais de livraison : {formatCurrency(livraison.fraisLivraison)}
          </Text>
        )}

        {/* Actions */}
        {(actions.length > 0 || !livraison.livreurId) && (
          <Flex gap="2" wrap="wrap" mt="1">
            {/* Bouton assigner livreur si pas de livreur */}
            {!livraison.livreurId &&
            livraison.statut !== STATUT_LIVRAISON.LIVREE &&
            livraison.statut !== STATUT_LIVRAISON.ANNULEE &&
            onAssignerLivreur ? (
              <Button
                variant="soft"
                color="orange"
                size="1"
                onClick={() => onAssignerLivreur(livraison.id)}
                disabled={isPending}
                style={{ minHeight: 32, cursor: "pointer" }}
              >
                <User size={14} />
                Assigner livreur
              </Button>
            ) : null}

            {/* Boutons de transition de statut */}
            {actions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <Button
                  key={action.nextStatut}
                  variant={action.color === "red" ? "outline" : "soft"}
                  color={action.color}
                  size="1"
                  onClick={() => action.nextStatut && handleStatutChange(action.nextStatut)}
                  disabled={isPending}
                  style={{ minHeight: 32, cursor: "pointer" }}
                >
                  <ActionIcon size={14} />
                  {action.label}
                </Button>
              );
            })}

            {/* Bouton details / timeline */}
            <Dialog.Root>
              <Dialog.Trigger>
                <Tooltip content="Voir le detail">
                  <IconButton
                    variant="ghost"
                    color="gray"
                    size="1"
                    style={{ minHeight: 32, minWidth: 32, cursor: "pointer" }}
                    aria-label="Voir les details de la livraison"
                  >
                    <Info size={14} />
                  </IconButton>
                </Tooltip>
              </Dialog.Trigger>

              <Dialog.Content maxWidth="500px">
                <Dialog.Title>Livraison #{livraison.numeroTicket}</Dialog.Title>
                <Dialog.Description size="2" mb="4">
                  Historique et details de la livraison
                </Dialog.Description>

                {/* Infos resumees */}
                <Flex direction="column" gap="2" mb="4">
                  <Flex align="center" gap="2">
                    <MapPin size={14} style={{ color: "var(--gray-10)" }} />
                    <Text size="2">{livraison.adresse}</Text>
                  </Flex>
                  {livraison.clientNom ? (
                    <Flex align="center" gap="2">
                      <User size={14} style={{ color: "var(--gray-10)" }} />
                      <Text size="2">{livraison.clientNom}</Text>
                    </Flex>
                  ) : null}
                  <Flex align="center" gap="2">
                    <Phone size={14} style={{ color: "var(--gray-10)" }} />
                    <a
                      href={`tel:${livraison.telephone}`}
                      style={{
                        fontSize: "var(--font-size-2)",
                        color: "var(--accent-11)",
                        textDecoration: "none",
                      }}
                    >
                      {livraison.telephone}
                    </a>
                  </Flex>
                  <Flex align="center" gap="2">
                    <Text size="2" weight="bold">
                      {formatCurrency(livraison.montantTotal)}
                    </Text>
                    <Badge color={statutColor} variant="soft" size="1">
                      {statutLabel}
                    </Badge>
                  </Flex>
                </Flex>

                {/* Timeline */}
                {historique && historique.length > 0 ? (
                  <DeliveryTimeline historique={historique} />
                ) : (
                  <Text size="2" color="gray" style={{ textAlign: "center", padding: 16 }}>
                    Aucun historique disponible
                  </Text>
                )}

                <Flex gap="3" mt="4" justify="end">
                  <Dialog.Close>
                    <Button variant="soft" color="gray" style={{ cursor: "pointer" }}>
                      Fermer
                    </Button>
                  </Dialog.Close>
                </Flex>
              </Dialog.Content>
            </Dialog.Root>
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
