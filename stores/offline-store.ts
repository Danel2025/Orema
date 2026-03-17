/**
 * Store Zustand pour l'etat offline/sync
 *
 * Stocke l'etat reseau, la synchronisation et les conflits.
 * Persiste dans localStorage pour survivre aux rechargements de page.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ConflictRecord } from '@/lib/offline/conflict-resolver'

// ============================================================================
// Types
// ============================================================================

export interface SyncError {
  id: string
  message: string
  entity?: string
  entityId?: string
  timestamp: number
}

interface OfflineState {
  /** true si le navigateur est en ligne */
  isOnline: boolean
  /** true si une synchronisation est en cours */
  isSyncing: boolean
  /** Nombre de mutations en attente */
  pendingCount: number
  /** Nombre de mutations echouees */
  failedCount: number
  /** Timestamp du dernier sync reussi */
  lastSyncAt: number | null
  /** Conflits detectes non resolus */
  conflicts: ConflictRecord[]
  /** Erreurs de synchronisation recentes */
  syncErrors: SyncError[]
}

interface OfflineActions {
  setOnline: (isOnline: boolean) => void
  startSync: () => void
  completeSync: (stats: {
    pendingCount: number
    failedCount: number
    lastSyncAt: number
  }) => void
  setPendingCount: (count: number) => void
  setFailedCount: (count: number) => void
  addConflict: (conflict: ConflictRecord) => void
  resolveConflict: (id: string) => void
  clearConflicts: () => void
  addSyncError: (error: Omit<SyncError, 'id' | 'timestamp'>) => void
  clearErrors: () => void
  reset: () => void
}

type OfflineStore = OfflineState & OfflineActions

// ============================================================================
// Initial state
// ============================================================================

const initialState: OfflineState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pendingCount: 0,
  failedCount: 0,
  lastSyncAt: null,
  conflicts: [],
  syncErrors: [],
}

// ============================================================================
// Store
// ============================================================================

export const useOfflineStore = create<OfflineStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setOnline: (isOnline) => set({ isOnline }),

      startSync: () => set({ isSyncing: true }),

      completeSync: (stats) =>
        set({
          isSyncing: false,
          pendingCount: stats.pendingCount,
          failedCount: stats.failedCount,
          lastSyncAt: stats.lastSyncAt,
        }),

      setPendingCount: (count) => set({ pendingCount: count }),

      setFailedCount: (count) => set({ failedCount: count }),

      addConflict: (conflict) =>
        set((state) => ({
          conflicts: [...state.conflicts, conflict],
        })),

      resolveConflict: (id) =>
        set((state) => ({
          conflicts: state.conflicts.filter((c) => c.id !== id),
        })),

      clearConflicts: () => set({ conflicts: [] }),

      addSyncError: (error) => {
        const entry: SyncError = {
          ...error,
          id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          timestamp: Date.now(),
        }
        const current = get().syncErrors
        // Garder les 50 dernieres erreurs maximum
        const updated = [entry, ...current].slice(0, 50)
        set({ syncErrors: updated })
      },

      clearErrors: () => set({ syncErrors: [] }),

      reset: () => set(initialState),
    }),
    {
      name: 'offline-sync-storage',
      partialize: (state) => ({
        lastSyncAt: state.lastSyncAt,
        conflicts: state.conflicts,
        syncErrors: state.syncErrors.slice(0, 10),
      }),
    }
  )
)
