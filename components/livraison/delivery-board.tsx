"use client";

import { useState, useTransition, useCallback } from "react";
import { Badge, Flex, Heading, Text, ScrollArea } from "@/components/ui";
import { Select } from "@radix-ui/themes";
import { Truck, Package, ChefHat, Check, Filter } from "lucide-react";
import {
  type Livraison,
  type StatutLivraison,
  type HistoriqueLivraison,
  STATUT_LIVRAISON,
  STATUT_LIVRAISON_LABELS,
  STATUT_LIVRAISON_COLORS,
} from "@/lib/delivery";
import { DeliveryCard } from "./delivery-card";

// ============================================================================
// TYPES
// ============================================================================

interface DeliveryBoardProps {
  livraisons: Livraison[];
  historiques?: Record<string, HistoriqueLivraison[]>;
  onUpdateStatut: (livraisonId: string, statut: StatutLivraison, note?: string) => Promise<void>;
  onAssignerLivreur?: (livraisonId: string) => void;
}

// ============================================================================
// COLONNES DU KANBAN
// ============================================================================

interface KanbanColumn {
  statut: StatutLivraison;
  label: string;
  icon: typeof ChefHat;
  color: string;
}

const COLUMNS: KanbanColumn[] = [
  {
    statut: STATUT_LIVRAISON.EN_PREPARATION,
    label: "En préparation",
    icon: ChefHat,
    color: "orange",
  },
  {
    statut: STATUT_LIVRAISON.PRETE,
    label: "Prete",
    icon: Package,
    color: "blue",
  },
  {
    statut: STATUT_LIVRAISON.EN_COURS,
    label: "En cours",
    icon: Truck,
    color: "violet",
  },
  {
    statut: STATUT_LIVRAISON.LIVREE,
    label: "Livree",
    icon: Check,
    color: "green",
  },
];

// ============================================================================
// COMPOSANT
// ============================================================================

export function DeliveryBoard({
  livraisons,
  historiques,
  onUpdateStatut,
  onAssignerLivreur,
}: DeliveryBoardProps) {
  const [filtreLivreur, setFiltreLivreur] = useState<string>("all");

  // Extraire la liste unique des livreurs
  const livreurs = Array.from(
    new Map(
      livraisons
        .filter((l) => l.livreurId && l.livreurNom)
        .map((l) => [l.livreurId!, { id: l.livreurId!, nom: l.livreurNom! }])
    ).values()
  );

  // Filtrer par livreur si necessaire
  const livraisonsFiltrees =
    filtreLivreur === "all" ? livraisons : livraisons.filter((l) => l.livreurId === filtreLivreur);

  // Grouper par statut
  const parStatut = COLUMNS.map((col) => ({
    ...col,
    items: livraisonsFiltrees.filter((l) => l.statut === col.statut),
  }));

  return (
    <Flex direction="column" gap="4" style={{ height: "100%" }}>
      {/* Filtre livreur */}
      {livreurs.length > 0 && (
        <Flex align="center" gap="2">
          <Filter size={16} style={{ color: "var(--gray-10)" }} />
          <Text size="2" color="gray">
            Livreur :
          </Text>
          <Select.Root value={filtreLivreur} onValueChange={setFiltreLivreur}>
            <Select.Trigger variant="surface" style={{ minWidth: 180, cursor: "pointer" }} />
            <Select.Content position="popper">
              <Select.Item value="all">Tous les livreurs</Select.Item>
              <Select.Separator />
              {livreurs.map((livreur) => (
                <Select.Item key={livreur.id} value={livreur.id}>
                  {livreur.nom}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Flex>
      )}

      {/* Colonnes Kanban */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          flex: 1,
          minHeight: 0,
        }}
      >
        {parStatut.map((column) => {
          const ColIcon = column.icon;
          const colColor = column.color;

          return (
            <Flex
              key={column.statut}
              direction="column"
              style={{
                backgroundColor: "var(--gray-a2)",
                borderRadius: 12,
                border: "1px solid var(--gray-a5)",
                overflow: "hidden",
                minHeight: 300,
              }}
            >
              {/* En-tete de colonne */}
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: `2px solid var(--${colColor}-a6)`,
                  backgroundColor: `var(--${colColor}-a2)`,
                }}
              >
                <Flex align="center" justify="between">
                  <Flex align="center" gap="2">
                    <ColIcon size={16} style={{ color: `var(--${colColor}-11)` }} />
                    <Text size="2" weight="bold" style={{ color: `var(--${colColor}-11)` }}>
                      {column.label}
                    </Text>
                  </Flex>
                  <Badge
                    color={colColor as "orange" | "blue" | "violet" | "green"}
                    variant="solid"
                    size="1"
                  >
                    {column.items.length}
                  </Badge>
                </Flex>
              </div>

              {/* Cartes */}
              <ScrollArea style={{ flex: 1 }} contentPadding="3">
                <Flex direction="column" gap="3" p="3">
                  {column.items.length === 0 ? (
                    <Text
                      size="1"
                      color="gray"
                      style={{
                        textAlign: "center",
                        padding: "24px 8px",
                        fontStyle: "italic",
                      }}
                    >
                      Aucune livraison
                    </Text>
                  ) : (
                    column.items.map((livraison) => (
                      <DeliveryCard
                        key={livraison.id}
                        livraison={livraison}
                        onUpdateStatut={onUpdateStatut}
                        onAssignerLivreur={onAssignerLivreur}
                        historique={historiques?.[livraison.id]}
                        compact
                      />
                    ))
                  )}
                </Flex>
              </ScrollArea>
            </Flex>
          );
        })}
      </div>
    </Flex>
  );
}
