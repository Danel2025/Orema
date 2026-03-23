"use client";

/**
 * FloorPlanToolbar - Barre d'outils pour dessiner le plan de salle
 */

import { useEffect, useCallback } from "react";
import { Tooltip } from "@radix-ui/themes";
import {
  Cursor,
  Square,
  Circle,
  Rectangle,
  Door,
  Armchair,
  ForkKnife,
  Wine,
  Trash,
  GridFour,
  MapPin,
  type Icon,
} from "@phosphor-icons/react";
import { GRID_SIZES, type GridSize } from "@/lib/floorplan/snap-to-grid";

export type ToolType =
  | "select"
  | "zone"
  | "table-square"
  | "table-round"
  | "table-rect"
  | "wall"
  | "wall-l"
  | "wall-t"
  | "wall-cross"
  | "shelf"
  | "door"
  | "counter"
  | "bar"
  | "decoration";

// Icone personnalisee pour le mur (plus intuitive que Minus)
function WallIcon({ size = 16, ...props }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="2" y="10" width="20" height="4" rx="0.5" />
    </svg>
  );
}

// Mur en L
function WallLIcon({ size = 16, ...props }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 4 L4 20 L20 20" strokeWidth="4" />
    </svg>
  );
}

// Mur en T
function WallTIcon({ size = 16, ...props }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 4 L20 4" strokeWidth="4" />
      <path d="M12 4 L12 20" strokeWidth="4" />
    </svg>
  );
}

// Mur en croix
function WallCrossIcon({ size = 16, ...props }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 12 L20 12" strokeWidth="4" />
      <path d="M12 4 L12 20" strokeWidth="4" />
    </svg>
  );
}

// Étagère
function ShelfIcon({ size = 16, ...props }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="6" width="18" height="3" rx="0.5" />
      <rect x="3" y="15" width="18" height="3" rx="0.5" />
      <line x1="6" y1="9" x2="6" y2="15" />
      <line x1="18" y1="9" x2="18" y2="15" />
    </svg>
  );
}

interface Tool {
  id: ToolType;
  label: string;
  description: string;
  shortcut: string;
  icon: Icon | typeof WallIcon;
  category: "selection" | "zones" | "tables" | "structure" | "decoration";
}

const tools: Tool[] = [
  {
    id: "select",
    label: "Selection",
    description: "Selectionner et deplacer les elements",
    shortcut: "V",
    icon: Cursor,
    category: "selection",
  },
  {
    id: "zone",
    label: "Zone/Salle",
    description: "Créer une zone (Terrasse, Salle, etc.)",
    shortcut: "Z",
    icon: MapPin,
    category: "zones",
  },
  {
    id: "table-square",
    label: "Table carree",
    description: "Ajouter une table carree",
    shortcut: "S",
    icon: Square,
    category: "tables",
  },
  {
    id: "table-round",
    label: "Table ronde",
    description: "Ajouter une table ronde",
    shortcut: "C",
    icon: Circle,
    category: "tables",
  },
  {
    id: "table-rect",
    label: "Table rect.",
    description: "Ajouter une table rectangulaire",
    shortcut: "R",
    icon: Rectangle,
    category: "tables",
  },
  {
    id: "wall",
    label: "Mur droit",
    description: "Tracer un mur ou une cloison",
    shortcut: "W",
    icon: WallIcon,
    category: "structure",
  },
  {
    id: "wall-l",
    label: "Mur en L",
    description: "Mur en forme de L (angle)",
    shortcut: "L",
    icon: WallLIcon,
    category: "structure",
  },
  {
    id: "wall-t",
    label: "Mur en T",
    description: "Mur en forme de T",
    shortcut: "T",
    icon: WallTIcon,
    category: "structure",
  },
  {
    id: "wall-cross",
    label: "Mur en +",
    description: "Mur en forme de croix",
    shortcut: "X",
    icon: WallCrossIcon,
    category: "structure",
  },
  {
    id: "shelf",
    label: "Etagere",
    description: "Ajouter une etagere",
    shortcut: "E",
    icon: ShelfIcon,
    category: "structure",
  },
  {
    id: "door",
    label: "Porte",
    description: "Ajouter une porte",
    shortcut: "D",
    icon: Door,
    category: "structure",
  },
  {
    id: "counter",
    label: "Comptoir",
    description: "Ajouter un comptoir de service",
    shortcut: "O",
    icon: ForkKnife,
    category: "structure",
  },
  {
    id: "bar",
    label: "Bar",
    description: "Ajouter un bar",
    shortcut: "B",
    icon: Wine,
    category: "structure",
  },
  {
    id: "decoration",
    label: "Decoration",
    description: "Ajouter un element decoratif",
    shortcut: "A",
    icon: Armchair,
    category: "decoration",
  },
];

interface FloorPlanToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  onDeleteSelected?: () => void;
  hasSelection?: boolean;
  isEditMode: boolean;
  // Snap-to-grid props
  snapEnabled?: boolean;
  onSnapToggle?: (enabled: boolean) => void;
  gridSize?: GridSize;
  onGridSizeChange?: (size: GridSize) => void;
}

export function FloorPlanToolbar({
  activeTool,
  onToolChange,
  onDeleteSelected,
  hasSelection,
  isEditMode,
  snapEnabled = true,
  onSnapToggle,
  gridSize = 20,
  onGridSizeChange,
}: FloorPlanToolbarProps) {
  // Touches qui sont aussi des raccourcis d'action quand un element est selectionne
  // R = rotation, L = verrouiller, F = focus, N = snap, G = grille
  const ACTION_KEYS_ON_SELECTION = new Set(["R", "L", "F", "N", "G"]);

  // Raccourcis clavier (selection d'outils uniquement - les actions sont gerees par useFloorPlanKeyboard)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignorer si on est dans un input ou si un modificateur est pressé
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toUpperCase();

      // Si un element est selectionne et que la touche est un raccourci d'action,
      // laisser useFloorPlanKeyboard gerer (rotation, lock, focus, etc.)
      if (hasSelection && ACTION_KEYS_ON_SELECTION.has(key)) return;

      const tool = tools.find((t) => t.shortcut === key);
      if (tool) {
        e.preventDefault();
        onToolChange(tool.id);
      }
    },
    [onToolChange, hasSelection]
  );

  useEffect(() => {
    if (!isEditMode) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditMode, handleKeyDown]);

  if (!isEditMode) return null;

  const categories = [
    { id: "selection", label: "Selection" },
    { id: "zones", label: "Zones" },
    { id: "tables", label: "Tables" },
    { id: "structure", label: "Structure" },
    { id: "decoration", label: "Decor" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 8,
        backgroundColor: "var(--color-panel-solid)",
        borderRadius: 12,
        border: "1px solid var(--gray-a5)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      {categories.map((category) => {
        const categoryTools = tools.filter((t) => t.category === category.id);
        if (categoryTools.length === 0) return null;

        return (
          <div key={category.id}>
            <span
              style={{
                display: "block",
                fontSize: 10,
                fontWeight: 600,
                color: "var(--gray-9)",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 4,
                paddingLeft: 4,
              }}
            >
              {category.label}
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {categoryTools.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeTool === tool.id;

                return (
                  <Tooltip
                    key={tool.id}
                    content={
                      <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            justifyContent: "space-between",
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>{tool.label}</span>
                          <kbd
                            style={{
                              padding: "2px 6px",
                              fontSize: 10,
                              fontWeight: 600,
                              fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                              backgroundColor: "var(--gray-a5)",
                              borderRadius: 4,
                              border: "1px solid var(--gray-a6)",
                            }}
                          >
                            {tool.shortcut}
                          </kbd>
                        </span>
                        <span style={{ fontSize: 12, opacity: 0.8 }}>{tool.description}</span>
                      </span>
                    }
                    side="right"
                    sideOffset={8}
                    delayDuration={300}
                  >
                    <button
                      onClick={() => onToolChange(tool.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "none",
                        backgroundColor: isActive ? "var(--accent-9)" : "transparent",
                        color: isActive ? "white" : "var(--gray-11)",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 400,
                        transition: "all 0.15s",
                        width: "100%",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = "var(--gray-a4)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      <Icon size={16} />
                      {tool.label}
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Séparateur */}
      <div
        style={{
          height: 1,
          backgroundColor: "var(--gray-a5)",
          margin: "4px 0",
        }}
      />

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Tooltip
          content={
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontWeight: 600 }}>Supprimer</span>
                <kbd
                  style={{
                    padding: "2px 6px",
                    fontSize: 10,
                    fontWeight: 600,
                    fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                    backgroundColor: "var(--gray-a5)",
                    borderRadius: 4,
                    border: "1px solid var(--gray-a6)",
                  }}
                >
                  Suppr
                </kbd>
              </span>
              <span style={{ fontSize: 12, opacity: 0.8 }}>Supprimer l'element selectionne</span>
            </span>
          }
          side="right"
          sideOffset={8}
          delayDuration={300}
        >
          <button
            onClick={onDeleteSelected}
            disabled={!hasSelection}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: 8,
              border: "none",
              backgroundColor: "transparent",
              color: hasSelection ? "var(--red-9)" : "var(--gray-8)",
              cursor: hasSelection ? "pointer" : "not-allowed",
              fontSize: 13,
              fontWeight: 400,
              transition: "all 0.15s",
              width: "100%",
              textAlign: "left",
              opacity: hasSelection ? 1 : 0.5,
            }}
            onMouseEnter={(e) => {
              if (hasSelection) {
                e.currentTarget.style.backgroundColor = "var(--red-a3)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <Trash size={16} />
            Supprimer
          </button>
        </Tooltip>
      </div>

      {/* Séparateur */}
      <div
        style={{
          height: 1,
          backgroundColor: "var(--gray-a5)",
          margin: "4px 0",
        }}
      />

      {/* Grille magnétique */}
      <div>
        <span
          style={{
            display: "block",
            fontSize: 10,
            fontWeight: 600,
            color: "var(--gray-9)",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 4,
            paddingLeft: 4,
          }}
        >
          Grille
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {/* Toggle snap */}
          <Tooltip
            content={
              <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontWeight: 600 }}>Grille magnetique</span>
                  <kbd
                    style={{
                      padding: "2px 6px",
                      fontSize: 10,
                      fontWeight: 600,
                      fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                      backgroundColor: "var(--gray-a5)",
                      borderRadius: 4,
                      border: "1px solid var(--gray-a6)",
                    }}
                  >
                    G
                  </kbd>
                </span>
                <span style={{ fontSize: 12, opacity: 0.8 }}>
                  {snapEnabled
                    ? "Desactiver l'alignement automatique"
                    : "Activer l'alignement automatique sur la grille"}
                </span>
              </span>
            }
            side="right"
            sideOffset={8}
            delayDuration={300}
          >
            <button
              onClick={() => onSnapToggle?.(!snapEnabled)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 8,
                border: "none",
                backgroundColor: snapEnabled ? "var(--accent-a3)" : "transparent",
                color: snapEnabled ? "var(--accent-11)" : "var(--gray-11)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: snapEnabled ? 600 : 400,
                transition: "all 0.15s",
                width: "100%",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                if (!snapEnabled) {
                  e.currentTarget.style.backgroundColor = "var(--gray-a4)";
                }
              }}
              onMouseLeave={(e) => {
                if (!snapEnabled) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <GridFour size={16} />
              Magnetique
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "2px 6px",
                  borderRadius: 4,
                  backgroundColor: snapEnabled ? "var(--accent-9)" : "var(--gray-a4)",
                  color: snapEnabled ? "white" : "var(--gray-9)",
                }}
              >
                {snapEnabled ? "ON" : "OFF"}
              </span>
            </button>
          </Tooltip>

          {/* Grid size selector */}
          <div
            style={{
              display: "flex",
              gap: 4,
              padding: "4px",
              backgroundColor: "var(--gray-a3)",
              borderRadius: 6,
            }}
          >
            {GRID_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => onGridSizeChange?.(size)}
                disabled={!snapEnabled}
                title={`Taille de grille: ${size}px`}
                style={{
                  flex: 1,
                  padding: "6px 0",
                  borderRadius: 4,
                  border: "none",
                  backgroundColor:
                    gridSize === size && snapEnabled ? "var(--accent-9)" : "transparent",
                  color:
                    gridSize === size && snapEnabled
                      ? "white"
                      : snapEnabled
                        ? "var(--gray-11)"
                        : "var(--gray-8)",
                  cursor: snapEnabled ? "pointer" : "not-allowed",
                  fontSize: 11,
                  fontWeight: gridSize === size ? 600 : 400,
                  transition: "all 0.15s",
                  opacity: snapEnabled ? 1 : 0.5,
                }}
              >
                {size}px
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Séparateur */}
      <div
        style={{
          height: 1,
          backgroundColor: "var(--gray-a5)",
          margin: "4px 0",
        }}
      />

      {/* Raccourcis rapides */}
      <div>
        <span
          style={{
            display: "block",
            fontSize: 10,
            fontWeight: 600,
            color: "var(--gray-9)",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 6,
            paddingLeft: 4,
          }}
        >
          Raccourcis
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingLeft: 4 }}>
          {[
            { keys: "Alt+Clic", desc: "Dupliquer" },
            { keys: "Ctrl+D", desc: "Dupliquer" },
            { keys: "Ctrl+C/V", desc: "Copier/Coller" },
            { keys: "R / ⇧R", desc: "Rotation ±90°" },
            { keys: "[ / ]", desc: "Reduire/Agrandir" },
            { keys: "F", desc: "Centrer la vue" },
            { keys: "N", desc: "Snap magnetique" },
            { keys: "Ctrl+Z/Y", desc: "Annuler/Refaire" },
            { keys: "Ctrl+±", desc: "Zoom" },
            { keys: "Ctrl+0", desc: "Reset vue" },
            { keys: "Espace", desc: "Deplacer le plan" },
          ].map((shortcut) => (
            <div
              key={shortcut.keys}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 6,
                fontSize: 10,
                color: "var(--gray-10)",
                lineHeight: 1.4,
              }}
            >
              <kbd
                style={{
                  padding: "1px 4px",
                  fontSize: 9,
                  fontWeight: 600,
                  fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                  backgroundColor: "var(--gray-a4)",
                  borderRadius: 3,
                  border: "1px solid var(--gray-a5)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {shortcut.keys}
              </kbd>
              <span style={{ opacity: 0.8 }}>{shortcut.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
