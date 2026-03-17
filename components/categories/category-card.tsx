"use client";

/**
 * CategoryCard - Carte affichant une catégorie
 */

import {
  MoreVertical,
  Edit2,
  Trash2,
  Power,
  GripVertical,
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
  Printer,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

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

interface CategoryCardProps {
  id: string;
  nom: string;
  couleur: string;
  icone?: string | null;
  ordre: number;
  actif: boolean;
  imprimante?: {
    id: string;
    nom: string;
    type: string;
  } | null;
  _count: {
    produits: number;
  };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActif: (id: string) => void;
  isDragging?: boolean;
}

export function CategoryCard({
  id,
  nom,
  couleur,
  icone,
  actif,
  imprimante,
  _count,
  onEdit,
  onDelete,
  onToggleActif,
  isDragging,
}: CategoryCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  // Récupérer l'icône dynamiquement
  const IconComponent = icone && iconMap[icone] ? iconMap[icone] : Package;

  return (
    <div
      style={{
        backgroundColor: "var(--color-panel-solid)",
        borderRadius: 12,
        border: "1px solid var(--gray-a6)",
        padding: 16,
        opacity: actif ? 1 : 0.6,
        transition: "all 0.15s ease",
        transform: isDragging ? "scale(1.02)" : "scale(1)",
        boxShadow: isDragging ? "0 8px 24px rgba(0,0,0,0.15)" : "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {/* Header avec icône et menu */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        {/* Icône colorée */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: couleur + "20",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconComponent
            size={24}
            style={{ color: couleur }}
          />
        </div>

        {/* Menu d'actions */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "none",
              backgroundColor: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--gray-11)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--gray-a3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <MoreVertical size={18} />
          </button>

          {showMenu ? <>
              {/* Overlay pour fermer le menu */}
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 40,
                }}
                onClick={() => setShowMenu(false)}
              />
              {/* Menu dropdown */}
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  marginTop: 4,
                  backgroundColor: "var(--color-panel-solid)",
                  borderRadius: 8,
                  border: "1px solid var(--gray-a6)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  padding: 4,
                  minWidth: 160,
                  zIndex: 50,
                }}
              >
                <button
                  onClick={() => {
                    onEdit(id);
                    setShowMenu(false);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "none",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    fontSize: 14,
                    color: "var(--gray-12)",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--gray-a3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <Edit2 size={16} />
                  Modifier
                </button>

                <button
                  onClick={() => {
                    onToggleActif(id);
                    setShowMenu(false);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "none",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    fontSize: 14,
                    color: actif ? "var(--purple-11)" : "var(--green-11)",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--gray-a3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <Power size={16} />
                  {actif ? "Désactiver" : "Activer"}
                </button>

                <div
                  style={{
                    height: 1,
                    backgroundColor: "var(--gray-a6)",
                    margin: "4px 0",
                  }}
                />

                <button
                  onClick={() => {
                    onDelete(id);
                    setShowMenu(false);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "none",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    fontSize: 14,
                    color: "var(--red-11)",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--red-a3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <Trash2 size={16} />
                  Supprimer
                </button>
              </div>
            </> : null}
        </div>
      </div>

      {/* Nom et statut */}
      <div style={{ marginBottom: 8 }}>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--gray-12)",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {nom}
          {!actif && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                padding: "2px 6px",
                borderRadius: 4,
                backgroundColor: "var(--gray-a3)",
                color: "var(--gray-11)",
              }}
            >
              Inactif
            </span>
          )}
        </h3>
      </div>

      {/* Infos */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: 13,
          color: "var(--gray-11)",
        }}
      >
        <span>
          {_count.produits} produit{_count.produits > 1 ? "s" : ""}
        </span>
        {imprimante ? <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Printer size={14} />
            {imprimante.nom}
          </span> : null}
      </div>

      {/* Indicateur de couleur */}
      <div
        style={{
          marginTop: 12,
          height: 4,
          borderRadius: 2,
          backgroundColor: couleur,
        }}
      />
    </div>
  );
}
