"use client";

/**
 * CategoryForm - Formulaire de création/édition de catégorie
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  Check,
  Loader2,
  Package,
  Coffee,
  UtensilsCrossed,
  Salad,
  IceCreamCone,
  Beer,
  Wine,
  Sandwich,
  Pizza,
  Soup,
  Beef,
  Fish,
  Egg,
  Croissant,
  Apple,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import {
  categorieSchema,
  categorieColors,
  categorieIcons,
  type CategorieFormData,
} from "@/schemas/categorie.schema";

// Map des icônes disponibles
const iconMap: Record<string, LucideIcon> = {
  Coffee,
  UtensilsCrossed,
  Salad,
  IceCreamCone,
  Beer,
  Wine,
  Sandwich,
  Pizza,
  Soup,
  Beef,
  Fish,
  Egg,
  Croissant,
  Apple,
  ShoppingBag,
  Package,
};

interface Imprimante {
  id: string;
  nom: string;
  type: string;
}

interface CategoryFormProps {
  initialData?: {
    id: string;
    nom: string;
    couleur: string;
    icone?: string | null;
    ordre: number;
    actif: boolean;
    imprimanteId?: string | null;
  };
  imprimantes: Imprimante[];
  onSubmit: (data: CategorieFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CategoryForm({
  initialData,
  imprimantes,
  onSubmit,
  onCancel,
  isLoading,
}: CategoryFormProps) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categorieSchema),
    defaultValues: {
      nom: initialData?.nom || "",
      couleur: initialData?.couleur || "#f97316",
      icone: initialData?.icone || null,
      ordre: initialData?.ordre || 0,
      actif: initialData?.actif ?? true,
      imprimanteId: initialData?.imprimanteId || null,
    },
  });

  const selectedColor = watch("couleur");
  const selectedIcon = watch("icone");

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data as CategorieFormData);
  });

  return (
    <div
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
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: "var(--color-panel-solid)",
          borderRadius: 16,
          width: "100%",
          maxWidth: 500,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 24px",
            borderBottom: "1px solid var(--gray-a6)",
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: "var(--gray-12)",
              margin: 0,
            }}
          >
            {isEditing ? "Modifier la catégorie" : "Nouvelle catégorie"}
          </h2>
          <button
            onClick={onCancel}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "none",
              backgroundColor: "var(--gray-a3)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--gray-11)",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20, overflowY: "auto", flex: 1 }}>
            {/* Nom */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--gray-12)",
                  marginBottom: 8,
                }}
              >
                Nom *
              </label>
              <input
                {...register("nom")}
                type="text"
                placeholder="Ex: Boissons, Plats, Desserts..."
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: 14,
                  borderRadius: 8,
                  border: errors.nom ? "1px solid var(--red-9)" : "1px solid var(--gray-a6)",
                  backgroundColor: "var(--gray-a2)",
                  color: "var(--gray-12)",
                  outline: "none",
                }}
              />
              {errors.nom ? <p style={{ fontSize: 13, color: "var(--red-11)", marginTop: 4 }}>
                  {errors.nom.message}
                </p> : null}
            </div>

            {/* Couleur */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--gray-12)",
                  marginBottom: 8,
                }}
              >
                Couleur
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: 8,
                }}
              >
                {categorieColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setValue("couleur", color.value)}
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      borderRadius: 8,
                      backgroundColor: color.value,
                      border: selectedColor === color.value ? "3px solid var(--gray-12)" : "3px solid transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "transform 0.1s ease",
                    }}
                    title={color.label}
                  >
                    {selectedColor === color.value && (
                      <Check size={20} style={{ color: "white" }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Icône */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--gray-12)",
                  marginBottom: 8,
                }}
              >
                Icône
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 8,
                  maxHeight: 200,
                  overflowY: "auto",
                  padding: 4,
                }}
              >
                {categorieIcons.map((icon) => {
                  const IconComponent = iconMap[icon.value];
                  const isSelected = selectedIcon === icon.value;

                  return (
                    <button
                      key={icon.value}
                      type="button"
                      onClick={() => setValue("icone", isSelected ? null : icon.value)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                        padding: 12,
                        borderRadius: 8,
                        border: isSelected ? `2px solid ${selectedColor}` : "1px solid var(--gray-a6)",
                        backgroundColor: isSelected ? selectedColor + "15" : "transparent",
                        cursor: "pointer",
                      }}
                      title={icon.label}
                    >
                      {IconComponent ? <IconComponent
                          size={24}
                          style={{ color: isSelected ? selectedColor : "var(--gray-11)" }}
                        /> : null}
                      <span
                        style={{
                          fontSize: 10,
                          color: "var(--gray-11)",
                          textAlign: "center",
                          lineHeight: 1.2,
                        }}
                      >
                        {icon.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Imprimante */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--gray-12)",
                  marginBottom: 8,
                }}
              >
                Imprimante associée
              </label>
              <select
                {...register("imprimanteId")}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: 14,
                  borderRadius: 8,
                  border: "1px solid var(--gray-a6)",
                  backgroundColor: "var(--gray-a2)",
                  color: "var(--gray-12)",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="">Aucune (ticket caisse par défaut)</option>
                {imprimantes.map((imp) => (
                  <option key={imp.id} value={imp.id}>
                    {imp.nom} ({imp.type})
                  </option>
                ))}
              </select>
              <p style={{ fontSize: 12, color: "var(--gray-10)", marginTop: 4 }}>
                Les commandes de cette catégorie seront envoyées à cette imprimante
              </p>
            </div>

            {/* Actif */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <input
                {...register("actif")}
                type="checkbox"
                id="actif"
                style={{
                  width: 20,
                  height: 20,
                  accentColor: "var(--accent-9)",
                  cursor: "pointer",
                }}
              />
              <label
                htmlFor="actif"
                style={{
                  fontSize: 14,
                  color: "var(--gray-12)",
                  cursor: "pointer",
                }}
              >
                Catégorie active (visible dans la caisse)
              </label>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              padding: "16px 24px",
              borderTop: "1px solid var(--gray-a6)",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
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
              type="submit"
              disabled={isLoading}
              style={{
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 8,
                border: "none",
                backgroundColor: "var(--accent-9)",
                color: "white",
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
              {isEditing ? "Enregistrer" : "Créer la catégorie"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
