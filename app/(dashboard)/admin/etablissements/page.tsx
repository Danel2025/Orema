"use client";

/**
 * Page de gestion des établissements - SUPER_ADMIN uniquement
 * Vue liste complète avec filtres, recherche, tri, sélection, comparaison
 */

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Flex,
  Grid,
  Heading,
  Text,
  Button,
  IconButton,
  Separator,
  Skeleton,
} from "@radix-ui/themes";
import {
  Buildings,
  Users,
  CurrencyCircleDollar,
  Plus,
  ArrowClockwise,
  SquaresFour,
  List,
} from "@phosphor-icons/react";
import { StatCard } from "@/components/composed";
import { motion } from "motion/react";
import { toast } from "sonner";
import { searchEtablissements } from "@/actions/admin/etablissements";
import { bulkSuspend, bulkReactivate } from "@/actions/admin/etablissements-bulk";
import { formatCurrency } from "@/lib/utils";
import { EtablissementsFilters, defaultFilters } from "@/components/admin/etablissements/etablissements-filters";
import { EtablissementsTable } from "@/components/admin/etablissements/etablissements-table";
import { EtablissementsCards } from "@/components/admin/etablissements/etablissements-cards";
import { CreateEtablissementDialog } from "@/components/admin/etablissements/create-etablissement-dialog";
import { EtablissementComparison } from "@/components/admin/etablissements/etablissement-comparison";
import { BulkActionsBar } from "@/components/admin/etablissements/bulk-actions-bar";
import { DeleteEtablissementDialog } from "@/components/admin/etablissements/detail/delete-etablissement-dialog";
import type { EtablissementWithStatsExtended, ViewMode } from "@/components/admin/etablissements/types";
import type { EtablissementFilters } from "@/components/admin/etablissements/etablissements-filters";

export default function AdminEtablissementsPage() {
  // Data
  const [etablissements, setEtablissements] = useState<EtablissementWithStatsExtended[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters & view
  const [filters, setFilters] = useState<EtablissementFilters>(defaultFilters);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Delete dialog
  const [selectedForDelete, setSelectedForDelete] = useState<EtablissementWithStatsExtended | null>(null);

  // Load data using server-side search
  const loadEtablissements = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await searchEtablissements({
        search: filters.search || undefined,
        statut: (filters.statut || "all") as "all" | "actif" | "suspendu" | "en_essai" | undefined,
        plan: (filters.plan || "all") as "all" | "essentiel" | "pro" | "business" | "enterprise" | undefined,
        sortBy: (filters.sortBy || "created_at") as "nom" | "created_at" | "chiffre_affaires" | "nb_utilisateurs" | "nb_ventes" | undefined,
        sortOrder: filters.sortOrder || "desc",
        page,
        pageSize,
      });
      if (result.success && result.data) {
        // Map server data to extended type for component compatibility
        const extended: EtablissementWithStatsExtended[] = result.data.data.map((e) => ({
          id: e.id,
          nom: e.nom,
          email: e.email,
          telephone: e.telephone,
          adresse: e.adresse,
          createdAt: new Date(e.created_at),
          nbUtilisateurs: e.nb_utilisateurs,
          nbProduits: e.nb_produits,
          nbVentes: e.nb_ventes,
          nbClients: e.nb_clients,
          statut: e.statut || "actif",
          plan: e.plan || "essentiel",
          chiffreAffaires: e.ca_total || 0,
          nif: e.nif,
          rccm: e.rccm,
        }));
        setEtablissements(extended);
        setTotalCount(result.data.count);
        setTotalPages(result.data.totalPages);
      } else {
        toast.error(result.error || "Erreur de chargement");
      }
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    loadEtablissements();
  }, [loadEtablissements]);

  // Stats (computed from current page data for display -- totals come from server count)
  const totalUtilisateurs = etablissements.reduce((sum, e) => sum + e.nbUtilisateurs, 0);
  const totalCA = etablissements.reduce((sum, e) => sum + (e.chiffreAffaires || 0), 0);
  const nbActifs = etablissements.filter((e) => (e.statut || "actif") === "actif").length;

  const statsCards = [
    {
      label: "Établissements",
      value: totalCount.toString(),
      icon: Buildings,
      color: "violet" as const,
    },
    {
      label: "Actifs",
      value: nbActifs.toString(),
      icon: Buildings,
      color: "green" as const,
    },
    {
      label: "Utilisateurs",
      value: totalUtilisateurs.toString(),
      icon: Users,
      color: "blue" as const,
    },
    {
      label: "CA global",
      value: formatCurrency(totalCA),
      icon: CurrencyCircleDollar,
      color: "amber" as const,
    },
  ];

  // Sort handler for table headers
  const handleSortChange = (column: string) => {
    if (filters.sortBy === column) {
      setFilters({
        ...filters,
        sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
      });
    } else {
      setFilters({ ...filters, sortBy: column, sortOrder: "desc" });
    }
    setPage(1);
  };

  // Suspend / Reactivate handlers
  const handleSuspend = async (etab: EtablissementWithStatsExtended) => {
    try {
      const { suspendEtablissement } = await import("@/actions/admin/etablissements");
      const result = await suspendEtablissement(etab.id, { motif: "Suspendu depuis la liste admin" });
      if (result.success) {
        toast.success(`"${etab.nom}" suspendu`);
        loadEtablissements();
      } else {
        toast.error(result.error || "Erreur");
      }
    } catch {
      toast.error("Erreur lors de la suspension");
    }
  };

  const handleReactivate = async (etab: EtablissementWithStatsExtended) => {
    try {
      const { reactivateEtablissement } = await import("@/actions/admin/etablissements");
      const result = await reactivateEtablissement(etab.id);
      if (result.success) {
        toast.success(`"${etab.nom}" réactivé`);
        loadEtablissements();
      } else {
        toast.error(result.error || "Erreur");
      }
    } catch {
      toast.error("Erreur lors de la réactivation");
    }
  };

  // Bulk actions using dedicated bulk server actions
  const handleBulkSuspend = async () => {
    const ids = Array.from(selectedIds);
    try {
      const result = await bulkSuspend({
        etablissement_ids: ids,
        motif: "Suspension groupee depuis la liste admin",
      });
      if (result.success && result.data) {
        toast.success(
          `${result.data.suspended}/${ids.length} etablissement(s) suspendu(s)`
        );
        if (result.data.failed.length > 0) {
          toast.warning(`${result.data.failed.length} echec(s)`);
        }
      } else {
        toast.error(result.error || "Erreur lors de la suspension en masse");
      }
    } catch {
      toast.error("Erreur lors de la suspension en masse");
    }
    setSelectedIds(new Set());
    loadEtablissements();
  };

  const handleBulkReactivate = async () => {
    const ids = Array.from(selectedIds);
    try {
      const result = await bulkReactivate({
        etablissement_ids: ids,
      });
      if (result.success && result.data) {
        toast.success(
          `${result.data.reactivated}/${ids.length} etablissement(s) reactive(s)`
        );
        if (result.data.failed.length > 0) {
          toast.warning(`${result.data.failed.length} echec(s)`);
        }
      } else {
        toast.error(result.error || "Erreur lors de la reactivation en masse");
      }
    } catch {
      toast.error("Erreur lors de la reactivation en masse");
    }
    setSelectedIds(new Set());
    loadEtablissements();
  };

  // Comparison
  const selectedEtablissements = etablissements.filter((e) => selectedIds.has(e.id));
  const canCompare = selectedIds.size >= 2 && selectedIds.size <= 3;

  return (
    <Box>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Flex align="center" justify="between" mb="6">
          <Flex align="center" gap="3">
            <Box
              p="3"
              style={{
                background: "var(--accent-a3)",
                borderRadius: 8,
              }}
            >
              <Buildings size={24} weight="duotone" style={{ color: "var(--accent-9)" }} />
            </Box>
            <Box>
              <Heading size="6" weight="bold">
                Gestion des établissements
              </Heading>
              <Text size="2" color="gray">
                {totalCount} établissement{totalCount !== 1 ? "s" : ""}{" "}
                {filters.search || filters.statut !== "all" || filters.plan !== "all"
                  ? "(filtré)"
                  : ""}
              </Text>
            </Box>
          </Flex>

          <Flex gap="3" align="center">
            {/* Toggle vue */}
            <Flex
              align="center"
              style={{
                background: "var(--gray-a3)",
                borderRadius: "var(--radius-3)",
                padding: 3,
                gap: 2,
              }}
            >
              <IconButton
                variant={viewMode === "cards" ? "soft" : "ghost"}
                color={viewMode === "cards" ? undefined : "gray"}
                size="2"
                onClick={() => setViewMode("cards")}
                style={{ cursor: "pointer", borderRadius: "var(--radius-2)" }}
                aria-label="Vue grille"
              >
                <SquaresFour size={18} weight={viewMode === "cards" ? "fill" : "regular"} />
              </IconButton>
              <IconButton
                variant={viewMode === "table" ? "soft" : "ghost"}
                color={viewMode === "table" ? undefined : "gray"}
                size="2"
                onClick={() => setViewMode("table")}
                style={{ cursor: "pointer", borderRadius: "var(--radius-2)" }}
                aria-label="Vue tableau"
              >
                <List size={18} weight={viewMode === "table" ? "fill" : "regular"} />
              </IconButton>
            </Flex>

            <Separator orientation="vertical" size="1" />

            <IconButton
              variant="soft"
              color="gray"
              size="2"
              onClick={loadEtablissements}
              disabled={isLoading}
              aria-label="Actualiser"
              style={{ cursor: "pointer" }}
            >
              <ArrowClockwise
                size={18}
                weight="bold"
                className={isLoading ? "animate-spin" : ""}
              />
            </IconButton>

            <Button size="2" onClick={() => setCreateDialogOpen(true)} style={{ cursor: "pointer" }}>
              <Plus size={16} weight="bold" />
              Créer un établissement
            </Button>
          </Flex>
        </Flex>
      </motion.div>

      {/* Stats globales */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
      >
        <Grid columns={{ initial: "2", md: "4" }} gap="4" mb="6">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.12 + index * 0.06 }}
            >
              <StatCard
                title={stat.label}
                value={isLoading ? "..." : stat.value}
                icon={stat.icon}
                color={stat.color}
              />
            </motion.div>
          ))}
        </Grid>
      </motion.div>

      {/* Filtres */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        style={{ marginBottom: 20 }}
      >
        <EtablissementsFilters
          filters={filters}
          onFiltersChange={(f) => {
            setFilters(f);
            setPage(1);
          }}
          disabled={isLoading}
        />
      </motion.div>

      {/* Comparaison */}
      {showComparison && selectedEtablissements.length >= 2 ? <Box mb="5">
          <EtablissementComparison
            etablissements={selectedEtablissements}
            onClose={() => setShowComparison(false)}
          />
        </Box> : null}

      {/* Liste */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.3 }}
      >
        {isLoading ? (
          <Box
            style={{
              background: "var(--color-background)",
              borderRadius: 12,
              border: "1px solid var(--gray-a4)",
              overflow: "hidden",
            }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <Box
                key={i}
                px="4"
                py="3"
                style={{ borderBottom: "1px solid var(--gray-a3)" }}
              >
                <Flex gap="4" align="center">
                  <Skeleton style={{ width: 20, height: 20 }} />
                  <Box style={{ flex: 1 }}>
                    <Skeleton style={{ width: 160, height: 16, marginBottom: 4 }} />
                    <Skeleton style={{ width: 80, height: 12 }} />
                  </Box>
                  <Skeleton style={{ width: 60, height: 22, borderRadius: 10 }} />
                  <Skeleton style={{ width: 50, height: 22, borderRadius: 10 }} />
                  <Skeleton style={{ width: 28, height: 28, borderRadius: 6 }} />
                </Flex>
              </Box>
            ))}
          </Box>
        ) : viewMode === "table" ? (
          <EtablissementsTable
            etablissements={etablissements}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onSortChange={handleSortChange}
            onSuspend={handleSuspend}
            onReactivate={handleReactivate}
            onDelete={setSelectedForDelete}
          />
        ) : (
          <EtablissementsCards
            etablissements={etablissements}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onSuspend={handleSuspend}
            onReactivate={handleReactivate}
            onDelete={setSelectedForDelete}
          />
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Flex align="center" justify="between" mt="4">
            <Text size="2" color="gray">
              Page {page} sur {totalPages} ({totalCount} résultat
              {totalCount !== 1 ? "s" : ""})
            </Text>
            <Flex gap="2">
              <Button
                variant="soft"
                color="gray"
                size="2"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Précédent
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? "solid" : "soft"}
                    color={pageNum === page ? undefined : "gray"}
                    size="2"
                    onClick={() => setPage(pageNum)}
                    style={{ minWidth: 36, cursor: "pointer" }}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              {totalPages > 5 && (
                <Text size="2" color="gray" style={{ alignSelf: "center" }}>
                  ...
                </Text>
              )}
              <Button
                variant="soft"
                color="gray"
                size="2"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Suivant
              </Button>
            </Flex>
          </Flex>
        </motion.div>
      )}

      {/* Bulk actions bar */}
      <BulkActionsBar
        selectedCount={selectedIds.size}
        onSuspend={handleBulkSuspend}
        onReactivate={handleBulkReactivate}
        onCompare={() => setShowComparison(true)}
        onDeselectAll={() => setSelectedIds(new Set())}
        canCompare={canCompare}
      />

      {/* Dialog de création */}
      <CreateEtablissementDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={loadEtablissements}
      />

      {/* Dialog de confirmation de suppression */}
      <DeleteEtablissementDialog
        etablissement={selectedForDelete}
        open={!!selectedForDelete}
        onOpenChange={(open) => {
          if (!open) setSelectedForDelete(null);
        }}
        onDeleted={loadEtablissements}
      />
    </Box>
  );
}
