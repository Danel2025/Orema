'use client'

import { useState } from 'react'
import { Tooltip } from '@radix-ui/themes'
import { Wifi as WifiHighIcon, WifiOff as WifiSlashIcon, RefreshCw as ArrowsClockwiseIcon } from 'lucide-react'
import { PendingSyncBadge } from './pending-sync-badge'

type ConnectionStatus = 'online' | 'offline' | 'syncing'

interface OfflineIndicatorProps {
  /** Statut de connexion reseau */
  status: ConnectionStatus
  /** Nombre de mutations en attente */
  pendingCount: number
  /** Derniere synchronisation reussie (timestamp ISO ou null) */
  lastSyncedAt: string | null
  /** Callback pour ouvrir le panneau de sync detaille */
  onOpenSyncPanel?: () => void
}

const statusConfig: Record<
  ConnectionStatus,
  {
    icon: typeof WifiHighIcon
    color: string
    bgColor: string
    label: string
  }
> = {
  online: {
    icon: WifiHighIcon,
    color: 'var(--green-9)',
    bgColor: 'var(--green-a3)',
    label: 'En ligne',
  },
  offline: {
    icon: WifiSlashIcon,
    color: 'var(--red-9)',
    bgColor: 'var(--red-a3)',
    label: 'Hors ligne',
  },
  syncing: {
    icon: ArrowsClockwiseIcon,
    color: 'var(--purple-9)',
    bgColor: 'var(--purple-a3)',
    label: 'Synchronisation...',
  },
}

function formatLastSync(isoDate: string | null): string {
  if (!isoDate) return 'jamais'

  const diff = Date.now() - new Date(isoDate).getTime()
  const seconds = Math.floor(diff / 1000)

  if (seconds < 60) return 'il y a quelques secondes'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours}h`
  return `il y a ${Math.floor(hours / 24)}j`
}

function getTooltipContent(
  status: ConnectionStatus,
  pendingCount: number,
  lastSyncedAt: string | null,
): string {
  const syncText = `Derniere sync : ${formatLastSync(lastSyncedAt)}`

  switch (status) {
    case 'online':
      if (pendingCount > 0) {
        return `En ligne — ${pendingCount} action${pendingCount > 1 ? 's' : ''} en attente\n${syncText}`
      }
      return `En ligne — ${syncText}`
    case 'offline':
      if (pendingCount > 0) {
        return `Hors ligne — ${pendingCount} action${pendingCount > 1 ? 's' : ''} en attente`
      }
      return 'Hors ligne — aucune action en attente'
    case 'syncing':
      return `Synchronisation en cours... ${pendingCount} restante${pendingCount > 1 ? 's' : ''}`
  }
}

export function OfflineIndicator({
  status,
  pendingCount,
  lastSyncedAt,
  onOpenSyncPanel,
}: OfflineIndicatorProps) {
  const config = statusConfig[status]
  const Icon = config.icon
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Tooltip
      content={getTooltipContent(status, pendingCount, lastSyncedAt)}
      side="bottom"
    >
      <button
        type="button"
        onClick={onOpenSyncPanel}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={`Statut reseau : ${config.label}. ${pendingCount} mutations en attente.`}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          minWidth: 44,
          minHeight: 44,
          borderRadius: 8,
          border: 'none',
          backgroundColor: isHovered ? config.bgColor : 'transparent',
          cursor: 'pointer',
          transition: 'background-color 0.15s ease',
        }}
      >
        <Icon
          size={18}
          color={config.color}
          strokeWidth={2.5}
          style={{
            animation:
              status === 'syncing'
                ? 'spin 1.5s linear infinite'
                : undefined,
          }}
        />
        <PendingSyncBadge count={pendingCount} />
      </button>
    </Tooltip>
  )
}
