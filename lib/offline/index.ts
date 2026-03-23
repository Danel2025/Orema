/**
 * Module offline - Fondation IndexedDB pour le mode hors-ligne
 *
 * Exporte la base de donnees, les types, et les constantes
 * necessaires au fonctionnement offline du POS.
 */

// Base de donnees et operations CRUD
export {
  openOfflineDB,
  closeOfflineDB,
  deleteOfflineDB,
  getAll,
  getById,
  put,
  putMany,
  deleteItem,
  clearStore,
  count,
  queryByIndex,
  getPendingMutations,
  addMutation,
  updateMutationStatus,
  clearCompletedMutations,
  getSyncMetadata,
  updateSyncMetadata,
} from "./database";

// Constantes
export {
  DB_NAME,
  DB_VERSION,
  STORE_NAMES,
  CACHE_TTL,
  MAX_MUTATION_RETRIES,
  BASE_RETRY_DELAY,
} from "./constants";

// Mutation queue
export {
  enqueueMutation,
  dequeueMutation,
  getPendingMutations as getPendingMutationsFromQueue,
  getMutationCount,
  markSyncing,
  markFailed,
  retryMutation,
  getFailedMutations,
  clearCompleted,
  clearAllMutations,
  getMutationById,
} from "./mutation-queue";

// Sync engine
export { SyncEngine } from "./sync-engine";
export type { SyncStatus, SyncCallbacks, MutationExecutor } from "./sync-engine";

// Conflict resolver
export {
  detectConflict,
  resolveConflict,
  createConflictRecord,
  markConflictResolved,
  getWinningData,
} from "./conflict-resolver";
export type { ConflictStrategy, ConflictRecord } from "./conflict-resolver";

// Types
export type {
  OfflineProduit,
  OfflineCategorie,
  OfflineVente,
  OfflineLigneVente,
  OfflineClient,
  OfflineTable,
  OfflineSessionCaisse,
  OfflinePaiement,
  SyncMetadata,
  MutationType,
  MutationStatus,
  MutationEntry,
  OfflineDBSchema,
  OfflineStoreName,
  StoreValueType,
} from "./types";
