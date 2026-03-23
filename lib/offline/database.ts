/**
 * Couche IndexedDB pour le mode offline
 * Utilise la lib `idb` pour un wrapper type-safe autour d'IndexedDB
 */

import { openDB, type IDBPDatabase } from "idb";
import { DB_NAME, DB_VERSION, STORE_NAMES } from "./constants";
import type {
  OfflineDBSchema,
  OfflineStoreName,
  StoreValueType,
  MutationEntry,
  SyncMetadata,
} from "./types";

// ============================================================================
// Singleton de la base de donnees
// ============================================================================

let dbInstance: IDBPDatabase<OfflineDBSchema> | null = null;

/**
 * Ouvre (ou cree/upgrade) la base de donnees IndexedDB offline.
 * Retourne un singleton pour eviter les connexions multiples.
 */
export async function openOfflineDB(): Promise<IDBPDatabase<OfflineDBSchema>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // --- Produits ---
      if (!db.objectStoreNames.contains(STORE_NAMES.produits)) {
        const produitsStore = db.createObjectStore(STORE_NAMES.produits, {
          keyPath: "id",
        });
        produitsStore.createIndex("by-categorie", "categorie_id");
        produitsStore.createIndex("by-nom", "nom");
        produitsStore.createIndex("by-etablissement", "etablissement_id");
      }

      // --- Categories ---
      if (!db.objectStoreNames.contains(STORE_NAMES.categories)) {
        const categoriesStore = db.createObjectStore(STORE_NAMES.categories, {
          keyPath: "id",
        });
        categoriesStore.createIndex("by-etablissement", "etablissement_id");
        categoriesStore.createIndex("by-ordre", "ordre");
      }

      // --- Ventes ---
      if (!db.objectStoreNames.contains(STORE_NAMES.ventes)) {
        const ventesStore = db.createObjectStore(STORE_NAMES.ventes, {
          keyPath: "id",
        });
        ventesStore.createIndex("by-date", "created_at");
        ventesStore.createIndex("by-statut", "statut");
        ventesStore.createIndex("by-etablissement", "etablissement_id");
        ventesStore.createIndex("by-session", "session_caisse_id");
      }

      // --- Lignes de vente ---
      if (!db.objectStoreNames.contains(STORE_NAMES.lignesVente)) {
        const lignesStore = db.createObjectStore(STORE_NAMES.lignesVente, {
          keyPath: "id",
        });
        lignesStore.createIndex("by-vente", "vente_id");
        lignesStore.createIndex("by-produit", "produit_id");
      }

      // --- Clients ---
      if (!db.objectStoreNames.contains(STORE_NAMES.clients)) {
        const clientsStore = db.createObjectStore(STORE_NAMES.clients, {
          keyPath: "id",
        });
        clientsStore.createIndex("by-telephone", "telephone");
        clientsStore.createIndex("by-nom", "nom");
        clientsStore.createIndex("by-etablissement", "etablissement_id");
      }

      // --- Tables ---
      if (!db.objectStoreNames.contains(STORE_NAMES.tables)) {
        const tablesStore = db.createObjectStore(STORE_NAMES.tables, {
          keyPath: "id",
        });
        tablesStore.createIndex("by-zone", "zone_id");
        tablesStore.createIndex("by-statut", "statut");
        tablesStore.createIndex("by-etablissement", "etablissement_id");
      }

      // --- Sessions caisse ---
      if (!db.objectStoreNames.contains(STORE_NAMES.sessionsCaisse)) {
        const sessionsStore = db.createObjectStore(STORE_NAMES.sessionsCaisse, { keyPath: "id" });
        sessionsStore.createIndex("by-utilisateur", "utilisateur_id");
        sessionsStore.createIndex("by-etablissement", "etablissement_id");
      }

      // --- Paiements ---
      if (!db.objectStoreNames.contains(STORE_NAMES.paiements)) {
        const paiementsStore = db.createObjectStore(STORE_NAMES.paiements, {
          keyPath: "id",
        });
        paiementsStore.createIndex("by-vente", "vente_id");
      }

      // --- Mutation queue ---
      if (!db.objectStoreNames.contains(STORE_NAMES.mutationQueue)) {
        const mutationStore = db.createObjectStore(STORE_NAMES.mutationQueue, {
          keyPath: "id",
        });
        mutationStore.createIndex("by-status", "status");
        mutationStore.createIndex("by-entity", "entity");
        mutationStore.createIndex("by-timestamp", "timestamp");
      }

      // --- Sync metadata ---
      if (!db.objectStoreNames.contains(STORE_NAMES.syncMetadata)) {
        db.createObjectStore(STORE_NAMES.syncMetadata, {
          keyPath: "storeName",
        });
      }
    },
  });

  return dbInstance;
}

/**
 * Ferme la connexion a la base de donnees et reinitialise le singleton.
 */
export async function closeOfflineDB(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

// ============================================================================
// Operations CRUD generiques
// ============================================================================

/**
 * Recupere tous les elements d'un object store.
 */
export async function getAll<T extends OfflineStoreName>(
  storeName: T
): Promise<StoreValueType<T>[]> {
  const db = await openOfflineDB();
  return db.getAll(storeName);
}

/**
 * Recupere un element par son ID (cle primaire).
 */
export async function getById<T extends OfflineStoreName>(
  storeName: T,
  id: string
): Promise<StoreValueType<T> | undefined> {
  const db = await openOfflineDB();
  return db.get(storeName, id);
}

/**
 * Insere ou met a jour un element dans un object store.
 */
export async function put<T extends OfflineStoreName>(
  storeName: T,
  item: StoreValueType<T>
): Promise<string> {
  const db = await openOfflineDB();
  return db.put(storeName, item) as Promise<string>;
}

/**
 * Insere ou met a jour plusieurs elements dans une seule transaction.
 */
export async function putMany<T extends OfflineStoreName>(
  storeName: T,
  items: StoreValueType<T>[]
): Promise<void> {
  if (items.length === 0) return;
  const db = await openOfflineDB();
  const tx = db.transaction(storeName, "readwrite");
  await Promise.all([...items.map((item) => tx.store.put(item)), tx.done]);
}

/**
 * Supprime un element par son ID.
 */
export async function deleteItem<T extends OfflineStoreName>(
  storeName: T,
  id: string
): Promise<void> {
  const db = await openOfflineDB();
  await db.delete(storeName, id);
}

/**
 * Vide completement un object store.
 */
export async function clearStore<T extends OfflineStoreName>(storeName: T): Promise<void> {
  const db = await openOfflineDB();
  await db.clear(storeName);
}

/**
 * Compte le nombre d'elements dans un object store.
 */
export async function count<T extends OfflineStoreName>(storeName: T): Promise<number> {
  const db = await openOfflineDB();
  return db.count(storeName);
}

// ============================================================================
// Requetes par index
// ============================================================================

/**
 * Recherche des elements par index.
 * Exemple: query('produits', 'by-categorie', 'cat-123')
 */
export async function queryByIndex<T extends OfflineStoreName>(
  storeName: T,
  indexName: string,
  value: IDBValidKey
): Promise<StoreValueType<T>[]> {
  const db = await openOfflineDB();
  const tx = db.transaction(storeName, "readonly");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const index = tx.store.index(indexName as any);
  const results = await index.getAll(value as any);
  await tx.done;
  return results as StoreValueType<T>[];
}

// ============================================================================
// Operations specifiques a la mutation queue
// ============================================================================

/**
 * Recupere toutes les mutations en attente, triees par timestamp.
 */
export async function getPendingMutations(): Promise<MutationEntry[]> {
  const db = await openOfflineDB();
  const tx = db.transaction(STORE_NAMES.mutationQueue, "readonly");
  const index = tx.store.index("by-status");
  const results = await index.getAll("pending");
  await tx.done;
  return results.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Ajoute une mutation a la file d'attente.
 */
export async function addMutation(mutation: MutationEntry): Promise<void> {
  await put(STORE_NAMES.mutationQueue, mutation);
}

/**
 * Met a jour le statut d'une mutation.
 */
export async function updateMutationStatus(
  mutationId: string,
  status: MutationEntry["status"],
  retryCount?: number
): Promise<void> {
  const db = await openOfflineDB();
  const mutation = await db.get(STORE_NAMES.mutationQueue, mutationId);
  if (!mutation) return;

  mutation.status = status;
  if (retryCount !== undefined) {
    mutation.retryCount = retryCount;
  }
  await db.put(STORE_NAMES.mutationQueue, mutation);
}

/**
 * Supprime les mutations completees.
 */
export async function clearCompletedMutations(): Promise<void> {
  const db = await openOfflineDB();
  const tx = db.transaction(STORE_NAMES.mutationQueue, "readwrite");
  const index = tx.store.index("by-status");
  const completed = await index.getAllKeys("completed");
  await Promise.all([...completed.map((key) => tx.store.delete(key)), tx.done]);
}

// ============================================================================
// Operations specifiques aux metadonnees de synchronisation
// ============================================================================

/**
 * Recupere les metadonnees de sync pour un store donne.
 */
export async function getSyncMetadata(storeName: string): Promise<SyncMetadata | undefined> {
  const db = await openOfflineDB();
  return db.get(STORE_NAMES.syncMetadata, storeName);
}

/**
 * Met a jour les metadonnees de sync pour un store.
 */
export async function updateSyncMetadata(metadata: SyncMetadata): Promise<void> {
  await put(STORE_NAMES.syncMetadata, metadata);
}

// ============================================================================
// Utilitaires
// ============================================================================

/**
 * Supprime completement la base de donnees offline.
 * A utiliser avec precaution (reset complet).
 */
export async function deleteOfflineDB(): Promise<void> {
  await closeOfflineDB();
  const { deleteDB } = await import("idb");
  await deleteDB(DB_NAME);
}
