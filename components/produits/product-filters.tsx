"use client";

/**
 * ProductFilters - Filtres avancés pour la liste des produits
 */

import { useState, useEffect, useRef } from "react";
import {
  MagnifyingGlass,
  Funnel,
  CaretDown,
  X,
  SlidersHorizontal,
  Warning,
  Package,
  Check,
} from "@phosphor-icons/react";
import { Box, Flex, Text, Button, IconButton } from "@radix-ui/themes";

interface Categorie {
  id: string;
  nom: string;
  couleur: string;
}

export type StockFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";
export type SortField = "nom" | "prixVente" | "stockActuel" | "createdAt";
export type SortDirection = "asc" | "desc";

export interface ProductFiltersState {
  search: string;
  categorieId: string;
  stockFilter: StockFilter;
  showInactive: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
}

interface ProductFiltersProps {
  categories: Categorie[];
  filters: ProductFiltersState;
  onFiltersChange: (filters: ProductFiltersState) => void;
  totalCount: number;
  filteredCount: number;
}

export function ProductFilters({
  categories,
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
}: ProductFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Debounce la recherche avec ref pour éviter les boucles
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      if (localSearch !== filters.search) {
        onFiltersChange({ ...filters, search: localSearch });
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // On utilise uniquement localSearch pour le debounce
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);

  // Mettre à jour la recherche locale quand les filtres changent de l'extérieur
  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  const handleCategoryChange = (categorieId: string) => {
    onFiltersChange({ ...filters, categorieId });
  };

  const handleStockFilterChange = (stockFilter: StockFilter) => {
    onFiltersChange({ ...filters, stockFilter });
  };

  const handleSortChange = (field: SortField) => {
    const direction =
      filters.sortField === field && filters.sortDirection === "asc" ? "desc" : "asc";
    onFiltersChange({ ...filters, sortField: field, sortDirection: direction });
  };

  const handleToggleInactive = () => {
    onFiltersChange({ ...filters, showInactive: !filters.showInactive });
  };

  const handleClearFilters = () => {
    setLocalSearch("");
    onFiltersChange({
      search: "",
      categorieId: "",
      stockFilter: "all",
      showInactive: false,
      sortField: "nom",
      sortDirection: "asc",
    });
  };

  // Vérifier si des filtres sont actifs
  const hasActiveFilters =
    filters.search || filters.categorieId || filters.stockFilter !== "all" || filters.showInactive;

  const stockFilterOptions: { value: StockFilter; label: string; icon: React.ReactNode }[] = [
    { value: "all", label: "Tout", icon: <Package size={14} aria-hidden="true" /> },
    { value: "in_stock", label: "En stock", icon: <Check size={14} aria-hidden="true" /> },
    { value: "low_stock", label: "Stock bas", icon: <Warning size={14} aria-hidden="true" /> },
    { value: "out_of_stock", label: "Rupture", icon: <X size={14} aria-hidden="true" /> },
  ];

  const sortOptions: { value: SortField; label: string }[] = [
    { value: "nom", label: "Nom" },
    { value: "prixVente", label: "Prix" },
    { value: "stockActuel", label: "Stock" },
    { value: "createdAt", label: "Date" },
  ];

  return (
    <Box mb="5">
      {/* Ligne principale de filtres */}
      <Flex align="center" gap="3" wrap="wrap">
        {/* Recherche */}
        <Flex
          align="center"
          gap="2"
          style={{
            backgroundColor: "var(--gray-a3)",
            borderRadius: 8,
            padding: "10px 14px",
            minWidth: 200,
            flex: 1,
            maxWidth: 350,
          }}
        >
          <MagnifyingGlass size={18} style={{ color: "var(--gray-9)", flexShrink: 0 }} aria-hidden="true" />
          <input
            type="text"
            placeholder="Rechercher par nom, description ou code-barres..."
            aria-label="Rechercher des produits"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: 14,
              color: "var(--gray-12)",
            }}
          />
          {localSearch ? <IconButton
              variant="ghost"
              color="gray"
              size="1"
              onClick={() => {
                setLocalSearch("");
                onFiltersChange({ ...filters, search: "" });
              }}
              aria-label="Effacer la recherche"
              style={{ minWidth: 28, minHeight: 28 }}
            >
              <X size={16} aria-hidden="true" />
            </IconButton> : null}
        </Flex>

        {/* Filtre catégorie */}
        <div style={{ position: "relative" }}>
          <select
            value={filters.categorieId}
            onChange={(e) => handleCategoryChange(e.target.value)}
            aria-label="Filtrer par catégorie"
            style={{
              appearance: "none",
              padding: "10px 36px 10px 14px",
              fontSize: 14,
              borderRadius: 8,
              border: filters.categorieId
                ? "1px solid var(--accent-9)"
                : "1px solid var(--gray-a6)",
              backgroundColor: filters.categorieId
                ? "var(--accent-a3)"
                : "var(--color-panel-solid)",
              color: filters.categorieId ? "var(--accent-11)" : "var(--gray-12)",
              cursor: "pointer",
              outline: "none",
              minWidth: 180,
              minHeight: 44,
            }}
          >
            <option value="">Toutes les catégories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nom}
              </option>
            ))}
          </select>
          <CaretDown
            size={16}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: filters.categorieId ? "var(--accent-11)" : "var(--gray-9)",
              pointerEvents: "none",
            }}
            aria-hidden="true"
          />
        </div>

        {/* Toggle filtres avancés */}
        <Button
          variant={showAdvanced ? "soft" : "outline"}
          color={showAdvanced ? undefined : "gray"}
          size="2"
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{ minHeight: 44 }}
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          Filtres
          {hasActiveFilters ? <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "var(--accent-9)",
              }}
            /> : null}
        </Button>

        {/* Compteur */}
        <Text size="2" color="gray" style={{ marginLeft: "auto" }}>
          {filteredCount === totalCount ? (
            <span>{totalCount} produits</span>
          ) : (
            <span>
              {filteredCount} sur {totalCount} produits
            </span>
          )}
        </Text>
      </Flex>

      {/* Filtres avancés */}
      {showAdvanced ? <Box
          mt="4"
          p="4"
          style={{
            backgroundColor: "var(--gray-a2)",
            borderRadius: 12,
          }}
        >
          <Flex direction="column" gap="4">
            {/* Ligne 1: Stock + Inactifs */}
            <Flex gap="5" align="center" wrap="wrap">
              {/* Filtre stock */}
              <Box>
                <Text as="label" size="1" weight="medium" color="gray" mb="2" style={{ display: "block" }}>
                  Disponibilité stock
                </Text>
                <Flex gap="1">
                  {stockFilterOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={filters.stockFilter === option.value ? "soft" : "outline"}
                      color={filters.stockFilter === option.value ? undefined : "gray"}
                      size="1"
                      onClick={() => handleStockFilterChange(option.value)}
                      style={{ minHeight: 36 }}
                    >
                      {option.icon}
                      {option.label}
                    </Button>
                  ))}
                </Flex>
              </Box>

              {/* Toggle inactifs */}
              <Box>
                <Text as="label" size="1" weight="medium" color="gray" mb="2" style={{ display: "block" }}>
                  Produits inactifs
                </Text>
                <Button
                  variant={filters.showInactive ? "soft" : "outline"}
                  color={filters.showInactive ? undefined : "gray"}
                  size="1"
                  onClick={handleToggleInactive}
                  style={{ minHeight: 36 }}
                >
                  <Funnel size={14} aria-hidden="true" />
                  {filters.showInactive ? "Visibles" : "Masqués"}
                </Button>
              </Box>
            </Flex>

            {/* Ligne 2: Tri */}
            <Box>
              <Text as="label" size="1" weight="medium" color="gray" mb="2" style={{ display: "block" }}>
                Trier par
              </Text>
              <Flex gap="1">
                {sortOptions.map((option) => {
                  const isActive = filters.sortField === option.value;
                  return (
                    <Button
                      key={option.value}
                      variant={isActive ? "soft" : "outline"}
                      color={isActive ? "blue" : "gray"}
                      size="1"
                      onClick={() => handleSortChange(option.value)}
                      style={{ minHeight: 36 }}
                    >
                      {option.label}
                      {isActive ? <span style={{ fontSize: 10 }}>
                          {filters.sortDirection === "asc" ? "\u2191" : "\u2193"}
                        </span> : null}
                    </Button>
                  );
                })}
              </Flex>
            </Box>

            {/* Bouton réinitialiser */}
            {hasActiveFilters ? <Box style={{ borderTop: "1px solid var(--gray-a6)", paddingTop: 12 }}>
                <Button
                  variant="soft"
                  color="red"
                  size="1"
                  onClick={handleClearFilters}
                  style={{ minHeight: 36 }}
                >
                  <X size={14} aria-hidden="true" />
                  Réinitialiser les filtres
                </Button>
              </Box> : null}
          </Flex>
        </Box> : null}

      {/* Filtres actifs (badges) */}
      {hasActiveFilters && !showAdvanced ? <Flex align="center" gap="2" mt="3" wrap="wrap">
          <Text size="1" color="gray">Filtres actifs :</Text>

          {filters.search ? <FilterBadge
              label={`Recherche : "${filters.search}"`}
              onRemove={() => {
                setLocalSearch("");
                onFiltersChange({ ...filters, search: "" });
              }}
            /> : null}

          {filters.categorieId ? <FilterBadge
              label={`Catégorie : ${categories.find((c) => c.id === filters.categorieId)?.nom || ""}`}
              onRemove={() => onFiltersChange({ ...filters, categorieId: "" })}
            /> : null}

          {filters.stockFilter !== "all" && (
            <FilterBadge
              label={`Stock : ${stockFilterOptions.find((o) => o.value === filters.stockFilter)?.label || ""}`}
              onRemove={() => onFiltersChange({ ...filters, stockFilter: "all" })}
            />
          )}

          {filters.showInactive ? <FilterBadge
              label="Produits inactifs"
              onRemove={() => onFiltersChange({ ...filters, showInactive: false })}
            /> : null}
        </Flex> : null}
    </Box>
  );
}

// Composant Badge de filtre
function FilterBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        fontSize: 12,
        fontWeight: 500,
        borderRadius: 16,
        backgroundColor: "var(--accent-a3)",
        color: "var(--accent-11)",
      }}
    >
      {label}
      <button
        onClick={onRemove}
        aria-label={`Retirer le filtre : ${label}`}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: "var(--accent-11)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <X size={12} aria-hidden="true" />
      </button>
    </span>
  );
}

// Hook pour les valeurs par défaut des filtres
export function useDefaultFilters(): ProductFiltersState {
  return {
    search: "",
    categorieId: "",
    stockFilter: "all",
    showInactive: false,
    sortField: "nom",
    sortDirection: "asc",
  };
}
