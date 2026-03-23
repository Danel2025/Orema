"use client";

/**
 * KPI Cards pour le dashboard billing
 * 6 indicateurs clés : MRR, ARR, Abonnés payants, Total établissements, Taux conversion, Taux churn
 */

import { Box, Flex, Grid, Text } from "@radix-ui/themes";
import {
  CurrencyCircleDollar,
  ChartLineUp,
  Users,
  Buildings,
  TrendUp,
  TrendDown,
  ArrowUp,
  ArrowDown,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import { formatCurrency } from "@/lib/utils";
import type { BillingOverview } from "./types";

interface KpiCardsProps {
  overview: BillingOverview;
}

interface KpiCardConfig {
  key: keyof Omit<BillingOverview, "mrrVariation">;
  label: string;
  icon: typeof CurrencyCircleDollar;
  color: string;
  format: (value: number) => string;
}

const kpiConfig: KpiCardConfig[] = [
  {
    key: "mrr",
    label: "MRR",
    icon: CurrencyCircleDollar,
    color: "orange",
    format: (v) => formatCurrency(v),
  },
  {
    key: "arr",
    label: "ARR",
    icon: ChartLineUp,
    color: "blue",
    format: (v) => formatCurrency(v),
  },
  {
    key: "totalAbonnesPayants",
    label: "Abonnés payants",
    icon: Users,
    color: "green",
    format: (v) => v.toLocaleString("fr-FR"),
  },
  {
    key: "totalEtablissements",
    label: "Total établissements",
    icon: Buildings,
    color: "gray",
    format: (v) => v.toLocaleString("fr-FR"),
  },
  {
    key: "tauxConversion",
    label: "Taux conversion",
    icon: TrendUp,
    color: "green",
    format: (v) => `${v.toFixed(1)}%`,
  },
  {
    key: "churnRate",
    label: "Taux churn",
    icon: TrendDown,
    color: "red",
    format: (v) => `${v.toFixed(1)}%`,
  },
];

const colorMap: Record<string, { bg: string; icon: string }> = {
  orange: { bg: "var(--orange-a3)", icon: "var(--orange-9)" },
  blue: { bg: "var(--blue-a3)", icon: "var(--blue-9)" },
  green: { bg: "var(--green-a3)", icon: "var(--green-9)" },
  gray: { bg: "var(--gray-a3)", icon: "var(--gray-9)" },
  red: { bg: "var(--red-a3)", icon: "var(--red-9)" },
};

export function KpiCards({ overview }: KpiCardsProps) {
  return (
    <Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="4">
      {kpiConfig.map((config, index) => {
        const Icon = config.icon;
        const value = overview[config.key];
        const colors = colorMap[config.color] || colorMap.gray;

        // Seul le MRR a une variation disponible
        const showVariation = config.key === "mrr" && overview.mrrVariation !== 0;
        const mrrVariation = overview.mrrVariation;

        return (
          <motion.div
            key={config.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.05 }}
          >
            <Box
              p="5"
              style={{
                background: "var(--color-background)",
                borderRadius: 12,
                border: "1px solid var(--gray-a4)",
                transition: "all 0.15s ease",
              }}
            >
              <Flex align="start" justify="between" gap="3">
                <Box style={{ flex: 1 }}>
                  <Text size="2" color="gray" style={{ display: "block", marginBottom: 8 }}>
                    {config.label}
                  </Text>
                  <Text
                    size="6"
                    weight="bold"
                    style={{
                      fontFamily: "var(--font-google-sans-code), monospace",
                      display: "block",
                      lineHeight: 1.2,
                    }}
                  >
                    {config.format(value)}
                  </Text>
                  {showVariation ? (
                    <Flex align="center" gap="1" mt="2">
                      {mrrVariation > 0 ? (
                        <ArrowUp
                          size={12}
                          weight="bold"
                          style={{ color: "var(--green-9)" }}
                        />
                      ) : (
                        <ArrowDown
                          size={12}
                          weight="bold"
                          style={{ color: "var(--red-9)" }}
                        />
                      )}
                      <Text
                        size="1"
                        weight="medium"
                        style={{
                          color: mrrVariation > 0 ? "var(--green-11)" : "var(--red-11)",
                        }}
                      >
                        {mrrVariation > 0 ? "+" : ""}
                        {mrrVariation}%
                      </Text>
                      <Text size="1" color="gray">
                        vs mois préc.
                      </Text>
                    </Flex>
                  ) : null}
                </Box>
                <Flex
                  align="center"
                  justify="center"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: colors.bg,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={22} weight="duotone" style={{ color: colors.icon }} />
                </Flex>
              </Flex>
            </Box>
          </motion.div>
        );
      })}
    </Grid>
  );
}
