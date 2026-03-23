"use client";

/**
 * SubscriptionBadge - Badge stylisé pour le plan d'abonnement
 * Affiche le nom du plan avec une icône et des couleurs distinctes
 */

import { Crown, Star, Sparkle, Rocket } from "@phosphor-icons/react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import type { PlanType } from "./types";

interface SubscriptionBadgeProps {
  plan: PlanType;
  size?: "sm" | "md" | "lg";
}

const planConfig: Record<
  PlanType,
  {
    label: string;
    icon: PhosphorIcon;
    color: string;
    bg: string;
    border: string;
  }
> = {
  essentiel: {
    label: "Essentiel",
    icon: Star,
    color: "var(--gray-11)",
    bg: "var(--gray-a3)",
    border: "var(--gray-a6)",
  },
  pro: {
    label: "Pro",
    icon: Rocket,
    color: "var(--blue-11)",
    bg: "var(--blue-a3)",
    border: "var(--blue-a6)",
  },
  business: {
    label: "Business",
    icon: Crown,
    color: "var(--orange-11)",
    bg: "var(--orange-a3)",
    border: "var(--orange-a6)",
  },
  enterprise: {
    label: "Enterprise",
    icon: Sparkle,
    color: "var(--violet-11)",
    bg: "var(--violet-a3)",
    border: "var(--violet-a6)",
  },
};

const sizeConfig = {
  sm: { height: 24, fontSize: 11, iconSize: 12, px: 8, gap: 4 },
  md: { height: 28, fontSize: 12, iconSize: 14, px: 10, gap: 5 },
  lg: { height: 34, fontSize: 14, iconSize: 16, px: 14, gap: 6 },
};

export function SubscriptionBadge({ plan, size = "md" }: SubscriptionBadgeProps) {
  const config = planConfig[plan];
  const s = sizeConfig[size];
  const Icon = config.icon;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: s.gap,
        height: s.height,
        paddingLeft: s.px,
        paddingRight: s.px,
        borderRadius: 999,
        fontSize: s.fontSize,
        fontWeight: 600,
        color: config.color,
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={s.iconSize} weight="fill" style={{ color: config.color }} />
      {config.label}
    </span>
  );
}
