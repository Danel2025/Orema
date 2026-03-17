'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { WifiOff, X } from 'lucide-react'

/** Delai avant reapparition apres fermeture (5 minutes) */
const REAPPEAR_DELAY_MS = 5 * 60 * 1000

interface OfflineBannerProps {
  /** true si le reseau est hors ligne */
  isOffline: boolean
}

export function OfflineBanner({ isOffline }: OfflineBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const reappearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (reappearTimerRef.current) {
      clearTimeout(reappearTimerRef.current)
      reappearTimerRef.current = null
    }
  }, [])

  const handleDismiss = useCallback(() => {
    setIsDismissed(true)
    clearTimer()
    reappearTimerRef.current = setTimeout(() => {
      setIsDismissed(false)
    }, REAPPEAR_DELAY_MS)
  }, [clearTimer])

  // Reinitialiser quand on repasse en ligne
  useEffect(() => {
    if (!isOffline) {
      setIsDismissed(false)
      clearTimer()
    }
  }, [isOffline, clearTimer])

  // Cleanup timer au demontage
  useEffect(() => {
    return () => clearTimer()
  }, [clearTimer])

  const showBanner = isOffline && !isDismissed

  return (
    <AnimatePresence>
      {showBanner ? <motion.div
          key="offline-banner"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          role="alert"
          aria-live="assertive"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '10px 20px',
            backgroundColor: 'var(--amber-3)',
            borderBottom: '1px solid var(--amber-6)',
            color: 'var(--amber-11)',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <WifiOff
            size={16}
            style={{ flexShrink: 0, color: 'var(--amber-9)' }}
            aria-hidden="true"
          />
          <span>
            Vous etes hors ligne. Les modifications seront synchronisees au
            retour du reseau.
          </span>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Fermer la banniere hors ligne"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              minWidth: 44,
              minHeight: 44,
              padding: 8,
              border: 'none',
              borderRadius: 6,
              backgroundColor: 'transparent',
              color: 'var(--amber-11)',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--amber-a4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </motion.div> : null}
    </AnimatePresence>
  )
}
