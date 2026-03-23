"use client";

/**
 * PeakHoursChart - Graphique des heures de pointe
 * Affiche la repartition des ventes par heure de la journee
 */

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Box, Card, Flex, Text, Skeleton } from "@radix-ui/themes";
import { Clock } from "@phosphor-icons/react";
import { getPeakHours, type PeakHourData } from "@/actions/rapports";
import { formatCurrency } from "@/lib/utils";

interface PeakHoursChartProps {
  initialData?: PeakHourData[];
}

export function PeakHoursChart({ initialData }: PeakHoursChartProps) {
  const [data, setData] = useState<PeakHourData[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const result = await getPeakHours();
        setData(result);
      } catch (error) {
        console.error("Erreur chargement heures de pointe:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (!initialData) {
      fetchData();
    }
  }, [initialData]);

  // Filtrer les heures d'ouverture (6h - 23h generalement)
  const filteredData = data.filter((d) => d.heure >= 6 && d.heure <= 23);

  // Trouver le max pour le gradient de couleur
  const maxVentes = Math.max(...filteredData.map((d) => d.nombreVentes), 1);

  // Fonction pour obtenir la couleur en fonction de l'intensite
  const getBarColor = (nombreVentes: number): string => {
    const intensity = nombreVentes / maxVentes;
    if (intensity > 0.8) return "var(--accent-9)";
    if (intensity > 0.6) return "var(--accent-8)";
    if (intensity > 0.4) return "var(--accent-7)";
    if (intensity > 0.2) return "var(--accent-6)";
    if (intensity > 0) return "var(--accent-5)";
    return "var(--gray-4)";
  };

  // Identifier les heures de pointe
  const peakHours = filteredData
    .filter((d) => d.nombreVentes > 0)
    .sort((a, b) => b.nombreVentes - a.nombreVentes)
    .slice(0, 3);

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ payload: PeakHourData }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
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
            {data.label}
          </Text>
          <Flex direction="column" gap="1">
            <Text size="2" color="gray">
              Ventes: <Text weight="medium">{data.nombreVentes}</Text>
            </Text>
            <Text size="2" color="gray">
              CA: <Text weight="medium">{formatCurrency(data.ca)}</Text>
            </Text>
          </Flex>
        </Box>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card size="3">
        <Flex justify="between" align="center" mb="4">
          <Flex align="center" gap="2">
            <Clock size={20} style={{ color: "var(--blue-9)" }} />
            <Text size="4" weight="bold">
              Heures de pointe
            </Text>
          </Flex>
        </Flex>
        <Box style={{ height: 300 }}>
          <Skeleton width="100%" height="100%" />
        </Box>
      </Card>
    );
  }

  const hasData = filteredData.some((d) => d.nombreVentes > 0);

  return (
    <Card size="3">
      <Flex justify="between" align="start" mb="4" wrap="wrap" gap="3">
        <Flex align="center" gap="2">
          <Clock size={20} style={{ color: "var(--blue-9)" }} />
          <Text size="4" weight="bold">
            Heures de pointe
          </Text>
        </Flex>

        {peakHours.length > 0 && (
          <Flex gap="2" wrap="wrap">
            {peakHours.map((peak, i) => (
              <Box
                key={peak.heure}
                style={{
                  padding: "4px 12px",
                  borderRadius: 20,
                  backgroundColor: i === 0 ? "var(--accent-a3)" : "var(--gray-a3)",
                  border: `1px solid ${i === 0 ? "var(--accent-a6)" : "var(--gray-a6)"}`,
                }}
              >
                <Text size="1" weight="medium" color={i === 0 ? "violet" : "gray"}>
                  {peak.label} - {peak.nombreVentes} ventes
                </Text>
              </Box>
            ))}
          </Flex>
        )}
      </Flex>

      <Box style={{ height: 300 }}>
        {!hasData ? (
          <Flex align="center" justify="center" style={{ height: "100%" }}>
            <Text size="3" color="gray">
              Aucune vente aujourd'hui
            </Text>
          </Flex>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a5)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--gray-11)", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "var(--gray-a6)" }}
                interval={1}
              />
              <YAxis
                tick={{ fill: "var(--gray-11)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="nombreVentes" radius={[4, 4, 0, 0]} maxBarSize={30}>
                {filteredData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.nombreVentes)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Card>
  );
}
