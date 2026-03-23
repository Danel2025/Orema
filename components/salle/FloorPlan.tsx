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
import { FloorPlanToolbar, type ToolType } from "./FloorPlanToolbar";
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
  updateZonesPositions,
  updateTablesPositions,
} from "@/actions/tables";
import { ElementContextMenu } from "./ElementContextMenu";
import { TableContextMenu } from "./TableContextMenu";

import { useFloorPlanHistory } from "@/hooks/useFloorPlanHistory";
import { useFloorPlanKeyboard } from "@/hooks/useFloorPlanKeyboard";
import type { StatutTableType, FormeTableType } from "@/schemas/table.schema";
import {
  snapPositionIfEnabled,
  snapDimensions,
  DEFAULT_GRID_SIZE,
  type GridSize,
} from "@/lib/floorplan/snap-to-grid";

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

  // Utiliser le hook d'historique pour les éléments de décor
  const { decorElements, setDecorElements, undo, redo, canUndo, canRedo } = useFloorPlanHistory();

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

      setDragging({
        type: "decor",
        id: decorId,
        offsetX: mouseX - element.x,
        offsetY: mouseY - element.y,
      });
      setSelectedDecorId(decorId);
      setSelectedZoneId(null);
    },
    [isEditMode, decorElements, setDecorElements, zoom, pan, isSpacePressed]
  );

  // Démarrer le déplacement direct d'une table
  // Alt+Click = dupliquer la table (ouvre le formulaire pré-rempli à la position du clic)
  const handleTableMouseDown = useCallback(
    (e: React.MouseEvent, tableId: string) => {
      if (!isEditMode || isSpacePressed) return;
      e.preventDefault();
      e.stopPropagation();

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

      setDragging({
        type: "table",
        id: tableId,
        offsetX: mouseX - pos.x,
        offsetY: mouseY - pos.y,
      });
      setDraggedTable(tableId);
      setEditSelectedTableId(tableId);
      setSelectedDecorId(null);
      setSelectedZoneId(null);
    },
    [isEditMode, tables, positions, zoom, pan, isSpacePressed, onAddTable]
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

  // Ajouter un élément de décor
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isEditMode || activeTool === "select") return;
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const rawX = (e.clientX - rect.left - pan.x) / zoom - 40;
      const rawY = (e.clientY - rect.top - pan.y) / zoom - 40;

      // Appliquer le snap si active
      const snapped = snapPositionIfEnabled(rawX, rawY, gridSize, snapEnabled);

      // Si c'est un outil de table, déclencher l'ajout de table avec la position
      if (activeTool.startsWith("table-")) {
        const formeMap: Record<string, "CARREE" | "RONDE" | "RECTANGULAIRE"> = {
          "table-square": "CARREE",
          "table-round": "RONDE",
          "table-rect": "RECTANGULAIRE",
        };
        onAddTable?.(formeMap[activeTool], Math.round(snapped.x), Math.round(snapped.y));
        return;
      }

      // Si c'est l'outil zone, ouvrir le dialog de création
      if (activeTool === "zone") {
        setPendingZonePosition({ x: snapped.x, y: snapped.y });
        setShowZoneDialog(true);
        return;
      }

      // Sinon, ajouter un élément de décor
      const typeMap: Record<string, DecorType> = {
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

      const sizeMap: Record<DecorType, { width: number; height: number }> = {
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

      const type = typeMap[activeTool];
      if (!type) return;

      const size = sizeMap[type];

      // Snap les dimensions si active
      const snappedSize = snapEnabled
        ? snapDimensions(size.width, size.height, gridSize, 30, 10)
        : size;

      const newElement: DecorElementData = {
        id: `decor-${Date.now()}`,
        type,
        x: Math.max(0, snapped.x),
        y: Math.max(0, snapped.y),
        width: snappedSize.width,
        height: snappedSize.height,
        label: type === "wall" ? undefined : type.charAt(0).toUpperCase() + type.slice(1),
      };

      const newElements = [...decorElements, newElement];
      setDecorElements(newElements);
      setHasChanges(true);
      setSelectedDecorId(newElement.id);
    },
    [
      isEditMode,
      activeTool,
      zoom,
      decorElements,
      setDecorElements,
      onAddTable,
      gridSize,
      snapEnabled,
      pan,
    ]
  );

  // Supprimer l'élément sélectionné (zone ou decor)
  const handleDeleteSelected = useCallback(async () => {
    if (selectedZoneId) {
      // Supprimer la zone via l'action serveur
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
    if (selectedDecorId) {
      const newElements = decorElements.filter((el) => el.id !== selectedDecorId);
      setDecorElements(newElements);
      setSelectedDecorId(null);
      setHasChanges(true);
    }
  }, [selectedDecorId, selectedZoneId, decorElements, setDecorElements, onRefresh]);

  // Menu contextuel
  const handleContextMenu = useCallback((e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    setSelectedDecorId(elementId);
    setContextMenu({ x: e.clientX, y: e.clientY, elementId });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

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
            width: Math.max(30, el.width + widthDelta),
            height: Math.max(10, el.height + heightDelta),
          };
        }
        return el;
      });
      setDecorElements(newElements);
      setHasChanges(true);
    },
    [selectedDecorId, decorElements, setDecorElements]
  );

  // Dupliquer
  const duplicateElement = useCallback(() => {
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
    setHasChanges(true);
  }, [selectedDecorId, decorElements, setDecorElements]);

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

  // Déplacer l'élément sélectionné
  const moveElement = useCallback(
    (deltaX: number, deltaY: number) => {
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
    [selectedDecorId, decorElements, setDecorElements]
  );

  // Désélectionner / quitter mode édition
  const handleEscape = useCallback(() => {
    if (selectedDecorId) {
      setSelectedDecorId(null);
    } else if (editSelectedTableId) {
      setEditSelectedTableId(null);
    } else if (selectedZoneId) {
      setSelectedZoneId(null);
    } else if (activeTool !== "select") {
      setActiveTool("select");
    }
  }, [selectedDecorId, editSelectedTableId, selectedZoneId, activeTool]);

  // Rotation unifiée : décor ou table selon la sélection
  const handleRotateSelected = useCallback(
    (degrees: number) => {
      if (selectedDecorId) {
        rotateElement(degrees);
      } else if (editSelectedTableId) {
        rotateTable(editSelectedTableId, degrees);
      }
    },
    [selectedDecorId, editSelectedTableId, rotateElement, rotateTable]
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
    },
    {
      enabled: isEditMode && !isPanning,
      moveStep: snapEnabled ? gridSize : 1,
      fastMoveStep: snapEnabled ? gridSize * 2 : 10,
    }
  );

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

  // (resetView défini plus haut)

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
            newWidth = Math.max(30, resizing.startWidth + deltaX);
            break;
          case "bottom":
            newHeight = Math.max(10, resizing.startHeight + deltaY);
            break;
          case "left":
            newWidth = Math.max(30, resizing.startWidth - deltaX);
            newX = resizing.startPosX + (resizing.startWidth - newWidth);
            break;
          case "top":
            newHeight = Math.max(10, resizing.startHeight - deltaY);
            newY = resizing.startPosY + (resizing.startHeight - newHeight);
            break;
          case "bottom-right":
            newWidth = Math.max(30, resizing.startWidth + deltaX);
            newHeight = Math.max(10, resizing.startHeight + deltaY);
            break;
          case "bottom-left":
            newWidth = Math.max(30, resizing.startWidth - deltaX);
            newX = resizing.startPosX + (resizing.startWidth - newWidth);
            newHeight = Math.max(10, resizing.startHeight + deltaY);
            break;
          case "top-right":
            newWidth = Math.max(30, resizing.startWidth + deltaX);
            newHeight = Math.max(10, resizing.startHeight - deltaY);
            newY = resizing.startPosY + (resizing.startHeight - newHeight);
            break;
          case "top-left":
            newWidth = Math.max(30, resizing.startWidth - deltaX);
            newX = resizing.startPosX + (resizing.startWidth - newWidth);
            newHeight = Math.max(10, resizing.startHeight - deltaY);
            newY = resizing.startPosY + (resizing.startHeight - newHeight);
            break;
        }

        // Appliquer le snap-to-grid si activé
        if (snapEnabled) {
          const snappedPos = snapPositionIfEnabled(newX, newY, gridSize, snapEnabled);
          const snappedDims = snapDimensions(newWidth, newHeight, gridSize, 30, 10);
          newX = snappedPos.x;
          newY = snappedPos.y;
          newWidth = snappedDims.width;
          newHeight = snappedDims.height;
        }

        return { ...el, width: newWidth, height: newHeight, x: newX, y: newY };
      });

      setDecorElements(newElements);
    },
    [resizing, decorElements, zoom, snapEnabled, gridSize]
  );

  // Terminer le redimensionnement
  const handleMouseUp = useCallback(() => {
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
    }
    if (dragging) {
      setHasChanges(true);
      setDragging(null);
      setDraggedTable(null);
    }
    if (isPanning) {
      setIsPanning(false);
    }
  }, [
    resizing,
    dragging,
    isPanning,
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

  // Configuration du ghost preview selon l'outil actif
  const getGhostPreviewConfig = useCallback((tool: ToolType) => {
    const sizeMap: Record<
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
  }, []);

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

      // Gerer le resize si actif
      if (resizing) {
        handleMouseMove(e);
        return;
      }

      // Gerer le déplacement direct si actif
      if (dragging) {
        const rawX = mouseX - dragging.offsetX;
        const rawY = mouseY - dragging.offsetY;

        // Appliquer le snap si activé
        const snapped = snapPositionIfEnabled(rawX, rawY, gridSize, snapEnabled);

        if (dragging.type === "decor") {
          const element = decorElements.find((el) => el.id === dragging.id);
          if (!element) return;

          // Limiter aux bordures
          const newX = Math.max(0, Math.min(snapped.x, rect.width / zoom - element.width));
          const newY = Math.max(0, Math.min(snapped.y, rect.height / zoom - element.height));

          // Mettre à jour directement la position
          const newElements = decorElements.map((el) =>
            el.id === dragging.id ? { ...el, x: newX, y: newY } : el
          );
          setDecorElements(newElements);
        } else if (dragging.type === "table") {
          // Limiter aux bordures
          const newX = Math.max(0, Math.min(snapped.x, rect.width / zoom - 80));
          const newY = Math.max(0, Math.min(snapped.y, rect.height / zoom - 80));

          setPositions((prev) => ({
            ...prev,
            [dragging.id]: { x: newX, y: newY },
          }));
        } else if (dragging.type === "zone") {
          const zone = zones.find((z) => z.id === dragging.id);
          if (!zone) return;

          const newX = Math.max(0, Math.min(snapped.x, rect.width / zoom - zone.width));
          const newY = Math.max(0, Math.min(snapped.y, rect.height / zoom - zone.height));

          // Stocker la position locale pour le drag
          setZonePositions((prev) => ({
            ...prev,
            [dragging.id]: {
              x: newX,
              y: newY,
              width: prev[dragging.id]?.width ?? zone.width,
              height: prev[dragging.id]?.height ?? zone.height,
            },
          }));
        }
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
      gridSize,
      snapEnabled,
      isPanning,
      pan,
      selectedDecorId,
      editSelectedTableId,
      detectCornerProximity,
    ]
  );

  // Reset mouse position quand on quitte le canvas
  const handleCanvasMouseLeave = useCallback(() => {
    setMousePosition(null);
    setHoveredRotationCorner(null);
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
            />
          </div>
        ) : null}

        {/* Floor plan canvas */}
        <div
          ref={containerRef}
          onMouseDown={(e) => {
            // Priorité au pan (Espace + clic)
            if (handlePanStart(e)) return;
          }}
          onClick={(e) => {
            // Ne pas traiter le clic si on vient de finir un drag ou pan
            if (dragging || isPanning) return;
            // Rotation par clic sur un coin
            if (hoveredRotationCorner) {
              if (selectedDecorId) {
                rotateElement(90);
              } else if (editSelectedTableId) {
                rotateTable(editSelectedTableId, 90);
              }
              return;
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
          {/* Grid background infinie - visible uniquement si snap activé */}
          {snapEnabled ? (
            <div
              style={{
                position: "absolute",
                // Taille très large pour couvrir tout déplacement possible
                top: -5000,
                left: -5000,
                width: 10000,
                height: 10000,
                backgroundImage:
                  "linear-gradient(to right, var(--gray-a4) 1px, transparent 1px), linear-gradient(to bottom, var(--gray-a4) 1px, transparent 1px)",
                backgroundSize: `${gridSize * zoom}px ${gridSize * zoom}px`,
                // Ajuster la position de la grille en fonction du pan
                backgroundPosition: `${pan.x % (gridSize * zoom)}px ${pan.y % (gridSize * zoom)}px`,
                opacity: isEditMode ? 0.7 : 0.3,
                transition: isPanning ? "none" : "opacity 0.2s",
                pointerEvents: "none",
              }}
            />
          ) : null}

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
            {/* Ghost preview pour l'outil de creation actif */}
            {isEditMode && activeTool !== "select" && mousePosition
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
                isEditMode={isEditMode}
                isDragging={dragging?.type === "decor" && dragging.id === element.id}
                onClick={() => {
                  if (isEditMode && !dragging) {
                    setSelectedDecorId(element.id);
                    setEditSelectedTableId(null);
                  }
                }}
                onContextMenu={(e) => handleContextMenu(e, element.id)}
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
                  isEditMode={isEditMode}
                  isDragging={dragging?.type === "table" && dragging.id === table.id}
                  onClick={() => {
                    if (!isEditMode && !dragging) {
                      onTableSelect?.(table.id);
                    }
                    if (isEditMode && !dragging) {
                      setEditSelectedTableId(table.id);
                      setSelectedDecorId(null);
                      setSelectedZoneId(null);
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

            {/* Indicateur d'angle pour l'élément sélectionné */}
            {isEditMode
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
