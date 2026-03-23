"use client";

/**
 * ProductList - Liste complète des produits avec filtres
 * Utilise un accordéon par catégorie pour masquer/afficher les produits
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  WarningCircle,
  CaretDown,
  CaretRight,
  ArrowsOutLineVertical,
} from "@phosphor-icons/react";
import { Box, Flex, Text, Button, AlertDialog, Spinner } from "@radix-ui/themes";
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
  const [supplementsProduct, setSupplementsProduct] = useState<{ id: string; nom: string } | null>(
    null
  );

  // Filtres avancés
  const defaultFilters = useDefaultFilters();
  const [filters, setFilters] = useState<ProductFiltersState>(defaultFilters);

  // Charger les données
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [produitsData, categoriesData] = await Promise.all([
        getProduits({ includeInactive: true }),
        getCategories({ includeInactive: false }),
      ]);
      setProduits(produitsData);
      setCategories(categoriesData as unknown as Categorie[]);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast.error("Erreur lors du chargement des produits");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
        const matchesCategory = !filters.categorieId || prod.categorieId === filters.categorieId;

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
          matchesStock = filters.stockFilter === "in_stock";
        }

        return matchesSearch && matchesCategory && matchesActive && matchesStock;
      })
      .sort((a, b) => {
        const direction = filters.sortDirection === "asc" ? 1 : -1;

        switch (filters.sortField) {
          case "nom":
            return direction * a.nom.localeCompare(b.nom);
          case "prixVente":
            return direction * (Number(a.prixVente) - Number(b.prixVente));
          case "stockActuel":
            return direction * ((a.stockActuel ?? 0) - (b.stockActuel ?? 0));
          case "createdAt":
            return direction * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
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
    <Box>
      {/* Header avec boutons d'action */}
      <Flex justify="between" align="center" mb="4" wrap="wrap" gap="4">
        <Box style={{ flex: 1 }} />

        {/* Boutons d'action */}
        <Flex gap="2" align="center">
          {/* Import/Export CSV */}
          <CSVImportExport onImportComplete={loadData} />

          {/* Bouton nouveau produit */}
          <Button onClick={() => setShowForm(true)} size="2" style={{ minHeight: 44 }}>
            <Plus size={18} weight="bold" aria-hidden="true" />
            Nouveau produit
          </Button>
        </Flex>
      </Flex>

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
        <Flex justify="center" align="center" py="9" role="status" aria-live="polite">
          <Spinner size="3" />
          <Text size="2" color="gray" ml="3">
            Chargement des produits...
          </Text>
        </Flex>
      ) : filteredProduits.length === 0 ? (
        <Flex direction="column" align="center" py="9" style={{ textAlign: "center" }}>
          <Box
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
            <WarningCircle size={28} style={{ color: "var(--gray-9)" }} aria-hidden="true" />
          </Box>
          <Text as="p" size="3" weight="bold" mb="2">
            {filters.search || filters.categorieId || filters.stockFilter !== "all"
              ? "Aucun produit trouvé"
              : "Aucun produit"}
          </Text>
          <Text as="p" size="2" color="gray" mb="4">
            {filters.search || filters.categorieId || filters.stockFilter !== "all"
              ? "Essayez avec d'autres filtres"
              : "Créez votre premier produit pour commencer"}
          </Text>
          {!filters.search && !filters.categorieId && filters.stockFilter === "all" && (
            <Button onClick={() => setShowForm(true)} size="2" style={{ minHeight: 44 }}>
              <Plus size={18} weight="bold" aria-hidden="true" />
              Créer un produit
            </Button>
          )}
        </Flex>
      ) : (
        <Flex direction="column" gap="2">
          {/* Boutons Tout ouvrir / Tout fermer */}
          <Flex gap="2" mb="2">
            <Button
              variant="outline"
              color="gray"
              size="2"
              onClick={() => setOpenCategories(Object.keys(groupedProduits))}
              style={{ minHeight: 44 }}
            >
              <ArrowsOutLineVertical size={14} aria-hidden="true" />
              Tout ouvrir
            </Button>
            <Button
              variant="outline"
              color="gray"
              size="2"
              onClick={() => setOpenCategories([])}
              style={{ minHeight: 44 }}
            >
              <CaretRight size={14} aria-hidden="true" />
              Tout fermer
            </Button>
          </Flex>

          {/* Accordéon des catégories */}
          <Accordion.Root
            type="multiple"
            value={openCategories}
            onValueChange={setOpenCategories}
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
            {Object.values(groupedProduits).map(({ categorie, produits: catProduits }) => (
              <Accordion.Item key={categorie.id} value={categorie.id}>
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
                      minHeight: 44,
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
                    <Flex align="center" gap="2" style={{ flex: 1 }}>
                      <Text size="3" weight="bold">
                        {categorie.nom}
                      </Text>
                      <Text
                        size="1"
                        weight="medium"
                        color="gray"
                        style={{
                          backgroundColor: "var(--gray-a3)",
                          padding: "2px 8px",
                          borderRadius: 10,
                        }}
                      >
                        {catProduits.length}
                      </Text>
                    </Flex>

                    {/* Chevron avec rotation */}
                    <CaretDown
                      size={18}
                      style={{
                        color: "var(--gray-9)",
                        transition: "transform 200ms ease",
                        flexShrink: 0,
                      }}
                      className="accordion-chevron"
                      aria-hidden="true"
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
        </Flex>
      )}

      {/* Statistiques */}
      {!isLoading && produits.length > 0 && (
        <Flex
          gap="5"
          wrap="wrap"
          mt="6"
          p="4"
          style={{
            backgroundColor: "var(--gray-a2)",
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          <Text size="2" color="gray">
            <Text weight="bold" style={{ color: "var(--gray-12)" }}>{produits.length}</Text>
            {" "}produit{produits.length > 1 ? "s" : ""} au total
          </Text>
          <Text size="2" color="gray">
            <Text weight="bold" style={{ color: "var(--green-11)" }}>
              {produits.filter((p) => p.actif).length}
            </Text>
            {" "}actif{produits.filter((p) => p.actif).length > 1 ? "s" : ""}
          </Text>
          <Text size="2" color="gray">
            <Text weight="bold" style={{ color: "var(--red-11)" }}>
              {
                produits.filter(
                  (p) =>
                    p.gererStock &&
                    p.stockActuel !== null &&
                    p.stockMin !== null &&
                    p.stockActuel <= p.stockMin
                ).length
              }
            </Text>
            {" "}en stock bas
          </Text>
        </Flex>
      )}

      {/* Modal de création - Dialog Radix UI */}
      {showForm ? <ProductForm
          categories={categories}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          isLoading={isSubmitting}
        /> : null}

      {/* Modal d'édition - Dialog Radix UI */}
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

      {/* AlertDialog de confirmation de suppression - Radix UI */}
      <AlertDialog.Root
        open={!!deleteConfirm}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm(null);
        }}
      >
        <AlertDialog.Content maxWidth="400px">
          <AlertDialog.Title>Supprimer ce produit ?</AlertDialog.Title>
          <AlertDialog.Description size="2">
            Le produit sera désactivé et n&apos;apparaîtra plus dans la liste. Vous pourrez le réactiver ultérieurement si nécessaire.
          </AlertDialog.Description>

          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Annuler
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button
                color="red"
                onClick={() => {
                  if (deleteConfirm) handleDelete(deleteConfirm);
                }}
              >
                Supprimer
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Box>
  );
}
