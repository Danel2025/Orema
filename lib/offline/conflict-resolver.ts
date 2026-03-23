/**
 * Resolution de conflits offline/online
 *
 * Strategie par defaut: "last-write-wins" basee sur le timestamp updatedAt.
 * Les conflits non resolus sont stockes pour review par l'utilisateur.
 */

// ============================================================================
// Types
// ============================================================================

export type ConflictStrategy = "local-wins" | "remote-wins" | "last-write-wins";

export interface ConflictRecord {
  id: string;
  entity: string;
  entityId: string;
  localData: Record<string, unknown>;
  remoteData: Record<string, unknown>;
  localUpdatedAt: string;
  remoteUpdatedAt: string;
  detectedAt: number;
  resolved: boolean;
  resolution?: ConflictStrategy;
  resolvedAt?: number;
}

// ============================================================================
// Detection de conflits
// ============================================================================

/**
 * Detecte si un conflit existe entre la version locale et la version serveur.
 * Un conflit survient quand le serveur a ete modifie depuis le dernier sync.
 */
export function detectConflict(
  localUpdatedAt: string,
  remoteUpdatedAt: string,
  lastSyncedAt: number
): boolean {
  const localTime = new Date(localUpdatedAt).getTime();
  const remoteTime = new Date(remoteUpdatedAt).getTime();

  // Conflit si les deux ont ete modifies depuis le dernier sync
  const localModifiedSinceSync = localTime > lastSyncedAt;
  const remoteModifiedSinceSync = remoteTime > lastSyncedAt;

  return localModifiedSinceSync && remoteModifiedSinceSync;
}

// ============================================================================
// Resolution de conflits
// ============================================================================

/**
 * Resout un conflit en retournant les donnees gagnantes.
 */
export function resolveConflict(
  local: Record<string, unknown>,
  remote: Record<string, unknown>,
  strategy: ConflictStrategy
): Record<string, unknown> {
  switch (strategy) {
    case "local-wins":
      return local;

    case "remote-wins":
      return remote;

    case "last-write-wins": {
      const localTime = new Date(
        (local.updated_at as string) || (local.created_at as string) || "1970-01-01"
      ).getTime();
      const remoteTime = new Date(
        (remote.updated_at as string) || (remote.created_at as string) || "1970-01-01"
      ).getTime();

      return localTime >= remoteTime ? local : remote;
    }
  }
}

// ============================================================================
// Gestion de la liste des conflits (en memoire, synchronisee avec le store)
// ============================================================================

/**
 * Cree un enregistrement de conflit.
 */
export function createConflictRecord(params: {
  entity: string;
  entityId: string;
  localData: Record<string, unknown>;
  remoteData: Record<string, unknown>;
}): ConflictRecord {
  return {
    id: `conflict_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    entity: params.entity,
    entityId: params.entityId,
    localData: params.localData,
    remoteData: params.remoteData,
    localUpdatedAt: (params.localData.updated_at as string) || new Date().toISOString(),
    remoteUpdatedAt: (params.remoteData.updated_at as string) || new Date().toISOString(),
    detectedAt: Date.now(),
    resolved: false,
  };
}

/**
 * Marque un conflit comme resolu avec la strategie choisie.
 */
export function markConflictResolved(
  conflict: ConflictRecord,
  strategy: ConflictStrategy
): ConflictRecord {
  return {
    ...conflict,
    resolved: true,
    resolution: strategy,
    resolvedAt: Date.now(),
  };
}

/**
 * Retourne les donnees gagnantes pour un conflit donne.
 */
export function getWinningData(
  conflict: ConflictRecord,
  strategy: ConflictStrategy
): Record<string, unknown> {
  return resolveConflict(conflict.localData, conflict.remoteData, strategy);
}
