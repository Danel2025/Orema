"use client";

/**
 * ZoneElement - Élément de zone/salle pour le plan
 * Représente une zone visuelle (ex: Terrasse, Salle principale, Bar)
 */

import { useState } from "react";
import { MapPin, X, GripVertical, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ZoneData {
  id: string;
  nom: string;
  couleur: string; // Couleur hex (ex: "#22c55e")
  x: number;
  y: number;
  width: number;
  height: number;
}

// Couleurs prédéfinies pour les zones
export const ZONE_COLORS = [
  { name: "Vert", value: "#22c55e" },
  { name: "Bleu", value: "#3b82f6" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Rose", value: "#ec4899" },
  { name: "Orange", value: "#f97316" },
  { name: "Jaune", value: "#eab308" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Indigo", value: "#6366f1" },
];

// LocalStorage key
const ZONES_STORAGE_KEY = "floorplan-zones";

// Helpers pour localStorage
export function loadZones(): ZoneData[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(ZONES_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

export function saveZones(zones: ZoneData[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ZONES_STORAGE_KEY, JSON.stringify(zones));
}

export function addZone(zone: ZoneData): ZoneData[] {
  const zones = loadZones();
  zones.push(zone);
  saveZones(zones);
  return zones;
}

export function updateZone(id: string, updates: Partial<ZoneData>): ZoneData[] {
  const zones = loadZones().map((z) => (z.id === id ? { ...z, ...updates } : z));
  saveZones(zones);
  return zones;
}

export function deleteZone(id: string): ZoneData[] {
  const zones = loadZones().filter((z) => z.id !== id);
  saveZones(zones);
  return zones;
}

export function generateZoneId(): string {
  return `zone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface ZoneElementProps {
  zone: ZoneData;
  isSelected?: boolean;
  isEditMode?: boolean;
  isDragging?: boolean;
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onResizeStart?: (handle: string, e: React.MouseEvent) => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

const RESIZE_HANDLES = [
  { position: "top-left", cursor: "nwse-resize" },
  { position: "top-right", cursor: "nesw-resize" },
  { position: "bottom-left", cursor: "nesw-resize" },
  { position: "bottom-right", cursor: "nwse-resize" },
];

export function ZoneElement({
  zone,
  isSelected,
  isEditMode,
  isDragging,
  onClick,
  onMouseDown,
  onResizeStart,
  onDelete,
  onEdit,
}: ZoneElementProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getHandleStyle = (handle: { position: string; cursor: string }): React.CSSProperties => {
    const size = 10;
    const offset = -size / 2;
    const base: React.CSSProperties = {
      position: "absolute",
      width: size,
      height: size,
      backgroundColor: zone.couleur,
      border: "2px solid white",
      borderRadius: 2,
      cursor: handle.cursor,
      zIndex: 10,
    };

    switch (handle.position) {
      case "top-left":
        return { ...base, top: offset, left: offset };
      case "top-right":
        return { ...base, top: offset, right: offset };
      case "bottom-left":
        return { ...base, bottom: offset, left: offset };
      case "bottom-right":
        return { ...base, bottom: offset, right: offset };
      default:
        return base;
    }
  };

  // Convertir hex en rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div
      data-zone-id={zone.id}
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).closest("[data-resize-handle]")) return;
        if ((e.target as HTMLElement).closest("[data-action-btn]")) return;
        onMouseDown?.(e);
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "absolute select-none",
        isSelected && "ring-2 ring-offset-2",
        isEditMode && "cursor-move"
      )}
      style={{
        left: zone.x,
        top: zone.y,
        width: zone.width,
        height: zone.height,
        backgroundColor: hexToRgba(zone.couleur, 0.1),
        border: `2px dashed ${hexToRgba(zone.couleur, isSelected ? 1 : 0.5)}`,
        borderRadius: 8,
        zIndex: 0, // Zones are behind tables and decor
        boxShadow: isSelected
          ? `0 0 0 2px ${hexToRgba(zone.couleur, 0.3)}`
          : undefined,
        transition: "box-shadow 0.15s, border-color 0.15s",
        // @ts-expect-error CSS variable
        "--ring-color": zone.couleur,
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
          gap: 6,
          padding: "4px 10px",
          backgroundColor: hexToRgba(zone.couleur, 0.9),
          color: "white",
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 600,
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      >
        <MapPin size={12} />
        {zone.nom}
      </div>

      {/* Actions (edit mode) */}
      {isSelected && isEditMode ? <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            display: "flex",
            gap: 4,
          }}
        >
          {onEdit ? <button
              data-action-btn
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              style={{
                width: 24,
                height: 24,
                borderRadius: 4,
                border: "none",
                backgroundColor: "white",
                color: zone.couleur,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }}
              title="Modifier"
            >
              <Pencil size={12} />
            </button> : null}
          {onDelete ? <button
              data-action-btn
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              style={{
                width: 24,
                height: 24,
                borderRadius: 4,
                border: "none",
                backgroundColor: "white",
                color: "#ef4444",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }}
              title="Supprimer"
            >
              <X size={12} />
            </button> : null}
        </div> : null}

      {/* Resize handles (edit mode, selected) */}
      {isSelected && isEditMode && onResizeStart ? <>
          {RESIZE_HANDLES.map((handle) => (
            <div
              key={handle.position}
              data-resize-handle="true"
              style={getHandleStyle(handle)}
              onMouseDown={(e) => {
                e.stopPropagation();
                onResizeStart(handle.position, e);
              }}
            />
          ))}
        </> : null}
    </div>
  );
}
