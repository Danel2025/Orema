"use client";

/**
 * TableContextMenu - Menu contextuel pour les actions rapides sur une table
 * Affiche les options: Commander, Voir commande, Demander addition, Transferer, Marquer nettoyee
 */

import { useTransition, useState } from "react";
import { ContextMenu, Text, Button, Flex } from "@radix-ui/themes";
import {
  ShoppingCart,
  Eye,
  Receipt,
  ArrowsLeftRight,
  Sparkle,
  CheckCircle,
  Clock,
  CookingPot,
  Trash,
  PencilSimple,
  Users,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateTableStatut } from "@/actions/tables";
import { STATUT_TABLE_LABELS, type StatutTableType } from "@/schemas/table.schema";
import { TransferTableModal } from "./TransferTableModal";

interface VenteEnCours {
  id: string;
  numeroTicket: string;
  totalFinal: number;
  _count: {
    lignes: number;
  };
}

interface TableContextMenuProps {
  children: React.ReactNode;
  tableId: string;
  tableNumero: string;
  tableCapacite?: number;
  statut: StatutTableType;
  venteEnCours?: VenteEnCours | null;
  otherTables?: Array<{ id: string; numero: string; statut: string }>;
  onRefresh?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TableContextMenu({
  children,
  tableId,
  tableNumero,
  tableCapacite = 4,
  statut,
  venteEnCours,
  otherTables = [],
  onRefresh,
  onEdit,
  onDelete,
}: TableContextMenuProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showTransferModal, setShowTransferModal] = useState(false);

  const handleStatusChange = (newStatut: StatutTableType) => {
    startTransition(async () => {
      try {
        const result = await updateTableStatut({ id: tableId, statut: newStatut });
        if (result.success) {
          toast.success(`Table ${tableNumero}: ${STATUT_TABLE_LABELS[newStatut]}`);
          onRefresh?.();
        } else {
          toast.error(result.error || "Erreur lors du changement de statut");
        }
      } catch {
        toast.error("Erreur lors du changement de statut");
      }
    });
  };

  const handleOpenTransferModal = () => {
    setShowTransferModal(true);
  };

  const handleTransferSuccess = () => {
    onRefresh?.();
  };

  const handleNewOrder = () => {
    // Rediriger vers la caisse avec la table pre-selectionnee
    router.push(`/caisse?table=${tableId}`);
  };

  const handleViewOrder = () => {
    if (venteEnCours) {
      // Rediriger vers la caisse avec la vente en cours
      router.push(`/caisse?vente=${venteEnCours.id}`);
    }
  };

  const handleRequestBill = () => {
    handleStatusChange("ADDITION");
  };

  const handleMarkClean = () => {
    handleStatusChange("LIBRE");
  };

  return (
    <>
      <ContextMenu.Root>
        <ContextMenu.Trigger>{children}</ContextMenu.Trigger>

        <ContextMenu.Content size="2">
          {/* Header avec numero de table */}
          <ContextMenu.Label>
            <Flex align="center" gap="2">
              <Users size={12} />
              <Text weight="bold">Table {tableNumero}</Text>
            </Flex>
          </ContextMenu.Label>

          <ContextMenu.Separator />

          {/* Actions principales selon le statut */}
          {statut === "LIBRE" ? (
            <ContextMenu.Item onClick={handleNewOrder}>
              <ShoppingCart size={14} />
              Nouvelle commande
            </ContextMenu.Item>
          ) : (
            <>
              {venteEnCours ? (
                <ContextMenu.Item onClick={handleViewOrder}>
                  <Eye size={14} />
                  Voir la commande ({venteEnCours._count.lignes} articles)
                </ContextMenu.Item>
              ) : null}

              {statut !== "ADDITION" && venteEnCours ? (
                <ContextMenu.Item onClick={handleRequestBill}>
                  <Receipt size={14} />
                  Demander l'addition
                </ContextMenu.Item>
              ) : null}

              {venteEnCours ? (
                <ContextMenu.Item onClick={handleOpenTransferModal}>
                  <ArrowsLeftRight size={14} />
                  Transferer la table
                </ContextMenu.Item>
              ) : null}
            </>
          )}

          {statut === "A_NETTOYER" && (
            <ContextMenu.Item onClick={handleMarkClean}>
              <Sparkle size={14} />
              Marquer comme nettoyee
            </ContextMenu.Item>
          )}

          <ContextMenu.Separator />

          {/* Changement de statut rapide */}
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger>
              <Clock size={14} />
              Changer le statut
            </ContextMenu.SubTrigger>
            <ContextMenu.SubContent>
              <ContextMenu.Item
                onClick={() => handleStatusChange("LIBRE")}
                disabled={statut === "LIBRE" || isPending}
              >
                <CheckCircle size={14} style={{ color: "#22c55e" }} />
                Libre
              </ContextMenu.Item>
              <ContextMenu.Item
                onClick={() => handleStatusChange("OCCUPEE")}
                disabled={statut === "OCCUPEE" || isPending}
              >
                <Clock size={14} style={{ color: "#eab308" }} />
                Occupee
              </ContextMenu.Item>
              <ContextMenu.Item
                onClick={() => handleStatusChange("EN_PREPARATION")}
                disabled={statut === "EN_PREPARATION" || isPending}
              >
                <CookingPot size={14} style={{ color: "#3b82f6" }} />
                En preparation
              </ContextMenu.Item>
              <ContextMenu.Item
                onClick={() => handleStatusChange("ADDITION")}
                disabled={statut === "ADDITION" || isPending}
              >
                <Receipt size={14} style={{ color: "var(--accent-9)" }} />
                Addition demandee
              </ContextMenu.Item>
              <ContextMenu.Item
                onClick={() => handleStatusChange("A_NETTOYER")}
                disabled={statut === "A_NETTOYER" || isPending}
              >
                <Sparkle size={14} style={{ color: "#ef4444" }} />A nettoyer
              </ContextMenu.Item>
            </ContextMenu.SubContent>
          </ContextMenu.Sub>

          <ContextMenu.Separator />

          {/* Actions d'edition */}
          {onEdit ? (
            <ContextMenu.Item onClick={onEdit}>
              <PencilSimple size={14} />
              Modifier la table
            </ContextMenu.Item>
          ) : null}

          {onDelete ? (
            <ContextMenu.Item color="red" onClick={onDelete} disabled={!!venteEnCours}>
              <Trash size={14} />
              Supprimer la table
            </ContextMenu.Item>
          ) : null}
        </ContextMenu.Content>
      </ContextMenu.Root>

      {/* Modal de transfert de table */}
      <TransferTableModal
        open={showTransferModal}
        onOpenChange={setShowTransferModal}
        sourceTable={
          venteEnCours
            ? {
                id: tableId,
                numero: tableNumero,
                statut,
                capacite: tableCapacite,
                venteEnCours: {
                  id: venteEnCours.id,
                  numeroTicket: venteEnCours.numeroTicket,
                  totalFinal: venteEnCours.totalFinal,
                  _count: venteEnCours._count,
                },
              }
            : null
        }
        onSuccess={handleTransferSuccess}
      />
    </>
  );
}
