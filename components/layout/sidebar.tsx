"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import Image from "next/image";
import { IconButton, Tooltip } from "@radix-ui/themes";
import {
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  Package,
  Warehouse,
  Users,
  UserCircle,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
} from "lucide-react";
import { CookingPot, BeerBottle, ChatCircleDots } from "@phosphor-icons/react";
import { useUIStore } from "@/stores/ui-store";
import { useAuth } from "@/lib/auth/context";
import { SidebarPlanWidget } from "./sidebar-plan-widget";

interface NavItem {
  label: string;
  href: Route;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const allNavItems: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard" as Route, icon: LayoutDashboard },
  { label: "Caisse", href: "/caisse" as Route, icon: ShoppingCart },
  { label: "Plan de salle", href: "/salle" as Route, icon: UtensilsCrossed },
  { label: "Cuisine", href: "/cuisine" as Route, icon: CookingPot },
  { label: "Bar", href: "/bar" as Route, icon: BeerBottle },
  { label: "Produits", href: "/produits" as Route, icon: Package },
  { label: "Stocks", href: "/stocks" as Route, icon: Warehouse },
  { label: "Clients", href: "/clients" as Route, icon: Users },
  { label: "Avis", href: "/avis" as Route, icon: ChatCircleDots },
  { label: "Employés", href: "/employes" as Route, icon: UserCircle },
  { label: "Rapports", href: "/rapports" as Route, icon: BarChart3 },
  { label: "Paramètres", href: "/parametres" as Route, icon: Settings },
  { label: "Administration", href: "/admin" as Route, icon: ShieldCheck },
];

export const SIDEBAR_WIDTH_EXPANDED = 256;
export const SIDEBAR_WIDTH_COLLAPSED = 72;

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { canAccessRoute, user } = useAuth();
  const isCollapsed = !sidebarOpen;

  const sidebarWidth = isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  // Filtrer les items de navigation selon les permissions
  const navItems = useMemo(() => {
    if (!user) return [];
    return allNavItems.filter((item) => {
      const result = canAccessRoute(item.href);
      return result.allowed;
    });
  }, [user, canAccessRoute]);

  return (
    <aside
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: sidebarWidth,
        backgroundColor: "var(--color-background)",
        borderRight: "1px solid var(--gray-a6)",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "width 0.2s ease",
      }}
    >
      {/* Logo - Hauteur 64px comme le header */}
      <div
        style={{
          height: 64,
          padding: isCollapsed ? "0 16px" : "0 16px",
          borderBottom: "1px solid var(--gray-a6)",
          display: "flex",
          alignItems: "center",
          justifyContent: isCollapsed ? "center" : "flex-start",
        }}
      >
        <Link
          href="/dashboard"
          style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}
        >
          <Image
            src="/images/logos/ic-lg.webp"
            alt="Oréma N+"
            width={40}
            height={40}
            style={{ objectFit: "contain", flexShrink: 0, width: "auto", height: "auto" }}
          />
          {!isCollapsed && (
            <div style={{ whiteSpace: "nowrap", overflow: "hidden" }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: "var(--gray-12)" }}>Oréma N+</div>
              <div style={{ fontSize: 12, color: "var(--gray-11)" }}>Système POS</div>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav role="navigation" aria-label="Menu principal" className="sidebar-nav-scroll" style={{ flex: 1, padding: "12px 8px", overflowY: "auto", overflowX: "hidden" }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          const linkContent = (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: isCollapsed ? "center" : "flex-start",
                gap: 12,
                padding: isCollapsed ? "12px" : "12px 16px",
                marginBottom: 4,
                borderRadius: 8,
                textDecoration: "none",
                minHeight: 44,
                backgroundColor: isActive ? "var(--accent-9)" : "transparent",
                color: isActive ? "white" : "var(--gray-11)",
                fontWeight: isActive ? 600 : 500,
                fontSize: 14,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "var(--gray-a3)";
                  e.currentTarget.style.color = "var(--gray-12)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--gray-11)";
                }
              }}
            >
              <span style={{ flexShrink: 0, display: "flex" }}>
                <Icon size={20} />
              </span>
              {!isCollapsed && (
                <span
                  style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );

          // Afficher un Tooltip quand la sidebar est repliée
          if (isCollapsed) {
            return (
              <Tooltip key={item.href} content={item.label} side="right">
                {linkContent}
              </Tooltip>
            );
          }

          return linkContent;
        })}
      </nav>

      {/* Plan widget */}
      <SidebarPlanWidget isCollapsed={isCollapsed} />

      {/* Bouton Toggle */}
      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          justifyContent: isCollapsed ? "center" : "flex-end",
        }}
      >
        <Tooltip content={isCollapsed ? "Agrandir le menu" : "Réduire le menu"} side="right">
          <IconButton
            variant="surface"
            color="gray"
            size="2"
            radius="full"
            onClick={toggleSidebar}
            style={{ cursor: "pointer" }}
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </IconButton>
        </Tooltip>
      </div>

      {/* Footer */}
      <div style={{ padding: isCollapsed ? 8 : 16, borderTop: "1px solid var(--gray-a6)" }}>
        {isCollapsed ? (
          <Tooltip content="Version 1.0.0 - © 2026 Oréma N+" side="right">
            <div
              style={{
                padding: 8,
                backgroundColor: "var(--gray-a3)",
                borderRadius: 8,
                fontSize: 10,
                color: "var(--gray-11)",
                textAlign: "center",
                cursor: "default",
              }}
            >
              v1.0
            </div>
          </Tooltip>
        ) : (
          <div
            style={{
              padding: 12,
              backgroundColor: "var(--gray-a3)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--gray-11)",
            }}
          >
            <div>Version 1.0.0</div>
            <div>© 2026 Oréma N+</div>
          </div>
        )}
      </div>
    </aside>
  );
}
