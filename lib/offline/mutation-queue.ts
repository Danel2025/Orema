/**
 * File de mutations offline — stockage FIFO dans IndexedDB
 *
 * Chaque mutation representera une operation effectuee hors ligne
 * qui devra etre rejouee quand le reseau revient.
 */

import type { IDBPDatabase } from "idb";
import type { OfflineDBSchema, MutationEntry, MutationType, MutationStatus } from "./types";
import { STORE_NAMES, MAX_MUTATION_RETRIES } from "./constants";

// ============================================================================
// Helpers
// ============================================================================

function generateId(): string {
  return `mut_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================================================
// Mutation Queue API
// ============================================================================

/**
 * Ajoute une mutation a la file d'attente.
 * @returns l'id genere de la mutation
 */
export async function enqueueMutation(
  db: IDBPDatabase<OfflineDBSchema>,
  mutation: {
    type: MutationType;
    entity: string;
    entityId: string;
    data: unknown;
  }
): Promise<string> {
  const entry: MutationEntry = {
    id: generateId(),
    type: mutation.type,
    entity: mutation.entity,
    entityId: mutation.entityId,
    data: mutation.data,
    timestamp: Date.now(),
    retryCount: 0,
    status: "pending",
  };

  await db.put(STORE_NAMES.mutationQueue, entry);
  return entry.id;
}

/**
 * Marque une mutation comme terminee (completed).
 */
export async function dequeueMutation(
  db: IDBPDatabase<OfflineDBSchema>,
  id: string
): Promise<void> {
  const entry = await db.get(STORE_NAMES.mutationQueue, id);
  if (!entry) return;

  entry.status = "completed";
  await db.put(STORE_NAMES.mutationQueue, entry);
}

/**
 * Retourne toutes les mutations en attente (pending), triees par timestamp FIFO.
 */
export async function getPendingMutations(
  db: IDBPDatabase<OfflineDBSchema>
): Promise<MutationEntry[]> {
  const all = await db.getAllFromIndex(STORE_NAMES.mutationQueue, "by-status", "pending");
  return all.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Retourne le nombre de mutations en attente (pending + failed).
 */
export async function getMutationCount(db: IDBPDatabase<OfflineDBSchema>): Promise<number> {
  const pending = await db.countFromIndex(STORE_NAMES.mutationQueue, "by-status", "pending");
  const failed = await db.countFromIndex(STORE_NAMES.mutationQueue, "by-status", "failed");
  return pending + failed;
}

/**
 * Marque une mutation comme en cours de synchronisation.
 */
export async function markSyncing(db: IDBPDatabase<OfflineDBSchema>, id: string): Promise<void> {
  const entry = await db.get(STORE_NAMES.mutationQueue, id);
  if (!entry) return;

  entry.status = "syncing";
  await db.put(STORE_NAMES.mutationQueue, entry);
}

/**
 * Marque une mutation comme echouee.
 * Incremente retryCount et passe en 'failed' si le max est depasse.
 */
export async function markFailed(
  db: IDBPDatabase<OfflineDBSchema>,
  id: string,
  error: string
): Promise<void> {
  const entry = await db.get(STORE_NAMES.mutationQueue, id);
  if (!entry) return;

  entry.retryCount += 1;

  if (entry.retryCount >= MAX_MUTATION_RETRIES) {
    entry.status = "failed";
  } else {
    // Remet en pending pour la prochaine tentative
    entry.status = "pending";
  }

  // Stocker l'erreur dans les data pour diagnostic
  entry.data = {
    ...(typeof entry.data === "object" && entry.data !== null ? entry.data : {}),
    _lastError: error,
    _lastRetryAt: Date.now(),
  };

  await db.put(STORE_NAMES.mutationQueue, entry);
}

/**
 * Remet une mutation failed en pending pour re-essayer.
 */
export async function retryMutation(db: IDBPDatabase<OfflineDBSchema>, id: string): Promise<void> {
  const entry = await db.get(STORE_NAMES.mutationQueue, id);
  if (!entry || entry.status !== "failed") return;

  entry.status = "pending";
  entry.retryCount = 0;
  await db.put(STORE_NAMES.mutationQueue, entry);
}

/**
 * Recupere les mutations echouees (status = 'failed').
 */
export async function getFailedMutations(
  db: IDBPDatabase<OfflineDBSchema>
): Promise<MutationEntry[]> {
  return db.getAllFromIndex(STORE_NAMES.mutationQueue, "by-status", "failed");
}

/**
 * Purge les mutations terminees (completed) de la queue.
 */
export async function clearCompleted(db: IDBPDatabase<OfflineDBSchema>): Promise<number> {
  const completed = await db.getAllFromIndex(STORE_NAMES.mutationQueue, "by-status", "completed");

  const tx = db.transaction(STORE_NAMES.mutationQueue, "readwrite");
  let count = 0;

  for (const entry of completed) {
    await tx.store.delete(entry.id);
    count++;
  }

  await tx.done;
  return count;
}

/**
 * Purge toutes les mutations (pour un reset complet).
 */
export async function clearAllMutations(db: IDBPDatabase<OfflineDBSchema>): Promise<void> {
  await db.clear(STORE_NAMES.mutationQueue);
}

/**
 * Recupere une mutation par son ID.
 */
export async function getMutationById(
  db: IDBPDatabase<OfflineDBSchema>,
  id: string
): Promise<MutationEntry | undefined> {
  return db.get(STORE_NAMES.mutationQueue, id);
}
