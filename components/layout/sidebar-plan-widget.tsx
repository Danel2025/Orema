"use client";

import Link from "next/link";
import { Tooltip } from "@radix-ui/themes";
import { Star, Rocket, Crown, Sparkle, ArrowUp } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth/context";
import { resolvePlanSlug, isPlanFree, PLANS, type PlanSlug } from "@/lib/config/plans";

// ── Config ──────────────────────────────────────────────────────────────

const PLAN_ICONS = {
  essentiel: Star,
  pro: Rocket,
  business: Crown,
  enterprise: Sparkle,
} as const;

const PLAN_COLORS = {
  essentiel: { bg: "var(--gray-a3)", border: "var(--gray-a5)", icon: "var(--gray-9)", text: "var(--gray-11)" },
  pro: { bg: "var(--blue-a3)", border: "var(--blue-a5)", icon: "var(--blue-9)", text: "var(--blue-11)" },
  business: { bg: "var(--orange-a3)", border: "var(--orange-a5)", icon: "var(--orange-9)", text: "var(--orange-11)" },
  enterprise: { bg: "var(--violet-a3)", border: "var(--violet-a5)", icon: "var(--violet-9)", text: "var(--violet-11)" },
} as const;

// ── Component ───────────────────────────────────────────────────────────

export function SidebarPlanWidget({ isCollapsed }: { isCollapsed: boolean }) {
  const { user } = useAuth();
  if (!user) return null;

  const planSlug = resolvePlanSlug(user.plan ?? "essentiel");
  const plan = PLANS[planSlug];
  const Icon = PLAN_ICONS[planSlug];
  const colors = PLAN_COLORS[planSlug];
  const isFree = isPlanFree(planSlug);
  const canUpgrade = planSlug !== "enterprise";

  if (isCollapsed) {
    return (
      <div style={{ padding: "8px 16px" }}>
        <Tooltip
          content={`Plan ${plan.nom}${canUpgrade ? " — Mettre à niveau" : ""}`}
          side="right"
        >
          <Link
            href="/parametres/abonnement"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: 10,
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              textDecoration: "none",
              transition: "all 0.15s ease",
            }}
          >
            <Icon size={20} weight="duotone" style={{ color: colors.icon }} />
          </Link>
        </Tooltip>
      </div>
    );
  }

  return (
    <div style={{ padding: "8px 16px" }}>
      <Link
        href="/parametres/abonnement"
        style={{
          display: "block",
          padding: "12px 14px",
          borderRadius: 10,
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          textDecoration: "none",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = colors.icon;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = colors.border;
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Icon size={18} weight="duotone" style={{ color: colors.icon, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: colors.text,
                lineHeight: 1.3,
              }}
            >
              Plan {plan.nom}
            </div>
            {isFree && canUpgrade && (
              <div
                style={{
                  fontSize: 11,
                  color: "var(--gray-10)",
                  lineHeight: 1.3,
                  marginTop: 2,
                }}
              >
                Débloquez plus de fonctionnalités
              </div>
            )}
          </div>
          {canUpgrade && (
            <ArrowUp
              size={14}
              weight="bold"
              style={{ color: "var(--accent-9)", flexShrink: 0 }}
            />
          )}
        </div>
      </Link>
    </div>
  );
}
