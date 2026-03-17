"use client";

/**
 * ProductFilters - Filtres avancés pour la liste des produits
 */

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  X,
  SlidersHorizontal,
  AlertTriangle,
  Package,
  Check,
} from "lucide-react";

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

  // Debounce la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        onFiltersChange({ ...filters, search: localSearch });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, filters, onFiltersChange]);

  // Mettre à jour la recherche locale quand les filtres changent
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
      filters.sortField === field && filters.sortDirection === "asc"
        ? "desc"
        : "asc";
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
    filters.search ||
    filters.categorieId ||
    filters.stockFilter !== "all" ||
    filters.showInactive;

  const stockFilterOptions: { value: StockFilter; label: string; icon: React.ReactNode }[] = [
    { value: "all", label: "Tout", icon: <Package size={14} /> },
    { value: "in_stock", label: "En stock", icon: <Check size={14} /> },
    { value: "low_stock", label: "Stock bas", icon: <AlertTriangle size={14} /> },
    { value: "out_of_stock", label: "Rupture", icon: <X size={14} /> },
  ];

  const sortOptions: { value: SortField; label: string }[] = [
    { value: "nom", label: "Nom" },
    { value: "prixVente", label: "Prix" },
    { value: "stockActuel", label: "Stock" },
    { value: "createdAt", label: "Date" },
  ];

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Ligne principale de filtres */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {/* Recherche */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            backgroundColor: "var(--gray-a3)",
            borderRadius: 8,
            padding: "10px 14px",
            minWidth: 200,
            flex: 1,
            maxWidth: 350,
          }}
        >
          <Search size={18} style={{ color: "var(--gray-9)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Rechercher par nom, description ou code-barres..."
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
          {localSearch ? <button
              onClick={() => {
                setLocalSearch("");
                onFiltersChange({ ...filters, search: "" });
              }}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                color: "var(--gray-9)",
              }}
            >
              <X size={16} />
            </button> : null}
        </div>

        {/* Filtre catégorie */}
        <div style={{ position: "relative" }}>
          <select
            value={filters.categorieId}
            onChange={(e) => handleCategoryChange(e.target.value)}
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
            }}
          >
            <option value="">Toutes les categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nom}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: filters.categorieId ? "var(--accent-11)" : "var(--gray-9)",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Toggle filtres avancés */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 14px",
            borderRadius: 8,
            border: showAdvanced
              ? "1px solid var(--accent-9)"
              : "1px solid var(--gray-a6)",
            backgroundColor: showAdvanced ? "var(--accent-a3)" : "transparent",
            cursor: "pointer",
            fontSize: 14,
            color: showAdvanced ? "var(--accent-11)" : "var(--gray-11)",
          }}
        >
          <SlidersHorizontal size={16} />
          Filtres
          {hasActiveFilters ? <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "var(--accent-9)",
              }}
            /> : null}
        </button>

        {/* Compteur */}
        <div
          style={{
            fontSize: 13,
            color: "var(--gray-10)",
            marginLeft: "auto",
          }}
        >
          {filteredCount === totalCount ? (
            <span>{totalCount} produits</span>
          ) : (
            <span>
              {filteredCount} sur {totalCount} produits
            </span>
          )}
        </div>
      </div>

      {/* Filtres avancés */}
      {showAdvanced ? <div
          style={{
            marginTop: 16,
            padding: 16,
            backgroundColor: "var(--gray-a2)",
            borderRadius: 12,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Ligne 1: Stock + Inactifs */}
          <div
            style={{
              display: "flex",
              gap: 24,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {/* Filtre stock */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--gray-11)",
                  marginBottom: 8,
                }}
              >
                Disponibilite stock
              </label>
              <div style={{ display: "flex", gap: 4 }}>
                {stockFilterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleStockFilterChange(option.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 500,
                      borderRadius: 6,
                      border:
                        filters.stockFilter === option.value
                          ? "1px solid var(--accent-9)"
                          : "1px solid var(--gray-a6)",
                      backgroundColor:
                        filters.stockFilter === option.value
                          ? "var(--accent-a3)"
                          : "transparent",
                      color:
                        filters.stockFilter === option.value
                          ? "var(--accent-11)"
                          : "var(--gray-11)",
                      cursor: "pointer",
                    }}
                  >
                    {option.icon}
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle inactifs */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--gray-11)",
                  marginBottom: 8,
                }}
              >
                Produits inactifs
              </label>
              <button
                onClick={handleToggleInactive}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: filters.showInactive
                    ? "1px solid var(--accent-9)"
                    : "1px solid var(--gray-a6)",
                  backgroundColor: filters.showInactive
                    ? "var(--accent-a3)"
                    : "transparent",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 500,
                  color: filters.showInactive
                    ? "var(--accent-11)"
                    : "var(--gray-11)",
                }}
              >
                <Filter size={14} />
                {filters.showInactive ? "Affiches" : "Masques"}
              </button>
            </div>
          </div>

          {/* Ligne 2: Tri */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--gray-11)",
                marginBottom: 8,
              }}
            >
              Trier par
            </label>
            <div style={{ display: "flex", gap: 4 }}>
              {sortOptions.map((option) => {
                const isActive = filters.sortField === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 500,
                      borderRadius: 6,
                      border: isActive
                        ? "1px solid var(--blue-9)"
                        : "1px solid var(--gray-a6)",
                      backgroundColor: isActive
                        ? "var(--blue-a3)"
                        : "transparent",
                      color: isActive ? "var(--blue-11)" : "var(--gray-11)",
                      cursor: "pointer",
                    }}
                  >
                    {option.label}
                    {isActive ? <span style={{ fontSize: 10 }}>
                        {filters.sortDirection === "asc" ? "↑" : "↓"}
                      </span> : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bouton réinitialiser */}
          {hasActiveFilters ? <div style={{ borderTop: "1px solid var(--gray-a6)", paddingTop: 12 }}>
              <button
                onClick={handleClearFilters}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: 6,
                  border: "none",
                  backgroundColor: "var(--red-a3)",
                  color: "var(--red-11)",
                  cursor: "pointer",
                }}
              >
                <X size={14} />
                Reinitialiser les filtres
              </button>
            </div> : null}
        </div> : null}

      {/* Filtres actifs (badges) */}
      {hasActiveFilters && !showAdvanced ? <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 12,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--gray-10)" }}>
            Filtres actifs:
          </span>

          {filters.search ? <FilterBadge
              label={`Recherche: "${filters.search}"`}
              onRemove={() => {
                setLocalSearch("");
                onFiltersChange({ ...filters, search: "" });
              }}
            /> : null}

          {filters.categorieId ? <FilterBadge
              label={`Categorie: ${categories.find((c) => c.id === filters.categorieId)?.nom || ""}`}
              onRemove={() => onFiltersChange({ ...filters, categorieId: "" })}
            /> : null}

          {filters.stockFilter !== "all" && (
            <FilterBadge
              label={`Stock: ${stockFilterOptions.find((o) => o.value === filters.stockFilter)?.label || ""}`}
              onRemove={() => onFiltersChange({ ...filters, stockFilter: "all" })}
            />
          )}

          {filters.showInactive ? <FilterBadge
              label="Produits inactifs"
              onRemove={() => onFiltersChange({ ...filters, showInactive: false })}
            /> : null}
        </div> : null}
    </div>
  );
}

// Composant Badge de filtre
function FilterBadge({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
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
        <X size={12} />
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
