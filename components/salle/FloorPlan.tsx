"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  PencilSimple,
  SignOut,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  Plus,
  ArrowCounterClockwise,
  ArrowClockwise,
  Square,
  Circle,
  Rectangle,
  Door,
  Armchair,
  ForkKnife,
  Wine,
  MapPin,
  CloudCheck,
  SpinnerGap,
  CloudSlash,
} from "@phosphor-icons/react";
import { IconButton, Tooltip, Separator } from "@radix-ui/themes";
import { toast } from "sonner";
import { TableItem } from "./TableItem";
import { FloorPlanToolbar, type ToolType, type Orientation } from "./FloorPlanToolbar";
import {
  DecorElement,
  type DecorElementData,
  type DecorType,
  getEffectiveDimensions,
} from "./DecorElement";
import { ZoneElement, type ZoneData, ZONE_COLORS } from "./ZoneElement";
import {
  createZone,
  updateZone,
  deleteZone as deleteZoneAction,
  deleteTable as deleteTableAction,
  updateZonesPositions,
  updateTablesPositions,
} from "@/actions/tables";
import { ElementContextMenu } from "./ElementContextMenu";
import { TableContextMenu } from "./TableContextMenu";
import { useAuth } from "@/lib/auth/context";

import { useFloorPlanHistory } from "@/hooks/useFloorPlanHistory";
import { useFloorPlanKeyboard } from "@/hooks/useFloorPlanKeyboard";
import type { StatutTableType, FormeTableType } from "@/schemas/table.schema";
import {
  snapPositionIfEnabled,
  snapDimensions,
  snapToElements,
  DEFAULT_GRID_SIZE,
  type GridSize,
  type SnapElementRect,
} from "@/lib/floorplan/snap-to-grid";
import {
  detectAlignmentGuides,
  type AlignmentGuide,
  type ElementRect,
} from "@/lib/floorplan/smart-guides";
import { RotationHandle } from "./RotationHandle";
import { FloorPlanGrid } from "./FloorPlanGrid";
import { SmartGuides } from "./SmartGuides";

// Icone personnalisee pour le mur (coherente avec la toolbar)
function WallIcon({ size = 16 }: { size?: number }) {
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
    >
      <rect x="2" y="4" width="20" height="4" rx="0.5" />
      <rect x="2" y="10" width="9" height="4" rx="0.5" />
      <rect x="13" y="10" width="9" height="4" rx="0.5" />
      <rect x="2" y="16" width="20" height="4" rx="0.5" />
    </svg>
  );
}

interface ZoneInfo {
  id: string;
  nom: string;
}

/** Zone de la base de données (passée en props) */
interface DbZone {
  id: string;
  nom: string;
  couleur: string | null;
  description: string | null;
  position_x: number | null;
  position_y: number | null;
  largeur: number | null;
  hauteur: number | null;
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
  active: boolean;
  ventes: Array<{
    id: string;
    totalFinal: { toNumber?: () => number } | number;
    _count: {
      lignes: number;
    };
  }>;
}

interface FloorPlanProps {
  tables: TableData[];
  /** Zones de la base de données */
  dbZones?: DbZone[];
  selectedTableId?: string | null;
  onTableSelect?: (tableId: string) => void;
  onTableDoubleClick?: (tableId: string) => void;
  onAddTable?: (
    forme: "CARREE" | "RONDE" | "RECTANGULAIRE",
    positionX?: number,
    positionY?: number
  ) => void;
  onRefresh?: () => void;
  /** Désactive le mode édition (pour serveurs/caissiers) */
  readOnly?: boolean;
}

export function FloorPlan({
  tables,
  dbZones = [],
  selectedTableId,
  onTableSelect,
  onTableDoubleClick,
  onAddTable,
  onRefresh,
  readOnly = false,
}: FloorPlanProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [draggedTable, setDraggedTable] = useState<string | null>(null);
  const [editSelectedTableId, setEditSelectedTableId] = useState<string | null>(null);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [tableRotations, setTableRotations] = useState<Record<string, number>>({});

  // Multi-sélection : ensemble des IDs sélectionnés (décors + tables)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Offsets pour le déplacement groupé (positions relatives au point de clic)
  const dragGroupOffsetsRef = useRef<Record<string, { dx: number; dy: number }>>({});

  // Auto-save state
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan (déplacement du canvas avec Espace+clic)
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isAltPressed, setIsAltPressed] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Snap-to-grid state
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [gridSize, setGridSize] = useState<GridSize>(DEFAULT_GRID_SIZE);

  // Outils et éléments de décor
  const [activeTool, setActiveTool] = useState<ToolType>("select");
  // Orientation pour le placement des éléments décor (H = horizontal, V = vertical)
  const [orientation, setOrientation] = useState<Orientation>("horizontal");

  // Récupérer l'établissement pour scoper le localStorage
  const { user } = useAuth();

  // Utiliser le hook d'historique pour les éléments de décor (scopé par établissement)
  const { decorElements, setDecorElements, undo, redo, canUndo, canRedo } = useFloorPlanHistory(
    user?.etablissementId ?? ""
  );

  const [selectedDecorId, setSelectedDecorId] = useState<string | null>(null);

  // Zones - converties depuis la BDD
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [zonePositions, setZonePositions] = useState<
    Record<string, { x: number; y: number; width: number; height: number }>
  >({});
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [showZoneDialog, setShowZoneDialog] = useState(false);
  const [pendingZonePosition, setPendingZonePosition] = useState<{ x: number; y: number } | null>(
    null
  );
  const [editingZone, setEditingZone] = useState<ZoneData | null>(null);

  // Convertir les zones de la BDD vers le format ZoneData
  useEffect(() => {
    const convertedZones: ZoneData[] = dbZones.map((dbZone) => {
      // Utiliser les positions locales si disponibles (pendant le drag)
      const localPos = zonePositions[dbZone.id];
      return {
        id: dbZone.id,
        nom: dbZone.nom,
        couleur: dbZone.couleur || "#22c55e",
        x: localPos?.x ?? dbZone.position_x ?? 50,
        y: localPos?.y ?? dbZone.position_y ?? 50,
        width: localPos?.width ?? dbZone.largeur ?? 200,
        height: localPos?.height ?? dbZone.hauteur ?? 150,
      };
    });
    setZones(convertedZones);
  }, [dbZones, zonePositions]);

  // État pour le déplacement direct (sans HTML5 drag & drop)
  const [dragging, setDragging] = useState<{
    type: "decor" | "table" | "zone";
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  // Clipboard pour copier/coller
  const [clipboard, setClipboard] = useState<DecorElementData | null>(null);

  // Menu contextuel
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    elementId: string;
  } | null>(null);

  // Position du curseur pour le ghost preview
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  // Coin de rotation survolé (détecté dans le canvas, rendu comme sibling)
  const [hoveredRotationCorner, setHoveredRotationCorner] = useState<string | null>(null);

  // Redimensionnement
  const [resizing, setResizing] = useState<{
    elementId: string;
    handle: string;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);
  // Indique si la souris a bougé pendant le resize (pour distinguer clic vs drag)
  const resizeHasMoved = useRef(false);

  // Rotation libre (drag-to-rotate)
  const [isRotating, setIsRotating] = useState(false);
  const rotationStartAngleRef = useRef(0);
  const rotationStartElementAngleRef = useRef(0);

  // Smart guides - guides d'alignement actifs pendant le drag
  const [activeGuides, setActiveGuides] = useState<AlignmentGuide[]>([]);

  // Ratio d'aspect initial pour le resize proportionnel (Shift+drag sur coins)
  const resizeAspectRatioRef = useRef<number | null>(null);

  // Mode dessin : clic-glisser pour placer un élément avec dimensions personnalisées
  const [drawing, setDrawing] = useState<{
    type: DecorType;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const drawingThreshold = 10; // Seuil en px pour distinguer clic simple vs dessin

  // Sélection par zone (marquee) : clic-glisser sur le canvas vide en mode select
  const [marquee, setMarquee] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const marqueeJustEndedRef = useRef(false);
  const elementClickedRef = useRef(false);

  // Position actuelle d'une table (locale ou depuis la DB)
  const getPosition = useCallback(
    (table: TableData) => {
      if (positions[table.id]) {
        return { x: positions[table.id].x, y: positions[table.id].y };
      }
      return { x: table.positionX || 50, y: table.positionY || 50 };
    },
    [positions]
  );

  // Helper pour gérer la sélection simple ou multiple (Shift/Ctrl+clic)
  const handleElementSelect = useCallback(
    (id: string, type: "decor" | "table", e: React.MouseEvent) => {
      const isMultiKey = e.shiftKey || e.ctrlKey || e.metaKey;

      if (isMultiKey) {
        // Toggle dans le set de multi-sélection
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return next;
        });
        // Mettre à jour le primary selection
        if (type === "decor") {
          setSelectedDecorId(id);
          setEditSelectedTableId(null);
        } else {
          setEditSelectedTableId(id);
          setSelectedDecorId(null);
        }
      } else {
        // Sélection simple : vider le set et sélectionner uniquement cet élément
        setSelectedIds(new Set([id]));
        if (type === "decor") {
          setSelectedDecorId(id);
          setEditSelectedTableId(null);
        } else {
          setEditSelectedTableId(id);
          setSelectedDecorId(null);
        }
      }
      setSelectedZoneId(null);
    },
    []
  );

  // Démarrer le déplacement direct d'une zone
  // Alt+Click sur zone = pas de duplication (les zones sont en BDD, pas de sens de dupliquer en drag)
  const handleZoneMouseDown = useCallback(
    (e: React.MouseEvent, zoneId: string) => {
      if (!isEditMode || isSpacePressed) return;
      e.preventDefault();
      e.stopPropagation();

      const zone = zones.find((z) => z.id === zoneId);
      if (!zone || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;

      setDragging({
        type: "zone",
        id: zoneId,
        offsetX: mouseX - zone.x,
        offsetY: mouseY - zone.y,
      });
      setSelectedZoneId(zoneId);
      setSelectedDecorId(null);
    },
    [isEditMode, zones, zoom, pan, isSpacePressed]
  );

  // Démarrer le déplacement direct d'un élément de décor
  // Alt+Click = dupliquer l'élément et commencer à drag la copie
  const handleDecorMouseDown = useCallback(
    (e: React.MouseEvent, decorId: string) => {
      if (!isEditMode || isSpacePressed) return;
      e.preventDefault();
      e.stopPropagation();
      elementClickedRef.current = true;
      requestAnimationFrame(() => { elementClickedRef.current = false; });

      const element = decorElements.find((el) => el.id === decorId);
      if (!element || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;

      // Alt+Click : dupliquer et drag la copie
      if (e.altKey) {
        const newId = `decor-${Date.now()}`;
        const newElement: DecorElementData = { ...element, id: newId };
        setDecorElements([...decorElements, newElement]);
        setDragging({
          type: "decor",
          id: newId,
          offsetX: mouseX - element.x,
          offsetY: mouseY - element.y,
        });
        setSelectedDecorId(newId);
        setSelectedZoneId(null);
        setHasChanges(true);
        return;
      }

      // Gérer la sélection (simple ou multi)
      handleElementSelect(decorId, "decor", e);

      setDragging({
        type: "decor",
        id: decorId,
        offsetX: mouseX - element.x,
        offsetY: mouseY - element.y,
      });

      // Calculer les offsets pour le drag groupé
      // Si l'élément est déjà dans une multi-sélection (ex: après marquee), garder le set
      const isMultiKey = e.shiftKey || e.ctrlKey || e.metaKey;
      const alreadyInGroup = selectedIds.has(decorId) && selectedIds.size > 1;
      const currentSelectedIds = isMultiKey
        ? new Set([...selectedIds, decorId])
        : alreadyInGroup
          ? selectedIds
          : new Set([decorId]);

      if (currentSelectedIds.size > 1 && currentSelectedIds.has(decorId)) {
        const offsets: Record<string, { dx: number; dy: number }> = {};
        for (const sid of currentSelectedIds) {
          if (sid === decorId) continue;
          const decorEl = decorElements.find((el) => el.id === sid);
          if (decorEl) {
            offsets[sid] = { dx: decorEl.x - element.x, dy: decorEl.y - element.y };
            continue;
          }
          const tableEl = tables.find((t) => t.id === sid);
          if (tableEl) {
            const tPos = positions[sid] || {
              x: tableEl.positionX || 50,
              y: tableEl.positionY || 50,
            };
            offsets[sid] = { dx: tPos.x - element.x, dy: tPos.y - element.y };
          }
        }
        dragGroupOffsetsRef.current = offsets;
      } else {
        dragGroupOffsetsRef.current = {};
      }

      setSelectedZoneId(null);
    },
    [isEditMode, decorElements, setDecorElements, zoom, pan, isSpacePressed, handleElementSelect, selectedIds, tables, positions]
  );

  // Démarrer le déplacement direct d'une table
  // Alt+Click = dupliquer la table (ouvre le formulaire pré-rempli à la position du clic)
  const handleTableMouseDown = useCallback(
    (e: React.MouseEvent, tableId: string) => {
      if (!isEditMode || isSpacePressed) return;
      e.preventDefault();
      e.stopPropagation();
      elementClickedRef.current = true;
      requestAnimationFrame(() => { elementClickedRef.current = false; });

      const table = tables.find((t) => t.id === tableId);
      if (!table || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;

      const pos = positions[tableId] || { x: table.positionX || 50, y: table.positionY || 50 };

      // Alt+Click : créer une copie de la table via le formulaire
      if (e.altKey && onAddTable) {
        const forme = table.forme as "CARREE" | "RONDE" | "RECTANGULAIRE";
        onAddTable(forme, Math.round(mouseX + 30), Math.round(mouseY + 30));
        return;
      }

      // Gérer la sélection (simple ou multi)
      handleElementSelect(tableId, "table", e);

      setDragging({
        type: "table",
        id: tableId,
        offsetX: mouseX - pos.x,
        offsetY: mouseY - pos.y,
      });
      setDraggedTable(tableId);

      // Calculer les offsets pour le drag groupé
      const isMultiKey = e.shiftKey || e.ctrlKey || e.metaKey;
      const alreadyInGroup = selectedIds.has(tableId) && selectedIds.size > 1;
      const currentSelectedIds = isMultiKey
        ? new Set([...selectedIds, tableId])
        : alreadyInGroup
          ? selectedIds
          : new Set([tableId]);

      if (currentSelectedIds.size > 1 && currentSelectedIds.has(tableId)) {
        const offsets: Record<string, { dx: number; dy: number }> = {};
        for (const sid of currentSelectedIds) {
          if (sid === tableId) continue;
          const decorEl = decorElements.find((el) => el.id === sid);
          if (decorEl) {
            offsets[sid] = { dx: decorEl.x - pos.x, dy: decorEl.y - pos.y };
            continue;
          }
          const tableEl = tables.find((t) => t.id === sid);
          if (tableEl) {
            const tPos = positions[sid] || {
              x: tableEl.positionX || 50,
              y: tableEl.positionY || 50,
            };
            offsets[sid] = { dx: tPos.x - pos.x, dy: tPos.y - pos.y };
          }
        }
        dragGroupOffsetsRef.current = offsets;
      } else {
        dragGroupOffsetsRef.current = {};
      }

      setSelectedZoneId(null);
    },
    [isEditMode, tables, positions, zoom, pan, isSpacePressed, onAddTable, handleElementSelect, selectedIds, decorElements]
  );

  // Auto-save : sauvegarder les positions (tables et zones) avec debounce
  const performAutoSave = useCallback(async () => {
    const tableUpdates = Object.entries(positions).map(([id, pos]) => ({
      id,
      positionX: pos.x,
      positionY: pos.y,
    }));

    const zoneUpdates = Object.entries(zonePositions).map(([id, pos]) => ({
      id,
      position_x: pos.x,
      position_y: pos.y,
      largeur: pos.width,
      hauteur: pos.height,
    }));

    if (tableUpdates.length === 0 && zoneUpdates.length === 0) return;

    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setAutoSaveStatus("saving");

    try {
      if (tableUpdates.length > 0) {
        const tableResult = await updateTablesPositions(tableUpdates);
        if (!tableResult.success) {
          setAutoSaveStatus("error");
          isSavingRef.current = false;
          return;
        }
      }

      if (zoneUpdates.length > 0) {
        const zoneResult = await updateZonesPositions(zoneUpdates);
        if (!zoneResult.success) {
          setAutoSaveStatus("error");
          isSavingRef.current = false;
          return;
        }
      }

      setPositions({});
      setZonePositions({});
      setHasChanges(false);
      setAutoSaveStatus("saved");
      onRefresh?.();
    } catch {
      setAutoSaveStatus("error");
    } finally {
      isSavingRef.current = false;
    }
  }, [positions, zonePositions, onRefresh]);

  // Debounced auto-save : déclenché quand hasChanges passe à true
  useEffect(() => {
    if (!hasChanges || !isEditMode) return;

    // Clear previous timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      performAutoSave();
    }, 500);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [hasChanges, isEditMode, positions, zonePositions, performAutoSave]);

  // Quitter le mode édition (les changements sont déjà sauvegardés)
  const handleExitEditMode = useCallback(async () => {
    // Sauvegarder immédiatement les changements en attente avant de quitter
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    if (hasChanges) {
      await performAutoSave();
    }
    setPositions({});
    setZonePositions({});
    setTableRotations({});
    setHasChanges(false);
    setIsEditMode(false);
    setEditSelectedTableId(null);
    setSelectedIds(new Set());
    setAutoSaveStatus("idle");
  }, [hasChanges, performAutoSave]);

  // Zoom
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.5));

  // Réinitialiser l'affichage (zoom et pan)
  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Zoom avec Alt + molette
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.altKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((z) => Math.min(2, Math.max(0.5, z + delta)));
    }
  }, []);

  // Map des types d'outils vers les types de décor
  const decorTypeMap: Record<string, DecorType> = {
    wall: "wall",
    "wall-l": "wall-l",
    "wall-t": "wall-t",
    "wall-cross": "wall-cross",
    shelf: "shelf",
    door: "door",
    counter: "counter",
    bar: "bar",
    decoration: "decoration",
  };

  // Dimensions par défaut (utilisées si clic simple sans glisser)
  const defaultSizeMap: Record<DecorType, { width: number; height: number }> = {
    wall: { width: 120, height: 10 },
    "wall-l": { width: 80, height: 80 },
    "wall-t": { width: 100, height: 80 },
    "wall-cross": { width: 80, height: 80 },
    shelf: { width: 100, height: 20 },
    door: { width: 60, height: 20 },
    counter: { width: 150, height: 50 },
    bar: { width: 120, height: 60 },
    decoration: { width: 50, height: 50 },
  };

  // Clic sur le canvas : gère les tables et zones, démarre le dessin pour les décors
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isEditMode || activeTool === "select") return;
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const rawX = (e.clientX - rect.left - pan.x) / zoom - 40;
      const rawY = (e.clientY - rect.top - pan.y) / zoom - 40;
      const snapped = snapPositionIfEnabled(rawX, rawY, gridSize, snapEnabled);

      // Tables : clic simple
      if (activeTool.startsWith("table-")) {
        const formeMap: Record<string, "CARREE" | "RONDE" | "RECTANGULAIRE"> = {
          "table-square": "CARREE",
          "table-round": "RONDE",
          "table-rect": "RECTANGULAIRE",
        };
        onAddTable?.(formeMap[activeTool], Math.round(snapped.x), Math.round(snapped.y));
        return;
      }

      // Zones : clic simple
      if (activeTool === "zone") {
        setPendingZonePosition({ x: snapped.x, y: snapped.y });
        setShowZoneDialog(true);
        return;
      }
    },
    [isEditMode, activeTool, zoom, onAddTable, gridSize, snapEnabled, pan]
  );

  // Démarrer le dessin d'un élément décor (mousedown sur canvas)
  const handleDrawStart = useCallback(
    (e: React.MouseEvent) => {
      if (!isEditMode || activeTool === "select") return;
      if (!containerRef.current) return;
      // Ignorer les tables et zones (gérés par handleCanvasClick)
      if (activeTool.startsWith("table-") || activeTool === "zone") return;

      const type = decorTypeMap[activeTool];
      if (!type) return;

      const rect = containerRef.current.getBoundingClientRect();
      const rawX = (e.clientX - rect.left - pan.x) / zoom;
      const rawY = (e.clientY - rect.top - pan.y) / zoom;
      const snapped = snapPositionIfEnabled(rawX, rawY, gridSize, snapEnabled);

      setDrawing({
        type,
        startX: snapped.x,
        startY: snapped.y,
        currentX: snapped.x,
        currentY: snapped.y,
      });

      // Désélectionner les autres éléments
      setSelectedDecorId(null);
      setEditSelectedTableId(null);
      setSelectedZoneId(null);
    },
    [isEditMode, activeTool, zoom, gridSize, snapEnabled, pan]
  );

  // Finaliser le dessin d'un élément décor (mouseup)
  const handleDrawEnd = useCallback(() => {
    if (!drawing) return;

    const x = Math.min(drawing.startX, drawing.currentX);
    const y = Math.min(drawing.startY, drawing.currentY);
    const drawnWidth = Math.abs(drawing.currentX - drawing.startX);
    const drawnHeight = Math.abs(drawing.currentY - drawing.startY);

    // Si le mouvement est trop petit (< seuil), utiliser les dimensions par défaut
    const isSmallDrag = drawnWidth < drawingThreshold && drawnHeight < drawingThreshold;

    let finalWidth: number;
    let finalHeight: number;
    let finalX: number;
    let finalY: number;

    if (isSmallDrag) {
      // Clic simple → dimensions par défaut avec orientation
      const baseSize = defaultSizeMap[drawing.type];
      const isSquare = baseSize.width === baseSize.height;
      const size = orientation === "vertical" && !isSquare
        ? { width: baseSize.height, height: baseSize.width }
        : baseSize;
      finalWidth = size.width;
      finalHeight = size.height;
      // Centrer sur le point de clic
      finalX = drawing.startX - finalWidth / 2;
      finalY = drawing.startY - finalHeight / 2;
    } else {
      // Dessin libre → utiliser les dimensions glissées avec minimum 20px
      finalWidth = Math.max(20, drawnWidth);
      finalHeight = Math.max(20, drawnHeight);
      finalX = x;
      finalY = y;
    }

    // Snap les dimensions si activé
    const snappedSize = snapEnabled
      ? snapDimensions(finalWidth, finalHeight, gridSize, 20, 20)
      : { width: finalWidth, height: finalHeight };
    const snappedPos = snapPositionIfEnabled(finalX, finalY, gridSize, snapEnabled);

    const newElement: DecorElementData = {
      id: `decor-${Date.now()}`,
      type: drawing.type,
      x: Math.max(0, snappedPos.x),
      y: Math.max(0, snappedPos.y),
      width: snappedSize.width,
      height: snappedSize.height,
      label: drawing.type === "wall" ? undefined : drawing.type.charAt(0).toUpperCase() + drawing.type.slice(1),
    };

    const newElements = [...decorElements, newElement];
    setDecorElements(newElements);
    setHasChanges(true);
    setSelectedDecorId(newElement.id);
    setDrawing(null);
  }, [
    drawing,
    decorElements,
    setDecorElements,
    snapEnabled,
    gridSize,
    orientation,
  ]);

  // Supprimer l'élément sélectionné (zone, decor ou table) — support multi-sélection
  const handleDeleteSelected = useCallback(async () => {
    // Suppression groupée si multi-sélection active
    if (selectedIds.size > 1) {
      const decorIdsToDelete = [...selectedIds].filter((id) =>
        decorElements.some((el) => el.id === id)
      );
      const tableIdsToDelete = [...selectedIds].filter((id) =>
        tables.some((t) => t.id === id)
      );

      if (decorIdsToDelete.length > 0) {
        const newElements = decorElements.filter(
          (el) => !selectedIds.has(el.id)
        );
        setDecorElements(newElements);
        setHasChanges(true);
      }

      // Supprimer les tables sélectionnées (en BDD)
      for (const tableId of tableIdsToDelete) {
        const result = await deleteTableAction(tableId);
        if (!result.success) {
          toast.error(result.error || `Erreur lors de la suppression d'une table`);
        }
      }
      if (tableIdsToDelete.length > 0) {
        onRefresh?.();
      }

      setSelectedIds(new Set());
      setSelectedDecorId(null);
      setEditSelectedTableId(null);
      return;
    }

    if (selectedZoneId) {
      const result = await deleteZoneAction(selectedZoneId);
      if (result.success) {
        setSelectedZoneId(null);
        toast.success("Zone supprimée");
        onRefresh?.();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
      return;
    }
    if (editSelectedTableId) {
      const result = await deleteTableAction(editSelectedTableId);
      if (result.success) {
        setEditSelectedTableId(null);
        setSelectedIds(new Set());
        toast.success("Table supprimée");
        onRefresh?.();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
      return;
    }
    if (selectedDecorId) {
      const newElements = decorElements.filter((el) => el.id !== selectedDecorId);
      setDecorElements(newElements);
      setSelectedDecorId(null);
      setSelectedIds(new Set());
      setHasChanges(true);
    }
  }, [selectedDecorId, editSelectedTableId, selectedZoneId, selectedIds, decorElements, tables, setDecorElements, onRefresh]);

  // Menu contextuel
  const handleContextMenu = useCallback((e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    setSelectedDecorId(elementId);
    setContextMenu({ x: e.clientX, y: e.clientY, elementId });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Calculer les coins d'un élément sélectionné pour les poignées de rotation
  const getSelectedElementCorners = useCallback(() => {
    if (selectedDecorId) {
      const el = decorElements.find((e) => e.id === selectedDecorId);
      if (!el) return null;
      const dims = getEffectiveDimensions(el);
      return {
        type: "decor" as const,
        x: el.x,
        y: el.y,
        width: dims.width,
        height: dims.height,
        rotation: el.rotation || 0,
      };
    }
    if (editSelectedTableId) {
      const table = tables.find((t) => t.id === editSelectedTableId);
      if (!table) return null;
      const pos = getPosition(table);
      return {
        type: "table" as const,
        x: pos.x,
        y: pos.y,
        width: table.largeur || 80,
        height: table.hauteur || 80,
        rotation: tableRotations[editSelectedTableId] || 0,
      };
    }
    return null;
  }, [selectedDecorId, editSelectedTableId, decorElements, tables, getPosition, tableRotations]);

  // Détection de proximité aux coins d'un élément
  const detectCornerProximity = useCallback(
    (mouseX: number, mouseY: number): string | null => {
      const el = getSelectedElementCorners();
      if (!el) return null;

      const CORNER_RADIUS = 18;
      const corners = [
        { key: "nw", cx: el.x, cy: el.y },
        { key: "ne", cx: el.x + el.width, cy: el.y },
        { key: "sw", cx: el.x, cy: el.y + el.height },
        { key: "se", cx: el.x + el.width, cy: el.y + el.height },
      ];

      for (const corner of corners) {
        const dx = mouseX - corner.cx;
        const dy = mouseY - corner.cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Proche du coin mais HORS de l'élément (zone extérieure)
        const insideX = mouseX > el.x && mouseX < el.x + el.width;
        const insideY = mouseY > el.y && mouseY < el.y + el.height;
        if (dist < CORNER_RADIUS && !(insideX && insideY)) {
          return corner.key;
        }
      }
      return null;
    },
    [getSelectedElementCorners]
  );

  // Collecter tous les ElementRect pour le snap inter-éléments et les smart guides
  const collectAllElementRects = useCallback((): ElementRect[] => {
    const rects: ElementRect[] = [];
    // Décor
    for (const el of decorElements) {
      const dims = getEffectiveDimensions(el);
      rects.push({ id: el.id, x: el.x, y: el.y, width: dims.width, height: dims.height });
    }
    // Tables
    for (const t of tables) {
      const pos = positions[t.id] || { x: t.positionX || 50, y: t.positionY || 50 };
      rects.push({ id: t.id, x: pos.x, y: pos.y, width: t.largeur || 80, height: t.hauteur || 80 });
    }
    // Zones
    for (const z of zones) {
      rects.push({ id: z.id, x: z.x, y: z.y, width: z.width, height: z.height });
    }
    return rects;
  }, [decorElements, tables, positions, zones]);

  // Handler pour démarrer la rotation libre (drag-to-rotate)
  const handleRotationStart = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const el = getSelectedElementCorners();
      if (!el) return;

      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;

      const centerX = el.x + el.width / 2;
      const centerY = el.y + el.height / 2;

      // Angle initial entre le centre et la souris
      const startAngle = Math.atan2(mouseY - centerY, mouseX - centerX) * (180 / Math.PI);
      rotationStartAngleRef.current = startAngle;
      rotationStartElementAngleRef.current = el.rotation;

      setIsRotating(true);
    },
    [zoom, pan, getSelectedElementCorners]
  );

  // Rotation - normalise à 0, 90, 180, 270
  // Pour les murs droits et étagères, échange width/height lors de rotation 90°
  const rotateElement = useCallback(
    (degrees: number) => {
      if (!selectedDecorId) return;
      const newElements = decorElements.map((el) => {
        if (el.id === selectedDecorId) {
          const currentRotation = el.rotation || 0;
          let newRotation = (currentRotation + degrees) % 360;
          if (newRotation < 0) newRotation += 360;

          // Les murs droits et étagères utilisent le swap visuel dans DecorElement
          // (getEffectiveDimensions échange width/height à 90°/270°)
          // Pas besoin d'échanger les dimensions ici
          return { ...el, rotation: newRotation };
        }
        return el;
      });
      setDecorElements(newElements);
      setHasChanges(true);
    },
    [selectedDecorId, decorElements, setDecorElements]
  );

  // Rotation des tables
  const rotateTable = useCallback((tableId: string, degrees: number) => {
    setTableRotations((prev) => {
      const current = prev[tableId] || 0;
      let newRotation = (current + degrees) % 360;
      if (newRotation < 0) newRotation += 360;
      return { ...prev, [tableId]: newRotation };
    });
    setHasChanges(true);
  }, []);

  // Redimensionnement
  const resizeElement = useCallback(
    (widthDelta: number, heightDelta: number) => {
      if (!selectedDecorId) return;
      const newElements = decorElements.map((el) => {
        if (el.id === selectedDecorId) {
          return {
            ...el,
            width: Math.max(20, el.width + widthDelta),
            height: Math.max(20, el.height + heightDelta),
          };
        }
        return el;
      });
      setDecorElements(newElements);
      setHasChanges(true);
    },
    [selectedDecorId, decorElements, setDecorElements]
  );

  // Dupliquer — support multi-sélection
  const duplicateElement = useCallback(() => {
    // Duplication groupée si multi-sélection active
    if (selectedIds.size > 1) {
      const newSelectedIds = new Set<string>();
      const decorIdsInGroup = [...selectedIds].filter((id) =>
        decorElements.some((el) => el.id === id)
      );
      const updatedElements = [...decorElements];
      for (const did of decorIdsInGroup) {
        const element = decorElements.find((el) => el.id === did);
        if (!element) continue;
        const newId = `decor-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        updatedElements.push({
          ...element,
          id: newId,
          x: element.x + 20,
          y: element.y + 20,
        });
        newSelectedIds.add(newId);
      }
      setDecorElements(updatedElements);
      setSelectedIds(newSelectedIds);
      setHasChanges(true);
      return;
    }

    if (!selectedDecorId) return;
    const element = decorElements.find((el) => el.id === selectedDecorId);
    if (!element) return;
    const newElement: DecorElementData = {
      ...element,
      id: `decor-${Date.now()}`,
      x: element.x + 20,
      y: element.y + 20,
    };
    const newElements = [...decorElements, newElement];
    setDecorElements(newElements);
    setSelectedDecorId(newElement.id);
    setSelectedIds(new Set([newElement.id]));
    setHasChanges(true);
  }, [selectedDecorId, selectedIds, decorElements, setDecorElements]);

  // Copier l'élément sélectionné
  const copyElement = useCallback(() => {
    if (!selectedDecorId) return;
    const element = decorElements.find((el) => el.id === selectedDecorId);
    if (element) {
      setClipboard({ ...element });
      toast.success("Élément copié");
    }
  }, [selectedDecorId, decorElements]);

  // Coller l'élément copié
  const pasteElement = useCallback(() => {
    if (!clipboard) return;
    const newElement: DecorElementData = {
      ...clipboard,
      id: `decor-${Date.now()}`,
      x: clipboard.x + 30,
      y: clipboard.y + 30,
    };
    const newElements = [...decorElements, newElement];
    setDecorElements(newElements);
    setSelectedDecorId(newElement.id);
    setHasChanges(true);
    toast.success("Élément collé");
  }, [clipboard, decorElements, setDecorElements]);

  // Déplacer l'élément sélectionné (clavier) — support multi-sélection
  const moveElement = useCallback(
    (deltaX: number, deltaY: number) => {
      // Déplacement groupé si multi-sélection active
      if (selectedIds.size > 1) {
        // Déplacer les décors du groupe
        const newElements = decorElements.map((el) => {
          if (!selectedIds.has(el.id)) return el;
          return {
            ...el,
            x: Math.max(0, el.x + deltaX),
            y: Math.max(0, el.y + deltaY),
          };
        });
        setDecorElements(newElements);

        // Déplacer les tables du groupe
        const tableIdsInGroup = [...selectedIds].filter((id) =>
          tables.some((t) => t.id === id)
        );
        if (tableIdsInGroup.length > 0) {
          setPositions((prev) => {
            const next = { ...prev };
            for (const tid of tableIdsInGroup) {
              const table = tables.find((t) => t.id === tid);
              const pos = next[tid] || {
                x: table?.positionX || 50,
                y: table?.positionY || 50,
              };
              next[tid] = {
                x: Math.max(0, pos.x + deltaX),
                y: Math.max(0, pos.y + deltaY),
              };
            }
            return next;
          });
        }
        setHasChanges(true);
        return;
      }

      if (!selectedDecorId) return;
      const newElements = decorElements.map((el) => {
        if (el.id === selectedDecorId) {
          return {
            ...el,
            x: Math.max(0, el.x + deltaX),
            y: Math.max(0, el.y + deltaY),
          };
        }
        return el;
      });
      setDecorElements(newElements);
      setHasChanges(true);
    },
    [selectedDecorId, selectedIds, decorElements, setDecorElements, tables]
  );

  // Désélectionner / quitter mode édition
  const handleEscape = useCallback(() => {
    // Toujours vider la multi-sélection
    if (selectedIds.size > 0) {
      setSelectedIds(new Set());
    }
    if (selectedDecorId) {
      setSelectedDecorId(null);
    } else if (editSelectedTableId) {
      setEditSelectedTableId(null);
    } else if (selectedZoneId) {
      setSelectedZoneId(null);
    } else if (activeTool !== "select") {
      setActiveTool("select");
    }
  }, [selectedDecorId, editSelectedTableId, selectedZoneId, activeTool, selectedIds]);

  // Rotation unifiée : décor ou table selon la sélection — support multi-sélection
  const handleRotateSelected = useCallback(
    (degrees: number) => {
      // Rotation groupée si multi-sélection active
      if (selectedIds.size > 1) {
        // Rotation des décors du groupe
        const decorIdsInGroup = [...selectedIds].filter((id) =>
          decorElements.some((el) => el.id === id)
        );
        if (decorIdsInGroup.length > 0) {
          const newElements = decorElements.map((el) => {
            if (!selectedIds.has(el.id)) return el;
            const currentRotation = el.rotation || 0;
            let newRotation = (currentRotation + degrees) % 360;
            if (newRotation < 0) newRotation += 360;
            return { ...el, rotation: newRotation };
          });
          setDecorElements(newElements);
        }
        // Rotation des tables du groupe
        const tableIdsInGroup = [...selectedIds].filter((id) =>
          tables.some((t) => t.id === id)
        );
        if (tableIdsInGroup.length > 0) {
          setTableRotations((prev) => {
            const next = { ...prev };
            for (const tid of tableIdsInGroup) {
              const current = next[tid] || 0;
              let newRotation = (current + degrees) % 360;
              if (newRotation < 0) newRotation += 360;
              next[tid] = newRotation;
            }
            return next;
          });
        }
        setHasChanges(true);
        return;
      }

      if (selectedDecorId) {
        rotateElement(degrees);
      } else if (editSelectedTableId) {
        rotateTable(editSelectedTableId, degrees);
      }
    },
    [selectedDecorId, editSelectedTableId, rotateElement, rotateTable, selectedIds, decorElements, setDecorElements, tables]
  );

  // Basculer la visibilité de la grille (toggle snap)
  const handleToggleSnap = useCallback(() => {
    setSnapEnabled((prev) => !prev);
  }, []);

  // Centrer la vue sur l'élément sélectionné
  const handleFocusSelected = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    let targetX = 0;
    let targetY = 0;
    let found = false;

    if (selectedDecorId) {
      const el = decorElements.find((e) => e.id === selectedDecorId);
      if (el) {
        targetX = el.x + el.width / 2;
        targetY = el.y + el.height / 2;
        found = true;
      }
    } else if (editSelectedTableId) {
      const table = tables.find((t) => t.id === editSelectedTableId);
      if (table) {
        const pos = getPosition(table);
        targetX = pos.x + (table.largeur || 80) / 2;
        targetY = pos.y + (table.hauteur || 80) / 2;
        found = true;
      }
    } else if (selectedZoneId) {
      const zone = zones.find((z) => z.id === selectedZoneId);
      if (zone) {
        targetX = zone.x + zone.width / 2;
        targetY = zone.y + zone.height / 2;
        found = true;
      }
    }

    if (found) {
      const centerX = containerRect.width / 2;
      const centerY = containerRect.height / 2;
      setPan({
        x: centerX - targetX * zoom,
        y: centerY - targetY * zoom,
      });
    }
  }, [selectedDecorId, editSelectedTableId, selectedZoneId, decorElements, tables, zones, zoom, getPosition]);

  // Augmenter la taille de l'élément sélectionné
  const handleIncreaseSize = useCallback(() => {
    resizeElement(10, 10);
  }, [resizeElement]);

  // Réduire la taille de l'élément sélectionné
  const handleDecreaseSize = useCallback(() => {
    resizeElement(-10, -10);
  }, [resizeElement]);

  // Intégrer les raccourcis clavier
  // Basculer l'orientation de placement H/V
  const handleToggleOrientation = useCallback(() => {
    setOrientation((prev) => {
      const next = prev === "horizontal" ? "vertical" : "horizontal";
      toast.info(next === "vertical" ? "Orientation : Verticale" : "Orientation : Horizontale");
      return next;
    });
  }, []);

  useFloorPlanKeyboard(
    {
      onDelete: handleDeleteSelected,
      onDuplicate: duplicateElement,
      onCopy: copyElement,
      onPaste: pasteElement,
      onUndo: undo,
      onRedo: redo,
      onEscape: handleEscape,
      onMove: moveElement,
      onRotate: handleRotateSelected,
      onZoomIn: handleZoomIn,
      onZoomOut: handleZoomOut,
      onResetView: resetView,
      onToggleSnap: handleToggleSnap,
      onIncreaseSize: handleIncreaseSize,
      onDecreaseSize: handleDecreaseSize,
      onFocusSelected: handleFocusSelected,
      onToggleOrientation: handleToggleOrientation,
      onSelectAll: () => {
        const allIds = new Set<string>();
        for (const el of decorElements) {
          allIds.add(el.id);
        }
        for (const t of tables) {
          allIds.add(t.id);
        }
        setSelectedIds(allIds);
        // Garder le primary sur le premier élément trouvé
        if (decorElements.length > 0) {
          setSelectedDecorId(decorElements[0].id);
        } else if (tables.length > 0) {
          setEditSelectedTableId(tables[0].id);
        }
      },
    },
    {
      enabled: isEditMode && !isPanning,
      moveStep: snapEnabled ? gridSize : 1,
      fastMoveStep: snapEnabled ? gridSize * 2 : 10,
    }
  );

  // (resetView et getSelectedElementCorners définis plus haut)

  // Détecter la touche Espace pour le mode pan, Alt pour le mode duplication, Alt+R pour reset
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Espace pour le mode pan
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
      // Alt pour le mode duplication (Alt+Click)
      if (e.key === "Alt") {
        setIsAltPressed(true);
      }
      // Alt+R pour réinitialiser l'affichage
      if (e.altKey && e.code === "KeyR") {
        e.preventDefault();
        resetView();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
      if (e.key === "Alt") {
        setIsAltPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [resetView]);

  // Démarrer le redimensionnement
  const handleResizeStart = useCallback(
    (elementId: string, handle: string, e: React.MouseEvent) => {
      const element = decorElements.find((el) => el.id === elementId);
      if (!element) return;

      resizeHasMoved.current = false;
      // Capturer le ratio d'aspect pour le resize proportionnel (Shift+coin)
      resizeAspectRatioRef.current = element.height > 0 ? element.width / element.height : 1;
      setResizing({
        elementId,
        handle,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: element.width,
        startHeight: element.height,
        startPosX: element.x,
        startPosY: element.y,
      });
    },
    [decorElements]
  );

  // Gérer le mouvement pendant le redimensionnement
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!resizing) return;

      const deltaX = (e.clientX - resizing.startX) / zoom;
      const deltaY = (e.clientY - resizing.startY) / zoom;

      // Détecter si le mouvement est significatif (> 3px)
      if (Math.abs(e.clientX - resizing.startX) > 3 || Math.abs(e.clientY - resizing.startY) > 3) {
        resizeHasMoved.current = true;
      }

      // Check if resizing a zone
      const isZoneResize = zones.some((z) => z.id === resizing.elementId);

      if (isZoneResize) {
        let newWidth = resizing.startWidth;
        let newHeight = resizing.startHeight;
        let newX = resizing.startPosX;
        let newY = resizing.startPosY;

        switch (resizing.handle) {
          case "bottom-right":
            newWidth = Math.max(100, resizing.startWidth + deltaX);
            newHeight = Math.max(80, resizing.startHeight + deltaY);
            break;
          case "bottom-left":
            newWidth = Math.max(100, resizing.startWidth - deltaX);
            newX = resizing.startPosX + (resizing.startWidth - newWidth);
            newHeight = Math.max(80, resizing.startHeight + deltaY);
            break;
          case "top-right":
            newWidth = Math.max(100, resizing.startWidth + deltaX);
            newHeight = Math.max(80, resizing.startHeight - deltaY);
            newY = resizing.startPosY + (resizing.startHeight - newHeight);
            break;
          case "top-left":
            newWidth = Math.max(100, resizing.startWidth - deltaX);
            newX = resizing.startPosX + (resizing.startWidth - newWidth);
            newHeight = Math.max(80, resizing.startHeight - deltaY);
            newY = resizing.startPosY + (resizing.startHeight - newHeight);
            break;
        }

        if (snapEnabled) {
          const snappedPos = snapPositionIfEnabled(newX, newY, gridSize, snapEnabled);
          const snappedDims = snapDimensions(newWidth, newHeight, gridSize, 100, 80);
          newX = snappedPos.x;
          newY = snappedPos.y;
          newWidth = snappedDims.width;
          newHeight = snappedDims.height;
        }

        // Stocker la position locale pour le resize
        setZonePositions((prev) => ({
          ...prev,
          [resizing.elementId]: { x: newX, y: newY, width: newWidth, height: newHeight },
        }));
        return;
      }

      const newElements = decorElements.map((el) => {
        if (el.id !== resizing.elementId) return el;

        let newWidth = resizing.startWidth;
        let newHeight = resizing.startHeight;
        let newX = resizing.startPosX;
        let newY = resizing.startPosY;

        switch (resizing.handle) {
          case "right":
            newWidth = Math.max(20, resizing.startWidth + deltaX);
            break;
          case "bottom":
            newHeight = Math.max(20, resizing.startHeight + deltaY);
            break;
          case "left":
            newWidth = Math.max(20, resizing.startWidth - deltaX);
            newX = resizing.startPosX + (resizing.startWidth - newWidth);
            break;
          case "top":
            newHeight = Math.max(20, resizing.startHeight - deltaY);
            newY = resizing.startPosY + (resizing.startHeight - newHeight);
            break;
          case "bottom-right":
            newWidth = Math.max(20, resizing.startWidth + deltaX);
            newHeight = Math.max(20, resizing.startHeight + deltaY);
            break;
          case "bottom-left":
            newWidth = Math.max(20, resizing.startWidth - deltaX);
            newX = resizing.startPosX + (resizing.startWidth - newWidth);
            newHeight = Math.max(20, resizing.startHeight + deltaY);
            break;
          case "top-right":
            newWidth = Math.max(20, resizing.startWidth + deltaX);
            newHeight = Math.max(20, resizing.startHeight - deltaY);
            newY = resizing.startPosY + (resizing.startHeight - newHeight);
            break;
          case "top-left":
            newWidth = Math.max(20, resizing.startWidth - deltaX);
            newX = resizing.startPosX + (resizing.startWidth - newWidth);
            newHeight = Math.max(20, resizing.startHeight - deltaY);
            newY = resizing.startPosY + (resizing.startHeight - newHeight);
            break;
        }

        // Resize proportionnel : Shift + coin uniquement
        const CORNER_HANDLES_SET = new Set(["top-left", "top-right", "bottom-left", "bottom-right"]);
        if (e.shiftKey && CORNER_HANDLES_SET.has(resizing.handle) && resizeAspectRatioRef.current) {
          const ratio = resizeAspectRatioRef.current;
          newHeight = Math.max(20, newWidth / ratio);
          // Ajuster la position pour les coins top-*
          if (resizing.handle === "top-left" || resizing.handle === "top-right") {
            newY = resizing.startPosY + resizing.startHeight - newHeight;
          }
        }

        // Appliquer le snap-to-grid si activé
        if (snapEnabled) {
          const snappedPos = snapPositionIfEnabled(newX, newY, gridSize, snapEnabled);
          const snappedDims = snapDimensions(newWidth, newHeight, gridSize, 20, 20);
          newX = snappedPos.x;
          newY = snappedPos.y;
          newWidth = snappedDims.width;
          newHeight = snappedDims.height;
        }

        return { ...el, width: newWidth, height: newHeight, x: newX, y: newY };
      });

      setDecorElements(newElements);
    },
    [resizing, decorElements, setDecorElements, zones, zoom, snapEnabled, gridSize]
  );

  // Terminer le redimensionnement
  const handleMouseUp = useCallback(() => {
    if (drawing) {
      handleDrawEnd();
      return;
    }
    if (marquee) {
      // Finaliser la sélection par zone
      const mx = Math.min(marquee.startX, marquee.currentX);
      const my = Math.min(marquee.startY, marquee.currentY);
      const mw = Math.abs(marquee.currentX - marquee.startX);
      const mh = Math.abs(marquee.currentY - marquee.startY);

      // Seuil minimum pour considérer comme une vraie sélection par zone
      if (mw > drawingThreshold || mh > drawingThreshold) {
        const newSelected = new Set<string>();

        // Vérifier les éléments décor
        for (const el of decorElements) {
          if (
            el.x + el.width > mx &&
            el.x < mx + mw &&
            el.y + el.height > my &&
            el.y < my + mh
          ) {
            newSelected.add(el.id);
          }
        }

        // Vérifier les tables
        for (const table of tables) {
          const pos = getPosition(table);
          const tw = table.largeur || 80;
          const th = table.hauteur || 80;
          if (
            pos.x + tw > mx &&
            pos.x < mx + mw &&
            pos.y + th > my &&
            pos.y < my + mh
          ) {
            newSelected.add(table.id);
          }
        }

        if (newSelected.size > 0) {
          setSelectedIds(newSelected);
          // Mettre le premier comme primary
          const firstId = Array.from(newSelected)[0];
          const isDecor = decorElements.some((el) => el.id === firstId);
          if (isDecor) {
            setSelectedDecorId(firstId);
            setEditSelectedTableId(null);
          } else {
            setEditSelectedTableId(firstId);
            setSelectedDecorId(null);
          }
          setSelectedZoneId(null);
        }
      }

      setMarquee(null);
      marqueeJustEndedRef.current = true;
      requestAnimationFrame(() => { marqueeJustEndedRef.current = false; });
      return;
    }
    if (isRotating) {
      setIsRotating(false);
      setHasChanges(true);
    }
    if (resizing) {
      const CORNER_HANDLES = ["top-left", "top-right", "bottom-left", "bottom-right"];
      const isCornerHandle = CORNER_HANDLES.includes(resizing.handle);

      if (!resizeHasMoved.current && isCornerHandle && selectedDecorId === resizing.elementId) {
        // Clic sans mouvement sur un coin → rotation au lieu du resize
        // Restaurer les dimensions originales
        const newElements = decorElements.map((el) =>
          el.id === resizing.elementId
            ? {
                ...el,
                width: resizing.startWidth,
                height: resizing.startHeight,
                x: resizing.startPosX,
                y: resizing.startPosY,
              }
            : el
        );
        setDecorElements(newElements);
        setResizing(null);
        // Déclencher la rotation
        rotateElement(90);
      } else {
        setHasChanges(true);
        setResizing(null);
      }
      resizeAspectRatioRef.current = null;
    }
    if (dragging) {
      setHasChanges(true);
      setDragging(null);
      setDraggedTable(null);
      setActiveGuides([]);
    }
    if (isPanning) {
      setIsPanning(false);
    }
  }, [
    resizing,
    dragging,
    isPanning,
    isRotating,
    drawing,
    handleDrawEnd,
    marquee,
    getPosition,
    tables,
    selectedDecorId,
    decorElements,
    setDecorElements,
    rotateElement,
  ]);

  // Démarrer le pan (Espace + clic)
  const handlePanStart = useCallback(
    (e: React.MouseEvent) => {
      if (!isSpacePressed) return false;

      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      return true;
    },
    [isSpacePressed, pan]
  );

  // Configuration du ghost preview selon l'outil actif et l'orientation
  const getGhostPreviewConfig = useCallback((tool: ToolType) => {
    const baseSizeMap: Record<
      string,
      { width: number; height: number; borderRadius: string | number }
    > = {
      zone: { width: 200, height: 150, borderRadius: 8 },
      "table-square": { width: 80, height: 80, borderRadius: 8 },
      "table-round": { width: 80, height: 80, borderRadius: "50%" },
      "table-rect": { width: 120, height: 80, borderRadius: 8 },
      wall: { width: 120, height: 10, borderRadius: 2 },
      "wall-l": { width: 80, height: 80, borderRadius: 2 },
      "wall-t": { width: 100, height: 80, borderRadius: 2 },
      "wall-cross": { width: 80, height: 80, borderRadius: 2 },
      shelf: { width: 100, height: 20, borderRadius: 2 },
      door: { width: 60, height: 20, borderRadius: 8 },
      counter: { width: 150, height: 50, borderRadius: 8 },
      bar: { width: 120, height: 60, borderRadius: 8 },
      decoration: { width: 50, height: 50, borderRadius: 8 },
    };

    // Appliquer l'inversion pour l'orientation verticale (éléments non-carrés uniquement)
    const decorTools = new Set(["wall", "shelf", "door", "counter", "bar"]);
    const entry = baseSizeMap[tool];
    let sizeEntry = entry;
    if (entry && decorTools.has(tool) && orientation === "vertical" && entry.width !== entry.height) {
      sizeEntry = { width: entry.height, height: entry.width, borderRadius: entry.borderRadius };
    }

    const sizeMap: Record<string, { width: number; height: number; borderRadius: string | number }> = {
      ...baseSizeMap,
      ...(sizeEntry !== entry ? { [tool]: sizeEntry } : {}),
    };

    const iconMap: Record<string, React.ReactNode> = {
      zone: <MapPin size={24} />,
      "table-square": <Square size={24} />,
      "table-round": <Circle size={24} />,
      "table-rect": <Rectangle size={24} />,
      wall: <WallIcon size={24} />,
      "wall-l": <span style={{ fontSize: 16, fontWeight: 700 }}>L</span>,
      "wall-t": <span style={{ fontSize: 16, fontWeight: 700 }}>T</span>,
      "wall-cross": <span style={{ fontSize: 16, fontWeight: 700 }}>+</span>,
      shelf: <span style={{ fontSize: 12, fontWeight: 600 }}>═══</span>,
      door: <Door size={24} />,
      counter: <ForkKnife size={24} />,
      bar: <Wine size={24} />,
      decoration: <Armchair size={24} />,
    };

    const colorMap: Record<string, { bg: string; border: string }> = {
      zone: { bg: "rgba(34, 197, 94, 0.1)", border: "rgba(34, 197, 94, 0.5)" },
      "table-square": { bg: "rgba(34, 197, 94, 0.15)", border: "rgba(34, 197, 94, 0.5)" },
      "table-round": { bg: "rgba(34, 197, 94, 0.15)", border: "rgba(34, 197, 94, 0.5)" },
      "table-rect": { bg: "rgba(34, 197, 94, 0.15)", border: "rgba(34, 197, 94, 0.5)" },
      wall: { bg: "rgba(55, 65, 81, 0.15)", border: "rgba(55, 65, 81, 0.5)" },
      "wall-l": { bg: "rgba(55, 65, 81, 0.15)", border: "rgba(55, 65, 81, 0.5)" },
      "wall-t": { bg: "rgba(55, 65, 81, 0.15)", border: "rgba(55, 65, 81, 0.5)" },
      "wall-cross": { bg: "rgba(55, 65, 81, 0.15)", border: "rgba(55, 65, 81, 0.5)" },
      shelf: { bg: "rgba(254, 243, 199, 0.5)", border: "rgba(146, 64, 14, 0.5)" },
      door: { bg: "rgba(254, 243, 199, 0.5)", border: "rgba(217, 119, 6, 0.5)" },
      counter: { bg: "rgba(219, 234, 254, 0.5)", border: "rgba(59, 130, 246, 0.5)" },
      bar: { bg: "rgba(250, 232, 255, 0.5)", border: "rgba(192, 38, 211, 0.5)" },
      decoration: { bg: "rgba(240, 253, 244, 0.5)", border: "rgba(34, 197, 94, 0.5)" },
    };

    return {
      size: sizeMap[tool],
      icon: iconMap[tool],
      color: colorMap[tool],
    };
  }, [orientation]);

  // Gerer le mouvement de la souris sur le canvas pour le ghost
  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;

      // Gérer le panning (Espace + drag)
      if (isPanning) {
        const deltaX = e.clientX - panStartRef.current.x;
        const deltaY = e.clientY - panStartRef.current.y;
        setPan({
          x: panStartRef.current.panX + deltaX,
          y: panStartRef.current.panY + deltaY,
        });
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;

      // Gérer la rotation libre si active
      if (isRotating) {
        const el = getSelectedElementCorners();
        if (!el) return;

        const centerX = el.x + el.width / 2;
        const centerY = el.y + el.height / 2;

        const currentAngle = Math.atan2(mouseY - centerY, mouseX - centerX) * (180 / Math.PI);
        const deltaAngle = currentAngle - rotationStartAngleRef.current;
        let newRotation = rotationStartElementAngleRef.current + deltaAngle;

        // Normaliser à [0, 360)
        newRotation = ((newRotation % 360) + 360) % 360;

        // Snap angulaire
        if (e.shiftKey) {
          // Shift maintenu : snap à 15° incréments
          newRotation = Math.round(newRotation / 15) * 15;
        } else {
          // Snap aux angles courants (0°, 45°, 90°, ...) avec ±5° de tolérance
          const snapAngles = [0, 45, 90, 135, 180, 225, 270, 315];
          for (const snapAngle of snapAngles) {
            if (Math.abs(newRotation - snapAngle) <= 5 || Math.abs(newRotation - snapAngle - 360) <= 5) {
              newRotation = snapAngle;
              break;
            }
          }
        }

        // Appliquer la rotation à l'élément sélectionné
        if (el.type === "decor" && selectedDecorId) {
          const newElements = decorElements.map((dec) =>
            dec.id === selectedDecorId ? { ...dec, rotation: newRotation } : dec
          );
          setDecorElements(newElements);
        } else if (el.type === "table" && editSelectedTableId) {
          setTableRotations((prev) => ({
            ...prev,
            [editSelectedTableId]: newRotation,
          }));
        }
        return;
      }

      // Gérer le resize si actif
      if (resizing) {
        handleMouseMove(e);
        return;
      }

      // Gérer le déplacement direct si actif
      if (dragging) {
        const rawX = mouseX - dragging.offsetX;
        const rawY = mouseY - dragging.offsetY;

        // Déterminer les dimensions de l'élément en cours de drag
        let movingWidth = 80;
        let movingHeight = 80;
        if (dragging.type === "decor") {
          const element = decorElements.find((el) => el.id === dragging.id);
          if (!element) return;
          const dims = getEffectiveDimensions(element);
          movingWidth = dims.width;
          movingHeight = dims.height;
        } else if (dragging.type === "table") {
          const table = tables.find((t) => t.id === dragging.id);
          if (table) {
            movingWidth = table.largeur || 80;
            movingHeight = table.hauteur || 80;
          }
        } else if (dragging.type === "zone") {
          const zone = zones.find((z) => z.id === dragging.id);
          if (zone) {
            movingWidth = zone.width;
            movingHeight = zone.height;
          }
        }

        // 1. Snap inter-éléments (priorité sur la grille)
        const allRects = collectAllElementRects();
        const movingRect: SnapElementRect = {
          id: dragging.id,
          x: rawX,
          y: rawY,
          width: movingWidth,
          height: movingHeight,
        };
        const elementSnap = snapToElements(movingRect, allRects, 5);

        // 2. Si pas de snap éléments, fallback sur la grille
        let finalX = elementSnap.snappedX ? elementSnap.x : rawX;
        let finalY = elementSnap.snappedY ? elementSnap.y : rawY;
        if (!elementSnap.snappedX || !elementSnap.snappedY) {
          const gridSnapped = snapPositionIfEnabled(
            elementSnap.snappedX ? elementSnap.x : rawX,
            elementSnap.snappedY ? elementSnap.y : rawY,
            gridSize,
            snapEnabled
          );
          if (!elementSnap.snappedX) finalX = gridSnapped.x;
          if (!elementSnap.snappedY) finalY = gridSnapped.y;
        }

        // 3. Détecter les guides d'alignement
        const guidesRect: ElementRect = {
          id: dragging.id,
          x: finalX,
          y: finalY,
          width: movingWidth,
          height: movingHeight,
        };
        const guides = detectAlignmentGuides(guidesRect, allRects, 5);
        setActiveGuides(guides);

        // 4. Appliquer la position finale
        const primaryNewX = Math.max(0, finalX);
        const primaryNewY = Math.max(0, finalY);

        // Déplacement groupé : si l'élément draggé est dans une multi-sélection
        const isGroupDrag = selectedIds.has(dragging.id) && selectedIds.size > 1;
        const groupOffsets = dragGroupOffsetsRef.current;

        if (dragging.type === "decor") {
          const newElements = decorElements.map((el) => {
            if (el.id === dragging.id) {
              return { ...el, x: primaryNewX, y: primaryNewY };
            }
            // Déplacer les autres éléments du groupe
            if (isGroupDrag && groupOffsets[el.id]) {
              return {
                ...el,
                x: Math.max(0, primaryNewX + groupOffsets[el.id].dx),
                y: Math.max(0, primaryNewY + groupOffsets[el.id].dy),
              };
            }
            return el;
          });
          setDecorElements(newElements);

          // Déplacer aussi les tables du groupe
          if (isGroupDrag) {
            const tableUpdates: Record<string, { x: number; y: number }> = {};
            for (const sid of selectedIds) {
              if (sid === dragging.id) continue;
              if (groupOffsets[sid] && tables.some((t) => t.id === sid)) {
                tableUpdates[sid] = {
                  x: Math.max(0, primaryNewX + groupOffsets[sid].dx),
                  y: Math.max(0, primaryNewY + groupOffsets[sid].dy),
                };
              }
            }
            if (Object.keys(tableUpdates).length > 0) {
              setPositions((prev) => ({ ...prev, ...tableUpdates }));
            }
          }
        } else if (dragging.type === "table") {
          const tableUpdates: Record<string, { x: number; y: number }> = {
            [dragging.id]: { x: primaryNewX, y: primaryNewY },
          };

          // Déplacer les autres tables du groupe
          if (isGroupDrag) {
            for (const sid of selectedIds) {
              if (sid === dragging.id) continue;
              if (groupOffsets[sid] && tables.some((t) => t.id === sid)) {
                tableUpdates[sid] = {
                  x: Math.max(0, primaryNewX + groupOffsets[sid].dx),
                  y: Math.max(0, primaryNewY + groupOffsets[sid].dy),
                };
              }
            }
          }
          setPositions((prev) => ({ ...prev, ...tableUpdates }));

          // Déplacer aussi les décors du groupe
          if (isGroupDrag) {
            const decorIdsToMove = [...selectedIds].filter(
              (sid) => sid !== dragging.id && groupOffsets[sid] && decorElements.some((el) => el.id === sid)
            );
            if (decorIdsToMove.length > 0) {
              const newElements = decorElements.map((el) => {
                if (decorIdsToMove.includes(el.id) && groupOffsets[el.id]) {
                  return {
                    ...el,
                    x: Math.max(0, primaryNewX + groupOffsets[el.id].dx),
                    y: Math.max(0, primaryNewY + groupOffsets[el.id].dy),
                  };
                }
                return el;
              });
              setDecorElements(newElements);
            }
          }
        } else if (dragging.type === "zone") {
          const newX = Math.max(0, Math.min(finalX, rect.width / zoom - movingWidth));
          const newY = Math.max(0, Math.min(finalY, rect.height / zoom - movingHeight));
          const zone = zones.find((z) => z.id === dragging.id);
          setZonePositions((prev) => ({
            ...prev,
            [dragging.id]: {
              x: newX,
              y: newY,
              width: prev[dragging.id]?.width ?? zone?.width ?? 200,
              height: prev[dragging.id]?.height ?? zone?.height ?? 150,
            },
          }));
        }
        return;
      }

      // Mettre à jour le dessin en cours (clic-glisser pour créer un élément)
      if (drawing) {
        const snapped = snapPositionIfEnabled(mouseX, mouseY, gridSize, snapEnabled);
        setDrawing((prev) => prev ? { ...prev, currentX: snapped.x, currentY: snapped.y } : null);
        return;
      }

      // Mettre à jour la sélection par zone (marquee)
      if (marquee) {
        setMarquee((prev) => prev ? { ...prev, currentX: mouseX, currentY: mouseY } : null);
        return;
      }

      // Mettre a jour la position du ghost preview si un outil de creation est actif
      if (isEditMode && activeTool !== "select") {
        setMousePosition({ x: mouseX, y: mouseY });
      }

      // Détecter la proximité aux coins pour la rotation
      if (isEditMode && activeTool === "select" && (selectedDecorId || editSelectedTableId)) {
        const corner = detectCornerProximity(mouseX, mouseY);
        setHoveredRotationCorner(corner);
      } else {
        setHoveredRotationCorner(null);
      }
    },
    [
      isEditMode,
      activeTool,
      zoom,
      resizing,
      handleMouseMove,
      dragging,
      decorElements,
      setDecorElements,
      tables,
      zones,
      gridSize,
      snapEnabled,
      isPanning,
      pan,
      selectedDecorId,
      editSelectedTableId,
      detectCornerProximity,
      isRotating,
      getSelectedElementCorners,
      collectAllElementRects,
      drawing,
      marquee,
      selectedIds,
    ]
  );

  // Reset mouse position quand on quitte le canvas
  const handleCanvasMouseLeave = useCallback(() => {
    setMousePosition(null);
    setHoveredRotationCorner(null);
    setActiveGuides([]);
    if (drawing) setDrawing(null);
    if (marquee) setMarquee(null);
    handleMouseUp();
  }, [handleMouseUp]);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--color-panel-solid)",
        borderRadius: 12,
        border: "1px solid var(--gray-a5)",
        overflow: "hidden",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          borderBottom: "1px solid var(--gray-a5)",
          backgroundColor: "var(--gray-a2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isEditMode ? (
            <>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 6,
                  backgroundColor: "var(--accent-a3)",
                  color: "var(--accent-11)",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <Plus size={12} />
                Mode édition
              </span>
              <span style={{ fontSize: 13, color: "var(--gray-10)" }}>
                Cliquez sur le plan pour ajouter des éléments
              </span>
            </>
          ) : (
            <span style={{ fontSize: 13, color: "var(--gray-10)" }}>
              Cliquez sur une table pour voir les détails
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Undo/Redo controls (only in edit mode) */}
          {isEditMode ? (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Tooltip content="Annuler (Ctrl+Z)">
                <IconButton
                  size="2"
                  variant="ghost"
                  color="gray"
                  disabled={!canUndo}
                  onClick={undo}
                  aria-label="Annuler"
                >
                  <ArrowCounterClockwise size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip content="Refaire (Ctrl+Y)">
                <IconButton
                  size="2"
                  variant="ghost"
                  color="gray"
                  disabled={!canRedo}
                  onClick={redo}
                  aria-label="Refaire"
                >
                  <ArrowClockwise size={16} />
                </IconButton>
              </Tooltip>
              <Separator
                orientation="vertical"
                size="1"
                style={{ height: 24, marginLeft: 8, marginRight: 4 }}
              />
            </div>
          ) : null}

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
              disabled={zoom <= 0.5}
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                border: "none",
                backgroundColor: "transparent",
                cursor: zoom <= 0.5 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: zoom <= 0.5 ? "var(--gray-8)" : "var(--gray-11)",
                transition: "background-color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (zoom > 0.5) e.currentTarget.style.backgroundColor = "var(--gray-a4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <MagnifyingGlassMinus size={16} />
            </button>
            <span
              style={{
                minWidth: 52,
                textAlign: "center",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--gray-12)",
                fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
              }}
            >
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 2}
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                border: "none",
                backgroundColor: "transparent",
                cursor: zoom >= 2 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: zoom >= 2 ? "var(--gray-8)" : "var(--gray-11)",
                transition: "background-color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (zoom < 2) e.currentTarget.style.backgroundColor = "var(--gray-a4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <MagnifyingGlassPlus size={16} />
            </button>
          </div>

          {/* Edit mode toggle */}
          {isEditMode ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Auto-save status indicator */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                  fontWeight: 500,
                  color:
                    autoSaveStatus === "saving"
                      ? "var(--accent-11)"
                      : autoSaveStatus === "saved"
                        ? "var(--green-11)"
                        : autoSaveStatus === "error"
                          ? "var(--red-11)"
                          : "var(--gray-9)",
                  transition: "color 0.2s",
                }}
              >
                {autoSaveStatus === "saving" && (
                  <>
                    <SpinnerGap size={14} className="animate-spin" />
                    Sauvegarde...
                  </>
                )}
                {autoSaveStatus === "saved" && (
                  <>
                    <CloudCheck size={14} />
                    Sauvegarde
                  </>
                )}
                {autoSaveStatus === "error" && (
                  <>
                    <CloudSlash size={14} />
                    Erreur
                  </>
                )}
              </span>

              <button
                onClick={handleExitEditMode}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--gray-a6)",
                  backgroundColor: "transparent",
                  color: "var(--gray-11)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                <SignOut size={14} />
                Quitter l'edition
              </button>
            </div>
          ) : (
            <Tooltip
              content={
                readOnly
                  ? "Seuls les managers et administrateurs peuvent modifier le plan"
                  : undefined
              }
            >
              <button
                onClick={() => {
                  if (!readOnly) {
                    setIsEditMode(true);
                    setActiveTool("select");
                  }
                }}
                disabled={readOnly}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: readOnly ? "var(--gray-a3)" : "var(--gray-a4)",
                  color: readOnly ? "var(--gray-9)" : "var(--gray-12)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: readOnly ? "not-allowed" : "pointer",
                  opacity: readOnly ? 0.6 : 1,
                }}
              >
                <PencilSimple size={14} />
                Modifier le plan
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Main content with toolbar */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
        {/* Left toolbar (only in edit mode) */}
        {isEditMode ? (
          <div
            style={{
              padding: 12,
              borderRight: "1px solid var(--gray-a5)",
              overflowY: "auto",
              overflowX: "hidden",
              flexShrink: 0,
            }}
          >
            <FloorPlanToolbar
              activeTool={activeTool}
              onToolChange={setActiveTool}
              onDeleteSelected={handleDeleteSelected}
              hasSelection={!!selectedDecorId || !!selectedZoneId || !!editSelectedTableId}
              isEditMode={isEditMode}
              snapEnabled={snapEnabled}
              onSnapToggle={setSnapEnabled}
              gridSize={gridSize}
              onGridSizeChange={setGridSize}
              orientation={orientation}
              onOrientationChange={setOrientation}
            />
          </div>
        ) : null}

        {/* Floor plan canvas */}
        <div
          ref={containerRef}
          onMouseDown={(e) => {
            // Priorité au pan (Espace + clic)
            if (handlePanStart(e)) return;
            // Démarrer le dessin d'un élément décor (clic-glisser)
            handleDrawStart(e);
            // Démarrer la sélection par zone (marquee) en mode select sur canvas vide
            if (isEditMode && activeTool === "select" && !hoveredRotationCorner && containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              const mx = (e.clientX - rect.left - pan.x) / zoom;
              const my = (e.clientY - rect.top - pan.y) / zoom;
              setMarquee({ startX: mx, startY: my, currentX: mx, currentY: my });
            }
          }}
          onClick={(e) => {
            // Ne pas traiter le clic si on vient de finir un drag, pan, dessin ou marquee
            if (dragging || isPanning || drawing || marqueeJustEndedRef.current || elementClickedRef.current) return;
            // Rotation par clic sur un coin
            if (hoveredRotationCorner) {
              if (selectedDecorId) {
                rotateElement(90);
              } else if (editSelectedTableId) {
                rotateTable(editSelectedTableId, 90);
              }
              return;
            }
            // Clic sur le canvas vide en mode select : vider la sélection
            if (isEditMode && activeTool === "select") {
              setSelectedIds(new Set());
              setSelectedDecorId(null);
              setEditSelectedTableId(null);
              setSelectedZoneId(null);
            }
            handleCanvasClick(e);
            if (contextMenu) closeContextMenu();
          }}
          onContextMenu={(e) => {
            // Rotation inverse par clic droit sur un coin
            if (hoveredRotationCorner && isEditMode) {
              e.preventDefault();
              if (selectedDecorId) {
                rotateElement(-90);
              } else if (editSelectedTableId) {
                rotateTable(editSelectedTableId, -90);
              }
              return;
            }
          }}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleCanvasMouseLeave}
          onWheel={handleWheel}
          style={{
            flex: 1,
            position: "relative",
            minHeight: 400,
            overflow: "hidden",
            backgroundColor: "var(--gray-2)",
            cursor: isPanning
              ? "grabbing"
              : isSpacePressed
                ? "grab"
                : isRotating
                  ? "grabbing"
                  : dragging || resizing
                    ? "grabbing"
                    : hoveredRotationCorner
                      ? "alias"
                      : isEditMode && isAltPressed
                        ? "copy"
                        : isEditMode && activeTool !== "select"
                          ? "crosshair"
                          : "default",
          }}
        >
          {/* Grille visuelle (dots) - derrière tout */}
          <FloorPlanGrid
            gridSize={gridSize}
            zoom={zoom}
            pan={pan}
            canvasWidth={containerRef.current?.clientWidth ?? 0}
            canvasHeight={containerRef.current?.clientHeight ?? 0}
            visible={!!(isEditMode && snapEnabled)}
          />

          {/* Smart guides d'alignement - au-dessus des éléments, sous les handles */}
          <SmartGuides
            guides={activeGuides}
            zoom={zoom}
            pan={pan}
            canvasWidth={containerRef.current?.clientWidth ?? 0}
            canvasHeight={containerRef.current?.clientHeight ?? 0}
          />

          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "top left",
              transition: isPanning ? "none" : "transform 0.1s ease-out",
            }}
          >
            {/* Rectangle de sélection par zone (marquee) */}
            {marquee ? (() => {
              const mx = Math.min(marquee.startX, marquee.currentX);
              const my = Math.min(marquee.startY, marquee.currentY);
              const mw = Math.abs(marquee.currentX - marquee.startX);
              const mh = Math.abs(marquee.currentY - marquee.startY);
              if (mw < 3 && mh < 3) return null;
              return (
                <div
                  style={{
                    position: "absolute",
                    left: mx,
                    top: my,
                    width: mw,
                    height: mh,
                    backgroundColor: "rgba(59, 130, 246, 0.08)",
                    border: "1px dashed rgba(59, 130, 246, 0.6)",
                    borderRadius: 2,
                    pointerEvents: "none",
                    zIndex: 9999,
                  }}
                />
              );
            })() : null}

            {/* Preview de dessin en cours (clic-glisser pour créer un élément) */}
            {drawing ? (() => {
              const x = Math.min(drawing.startX, drawing.currentX);
              const y = Math.min(drawing.startY, drawing.currentY);
              const w = Math.abs(drawing.currentX - drawing.startX);
              const h = Math.abs(drawing.currentY - drawing.startY);
              const config = getGhostPreviewConfig(activeTool);
              const isSmall = w < drawingThreshold && h < drawingThreshold;

              return (
                <div
                  style={{
                    position: "absolute",
                    left: x,
                    top: y,
                    width: Math.max(w, 2),
                    height: Math.max(h, 2),
                    backgroundColor: config.color?.bg || "rgba(249, 115, 22, 0.15)",
                    border: `2px ${isSmall ? "dashed" : "solid"} ${config.color?.border || "rgba(249, 115, 22, 0.5)"}`,
                    borderRadius: 2,
                    pointerEvents: "none",
                    opacity: 0.9,
                    zIndex: 1000,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: config.color?.border || "var(--accent-9)",
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  {!isSmall ? `${Math.round(w)}×${Math.round(h)}` : config.icon}
                </div>
              );
            })() : null}

            {/* Ghost preview pour l'outil de creation actif (quand pas en dessin) */}
            {isEditMode && activeTool !== "select" && mousePosition && !drawing
              ? (() => {
                  const config = getGhostPreviewConfig(activeTool);
                  if (!config.size) return null;

                  return (
                    <div
                      style={{
                        position: "absolute",
                        left: mousePosition.x - config.size.width / 2,
                        top: mousePosition.y - config.size.height / 2,
                        width: config.size.width,
                        height: config.size.height,
                        backgroundColor: config.color?.bg || "rgba(249, 115, 22, 0.15)",
                        border: `2px dashed ${config.color?.border || "rgba(249, 115, 22, 0.5)"}`,
                        borderRadius: config.size.borderRadius,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                        opacity: 0.8,
                        color: config.color?.border || "var(--accent-9)",
                        zIndex: 1000,
                      }}
                    >
                      {config.icon}
                    </div>
                  );
                })()
              : null}

            {/* Zones (rendered first, behind everything) */}
            {zones.map((zone) => (
              <ZoneElement
                key={zone.id}
                zone={zone}
                isSelected={selectedZoneId === zone.id}
                isEditMode={isEditMode}
                isDragging={dragging?.type === "zone" && dragging.id === zone.id}
                onClick={() => {
                  if (isEditMode && !dragging) {
                    setSelectedZoneId(zone.id);
                    setSelectedDecorId(null);
                    setEditSelectedTableId(null);
                  }
                }}
                onMouseDown={(e) => handleZoneMouseDown(e, zone.id)}
                onResizeStart={(handle, e) => {
                  // Zone resize
                  setResizing({
                    elementId: zone.id,
                    handle,
                    startX: e.clientX,
                    startY: e.clientY,
                    startWidth: zone.width,
                    startHeight: zone.height,
                    startPosX: zone.x,
                    startPosY: zone.y,
                  });
                  setSelectedZoneId(zone.id);
                }}
                onDelete={async () => {
                  const result = await deleteZoneAction(zone.id);
                  if (result.success) {
                    setSelectedZoneId(null);
                    toast.success("Zone supprimée");
                    onRefresh?.();
                  } else {
                    toast.error(result.error || "Erreur lors de la suppression");
                  }
                }}
                onEdit={() => {
                  setEditingZone(zone);
                  setShowZoneDialog(true);
                }}
              />
            ))}

            {/* Decor elements (rendered second, behind tables) */}
            {decorElements.map((element) => (
              <DecorElement
                key={element.id}
                element={element}
                isSelected={selectedDecorId === element.id}
                isInMultiSelect={selectedIds.has(element.id) && selectedIds.size > 1}
                isEditMode={isEditMode}
                isDragging={dragging?.type === "decor" && dragging.id === element.id}
                onContextMenu={(e) => handleContextMenu(e, element.id)}
                onClick={isEditMode ? (e: React.MouseEvent) => e.stopPropagation() : undefined}
                onMouseDown={(e) => handleDecorMouseDown(e, element.id)}
                onResizeStart={(handle, e) => handleResizeStart(element.id, handle, e)}
                onRotate={(degrees) => {
                  const newElements = decorElements.map((el) => {
                    if (el.id === element.id) {
                      const currentRotation = el.rotation || 0;
                      let newRotation = (currentRotation + degrees) % 360;
                      if (newRotation < 0) newRotation += 360;

                      // Pour les murs droits et étagères, échange width/height
                      const isStraightWall = el.type === "wall" || el.type === "shelf";
                      if (
                        isStraightWall &&
                        (degrees === 90 || degrees === -90 || degrees === 270 || degrees === -270)
                      ) {
                        return {
                          ...el,
                          rotation: newRotation,
                          width: el.height,
                          height: el.width,
                        };
                      }

                      return { ...el, rotation: newRotation };
                    }
                    return el;
                  });
                  setDecorElements(newElements);
                  setHasChanges(true);
                }}
              />
            ))}

            {/* Tables */}
            {tables.map((table) => {
              const pos = getPosition(table);
              const venteEnCours = table.ventes[0] || null;

              const tableItem = (
                <TableItem
                  key={table.id}
                  id={table.id}
                  numero={table.numero}
                  capacite={table.capacite}
                  forme={table.forme as FormeTableType}
                  statut={table.statut as StatutTableType}
                  positionX={pos.x}
                  positionY={pos.y}
                  largeur={table.largeur || 80}
                  hauteur={table.hauteur || 80}
                  rotation={tableRotations[table.id] || 0}
                  venteEnCours={
                    venteEnCours
                      ? {
                          id: venteEnCours.id,
                          totalFinal:
                            typeof venteEnCours.totalFinal === "number"
                              ? venteEnCours.totalFinal
                              : venteEnCours.totalFinal.toNumber?.() || 0,
                          _count: venteEnCours._count,
                        }
                      : null
                  }
                  isSelected={
                    isEditMode ? editSelectedTableId === table.id : selectedTableId === table.id
                  }
                  isInMultiSelect={selectedIds.has(table.id) && selectedIds.size > 1}
                  isEditMode={isEditMode}
                  isDragging={dragging?.type === "table" && dragging.id === table.id}
                  onClick={(e: React.MouseEvent) => {
                    if (isEditMode) {
                      e.stopPropagation();
                      return;
                    }
                    if (!dragging) {
                      onTableSelect?.(table.id);
                    }
                  }}
                  onMouseDown={(e) => handleTableMouseDown(e, table.id)}
                  onRotate={(degrees) => rotateTable(table.id, degrees)}
                />
              );

              // En mode normal (non edition), entourer la table avec le context menu
              if (!isEditMode) {
                return (
                  <TableContextMenu
                    key={table.id}
                    tableId={table.id}
                    tableNumero={table.numero}
                    tableCapacite={table.capacite}
                    statut={table.statut as StatutTableType}
                    venteEnCours={
                      venteEnCours
                        ? {
                            id: venteEnCours.id,
                            numeroTicket: "",
                            totalFinal:
                              typeof venteEnCours.totalFinal === "number"
                                ? venteEnCours.totalFinal
                                : venteEnCours.totalFinal.toNumber?.() || 0,
                            _count: venteEnCours._count,
                          }
                        : null
                    }
                    otherTables={tables.map((t) => ({
                      id: t.id,
                      numero: t.numero,
                      statut: t.statut,
                    }))}
                    onRefresh={onRefresh}
                  >
                    {tableItem}
                  </TableContextMenu>
                );
              }

              return tableItem;
            })}

            {/* Poignées de rotation aux coins - uniquement pour les tables (les décors utilisent les poignées de resize) */}
            {isEditMode && editSelectedTableId
              ? (() => {
                  const el = getSelectedElementCorners();
                  if (!el) return null;

                  const corners = [
                    { key: "nw", cx: el.x - 8, cy: el.y - 8 },
                    { key: "ne", cx: el.x + el.width - 8, cy: el.y - 8 },
                    { key: "sw", cx: el.x - 8, cy: el.y + el.height - 8 },
                    { key: "se", cx: el.x + el.width - 8, cy: el.y + el.height - 8 },
                  ];

                  return corners.map(({ key, cx, cy }) => (
                    <div
                      key={`rot-${key}`}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        rotateTable(editSelectedTableId, 90);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        rotateTable(editSelectedTableId, -90);
                      }}
                      title="Clic: +90° | Clic droit: -90°"
                      style={{
                        position: "absolute",
                        left: cx,
                        top: cy,
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        backgroundColor:
                          hoveredRotationCorner === key ? "var(--accent-9)" : "transparent",
                        border:
                          hoveredRotationCorner === key
                            ? "2px solid white"
                            : "2px solid transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "alias",
                        zIndex: 100,
                        transition:
                          "background-color 0.12s, border-color 0.12s, box-shadow 0.12s, transform 0.12s",
                        boxShadow:
                          hoveredRotationCorner === key ? "0 2px 8px rgba(0,0,0,0.3)" : "none",
                        transform: hoveredRotationCorner === key ? "scale(1.5)" : "scale(1)",
                        pointerEvents: "auto",
                      }}
                    >
                      {hoveredRotationCorner === key && <ArrowClockwise size={10} color="white" />}
                    </div>
                  ));
                })()
              : null}

            {/* Poignée de rotation libre (drag-to-rotate) pour l'élément décor ou table sélectionné */}
            {isEditMode && (selectedDecorId || editSelectedTableId)
              ? (() => {
                  const el = getSelectedElementCorners();
                  if (!el) return null;
                  return (
                    <RotationHandle
                      elementX={el.x}
                      elementY={el.y}
                      elementWidth={el.width}
                      elementHeight={el.height}
                      elementRotation={el.rotation}
                      zoom={zoom}
                      onRotationStart={handleRotationStart}
                      isRotating={isRotating}
                    />
                  );
                })()
              : null}

            {/* Indicateur d'angle pour l'élément sélectionné (quand pas en rotation active - le RotationHandle a son propre badge) */}
            {isEditMode && !isRotating
              ? (() => {
                  const el = getSelectedElementCorners();
                  if (!el || el.rotation === 0) return null;
                  return (
                    <div
                      style={{
                        position: "absolute",
                        left: el.x + el.width / 2,
                        top: el.y - 22,
                        transform: "translateX(-50%)",
                        padding: "2px 6px",
                        backgroundColor: "var(--gray-12)",
                        color: "var(--gray-1)",
                        fontSize: 10,
                        fontWeight: 600,
                        fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                        borderRadius: 4,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                        zIndex: 100,
                        pointerEvents: "none",
                      }}
                    >
                      {el.rotation}°
                    </div>
                  );
                })()
              : null}

            {/* Empty state */}
            {tables.length === 0 && decorElements.length === 0 && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ color: "var(--gray-9)", fontSize: 14 }}>
                  {isEditMode
                    ? "Cliquez sur le plan pour ajouter des éléments"
                    : 'Aucune table. Cliquez sur "Modifier le plan" pour commencer.'}
                </span>
              </div>
            )}
          </div>

          {/* Indicateur des raccourcis de navigation */}
          <div
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              display: "flex",
              gap: 8,
              padding: "6px 10px",
              backgroundColor: "var(--gray-a2)",
              backdropFilter: "blur(8px)",
              borderRadius: 8,
              border: "1px solid var(--gray-a4)",
              fontSize: 11,
              color: "var(--gray-10)",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <kbd
                style={{
                  padding: "2px 5px",
                  backgroundColor: "var(--gray-a3)",
                  borderRadius: 4,
                  fontSize: 10,
                  fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                  border: "1px solid var(--gray-a5)",
                }}
              >
                Espace
              </kbd>
              <span>+</span>
              <span>clic</span>
              <span style={{ color: "var(--gray-8)", marginLeft: 2 }}>déplacer</span>
            </span>
            <span style={{ color: "var(--gray-a6)" }}>|</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <kbd
                style={{
                  padding: "2px 5px",
                  backgroundColor: "var(--gray-a3)",
                  borderRadius: 4,
                  fontSize: 10,
                  fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                  border: "1px solid var(--gray-a5)",
                }}
              >
                Alt
              </kbd>
              <span>+</span>
              <span>molette</span>
              <span style={{ color: "var(--gray-8)", marginLeft: 2 }}>zoom</span>
            </span>
            <span style={{ color: "var(--gray-a6)" }}>|</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <kbd
                style={{
                  padding: "2px 5px",
                  backgroundColor: "var(--gray-a3)",
                  borderRadius: 4,
                  fontSize: 10,
                  fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                  border: "1px solid var(--gray-a5)",
                }}
              >
                Alt
              </kbd>
              <span>+</span>
              <kbd
                style={{
                  padding: "2px 5px",
                  backgroundColor: "var(--gray-a3)",
                  borderRadius: 4,
                  fontSize: 10,
                  fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                  border: "1px solid var(--gray-a5)",
                }}
              >
                R
              </kbd>
              <span style={{ color: "var(--gray-8)", marginLeft: 2 }}>reset</span>
            </span>
          </div>
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && isEditMode ? (
        <ElementContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
          onRotateLeft={() => rotateElement(-90)}
          onRotateRight={() => rotateElement(90)}
          onRotate180={() => rotateElement(180)}
          onIncreaseSize={() => resizeElement(20, 20)}
          onDecreaseSize={() => resizeElement(-20, -20)}
          onIncreaseWidth={() => resizeElement(20, 0)}
          onIncreaseHeight={() => resizeElement(0, 20)}
          onDuplicate={duplicateElement}
          onDelete={handleDeleteSelected}
        />
      ) : null}

      {/* Zone creation/edit dialog */}
      {showZoneDialog ? (
        <ZoneCreationDialog
          editingZone={editingZone}
          onClose={() => {
            setShowZoneDialog(false);
            setPendingZonePosition(null);
            setEditingZone(null);
          }}
          onSave={async (nom, couleur) => {
            if (editingZone) {
              // Mode edition - utiliser l'action serveur
              const result = await updateZone(editingZone.id, { nom, couleur });
              if (result.success) {
                setShowZoneDialog(false);
                setEditingZone(null);
                toast.success(`Zone "${nom}" mise à jour`);
                onRefresh?.();
              } else {
                toast.error(result.error || "Erreur lors de la mise à jour");
              }
            } else if (pendingZonePosition) {
              // Mode creation - utiliser l'action serveur
              const result = await createZone({
                nom,
                couleur,
                position_x: pendingZonePosition.x,
                position_y: pendingZonePosition.y,
                largeur: 200,
                hauteur: 150,
              });
              if (result.success && result.data) {
                setSelectedZoneId(result.data.id);
                setShowZoneDialog(false);
                setPendingZonePosition(null);
                toast.success(`Zone "${nom}" créée`);
                onRefresh?.();
              } else {
                toast.error(result.error || "Erreur lors de la création");
              }
            }
          }}
        />
      ) : null}
    </div>
  );
}

/**
 * Dialog de création/édition de zone
 */
function ZoneCreationDialog({
  onClose,
  onCreate,
  editingZone,
  onSave,
}: {
  onClose: () => void;
  onCreate?: (nom: string, couleur: string) => void;
  editingZone?: ZoneData | null;
  onSave?: (nom: string, couleur: string) => void;
}) {
  const [nom, setNom] = useState(editingZone?.nom || "");
  const [couleur, setCouleur] = useState(editingZone?.couleur || ZONE_COLORS[0].value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) {
      toast.error("Le nom de la zone est requis");
      return;
    }
    if (editingZone && onSave) {
      onSave(nom.trim(), couleur);
    } else if (onCreate) {
      onCreate(nom.trim(), couleur);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--color-panel-solid)",
          borderRadius: 12,
          width: "90%",
          maxWidth: 380,
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "16px 20px",
            borderBottom: "1px solid var(--gray-a6)",
          }}
        >
          <MapPin size={20} style={{ color: couleur }} />
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--gray-12)" }}>
            Nouvelle zone
          </h3>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Nom */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--gray-11)",
                  marginBottom: 6,
                }}
              >
                Nom de la zone *
              </label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Terrasse, Salle principale, Bar..."
                autoFocus
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: 14,
                  borderRadius: 8,
                  border: "1px solid var(--gray-a6)",
                  backgroundColor: "var(--gray-a2)",
                  color: "var(--gray-12)",
                  outline: "none",
                }}
              />
            </div>

            {/* Couleur */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--gray-11)",
                  marginBottom: 8,
                }}
              >
                Couleur
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {ZONE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCouleur(c.value)}
                    title={c.name}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      backgroundColor: c.value,
                      border:
                        couleur === c.value ? "3px solid var(--gray-12)" : "2px solid transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "transform 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    {couleur === c.value && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                backgroundColor: `${couleur}15`,
                border: `2px dashed ${couleur}80`,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  backgroundColor: `${couleur}e6`,
                  color: "white",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <MapPin size={12} />
                {nom || "Nom de la zone"}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              gap: 10,
              padding: "12px 20px",
              borderTop: "1px solid var(--gray-a6)",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "10px 16px",
                fontSize: 14,
                fontWeight: 500,
                color: "var(--gray-12)",
                backgroundColor: "transparent",
                border: "1px solid var(--gray-a6)",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: "10px 16px",
                fontSize: 14,
                fontWeight: 600,
                color: "white",
                backgroundColor: couleur,
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Créer la zone
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
