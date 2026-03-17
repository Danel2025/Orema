'use client'

/**
 * Hook d'orchestration pour la synchronisation offline -> online
 *
 * Connecte le SyncEngine au lifecycle React:
 * - Lance le sync automatiquement quand le reseau revient
 * - Expose l'etat de synchronisation via le store Zustand offline
 * - Gere le cleanup propre des listeners et refs
 */

import { useEffect, useCallback, useRef } from 'react'
import { openOfflineDB } from '@/lib/offline/database'
import { SyncEngine, type MutationExecutor } from '@/lib/offline/sync-engine'
import { getMutationCount } from '@/lib/offline/mutation-queue'
import { useOfflineStore } from '@/stores/offline-store'
import type { ConflictRecord } from '@/lib/offline/conflict-resolver'
import { useNetworkStatus } from './useNetworkStatus'

// ============================================================================
// Types
// ============================================================================

export interface UseOfflineSyncResult {
  /** Lance une synchronisation manuelle */
  syncNow: () => Promise<void>
  /** true si une synchronisation est en cours */
  isSyncing: boolean
  /** Nombre de mutations en attente */
  pendingCount: number
  /** Timestamp du dernier sync reussi */
  lastSyncAt: number | null
  /** Conflits non resolus */
  conflicts: ConflictRecord[]
}

// ============================================================================
// Hook principal
// ============================================================================

export function useOfflineSync(
  executor: MutationExecutor
): UseOfflineSyncResult {
  const { isOnline } = useNetworkStatus()

  // Etat depuis le store Zustand
  const isSyncing = useOfflineStore((s) => s.isSyncing)
  const pendingCount = useOfflineStore((s) => s.pendingCount)
  const lastSyncAt = useOfflineStore((s) => s.lastSyncAt)
  const conflicts = useOfflineStore((s) => s.conflicts)
  const startSync = useOfflineStore((s) => s.startSync)
  const completeSync = useOfflineStore((s) => s.completeSync)
  const setOnline = useOfflineStore((s) => s.setOnline)
  const setPendingCount = useOfflineStore((s) => s.setPendingCount)
  const addConflict = useOfflineStore((s) => s.addConflict)
  const addSyncError = useOfflineStore((s) => s.addSyncError)

  // Refs pour le SyncEngine (pas de recree a chaque render)
  const engineRef = useRef<SyncEngine | null>(null)
  const executorRef = useRef<MutationExecutor>(executor)
  const syncingRef = useRef(false)

  // Garder l'executor a jour sans recreer l'engine
  useEffect(() => {
    executorRef.current = executor
  }, [executor])

  /**
   * Initialise le SyncEngine quand la DB est disponible
   */
  const getEngine = useCallback(async (): Promise<SyncEngine> => {
    if (engineRef.current) {
      return engineRef.current
    }

    const db = await openOfflineDB()

    const engine = new SyncEngine(
      db,
      // Wrapper pour utiliser la ref (toujours a jour)
      (entity, type, data) => executorRef.current(entity, type, data),
      {
        onSyncStart: () => {
          startSync()
        },
        onSyncComplete: async (stats) => {
          try {
            const count = await getMutationCount(db)
            completeSync({
              pendingCount: count,
              failedCount: stats.failed,
              lastSyncAt: Date.now(),
            })
          } catch {
            completeSync({
              pendingCount: 0,
              failedCount: stats.failed,
              lastSyncAt: Date.now(),
            })
          }
        },
        onSyncError: (error) => {
          addSyncError({
            message: error.message,
          })
        },
        onConflict: (conflict) => {
          addConflict(conflict)
        },
      }
    )

    engineRef.current = engine
    return engine
  }, [startSync, completeSync, addSyncError, addConflict])

  /**
   * Lance une synchronisation
   */
  const syncNow = useCallback(async () => {
    if (syncingRef.current || !isOnline) return

    syncingRef.current = true
    try {
      const engine = await getEngine()
      await engine.startSync()
    } catch (error) {
      addSyncError({
        message: error instanceof Error ? error.message : 'Erreur de synchronisation',
      })
    } finally {
      syncingRef.current = false
    }
  }, [isOnline, getEngine, addSyncError])

  // Mettre a jour l'etat online du store quand le hook detecte un changement
  useEffect(() => {
    setOnline(isOnline)
  }, [isOnline, setOnline])

  // Sync automatique quand le reseau revient
  useEffect(() => {
    if (isOnline && pendingCount > 0 && !syncingRef.current) {
      syncNow()
    }
  }, [isOnline, pendingCount, syncNow])

  // Mettre a jour le pendingCount au montage
  useEffect(() => {
    let mounted = true

    async function updatePendingCount() {
      try {
        const db = await openOfflineDB()
        const count = await getMutationCount(db)
        if (mounted) {
          setPendingCount(count)
        }
      } catch {
        // Ignorer les erreurs au montage (DB pas encore prête)
      }
    }

    updatePendingCount()

    return () => {
      mounted = false
    }
  }, [setPendingCount])

  // Cleanup: abort le sync engine si le composant est demonte
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.abort()
        engineRef.current = null
      }
    }
  }, [])

  return {
    syncNow,
    isSyncing,
    pendingCount,
    lastSyncAt,
    conflicts,
  }
}
