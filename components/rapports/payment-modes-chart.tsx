"use client";

/**
 * PaymentModesChart - Graphique des ventes par mode de paiement
 * Affiche un camembert ou des barres horizontales
 */

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Box, Card, Flex, Text, Select, Skeleton } from "@radix-ui/themes";
import { CreditCard, Wallet, Smartphone, Banknote } from "lucide-react";
import { getSalesByPaymentMode, type PaymentModeData, type PeriodeType } from "@/actions/rapports";
import { formatCurrency } from "@/lib/utils";

interface PaymentModesChartProps {
  initialData?: PaymentModeData[];
}

// Couleurs pour chaque mode de paiement
const PAYMENT_COLORS: Record<string, string> = {
  ESPECES: "var(--green-9)",
  CARTE_BANCAIRE: "var(--blue-9)",
  AIRTEL_MONEY: "var(--red-9)",
  MOOV_MONEY: "var(--cyan-9)",
  CHEQUE: "var(--purple-9)",
  VIREMENT: "var(--purple-9)",
  COMPTE_CLIENT: "var(--accent-9)",
  MIXTE: "var(--gray-9)",
};

// Icones pour chaque mode
const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  ESPECES: <Banknote size={16} />,
  CARTE_BANCAIRE: <CreditCard size={16} />,
  AIRTEL_MONEY: <Smartphone size={16} />,
  MOOV_MONEY: <Smartphone size={16} />,
  CHEQUE: <Wallet size={16} />,
  VIREMENT: <CreditCard size={16} />,
  COMPTE_CLIENT: <Wallet size={16} />,
  MIXTE: <Wallet size={16} />,
};

export function PaymentModesChart({ initialData }: PaymentModesChartProps) {
  const [data, setData] = useState<PaymentModeData[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [periode, setPeriode] = useState<PeriodeType>("jour");

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const result = await getSalesByPaymentMode(periode);
        setData(result);
      } catch (error) {
        console.error("Erreur chargement modes de paiement:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [periode]);

  const totalMontant = data.reduce((sum, d) => sum + d.montant, 0);

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: PaymentModeData }>;
  }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
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
            <Box style={{ color: PAYMENT_COLORS[item.mode] }}>
              {PAYMENT_ICONS[item.mode]}
            </Box>
            <Text size="2" weight="bold">
              {item.label}
            </Text>
          </Flex>
          <Flex direction="column" gap="1">
            <Text size="2" color="gray">
              Montant: <Text weight="medium">{formatCurrency(item.montant)}</Text>
            </Text>
            <Text size="2" color="gray">
              Transactions: <Text weight="medium">{item.count}</Text>
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

  const renderCustomLabel = (props: {
    cx?: number;
    cy?: number;
    midAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    percent?: number;
  }) => {
    const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 } = props;

    if (percent < 0.05) return null; // Ne pas afficher si < 5%

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: 12, fontWeight: 600 }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (isLoading) {
    return (
      <Card size="3">
        <Flex justify="between" align="center" mb="4">
          <Flex align="center" gap="2">
            <CreditCard size={20} style={{ color: "var(--blue-9)" }} />
            <Text size="4" weight="bold">
              Modes de paiement
            </Text>
          </Flex>
          <Skeleton width="120px" height="32px" />
        </Flex>
        <Flex gap="6" wrap="wrap">
          <Box style={{ width: 200, height: 200 }}>
            <Skeleton width="100%" height="100%" style={{ borderRadius: "50%" }} />
          </Box>
          <Box style={{ flex: 1, minWidth: 200 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} width="100%" height="40px" mb="2" />
            ))}
          </Box>
        </Flex>
      </Card>
    );
  }

  const hasData = data.length > 0 && totalMontant > 0;

  return (
    <Card size="3">
      <Flex
        justify="between"
        align="center"
        mb="4"
        wrap="wrap"
        gap="3"
      >
        <Flex align="center" gap="2">
          <CreditCard size={20} style={{ color: "var(--blue-9)" }} />
          <Text size="4" weight="bold">
            Modes de paiement
          </Text>
        </Flex>
        <Select.Root value={periode} onValueChange={(v) => setPeriode(v as PeriodeType)}>
          <Select.Trigger placeholder="Periode" />
          <Select.Content>
            <Select.Item value="jour">Aujourd'hui</Select.Item>
            <Select.Item value="semaine">Cette semaine</Select.Item>
            <Select.Item value="mois">Ce mois</Select.Item>
            <Select.Item value="annee">Cette annee</Select.Item>
          </Select.Content>
        </Select.Root>
      </Flex>

      {!hasData ? (
        <Flex
          align="center"
          justify="center"
          style={{ height: 250 }}
        >
          <Text size="3" color="gray">
            Aucune vente pour cette periode
          </Text>
        </Flex>
      ) : (
        <Flex gap="6" wrap="wrap" align="center">
          <Box style={{ width: 200, height: 200, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={90}
                  innerRadius={50}
                  dataKey="montant"
                  paddingAngle={2}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PAYMENT_COLORS[entry.mode] || "var(--gray-7)"}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </Box>

          <Flex direction="column" gap="2" style={{ flex: 1, minWidth: 200 }}>
            {data.map((item) => (
              <Flex
                key={item.mode}
                justify="between"
                align="center"
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  backgroundColor: "var(--gray-a2)",
                }}
              >
                <Flex align="center" gap="2">
                  <Box
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      backgroundColor: PAYMENT_COLORS[item.mode] || "var(--gray-7)",
                    }}
                  />
                  <Box style={{ color: PAYMENT_COLORS[item.mode] }}>
                    {PAYMENT_ICONS[item.mode]}
                  </Box>
                  <Text size="2" weight="medium">
                    {item.label}
                  </Text>
                </Flex>
                <Flex align="center" gap="3">
                  <Text
                    size="2"
                    style={{
                      fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                    }}
                  >
                    {formatCurrency(item.montant)}
                  </Text>
                  <Text size="1" color="gray">
                    ({item.pourcentage}%)
                  </Text>
                </Flex>
              </Flex>
            ))}

            <Flex
              justify="between"
              align="center"
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                backgroundColor: "var(--accent-a3)",
                marginTop: 8,
              }}
            >
              <Text size="2" weight="bold">
                Total
              </Text>
              <Text
                size="2"
                weight="bold"
                style={{
                  fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                }}
              >
                {formatCurrency(totalMontant)}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      )}
    </Card>
  );
}
