"use client";

import Link from "next/link";
import type { Route } from "next";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { useMounted } from "@/hooks/use-mounted";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import {
  MagnifyingGlass,
  Sun,
  Moon,
  SquaresFour,
  ShoppingCart,
  ForkKnife,
  Package,
  Warehouse,
  Users,
  UserCircle,
  ChartBar,
  Gear,
  Star,
  Rocket,
  Crown,
  Sparkle,
  ArrowUp,
} from "@phosphor-icons/react";
import { Tooltip } from "@radix-ui/themes";
import { NotificationCenter } from "./notification-center";
import { useTheme } from "next-themes";
import { UserMenu } from "./user-menu";
import { useAuth } from "@/lib/auth/context";
import { resolvePlanSlug, isPlanFree, PLANS, type PlanSlug } from "@/lib/config/plans";

interface NavItem {
  label: string;
  href: Route;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const allNavItems: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard" as Route, icon: SquaresFour },
  { label: "Caisse", href: "/caisse" as Route, icon: ShoppingCart },
  { label: "Salle", href: "/salle" as Route, icon: ForkKnife },
  { label: "Produits", href: "/produits" as Route, icon: Package },
  { label: "Stocks", href: "/stocks" as Route, icon: Warehouse },
  { label: "Clients", href: "/clients" as Route, icon: Users },
  { label: "Employés", href: "/employes" as Route, icon: UserCircle },
  { label: "Rapports", href: "/rapports" as Route, icon: ChartBar },
  { label: "Paramètres", href: "/parametres" as Route, icon: Gear },
];

// ── Plan Badge Config ─────────────────────────────────────────────────

const PLAN_ICONS: Record<PlanSlug, PhosphorIcon> = {
  essentiel: Star,
  pro: Rocket,
  business: Crown,
  enterprise: Sparkle,
};

const PLAN_COLORS: Record<PlanSlug, { bg: string; border: string; icon: string; text: string }> = {
  essentiel: { bg: "var(--gray-a3)", border: "var(--gray-a5)", icon: "var(--gray-9)", text: "var(--gray-11)" },
  pro: { bg: "var(--blue-a3)", border: "var(--blue-a5)", icon: "var(--blue-9)", text: "var(--blue-11)" },
  business: { bg: "var(--orange-a3)", border: "var(--orange-a5)", icon: "var(--orange-9)", text: "var(--orange-11)" },
  enterprise: { bg: "var(--violet-a3)", border: "var(--violet-a5)", icon: "var(--violet-9)", text: "var(--violet-11)" },
};

function HeaderPlanBadge({ user }: { user: ReturnType<typeof useAuth>["user"] }) {
  if (!user) return null;

  const planSlug = resolvePlanSlug(user.plan ?? "essentiel");
  const plan = PLANS[planSlug];
  const PlanIcon = PLAN_ICONS[planSlug];
  const colors = PLAN_COLORS[planSlug];
  const isFree = isPlanFree(planSlug);

  return (
    <Tooltip content="Gérer votre abonnement">
      <Link
        href="/parametres/abonnement"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          borderRadius: 6,
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          textDecoration: "none",
          transition: "all 0.15s ease",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = colors.icon;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = colors.border;
        }}
      >
        <PlanIcon size={16} weight="duotone" style={{ color: colors.icon, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
          {plan.nom}
        </span>
        {isFree && (
          <ArrowUp
            size={14}
            weight="bold"
            style={{ color: "var(--accent-9)", flexShrink: 0 }}
          />
        )}
      </Link>
    </Tooltip>
  );
}

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
              style={{ objectFit: "contain", flexShrink: 0, width: "auto", height: "auto" }}
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
          <MagnifyingGlass size={18} style={{ color: "var(--gray-9)" }} />
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

        {/* Plan Badge */}
        <HeaderPlanBadge user={user} />

        {/* User Menu */}
        <UserMenu />
      </div>
    </header>
  );
}
