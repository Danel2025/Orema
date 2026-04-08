"use client";

import { useState, useTransition } from "react";
import {
  Box,
  Card,
  Flex,
  Text,
  Button,
  Badge,
  Separator,
  IconButton,
  AlertDialog,
  Spinner,
} from "@radix-ui/themes";
import { ScrollArea } from "@/components/ui";
import {
  X,
  Users,
  MapPin,
  PencilSimple,
  Trash,
  Crosshair,
  Receipt,
  Clock,
  ArrowRight,
  Timer,
  CookingPot,
  CheckCircle,
} from "@phosphor-icons/react";
import type { StatutPreparation } from "@/lib/db/types";
import { toast } from "sonner";
import {
  STATUT_TABLE_COLORS,
  STATUT_TABLE_LABELS,
  FORME_TABLE_LABELS,
  StatutTable,
  type StatutTableType,
  type FormeTableType,
} from "@/schemas/table.schema";
import { updateTableStatut, deleteTable } from "@/actions/tables";

interface ZoneInfo {
  id: string;
  nom: string;
}

interface VenteLigne {
  id: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
  produit: {
    id?: string;
    nom: string;
    prix?: number;
  } | null;
  statut_preparation?: StatutPreparation | null;
}

interface VenteEnCours {
  id: string;
  numero_ticket: string;
  total_final: number;
  created_at: string;
  sous_total?: number;
  total_tva?: number;
  total_remise?: number;
  valeur_remise?: number | null;
  frais_livraison?: number | null;
  lignes: VenteLigne[];
  utilisateur: {
    id?: string;
    nom: string;
    prenom?: string | null;
  } | null;
}

interface TableDetailsPanelProps {
  table: {
    id: string;
    numero: string;
    capacite: number;
    forme: string;
    statut: string;
    zoneId: string | null;
    zone: ZoneInfo | null;
    active: boolean;
    ventes?: VenteEnCours[];
  };
  onClose: () => void;
  onEdit?: () => void;
  onRefresh: () => void;
  onGoToCaisse?: (venteId: string) => void;
  onNewOrder?: (tableId: string) => void;
  /** Mode lecture seule (pour les serveurs) */
  readOnly?: boolean;
}

export function TableDetailsPanel({
  table,
  onClose,
  onEdit,
  onRefresh,
  onGoToCaisse,
  onNewOrder,
  readOnly = false,
}: TableDetailsPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const venteEnCours = table.ventes?.[0];

  // Calcul du statut de préparation des lignes
  const lignesPretes = venteEnCours?.lignes.filter(
    (l) => l.statut_preparation === "PRETE"
  ).length ?? 0;
  const lignesTotal = venteEnCours?.lignes.length ?? 0;
  const toutesPretes = lignesTotal > 0 && lignesPretes === lignesTotal;
  const auMoinsUnePrete = lignesPretes > 0;

  const getPreparationBadgeConfig = (statut: string) => {
    switch (statut) {
      case "EN_ATTENTE":
        return { color: "amber" as const, icon: <Timer size={12} weight="bold" /> };
      case "EN_PREPARATION":
        return { color: "blue" as const, icon: <CookingPot size={12} weight="bold" /> };
      case "PRETE":
        return { color: "green" as const, icon: <CheckCircle size={12} weight="bold" /> };
      case "SERVIE":
        return { color: "gray" as const, icon: <ArrowRight size={12} weight="bold" /> };
      default:
        return { color: "gray" as const, icon: null };
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price);
  };

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const handleStatusChange = (newStatus: StatutTableType) => {
    startTransition(async () => {
      try {
        const result = await updateTableStatut({ id: table.id, statut: newStatus });
        if (result.success) {
          toast.success(`Statut changé: ${STATUT_TABLE_LABELS[newStatus]}`);
          onRefresh();
        } else {
          toast.error(result.error || "Erreur lors du changement de statut");
        }
      } catch (_error) {
        toast.error("Erreur lors du changement de statut");
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteTable(table.id);
        if (result.success) {
          toast.success("Table supprimée");
          setShowDeleteDialog(false);
          onClose();
          onRefresh();
        } else {
          toast.error(result.error || "Erreur lors de la suppression");
        }
      } catch (_error) {
        toast.error("Erreur lors de la suppression");
      }
    });
  };

  const color = STATUT_TABLE_COLORS[table.statut as StatutTableType];

  return (
    <Card style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Flex justify="between" align="center" p="4" className="border-b" style={{ flexShrink: 0 }}>
        <Flex align="center" gap="3">
          <Text size="5" weight="bold">
            Table {table.numero}
          </Text>
          <Badge
            color={color as "green" | "yellow" | "blue" | "orange" | "red"}
            variant="soft"
            size="2"
          >
            {STATUT_TABLE_LABELS[table.statut as StatutTableType]}
          </Badge>
        </Flex>
        <IconButton variant="ghost" color="gray" onClick={onClose} aria-label="Fermer le panneau">
          <X size={18} />
        </IconButton>
      </Flex>

      <ScrollArea style={{ flex: 1 }}>
        <Box p="4">
          {/* Infos de base */}
          <Flex direction="column" gap="3" mb="4">
            <Flex align="center" gap="2">
              <Users size={16} className="text-gray-500" />
              <Text size="2">{table.capacite} places</Text>
            </Flex>
            <Flex align="center" gap="2">
              <Crosshair size={16} className="text-gray-500" />
              <Text size="2">{FORME_TABLE_LABELS[table.forme as FormeTableType]}</Text>
            </Flex>
            {table.zone != null && (
              <Flex align="center" gap="2">
                <MapPin size={16} className="text-gray-500" />
                <Text size="2">{table.zone.nom}</Text>
              </Flex>
            )}
          </Flex>

          <Separator size="4" mb="4" />

          {/* Changement de statut */}
          <Box mb="4">
            <Text size="2" weight="medium" mb="2" as="p">
              Changer le statut
            </Text>
            <Flex gap="2" wrap="wrap" align="center">
              {Object.entries(StatutTable).map(([key, value]) => (
                <Button
                  key={key}
                  variant={table.statut === value ? "solid" : "soft"}
                  color={
                    STATUT_TABLE_COLORS[value] as "green" | "yellow" | "blue" | "orange" | "red"
                  }
                  size="1"
                  onClick={() => handleStatusChange(value)}
                  disabled={isPending || table.statut === value || readOnly}
                >
                  {STATUT_TABLE_LABELS[value]}
                </Button>
              ))}
              {isPending ? <Spinner size="1" /> : null}
            </Flex>
            {readOnly ? (
              <Text size="1" color="gray" mt="2">
                Mode lecture seule
              </Text>
            ) : null}
          </Box>

          <Separator size="4" mb="4" />

          {/* Vente en cours */}
          {venteEnCours ? (
            <Box mb="4">
              <Flex align="center" gap="2" mb="3">
                <Receipt size={16} style={{ color: "var(--accent-9)" }} />
                <Text size="2" weight="medium">
                  Commande en cours
                </Text>
              </Flex>

              {/* Indicateur "Commande prête" */}
              {toutesPretes ? <Flex
                  align="center"
                  justify="center"
                  gap="2"
                  mb="3"
                  p="3"
                  style={{
                    backgroundColor: "var(--green-a3)",
                    borderRadius: 8,
                    animation: "pulse-preparation 2s ease-in-out infinite",
                  }}
                >
                  <CheckCircle size={20} weight="fill" color="var(--green-11)" />
                  <Text size="3" weight="bold" style={{ color: "var(--green-11)" }}>
                    Commande prête !
                  </Text>
                </Flex> : null}

              {/* Récapitulatif statut des lignes */}
              {lignesTotal > 0 && !toutesPretes && (
                <Flex align="center" gap="2" mb="3">
                  {auMoinsUnePrete ? (
                    <CookingPot size={14} color="var(--blue-11)" />
                  ) : (
                    <Timer size={14} color="var(--amber-11)" />
                  )}
                  <Text size="1" color="gray">
                    {lignesPretes}/{lignesTotal} prête{lignesPretes > 1 ? "s" : ""}
                  </Text>
                </Flex>
              )}

              <Card variant="surface" style={{ backgroundColor: "var(--accent-a2)" }}>
                <Flex justify="between" align="center" mb="2">
                  <Text size="1" color="gray">
                    Ticket #{venteEnCours.numero_ticket}
                  </Text>
                  <Flex align="center" gap="1">
                    <Clock size={12} className="text-gray-500" />
                    <Text size="1" color="gray">
                      {formatDate(venteEnCours.created_at)}
                    </Text>
                  </Flex>
                </Flex>

                <Box mb="2">
                  {venteEnCours.lignes.slice(0, 5).map((ligne) => {
                    const statutLigne = ligne.statut_preparation || "EN_ATTENTE";
                    const prepBadge = getPreparationBadgeConfig(statutLigne);
                    return (
                      <Flex key={ligne.id} justify="between" align="center" py="1">
                        <Text size="2">
                          {ligne.quantite}x {ligne.produit?.nom || "Produit inconnu"}
                        </Text>
                        <Badge color={prepBadge.color} variant="soft" size="1">
                          {prepBadge.icon}
                        </Badge>
                      </Flex>
                    );
                  })}
                  {venteEnCours.lignes.length > 5 && (
                    <Text size="1" color="gray">
                      +{venteEnCours.lignes.length - 5} autres articles
                    </Text>
                  )}
                </Box>

                <Separator size="4" my="2" />

                <Flex justify="between" align="center">
                  <Text size="2" weight="medium">
                    Total
                  </Text>
                  <Text size="3" weight="bold">
                    {formatPrice(venteEnCours.total_final ?? 0)} FCFA
                  </Text>
                </Flex>

                {venteEnCours.utilisateur != null && (
                  <Flex justify="between" align="center" mt="2">
                    <Text size="1" color="gray">
                      Serveur: {venteEnCours.utilisateur.prenom || ""}{" "}
                      {venteEnCours.utilisateur.nom}
                    </Text>
                  </Flex>
                )}
              </Card>

              <Flex gap="2" mt="3">
                <Button
                  variant="soft"
                  size="2"
                  className="flex-1"
                  onClick={() => onGoToCaisse?.(venteEnCours.id)}
                  disabled={!onGoToCaisse}
                >
                  <ArrowRight size={14} />
                  Aller a la caisse
                </Button>
              </Flex>
            </Box>
          ) : (
            <Box mb="4" className="py-4 text-center">
              <Text color="gray" size="2">
                Aucune commande en cours
              </Text>
              {table.statut === "LIBRE" && (
                <Button
                  variant="soft"
                  size="2"
                  mt="3"
                  onClick={() => onNewOrder?.(table.id)}
                  disabled={!onNewOrder}
                >
                  <ArrowRight size={14} />
                  Nouvelle commande
                </Button>
              )}
            </Box>
          )}

          <Separator size="4" mb="4" />

          {/* Actions */}
          {!readOnly && (
            <Flex gap="2">
              <Button
                variant="soft"
                size="2"
                className="flex-1"
                onClick={onEdit}
                disabled={!onEdit}
              >
                <PencilSimple size={14} />
                Modifier
              </Button>
              <Button
                variant="soft"
                color="red"
                size="2"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isPending || !!venteEnCours}
                aria-label="Supprimer la table"
              >
                <Trash size={14} />
              </Button>
            </Flex>
          )}

          {!readOnly && venteEnCours != null && (
            <Text size="1" color="gray" mt="2" className="text-center">
              Impossible de supprimer une table avec une commande en cours
            </Text>
          )}
        </Box>
      </ScrollArea>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog.Root open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialog.Content maxWidth="450px">
          <AlertDialog.Title>Supprimer la table</AlertDialog.Title>
          <AlertDialog.Description size="2">
            Voulez-vous vraiment supprimer la table {table.numero} ? Cette action est irreversible.
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Annuler
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button color="red" onClick={handleDelete} disabled={isPending}>
                {isPending ? <Spinner size="1" /> : null}
                Supprimer
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Card>
  );
}
