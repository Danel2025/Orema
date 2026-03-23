"use client";

/**
 * ComparisonChart - Graphique comparatif multi-établissements
 * Barres groupées par métrique ou radar
 */

import { Flex, Text } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { EtablissementComparison } from "./types";

interface ComparisonChartProps {
  etablissements: EtablissementComparison[];
  metrics: string[];
  type?: "bar" | "radar";
  height?: number;
}

const COLORS = [
  "var(--accent-9)",
  "var(--blue-9)",
  "var(--green-9)",
  "var(--violet-9)",
  "var(--cyan-9)",
  "var(--pink-9)",
  "var(--orange-9)",
];

// Couleurs CSS resolues pour Recharts (qui ne supporte pas les CSS vars dans tous les contextes)
const FILL_COLORS = [
  "#f76b15", // orange
  "#3b82f6", // blue
  "#22c55e", // green
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#f59e0b", // amber
];

function ComparisonTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        backgroundColor: "var(--color-panel-solid)",
        border: "1px solid var(--gray-a6)",
        borderRadius: 8,
        padding: "10px 14px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <p style={{ fontSize: 12, color: "var(--gray-11)", marginBottom: 6 }}>{label}</p>
      {payload.map((entry) => (
        <div
          key={entry.name}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 2,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: entry.color,
            }}
          />
          <span style={{ fontSize: 12, color: "var(--gray-11)" }}>{entry.name}:</span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--gray-12)",
              fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
            }}
          >
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ComparisonChart({
  etablissements,
  metrics,
  type = "bar",
  height = 350,
}: ComparisonChartProps) {
  // Transformer les données pour Recharts
  // Format attendu : [{ metric: "CA", "Resto A": 1000, "Resto B": 2000 }, ...]
  const chartData = metrics.map((metric) => {
    const point: Record<string, string | number> = { metric };
    etablissements.forEach((etab) => {
      point[etab.nom] = etab.data[metric] ?? 0;
    });
    return point;
  });

  if (type === "radar") {
    return (
      <Flex direction="column" gap="3">
        <div style={{ width: "100%", height }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData}>
              <PolarGrid stroke="var(--gray-a4)" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fontSize: 11, fill: "var(--gray-10)" }}
              />
              <PolarRadiusAxis tick={{ fontSize: 10, fill: "var(--gray-9)" }} />
              {etablissements.map((etab, i) => (
                <Radar
                  key={etab.id}
                  name={etab.nom}
                  dataKey={etab.nom}
                  stroke={FILL_COLORS[i % FILL_COLORS.length]}
                  fill={FILL_COLORS[i % FILL_COLORS.length]}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              ))}
              <Legend
                wrapperStyle={{ fontSize: 12, color: "var(--gray-11)" }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="3">
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a4)" />
            <XAxis
              dataKey="metric"
              tick={{ fontSize: 11, fill: "var(--gray-10)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--gray-9)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ComparisonTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "var(--gray-11)" }}
            />
            {etablissements.map((etab, i) => (
              <Bar
                key={etab.id}
                dataKey={etab.nom}
                fill={FILL_COLORS[i % FILL_COLORS.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Flex>
  );
}
