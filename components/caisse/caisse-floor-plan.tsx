"use client";

/**
 * CaisseFloorPlan - Plan de salle inline pour la caisse en mode "Service à table"
 * Réutilise le composant FloorPlan de /salle avec readOnly + sélection → cart store
 */

import { useState, useCallback, useEffect } from "react";
import { Box, Flex, Select, Button } from "@radix-ui/themes";
import { Funnel, ArrowsClockwise } from "@phosphor-icons/react";
import { FloorPlan, TablesStats, StatusLegend } from "@/components/salle";
import { getTables, getZonesWithTableCount, getTablesStats } from "@/actions/tables";
import { useCartStore } from "@/stores/cart-store";
import { toast } from "sonner";

interface ZoneData {
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
  _count?: { tables: number };
}

interface TableData {
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
  zone: { id: string; nom: string } | null;
  active: boolean;
  ventes: Array<{
    id: string;
    numeroTicket: string;
    totalFinal: { toNumber?: () => number } | number;
    createdAt: Date | string;
    _count: { lignes: number };
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

export function CaisseFloorPlan() {
  const { tableId, setTable } = useCartStore();

  const [tables, setTables] = useState<TableData[]>([]);
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    libres: 0,
    occupees: 0,
    enPreparation: 0,
    additionDemandee: 0,
    aNettoyer: 0,
    capaciteTotale: 0,
    capaciteDisponible: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [zoneFilter, setZoneFilter] = useState<string | undefined>(undefined);

  // Charger toutes les données
  const loadData = useCallback(async () => {
    try {
      const [tablesData, zonesData, statsData] = await Promise.all([
        getTables({ zoneId: zoneFilter, includeInactive: false }),
        getZonesWithTableCount(),
        getTablesStats(),
      ]);
      setTables(tablesData as unknown as TableData[]);
      setZones(zonesData as ZoneData[]);
      setStats(statsData);
    } catch {
      toast.error("Erreur lors du chargement du plan de salle");
    } finally {
      setIsLoading(false);
    }
  }, [zoneFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Rafraîchissement automatique toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Sélection d'une table → cart store
  const handleTableSelect = useCallback(
    (selectedTableId: string) => {
      const table = tables.find((t) => t.id === selectedTableId);
      if (!table) return;

      // Permettre la sélection de toutes les tables (pas seulement les libres)
      setTable(
        table.id,
        {
          id: table.id,
          numero: table.numero,
          capacite: table.capacite,
          zone: table.zone,
        },
        table.capacite
      );
      toast.success(
        `Table ${table.numero} sélectionnée (${table.capacite} couvert${table.capacite > 1 ? "s" : ""})`
      );
    },
    [tables, setTable]
  );

  // Changer le filtre de zone
  const handleZoneChange = useCallback((value: string) => {
    setZoneFilter(value === "all" ? undefined : value);
  }, []);

  if (isLoading) {
    return (
      <Flex
        align="center"
        justify="center"
        style={{ flex: 1, color: "var(--gray-10)", fontSize: 14 }}
      >
        Chargement du plan de salle...
      </Flex>
    );
  }

  return (
    <Flex direction="column" style={{ flex: 1, minHeight: 0 }}>
      {/* Stats */}
      <Box px="3" py="2" style={{ flexShrink: 0 }}>
        <TablesStats stats={stats} />
      </Box>

      {/* Filtres + Légende */}
      <Flex
        justify="between"
        align="center"
        px="3"
        py="2"
        gap="4"
        style={{ flexShrink: 0 }}
      >
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

          <Button variant="soft" color="gray" size="1" onClick={() => loadData()}>
            <ArrowsClockwise size={14} />
            Actualiser
          </Button>
        </Flex>

        <StatusLegend />
      </Flex>

      {/* Plan de salle — supprime la bordure/arrondi du FloorPlan pour l'intégrer sans double contour */}
      <style>{`.caisse-floorplan-embed > div { border: none !important; border-radius: 0 !important; }`}</style>
      <div className="caisse-floorplan-embed" style={{ flex: 1, minHeight: 0 }}>
        <FloorPlan
          tables={tables}
          dbZones={zones}
          selectedTableId={tableId}
          onTableSelect={handleTableSelect}
          onRefresh={loadData}
          readOnly
        />
      </div>
    </Flex>
  );
}
