'use client'

/**
 * Hook Realtime pour les commandes (cuisine/bar).
 *
 * Écoute les nouvelles lignes de vente et les changements
 * de statut de préparation en temps réel.
 * Utile pour l'écran cuisine et l'écran bar.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { subscribeToOrders } from '@/lib/realtime/subscriptions'
import type { LigneVente } from '@/lib/db/types'

interface UseRealtimeOrdersOptions {
  etablissementId: string | null | undefined
  enabled?: boolean
  /** Callback optionnel appelé lors d'une nouvelle commande (pour notifications) */
  onNewOrder?: (ligne: LigneVente) => void
  /** Nombre max de commandes récentes à conserver en mémoire */
  maxLatestOrders?: number
}

interface UseRealtimeOrdersReturn {
  /** Commandes récentes reçues via Realtime (les plus récentes en premier) */
  latestOrders: LigneVente[]
  /** Dernière commande reçue */
  lastOrder: LigneVente | null
  isSubscribed: boolean
  error: Error | null
  /** Vide la liste des commandes récentes */
  clearOrders: () => void
}

export function useRealtimeOrders({
  etablissementId,
  enabled = true,
  onNewOrder,
  maxLatestOrders = 50,
}: UseRealtimeOrdersOptions): UseRealtimeOrdersReturn {
  const [latestOrders, setLatestOrders] = useState<LigneVente[]>([])
  const [lastOrder, setLastOrder] = useState<LigneVente | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const supabaseRef = useRef(createClient())
  const onNewOrderRef = useRef(onNewOrder)

  const isSubscribed = useMemo(
    () => enabled === true && !!etablissementId,
    [enabled, etablissementId]
  )

  // Garder la ref du callback à jour sans recréer l'effet
  useEffect(() => {
    onNewOrderRef.current = onNewOrder
  }, [onNewOrder])

  const handleInsert = useCallback((newLigne: LigneVente) => {
    setLastOrder(newLigne)
    setLatestOrders((prev) => {
      const updated = [newLigne, ...prev]
      return updated.slice(0, maxLatestOrders)
    })
    onNewOrderRef.current?.(newLigne)
  }, [maxLatestOrders])

  const handleUpdate = useCallback((updatedLigne: LigneVente) => {
    setLatestOrders((prev) =>
      prev.map((l) => (l.id === updatedLigne.id ? updatedLigne : l))
    )
  }, [])

  const handleDelete = useCallback((oldLigne: Partial<LigneVente>) => {
    if (!oldLigne.id) return
    setLatestOrders((prev) => prev.filter((l) => l.id !== oldLigne.id))
  }, [])

  const handleError = useCallback((err: Error) => {
    setError(err)
    console.error('[useRealtimeOrders]', err.message)
  }, [])

  const clearOrders = useCallback(() => {
    setLatestOrders([])
    setLastOrder(null)
  }, [])

  useEffect(() => {
    if (!enabled || !etablissementId) {
      return
    }

    const supabase = supabaseRef.current
    const cleanup = subscribeToOrders(
      supabase,
      etablissementId,
      {
        onInsert: handleInsert,
        onUpdate: handleUpdate,
        onDelete: handleDelete,
        onError: handleError,
      }
    )

    return cleanup
  }, [etablissementId, enabled, handleInsert, handleUpdate, handleDelete, handleError])

  return { latestOrders, lastOrder, isSubscribed, error, clearOrders }
}
