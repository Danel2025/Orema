import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIStore {
  // Etat
  theme: "light" | "dark" | "auto";
  accentColor: string;
  fontSize: "small" | "medium" | "large";
  sidebarOpen: boolean;
  activeModule: string;

  // Actions
  setTheme: (theme: "light" | "dark" | "auto") => void;
  setAccentColor: (color: string) => void;
  setFontSize: (size: "small" | "medium" | "large") => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveModule: (module: string) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // Etat initial
      theme: "auto",
      accentColor: "violet",
      fontSize: "medium",
      sidebarOpen: true,
      activeModule: "dashboard",

      // Actions
      setTheme: (theme) => set({ theme }),
      setAccentColor: (color) => set({ accentColor: color }),
      setFontSize: (size) => set({ fontSize: size }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setActiveModule: (module) => set({ activeModule: module }),
    }),
    {
      name: "ui-storage",
    }
  )
);
