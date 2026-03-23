import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { NotificationData, TypeNotification } from "@/schemas/notification.schema";

// ============================================================================
// Types
// ============================================================================

interface NotificationPreferences {
  /** Jouer un son a la reception */
  sonActif: boolean;
  /** Demander les notifications browser (Web Push) */
  browserPush: boolean;
  /** Types de notifications actifs (tous par defaut) */
  typesActifs: TypeNotification[];
}

interface NotificationState {
  notifications: NotificationData[];
  unreadCount: number;
  preferences: NotificationPreferences;
  /** Panel ouvert/ferme */
  isOpen: boolean;
}

interface NotificationActions {
  addNotification: (notification: NotificationData) => void;
  addNotifications: (notifications: NotificationData[]) => void;
  setNotifications: (notifications: NotificationData[]) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (notificationId: string) => void;
  clearAll: () => void;
  setIsOpen: (open: boolean) => void;
  toggleOpen: () => void;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
}

type NotificationStore = NotificationState & NotificationActions;

// ============================================================================
// Valeurs par defaut
// ============================================================================

const DEFAULT_PREFERENCES: NotificationPreferences = {
  sonActif: true,
  browserPush: false,
  typesActifs: ["COMMANDE", "STOCK", "TABLE", "PAIEMENT", "SYSTEME", "LIVRAISON", "CAISSE"],
};

const MAX_NOTIFICATIONS = 100;

// ============================================================================
// Store
// ============================================================================

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      // --- State ---
      notifications: [],
      unreadCount: 0,
      preferences: DEFAULT_PREFERENCES,
      isOpen: false,

      // --- Actions ---

      addNotification: (notification) => {
        const { preferences } = get();

        // Verifier si le type est actif dans les preferences
        if (!preferences.typesActifs.includes(notification.type)) return;

        set((state) => {
          // Eviter les doublons
          if (state.notifications.some((n) => n.id === notification.id)) return state;

          const updated = [notification, ...state.notifications].slice(0, MAX_NOTIFICATIONS);
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.lue).length,
          };
        });
      },

      addNotifications: (newNotifications) => {
        set((state) => {
          const existingIds = new Set(state.notifications.map((n) => n.id));
          const unique = newNotifications.filter((n) => !existingIds.has(n.id));
          if (unique.length === 0) return state;

          const updated = [...unique, ...state.notifications].slice(0, MAX_NOTIFICATIONS);
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.lue).length,
          };
        });
      },

      setNotifications: (notifications) => {
        set({
          notifications: notifications.slice(0, MAX_NOTIFICATIONS),
          unreadCount: notifications.filter((n) => !n.lue).length,
        });
      },

      markAsRead: (notificationId) => {
        set((state) => {
          const updated = state.notifications.map((n) =>
            n.id === notificationId ? { ...n, lue: true } : n
          );
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.lue).length,
          };
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, lue: true })),
          unreadCount: 0,
        }));
      },

      dismissNotification: (notificationId) => {
        set((state) => {
          const updated = state.notifications.filter((n) => n.id !== notificationId);
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.lue).length,
          };
        });
      },

      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      setIsOpen: (open) => set({ isOpen: open }),

      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

      updatePreferences: (prefs) => {
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        }));
      },
    }),
    {
      name: "notification-storage",
      // Ne persister que les preferences, pas les notifications elles-memes
      partialize: (state) => ({
        preferences: state.preferences,
      }),
    }
  )
);
