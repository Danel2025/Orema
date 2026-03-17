/**
 * StatCard - Card de statistique pour le dashboard
 * Affiche une métrique avec icône, titre et valeur
 */

import type { LucideIcon } from "lucide-react";

export interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: "violet" | "blue" | "green" | "purple" | "red" | "amber";
}

export function StatCard({ title, value, icon: Icon, trend, color = "violet" }: StatCardProps) {
  const colorMap = {
    violet: "var(--accent-9)",
    blue: "var(--blue-9)",
    green: "var(--green-9)",
    purple: "var(--purple-9)",
    red: "var(--red-9)",
    amber: "var(--purple-9)",
  };

  const bgColorMap = {
    violet: "var(--accent-a3)",
    blue: "var(--blue-a3)",
    green: "var(--green-a3)",
    purple: "var(--purple-a3)",
    red: "var(--red-a3)",
    amber: "var(--purple-a3)",
  };

  return (
    <div
      style={{
        backgroundColor: "var(--color-panel-solid)",
        borderRadius: 12,
        padding: 20,
        border: "1px solid var(--gray-a6)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {/* Header avec titre et icône */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        {/* Titre */}
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--gray-11)",
          }}
        >
          {title}
        </span>

        {/* Icône dans un cercle coloré */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: bgColorMap[color],
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon style={{ color: colorMap[color], width: 24, height: 24 }} />
        </div>
      </div>

      {/* Valeur en grand */}
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: "var(--gray-12)",
          fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.2,
          marginBottom: trend ? 12 : 0,
        }}
      >
        {value}
      </div>

      {/* Trend (optionnel) */}
      {trend ? <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: trend.isPositive ? "var(--green-9)" : "var(--red-9)",
            }}
          >
            {trend.isPositive ? "↑" : "↓"} {trend.value}
          </span>
          <span style={{ fontSize: 13, color: "var(--gray-10)" }}>
            vs. hier
          </span>
        </div> : null}
    </div>
  );
}
