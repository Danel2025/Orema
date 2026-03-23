"use client";

/**
 * PendingOrdersModal - Modal de gestion des commandes en attente
 * Permet de voir, payer ou annuler les commandes en attente
 */

import { useState, useRef } from "react";
import {
  Dialog,
  Flex,
  Text,
  Button,
  Badge,
  Box,
  Tabs,
  Separator,
  IconButton,
  Card,
  Tooltip,
} from "@radix-ui/themes";
import { ScrollArea } from "@/components/ui";
import {
  Clock,
  CreditCard,
  X,
  ForkKnife,
  Truck,
  ShoppingBag,
  User,
  Prohibit,
  Eye,
  Timer,
  CookingPot,
  CheckCircle,
  ArrowRight,
} from "@phosphor-icons/react";
import type { StatutPreparation } from "@/lib/db/types";
import { formatCurrency } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface VenteEnAttente {
  id: string;
  numeroTicket: string;
  type: "DIRECT" | "TABLE" | "LIVRAISON" | "EMPORTER";
  totalFinal: number | { toString(): string } | unknown;
  createdAt: Date | string;
  lignes: Array<{
    id: string;
    quantite: number;
    produit: { id: string; nom: string };
    statut_preparation?: StatutPreparation | null;
  }>;
  table?: { id: string; numero: string; zone?: { nom: string } | null } | null;
  client?: { id: string; nom: string; prenom?: string | null; telephone?: string | null } | null;
  utilisateur: { nom: string; prenom?: string | null };
}

interface PendingOrdersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ventesEnAttente: VenteEnAttente[];
  onPayer: (vente: VenteEnAttente) => void;
  onAnnuler: (venteId: string) => void;
  onVoirDetails: (vente: VenteEnAttente) => void;
  isLoading?: boolean;
}

type TabValue = "all" | "TABLE" | "LIVRAISON" | "EMPORTER";

export function PendingOrdersModal({
  open,
  onOpenChange,
  ventesEnAttente,
  onPayer,
  onAnnuler,
  onVoirDetails,
  isLoading = false,
}: PendingOrdersModalProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [confirmAnnuler, setConfirmAnnuler] = useState<string | null>(null);

  // Reset state when modal opens (derived-state pattern)
  const prevOpenRef = useRef(false);
  if (open && !prevOpenRef.current) {
    setActiveTab("all");
    setConfirmAnnuler(null);
  }
  prevOpenRef.current = open;

  // Filtrer les ventes selon l'onglet
  const filteredVentes = ventesEnAttente.filter((vente) => {
    if (activeTab === "all") return true;
    return vente.type === activeTab;
  });

  // Compter par type
  const counts = {
    all: ventesEnAttente.length,
    TABLE: ventesEnAttente.filter((v) => v.type === "TABLE").length,
    LIVRAISON: ventesEnAttente.filter((v) => v.type === "LIVRAISON").length,
    EMPORTER: ventesEnAttente.filter((v) => v.type === "EMPORTER").length,
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "TABLE":
        return <ForkKnife size={16} />;
      case "LIVRAISON":
        return <Truck size={16} />;
      case "EMPORTER":
        return <ShoppingBag size={16} />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "TABLE":
        return "Table";
      case "LIVRAISON":
        return "Livraison";
      case "EMPORTER":
        return "Emporter";
      default:
        return type;
    }
  };

  // --- Statut de préparation ---
  const PREPARATION_ORDER: Record<string, number> = {
    EN_ATTENTE: 0,
    EN_PREPARATION: 1,
    PRETE: 2,
    SERVIE: 3,
  };

  const getPreparationStatusConfig = (statut: string) => {
    switch (statut) {
      case "EN_ATTENTE":
        return { color: "amber" as const, label: "En attente", icon: <Timer size={12} weight="bold" /> };
      case "EN_PREPARATION":
        return { color: "blue" as const, label: "En préparation", icon: <CookingPot size={12} weight="bold" /> };
      case "PRETE":
        return { color: "green" as const, label: "Prête", icon: <CheckCircle size={12} weight="bold" /> };
      case "SERVIE":
        return { color: "gray" as const, label: "Servie", icon: <ArrowRight size={12} weight="bold" /> };
      default:
        return { color: "gray" as const, label: statut, icon: null };
    }
  };

  /** Retourne le statut dominant (le moins avancé) parmi les lignes */
  const getDominantStatus = (lignes: VenteEnAttente["lignes"]): string => {
    if (lignes.length === 0) return "EN_ATTENTE";
    let minOrder = Infinity;
    let dominant = "EN_ATTENTE";
    for (const ligne of lignes) {
      const s = ligne.statut_preparation || "EN_ATTENTE";
      const order = PREPARATION_ORDER[s] ?? 0;
      if (order < minOrder) {
        minOrder = order;
        dominant = s;
      }
    }
    return dominant;
  };

  const handleAnnuler = (venteId: string) => {
    if (confirmAnnuler === venteId) {
      onAnnuler(venteId);
      setConfirmAnnuler(null);
    } else {
      setConfirmAnnuler(venteId);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="700px" style={{ maxHeight: "85vh" }}>
        <Dialog.Title>
          <Flex align="center" gap="2">
            <Clock size={20} />
            Commandes en attente
            {counts.all > 0 && (
              <Badge color="violet" size="2">
                {counts.all}
              </Badge>
            )}
          </Flex>
        </Dialog.Title>

        <Dialog.Description size="2" mb="4" color="gray">
          Commandes enregistrées mais pas encore payées
        </Dialog.Description>

        <Tabs.Root value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <Tabs.List>
            <Tabs.Trigger value="all">Toutes {counts.all > 0 && `(${counts.all})`}</Tabs.Trigger>
            <Tabs.Trigger value="TABLE">
              <ForkKnife size={14} style={{ marginRight: 4 }} />
              Tables {counts.TABLE > 0 && `(${counts.TABLE})`}
            </Tabs.Trigger>
            <Tabs.Trigger value="LIVRAISON">
              <Truck size={14} style={{ marginRight: 4 }} />
              Livraisons {counts.LIVRAISON > 0 && `(${counts.LIVRAISON})`}
            </Tabs.Trigger>
            <Tabs.Trigger value="EMPORTER">
              <ShoppingBag size={14} style={{ marginRight: 4 }} />
              Emporter {counts.EMPORTER > 0 && `(${counts.EMPORTER})`}
            </Tabs.Trigger>
          </Tabs.List>

          <Box pt="3">
            <ScrollArea style={{ height: "400px" }}>
              {isLoading ? (
                <Flex align="center" justify="center" py="9">
                  <Text color="gray">Chargement...</Text>
                </Flex>
              ) : filteredVentes.length === 0 ? (
                <Flex align="center" justify="center" py="9" direction="column" gap="2">
                  <Clock size={48} color="var(--gray-6)" />
                  <Text color="gray" size="2">
                    Aucune commande en attente
                  </Text>
                </Flex>
              ) : (
                <Flex direction="column" gap="3">
                  {filteredVentes.map((vente) => {
                    const totalFinal =
                      typeof vente.totalFinal === "number"
                        ? vente.totalFinal
                        : Number(vente.totalFinal);
                    const createdAt =
                      typeof vente.createdAt === "string"
                        ? new Date(vente.createdAt)
                        : vente.createdAt;

                    return (
                      <Card key={vente.id}>
                        <Flex justify="between" align="start">
                          <Flex direction="column" gap="1">
                            {/* Header: Type + Numéro */}
                            <Flex align="center" gap="2" wrap="wrap">
                              <Badge
                                color={
                                  vente.type === "TABLE"
                                    ? "blue"
                                    : vente.type === "LIVRAISON"
                                      ? "green"
                                      : "violet"
                                }
                              >
                                {getTypeIcon(vente.type)}
                                <Text size="1" ml="1">
                                  {vente.type === "TABLE" && vente.table
                                    ? `Table ${vente.table.numero}`
                                    : getTypeLabel(vente.type)}
                                </Text>
                              </Badge>
                              <Text size="2" weight="bold">
                                #{vente.numeroTicket}
                              </Text>
                              {(() => {
                                const dominant = getDominantStatus(vente.lignes);
                                const config = getPreparationStatusConfig(dominant);
                                const isPrete = dominant === "PRETE";
                                return (
                                  <Badge
                                    color={config.color}
                                    variant="soft"
                                    size="1"
                                    style={isPrete ? {
                                      animation: "pulse-preparation 2s ease-in-out infinite",
                                    } : undefined}
                                  >
                                    {config.icon}
                                    <Text size="1" ml="1">{config.label}</Text>
                                  </Badge>
                                );
                              })()}
                            </Flex>

                            {/* Client si présent */}
                            {vente.client ? (
                              <Flex align="center" gap="1">
                                <User size={12} color="var(--gray-9)" />
                                <Text size="1" color="gray">
                                  {vente.client.nom}
                                  {vente.client.prenom ? ` ${vente.client.prenom}` : null}
                                </Text>
                              </Flex>
                            ) : null}

                            {/* Infos: articles + temps */}
                            <Flex align="center" gap="3">
                              <Text size="1" color="gray">
                                {vente.lignes.reduce((acc, l) => acc + l.quantite, 0)} article(s)
                              </Text>
                              <Text size="1" color="gray">
                                il y a {formatDistanceToNow(createdAt, { locale: fr })}
                              </Text>
                            </Flex>
                          </Flex>

                          {/* Prix + Actions */}
                          <Flex direction="column" align="end" gap="2">
                            <Text size="4" weight="bold" color="violet">
                              {formatCurrency(totalFinal)}
                            </Text>
                            <Flex gap="2">
                              <Tooltip content="Voir les détails">
                                <IconButton
                                  size="1"
                                  variant="soft"
                                  color="gray"
                                  onClick={() => onVoirDetails(vente)}
                                >
                                  <Eye size={14} />
                                </IconButton>
                              </Tooltip>

                              {confirmAnnuler === vente.id ? (
                                <Flex gap="1">
                                  <Button
                                    size="1"
                                    color="red"
                                    variant="solid"
                                    onClick={() => handleAnnuler(vente.id)}
                                  >
                                    Confirmer
                                  </Button>
                                  <Button
                                    size="1"
                                    color="gray"
                                    variant="soft"
                                    onClick={() => setConfirmAnnuler(null)}
                                  >
                                    Non
                                  </Button>
                                </Flex>
                              ) : (
                                <>
                                  <Tooltip content="Annuler">
                                    <IconButton
                                      size="1"
                                      variant="soft"
                                      color="red"
                                      onClick={() => handleAnnuler(vente.id)}
                                    >
                                      <Prohibit size={14} />
                                    </IconButton>
                                  </Tooltip>
                                  <Button size="1" color="green" onClick={() => onPayer(vente)}>
                                    <CreditCard size={14} />
                                    Payer
                                  </Button>
                                </>
                              )}
                            </Flex>
                          </Flex>
                        </Flex>
                      </Card>
                    );
                  })}
                </Flex>
              )}
            </ScrollArea>
          </Box>
        </Tabs.Root>

        <Separator size="4" my="4" />

        <Flex justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Fermer
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
