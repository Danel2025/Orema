"use client";

/**
 * ProductList - Liste complète des produits avec filtres
 * Utilise un accordéon par catégorie pour masquer/afficher les produits
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, AlertCircle, ChevronDown, ChevronRight, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import * as Accordion from "@radix-ui/react-accordion";
import "./product-list.css";
import { ProductCard } from "./product-card";
import { ProductForm } from "./product-form";
import { SupplementsManager } from "./supplements-manager";
import { CSVImportExport } from "./csv-import-export";
import {
  ProductFilters,
  useDefaultFilters,
  type ProductFiltersState,
  type StockFilter,
  type SortField,
  type SortDirection,
} from "./product-filters";
import {
  getProduits,
  createProduit,
  updateProduit,
  deleteProduit,
  toggleProduitActif,
} from "@/actions/produits";
import { getCategories } from "@/actions/categories";
import type { ProduitFormData } from "@/schemas/produit.schema";

// Type inféré depuis getProduits
type Produit = Awaited<ReturnType<typeof getProduits>>[number];

interface Categorie {
  id: string;
  nom: string;
  couleur: string;
  actif: boolean;
}

export function ProductList() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produit | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [supplementsProduct, setSupplementsProduct] = useState<{ id: string; nom: string } | null>(null);

  // Filtres avancés
  const defaultFilters = useDefaultFilters();
  const [filters, setFilters] = useState<ProductFiltersState>(defaultFilters);

  // Charger les données
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [produitsData, categoriesData] = await Promise.all([
        getProduits({ includeInactive: true }),
        getCategories({ includeInactive: false }),
      ]);
      setProduits(produitsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast.error("Erreur lors du chargement des produits");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handler pour les changements de filtres
  const handleFiltersChange = useCallback((newFilters: ProductFiltersState) => {
    setFilters(newFilters);
  }, []);

  // Filtrer les produits avec les filtres avancés
  const filteredProduits = useMemo(() => {
    return produits
      .filter((prod) => {
        // Recherche par nom, description ou code-barres
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          !filters.search ||
          prod.nom.toLowerCase().includes(searchLower) ||
          prod.description?.toLowerCase().includes(searchLower) ||
          prod.codeBarre?.toLowerCase().includes(searchLower);

        // Filtre par catégorie
        const matchesCategory =
          !filters.categorieId || prod.categorieId === filters.categorieId;

        // Filtre par statut actif/inactif
        const matchesActive = filters.showInactive || prod.actif;

        // Filtre par disponibilité stock
        let matchesStock = true;
        if (filters.stockFilter !== "all" && prod.gererStock) {
          const stockActuel = prod.stockActuel ?? 0;
          const stockMin = prod.stockMin ?? 0;

          switch (filters.stockFilter) {
            case "in_stock":
              matchesStock = stockActuel > stockMin;
              break;
            case "low_stock":
              matchesStock = stockActuel > 0 && stockActuel <= stockMin;
              break;
            case "out_of_stock":
              matchesStock = stockActuel === 0;
              break;
          }
        } else if (filters.stockFilter !== "all" && !prod.gererStock) {
          // Si le produit ne gère pas le stock, considérer comme "en stock"
          matchesStock = filters.stockFilter === "in_stock";
        }

        return matchesSearch && matchesCategory && matchesActive && matchesStock;
      })
      .sort((a, b) => {
        // Tri
        const direction = filters.sortDirection === "asc" ? 1 : -1;

        switch (filters.sortField) {
          case "nom":
            return direction * a.nom.localeCompare(b.nom);
          case "prixVente":
            return direction * (Number(a.prixVente) - Number(b.prixVente));
          case "stockActuel":
            return direction * ((a.stockActuel ?? 0) - (b.stockActuel ?? 0));
          case "createdAt":
            return (
              direction *
              (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            );
          default:
            return 0;
        }
      });
  }, [produits, filters]);

  // Grouper par catégorie
  const groupedProduits = filteredProduits.reduce(
    (acc, prod) => {
      const catId = prod.categorieId;
      if (!catId) return acc;

      if (!acc[catId]) {
        // Trouver la catégorie dans la liste
        const categorie = categories.find((c) => c.id === catId);
        if (!categorie) return acc;

        acc[catId] = {
          categorie,
          produits: [],
        };
      }
      acc[catId].produits.push(prod);
      return acc;
    },
    {} as Record<string, { categorie: Categorie; produits: Produit[] }>
  );

  // Créer un produit
  const handleCreate = async (data: ProduitFormData) => {
    try {
      setIsSubmitting(true);
      const result = await createProduit(data);

      if (result.success) {
        toast.success("Produit créé avec succès");
        setShowForm(false);
        await loadData();
      } else {
        toast.error(result.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la création");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modifier un produit
  const handleUpdate = async (data: ProduitFormData) => {
    if (!editingProduct) return;

    try {
      setIsSubmitting(true);
      const result = await updateProduit(editingProduct.id, data);

      if (result.success) {
        toast.success("Produit modifié avec succès");
        setEditingProduct(null);
        await loadData();
      } else {
        toast.error(result.error || "Erreur lors de la modification");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la modification");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Supprimer un produit
  const handleDelete = async (id: string) => {
    try {
      const result = await deleteProduit(id);

      if (result.success) {
        toast.success("Produit supprimé");
        setDeleteConfirm(null);
        await loadData();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  // Activer/désactiver un produit
  const handleToggleActif = async (id: string) => {
    try {
      const result = await toggleProduitActif(id);

      if (result.success) {
        const isNowActive = result.data?.actif;
        toast.success(isNowActive ? "Produit activé" : "Produit désactivé");
        await loadData();
      } else {
        toast.error(result.error || "Erreur");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  return (
    <div>
      {/* Header avec boutons d'action */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ flex: 1 }} />

        {/* Boutons d'action */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Import/Export CSV */}
          <CSVImportExport onImportComplete={loadData} />

          {/* Bouton nouveau produit */}
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              backgroundColor: "var(--accent-9)",
              color: "white",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Plus size={18} />
            Nouveau produit
          </button>
        </div>
      </div>

      {/* Filtres avancés */}
      <ProductFilters
        categories={categories}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        totalCount={produits.length}
        filteredCount={filteredProduits.length}
      />

      {/* Liste des produits */}
      {isLoading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 48,
            color: "var(--gray-11)",
          }}
        >
          Chargement...
        </div>
      ) : filteredProduits.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: 48,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: "var(--gray-a3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <AlertCircle size={28} style={{ color: "var(--gray-9)" }} />
          </div>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--gray-12)",
              marginBottom: 8,
            }}
          >
            {filters.search || filters.categorieId || filters.stockFilter !== "all"
              ? "Aucun produit trouvé"
              : "Aucun produit"}
          </h3>
          <p
            style={{
              fontSize: 14,
              color: "var(--gray-11)",
              marginBottom: 20,
            }}
          >
            {filters.search || filters.categorieId || filters.stockFilter !== "all"
              ? "Essayez avec d'autres filtres"
              : "Créez votre premier produit pour commencer"}
          </p>
          {!filters.search && !filters.categorieId && filters.stockFilter === "all" && (
            <button
              onClick={() => setShowForm(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                backgroundColor: "var(--accent-9)",
                color: "white",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Plus size={18} />
              Créer un produit
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Boutons Tout ouvrir / Tout fermer */}
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <button
              onClick={() => setOpenCategories(Object.keys(groupedProduits))}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 500,
                borderRadius: 6,
                border: "1px solid var(--gray-a6)",
                backgroundColor: "transparent",
                color: "var(--gray-11)",
                cursor: "pointer",
              }}
            >
              <ChevronsUpDown size={14} />
              Tout ouvrir
            </button>
            <button
              onClick={() => setOpenCategories([])}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 500,
                borderRadius: 6,
                border: "1px solid var(--gray-a6)",
                backgroundColor: "transparent",
                color: "var(--gray-11)",
                cursor: "pointer",
              }}
            >
              <ChevronRight size={14} />
              Tout fermer
            </button>
          </div>

          {/* Accordéon des catégories */}
          <Accordion.Root
            type="multiple"
            value={openCategories}
            onValueChange={setOpenCategories}
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
            {Object.values(groupedProduits).map(({ categorie, produits: catProduits }) => (
              <Accordion.Item
                key={categorie.id}
                value={categorie.id}
              >
                <Accordion.Header style={{ margin: 0 }}>
                  <Accordion.Trigger
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "14px 16px",
                      backgroundColor: "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    {/* Indicateur couleur catégorie */}
                    <div
                      style={{
                        width: 4,
                        height: 28,
                        borderRadius: 2,
                        backgroundColor: categorie.couleur,
                        flexShrink: 0,
                      }}
                    />

                    {/* Nom et compteur */}
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "var(--gray-12)",
                        }}
                      >
                        {categorie.nom}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "var(--gray-10)",
                          backgroundColor: "var(--gray-a3)",
                          padding: "2px 8px",
                          borderRadius: 10,
                        }}
                      >
                        {catProduits.length}
                      </span>
                    </div>

                    {/* Chevron avec rotation */}
                    <ChevronDown
                      size={18}
                      style={{
                        color: "var(--gray-9)",
                        transition: "transform 200ms ease",
                        flexShrink: 0,
                      }}
                      className="accordion-chevron"
                    />
                  </Accordion.Trigger>
                </Accordion.Header>

                <Accordion.Content
                  style={{
                    overflow: "hidden",
                  }}
                  className="accordion-content"
                >
                  {/* Grille produits */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                      gap: 16,
                      padding: "0 16px 16px 16px",
                    }}
                  >
                    {catProduits.map((prod) => (
                      <ProductCard
                        key={prod.id}
                        {...prod}
                        categorie={categorie}
                        onEdit={(id) => {
                          const product = produits.find((p) => p.id === id);
                          if (product) setEditingProduct(product);
                        }}
                        onDelete={(id) => setDeleteConfirm(id)}
                        onToggleActif={handleToggleActif}
                        onManageSupplements={(id, nom) => setSupplementsProduct({ id, nom })}
                      />
                    ))}
                  </div>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>
      )}

      {/* Statistiques */}
      {!isLoading && produits.length > 0 && (
        <div
          style={{
            marginTop: 32,
            padding: 16,
            backgroundColor: "var(--gray-a2)",
            borderRadius: 8,
            display: "flex",
            gap: 24,
            fontSize: 13,
            color: "var(--gray-11)",
            flexWrap: "wrap",
          }}
        >
          <span>
            <strong style={{ color: "var(--gray-12)" }}>{produits.length}</strong> produit
            {produits.length > 1 ? "s" : ""} au total
          </span>
          <span>
            <strong style={{ color: "var(--green-11)" }}>
              {produits.filter((p) => p.actif).length}
            </strong>{" "}
            actif{produits.filter((p) => p.actif).length > 1 ? "s" : ""}
          </span>
          <span>
            <strong style={{ color: "var(--red-11)" }}>
              {produits.filter((p) => p.gererStock && p.stockActuel !== null && p.stockMin !== null && p.stockActuel <= p.stockMin).length}
            </strong>{" "}
            en stock bas
          </span>
        </div>
      )}

      {/* Modal de création */}
      {showForm ? <ProductForm
          categories={categories}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          isLoading={isSubmitting}
        /> : null}

      {/* Modal d'édition */}
      {editingProduct ? <ProductForm
          initialData={editingProduct}
          categories={categories}
          onSubmit={handleUpdate}
          onCancel={() => setEditingProduct(null)}
          isLoading={isSubmitting}
        /> : null}

      {/* Modal de gestion des suppléments */}
      {supplementsProduct ? <SupplementsManager
          produitId={supplementsProduct.id}
          produitNom={supplementsProduct.nom}
          onClose={() => setSupplementsProduct(null)}
        /> : null}

      {/* Modal de confirmation de suppression */}
      {deleteConfirm ? <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 16,
          }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            style={{
              backgroundColor: "var(--color-panel-solid)",
              borderRadius: 16,
              padding: 24,
              maxWidth: 400,
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: "var(--red-a3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <AlertCircle size={24} style={{ color: "var(--red-9)" }} />
            </div>

            <h3
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "var(--gray-12)",
                marginBottom: 8,
              }}
            >
              Supprimer ce produit ?
            </h3>

            <p
              style={{
                fontSize: 14,
                color: "var(--gray-11)",
                marginBottom: 24,
              }}
            >
              Cette action est irréversible. Si le produit a été vendu, la suppression sera bloquée.
            </p>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: 500,
                  borderRadius: 8,
                  border: "1px solid var(--gray-a6)",
                  backgroundColor: "transparent",
                  color: "var(--gray-12)",
                  cursor: "pointer",
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                style={{
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: "var(--red-9)",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div> : null}
    </div>
  );
}
