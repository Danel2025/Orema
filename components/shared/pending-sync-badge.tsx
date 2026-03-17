'use client'

import { Badge } from '@radix-ui/themes'
import type { ComponentPropsWithoutRef } from 'react'

interface PendingSyncBadgeProps {
  count: number
  className?: string
}

const badgeColor = (
  count: number,
): ComponentPropsWithoutRef<typeof Badge>['color'] => {
  if (count === 0) return 'gray'
  if (count <= 10) return 'amber'
  return 'red'
}

export function PendingSyncBadge({ count, className }: PendingSyncBadgeProps) {
  if (count === 0) return null

  return (
    <span
      className={className}
      style={{
        position: 'absolute',
        top: -4,
        right: -4,
        zIndex: 1,
      }}
    >
      <Badge
        variant="solid"
        color={badgeColor(count)}
        size="1"
        radius="full"
        highContrast
        style={{
          minWidth: 18,
          height: 18,
          padding: '0 5px',
          fontSize: 11,
          fontWeight: 700,
          lineHeight: '18px',
          textAlign: 'center',
          fontVariantNumeric: 'tabular-nums',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }}
      >
        {count > 99 ? '99+' : count}
      </Badge>
    </span>
  )
}
