"use client";

/**
 * StatChartCard - Card avec graphique Recharts intégré
 * Affiche un titre, sous-titre optionnel, et un graphique (line, bar, area)
 */

import { Text } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface StatChartCardProps {
  title: string;
  subtitle?: string;
  data: Record<string, unknown>[];
  type: "line" | "bar" | "area";
  dataKey: string;
  xAxisKey?: string;
  color: string;
  height?: number;
}

function ChartTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        backgroundColor: "var(--color-panel-solid)",
        border: "1px solid var(--gray-a6)",
        borderRadius: 8,
        padding: "8px 12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <p style={{ fontSize: 12, color: "var(--gray-11)", marginBottom: 4 }}>
        {label}
      </p>
      <p
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--gray-12)",
          fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
        }}
      >
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

export function StatChartCard({
  title,
  subtitle,
  data,
  type,
  dataKey,
  xAxisKey = "name",
  color,
  height = 200,
}: StatChartCardProps) {
  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 5, left: 5, bottom: 5 },
    };

    const axisProps = {
      tick: { fontSize: 11, fill: "var(--gray-9)" },
      axisLine: false,
      tickLine: false,
    };

    switch (type) {
      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a4)" />
            <XAxis dataKey={xAxisKey} {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: color }}
            />
          </LineChart>
        );
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a4)" />
            <XAxis dataKey={xAxisKey} {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip content={<ChartTooltipContent />} />
            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case "area":
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a4)" />
            <XAxis dataKey={xAxisKey} {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${dataKey})`}
            />
          </AreaChart>
        );
    }
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
      <div style={{ marginBottom: 16 }}>
        <Text size="2" weight="medium" style={{ color: "var(--gray-12)" }}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            size="1"
            style={{ color: "var(--gray-10)", display: "block", marginTop: 2 }}
          >
            {subtitle}
          </Text>
        ) : null}
      </div>

      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
