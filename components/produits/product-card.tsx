"use client";

/**
 * ProductCard - Carte affichant un produit
 */

import { useState, useRef, useEffect } from "react";
import {
  MoreVertical,
  Edit2,
  Trash2,
  Power,
  Package,
  AlertTriangle,
  ListPlus,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  nom: string;
  description?: string | null;
  prixVente: number | { toNumber(): number };
  tauxTva: string;
  actif: boolean;
  gererStock: boolean;
  stockActuel?: number | null;
  stockMin?: number | null;
  image?: string | null;
  categorie: {
    id: string;
    nom: string;
    couleur: string;
    icone?: string | null;
  };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActif: (id: string) => void;
  onManageSupplements?: (id: string, nom: string) => void;
}

export function ProductCard({
  id,
  nom,
  description,
  prixVente,
  tauxTva,
  actif,
  gererStock,
  stockActuel,
  stockMin,
  image,
  categorie,
  onEdit,
  onDelete,
  onToggleActif,
  onManageSupplements,
}: ProductCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calculer la position du menu quand il s'ouvre
  useEffect(() => {
    if (showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.right - 140, // 140 = largeur du menu
      });
    }
  }, [showMenu]);

  // Convertir le prix en nombre
  const prix = typeof prixVente === "number" ? prixVente : Number(prixVente);

  // Vérifier si le stock est bas
  const stockBas = gererStock && stockActuel != null && stockMin != null && stockActuel <= stockMin;

  // Mapping TVA pour affichage
  const tvaLabel = tauxTva === "STANDARD" ? "18%" : tauxTva === "REDUIT" ? "10%" : "0%";

  return (
    <div
      style={{
        backgroundColor: "var(--color-panel-solid)",
        borderRadius: 12,
        border: "1px solid var(--gray-a6)",
        overflow: "hidden",
        opacity: actif ? 1 : 0.6,
        transition: "all 0.15s ease",
      }}
    >
      {/* Image ou placeholder */}
      <div
        style={{
          height: 120,
          backgroundColor: categorie.couleur + "15",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {image ? (
          <img
            src={image}
            alt={nom}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <Package size={40} style={{ color: categorie.couleur, opacity: 0.5 }} />
        )}

        {/* Badge catégorie */}
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            padding: "4px 8px",
            borderRadius: 6,
            backgroundColor: categorie.couleur,
            color: "white",
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {categorie.nom}
        </div>

        {/* Badge stock bas */}
        {stockBas ? <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              padding: "4px 8px",
              borderRadius: 6,
              backgroundColor: "var(--red-9)",
              color: "white",
              fontSize: 11,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <AlertTriangle size={12} />
            Stock bas
          </div> : null}

        {/* Badge inactif */}
        {!actif && (
          <div
            style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              padding: "4px 8px",
              borderRadius: 6,
              backgroundColor: "var(--gray-a9)",
              color: "white",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Inactif
          </div>
        )}
      </div>

      {/* Contenu */}
      <div style={{ padding: 12 }}>
        {/* Header avec nom et menu */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 8,
          }}
        >
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--gray-12)",
              margin: 0,
              flex: 1,
              lineHeight: 1.3,
            }}
          >
            {nom}
          </h3>

          {/* Menu d'actions */}
          <div>
            <button
              ref={buttonRef}
              onClick={() => setShowMenu(!showMenu)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--gray-11)",
              }}
            >
              <MoreVertical size={16} />
            </button>

            {showMenu ? <>
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 40,
                  }}
                  onClick={() => setShowMenu(false)}
                />
                <div
                  style={{
                    position: "fixed",
                    top: menuPosition.top,
                    left: menuPosition.left,
                    backgroundColor: "var(--color-panel-solid)",
                    borderRadius: 8,
                    border: "1px solid var(--gray-a6)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    padding: 4,
                    minWidth: 140,
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
                      fontSize: 13,
                      color: "var(--gray-12)",
                      textAlign: "left",
                    }}
                  >
                    <Edit2 size={14} />
                    Modifier
                  </button>

                  {onManageSupplements ? <button
                      onClick={() => {
                        onManageSupplements(id, nom);
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
                        fontSize: 13,
                        color: "var(--gray-12)",
                        textAlign: "left",
                      }}
                    >
                      <ListPlus size={14} />
                      Suppléments
                    </button> : null}

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
                      fontSize: 13,
                      color: actif ? "var(--purple-11)" : "var(--green-11)",
                      textAlign: "left",
                    }}
                  >
                    <Power size={14} />
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
                      fontSize: 13,
                      color: "var(--red-11)",
                      textAlign: "left",
                    }}
                  >
                    <Trash2 size={14} />
                    Supprimer
                  </button>
                </div>
              </> : null}
          </div>
        </div>

        {/* Description */}
        {description ? <p
            style={{
              fontSize: 12,
              color: "var(--gray-10)",
              margin: "0 0 8px 0",
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {description}
          </p> : null}

        {/* Prix et infos */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--accent-11)",
                fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
              }}
            >
              {formatCurrency(prix)}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--gray-10)",
              }}
            >
              TVA {tvaLabel}
            </div>
          </div>

          {/* Stock */}
          {gererStock ? <div
              style={{
                textAlign: "right",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: stockBas ? "var(--red-11)" : "var(--gray-12)",
                  fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                }}
              >
                {stockActuel ?? 0}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--gray-10)",
                }}
              >
                en stock
              </div>
            </div> : null}
        </div>
      </div>
    </div>
  );
}
