"use client";

import Link from "next/link";
import type { Route } from "next";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { useMounted } from "@/hooks/use-mounted";
import {
  Search,
  Sun,
  Moon,
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  Package,
  Warehouse,
  Users,
  UserCircle,
  BarChart3,
  Settings,
} from "lucide-react";
import { NotificationCenter } from "./notification-center";
import { useTheme } from "next-themes";
import { UserMenu } from "./user-menu";
import { useAuth } from "@/lib/auth/context";

interface NavItem {
  label: string;
  href: Route;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const allNavItems: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard" as Route, icon: LayoutDashboard },
  { label: "Caisse", href: "/caisse" as Route, icon: ShoppingCart },
  { label: "Salle", href: "/salle" as Route, icon: UtensilsCrossed },
  { label: "Produits", href: "/produits" as Route, icon: Package },
  { label: "Stocks", href: "/stocks" as Route, icon: Warehouse },
  { label: "Clients", href: "/clients" as Route, icon: Users },
  { label: "Employés", href: "/employes" as Route, icon: UserCircle },
  { label: "Rapports", href: "/rapports" as Route, icon: BarChart3 },
  { label: "Paramètres", href: "/parametres" as Route, icon: Settings },
];

export function Header() {
  const mounted = useMounted();
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const { isAdmin, canAccessRoute, user } = useAuth();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  };

  // Navigation items filtrés pour les non-admins
  const navItems = useMemo(() => {
    if (!user) {
      console.log("[Header] No user, returning empty navItems");
      return [];
    }
    if (isAdmin) {
      console.log("[Header] User is admin, returning empty navItems (admin uses sidebar)");
      return [];
    }

    console.log("[Header] User:", user.email, "Role:", user.role);
    console.log("[Header] allowedRoutes:", JSON.stringify(user.allowedRoutes));

    const filtered = allNavItems.filter((item) => {
      const result = canAccessRoute(item.href);
      console.log(
        "[Header] Route:",
        item.href,
        "→ allowed:",
        result.allowed,
        result.reason ? `(${result.reason})` : ""
      );
      return result.allowed;
    });

    console.log(
      "[Header] Filtered navItems count:",
      filtered.length,
      "items:",
      filtered.map((i) => i.href).join(", ")
    );
    return filtered;
  }, [user, isAdmin, canAccessRoute]);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        height: 64,
        backgroundColor: "var(--color-background)",
        borderBottom: "1px solid var(--gray-a6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        gap: 24,
      }}
    >
      {/* Logo + Navigation pour non-admins */}
      {!isAdmin && (
        <div style={{ display: "flex", alignItems: "center", gap: 24, flexShrink: 0 }}>
          {/* Logo */}
          <Link
            href="/dashboard"
            style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}
          >
            <Image
              src="/images/logos/ic-lg.webp"
              alt="Oréma N+"
              width={36}
              height={36}
              style={{ objectFit: "contain", flexShrink: 0 }}
            />
            <span
              style={{
                fontWeight: 700,
                fontSize: 16,
                color: "var(--gray-12)",
                whiteSpace: "nowrap",
              }}
            >
              Oréma N+
            </span>
          </Link>

          {/* Navigation horizontale */}
          <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 12px",
                    borderRadius: 6,
                    textDecoration: "none",
                    backgroundColor: isActive ? "var(--accent-9)" : "transparent",
                    color: isActive ? "white" : "var(--gray-11)",
                    fontWeight: isActive ? 600 : 500,
                    fontSize: 13,
                    transition: "all 0.15s ease",
                    whiteSpace: "nowrap",
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
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Search - visible pour admins, caché ou réduit pour non-admins */}
      <div style={{ flex: 1, maxWidth: isAdmin ? 400 : 300 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            backgroundColor: "var(--gray-a3)",
            borderRadius: 8,
            padding: "10px 14px",
          }}
        >
          <Search size={18} style={{ color: "var(--gray-9)" }} />
          <input
            type="text"
            placeholder="Rechercher produits, clients..."
            autoComplete="off"
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: 14,
              color: "var(--gray-12)",
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Theme & Notifications */}
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              width: 40,
              height: 40,
              border: "none",
              backgroundColor: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Basculer le thème"
          >
            {mounted && resolvedTheme === "light" ? (
              <Moon size={18} style={{ color: "var(--gray-11)" }} />
            ) : (
              <Sun size={18} style={{ color: "var(--gray-11)" }} />
            )}
          </button>

          {/* Notifications */}
          <NotificationCenter />
        </div>

        {/* User Menu */}
        <UserMenu />
      </div>
    </header>
  );
}
