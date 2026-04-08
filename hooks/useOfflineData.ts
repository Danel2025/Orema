"use client";

/**
 * Hook generique pour l'acces offline-first aux donnees
 *
 * Strategie "stale-while-revalidate":
 * - Si online + pas stale: donnees Supabase (+ cache dans IndexedDB)
 * - Si online + stale: cache IndexedDB immediat + revalidation en background
 * - Si offline: cache IndexedDB uniquement
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { CacheManager } from "@/lib/offline/cache-manager";
import type { CACHE_TTL } from "@/lib/offline/constants";
import type { OfflineStoreName, StoreValueType } from "@/lib/offline/types";
import { useNetworkStatus } from "./useNetworkStatus";

// ============================================================================
// Types
// ============================================================================

type CacheableStore = keyof typeof CACHE_TTL;

export interface UseOfflineDataOptions<T> {
  /** Activer/desactiver le hook (default: true) */
  enabled?: boolean;
  /** TTL personnalise en ms (override le TTL par defaut) */
  ttl?: number;
  /** Filtre cote client applique apres la lecture */
  filter?: (item: T) => boolean;
}

export interface UseOfflineDataResult<T> {
  /** Donnees retournees (cache ou fraiches) */
  data: T[];
  /** true si un chargement est en cours */
  isLoading: boolean;
  /** true si le navigateur est hors ligne */
  isOffline: boolean;
  /** true si les donnees proviennent d'un cache perime */
  isStale: boolean;
  /** Erreur eventuelle */
  error: Error | null;
  /** Force un rafraichissement depuis Supabase */
  refresh: () => Promise<void>;
}

// ============================================================================
// Hook principal
// ============================================================================

export function useOfflineData<
  T extends StoreValueType<S>,
  S extends CacheableStore = CacheableStore,
>(
  storeName: S,
  fetcher: () => Promise<T[]>,
  options: UseOfflineDataOptions<T> = {}
): UseOfflineDataResult<T> {
  const { enabled = true, filter } = options;

  const { isOnline } = useNetworkStatus();
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Refs pour eviter les race conditions
  const mountedRef = useRef(true);
  const fetchIdRef = useRef(0);

  /**
   * Applique le filtre optionnel aux donnees
   */
  const applyFilter = useCallback(
    (items: T[]): T[] => {
      if (!filter) return items;
      return items.filter(filter);
    },
    [filter]
  );

  /**
   * Charge les donnees depuis le cache IndexedDB
   */
  const loadFromCache = useCallback(async (): Promise<T[]> => {
    const cached = await CacheManager.getCachedData(storeName as OfflineStoreName);
    return cached as T[];
  }, [storeName]);

  /**
   * Rafraichit les donnees depuis Supabase et met a jour le cache
   */
  const refreshFromNetwork = useCallback(
    async (fetchId: number): Promise<T[]> => {
      const freshData = await CacheManager.refreshEntity(
        storeName as OfflineStoreName,
        fetcher as () => Promise<StoreValueType<OfflineStoreName>[]>
      );
      // Verifier que ce fetch est toujours le plus recent
      if (fetchIdRef.current !== fetchId || !mountedRef.current) {
        return freshData as T[];
      }
      return freshData as T[];
    },
    [storeName, fetcher]
  );

  /**
   * Logique principale de chargement des données
   */
  const loadData = useCallback(async () => {
    if (!enabled) return;

    const currentFetchId = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      // Etape 1: Toujours charger le cache d'abord (retour immediat)
      const cached = await loadFromCache();
      if (fetchIdRef.current !== currentFetchId || !mountedRef.current) return;

      const stale = await CacheManager.isStale(storeName);
      if (fetchIdRef.current !== currentFetchId || !mountedRef.current) return;

      setIsStale(stale);

      if (cached.length > 0) {
        // Donnees en cache disponibles: les afficher immediatement
        setData(applyFilter(cached));
        setIsLoading(false);
      }

      // Etape 2: Si online, rafraichir si stale ou pas de cache
      if (isOnline && (stale || cached.length === 0)) {
        try {
          const freshData = await refreshFromNetwork(currentFetchId);
          if (fetchIdRef.current !== currentFetchId || !mountedRef.current) return;

          setData(applyFilter(freshData as T[]));
          setIsStale(false);
          setError(null);
        } catch (fetchError) {
          // Si le refresh echoue mais qu'on avait du cache, on garde le cache
          if (cached.length === 0) {
            if (fetchIdRef.current === currentFetchId && mountedRef.current) {
              setError(
                fetchError instanceof Error
                  ? fetchError
                  : new Error("Erreur lors du chargement des données")
              );
            }
          }
          // Sinon on garde les donnees en cache (stale mais disponibles)
        }
      }

      // Etape 3: Si offline et pas de cache, signaler l'erreur
      if (!isOnline && cached.length === 0) {
        if (fetchIdRef.current === currentFetchId && mountedRef.current) {
          setError(new Error("Hors ligne et aucune donnee en cache"));
        }
      }
    } catch (cacheError) {
      if (fetchIdRef.current === currentFetchId && mountedRef.current) {
        setError(
          cacheError instanceof Error ? cacheError : new Error("Erreur lors de la lecture du cache")
        );
      }
    } finally {
      if (fetchIdRef.current === currentFetchId && mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [enabled, isOnline, storeName, loadFromCache, refreshFromNetwork, applyFilter]);

  /**
   * Force un rafraichissement depuis le reseau
   */
  const refresh = useCallback(async () => {
    if (!isOnline) return;

    const currentFetchId = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const freshData = await refreshFromNetwork(currentFetchId);
      if (fetchIdRef.current !== currentFetchId || !mountedRef.current) return;

      setData(applyFilter(freshData as T[]));
      setIsStale(false);
    } catch (refreshError) {
      if (fetchIdRef.current === currentFetchId && mountedRef.current) {
        setError(
          refreshError instanceof Error
            ? refreshError
            : new Error("Erreur lors du rafraichissement")
        );
      }
    } finally {
      if (fetchIdRef.current === currentFetchId && mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isOnline, refreshFromNetwork, applyFilter]);

  // Chargement initial et rechargement quand les deps changent
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    isLoading,
    isOffline: !isOnline,
    isStale,
    error,
    refresh,
  };
}
