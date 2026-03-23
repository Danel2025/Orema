"use client";

import {
  Users,
  SquaresFour,
  CheckCircle,
  Clock,
  CookingPot,
  Receipt,
  Sparkle,
  type Icon,
} from "@phosphor-icons/react";

interface TablesStatsProps {
  stats: {
    total: number;
    libres: number;
    occupees: number;
    enPreparation: number;
    additionDemandee: number;
    aNettoyer: number;
    capaciteTotale: number;
    capaciteDisponible: number;
  };
}

interface StatItem {
  label: string;
  value: number;
  color: string;
  bgColor: string;
  icon: Icon;
}

export function TablesStats({ stats }: TablesStatsProps) {
  const items: StatItem[] = [
    {
      label: "Total",
      value: stats.total,
      color: "#6b7280",
      bgColor: "rgba(107, 114, 128, 0.1)",
      icon: SquaresFour,
    },
    {
      label: "Libres",
      value: stats.libres,
      color: "#22c55e",
      bgColor: "rgba(34, 197, 94, 0.1)",
      icon: CheckCircle,
    },
    {
      label: "Occupées",
      value: stats.occupees,
      color: "#eab308",
      bgColor: "rgba(234, 179, 8, 0.1)",
      icon: Clock,
    },
    {
      label: "En préparation",
      value: stats.enPreparation,
      color: "#3b82f6",
      bgColor: "rgba(59, 130, 246, 0.1)",
      icon: CookingPot,
    },
    {
      label: "Addition",
      value: stats.additionDemandee,
      color: "#f97316",
      bgColor: "rgba(249, 115, 22, 0.1)",
      icon: Receipt,
    },
    {
      label: "À nettoyer",
      value: stats.aNettoyer,
      color: "#ef4444",
      bgColor: "rgba(239, 68, 68, 0.1)",
      icon: Sparkle,
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              backgroundColor: "var(--color-panel-solid)",
              borderRadius: 10,
              border: "1px solid var(--gray-a5)",
              minWidth: 120,
            }}
          >
            {/* Icône avec fond coloré */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: item.bgColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={18} style={{ color: item.color }} />
            </div>
            {/* Valeur et label */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--gray-12)",
                  lineHeight: 1.2,
                  fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                }}
              >
                {item.value}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--gray-10)",
                  lineHeight: 1.3,
                }}
              >
                {item.label}
              </span>
            </div>
          </div>
        );
      })}

      {/* Séparateur vertical */}
      <div
        style={{
          width: 1,
          backgroundColor: "var(--gray-a5)",
          alignSelf: "stretch",
          margin: "0 4px",
        }}
      />

      {/* Couverts disponibles */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 4,
          padding: "12px 16px",
          backgroundColor: "var(--color-panel-solid)",
          borderRadius: 10,
          border: "1px solid var(--gray-a5)",
          minWidth: 150,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "var(--gray-10)",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            fontWeight: 500,
          }}
        >
          Couverts disponibles
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Users size={18} style={{ color: "#22c55e" }} />
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#22c55e",
              fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
            }}
          >
            {stats.capaciteDisponible}
          </span>
          <span style={{ fontSize: 14, color: "var(--gray-10)" }}>
            / {stats.capaciteTotale} couverts
          </span>
        </div>
      </div>
    </div>
  );
}
