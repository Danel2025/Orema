"use client";

/**
 * Onglet Statistiques - Détail établissement
 * Dashboard avec KPIs, graphiques CA et ventes, top produits, heures de pointe
 */

import { useState } from "react";
import { Box, Flex, Grid, Heading, Text, Skeleton, SegmentedControl } from "@radix-ui/themes";
import {
  CurrencyCircleDollar,
  ShoppingCart,
  ShoppingBag,
  Package,
  TrendUp,
  Clock,
  CalendarBlank,
} from "@phosphor-icons/react";
import type { IconWeight } from "@phosphor-icons/react";
import { motion } from "motion/react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { EtablissementDetail, EtablissementStats } from "./types";

type Periode = "7j" | "30j" | "90j" | "12m";

interface StatsTabProps {
  etablissement: EtablissementDetail;
  stats: EtablissementStats | null;
  isLoading?: boolean;
  onPeriodeChange?: (periode: Periode) => void;
}

function KpiCard({
  title,
  value,
  icon: Icon,
  color,
  trend,
  delay = 0,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ size?: number; weight?: IconWeight; style?: React.CSSProperties }>;
  color: string;
  trend?: { value: string; isPositive: boolean };
  delay?: number;
}) {
  const colorMap: Record<string, { bg: string; fg: string }> = {
    orange: { bg: "var(--accent-a3)", fg: "var(--accent-9)" },
    green: { bg: "var(--green-a3)", fg: "var(--green-9)" },
    blue: { bg: "var(--blue-a3)", fg: "var(--blue-9)" },
    purple: { bg: "var(--purple-a3)", fg: "var(--purple-9)" },
  };
  const colors = colorMap[color] || colorMap.orange;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Box
        p="5"
        style={{
          background: "var(--color-background)",
          borderRadius: 12,
          border: "1px solid var(--gray-a4)",
        }}
      >
        <Flex justify="between" align="start" mb="3">
          <Text size="2" color="gray" weight="medium">
            {title}
          </Text>
          <Box
            p="2"
            style={{
              background: colors.bg,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={20} weight="duotone" style={{ color: colors.fg }} />
          </Box>
        </Flex>
        <Text
          size="7"
          weight="bold"
          style={{
            display: "block",
            fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1.2,
          }}
        >
          {value}
        </Text>
        {trend ? <Flex align="center" gap="1" mt="2">
            <TrendUp
              size={14}
              weight="bold"
              style={{
                color: trend.isPositive ? "var(--green-9)" : "var(--red-9)",
                transform: trend.isPositive ? "none" : "rotate(180deg)",
              }}
            />
            <Text
              size="1"
              weight="medium"
              style={{
                color: trend.isPositive ? "var(--green-9)" : "var(--red-9)",
              }}
            >
              {trend.value}
            </Text>
            <Text size="1" color="gray">vs. periode precedente</Text>
          </Flex> : null}
      </Box>
    </motion.div>
  );
}

function ChartTooltipContent({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
  formatter?: (value: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;

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
      <Text size="1" color="gray" style={{ display: "block", marginBottom: 4 }}>
        {label}
      </Text>
      {payload.map((entry, index) => (
        <Text key={index} size="2" weight="medium" style={{ display: "block" }}>
          {formatter ? formatter(entry.value) : entry.value}
        </Text>
      ))}
    </Box>
  );
}

export function StatsTab({ etablissement, stats, isLoading, onPeriodeChange }: StatsTabProps) {
  const [periode, setPeriode] = useState<Periode>("30j");

  const handlePeriodeChange = (value: string) => {
    const p = value as Periode;
    setPeriode(p);
    onPeriodeChange?.(p);
  };

  if (isLoading || !stats) {
    return <StatsTabSkeleton />;
  }

  return (
    <Box>
      {/* Selecteur de periode */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Flex justify="end" mb="5">
          <SegmentedControl.Root
            value={periode}
            onValueChange={handlePeriodeChange}
            size="1"
          >
            <SegmentedControl.Item value="7j">7 jours</SegmentedControl.Item>
            <SegmentedControl.Item value="30j">30 jours</SegmentedControl.Item>
            <SegmentedControl.Item value="90j">90 jours</SegmentedControl.Item>
            <SegmentedControl.Item value="12m">12 mois</SegmentedControl.Item>
          </SegmentedControl.Root>
        </Flex>
      </motion.div>

      {/* KPI Cards */}
      <Grid columns={{ initial: "2", md: "4" }} gap="4" mb="6">
        <KpiCard
          title="CA total"
          value={formatCurrency(stats.caTotal || 0)}
          icon={CurrencyCircleDollar}
          color="orange"
          trend={stats.caTrend}
          delay={0}
        />
        <KpiCard
          title="Ventes totales"
          value={(stats.ventesTotal || 0).toLocaleString("fr-FR")}
          icon={ShoppingCart}
          color="green"
          trend={stats.ventesTrend}
          delay={0.05}
        />
        <KpiCard
          title="Panier moyen"
          value={formatCurrency(stats.panierMoyen || 0)}
          icon={ShoppingBag}
          color="blue"
          delay={0.1}
        />
        <KpiCard
          title="Produits actifs"
          value={(stats.produitsActifs || 0).toString()}
          icon={Package}
          color="purple"
          delay={0.15}
        />
      </Grid>

      {/* Graphiques */}
      <Grid columns={{ initial: "1", lg: "2" }} gap="5" mb="6">
        {/* Evolution CA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Box
            p="5"
            style={{
              background: "var(--color-background)",
              borderRadius: 12,
              border: "1px solid var(--gray-a4)",
            }}
          >
            <Flex align="center" gap="2" mb="4">
              <TrendUp size={18} weight="duotone" style={{ color: "var(--accent-9)" }} />
              <Heading size="3" weight="medium">
                Evolution du chiffre d'affaires
              </Heading>
            </Flex>
            <Box style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.evolutionCA || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a4)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "var(--gray-9)" }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--gray-a4)" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--gray-9)" }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--gray-a4)" }}
                    tickFormatter={(value) =>
                      value >= 1000000
                        ? `${(value / 1000000).toFixed(1)}M`
                        : value >= 1000
                          ? `${(value / 1000).toFixed(0)}k`
                          : value.toString()
                    }
                  />
                  <Tooltip
                    content={({ active, payload, label }) => (
                      <ChartTooltipContent
                        active={active}
                        payload={payload as Array<{ value: number; name: string }>}
                        label={typeof label === "number" ? String(label) : label}
                        formatter={(v) => formatCurrency(v)}
                      />
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="montant"
                    stroke="var(--accent-9)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, fill: "var(--accent-9)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </motion.div>

        {/* Ventes par jour de semaine */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <Box
            p="5"
            style={{
              background: "var(--color-background)",
              borderRadius: 12,
              border: "1px solid var(--gray-a4)",
            }}
          >
            <Flex align="center" gap="2" mb="4">
              <CalendarBlank size={18} weight="duotone" style={{ color: "var(--blue-9)" }} />
              <Heading size="3" weight="medium">
                Ventes par jour de la semaine
              </Heading>
            </Flex>
            <Box style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.ventesParJour || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a4)" />
                  <XAxis
                    dataKey="jour"
                    tick={{ fontSize: 11, fill: "var(--gray-9)" }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--gray-a4)" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--gray-9)" }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--gray-a4)" }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => (
                      <ChartTooltipContent
                        active={active}
                        payload={payload as Array<{ value: number; name: string }>}
                        label={typeof label === "number" ? String(label) : label}
                        formatter={(v) => `${v} ventes`}
                      />
                    )}
                  />
                  <Bar
                    dataKey="nombre"
                    fill="var(--blue-9)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </motion.div>
      </Grid>

      {/* Top 5 produits + Heures de pointe */}
      <Grid columns={{ initial: "1", lg: "2" }} gap="5">
        {/* Top 5 produits */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Box
            p="5"
            style={{
              background: "var(--color-background)",
              borderRadius: 12,
              border: "1px solid var(--gray-a4)",
            }}
          >
            <Flex align="center" gap="2" mb="4">
              <Package size={18} weight="duotone" style={{ color: "var(--green-9)" }} />
              <Heading size="3" weight="medium">
                Top 5 produits
              </Heading>
            </Flex>
            <Flex direction="column" gap="3">
              {(stats.topProduits || []).length === 0 ? (
                <Text size="2" color="gray" style={{ fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>
                  Aucune donnee disponible
                </Text>
              ) : (
                (stats.topProduits || []).map((produit, index) => {
                  const maxCA = (stats.topProduits || [])[0]?.ca || 1;
                  const percentage = (produit.ca / maxCA) * 100;

                  return (
                    <Box key={produit.nom}>
                      <Flex justify="between" align="center" mb="1">
                        <Flex align="center" gap="2">
                          <Text
                            size="1"
                            weight="bold"
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              background: index === 0 ? "var(--accent-a3)" : "var(--gray-a3)",
                              color: index === 0 ? "var(--accent-9)" : "var(--gray-9)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                            }}
                          >
                            {index + 1}
                          </Text>
                          <Text size="2" weight="medium">
                            {produit.nom}
                          </Text>
                        </Flex>
                        <Text
                          size="2"
                          weight="medium"
                          style={{
                            fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                          }}
                        >
                          {formatCurrency(produit.ca)}
                        </Text>
                      </Flex>
                      <Box
                        style={{
                          height: 4,
                          borderRadius: 2,
                          background: "var(--gray-a3)",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          style={{
                            height: "100%",
                            width: `${percentage}%`,
                            borderRadius: 2,
                            background: index === 0 ? "var(--accent-9)" : "var(--green-9)",
                            transition: "width 0.5s ease",
                          }}
                        />
                      </Box>
                      <Text size="1" color="gray">
                        {produit.quantite} unites vendues
                      </Text>
                    </Box>
                  );
                })
              )}
            </Flex>
          </Box>
        </motion.div>

        {/* Heures de pointe */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
        >
          <Box
            p="5"
            style={{
              background: "var(--color-background)",
              borderRadius: 12,
              border: "1px solid var(--gray-a4)",
            }}
          >
            <Flex align="center" gap="2" mb="4">
              <Clock size={18} weight="duotone" style={{ color: "var(--purple-9)" }} />
              <Heading size="3" weight="medium">
                Heures de pointe
              </Heading>
            </Flex>
            <Flex direction="column" gap="2">
              {(stats.heuresPointe || []).length === 0 ? (
                <Text size="2" color="gray" style={{ fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>
                  Aucune donnee disponible
                </Text>
              ) : (
                (stats.heuresPointe || []).map((heure) => {
                  const maxVentes = Math.max(...(stats.heuresPointe || []).map((h) => h.ventes));
                  const percentage = maxVentes > 0 ? (heure.ventes / maxVentes) * 100 : 0;

                  return (
                    <Flex key={heure.heure} align="center" gap="3">
                      <Text
                        size="1"
                        weight="medium"
                        style={{
                          width: 40,
                          textAlign: "right",
                          fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                          color: "var(--gray-9)",
                          flexShrink: 0,
                        }}
                      >
                        {heure.heure}h
                      </Text>
                      <Box
                        style={{
                          flex: 1,
                          height: 20,
                          borderRadius: 4,
                          background: "var(--gray-a3)",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          style={{
                            height: "100%",
                            width: `${percentage}%`,
                            borderRadius: 4,
                            background:
                              percentage >= 80
                                ? "var(--red-9)"
                                : percentage >= 50
                                  ? "var(--amber-9)"
                                  : "var(--purple-9)",
                            transition: "width 0.5s ease",
                          }}
                        />
                      </Box>
                      <Text
                        size="1"
                        weight="medium"
                        style={{
                          width: 40,
                          fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                          flexShrink: 0,
                        }}
                      >
                        {heure.ventes}
                      </Text>
                    </Flex>
                  );
                })
              )}
            </Flex>
          </Box>
        </motion.div>
      </Grid>
    </Box>
  );
}

function StatsTabSkeleton() {
  return (
    <Box>
      <Flex justify="end" mb="5">
        <Skeleton style={{ width: 280, height: 32, borderRadius: 6 }} />
      </Flex>
      <Grid columns={{ initial: "2", md: "4" }} gap="4" mb="6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Box
            key={i}
            p="5"
            style={{
              background: "var(--color-background)",
              borderRadius: 12,
              border: "1px solid var(--gray-a4)",
            }}
          >
            <Flex justify="between" mb="3">
              <Skeleton style={{ width: 80, height: 14 }} />
              <Skeleton style={{ width: 36, height: 36, borderRadius: 8 }} />
            </Flex>
            <Skeleton style={{ width: 120, height: 32 }} />
          </Box>
        ))}
      </Grid>
      <Grid columns={{ initial: "1", lg: "2" }} gap="5">
        {Array.from({ length: 2 }).map((_, i) => (
          <Box
            key={i}
            p="5"
            style={{
              background: "var(--color-background)",
              borderRadius: 12,
              border: "1px solid var(--gray-a4)",
            }}
          >
            <Skeleton style={{ width: 200, height: 20, marginBottom: 16 }} />
            <Skeleton style={{ width: "100%", height: 280, borderRadius: 8 }} />
          </Box>
        ))}
      </Grid>
    </Box>
  );
}
