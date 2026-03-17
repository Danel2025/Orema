"use client";

/**
 * CategoryList - Liste complète des catégories avec actions
 */

import { useState, useEffect } from "react";
import { Plus, Search, Filter, AlertCircle } from "lucide-react";
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

  // Charger les données
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [categoriesData, imprimantesData] = await Promise.all([
        getCategories({ includeInactive: true }),
        getImprimantes(),
      ]);
      setCategories(categoriesData);
      setImprimantes(imprimantesData);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast.error("Erreur lors du chargement des catégories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
    <div>
      {/* Header avec actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        {/* Recherche */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flex: 1,
            maxWidth: 400,
          }}
        >
          <div
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
            <Search size={18} style={{ color: "var(--gray-9)" }} />
            <input
              type="text"
              placeholder="Rechercher une catégorie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: 14,
                color: "var(--gray-12)",
              }}
            />
          </div>

          {/* Toggle inactifs */}
          <button
            onClick={() => setShowInactive(!showInactive)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 14px",
              borderRadius: 8,
              border: showInactive ? "1px solid var(--accent-9)" : "1px solid var(--gray-a6)",
              backgroundColor: showInactive ? "var(--accent-a3)" : "transparent",
              cursor: "pointer",
              fontSize: 14,
              color: showInactive ? "var(--accent-11)" : "var(--gray-11)",
            }}
          >
            <Filter size={16} />
            Inactifs
          </button>
        </div>

        {/* Bouton ajouter */}
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
          Nouvelle catégorie
        </button>
      </div>

      {/* Liste des catégories */}
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
      ) : filteredCategories.length === 0 ? (
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
            {searchQuery
              ? "Aucune catégorie trouvée"
              : "Aucune catégorie"}
          </h3>
          <p
            style={{
              fontSize: 14,
              color: "var(--gray-11)",
              marginBottom: 20,
            }}
          >
            {searchQuery
              ? "Essayez avec d'autres termes de recherche"
              : "Créez votre première catégorie pour organiser vos produits"}
          </p>
          {!searchQuery && (
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
              Créer une catégorie
            </button>
          )}
        </div>
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
        <div
          style={{
            marginTop: 24,
            padding: 16,
            backgroundColor: "var(--gray-a2)",
            borderRadius: 8,
            display: "flex",
            gap: 24,
            fontSize: 13,
            color: "var(--gray-11)",
          }}
        >
          <span>
            <strong style={{ color: "var(--gray-12)" }}>{categories.length}</strong> catégorie
            {categories.length > 1 ? "s" : ""} au total
          </span>
          <span>
            <strong style={{ color: "var(--green-11)" }}>
              {categories.filter((c) => c.actif).length}
            </strong>{" "}
            active{categories.filter((c) => c.actif).length > 1 ? "s" : ""}
          </span>
          <span>
            <strong style={{ color: "var(--gray-10)" }}>
              {categories.filter((c) => !c.actif).length}
            </strong>{" "}
            inactive{categories.filter((c) => !c.actif).length > 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Modal de création */}
      {showForm ? <CategoryForm
          imprimantes={imprimantes}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          isLoading={isSubmitting}
        /> : null}

      {/* Modal d'édition */}
      {editingCategory ? <CategoryForm
          initialData={editingCategory}
          imprimantes={imprimantes}
          onSubmit={handleUpdate}
          onCancel={() => setEditingCategory(null)}
          isLoading={isSubmitting}
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
              Supprimer cette catégorie ?
            </h3>

            <p
              style={{
                fontSize: 14,
                color: "var(--gray-11)",
                marginBottom: 24,
              }}
            >
              Cette action est irréversible. Si la catégorie contient des produits, vous devrez d'abord les déplacer ou les supprimer.
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
