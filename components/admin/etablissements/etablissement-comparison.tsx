"use client";

/**
 * Vue de comparaison côte à côte de 2-3 établissements
 * Barres groupées + table comparative
 */

import { Box, Flex, Text, Heading, Badge, Button, Table } from "@radix-ui/themes";
import { X, ChartBar } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { formatCurrency } from "@/lib/utils";
import type { EtablissementWithStatsExtended } from "./types";

interface EtablissementComparisonProps {
  etablissements: EtablissementWithStatsExtended[];
  onClose: () => void;
}

const COLORS = ["var(--accent-9)", "var(--blue-9)", "var(--green-9)"];
const BG_COLORS = ["var(--accent-a3)", "var(--blue-a3)", "var(--green-a3)"];

interface Metric {
  label: string;
  key: string;
  getValue: (e: EtablissementWithStatsExtended) => number;
  format?: (v: number) => string;
}

const metrics: Metric[] = [
  { label: "Utilisateurs", key: "users", getValue: (e) => e.nbUtilisateurs },
  { label: "Produits", key: "products", getValue: (e) => e.nbProduits },
  { label: "Ventes", key: "sales", getValue: (e) => e.nbVentes },
  { label: "Clients", key: "clients", getValue: (e) => e.nbClients },
  {
    label: "Chiffre d'affaires",
    key: "ca",
    getValue: (e) => e.chiffreAffaires || 0,
    format: (v) => formatCurrency(v),
  },
];

function ComparisonBar({
  values,
  maxValue,
}: {
  values: number[];
  maxValue: number;
}) {
  return (
    <Flex gap="1" align="end" style={{ height: 60 }}>
      {values.map((value, i) => {
        const height = maxValue > 0 ? Math.max((value / maxValue) * 100, 4) : 4;
        return (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${height}%` }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            style={{
              flex: 1,
              background: COLORS[i],
              borderRadius: "4px 4px 0 0",
              minHeight: 2,
            }}
          />
        );
      })}
    </Flex>
  );
}

export function EtablissementComparison({
  etablissements,
  onClose,
}: EtablissementComparisonProps) {
  if (etablissements.length < 2) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        <Box
          p="5"
          style={{
            background: "var(--color-background)",
            borderRadius: 12,
            border: "1px solid var(--gray-a4)",
          }}
        >
          {/* Header */}
          <Flex align="center" justify="between" mb="5">
            <Flex align="center" gap="2">
              <Box
                p="2"
                style={{
                  background: "var(--accent-a3)",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChartBar size={18} weight="duotone" style={{ color: "var(--accent-9)" }} />
              </Box>
              <Heading size="4">
                Comparaison ({etablissements.length} établissements)
              </Heading>
            </Flex>
            <Button
              variant="ghost"
              color="gray"
              size="2"
              onClick={onClose}
              style={{ cursor: "pointer" }}
            >
              <X size={16} weight="bold" />
              Fermer
            </Button>
          </Flex>

          {/* Légende */}
          <Flex gap="4" mb="5" wrap="wrap">
            {etablissements.map((etab, i) => (
              <Flex key={etab.id} align="center" gap="2">
                <Box
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    background: COLORS[i],
                  }}
                />
                <Text size="2" weight="medium">
                  {etab.nom}
                </Text>
              </Flex>
            ))}
          </Flex>

          {/* Barres groupées */}
          <Box
            p="4"
            mb="5"
            style={{
              background: "var(--gray-a2)",
              borderRadius: 8,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${metrics.length}, 1fr)`,
                gap: 16,
              }}
            >
              {metrics.map((metric) => {
                const values = etablissements.map((e) => metric.getValue(e));
                const maxValue = Math.max(...values, 1);
                return (
                  <Box key={metric.key}>
                    <ComparisonBar values={values} maxValue={maxValue} />
                    <Text
                      size="1"
                      color="gray"
                      weight="medium"
                      style={{ display: "block", textAlign: "center", marginTop: 8 }}
                    >
                      {metric.label}
                    </Text>
                  </Box>
                );
              })}
            </div>
          </Box>

          {/* Table comparative */}
          <Box
            style={{
              borderRadius: 8,
              border: "1px solid var(--gray-a4)",
              overflow: "hidden",
            }}
          >
            <Table.Root size="2">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Métrique</Table.ColumnHeaderCell>
                  {etablissements.map((etab, i) => (
                    <Table.ColumnHeaderCell key={etab.id} align="right">
                      <Flex align="center" gap="2" justify="end">
                        <Box
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 2,
                            background: COLORS[i],
                          }}
                        />
                        <Text size="2">{etab.nom}</Text>
                      </Flex>
                    </Table.ColumnHeaderCell>
                  ))}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {metrics.map((metric) => {
                  const values = etablissements.map((e) => metric.getValue(e));
                  const maxIdx = values.indexOf(Math.max(...values));

                  return (
                    <Table.Row key={metric.key}>
                      <Table.Cell>
                        <Text size="2" weight="medium">
                          {metric.label}
                        </Text>
                      </Table.Cell>
                      {values.map((value, i) => (
                        <Table.Cell key={i} align="right">
                          <Text
                            size="2"
                            weight={i === maxIdx ? "bold" : "regular"}
                            style={{
                              color:
                                i === maxIdx ? "var(--accent-11)" : "var(--gray-12)",
                              fontFamily:
                                "var(--font-google-sans-code), ui-monospace, monospace",
                            }}
                          >
                            {metric.format ? metric.format(value) : value.toLocaleString("fr-FR")}
                          </Text>
                          {i === maxIdx && values.filter((v) => v === value).length === 1 && (
                            <Badge
                              color="green"
                              variant="soft"
                              size="1"
                              ml="2"
                            >
                              Max
                            </Badge>
                          )}
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  );
                })}

                {/* Ligne statut */}
                <Table.Row>
                  <Table.Cell>
                    <Text size="2" weight="medium">
                      Statut
                    </Text>
                  </Table.Cell>
                  {etablissements.map((etab) => {
                    const statutConfig: Record<string, { color: "green" | "red" | "amber"; label: string }> = {
                      actif: { color: "green", label: "Actif" },
                      suspendu: { color: "red", label: "Suspendu" },
                      en_essai: { color: "amber", label: "En essai" },
                    };
                    const s = statutConfig[etab.statut || "actif"] || { color: "gray" as const, label: "?" };
                    return (
                      <Table.Cell key={etab.id} align="right">
                        <Badge color={s.color} variant="soft" size="1">
                          {s.label}
                        </Badge>
                      </Table.Cell>
                    );
                  })}
                </Table.Row>

                {/* Ligne plan */}
                <Table.Row>
                  <Table.Cell>
                    <Text size="2" weight="medium">
                      Plan
                    </Text>
                  </Table.Cell>
                  {etablissements.map((etab) => {
                    const planConfig: Record<string, { color: "gray" | "orange" | "blue" | "violet"; label: string }> = {
                      essentiel: { color: "gray", label: "Essentiel" },
                      pro: { color: "blue", label: "Pro" },
                      business: { color: "orange", label: "Business" },
                      enterprise: { color: "violet", label: "Enterprise" },
                    };
                    const p = planConfig[etab.plan || "essentiel"] || { color: "gray" as const, label: "?" };
                    return (
                      <Table.Cell key={etab.id} align="right">
                        <Badge color={p.color} variant="surface" size="1">
                          {p.label}
                        </Badge>
                      </Table.Cell>
                    );
                  })}
                </Table.Row>

                {/* Ligne date création */}
                <Table.Row>
                  <Table.Cell>
                    <Text size="2" weight="medium">
                      Créé le
                    </Text>
                  </Table.Cell>
                  {etablissements.map((etab) => (
                    <Table.Cell key={etab.id} align="right">
                      <Text size="2" color="gray">
                        {new Date(etab.createdAt).toLocaleDateString("fr-FR")}
                      </Text>
                    </Table.Cell>
                  ))}
                </Table.Row>
              </Table.Body>
            </Table.Root>
          </Box>
        </Box>
      </motion.div>
    </AnimatePresence>
  );
}
