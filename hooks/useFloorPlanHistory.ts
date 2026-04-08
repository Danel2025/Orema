import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { DecorElementData } from "@/components/salle/DecorElement";

const MAX_HISTORY_LENGTH = 50;
const LOCAL_STORAGE_KEY_PREFIX = "floorplan-decor";

interface HistoryState {
  past: DecorElementData[][];
  present: DecorElementData[];
  future: DecorElementData[][];
}

interface UseFloorPlanHistoryReturn {
  /** Current decor elements */
  decorElements: DecorElementData[];
  /** Update decor elements and push to history */
  setDecorElements: (
    elements: DecorElementData[] | ((prev: DecorElementData[]) => DecorElementData[])
  ) => void;
  /** Undo last action */
  undo: () => void;
  /** Redo last undone action */
  redo: () => void;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Clear all history */
  clearHistory: () => void;
  /** Whether the hook has loaded from localStorage */
  isLoaded: boolean;
}

/**
 * Build the localStorage key scoped to an establishment
 */
function getStorageKey(etablissementId: string): string {
  return `${LOCAL_STORAGE_KEY_PREFIX}-${etablissementId}`;
}

/**
 * Load state from localStorage (client-side only)
 */
function loadFromLocalStorage(etablissementId: string): DecorElementData[] {
  try {
    const saved = localStorage.getItem(getStorageKey(etablissementId));
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

/**
 * Save state to localStorage
 */
function saveToLocalStorage(etablissementId: string, elements: DecorElementData[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(etablissementId), JSON.stringify(elements));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Hook for managing floor plan decor elements with undo/redo history.
 *
 * - Stores up to 50 history entries
 * - Persists current state to localStorage
 * - Provides undo() and redo() functions
 * - Exposes canUndo and canRedo flags
 */
export function useFloorPlanHistory(etablissementId: string): UseFloorPlanHistoryReturn {
  // Start with empty array to avoid hydration mismatch
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: [],
    future: [],
  });

  // Track if localStorage has been loaded (use lazy init + useSyncExternalStore pattern)
  const [isLoaded] = useState(() => {
    if (typeof window === "undefined") return false;
    if (!etablissementId) return false;
    const saved = loadFromLocalStorage(etablissementId);
    if (saved.length > 0) {
      // Will be applied in initial render via lazy init below
    }
    return true;
  });

  // Lazy-load from localStorage on first render (client only)
  const hasLoadedRef = useRef(false);
  if (!hasLoadedRef.current && typeof window !== "undefined" && etablissementId) {
    hasLoadedRef.current = true;
    const saved = loadFromLocalStorage(etablissementId);
    if (saved.length > 0) {
      setHistory({ past: [], present: saved, future: [] });
    }
  }

  // Reload from localStorage when etablissementId changes
  const prevEtablissementIdRef = useRef(etablissementId);
  useEffect(() => {
    if (prevEtablissementIdRef.current !== etablissementId && etablissementId) {
      prevEtablissementIdRef.current = etablissementId;
      const saved = loadFromLocalStorage(etablissementId);
      setHistory({ past: [], present: saved, future: [] });
    }
  }, [etablissementId]);

  // Track if this is an internal update (undo/redo) to avoid double-pushing to history
  const isInternalUpdate = useRef(false);

  const setDecorElements = useCallback(
    (elements: DecorElementData[] | ((prev: DecorElementData[]) => DecorElementData[])) => {
      setHistory((prev) => {
        const newPresent = typeof elements === "function" ? elements(prev.present) : elements;

        // Skip if no actual change
        if (JSON.stringify(newPresent) === JSON.stringify(prev.present)) {
          return prev;
        }

        // Save to localStorage
        saveToLocalStorage(etablissementId, newPresent);

        // If this is an internal update (undo/redo), don't modify history
        if (isInternalUpdate.current) {
          isInternalUpdate.current = false;
          return {
            ...prev,
            present: newPresent,
          };
        }

        // Add current state to past, limit history length
        const newPast = [...prev.past, prev.present];
        if (newPast.length > MAX_HISTORY_LENGTH) {
          newPast.shift();
        }

        return {
          past: newPast,
          present: newPresent,
          future: [], // Clear future on new action
        };
      });
    },
    [etablissementId]
  );

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;

      const newPast = [...prev.past];
      const previousState = newPast.pop()!;

      // Save to localStorage
      saveToLocalStorage(etablissementId, previousState);

      return {
        past: newPast,
        present: previousState,
        future: [prev.present, ...prev.future].slice(0, MAX_HISTORY_LENGTH),
      };
    });
  }, [etablissementId]);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;

      const newFuture = [...prev.future];
      const nextState = newFuture.shift()!;

      // Save to localStorage
      saveToLocalStorage(etablissementId, nextState);

      return {
        past: [...prev.past, prev.present].slice(-MAX_HISTORY_LENGTH),
        present: nextState,
        future: newFuture,
      };
    });
  }, [etablissementId]);

  const clearHistory = useCallback(() => {
    setHistory((prev) => ({
      past: [],
      present: prev.present,
      future: [],
    }));
  }, []);

  const canUndo = useMemo(() => history.past.length > 0, [history.past.length]);
  const canRedo = useMemo(() => history.future.length > 0, [history.future.length]);

  return {
    decorElements: history.present,
    setDecorElements,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    isLoaded,
  };
}
