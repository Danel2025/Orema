'use client'

/**
 * Hook pour surveiller le statut reseau
 *
 * Utilise navigator.onLine + evenements online/offline comme base,
 * puis effectue un ping periodique vers Supabase pour verifier
 * la connectivite reelle quand le navigateur se croit hors ligne.
 */

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react'

// ============================================================================
// Abonnement externe pour navigator.onLine via useSyncExternalStore
// ============================================================================

function subscribeToOnlineStatus(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

function getOnlineSnapshot(): boolean {
  return navigator.onLine
}

function getServerSnapshot(): boolean {
  // Sur le serveur, on considere toujours online
  return true
}

// ============================================================================
// Constantes
// ============================================================================

/** Intervalle de ping quand offline (30 secondes) */
const PING_INTERVAL_OFFLINE = 30_000

/** Timeout pour le ping HTTP */
const PING_TIMEOUT = 5_000

// ============================================================================
// Hook principal
// ============================================================================

export interface NetworkStatusResult {
  /** true si le navigateur est connecte a internet */
  isOnline: boolean
  /** true si un ping de verification est en cours */
  isChecking: boolean
  /** Date du dernier ping reussi ou echoue */
  lastCheckedAt: Date | null
}

export function useNetworkStatus(): NetworkStatusResult {
  // Etat de base via useSyncExternalStore (recommande par React)
  const browserOnline = useSyncExternalStore(
    subscribeToOnlineStatus,
    getOnlineSnapshot,
    getServerSnapshot
  )

  const [isChecking, setIsChecking] = useState(false)
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null)
  // Etat reseau reel (confirme par ping quand offline)
  const [confirmedOnline, setConfirmedOnline] = useState(browserOnline)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Ping de verification de connectivite reelle
   * Envoie un HEAD vers l'URL Supabase publique
   */
  const checkConnectivity = useCallback(async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      // Pas d'URL Supabase configuree, se fier a navigator.onLine
      setConfirmedOnline(browserOnline)
      return
    }

    // Annuler le ping precedent si encore en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    // Timeout: annuler le fetch si trop long
    const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT)

    setIsChecking(true)

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        signal: controller.signal,
        // Pas besoin d'auth pour un simple HEAD check
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
      })

      if (!controller.signal.aborted) {
        setConfirmedOnline(response.ok)
      }
    } catch (err: unknown) {
      // Ignorer silencieusement les AbortError (timeout ou cleanup)
      if (err instanceof DOMException && err.name === 'AbortError') {
        return
      }
      if (!controller.signal.aborted) {
        setConfirmedOnline(false)
      }
    } finally {
      clearTimeout(timeoutId)
      if (!controller.signal.aborted) {
        setIsChecking(false)
        setLastCheckedAt(new Date())
      }
      abortControllerRef.current = null
    }
  }, [browserOnline])

  // Quand le navigateur passe en ligne, on confirme immediatement
  useEffect(() => {
    if (browserOnline) {
      setConfirmedOnline(true)
      // Faire un ping de confirmation en arriere-plan
      checkConnectivity()
    } else {
      // Navigateur dit offline: on met a jour et on lance le polling
      setConfirmedOnline(false)
    }
  }, [browserOnline, checkConnectivity])

  // Polling quand offline pour detecter le retour reseau
  useEffect(() => {
    if (confirmedOnline) {
      // En ligne: pas besoin de polling
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Hors ligne: ping periodique pour detecter le retour
    intervalRef.current = setInterval(checkConnectivity, PING_INTERVAL_OFFLINE)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [confirmedOnline, checkConnectivity])

  // Cleanup a la destruction du composant
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    isOnline: confirmedOnline,
    isChecking,
    lastCheckedAt,
  }
}
