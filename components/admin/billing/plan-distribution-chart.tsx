"use client";

/**
 * Graphique de répartition des plans (PieChart)
 * Couleurs par plan : gray (essentiel), blue (pro), orange (business), violet (enterprise)
 */

import { Box, Flex, Heading, Text } from "@radix-ui/themes";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { resolvePlanSlug, type PlanSlug } from "@/lib/config/plans";
import type { PlanDistribution } from "./types";

interface PlanDistributionChartProps {
  data: PlanDistribution[];
}

const PLAN_COLORS: Record<PlanSlug, string> = {
  essentiel: "#8B8D98",
  pro: "#3E63DD",
  business: "#F76B15",
  enterprise: "#8E4EC6",
};

function getPlanColor(plan: string): string {
  const slug = resolvePlanSlug(plan);
  return PLAN_COLORS[slug] ?? "#8B8D98";
}

interface ChartDataItem extends PlanDistribution {
  fill: string;
}

interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartDataItem;
  }>;
}

function CustomTooltip({ active, payload }: PieTooltipProps) {
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
      <Text size="2" color="gray" style={{ display: "block" }}>
        {item.count} établissement{item.count > 1 ? "s" : ""} ({item.pourcentage}%)
      </Text>
      <Text
        size="2"
        style={{
          display: "block",
          fontFamily: "var(--font-google-sans-code), monospace",
          marginTop: 2,
        }}
      >
        {formatCurrency(item.revenuMensuel)}/mois
      </Text>
    </Box>
  );
}

export function PlanDistributionChart({ data }: PlanDistributionChartProps) {
  const chartData: ChartDataItem[] = data.map((item) => ({
    ...item,
    fill: getPlanColor(item.plan),
  }));

  const totalEtablissements = data.reduce((acc, item) => acc + item.count, 0);

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
      <Heading size="3" weight="bold" mb="4">
        Répartition des plans
      </Heading>

      {data.length === 0 ? (
        <Flex align="center" justify="center" style={{ height: 200 }}>
          <Text size="2" color="gray">
            Aucune donnée disponible
          </Text>
        </Flex>
      ) : (
        <>
          <Box style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="count"
                  stroke="none"
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.plan} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </Box>

          {/* Légende custom */}
          <Flex direction="column" gap="3" mt="4">
            {data.map((item) => (
              <Flex key={item.plan} align="center" justify="between">
                <Flex align="center" gap="2">
                  <Box
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      background: getPlanColor(item.plan),
                      flexShrink: 0,
                    }}
                  />
                  <Text size="2">{item.label}</Text>
                </Flex>
                <Flex align="center" gap="3">
                  <Text size="2" color="gray">
                    {item.count}/{totalEtablissements}
                  </Text>
                  <Text
                    size="2"
                    weight="medium"
                    style={{
                      fontFamily: "var(--font-google-sans-code), monospace",
                      minWidth: 40,
                      textAlign: "right",
                    }}
                  >
                    {item.pourcentage}%
                  </Text>
                </Flex>
              </Flex>
            ))}
          </Flex>
        </>
      )}
    </Box>
  );
}
