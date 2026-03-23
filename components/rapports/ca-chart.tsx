"use client";

/**
 * CAChart - Graphique du chiffre d'affaires par periode
 * Utilise Recharts pour afficher un graphique en barres ou lignes
 */

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Box, Card, Flex, Text, SegmentedControl, Select, Skeleton } from "@radix-ui/themes";
import { ChartBar, ChartLine } from "@phosphor-icons/react";
import { getCAByPeriod, type CAByPeriodItem } from "@/actions/rapports";
import { formatCurrency } from "@/lib/utils";

type ChartType = "bar" | "line";
type GroupBy = "jour" | "semaine" | "mois";

interface CAChartProps {
  initialData?: CAByPeriodItem[];
}

export function CAChart({ initialData }: CAChartProps) {
  const [data, setData] = useState<CAByPeriodItem[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [groupBy, setGroupBy] = useState<GroupBy>("jour");

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const now = new Date();
        let from: Date;
        const to = new Date(now);
        to.setHours(23, 59, 59, 999);

        switch (groupBy) {
          case "jour":
            from = new Date(now);
            from.setDate(from.getDate() - 14); // 2 semaines
            break;
          case "semaine":
            from = new Date(now);
            from.setDate(from.getDate() - 84); // 12 semaines
            break;
          case "mois":
            from = new Date(now);
            from.setMonth(from.getMonth() - 12); // 12 mois
            break;
          default:
            from = new Date(now);
            from.setDate(from.getDate() - 14);
        }
        from.setHours(0, 0, 0, 0);

        const result = await getCAByPeriod(from, to, groupBy);
        setData(result);
      } catch (error) {
        console.error("Erreur chargement CA:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [groupBy]);

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; name: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          style={{
            backgroundColor: "var(--color-panel-solid)",
            border: "1px solid var(--gray-a6)",
            borderRadius: 8,
            padding: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <Text size="2" weight="bold" style={{ display: "block", marginBottom: 8 }}>
            {label}
          </Text>
          <Flex direction="column" gap="1">
            <Text size="2" color="gray">
              CA: <Text weight="medium">{formatCurrency(payload[0].value)}</Text>
            </Text>
          </Flex>
        </Box>
      );
    }
    return null;
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value.toString();
  };

  if (isLoading) {
    return (
      <Card size="3">
        <Flex justify="between" align="center" mb="4">
          <Text size="4" weight="bold">
            Chiffre d'affaires
          </Text>
          <Flex gap="3">
            <Skeleton width="200px" height="32px" />
            <Skeleton width="120px" height="32px" />
          </Flex>
        </Flex>
        <Box style={{ height: 350 }}>
          <Skeleton width="100%" height="100%" />
        </Box>
      </Card>
    );
  }

  return (
    <Card size="3">
      <Flex justify="between" align="center" mb="4" wrap="wrap" gap="3">
        <Text size="4" weight="bold">
          Chiffre d'affaires
        </Text>
        <Flex gap="3" align="center">
          <Select.Root value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
            <Select.Trigger placeholder="Grouper par" />
            <Select.Content position="popper">
              <Select.Item value="jour">Par jour</Select.Item>
              <Select.Item value="semaine">Par semaine</Select.Item>
              <Select.Item value="mois">Par mois</Select.Item>
            </Select.Content>
          </Select.Root>

          <SegmentedControl.Root
            value={chartType}
            onValueChange={(v) => setChartType(v as ChartType)}
          >
            <SegmentedControl.Item value="bar">
              <ChartBar size={16} />
            </SegmentedControl.Item>
            <SegmentedControl.Item value="line">
              <ChartLine size={16} />
            </SegmentedControl.Item>
          </SegmentedControl.Root>
        </Flex>
      </Flex>

      <Box style={{ height: 350 }}>
        {data.length === 0 ? (
          <Flex align="center" justify="center" style={{ height: "100%" }}>
            <Text size="3" color="gray">
              Aucune donnee pour cette periode
            </Text>
          </Flex>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a5)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--gray-11)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--gray-a6)" }}
                />
                <YAxis
                  tick={{ fill: "var(--gray-11)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatYAxis}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="ca" fill="var(--accent-9)" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            ) : (
              <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a5)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--gray-11)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--gray-a6)" }}
                />
                <YAxis
                  tick={{ fill: "var(--gray-11)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatYAxis}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="ca"
                  stroke="var(--accent-9)"
                  strokeWidth={2}
                  dot={{ fill: "var(--accent-9)", r: 4 }}
                  activeDot={{ r: 6, fill: "var(--accent-9)" }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </Box>
    </Card>
  );
}
