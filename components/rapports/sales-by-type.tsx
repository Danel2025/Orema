"use client";

/**
 * SalesByType - Repartition des ventes par type (Direct, Table, Livraison, Emporter)
 */

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Box, Card, Flex, Text, Select, Skeleton, Badge } from "@radix-ui/themes";
import { Storefront, ForkKnife, Truck, ShoppingBag } from "@phosphor-icons/react";
import { getSalesByType, type SalesByTypeData, type PeriodeType } from "@/actions/rapports";
import { formatCurrency } from "@/lib/utils";

interface SalesByTypeProps {
  initialData?: SalesByTypeData[];
}

// Couleurs et icones pour chaque type
const TYPE_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  DIRECT: {
    color: "var(--green-9)",
    icon: <Storefront size={18} />,
    label: "Vente directe",
  },
  TABLE: {
    color: "var(--blue-9)",
    icon: <ForkKnife size={18} />,
    label: "Service en salle",
  },
  LIVRAISON: {
    color: "var(--accent-9)",
    icon: <Truck size={18} />,
    label: "Livraison",
  },
  EMPORTER: {
    color: "var(--purple-9)",
    icon: <ShoppingBag size={18} />,
    label: "A emporter",
  },
};

export function SalesByType({ initialData }: SalesByTypeProps) {
  const [data, setData] = useState<SalesByTypeData[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [periode, setPeriode] = useState<PeriodeType>("jour");

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const result = await getSalesByType(periode);
        setData(result);
      } catch (error) {
        console.error("Erreur chargement ventes par type:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [periode]);

  const totalVentes = data.reduce((sum, d) => sum + d.count, 0);
  const totalMontant = data.reduce((sum, d) => sum + d.montant, 0);

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: SalesByTypeData }>;
  }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const config = TYPE_CONFIG[item.type];
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
          <Flex align="center" gap="2" mb="2">
            <Box style={{ color: config.color }}>{config.icon}</Box>
            <Text size="2" weight="bold">
              {item.label}
            </Text>
          </Flex>
          <Flex direction="column" gap="1">
            <Text size="2" color="gray">
              Ventes: <Text weight="medium">{item.count}</Text>
            </Text>
            <Text size="2" color="gray">
              CA: <Text weight="medium">{formatCurrency(item.montant)}</Text>
            </Text>
            <Text size="2" color="gray">
              Part: <Text weight="medium">{item.pourcentage}%</Text>
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
          <Text size="4" weight="bold">
            Ventes par type
          </Text>
          <Skeleton width="120px" height="32px" />
        </Flex>
        <Box style={{ height: 200 }}>
          <Skeleton width="100%" height="100%" />
        </Box>
      </Card>
    );
  }

  const hasData = data.length > 0 && totalVentes > 0;

  return (
    <Card size="3">
      <Flex justify="between" align="center" mb="4" wrap="wrap" gap="3">
        <Text size="4" weight="bold">
          Ventes par type
        </Text>
        <Select.Root value={periode} onValueChange={(v) => setPeriode(v as PeriodeType)}>
          <Select.Trigger placeholder="Periode" />
          <Select.Content position="popper">
            <Select.Item value="jour">Aujourd'hui</Select.Item>
            <Select.Item value="semaine">Cette semaine</Select.Item>
            <Select.Item value="mois">Ce mois</Select.Item>
            <Select.Item value="annee">Cette annee</Select.Item>
          </Select.Content>
        </Select.Root>
      </Flex>

      {!hasData ? (
        <Flex align="center" justify="center" style={{ height: 200 }}>
          <Text size="3" color="gray">
            Aucune vente pour cette periode
          </Text>
        </Flex>
      ) : (
        <Flex direction="column" gap="4">
          {/* Barres horizontales */}
          <Box style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fill: "var(--gray-11)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={120}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="montant" radius={[0, 4, 4, 0]} maxBarSize={32}>
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={TYPE_CONFIG[entry.type]?.color || "var(--gray-7)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>

          {/* Legende avec details */}
          <Flex gap="3" wrap="wrap">
            {data.map((item) => {
              const config = TYPE_CONFIG[item.type];
              return (
                <Box
                  key={item.type}
                  style={{
                    flex: 1,
                    minWidth: 150,
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: "var(--gray-a2)",
                    border: `1px solid var(--gray-a5)`,
                  }}
                >
                  <Flex align="center" gap="2" mb="2">
                    <Box style={{ color: config.color }}>{config.icon}</Box>
                    <Text size="2" weight="medium">
                      {item.label}
                    </Text>
                  </Flex>
                  <Flex direction="column" gap="1">
                    <Text
                      size="4"
                      weight="bold"
                      style={{
                        fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                      }}
                    >
                      {formatCurrency(item.montant)}
                    </Text>
                    <Flex align="center" gap="2">
                      <Badge variant="soft" color="gray" size="1">
                        {item.count} ventes
                      </Badge>
                      <Badge
                        variant="soft"
                        color={item.pourcentage > 30 ? "green" : "gray"}
                        size="1"
                      >
                        {item.pourcentage}%
                      </Badge>
                    </Flex>
                  </Flex>
                </Box>
              );
            })}
          </Flex>

          {/* Total */}
          <Flex
            justify="between"
            align="center"
            style={{
              padding: "12px 16px",
              borderRadius: 8,
              backgroundColor: "var(--accent-a3)",
            }}
          >
            <Flex align="center" gap="2">
              <Text size="2" weight="bold">
                Total
              </Text>
              <Badge variant="soft">{totalVentes} ventes</Badge>
            </Flex>
            <Text
              size="3"
              weight="bold"
              style={{
                fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
              }}
            >
              {formatCurrency(totalMontant)}
            </Text>
          </Flex>
        </Flex>
      )}
    </Card>
  );
}
