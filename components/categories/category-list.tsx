"use client";

/**
 * CategoryList - Liste complète des catégories avec actions
 * Utilise Radix UI AlertDialog pour la confirmation de suppression (accessibilité)
 */

import { useState, useEffect, useCallback } from "react";
import { Plus, MagnifyingGlass, Funnel, WarningCircle } from "@phosphor-icons/react";
import { Box, Flex, Text, Button, AlertDialog, Spinner } from "@radix-ui/themes";
import { toast } from "sonner";
import { CategoryCard } from "./category-card";
import { CategoryForm } from "./category-form";
import {
  getCategories,
  getImprimantes,
  createCategorie,
  updateCategorie,
  deleteCategorie,
  toggleCategorieActif,
} from "@/actions/categories";
import type { CategorieFormData } from "@/schemas/categorie.schema";

interface Categorie {
  id: string;
  nom: string;
  couleur: string;
  icone: string | null;
  ordre: number;
  actif: boolean;
  imprimante_id: string | null;
  imprimanteId?: string | null;
  imprimantes?: {
    id: string;
    nom: string;
    type: string;
  } | null;
  imprimante?: {
    id: string;
    nom: string;
    type: string;
  } | null;
  _count: {
    produits: number;
  };
}

interface Imprimante {
  id: string;
  nom: string;
  type: string;
}

export function CategoryList() {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [imprimantes, setImprimantes] = useState<Imprimante[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Categorie | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Charger les données (wrapped in useCallback)
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [categoriesData, imprimantesData] = await Promise.all([
        getCategories({ includeInactive: true }),
        getImprimantes(),
      ]);
      setCategories(categoriesData as Categorie[]);
      setImprimantes(imprimantesData);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast.error("Erreur lors du chargement des catégories");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrer les catégories
  const filteredCategories = categories.filter((cat) => {
    const matchesSearch = cat.nom.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesActive = showInactive || cat.actif;
    return matchesSearch && matchesActive;
  });

  // Créer une catégorie
  const handleCreate = async (data: CategorieFormData) => {
    try {
      setIsSubmitting(true);
      const result = await createCategorie(data);

      if (result.success) {
        toast.success("Catégorie créée avec succès");
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

  // Modifier une catégorie
  const handleUpdate = async (data: CategorieFormData) => {
    if (!editingCategory) return;

    try {
      setIsSubmitting(true);
      const result = await updateCategorie(editingCategory.id, data);

      if (result.success) {
        toast.success("Catégorie modifiée avec succès");
        setEditingCategory(null);
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

  // Supprimer une catégorie
  const handleDelete = async (id: string) => {
    try {
      const result = await deleteCategorie(id);

      if (result.success) {
        toast.success("Catégorie supprimée");
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

  // Activer/désactiver une catégorie
  const handleToggleActif = async (id: string) => {
    try {
      const result = await toggleCategorieActif(id);

      if (result.success) {
        const isNowActive = result.data?.actif;
        toast.success(isNowActive ? "Catégorie activée" : "Catégorie désactivée");
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
      {/* Header avec actions */}
      <Flex
        justify="between"
        align="center"
        mb="5"
        wrap="wrap"
        gap="4"
      >
        {/* Recherche */}
        <Flex align="center" gap="3" style={{ flex: 1, maxWidth: 400 }}>
          <Box
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              backgroundColor: "var(--gray-a3)",
              borderRadius: 8,
              padding: "10px 14px",
              flex: 1,
            }}
          >
            <MagnifyingGlass size={18} style={{ color: "var(--gray-9)" }} aria-hidden="true" />
            <input
              type="text"
              placeholder="Rechercher une catégorie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Rechercher une catégorie"
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: 14,
                color: "var(--gray-12)",
                minHeight: 24,
              }}
            />
          </Box>

          {/* Toggle inactifs */}
          <Button
            variant={showInactive ? "solid" : "outline"}
            color={showInactive ? "orange" : "gray"}
            size="2"
            onClick={() => setShowInactive(!showInactive)}
            style={{ minHeight: 44 }}
          >
            <Funnel size={16} aria-hidden="true" />
            Inactifs
          </Button>
        </Flex>

        {/* Bouton ajouter */}
        <Button
          size="2"
          onClick={() => setShowForm(true)}
          style={{ minHeight: 44 }}
        >
          <Plus size={18} aria-hidden="true" />
          Nouvelle catégorie
        </Button>
      </Flex>

      {/* Liste des catégories */}
      {isLoading ? (
        <Flex justify="center" align="center" py="9" role="status" aria-live="polite">
          <Spinner size="3" />
          <Text size="2" color="gray" ml="3">Chargement...</Text>
        </Flex>
      ) : filteredCategories.length === 0 ? (
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
          <Text size="3" weight="bold" mb="2">
            {searchQuery ? "Aucune catégorie trouvée" : "Aucune catégorie"}
          </Text>
          <Text size="2" color="gray" mb="4">
            {searchQuery
              ? "Essayez avec d'autres termes de recherche"
              : "Créez votre première catégorie pour organiser vos produits"}
          </Text>
          {!searchQuery && (
            <Button size="2" onClick={() => setShowForm(true)} style={{ minHeight: 44 }}>
              <Plus size={18} aria-hidden="true" />
              Créer une catégorie
            </Button>
          )}
        </Flex>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {filteredCategories.map((cat) => (
            <CategoryCard
              key={cat.id}
              {...cat}
              onEdit={(id) => {
                const category = categories.find((c) => c.id === id);
                if (category) setEditingCategory(category);
              }}
              onDelete={(id) => setDeleteConfirm(id)}
              onToggleActif={handleToggleActif}
            />
          ))}
        </div>
      )}

      {/* Statistiques */}
      {!isLoading && categories.length > 0 && (
        <Flex
          mt="5"
          p="4"
          gap="5"
          style={{
            backgroundColor: "var(--gray-a2)",
            borderRadius: 8,
            fontSize: 13,
            color: "var(--gray-11)",
          }}
        >
          <Text size="2">
            <Text weight="bold" style={{ color: "var(--gray-12)" }}>{categories.length}</Text> catégorie
            {categories.length > 1 ? "s" : ""} au total
          </Text>
          <Text size="2">
            <Text weight="bold" style={{ color: "var(--green-11)" }}>
              {categories.filter((c) => c.actif).length}
            </Text>{" "}
            active{categories.filter((c) => c.actif).length > 1 ? "s" : ""}
          </Text>
          <Text size="2">
            <Text weight="bold" style={{ color: "var(--gray-10)" }}>
              {categories.filter((c) => !c.actif).length}
            </Text>{" "}
            inactive{categories.filter((c) => !c.actif).length > 1 ? "s" : ""}
          </Text>
        </Flex>
      )}

      {/* Modal de création */}
      {showForm ? (
        <CategoryForm
          imprimantes={imprimantes}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          isLoading={isSubmitting}
        />
      ) : null}

      {/* Modal d'édition */}
      {editingCategory ? (
        <CategoryForm
          initialData={editingCategory}
          imprimantes={imprimantes}
          onSubmit={handleUpdate}
          onCancel={() => setEditingCategory(null)}
          isLoading={isSubmitting}
        />
      ) : null}

      {/* AlertDialog de confirmation de suppression (Radix UI) */}
      <AlertDialog.Root
        open={!!deleteConfirm}
        onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}
      >
        <AlertDialog.Content maxWidth="400px">
          <AlertDialog.Title>Supprimer cette catégorie ?</AlertDialog.Title>
          <AlertDialog.Description size="2">
            Cette action est irréversible. Si la catégorie contient des produits, vous devrez
            d&apos;abord les déplacer ou les supprimer.
          </AlertDialog.Description>

          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray" size="2" style={{ minHeight: 44 }}>
                Annuler
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button
                color="red"
                size="2"
                style={{ minHeight: 44 }}
                onClick={() => { if (deleteConfirm) handleDelete(deleteConfirm); }}
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
