"use client";

/**
 * Graphique de revenus mensuels (AreaChart)
 * 12 derniers mois avec gradient orange
 */

import { Box, Flex, Heading, Text } from "@radix-ui/themes";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { RevenueMonth } from "./types";

interface RevenueChartProps {
  data: RevenueMonth[];
}

function formatShortCurrency(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: RevenueMonth;
    value: number;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;

  return (
    <Box
      p="3"
      style={{
        background: "var(--color-background)",
        border: "1px solid var(--gray-a4)",
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <Text size="2" weight="bold" style={{ display: "block", marginBottom: 4 }}>
        {item.label}
      </Text>
      <Text
        size="2"
        style={{
          display: "block",
          fontFamily: "var(--font-google-sans-code), monospace",
          color: "var(--orange-11)",
        }}
      >
        {formatCurrency(item.revenus)}
      </Text>
      <Text size="1" color="gray" style={{ display: "block", marginTop: 2 }}>
        {item.nbPaiements} paiement{item.nbPaiements > 1 ? "s" : ""}
      </Text>
    </Box>
  );
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Box
      p="5"
      style={{
        background: "var(--color-background)",
        borderRadius: 12,
        border: "1px solid var(--gray-a4)",
        height: "100%",
      }}
    >
      <Flex align="center" justify="between" mb="4">
        <Heading size="3" weight="bold">
          Revenus mensuels
        </Heading>
        {data.length > 0 && (
          <Text size="1" color="gray">
            {data.length} dernier{data.length > 1 ? "s" : ""} mois
          </Text>
        )}
      </Flex>

      {data.length === 0 ? (
        <Flex align="center" justify="center" style={{ height: 280 }}>
          <Text size="2" color="gray">
            Aucune donnée disponible
          </Text>
        </Flex>
      ) : (
        <Box style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F76B15" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F76B15" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--gray-a4)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "var(--gray-9)" }}
                axisLine={{ stroke: "var(--gray-a4)" }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatShortCurrency}
                tick={{ fontSize: 12, fill: "var(--gray-9)" }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenus"
                stroke="#F76B15"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: "#F76B15",
                  stroke: "var(--color-background)",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Box>
  );
}
