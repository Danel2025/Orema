"use client";

/**
 * useKdsAlerts - Hook pour les alertes sonores et visuelles du KDS
 *
 * Gere les sons de notification via Web Audio API et
 * le flash du titre de la page quand l'onglet est inactif.
 */

import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "kds-sound-enabled";

interface UseKdsAlertsReturn {
  /** Si le son est active */
  soundEnabled: boolean;
  /** Toggle l'etat du son */
  toggleSound: () => void;
  /** Joue le son de nouvelle commande (bip court) */
  playNewOrderSound: () => void;
  /** Joue le son de commande prete (melodieux) */
  playOrderReadySound: () => void;
  /** IDs des commandes recemment arrivees (pour animation) */
  newOrderIds: Set<string>;
  /** Nombre de nouvelles commandes non vues */
  newOrderCount: number;
  /** Marquer une commande comme "vue" (enlever l'animation) */
  acknowledgeOrder: (orderId: string) => void;
  /** Marquer toutes les commandes comme vues */
  acknowledgeAll: () => void;
  /** Enregistrer une nouvelle commande (declenche son + flash + animation) */
  notifyNewOrder: (orderId: string) => void;
}

/**
 * Cree un AudioContext partage (lazy init pour eviter les erreurs navigateur)
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  } catch {
    return null;
  }
}

/**
 * Joue un bip court via Web Audio API
 * Son agreable : deux tons courts ascendants
 */
function playNewOrderBeep(ctx: AudioContext) {
  const now = ctx.currentTime;

  // Premier ton
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(587.33, now); // D5
  gain1.gain.setValueAtTime(0.3, now);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.15);

  // Deuxieme ton (plus aigu)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(783.99, now + 0.12); // G5
  gain2.gain.setValueAtTime(0, now);
  gain2.gain.setValueAtTime(0.3, now + 0.12);
  gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.12);
  osc2.stop(now + 0.3);
}

/**
 * Joue un son melodieux pour "commande prete"
 * Trois tons ascendants doux
 */
function playReadyChime(ctx: AudioContext) {
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 (accord majeur)
  const duration = 0.2;

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now + i * 0.15);
    gain.gain.setValueAtTime(0, now);
    gain.gain.setValueAtTime(0.25, now + i * 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.15);
    osc.stop(now + i * 0.15 + duration + 0.05);
  });
}

export function useKdsAlerts(): UseKdsAlertsReturn {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "true";
  });

  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());

  const audioCtxRef = useRef<AudioContext | null>(null);
  const titleFlashIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const originalTitleRef = useRef<string>("");
  const animationTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Initialiser l'AudioContext au premier interaction utilisateur
  const ensureAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = getAudioContext();
    }
    // Resume si suspendu (politique autoplay des navigateurs)
    if (audioCtxRef.current?.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Toggle son
  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      // Resume audio context si on active le son
      if (next) ensureAudioContext();
      return next;
    });
  }, [ensureAudioContext]);

  // Jouer le son nouvelle commande
  const playNewOrderSound = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = ensureAudioContext();
    if (ctx) playNewOrderBeep(ctx);
  }, [soundEnabled, ensureAudioContext]);

  // Jouer le son commande prete
  const playOrderReadySound = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = ensureAudioContext();
    if (ctx) playReadyChime(ctx);
  }, [soundEnabled, ensureAudioContext]);

  // Arreter le flash du titre
  const stopTitleFlash = useCallback(() => {
    if (titleFlashIntervalRef.current) {
      clearInterval(titleFlashIntervalRef.current);
      titleFlashIntervalRef.current = null;
    }
    if (typeof document !== "undefined" && originalTitleRef.current) {
      document.title = originalTitleRef.current;
    }
  }, []);

  // Flash du titre quand l'onglet est inactif
  const startTitleFlash = useCallback(() => {
    if (typeof document === "undefined") return;
    if (titleFlashIntervalRef.current) return; // Deja en cours

    originalTitleRef.current = document.title;
    let isOriginal = true;

    titleFlashIntervalRef.current = setInterval(() => {
      if (document.hidden) {
        document.title = isOriginal
          ? "Nouvelle commande !"
          : originalTitleRef.current;
        isOriginal = !isOriginal;
      } else {
        // L'onglet est redevenu actif, arreter le flash
        stopTitleFlash();
      }
    }, 1000);
  }, [stopTitleFlash]);

  // Arreter le flash quand l'onglet redevient visible
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        stopTitleFlash();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      stopTitleFlash();
    };
  }, [stopTitleFlash]);

  // Notifier une nouvelle commande
  const notifyNewOrder = useCallback(
    (orderId: string) => {
      // Son
      playNewOrderSound();

      // Flash titre si onglet inactif
      if (typeof document !== "undefined" && document.hidden) {
        startTitleFlash();
      }

      // Ajouter aux IDs animes
      setNewOrderIds((prev) => {
        const next = new Set(prev);
        next.add(orderId);
        return next;
      });

      // Auto-retirer l'animation apres 3 secondes
      const timeout = setTimeout(() => {
        setNewOrderIds((prev) => {
          const next = new Set(prev);
          next.delete(orderId);
          return next;
        });
        animationTimeoutsRef.current.delete(orderId);
      }, 3000);

      // Nettoyer un timeout precedent si existant
      const prevTimeout = animationTimeoutsRef.current.get(orderId);
      if (prevTimeout) clearTimeout(prevTimeout);
      animationTimeoutsRef.current.set(orderId, timeout);
    },
    [playNewOrderSound, startTitleFlash]
  );

  // Acknowledger une commande
  const acknowledgeOrder = useCallback((orderId: string) => {
    setNewOrderIds((prev) => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });
    const timeout = animationTimeoutsRef.current.get(orderId);
    if (timeout) {
      clearTimeout(timeout);
      animationTimeoutsRef.current.delete(orderId);
    }
  }, []);

  // Acknowledger toutes les commandes
  const acknowledgeAll = useCallback(() => {
    setNewOrderIds(new Set());
    animationTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    animationTimeoutsRef.current.clear();
    stopTitleFlash();
  }, [stopTitleFlash]);

  // Nettoyage a la destruction
  useEffect(() => {
    return () => {
      animationTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      animationTimeoutsRef.current.clear();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return {
    soundEnabled,
    toggleSound,
    playNewOrderSound,
    playOrderReadySound,
    newOrderIds,
    newOrderCount: newOrderIds.size,
    acknowledgeOrder,
    acknowledgeAll,
    notifyNewOrder,
  };
}
