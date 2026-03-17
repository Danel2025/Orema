"use client";

import { useState } from "react";
import { Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  STATUT_TABLE_LABELS,
  type StatutTableType,
  type FormeTableType,
} from "@/schemas/table.schema";

/**
 * Styles de couleur pour chaque statut
 */
const STATUS_STYLES: Record<StatutTableType, { bg: string; border: string; text: string; badgeBg: string }> = {
  LIBRE: { bg: "#dcfce7", border: "#22c55e", text: "#166534", badgeBg: "#bbf7d0" },
  OCCUPEE: { bg: "#fef9c3", border: "#eab308", text: "#854d0e", badgeBg: "#fef08a" },
  EN_PREPARATION: { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af", badgeBg: "#bfdbfe" },
  ADDITION: { bg: "#ffedd5", border: "#f97316", text: "#9a3412", badgeBg: "#fed7aa" },
  A_NETTOYER: { bg: "#fee2e2", border: "#ef4444", text: "#991b1b", badgeBg: "#fecaca" },
};

interface TableItemProps {
  id: string;
  numero: string;
  capacite: number;
  forme: FormeTableType;
  statut: StatutTableType;
  positionX: number;
  positionY: number;
  largeur: number;
  hauteur: number;
  rotation?: number;
  venteEnCours?: {
    id: string;
    totalFinal: number;
    _count: {
      lignes: number;
    };
  } | null;
  isSelected?: boolean;
  isEditMode?: boolean;
  isDragging?: boolean;
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onRotate?: (degrees: number) => void;
}

export function TableItem({
  id,
  numero,
  capacite,
  forme,
  statut,
  positionX,
  positionY,
  largeur,
  hauteur,
  rotation = 0,
  venteEnCours,
  isSelected = false,
  isEditMode = false,
  isDragging = false,
  onClick,
  onMouseDown,
  onRotate,
}: TableItemProps) {
  const statusLabel = STATUT_TABLE_LABELS[statut];
  const statusStyle = STATUS_STYLES[statut];
  const [isHovered, setIsHovered] = useState(false);

  // Styles de forme
  const getBorderRadius = () => {
    switch (forme) {
      case "RONDE":
        return "50%";
      case "CARREE":
      case "RECTANGULAIRE":
      default:
        return "8px";
    }
  };

  const formatPrice = (price: number | { toNumber: () => number }) => {
    const numPrice = typeof price === "number" ? price : price.toNumber();
    return new Intl.NumberFormat("fr-FR").format(numPrice);
  };

  return (
    <div
      data-table-id={id}
      onMouseDown={isEditMode ? onMouseDown : undefined}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "absolute select-none",
        isSelected && "ring-[3px] ring-offset-2 ring-[var(--accent-9)]"
      )}
      style={{
        left: positionX,
        top: positionY,
        width: largeur,
        height: hauteur,
        minWidth: 80,
        minHeight: 80,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        backgroundColor: statusStyle.bg,
        border: `2px solid ${statusStyle.border}`,
        borderRadius: getBorderRadius(),
        boxShadow: isDragging
          ? "0 8px 24px rgba(0,0,0,0.3)"
          : isSelected
          ? "0 4px 12px rgba(0,0,0,0.2)"
          : isHovered
          ? "0 6px 16px rgba(0,0,0,0.15)"
          : "0 1px 3px rgba(0,0,0,0.1)",
        transform: (() => {
          const parts: string[] = [];
          if (rotation !== 0) parts.push(`rotate(${rotation}deg)`);
          if (!isEditMode && isHovered && !isDragging) parts.push("scale(1.05)");
          if (isDragging) parts.push("scale(1.02)");
          return parts.length > 0 ? parts.join(" ") : undefined;
        })(),
        transformOrigin: "center center",
        transition: "box-shadow 0.15s, transform 0.15s, opacity 0.15s",
        cursor: isDragging
          ? "grabbing"
          : isEditMode
          ? isHovered ? "grab" : "default"
          : "pointer",
        opacity: isDragging ? 0.7 : 1,
      }}
    >
      {/* Numéro de table */}
      <span
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: statusStyle.text,
          lineHeight: 1,
        }}
      >
        {numero}
      </span>

      {/* Capacité */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          color: statusStyle.text,
          opacity: 0.75,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <span style={{ fontSize: 12, fontWeight: 500 }}>{capacite}</span>
      </div>

      {/* Badge statut (affiché si pas libre) */}
      {statut !== "LIBRE" && (
        <span
          style={{
            marginTop: 4,
            padding: "2px 8px",
            fontSize: 10,
            fontWeight: 600,
            color: statusStyle.text,
            backgroundColor: statusStyle.badgeBg,
            borderRadius: 4,
            textTransform: "capitalize",
          }}
        >
          {statusLabel}
        </span>
      )}

      {/* Montant de la vente en cours */}
      {venteEnCours ? <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginTop: 4,
            color: "#ea580c",
          }}
        >
          <Receipt size={12} />
          <span style={{ fontSize: 11, fontWeight: 600 }}>
            {formatPrice(venteEnCours.totalFinal)} F
          </span>
        </div> : null}

    </div>
  );
}
