import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Store pour la gestion du verrouillage par PIN
 *
 * Quand un utilisateur est authentifié mais que la session est "verrouillée",
 * il doit entrer son PIN pour accéder à l'application.
 *
 * Le verrouillage est persisté dans localStorage pour survivre aux rechargements.
 */

interface PinLockState {
  /** La session est-elle verrouillée ? */
  isLocked: boolean;

  /** Timestamp du dernier déverrouillage */
  lastUnlockedAt: number | null;

  /** ID de l'utilisateur pour lequel le lock s'applique */
  lockedUserId: string | null;

  /** Nombre de tentatives échouées */
  failedAttempts: number;

  /** Verrouiller la session */
  lock: (userId: string) => void;

  /** Déverrouiller la session */
  unlock: () => void;

  /** Incrémenter le compteur de tentatives échouées */
  incrementFailedAttempts: () => void;

  /** Réinitialiser le compteur de tentatives */
  resetFailedAttempts: () => void;

  /** Vérifier si la session doit être verrouillée pour un user donné */
  shouldLockForUser: (userId: string) => boolean;
}

export const usePinLockStore = create<PinLockState>()(
  persist(
    (set, get) => ({
      isLocked: true, // Par défaut, la session est verrouillée au démarrage
      lastUnlockedAt: null,
      lockedUserId: null,
      failedAttempts: 0,

      lock: (userId: string) => {
        set({
          isLocked: true,
          lockedUserId: userId,
          failedAttempts: 0,
        });
      },

      unlock: () => {
        set({
          isLocked: false,
          lastUnlockedAt: Date.now(),
          failedAttempts: 0,
        });
      },

      incrementFailedAttempts: () => {
        set((state) => ({
          failedAttempts: state.failedAttempts + 1,
        }));
      },

      resetFailedAttempts: () => {
        set({ failedAttempts: 0 });
      },

      shouldLockForUser: (userId: string) => {
        const state = get();

        // Si le lock est pour un autre utilisateur, on doit reverrouiller
        if (state.lockedUserId && state.lockedUserId !== userId) {
          return true;
        }

        // Si déjà verrouillé, garder le verrouillage
        if (state.isLocked) {
          return true;
        }

        // Sinon, pas besoin de verrouiller
        return false;
      },
    }),
    {
      name: "orema-pin-lock",
      // Ne pas persister isLocked (toujours verrouillé au démarrage)
      partialize: (state) => ({
        lockedUserId: state.lockedUserId,
        lastUnlockedAt: state.lastUnlockedAt,
      }),
      // Au chargement, toujours forcer le verrouillage
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLocked = true;
          state.failedAttempts = 0;
        }
      },
    }
  )
);
