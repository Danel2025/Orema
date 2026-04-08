"use client";

/**
 * FloorPlanSelector - Vue simplifiée du plan de salle pour sélectionner une table
 * Mode lecture seule, pas d'édition
 */

import { useState, useRef, useCallback, useEffect, useTransition } from "react";
import {
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  Users,
  X,
  Check,
  ArrowCounterClockwise,
  ArrowsOutCardinal,
  ForkKnife,
  MapPin,
} from "@phosphor-icons/react";
import type { DecorElementData } from "@/components/salle/DecorElement";
import { useAuth } from "@/lib/auth/context";
import { type ZoneData, loadZones } from "@/components/salle/ZoneElement";
import { updateTableStatut } from "@/actions/tables";
import { toast } from "sonner";

// Couleurs de statut
const STATUS_STYLES: Record<string, { bg: string; border: string; text: string; label: string }> = {
  LIBRE: { bg: "#dcfce7", border: "#22c55e", text: "#166534", label: "Libre" },
  OCCUPEE: { bg: "#fef9c3", border: "#eab308", text: "#854d0e", label: "Occupée" },
  EN_PREPARATION: { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af", label: "En préparation" },
  ADDITION: { bg: "#ffedd5", border: "#f97316", text: "#9a3412", label: "Addition" },
  A_NETTOYER: { bg: "#fee2e2", border: "#ef4444", text: "#991b1b", label: "À nettoyer" },
};

// Styles pour les éléments de décor
const DECOR_STYLES: Record<string, { bg: string; border: string }> = {
  wall: { bg: "#374151", border: "#1f2937" },
  "wall-l": { bg: "#374151", border: "#1f2937" },
  "wall-t": { bg: "#374151", border: "#1f2937" },
  "wall-cross": { bg: "#374151", border: "#1f2937" },
  shelf: { bg: "#fef3c7", border: "#92400e" },
  door: { bg: "#fef3c7", border: "#d97706" },
  counter: { bg: "#dbeafe", border: "#3b82f6" },
  bar: { bg: "#fae8ff", border: "#c026d3" },
  decoration: { bg: "#f0fdf4", border: "#22c55e" },
};

interface ZoneInfo {
  id: string;
  nom: string;
}

interface TableData {
  id: string;
  numero: string;
  capacite: number;
  forme: string;
  statut: string;
  positionX: number | null;
  positionY: number | null;
  largeur: number | null;
  hauteur: number | null;
  zoneId: string | null;
  zone: ZoneInfo | null;
  ventes?: Array<{
    id: string;
    numeroTicket: string;
    totalFinal: number | unknown;
    createdAt: Date | string;
    _count: { lignes: number };
  }>;
}

interface FloorPlanSelectorProps {
  tables: TableData[];
  selectedTableId?: string;
  onSelect: (table: TableData, couverts?: number) => void;
  onClose: () => void;
  /** Si true, seules les tables libres sont sélectionnables */
  onlyFreeTables?: boolean;
}

// Charger les éléments de décor depuis le localStorage (scopé par établissement)
function loadDecorElements(etablissementId: string): DecorElementData[] {
  if (typeof window === "undefined" || !etablissementId) return [];
  try {
    const saved = localStorage.getItem(`floorplan-decor-${etablissementId}`);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

export function FloorPlanSelector({
  tables,
  selectedTableId,
  onSelect,
  onClose,
  onlyFreeTables = true,
}: FloorPlanSelectorProps) {
  const { user } = useAuth();
  const [zoom, setZoom] = useState(0.8);
  const [hoveredTableId, setHoveredTableId] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 20, y: 20 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Charger les éléments de décor et zones (lazy init, scopé par établissement)
  const etablissementId = user?.etablissementId ?? "";
  const [decorElements] = useState<DecorElementData[]>(() => loadDecorElements(etablissementId));
  const [zoneElements] = useState<ZoneData[]>(() => loadZones());

  // Filtrer par zone - collecter les zones uniques
  const zonesMap = new Map<string, ZoneInfo>();
  tables.forEach((t) => {
    if (t.zone) {
      zonesMap.set(t.zone.id, t.zone);
    }
  });
  const zones = Array.from(zonesMap.values());
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  // Table sélectionnée et nombre de couverts
  const [pendingTable, setPendingTable] = useState<TableData | null>(null);
  const [couverts, setCouverts] = useState<string>("");

  // Menu contextuel pour changer le statut
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    table: TableData | null;
  }>({ visible: false, x: 0, y: 0, table: null });
  const [isPending, startTransition] = useTransition();

  const filteredTables = selectedZoneId
    ? tables.filter((t) => t.zoneId === selectedZoneId)
    : tables;

  // Statistiques
  const stats = {
    total: filteredTables.length,
    libres: filteredTables.filter((t) => t.statut === "LIBRE").length,
    occupees: filteredTables.filter((t) => t.statut !== "LIBRE").length,
  };

  // Zoom
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 1.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.4));
  const handleResetZoom = () => {
    setZoom(0.8);
    setPan({ x: 20, y: 20 });
  };

  // Pan handlers - clic gauche sur le canvas pour déplacer
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Vérifier qu'on ne clique pas sur une table
      const target = e.target as HTMLElement;
      if (target.closest("[data-table-item]") || target.closest("[data-decor-item]")) {
        return;
      }

      // Clic gauche ou molette pour pan
      if (e.button === 0 || e.button === 1) {
        e.preventDefault();
        setIsPanning(true);
        panStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          panX: pan.x,
          panY: pan.y,
        };
      }
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      const deltaX = e.clientX - panStartRef.current.x;
      const deltaY = e.clientY - panStartRef.current.y;
      setPan({
        x: panStartRef.current.panX + deltaX,
        y: panStartRef.current.panY + deltaY,
      });
    },
    [isPanning]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom((z) => Math.max(0.4, Math.min(1.5, z + delta)));
  }, []);

  // Table is selectable?
  const isTableSelectable = (table: TableData) => {
    if (!onlyFreeTables) return true;
    return table.statut === "LIBRE";
  };

  // Gérer la sélection de table
  const handleTableClick = (table: TableData) => {
    if (!isTableSelectable(table)) return;
    setPendingTable(table);
    setCouverts(table.capacite.toString());
  };

  // Confirmer la sélection
  const handleConfirmSelection = () => {
    if (!pendingTable) return;
    const couvertsNum = parseInt(couverts, 10);
    onSelect(pendingTable, couvertsNum > 0 ? couvertsNum : undefined);
  };

  // Annuler la sélection
  const handleCancelSelection = () => {
    setPendingTable(null);
    setCouverts("");
  };

  // Ouvrir le menu contextuel (clic droit)
  const handleContextMenu = useCallback((e: React.MouseEvent, table: TableData) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      table,
    });
  }, []);

  // Fermer le menu contextuel
  const closeContextMenu = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0, table: null });
  }, []);

  // Changer le statut d'une table
  const handleChangeStatus = useCallback(
    (newStatus: string) => {
      if (!contextMenu.table) return;

      startTransition(async () => {
        const result = await updateTableStatut({
          id: contextMenu.table!.id,
          statut: newStatus as "LIBRE" | "OCCUPEE" | "EN_PREPARATION" | "ADDITION" | "A_NETTOYER",
        });

        if (result.success) {
          toast.success(
            `Table ${contextMenu.table!.numero} → ${STATUS_STYLES[newStatus]?.label || newStatus}`
          );
          // Mettre à jour localement (le parent devrait recharger)
          closeContextMenu();
        } else {
          toast.error(result.error || "Erreur lors du changement de statut");
        }
      });
    },
    [contextMenu.table, closeContextMenu]
  );

  // Fermer le menu contextuel quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = () => closeContextMenu();
    if (contextMenu.visible) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [contextMenu.visible, closeContextMenu]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--color-panel-solid)",
          borderRadius: 16,
          width: "95%",
          maxWidth: 1000,
          height: "90vh",
          maxHeight: 750,
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
            padding: "16px 20px",
            borderBottom: "1px solid var(--gray-a6)",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "var(--gray-12)",
                margin: 0,
              }}
            >
              Sélectionner une table
            </h2>
            <p style={{ fontSize: 13, color: "var(--gray-10)", margin: "4px 0 0" }}>
              <ArrowsOutCardinal size={12} style={{ display: "inline", marginRight: 4 }} />
              Glissez pour naviguer • Cliquez sur une table libre
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
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
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px",
            borderBottom: "1px solid var(--gray-a6)",
            backgroundColor: "var(--gray-a2)",
          }}
        >
          {/* Zones filter */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: "var(--gray-11)" }}>Zone:</span>
            <button
              onClick={() => setSelectedZoneId(null)}
              style={{
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 500,
                borderRadius: 6,
                border:
                  selectedZoneId === null
                    ? "2px solid var(--accent-9)"
                    : "1px solid var(--gray-a6)",
                backgroundColor: selectedZoneId === null ? "var(--accent-a3)" : "transparent",
                color: selectedZoneId === null ? "var(--accent-11)" : "var(--gray-12)",
                cursor: "pointer",
              }}
            >
              Toutes
            </button>
            {zones.map((zone) => (
              <button
                key={zone.id}
                onClick={() => setSelectedZoneId(zone.id)}
                style={{
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 500,
                  borderRadius: 6,
                  border:
                    selectedZoneId === zone.id
                      ? "2px solid var(--accent-9)"
                      : "1px solid var(--gray-a6)",
                  backgroundColor: selectedZoneId === zone.id ? "var(--accent-a3)" : "transparent",
                  color: selectedZoneId === zone.id ? "var(--accent-11)" : "var(--gray-12)",
                  cursor: "pointer",
                }}
              >
                {zone.nom}
              </button>
            ))}
          </div>

          {/* Stats + Zoom */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Stats */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12 }}>
              <span style={{ color: "var(--green-11)" }}>
                {stats.libres} libre{stats.libres > 1 ? "s" : ""}
              </span>
              <span style={{ color: "var(--gray-9)" }}>|</span>
              <span style={{ color: "var(--gray-10)" }}>
                {stats.occupees} occupée{stats.occupees > 1 ? "s" : ""}
              </span>
            </div>

            {/* Zoom controls */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 0,
                backgroundColor: "var(--gray-a3)",
                borderRadius: 8,
                padding: 4,
              }}
            >
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 0.4}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: "none",
                  backgroundColor: "transparent",
                  cursor: zoom <= 0.4 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: zoom <= 0.4 ? "var(--gray-8)" : "var(--gray-11)",
                }}
              >
                <MagnifyingGlassMinus size={14} />
              </button>
              <span
                style={{
                  minWidth: 44,
                  textAlign: "center",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--gray-12)",
                }}
              >
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 1.5}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: "none",
                  backgroundColor: "transparent",
                  cursor: zoom >= 1.5 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: zoom >= 1.5 ? "var(--gray-8)" : "var(--gray-11)",
                }}
              >
                <MagnifyingGlassPlus size={14} />
              </button>
              <button
                onClick={handleResetZoom}
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
                  marginLeft: 4,
                }}
                title="Réinitialiser la vue"
              >
                <ArrowCounterClockwise size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Floor plan canvas */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            backgroundColor: "var(--gray-2)",
            cursor: isPanning ? "grabbing" : "grab",
          }}
        >
          {/* Grid background */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(to right, var(--gray-a3) 1px, transparent 1px), linear-gradient(to bottom, var(--gray-a3) 1px, transparent 1px)",
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              opacity: 0.5,
            }}
          />

          {/* Transformed container */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "top left",
            }}
          >
            {/* Zones (rendered first, behind everything) */}
            {zoneElements.map((zone) => {
              // Convertir hex en rgba
              const hexToRgba = (hex: string, alpha: number) => {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
              };

              return (
                <div
                  key={zone.id}
                  style={{
                    position: "absolute",
                    left: zone.x,
                    top: zone.y,
                    width: zone.width,
                    height: zone.height,
                    backgroundColor: hexToRgba(zone.couleur, 0.08),
                    border: `2px dashed ${hexToRgba(zone.couleur, 0.4)}`,
                    borderRadius: 8,
                    pointerEvents: "none",
                    zIndex: 0,
                  }}
                >
                  {/* Zone label */}
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "3px 8px",
                      backgroundColor: hexToRgba(zone.couleur, 0.85),
                      color: "white",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    <MapPin size={10} />
                    {zone.nom}
                  </div>
                </div>
              );
            })}

            {/* Decor Elements */}
            {decorElements.map((element) => {
              const style = DECOR_STYLES[element.type] || DECOR_STYLES.wall;
              const isWallType = element.type.startsWith("wall");
              const isShelf = element.type === "shelf";

              return (
                <div
                  key={element.id}
                  data-decor-item
                  style={{
                    position: "absolute",
                    left: element.x,
                    top: element.y,
                    width: element.width,
                    height: element.height,
                    backgroundColor: style.bg,
                    border: `2px solid ${style.border}`,
                    borderRadius: isWallType || isShelf ? 2 : 8,
                    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                    opacity: 0.9,
                  }}
                >
                  {/* Rendu spécial pour les formes de murs */}
                  {element.type === "wall-l" && (
                    <svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 100 100"
                      style={{ position: "absolute", inset: 0 }}
                    >
                      <path
                        d="M10 10 L10 90 L90 90"
                        stroke={style.border}
                        strokeWidth="12"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  {element.type === "wall-t" && (
                    <svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 100 100"
                      style={{ position: "absolute", inset: 0 }}
                    >
                      <path
                        d="M10 10 L90 10"
                        stroke={style.border}
                        strokeWidth="12"
                        fill="none"
                        strokeLinecap="round"
                      />
                      <path
                        d="M50 10 L50 90"
                        stroke={style.border}
                        strokeWidth="12"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                  {element.type === "wall-cross" && (
                    <svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 100 100"
                      style={{ position: "absolute", inset: 0 }}
                    >
                      <path
                        d="M10 50 L90 50"
                        stroke={style.border}
                        strokeWidth="12"
                        fill="none"
                        strokeLinecap="round"
                      />
                      <path
                        d="M50 10 L50 90"
                        stroke={style.border}
                        strokeWidth="12"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                  {element.type === "shelf" && (
                    <svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 100 20"
                      preserveAspectRatio="none"
                      style={{ position: "absolute", inset: 0 }}
                    >
                      <rect x="0" y="2" width="100" height="6" fill={style.border} rx="1" />
                      <rect x="0" y="12" width="100" height="6" fill={style.border} rx="1" />
                    </svg>
                  )}
                  {element.label && !isWallType && !isShelf && element.width > 60 ? (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: style.border,
                        textAlign: "center",
                      }}
                    >
                      {element.label}
                    </span>
                  ) : null}
                </div>
              );
            })}

            {/* Tables */}
            {filteredTables.map((table) => {
              const statusStyle = STATUS_STYLES[table.statut] || STATUS_STYLES.LIBRE;
              const posX = table.positionX ?? 50;
              const posY = table.positionY ?? 50;
              const width = table.largeur ?? 80;
              const height = table.hauteur ?? 80;
              const selectable = isTableSelectable(table);
              const isSelected = selectedTableId === table.id || pendingTable?.id === table.id;
              const isHovered = hoveredTableId === table.id;

              const getBorderRadius = () => {
                switch (table.forme) {
                  case "RONDE":
                    return "50%";
                  default:
                    return 8;
                }
              };

              return (
                <div
                  key={table.id}
                  data-table-item
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTableClick(table);
                  }}
                  onContextMenu={(e) => handleContextMenu(e, table)}
                  onMouseEnter={() => setHoveredTableId(table.id)}
                  onMouseLeave={() => setHoveredTableId(null)}
                  style={{
                    position: "absolute",
                    left: posX,
                    top: posY,
                    width,
                    height,
                    minWidth: 80,
                    minHeight: 80,
                    padding: 10,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    backgroundColor: selectable ? statusStyle.bg : "var(--gray-a4)",
                    border: isSelected
                      ? "3px solid var(--accent-9)"
                      : `2px solid ${selectable ? statusStyle.border : "var(--gray-a6)"}`,
                    borderRadius: getBorderRadius(),
                    boxShadow: isSelected
                      ? "0 0 0 3px var(--accent-a5), 0 4px 12px rgba(0,0,0,0.2)"
                      : isHovered && selectable
                        ? "0 4px 12px rgba(0,0,0,0.15)"
                        : "0 1px 3px rgba(0,0,0,0.1)",
                    cursor: selectable ? "pointer" : "not-allowed",
                    opacity: selectable ? 1 : 0.5,
                    transform: isHovered && selectable ? "scale(1.05)" : undefined,
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                >
                  {/* Selected checkmark */}
                  {isSelected ? (
                    <div
                      style={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        backgroundColor: "var(--accent-9)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                      }}
                    >
                      <Check size={14} />
                    </div>
                  ) : null}

                  {/* Table number */}
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: selectable ? statusStyle.text : "var(--gray-9)",
                      lineHeight: 1,
                    }}
                  >
                    {table.numero}
                  </span>

                  {/* Capacity */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      color: selectable ? statusStyle.text : "var(--gray-9)",
                      opacity: 0.75,
                    }}
                  >
                    <Users size={12} />
                    <span style={{ fontSize: 11, fontWeight: 500 }}>{table.capacite}</span>
                  </div>

                  {/* Status badge */}
                  {table.statut !== "LIBRE" && (
                    <span
                      style={{
                        marginTop: 2,
                        padding: "2px 6px",
                        fontSize: 9,
                        fontWeight: 600,
                        color: selectable ? statusStyle.text : "var(--gray-9)",
                        backgroundColor: selectable ? statusStyle.bg : "var(--gray-a3)",
                        border: `1px solid ${selectable ? statusStyle.border : "var(--gray-a6)"}`,
                        borderRadius: 4,
                      }}
                    >
                      {statusStyle.label}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Empty state */}
            {filteredTables.length === 0 && decorElements.length === 0 && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--gray-9)",
                  fontSize: 14,
                }}
              >
                Aucune table dans cette zone
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            padding: "12px 20px",
            borderTop: "1px solid var(--gray-a6)",
            backgroundColor: "var(--gray-a2)",
          }}
        >
          {Object.entries(STATUS_STYLES).map(([key, style]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  backgroundColor: style.bg,
                  border: `2px solid ${style.border}`,
                }}
              />
              <span style={{ fontSize: 11, color: "var(--gray-11)" }}>{style.label}</span>
            </div>
          ))}
        </div>

        {/* Menu contextuel pour changer le statut */}
        {contextMenu.visible && contextMenu.table ? (
          <div
            style={{
              position: "fixed",
              left: contextMenu.x,
              top: contextMenu.y,
              zIndex: 200,
              backgroundColor: "var(--color-panel-solid)",
              borderRadius: 8,
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              border: "1px solid var(--gray-a6)",
              padding: 8,
              minWidth: 160,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "8px 12px",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--gray-10)",
                borderBottom: "1px solid var(--gray-a4)",
                marginBottom: 4,
              }}
            >
              Table {contextMenu.table.numero} - Changer statut
            </div>
            {Object.entries(STATUS_STYLES).map(([key, style]) => (
              <button
                key={key}
                onClick={() => handleChangeStatus(key)}
                disabled={isPending || contextMenu.table?.statut === key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: 13,
                  fontWeight: 500,
                  border: "none",
                  borderRadius: 4,
                  backgroundColor:
                    contextMenu.table?.statut === key ? "var(--gray-a3)" : "transparent",
                  color: contextMenu.table?.statut === key ? "var(--gray-9)" : "var(--gray-12)",
                  cursor: contextMenu.table?.statut === key ? "default" : "pointer",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    backgroundColor: style.bg,
                    border: `2px solid ${style.border}`,
                  }}
                />
                {style.label}
                {contextMenu.table?.statut === key && (
                  <Check size={14} style={{ marginLeft: "auto", color: "var(--gray-9)" }} />
                )}
              </button>
            ))}
          </div>
        ) : null}

        {/* Panel de confirmation avec nombre de couverts */}
        {pendingTable ? (
          <div
            style={{
              padding: "16px 20px",
              borderTop: "1px solid var(--gray-a6)",
              backgroundColor: "var(--accent-a2)",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ForkKnife size={18} style={{ color: "var(--accent-11)" }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--gray-12)" }}>
                Table {pendingTable.numero}
              </span>
              {pendingTable.zone ? (
                <span style={{ fontSize: 12, color: "var(--gray-10)" }}>
                  ({pendingTable.zone.nom})
                </span>
              ) : null}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontSize: 13, color: "var(--gray-11)" }}>Nombre de couverts:</label>
              <input
                type="number"
                value={couverts}
                onChange={(e) => setCouverts(e.target.value)}
                min={1}
                max={pendingTable.capacite * 2}
                style={{
                  width: 70,
                  padding: "6px 10px",
                  fontSize: 14,
                  fontWeight: 600,
                  textAlign: "center",
                  borderRadius: 6,
                  border: "1px solid var(--gray-a6)",
                  backgroundColor: "var(--color-panel-solid)",
                  color: "var(--gray-12)",
                  outline: "none",
                }}
              />
              <span style={{ fontSize: 12, color: "var(--gray-10)" }}>
                (capacité: {pendingTable.capacite})
              </span>
            </div>

            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button
                onClick={handleCancelSelection}
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: 6,
                  border: "1px solid var(--gray-a6)",
                  backgroundColor: "transparent",
                  color: "var(--gray-12)",
                  cursor: "pointer",
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmSelection}
                style={{
                  padding: "8px 20px",
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: "none",
                  backgroundColor: "var(--accent-9)",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Check size={16} />
                Confirmer
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
