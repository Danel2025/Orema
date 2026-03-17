/**
 * Moteur de synchronisation offline -> online
 *
 * Traite les mutations en attente en FIFO, appelle les Server Actions correspondants,
 * gere le retry avec backoff exponentiel et la detection de conflits.
 */

import type { IDBPDatabase } from 'idb'
import type { OfflineDBSchema, MutationEntry } from './types'
import { BASE_RETRY_DELAY } from './constants'
import {
  getPendingMutations,
  markSyncing,
  dequeueMutation,
  markFailed,
  getMutationCount,
  getFailedMutations,
  clearCompleted,
} from './mutation-queue'
import {
  detectConflict,
  createConflictRecord,
  type ConflictRecord,
} from './conflict-resolver'

// ============================================================================
// Types
// ============================================================================

export interface SyncStatus {
  isSyncing: boolean
  pendingCount: number
  failedCount: number
  lastSyncAt: number | null
}

export interface SyncCallbacks {
  onSyncStart?: () => void
  onSyncComplete?: (stats: { synced: number; failed: number; conflicts: number }) => void
  onSyncError?: (error: Error) => void
  onConflict?: (conflict: ConflictRecord) => void
  onMutationSynced?: (mutation: MutationEntry) => void
  onMutationFailed?: (mutation: MutationEntry, error: string) => void
  onStatusChange?: (status: SyncStatus) => void
}

/** Type pour le resultat d'un Server Action */
interface ActionResult {
  success: boolean
  error?: string
  data?: unknown
}

/**
 * Fonction qui execute un Server Action en fonction de l'entite et du type de mutation.
 * Doit etre injectee par le consommateur (pour eviter un import direct des Server Actions
 * qui sont 'use server' et ne peuvent pas etre importes cote client directement).
 */
export type MutationExecutor = (
  entity: string,
  type: string,
  data: unknown
) => Promise<ActionResult>

// ============================================================================
// SyncEngine
// ============================================================================

export class SyncEngine {
  private db: IDBPDatabase<OfflineDBSchema>
  private callbacks: SyncCallbacks
  private executor: MutationExecutor
  private _isSyncing = false
  private _lastSyncAt: number | null = null
  private _aborted = false

  constructor(
    db: IDBPDatabase<OfflineDBSchema>,
    executor: MutationExecutor,
    callbacks: SyncCallbacks = {}
  ) {
    this.db = db
    this.executor = executor
    this.callbacks = callbacks
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  /**
   * Demarre la synchronisation de toutes les mutations pending.
   * Traite en FIFO, une par une.
   */
  async startSync(): Promise<{
    synced: number
    failed: number
    conflicts: number
  }> {
    if (this._isSyncing) {
      return { synced: 0, failed: 0, conflicts: 0 }
    }

    this._isSyncing = true
    this._aborted = false
    this.callbacks.onSyncStart?.()
    this.emitStatus()

    let synced = 0
    let failed = 0
    let conflicts = 0

    try {
      const mutations = await getPendingMutations(this.db)

      for (const mutation of mutations) {
        if (this._aborted) break

        const result = await this.syncOne(mutation)

        if (result === 'synced') {
          synced++
          this.callbacks.onMutationSynced?.(mutation)
        } else if (result === 'conflict') {
          conflicts++
        } else {
          failed++
          this.callbacks.onMutationFailed?.(mutation, 'Sync failed after retries')
        }

        this.emitStatus()
      }

      // Nettoyer les mutations terminees
      await clearCompleted(this.db)

      this._lastSyncAt = Date.now()
      this.callbacks.onSyncComplete?.({ synced, failed, conflicts })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      this.callbacks.onSyncError?.(err)
    } finally {
      this._isSyncing = false
      this.emitStatus()
    }

    return { synced, failed, conflicts }
  }

  /**
   * Arrete la synchronisation en cours.
   */
  abort(): void {
    this._aborted = true
  }

  /**
   * Retourne le statut actuel du moteur de sync.
   */
  async getStatus(): Promise<SyncStatus> {
    const pendingCount = await getMutationCount(this.db)
    const failedMutations = await getFailedMutations(this.db)

    return {
      isSyncing: this._isSyncing,
      pendingCount,
      failedCount: failedMutations.length,
      lastSyncAt: this._lastSyncAt,
    }
  }

  // --------------------------------------------------------------------------
  // Internal
  // --------------------------------------------------------------------------

  /**
   * Synchronise une seule mutation.
   * Applique un retry avec backoff exponentiel si l'appel echoue.
   */
  private async syncOne(
    mutation: MutationEntry
  ): Promise<'synced' | 'failed' | 'conflict'> {
    await markSyncing(this.db, mutation.id)

    // Backoff exponentiel: delai = BASE * 2^retryCount
    const delay = BASE_RETRY_DELAY * Math.pow(2, mutation.retryCount)

    // Si ce n'est pas la premiere tentative, attendre le backoff
    if (mutation.retryCount > 0) {
      await this.sleep(delay)
    }

    try {
      const result = await this.executor(
        mutation.entity,
        mutation.type,
        mutation.data
      )

      if (result.success) {
        await dequeueMutation(this.db, mutation.id)
        return 'synced'
      }

      // Verifier si c'est un conflit (le serveur a une version plus recente)
      if (this.isConflictError(result.error)) {
        const conflictRecord = await this.handleConflict(mutation, result)
        if (conflictRecord) {
          this.callbacks.onConflict?.(conflictRecord)
          return 'conflict'
        }
      }

      // Echec normal: marquer comme failed
      await markFailed(
        this.db,
        mutation.id,
        result.error || 'Unknown server error'
      )
      return 'failed'
    } catch (error) {
      // Erreur reseau ou autre
      const errorMsg =
        error instanceof Error ? error.message : String(error)
      await markFailed(this.db, mutation.id, errorMsg)
      return 'failed'
    }
  }

  /**
   * Detecte si l'erreur est un conflit de version.
   */
  private isConflictError(error?: string): boolean {
    if (!error) return false
    const conflictPatterns = [
      'conflict',
      'version mismatch',
      'already modified',
      'stale data',
      'concurrent modification',
    ]
    const lowerError = error.toLowerCase()
    return conflictPatterns.some((p) => lowerError.includes(p))
  }

  /**
   * Gere un conflit detecte lors de la sync.
   */
  private async handleConflict(
    mutation: MutationEntry,
    serverResult: ActionResult
  ): Promise<ConflictRecord | null> {
    const mutationData = mutation.data as Record<string, unknown> | null
    if (!mutationData) return null

    const localUpdatedAt =
      (mutationData.updated_at as string) || new Date().toISOString()
    const remoteData =
      (serverResult.data as Record<string, unknown>) || {}
    const remoteUpdatedAt =
      (remoteData.updated_at as string) || new Date().toISOString()

    // Verifier si c'est un vrai conflit via les timestamps
    const lastSynced = this._lastSyncAt || 0
    const isConflict = detectConflict(
      localUpdatedAt,
      remoteUpdatedAt,
      lastSynced
    )

    if (!isConflict) return null

    const conflict = createConflictRecord({
      entity: mutation.entity,
      entityId: mutation.entityId,
      localData: mutationData,
      remoteData,
    })

    // Marquer la mutation comme failed (le conflit devra etre resolu manuellement)
    await markFailed(
      this.db,
      mutation.id,
      `Conflict detected for ${mutation.entity}:${mutation.entityId}`
    )

    return conflict
  }

  /**
   * Sleep utilitaire pour le backoff.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Emet le statut actuel via le callback.
   */
  private emitStatus(): void {
    if (!this.callbacks.onStatusChange) return
    // Fire and forget — getStatus is async
    this.getStatus().then((status) => {
      this.callbacks.onStatusChange?.(status)
    })
  }
}
