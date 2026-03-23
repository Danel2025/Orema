"use client";

/**
 * StocksContent - Contenu principal de la page des stocks
 * Client component qui gère l'état et les interactions
 */

import { useState, useEffect, useCallback } from "react";
import { Box, Flex, Tabs, Button, Grid } from "@radix-ui/themes";
import {
  Package,
  Warning,
  ClipboardText,
  TrendUp,
  Plus,
  ClockCounterClockwise,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import {
  StockList,
  StockMovementModal,
  MovementHistory,
  StockAlerts,
  InventoryModal,
  StockValuation,
} from "@/components/stocks";
import {
  getStockStatus,
  getStockCategories,
  getStockAlerts,
  getStockValuation,
  exportStockCSV,
} from "@/actions/stocks";
import type {
  ProduitAvecStatutStock,
  AlerteStock,
  ValorisationStock,
} from "@/schemas/stock.schema";
import { toast } from "sonner";

export function StocksContent() {
  // États des données
  const [produits, setProduits] = useState<ProduitAvecStatutStock[]>([]);
  const [categories, setCategories] = useState<{ id: string; nom: string; couleur: string }[]>([]);
  const [alertes, setAlertes] = useState<AlerteStock[]>([]);
  const [valorisation, setValorisation] = useState<ValorisationStock | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // États des modales
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [selectedProduit, setSelectedProduit] = useState<{
    id: string;
    nom: string;
    stockActuel?: number | null;
    unite?: string | null;
  } | null>(null);

  // Charger les données
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [produitsResult, categoriesResult, alertesResult, valorisationResult] =
        await Promise.all([
          getStockStatus(),
          getStockCategories(),
          getStockAlerts(),
          getStockValuation(),
        ]);

      if (produitsResult.success) {
        setProduits(produitsResult.data);
      }
      if (categoriesResult.success) {
        setCategories(categoriesResult.data);
      }
      if (alertesResult.success) {
        setAlertes(alertesResult.data);
      }
      if (valorisationResult.success) {
        setValorisation(valorisationResult.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Gestionnaires d'événements
  const handleCreateMovement = (produitId: string, produitNom: string) => {
    const produit = produits.find((p) => p.id === produitId);
    setSelectedProduit({
      id: produitId,
      nom: produitNom,
      stockActuel: produit?.stockActuel,
      unite: produit?.unite,
    });
    setMovementModalOpen(true);
  };

  const handleViewHistory = (produitId: string, produitNom: string) => {
    setSelectedProduit({ id: produitId, nom: produitNom });
    setHistoryModalOpen(true);
  };

  const handleExport = async () => {
    try {
      const result = await exportStockCSV();
      if (result.success) {
        // Créer et télécharger le fichier
        const blob = new Blob([result.data], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Export téléchargé");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erreur lors de l'export");
    }
  };

  const handleSuccess = () => {
    loadData();
  };

  return (
    <>
      <Tabs.Root defaultValue="liste">
        <Flex justify="between" align="center" wrap="wrap" gap="3" mb="4">
          <Tabs.List>
            <Tabs.Trigger value="liste">
              <Flex align="center" gap="2">
                <Package size={16} />
                Liste des stocks
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value="alertes">
              <Flex align="center" gap="2">
                <Warning size={16} />
                Alertes
                {alertes.length > 0 && (
                  <Box
                    style={{
                      backgroundColor: "var(--red-9)",
                      color: "white",
                      borderRadius: "50%",
                      width: 18,
                      height: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {alertes.length}
                  </Box>
                )}
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value="valorisation">
              <Flex align="center" gap="2">
                <TrendUp size={16} />
                Valorisation
              </Flex>
            </Tabs.Trigger>
          </Tabs.List>

          <Flex gap="2">
            <Button variant="soft" color="gray" onClick={loadData} disabled={isLoading}>
              <ArrowsClockwise size={16} className={isLoading ? "animate-spin" : ""} />
              Actualiser
            </Button>
            <Button variant="soft" onClick={() => setHistoryModalOpen(true)}>
              <ClockCounterClockwise size={16} />
              Historique
            </Button>
            <Button variant="soft" color="purple" onClick={() => setInventoryModalOpen(true)}>
              <ClipboardText size={16} />
              Inventaire
            </Button>
            <Button
              onClick={() => {
                setSelectedProduit(null);
                setMovementModalOpen(true);
              }}
            >
              <Plus size={16} />
              Mouvement
            </Button>
          </Flex>
        </Flex>

        {/* Onglet Liste des stocks */}
        <Tabs.Content value="liste">
          <StockList
            produits={produits}
            categories={categories}
            onCreateMovement={handleCreateMovement}
            onViewHistory={handleViewHistory}
            onExport={handleExport}
          />
        </Tabs.Content>

        {/* Onglet Alertes */}
        <Tabs.Content value="alertes">
          <StockAlerts alertes={alertes} onCreateMovement={handleCreateMovement} />
        </Tabs.Content>

        {/* Onglet Valorisation */}
        <Tabs.Content value="valorisation">
          {valorisation ? (
            <Grid columns={{ initial: "1", md: "2" }} gap="4">
              <StockValuation valorisation={valorisation} />
              <StockAlerts alertes={alertes} onCreateMovement={handleCreateMovement} />
            </Grid>
          ) : null}
        </Tabs.Content>
      </Tabs.Root>

      {/* Modal de mouvement de stock */}
      <StockMovementModal
        open={movementModalOpen}
        onOpenChange={setMovementModalOpen}
        produit={selectedProduit || undefined}
        produits={
          !selectedProduit
            ? produits.map((p) => ({
                id: p.id,
                nom: p.nom,
                stockActuel: p.stockActuel || 0,
                unite: p.unite,
              }))
            : undefined
        }
        onSuccess={handleSuccess}
      />

      {/* Modal d'historique */}
      <MovementHistory
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
        produitId={selectedProduit?.id}
        produitNom={selectedProduit?.nom}
      />

      {/* Modal d'inventaire */}
      <InventoryModal
        open={inventoryModalOpen}
        onOpenChange={setInventoryModalOpen}
        onSuccess={handleSuccess}
      />
    </>
  );
}
