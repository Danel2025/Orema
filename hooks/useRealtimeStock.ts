'use client'

/**
 * Hook Realtime pour les alertes de stock.
 *
 * Écoute les changements sur la table `produits` et détecte
 * quand un produit passe sous son seuil d'alerte (stock_min).
 * Utile pour les notifications de stock bas.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { subscribeToStock } from '@/lib/realtime/subscriptions'
import type { Produit } from '@/lib/db/types'

export interface LowStockAlert {
  produitId: string
  nom: string
  stockActuel: number | null
  seuilAlerte: number | null
  timestamp: string
}

interface UseRealtimeStockOptions {
  etablissementId: string | null | undefined
  enabled?: boolean
  /** Callback appelé lors d'une nouvelle alerte stock bas */
  onLowStock?: (alert: LowStockAlert) => void
}

interface UseRealtimeStockReturn {
  /** Liste des alertes de stock bas actives */
  lowStockAlerts: LowStockAlert[]
  isSubscribed: boolean
  error: Error | null
  /** Retirer une alerte (une fois traitée par l'utilisateur) */
  dismissAlert: (produitId: string) => void
  /** Vider toutes les alertes */
  clearAlerts: () => void
}

export function useRealtimeStock({
  etablissementId,
  enabled = true,
  onLowStock,
}: UseRealtimeStockOptions): UseRealtimeStockReturn {
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([])
  const [error, setError] = useState<Error | null>(null)
  const supabaseRef = useRef(createClient())
  const onLowStockRef = useRef(onLowStock)

  const isSubscribed = useMemo(
    () => enabled === true && !!etablissementId,
    [enabled, etablissementId]
  )

  useEffect(() => {
    onLowStockRef.current = onLowStock
  }, [onLowStock])

  const handleStockUpdate = useCallback((produit: Produit) => {
    if (
      !produit.gerer_stock ||
      produit.stock_actuel === null ||
      produit.stock_min === null
    ) {
      setLowStockAlerts((prev) =>
        prev.filter((a) => a.produitId !== produit.id)
      )
      return
    }

    if (produit.stock_actuel <= produit.stock_min) {
      const alert: LowStockAlert = {
        produitId: produit.id,
        nom: produit.nom,
        stockActuel: produit.stock_actuel,
        seuilAlerte: produit.stock_min,
        timestamp: new Date().toISOString(),
      }

      setLowStockAlerts((prev) => {
        const existing = prev.findIndex((a) => a.produitId === produit.id)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = alert
          return updated
        }
        return [alert, ...prev]
      })

      onLowStockRef.current?.(alert)
    } else {
      setLowStockAlerts((prev) =>
        prev.filter((a) => a.produitId !== produit.id)
      )
    }
  }, [])

  const handleError = useCallback((err: Error) => {
    setError(err)
    console.error('[useRealtimeStock]', err.message)
  }, [])

  const dismissAlert = useCallback((produitId: string) => {
    setLowStockAlerts((prev) =>
      prev.filter((a) => a.produitId !== produitId)
    )
  }, [])

  const clearAlerts = useCallback(() => {
    setLowStockAlerts([])
  }, [])

  useEffect(() => {
    if (!enabled || !etablissementId) {
      return
    }

    const supabase = supabaseRef.current
    const cleanup = subscribeToStock(
      supabase,
      etablissementId,
      {
        onUpdate: handleStockUpdate,
        onError: handleError,
      }
    )

    return cleanup
  }, [etablissementId, enabled, handleStockUpdate, handleError])

  return { lowStockAlerts, isSubscribed, error, dismissAlert, clearAlerts }
}
