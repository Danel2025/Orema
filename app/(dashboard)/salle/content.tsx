"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Box, Flex, Text, Button, Select, Heading, Tooltip } from "@radix-ui/themes";
import { Plus, Funnel, ArrowsClockwise } from "@phosphor-icons/react";
import {
  FloorPlan,
  TableFormDialog,
  TableDetailsPanel,
  TablesStats,
  StatusLegend,
  ZoneManager,
} from "@/components/salle";
import { useAuth } from "@/lib/auth/context";

interface Zone {
  id: string;
  nom: string;
  couleur: string | null;
  description: string | null;
  ordre: number;
  active: boolean;
  position_x: number | null;
  position_y: number | null;
  largeur: number | null;
  hauteur: number | null;
  _count?: {
    tables: number;
  };
}

interface BaseTableData {
  id: string;
  numero: string;
  capacite: number;
  forme: string;
  statut: string;
  positionX: number | null;
  positionY: number | null;
  largeur: number | null;
  hauteur: number | null;
  zoneId: string | null;
  zone: Zone | null;
  active: boolean;
}

interface TableData extends BaseTableData {
  ventes: Array<{
    id: string;
    numeroTicket: string;
    totalFinal: { toNumber?: () => number } | number;
    createdAt: Date | string;
    _count: {
      lignes: number;
    };
  }>;
}

interface SelectedTableData extends BaseTableData {
  ventes: Array<{
    id: string;
    numero_ticket: string;
    total_final: number;
    created_at: string;
    sous_total?: number;
    total_tva?: number;
    total_remise?: number;
    valeur_remise?: number | null;
    frais_livraison?: number | null;
    lignes: Array<{
      id: string;
      quantite: number;
      prix_unitaire: number;
      total: number;
      produit: {
        id?: string;
        nom: string;
        prix?: number;
      } | null;
    }>;
    utilisateur: {
      id?: string;
      nom: string;
      prenom?: string | null;
    } | null;
  }>;
}

interface StatsData {
  total: number;
  libres: number;
  occupees: number;
  enPreparation: number;
  additionDemandee: number;
  aNettoyer: number;
  capaciteTotale: number;
  capaciteDisponible: number;
}

interface SalleContentProps {
  tables: TableData[];
  zones: Zone[];
  stats: StatsData;
  selectedTable: SelectedTableData | null;
  selectedTableId?: string;
  zoneFilter?: string;
}

export function SalleContent({
  tables,
  zones,
  stats,
  selectedTable,
  selectedTableId,
  zoneFilter,
}: SalleContentProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<BaseTableData | null>(null);

  // Seuls les admins et managers peuvent modifier le plan de salle
  const isServeur = user?.role === "SERVEUR";
  const isCaissier = user?.role === "CAISSIER";
  const canEdit = !isServeur && !isCaissier;

  // Sélectionner une table (met à jour l'URL)
  const handleSelectTable = useCallback(
    (tableId: string) => {
      const params = new URLSearchParams();
      params.set("table", tableId);
      if (zoneFilter) params.set("zone", zoneFilter);
      router.push(`/salle?${params.toString()}`);
    },
    [router, zoneFilter]
  );

  // Fermer le panneau de détails
  const handleCloseDetails = useCallback(() => {
    const params = new URLSearchParams();
    if (zoneFilter) params.set("zone", zoneFilter);
    const url = params.toString() ? `/salle?${params.toString()}` : "/salle";
    router.push(url);
  }, [router, zoneFilter]);

  // Changer le filtre de zone
  const handleZoneChange = useCallback(
    (zone: string) => {
      const params = new URLSearchParams();
      if (zone && zone !== "all") params.set("zone", zone);
      if (selectedTableId) params.set("table", selectedTableId);
      const url = params.toString() ? `/salle?${params.toString()}` : "/salle";
      router.push(url);
    },
    [router, selectedTableId]
  );

  // Rafraîchir la page
  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  // Ouvrir le formulaire pour éditer
  const handleEditTable = useCallback(() => {
    if (selectedTable) {
      setEditingTable(selectedTable);
      setIsFormOpen(true);
    }
  }, [selectedTable]);

  // Aller a la caisse avec une vente
  const handleGoToCaisse = useCallback(
    (venteId: string) => {
      router.push(`/caisse?vente=${venteId}`);
    },
    [router]
  );

  // Creer une nouvelle commande pour une table
  const handleNewOrder = useCallback(
    (tableId: string) => {
      router.push(`/caisse?table=${tableId}`);
    },
    [router]
  );

  // État pour pré-remplir le formulaire avec la forme et position
  const [prefilledTableData, setPrefilledTableData] = useState<{
    forme: "CARREE" | "RONDE" | "RECTANGULAIRE";
    positionX: number;
    positionY: number;
  } | null>(null);

  // Ajouter une table depuis la toolbar du plan
  const handleAddTableFromPlan = useCallback(
    (forme: "CARREE" | "RONDE" | "RECTANGULAIRE", positionX?: number, positionY?: number) => {
      setEditingTable(null);
      setPrefilledTableData({
        forme,
        positionX: positionX ?? 100,
        positionY: positionY ?? 100,
      });
      setIsFormOpen(true);
    },
    []
  );

  // Fermer le formulaire
  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingTable(null);
    setPrefilledTableData(null);
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <Flex justify="between" align="start" mb="4">
        <Box>
          <Heading size="6" weight="bold">
            Plan de salle
          </Heading>
          <Text color="gray" size="2">
            Gestion des tables et zones - {stats.total} tables
          </Text>
        </Box>

        <Flex gap="2">
          {canEdit ? <ZoneManager zones={zones} onRefresh={handleRefresh} /> : null}
          <Button variant="soft" color="gray" onClick={handleRefresh}>
            <ArrowsClockwise size={14} />
            Actualiser
          </Button>
          {canEdit ? (
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus size={14} />
              Ajouter une table
            </Button>
          ) : (
            <Tooltip content="Seuls les managers et administrateurs peuvent modifier le plan de salle">
              <Button disabled color="gray">
                <Plus size={14} />
                Ajouter une table
              </Button>
            </Tooltip>
          )}
        </Flex>
      </Flex>

      {/* Stats */}
      <Box mb="4">
        <TablesStats stats={stats} />
      </Box>

      {/* Filters & Legend */}
      <Flex justify="between" align="center" mb="4" gap="4">
        <Flex align="center" gap="3">
          <Funnel size={14} className="text-gray-500" />
          <Select.Root value={zoneFilter || "all"} onValueChange={handleZoneChange}>
            <Select.Trigger placeholder="Toutes les zones" />
            <Select.Content position="popper">
              <Select.Item value="all">Toutes les zones</Select.Item>
              {zones.map((zone) => (
                <Select.Item key={zone.id} value={zone.id}>
                  {zone.nom}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Flex>

        <StatusLegend />
      </Flex>

      {/* Main content */}
      <Flex gap="4" className="min-h-0 flex-1">
        {/* Floor plan */}
        <Box className="flex-1" style={{ minHeight: 500 }}>
          <FloorPlan
            tables={tables}
            dbZones={zones}
            selectedTableId={selectedTableId}
            onTableSelect={handleSelectTable}
            onAddTable={canEdit ? handleAddTableFromPlan : undefined}
            onRefresh={handleRefresh}
            readOnly={!canEdit}
          />
        </Box>

        {/* Details panel */}
        {selectedTable != null && (
          <Box className="w-[350px] shrink-0">
            <TableDetailsPanel
              table={selectedTable}
              onClose={handleCloseDetails}
              onEdit={canEdit ? handleEditTable : undefined}
              onRefresh={handleRefresh}
              onGoToCaisse={handleGoToCaisse}
              onNewOrder={handleNewOrder}
              readOnly={isServeur}
            />
          </Box>
        )}
      </Flex>

      {/* Form dialog */}
      <TableFormDialog
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        table={editingTable || undefined}
        zones={zones}
        onSuccess={handleRefresh}
        prefilledData={prefilledTableData || undefined}
      />
    </div>
  );
}
