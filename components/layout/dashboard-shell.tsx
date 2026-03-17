"use client";

import { useUIStore } from "@/stores/ui-store";
import { useAuth } from "@/lib/auth/context";
import { Sidebar, SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COLLAPSED } from "./sidebar";
import { Header } from "./header";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { sidebarOpen } = useUIStore();
  const { isAdmin } = useAuth();

  // Les non-admins n'ont pas de sidebar
  const showSidebar = isAdmin;
  const sidebarWidth = showSidebar
    ? (sidebarOpen ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED)
    : 0;

  return (
    <div style={{ display: "flex", height: "100%", minHeight: 0 }}>
      {/* Sidebar - Visible uniquement pour les admins */}
      {showSidebar ? <Sidebar /> : null}

      {/* Main wrapper - Pleine largeur pour non-admins, décalé pour admins */}
      <div
        style={{
          flex: 1,
          marginLeft: sidebarWidth,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 0,
          overflow: "hidden",
          backgroundColor: "var(--gray-2)",
          transition: "margin-left 0.2s ease",
        }}
      >
        {/* Header sticky en haut avec z-index */}
        <div style={{ flexShrink: 0, zIndex: 10 }}>
          <Header />
        </div>

        {/* Contenu principal avec padding et scroll interne */}
        <main
          style={{
            flex: 1,
            padding: "24px 32px",
            overflowY: "auto",
            overflowX: "hidden",
            minHeight: 0,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
