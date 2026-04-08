"use client";

/**
 * DecorElement - Éléments de décor pour le plan de salle
 * (murs, portes, comptoirs, bars, décorations)
 *
 * Système de rotation libre :
 * - Les murs droits : visual swap (width/height) aux angles ~90°/~270° (±5°), rotation CSS sinon
 * - Les formes L, T, + : rotation CSS sur le SVG interne
 * - Autres types : rotation CSS sur le conteneur
 */

import { useState } from "react";
import { Door, ForkKnife, Wine, Armchair, ArrowClockwise } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export type DecorType =
  | "wall"
  | "wall-l"
  | "wall-t"
  | "wall-cross"
  | "shelf"
  | "door"
  | "counter"
  | "bar"
  | "decoration";

export interface DecorElementData {
  id: string;
  type: DecorType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number; // Tout angle en degrés (rotation libre)
  label?: string;
}

/**
 * Vérifie si un angle est proche d'un angle cible (tolérance ±5°)
 */
export function isNearAngle(angle: number, target: number, tolerance = 5): boolean {
  const normalized = ((angle % 360) + 360) % 360;
  const diff = Math.abs(normalized - target);
  return diff <= tolerance || diff >= 360 - tolerance;
}

/**
 * Calcule les dimensions effectives en tenant compte de la rotation
 * Pour les murs droits et étagères :
 * - Angles proches de 90° ou 270° (±5°) : swap width/height (visual swap)
 * - Autres angles : dimensions originales, rotation CSS pure
 */
export function getEffectiveDimensions(element: DecorElementData): {
  width: number;
  height: number;
} {
  const rotation = element.rotation || 0;
  const isNearHorizontal = isNearAngle(rotation, 90) || isNearAngle(rotation, 270);

  // Les murs droits et étagères échangent leurs dimensions visuellement
  if ((element.type === "wall" || element.type === "shelf") && isNearHorizontal) {
    return { width: element.height, height: element.width };
  }

  return { width: element.width, height: element.height };
}

export interface ResizeHandle {
  position:
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";
  cursor: string;
}

const DECOR_STYLES: Record<DecorType, { bg: string; border: string; icon?: boolean }> = {
  wall: { bg: "#374151", border: "#1f2937", icon: false },
  "wall-l": { bg: "#374151", border: "#1f2937", icon: false },
  "wall-t": { bg: "#374151", border: "#1f2937", icon: false },
  "wall-cross": { bg: "#374151", border: "#1f2937", icon: false },
  shelf: { bg: "#fef3c7", border: "#92400e", icon: false },
  door: { bg: "#fef3c7", border: "#d97706", icon: true },
  counter: { bg: "#dbeafe", border: "#3b82f6", icon: true },
  bar: { bg: "#fae8ff", border: "#c026d3", icon: true },
  decoration: { bg: "#f0fdf4", border: "#22c55e", icon: true },
};

const DECOR_ICONS: Partial<Record<DecorType, typeof Door>> = {
  door: Door,
  counter: ForkKnife,
  bar: Wine,
  decoration: Armchair,
};

interface DecorElementProps {
  element: DecorElementData;
  isSelected?: boolean;
  isInMultiSelect?: boolean;
  isEditMode?: boolean;
  isDragging?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onResizeStart?: (handle: string, e: React.MouseEvent) => void;
  onRotate?: (degrees: number) => void;
}

const CORNER_POSITIONS = new Set(["top-left", "top-right", "bottom-left", "bottom-right"]);

const RESIZE_HANDLES: ResizeHandle[] = [
  { position: "top-left", cursor: "nwse-resize" },
  { position: "top-right", cursor: "nesw-resize" },
  { position: "bottom-left", cursor: "nesw-resize" },
  { position: "bottom-right", cursor: "nwse-resize" },
  { position: "top", cursor: "ns-resize" },
  { position: "bottom", cursor: "ns-resize" },
  { position: "left", cursor: "ew-resize" },
  { position: "right", cursor: "ew-resize" },
];

export function DecorElement({
  element,
  isSelected,
  isInMultiSelect,
  isEditMode,
  isDragging,
  onClick,
  onContextMenu,
  onMouseDown,
  onResizeStart,
  onRotate,
}: DecorElementProps) {
  const style = DECOR_STYLES[element.type];
  const isWallType = element.type.startsWith("wall");
  const isShelf = element.type === "shelf";
  const isStraightWall = element.type === "wall";
  const isShapedWall =
    element.type === "wall-l" || element.type === "wall-t" || element.type === "wall-cross";
  const Icon = !isWallType && !isShelf ? DECOR_ICONS[element.type] : null;
  const [isHovered, setIsHovered] = useState(false);
  const [activeResizeHandle, setActiveResizeHandle] = useState<string | null>(null);

  const rotation = element.rotation || 0;

  // Taille des poignees de resize (12px)
  const HANDLE_SIZE = 12;

  const getHandleStyle = (handle: ResizeHandle): React.CSSProperties => {
    const size = HANDLE_SIZE;
    const offset = -size / 2;
    const base: React.CSSProperties = {
      position: "absolute",
      width: size,
      height: size,
      backgroundColor: "var(--accent-9)",
      border: "2px solid white",
      borderRadius: 2,
      cursor: handle.cursor,
      zIndex: 10,
      transition: "transform 0.1s, box-shadow 0.1s",
    };

    // Ajout d'effets hover/active sur les poignees
    const handleInteraction: React.CSSProperties =
      activeResizeHandle === handle.position
        ? { transform: "scale(1.2)", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }
        : {};

    switch (handle.position) {
      case "top-left":
        return { ...base, ...handleInteraction, top: offset, left: offset };
      case "top-right":
        return { ...base, ...handleInteraction, top: offset, right: offset };
      case "bottom-left":
        return { ...base, ...handleInteraction, bottom: offset, left: offset };
      case "bottom-right":
        return { ...base, ...handleInteraction, bottom: offset, right: offset };
      case "top":
        return {
          ...base,
          ...handleInteraction,
          top: offset,
          left: "50%",
          transform: `translateX(-50%)${activeResizeHandle === handle.position ? " scale(1.2)" : ""}`,
        };
      case "bottom":
        return {
          ...base,
          ...handleInteraction,
          bottom: offset,
          left: "50%",
          transform: `translateX(-50%)${activeResizeHandle === handle.position ? " scale(1.2)" : ""}`,
        };
      case "left":
        return {
          ...base,
          ...handleInteraction,
          left: offset,
          top: "50%",
          transform: `translateY(-50%)${activeResizeHandle === handle.position ? " scale(1.2)" : ""}`,
        };
      case "right":
        return {
          ...base,
          ...handleInteraction,
          right: offset,
          top: "50%",
          transform: `translateY(-50%)${activeResizeHandle === handle.position ? " scale(1.2)" : ""}`,
        };
      default:
        return base;
    }
  };

  // Handler pour le debut du resize avec tooltip de dimensions
  const handleResizeMouseDown = (handle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveResizeHandle(handle);
    onResizeStart?.(handle, e);
  };

  // Pour les murs droits et étagères :
  // - Angles proches de 90°/270° (±5°) : swap width/height (visual swap classique)
  // - Autres angles non-nuls : rotation CSS pure sur le conteneur
  const isNearHorizontal = isNearAngle(rotation, 90) || isNearAngle(rotation, 270);
  const useVisualSwap = (isStraightWall || isShelf) && isNearHorizontal;
  const displayWidth = useVisualSwap ? element.height : element.width;
  const displayHeight = useVisualSwap ? element.width : element.height;

  // Les formes spéciales utilisent la rotation CSS sur le SVG interne
  const useRotationTransform = isShapedWall && rotation !== 0;

  // Rotation CSS sur le conteneur :
  // - Murs droits/étagères : tout angle sauf ~0° (inutile) et ~90°/~270° (géré par visual swap)
  // - Autres types (portes, comptoirs, bars, décorations) : tout angle non-nul
  const useCSSRotationForStraight =
    (isStraightWall || isShelf) && rotation !== 0 && !useVisualSwap && !isNearAngle(rotation, 0);
  const useContainerRotation =
    useCSSRotationForStraight || ((!isStraightWall && !isShelf && !isShapedWall) && rotation !== 0);

  return (
    <div
      data-decor-id={element.id}
      onMouseDown={(e) => {
        // Ne pas démarrer le drag si on clique sur une poignée de resize ou bouton
        if ((e.target as HTMLElement).closest("[data-resize-handle]")) return;
        if ((e.target as HTMLElement).closest("[data-action-btn]")) return;
        onMouseDown?.(e);
      }}
      onClick={onClick}
      onContextMenu={(e) => {
        if (isEditMode && onContextMenu) {
          e.preventDefault();
          onContextMenu(e);
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setActiveResizeHandle(null);
      }}
      className={cn(
        "absolute select-none",
        isSelected && "ring-[3px] ring-[var(--accent-9)] ring-offset-2",
        isInMultiSelect && !isSelected && "outline outline-2 outline-dashed outline-[var(--accent-9)] outline-offset-2",
        !isEditMode && !isWallType && "cursor-pointer"
      )}
      style={{
        left: element.x,
        top: element.y,
        width: displayWidth,
        height: displayHeight,
        backgroundColor: isShapedWall ? "transparent" : style.bg,
        border: isShapedWall ? "none" : `2px solid ${style.border}`,
        borderRadius: isWallType || isShelf ? 2 : 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        transform: (() => {
          const parts: string[] = [];
          if (useContainerRotation) parts.push(`rotate(${rotation}deg)`);
          if (isHovered && !isSelected && !isDragging) parts.push("scale(1.02)");
          return parts.length > 0 ? parts.join(" ") : undefined;
        })(),
        transformOrigin: "center center",
        boxShadow: isDragging
          ? "0 8px 24px rgba(0,0,0,0.3)"
          : isSelected
            ? "0 4px 12px rgba(0,0,0,0.25)"
            : isHovered && isEditMode
              ? "0 6px 16px rgba(0,0,0,0.2)"
              : isShapedWall
                ? "none"
                : "0 1px 3px rgba(0,0,0,0.15)",
        transition: "box-shadow 0.15s, transform 0.15s",
        cursor: isDragging
          ? "grabbing"
          : isEditMode
            ? isHovered
              ? "grab"
              : "default"
            : !isWallType
              ? "pointer"
              : "default",
        opacity: isDragging ? 0.7 : 1,
      }}
    >
      {/* Rendu spécial pour les formes de murs avec rotation */}
      {element.type === "wall-l" && (
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          style={{
            position: "absolute",
            inset: 0,
            transform: useRotationTransform ? `rotate(${rotation}deg)` : undefined,
            transformOrigin: "center center",
          }}
        >
          <path
            d="M15 15 L15 85 L85 85"
            stroke={style.border}
            strokeWidth="10"
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
          style={{
            position: "absolute",
            inset: 0,
            transform: useRotationTransform ? `rotate(${rotation}deg)` : undefined,
            transformOrigin: "center center",
          }}
        >
          <path
            d="M15 15 L85 15"
            stroke={style.border}
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M50 15 L50 85"
            stroke={style.border}
            strokeWidth="10"
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
          style={{
            position: "absolute",
            inset: 0,
            transform: useRotationTransform ? `rotate(${rotation}deg)` : undefined,
            transformOrigin: "center center",
          }}
        >
          <path
            d="M15 50 L85 50"
            stroke={style.border}
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M50 15 L50 85"
            stroke={style.border}
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      )}

      {/* Rendu pour le mur droit - pas de rotation CSS, on utilise le swap de dimensions */}
      {isStraightWall ? (
        <div
          style={{
            position: "absolute",
            inset: 2,
            backgroundColor: style.border,
            borderRadius: 2,
          }}
        />
      ) : null}

      {/* Rendu pour les étagères */}
      {element.type === "shelf" && (
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${displayWidth} ${displayHeight}`}
          preserveAspectRatio="none"
          style={{ position: "absolute", inset: 0 }}
        >
          <rect
            x="2"
            y="2"
            width={displayWidth - 4}
            height={Math.max(4, displayHeight * 0.3)}
            fill={style.border}
            rx="1"
          />
          <rect
            x="2"
            y={displayHeight - Math.max(6, displayHeight * 0.3) - 2}
            width={displayWidth - 4}
            height={Math.max(4, displayHeight * 0.3)}
            fill={style.border}
            rx="1"
          />
        </svg>
      )}
      {Icon ? (
        <Icon
          size={Math.min(element.width, element.height) * 0.35}
          style={{ color: style.border, opacity: 0.8 }}
        />
      ) : null}
      {element.label && !isWallType && !isShelf && element.width > 60 ? (
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: style.border,
            textAlign: "center",
            maxWidth: "90%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {element.label}
        </span>
      ) : null}

      {/* Resize handles (only when selected in edit mode) */}
      {isSelected && isEditMode ? (
        <>
          {RESIZE_HANDLES.map((handle) => {
            const isCorner = CORNER_POSITIONS.has(handle.position);
            const isCornerHovered = isCorner && activeResizeHandle === handle.position;
            return (
              <div
                key={handle.position}
                data-resize-handle="true"
                title={isCorner ? "Clic: rotation +90° | Glisser: redimensionner" : undefined}
                style={{
                  ...getHandleStyle(handle),
                  // Les coins ont une forme ronde pour indiquer la rotation
                  borderRadius: isCorner ? "50%" : 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseDown={(e) => handleResizeMouseDown(handle.position, e)}
                onMouseEnter={() => setActiveResizeHandle(handle.position)}
                onMouseLeave={() => {
                  if (!activeResizeHandle) return;
                }}
                onContextMenu={(e) => {
                  if (isCorner) {
                    e.preventDefault();
                    e.stopPropagation();
                    onRotate?.(-90);
                  }
                }}
              >
                {isCornerHovered ? <ArrowClockwise size={7} color="white" weight="bold" /> : null}
              </div>
            );
          })}
        </>
      ) : null}

      {/* Indicateur visuel pendant le resize - affiche les nouvelles dimensions en bas */}
      {activeResizeHandle && isSelected && isEditMode ? (
        <div
          style={{
            position: "absolute",
            bottom: -24,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "2px 6px",
            backgroundColor: "var(--accent-9)",
            color: "white",
            fontSize: 10,
            fontWeight: 600,
            fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
            borderRadius: 3,
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            whiteSpace: "nowrap",
            zIndex: 20,
          }}
        >
          {Math.round(element.width)}×{Math.round(element.height)}
        </div>
      ) : null}
    </div>
  );
}
