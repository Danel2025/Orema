/**
 * Cache Manager pour l'acces offline-first aux donnees
 *
 * Singleton qui orchestre le cache IndexedDB avec une strategie
 * "stale-while-revalidate": retourne les donnees du cache immediatement,
 * puis rafraichit depuis Supabase en arriere-plan si le cache est perime.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import {
  getAll,
  getById,
  putMany,
  clearStore,
  getSyncMetadata,
  updateSyncMetadata,
} from "./database";
import { STORE_NAMES, CACHE_TTL } from "./constants";
import type { OfflineStoreName, StoreValueType, SyncMetadata } from "./types";

// ============================================================================
// Types
// ============================================================================

/** Noms de stores pour lesquels on a un TTL defini */
type CacheableStore = keyof typeof CACHE_TTL;

/** Resultat d'une operation de cache */
export interface CacheResult<T> {
  data: T[];
  fromCache: boolean;
  isStale: boolean;
}

// ============================================================================
// Cache Manager (Singleton)
// ============================================================================

class CacheManagerImpl {
  private static instance: CacheManagerImpl | null = null;
  /** Promesses de revalidation en cours, pour eviter les doublons */
  private revalidationPromises = new Map<string, Promise<unknown>>();

  private constructor() {}

  static getInstance(): CacheManagerImpl {
    if (!CacheManagerImpl.instance) {
      CacheManagerImpl.instance = new CacheManagerImpl();
    }
    return CacheManagerImpl.instance;
  }

  // --------------------------------------------------------------------------
  // Preloading
  // --------------------------------------------------------------------------

  /**
   * Precharge les donnees essentielles pour le fonctionnement offline.
   * A appeler au login ou au demarrage de l'application.
   */
  async preloadEssentialData(
    supabase: SupabaseClient<Database>,
    etablissementId: string
  ): Promise<void> {
    await Promise.allSettled([
      this.refreshEntity(STORE_NAMES.produits, async () => {
        const { data } = await supabase
          .from("produits")
          .select("*")
          .eq("etablissement_id", etablissementId)
          .eq("actif", true);
        return (data ?? []) as unknown as StoreValueType<"produits">[];
      }),
      this.refreshEntity(STORE_NAMES.categories, async () => {
        const { data } = await supabase
          .from("categories")
          .select("*")
          .eq("etablissement_id", etablissementId)
          .eq("actif", true)
          .order("ordre", { ascending: true });
        return (data ?? []) as unknown as StoreValueType<"categories">[];
      }),
      this.refreshEntity(STORE_NAMES.tables, async () => {
        const { data } = await supabase
          .from("tables")
          .select("*")
          .eq("etablissement_id", etablissementId)
          .eq("active", true);
        return (data ?? []) as unknown as StoreValueType<"tables">[];
      }),
      this.refreshEntity(STORE_NAMES.clients, async () => {
        const { data } = await supabase
          .from("clients")
          .select("*")
          .eq("etablissement_id", etablissementId)
          .eq("actif", true);
        return (data ?? []) as unknown as StoreValueType<"clients">[];
      }),
    ]);
  }

  // --------------------------------------------------------------------------
  // Refresh
  // --------------------------------------------------------------------------

  /**
   * Rafraichit une entite depuis une source de donnees (Supabase)
   * et la stocke dans IndexedDB.
   */
  async refreshEntity<T extends OfflineStoreName>(
    storeName: T,
    fetcher: () => Promise<StoreValueType<T>[]>
  ): Promise<StoreValueType<T>[]> {
    // Eviter les rafraichissements concurrents pour le meme store
    const existingPromise = this.revalidationPromises.get(storeName);
    if (existingPromise) {
      await existingPromise;
      return getAll(storeName);
    }

    const refreshPromise = (async () => {
      try {
        const freshData = await fetcher();

        // Remplacer le contenu du store (full refresh)
        await clearStore(storeName);
        await putMany(storeName, freshData);

        // Mettre a jour les metadonnees de sync
        await updateSyncMetadata({
          storeName,
          lastSynced: Date.now(),
          dirty: false,
          conflicted: false,
          version: 1,
        });

        return freshData;
      } finally {
        this.revalidationPromises.delete(storeName);
      }
    })();

    this.revalidationPromises.set(storeName, refreshPromise);
    return refreshPromise;
  }

  // --------------------------------------------------------------------------
  // Lecture du cache
  // --------------------------------------------------------------------------

  /**
   * Recupere toutes les donnees d'un store depuis le cache IndexedDB.
   */
  async getCachedData<T extends OfflineStoreName>(storeName: T): Promise<StoreValueType<T>[]>;

  /**
   * Recupere un element specifique par ID depuis le cache IndexedDB.
   */
  async getCachedData<T extends OfflineStoreName>(
    storeName: T,
    id: string
  ): Promise<StoreValueType<T> | undefined>;

  async getCachedData<T extends OfflineStoreName>(
    storeName: T,
    id?: string
  ): Promise<StoreValueType<T>[] | StoreValueType<T> | undefined> {
    if (id) {
      return getById(storeName, id);
    }
    return getAll(storeName);
  }

  // --------------------------------------------------------------------------
  // Gestion du TTL / Staleness
  // --------------------------------------------------------------------------

  /**
   * Verifie si le cache d'un store est perime selon son TTL.
   */
  async isStale(storeName: CacheableStore): Promise<boolean> {
    const metadata = await getSyncMetadata(storeName);
    if (!metadata) {
      // Pas de metadonnees = jamais synchronise = stale
      return true;
    }

    const ttl = CACHE_TTL[storeName];
    const age = Date.now() - metadata.lastSynced;
    return age > ttl;
  }

  /**
   * Marque un store comme perime (force la revalidation au prochain acces).
   */
  async invalidateCache(storeName: CacheableStore): Promise<void> {
    const metadata = await getSyncMetadata(storeName);
    if (metadata) {
      await updateSyncMetadata({
        ...metadata,
        // Mettre lastSynced a 0 pour que isStale retourne toujours true
        lastSynced: 0,
        dirty: true,
      });
    }
  }

  /**
   * Recupere les metadonnees de sync pour un store.
   */
  async getMetadata(storeName: string): Promise<SyncMetadata | undefined> {
    return getSyncMetadata(storeName);
  }
}

// ============================================================================
// Export du singleton
// ============================================================================

export const CacheManager = CacheManagerImpl.getInstance();
