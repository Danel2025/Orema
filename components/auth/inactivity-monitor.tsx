"use client";

/**
 * Composant de surveillance d'inactivite
 *
 * @security Fonctionnalites:
 * - Deconnexion automatique apres 30 minutes d'inactivite
 * - Avertissement 5 minutes avant la deconnexion
 * - Detection des evenements utilisateur (souris, clavier, touch)
 * - Persistance du timer entre les onglets
 */

import { useEffect, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, Clock } from "lucide-react";

// Configuration des timeouts (en millisecondes)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_LOGOUT = 5 * 60 * 1000; // Avertir 5 minutes avant
const ACTIVITY_CHECK_INTERVAL = 1000; // Verifier chaque seconde

// Evenements qui comptent comme activite
const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
] as const;

interface InactivityMonitorProps {
  /**
   * Fonction a appeler pour deconnecter l'utilisateur
   * Par defaut, redirige vers /login
   */
  onLogout?: () => Promise<void>;

  /**
   * Timeout d'inactivite en millisecondes
   * Par defaut: 30 minutes
   */
  timeout?: number;

  /**
   * Temps avant deconnexion pour afficher l'avertissement
   * Par defaut: 5 minutes
   */
  warningTime?: number;

  /**
   * Desactiver le moniteur (utile pour certaines pages)
   */
  disabled?: boolean;
}

export function InactivityMonitor({
  onLogout,
  timeout = INACTIVITY_TIMEOUT,
  warningTime = WARNING_BEFORE_LOGOUT,
  disabled = false,
}: InactivityMonitorProps) {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(warningTime);
  const lastActivityRef = useRef<number>(0);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Remet a zero le timer d'inactivite
   */
  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    // Cacher l'avertissement si affiche
    if (showWarning) {
      setShowWarning(false);
    }

    // Persister le timestamp pour synchroniser entre onglets
    try {
      localStorage.setItem("lastActivity", String(Date.now()));
    } catch {
      // localStorage peut ne pas etre disponible
    }
  }, [showWarning]);

  /**
   * Effectue la deconnexion
   */
  const performLogout = useCallback(async () => {
    // Nettoyer les timeouts
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Appeler le callback de deconnexion ou rediriger
    if (onLogout) {
      await onLogout();
    } else {
      router.push("/login?reason=inactivity");
    }
  }, [onLogout, router]);

  /**
   * Verifie l'inactivite et declenche les actions appropriees
   */
  const checkInactivity = useCallback(() => {
    const now = Date.now();
    const lastActivity = lastActivityRef.current;

    // Synchroniser avec les autres onglets
    try {
      const storedLastActivity = localStorage.getItem("lastActivity");
      if (storedLastActivity) {
        const storedTime = parseInt(storedLastActivity, 10);
        if (storedTime > lastActivity) {
          lastActivityRef.current = storedTime;
          return; // L'utilisateur est actif dans un autre onglet
        }
      }
    } catch {
      // localStorage peut ne pas etre disponible
    }

    const inactiveTime = now - lastActivity;
    const timeUntilLogout = timeout - inactiveTime;

    // Verifier si on doit afficher l'avertissement
    if (timeUntilLogout <= warningTime && timeUntilLogout > 0) {
      if (!showWarning) {
        setShowWarning(true);
      }
      setTimeRemaining(Math.ceil(timeUntilLogout / 1000) * 1000);
    }

    // Verifier si on doit deconnecter
    if (timeUntilLogout <= 0) {
      performLogout();
    }
  }, [timeout, warningTime, showWarning, performLogout]);

  /**
   * Prolonge la session (bouton "Rester connecte")
   */
  const extendSession = useCallback(() => {
    resetTimer();
    setShowWarning(false);
  }, [resetTimer]);

  // Effet pour les event listeners
  useEffect(() => {
    if (disabled) return;

    // Handler pour les evenements d'activite
    const handleActivity = () => {
      resetTimer();
    };

    // Ajouter les event listeners
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Handler pour la synchronisation entre onglets
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "lastActivity" && e.newValue) {
        const newTime = parseInt(e.newValue, 10);
        if (newTime > lastActivityRef.current) {
          lastActivityRef.current = newTime;
          if (showWarning) {
            setShowWarning(false);
          }
        }
      }
    };
    window.addEventListener("storage", handleStorage);

    // Demarrer l'intervalle de verification
    intervalRef.current = setInterval(checkInactivity, ACTIVITY_CHECK_INTERVAL);

    // Cleanup
    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      window.removeEventListener("storage", handleStorage);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
    };
  }, [disabled, resetTimer, checkInactivity, showWarning]);

  // Ne rien rendre si desactive
  if (disabled) return null;

  // Formater le temps restant
  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <Dialog.Root open={showWarning} onOpenChange={setShowWarning}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50 bg-black/50"
          style={{ backdropFilter: "blur(4px)" }}
        />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2">
          <div className="rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-800">
            {/* Icon d'avertissement */}
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
                <AlertTriangle className="h-8 w-8 text-violet-500" />
              </div>
            </div>

            {/* Titre */}
            <Dialog.Title className="mb-2 text-center text-xl font-semibold text-slate-900 dark:text-white">
              Session sur le point d'expirer
            </Dialog.Title>

            {/* Description */}
            <Dialog.Description className="mb-6 text-center text-slate-600 dark:text-slate-300">
              Vous serez deconnecte dans
            </Dialog.Description>

            {/* Compte a rebours */}
            <div className="mb-6 flex items-center justify-center gap-2">
              <Clock className="h-5 w-5 text-violet-500" />
              <span className="font-mono text-3xl font-bold text-violet-500">{formattedTime}</span>
            </div>

            {/* Boutons */}
            <div className="flex gap-3">
              <button
                onClick={performLogout}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Se deconnecter
              </button>
              <button
                onClick={extendSession}
                className="flex-1 rounded-lg bg-violet-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-violet-600"
              >
                Rester connecte
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * Hook pour obtenir le temps d'inactivite
 */
export function useInactivityTime() {
  const [inactiveTime, setInactiveTime] = useState(0);
  const lastActivityRef = useRef<number>(0);

  useEffect(() => {
    lastActivityRef.current = Date.now();

    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    const interval = setInterval(() => {
      setInactiveTime(Date.now() - lastActivityRef.current);
    }, 1000);

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(interval);
    };
  }, []);

  return inactiveTime;
}
