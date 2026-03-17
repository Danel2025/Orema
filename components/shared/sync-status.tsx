'use client'

import { Popover, Button, Separator } from '@radix-ui/themes'
import {
  RefreshCw,
  Check,
  X,
  Clock,
  AlertTriangle,
  CloudOff,
} from 'lucide-react'
import { Text, Flex, Box } from '@/components/ui'

// ============================================================================
// Types
// ============================================================================

export interface SyncHistoryEntry {
  id: string
  timestamp: string
  status: 'success' | 'failed'
  itemCount: number
}

export interface SyncConflict {
  id: string
  entity: string
  entityId: string
  description: string
  createdAt: string
}

export interface PendingMutationsSummary {
  /** Ex: { ventes: 3, clients: 1, stocks: 2 } */
  [entityType: string]: number
}

interface SyncStatusProps {
  /** true si actuellement en synchronisation */
  isSyncing: boolean
  /** true si le reseau est hors ligne */
  isOffline: boolean
  /** Mutations en attente groupees par type */
  pendingSummary: PendingMutationsSummary
  /** Nombre total de mutations en attente */
  pendingTotal: number
  /** Progression du sync (0-100) ou null si pas de sync */
  syncProgress: number | null
  /** Historique des dernieres syncs */
  syncHistory: SyncHistoryEntry[]
  /** Conflits non resolus */
  conflicts: SyncConflict[]
  /** Callback pour declencher une sync manuelle */
  onSyncNow: () => void
  /** Trigger element (le bouton/icone qui ouvre le popover) */
  children: React.ReactNode
}

// ============================================================================
// Sous-composants
// ============================================================================

const entityLabels: Record<string, string> = {
  ventes: 'Ventes',
  lignesVente: 'Lignes de vente',
  clients: 'Clients',
  tables: 'Tables',
  produits: 'Produits',
  categories: 'Categories',
  paiements: 'Paiements',
  sessionsCaisse: 'Sessions caisse',
  stocks: 'Stocks',
}

function getEntityLabel(key: string): string {
  return entityLabels[key] ?? key
}

function SyncProgressBar({ progress }: { progress: number }) {
  return (
    <div
      style={{
        width: '100%',
        height: 6,
        borderRadius: 3,
        backgroundColor: 'var(--gray-a4)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${Math.min(100, Math.max(0, progress))}%`,
          height: '100%',
          borderRadius: 3,
          backgroundColor: 'var(--accent-9)',
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  )
}

function PendingList({ summary }: { summary: PendingMutationsSummary }) {
  const entries = Object.entries(summary).filter(([, count]) => count > 0)

  if (entries.length === 0) {
    return (
      <Text size="2" color="gray" style={{ fontStyle: 'italic' }}>
        Aucune action en attente
      </Text>
    )
  }

  return (
    <Flex direction="column" gap="1">
      {entries.map(([entity, count]) => (
        <Flex key={entity} justify="between" align="center">
          <Text size="2" color="gray">
            {getEntityLabel(entity)}
          </Text>
          <Text
            size="2"
            weight="bold"
            style={{
              fontVariantNumeric: 'tabular-nums',
              color: 'var(--gray-12)',
            }}
          >
            {count}
          </Text>
        </Flex>
      ))}
    </Flex>
  )
}

function HistoryList({ entries }: { entries: SyncHistoryEntry[] }) {
  if (entries.length === 0) {
    return (
      <Text size="2" color="gray" style={{ fontStyle: 'italic' }}>
        Aucun historique
      </Text>
    )
  }

  return (
    <Flex direction="column" gap="2">
      {entries.slice(0, 5).map((entry) => {
        const isSuccess = entry.status === 'success'
        const Icon = isSuccess ? Check : X
        const color = isSuccess ? 'var(--green-9)' : 'var(--red-9)'
        const date = new Date(entry.timestamp)
        const timeStr = date.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        })

        return (
          <Flex key={entry.id} align="center" gap="2">
            <Icon
              size={14}
              style={{ color, flexShrink: 0 }}
              aria-hidden="true"
            />
            <Text size="1" color="gray" style={{ flex: 1 }}>
              {timeStr}
            </Text>
            <Text size="1" style={{ color: 'var(--gray-11)' }}>
              {entry.itemCount} element{entry.itemCount > 1 ? 's' : ''}
            </Text>
          </Flex>
        )
      })}
    </Flex>
  )
}

function ConflictList({ conflicts }: { conflicts: SyncConflict[] }) {
  if (conflicts.length === 0) return null

  return (
    <>
      <Separator size="4" />
      <Box>
        <Flex align="center" gap="2" mb="2">
          <AlertTriangle
            size={14}
            style={{ color: 'var(--red-9)' }}
            aria-hidden="true"
          />
          <Text size="2" weight="bold" style={{ color: 'var(--red-9)' }}>
            {conflicts.length} conflit{conflicts.length > 1 ? 's' : ''} non
            resolu{conflicts.length > 1 ? 's' : ''}
          </Text>
        </Flex>
        <Flex direction="column" gap="1">
          {conflicts.slice(0, 3).map((conflict) => (
            <Text key={conflict.id} size="1" color="gray">
              {getEntityLabel(conflict.entity)} — {conflict.description}
            </Text>
          ))}
          {conflicts.length > 3 && (
            <Text size="1" color="gray" style={{ fontStyle: 'italic' }}>
              ...et {conflicts.length - 3} autre
              {conflicts.length - 3 > 1 ? 's' : ''}
            </Text>
          )}
        </Flex>
      </Box>
    </>
  )
}

// ============================================================================
// Composant principal
// ============================================================================

export function SyncStatus({
  isSyncing,
  isOffline,
  pendingSummary,
  pendingTotal,
  syncProgress,
  syncHistory,
  conflicts,
  onSyncNow,
  children,
}: SyncStatusProps) {
  const canSync = !isOffline && !isSyncing

  return (
    <Popover.Root>
      <Popover.Trigger>{children}</Popover.Trigger>

      <Popover.Content
        size="2"
        maxWidth="340px"
        style={{ maxHeight: 460, overflowY: 'auto' }}
      >
        <Flex direction="column" gap="3">
          {/* En-tete */}
          <Flex justify="between" align="center">
            <Text size="3" weight="bold">
              Synchronisation
            </Text>
            {isOffline ? <Flex
                align="center"
                gap="1"
                style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  backgroundColor: 'var(--red-a3)',
                  color: 'var(--red-9)',
                }}
              >
                <CloudOff size={12} aria-hidden="true" />
                <Text size="1" weight="medium">
                  Hors ligne
                </Text>
              </Flex> : null}
          </Flex>

          {/* Barre de progression (visible pendant sync) */}
          {isSyncing && syncProgress !== null ? <Box>
              <SyncProgressBar progress={syncProgress} />
              <Text size="1" color="gray" mt="1">
                Synchronisation en cours... {Math.round(syncProgress)}%
              </Text>
            </Box> : null}

          <Separator size="4" />

          {/* Mutations en attente */}
          <Box>
            <Flex align="center" gap="2" mb="2">
              <Clock
                size={14}
                style={{ color: 'var(--gray-9)' }}
                aria-hidden="true"
              />
              <Text size="2" weight="bold">
                En attente ({pendingTotal})
              </Text>
            </Flex>
            <PendingList summary={pendingSummary} />
          </Box>

          {/* Bouton sync */}
          <Button
            variant="solid"
            size="2"
            disabled={!canSync}
            onClick={onSyncNow}
            style={{
              width: '100%',
              cursor: canSync ? 'pointer' : 'not-allowed',
              minHeight: 44,
            }}
          >
            <RefreshCw
              size={14}
              style={{
                animation: isSyncing
                  ? 'spin 1.5s linear infinite'
                  : undefined,
              }}
              aria-hidden="true"
            />
            {isSyncing ? 'Synchronisation en cours...' : 'Synchroniser maintenant'}
          </Button>

          <Separator size="4" />

          {/* Historique */}
          <Box>
            <Text size="2" weight="bold" mb="2">
              Dernieres synchronisations
            </Text>
            <HistoryList entries={syncHistory} />
          </Box>

          {/* Conflits */}
          <ConflictList conflicts={conflicts} />
        </Flex>
      </Popover.Content>
    </Popover.Root>
  )
}
