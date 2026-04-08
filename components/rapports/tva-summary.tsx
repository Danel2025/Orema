"use client";

/**
 * TVASummary - Resume TVA detaille par taux
 * Affiche les totaux HT, TVA et TTC ventiles par taux de TVA (18%, 10%, 0%)
 */

import { useState, useEffect } from "react";
import { Box, Card, Flex, Text, Table, Select, Skeleton, Separator } from "@radix-ui/themes";
import { Receipt } from "@phosphor-icons/react";
import { formatCurrency, calculerHT, calculerTVA, TVA_RATES } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { PeriodeType } from "@/actions/rapports";

// ============================================================================
// TYPES
// ============================================================================

interface TVALine {
  taux: number;
  label: string;
  baseHT: number;
  montantTVA: number;
  totalTTC: number;
}

// ============================================================================
// HELPERS
// ============================================================================

function getDateRange(periode: PeriodeType): { from: string; to: string } {
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  const from = new Date(now);

  switch (periode) {
    case "jour":
      from.setHours(0, 0, 0, 0);
      break;
    case "semaine": {
      const day = from.getDay();
      const diff = day === 0 ? 6 : day - 1;
      from.setDate(from.getDate() - diff);
      from.setHours(0, 0, 0, 0);
      break;
    }
    case "mois":
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
      break;
    case "annee":
      from.setMonth(0, 1);
      from.setHours(0, 0, 0, 0);
      break;
    default:
      from.setHours(0, 0, 0, 0);
  }

  return { from: from.toISOString(), to: to.toISOString() };
}

function getTauxValue(tauxTva: string): number {
  switch (tauxTva?.toUpperCase()) {
    case "STANDARD":
      return TVA_RATES.STANDARD;
    case "REDUIT":
      return TVA_RATES.REDUIT;
    case "EXONERE":
      return TVA_RATES.EXONERE;
    default:
      return TVA_RATES.STANDARD;
  }
}

function getTauxLabel(taux: number): string {
  if (taux === TVA_RATES.STANDARD) return `TVA ${TVA_RATES.STANDARD}% (Standard)`;
  if (taux === TVA_RATES.REDUIT) return `TVA ${TVA_RATES.REDUIT}% (Reduit)`;
  if (taux === TVA_RATES.EXONERE) return "Exonere (0%)";
  return `TVA ${taux}%`;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function TVASummary() {
  const [tvaLines, setTvaLines] = useState<TVALine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periode, setPeriode] = useState<PeriodeType>("mois");

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { from, to } = getDateRange(periode);

        // Recuperer les lignes de vente avec le taux_tva
        const { data: lignes, error } = await supabase
          .from("lignes_vente")
          .select(
            `
            total, taux_tva, montant_tva, sous_total,
            ventes!inner(statut, created_at)
          `
          )
          .eq("ventes.statut", "PAYEE")
          .gte("ventes.created_at", from)
          .lte("ventes.created_at", to);

        if (error) {
          console.error("Erreur chargement TVA:", error);
          return;
        }

        // Agreger par taux de TVA
        const tvaMap: Record<number, { baseHT: number; montantTVA: number; totalTTC: number }> = {
          [TVA_RATES.STANDARD]: { baseHT: 0, montantTVA: 0, totalTTC: 0 },
          [TVA_RATES.REDUIT]: { baseHT: 0, montantTVA: 0, totalTTC: 0 },
          [TVA_RATES.EXONERE]: { baseHT: 0, montantTVA: 0, totalTTC: 0 },
        };

        for (const ligne of lignes || []) {
          const totalTTC = Number(ligne.total);
          const taux =
            typeof ligne.taux_tva === "number"
              ? ligne.taux_tva
              : getTauxValue(String(ligne.taux_tva));

          // Utiliser les valeurs de la ligne si disponibles, sinon calculer
          let baseHT: number;
          let montantTVA: number;

          if (ligne.montant_tva !== null && ligne.sous_total !== null) {
            baseHT = Number(ligne.sous_total);
            montantTVA = Number(ligne.montant_tva);
          } else {
            baseHT = calculerHT(totalTTC, taux);
            montantTVA = calculerTVA(baseHT, taux);
          }

          if (!tvaMap[taux]) {
            tvaMap[taux] = { baseHT: 0, montantTVA: 0, totalTTC: 0 };
          }

          tvaMap[taux].baseHT += baseHT;
          tvaMap[taux].montantTVA += montantTVA;
          tvaMap[taux].totalTTC += totalTTC;
        }

        // Convertir en tableau et trier par taux decroissant
        const result: TVALine[] = Object.entries(tvaMap)
          .map(([taux, data]) => ({
            taux: Number(taux),
            label: getTauxLabel(Number(taux)),
            baseHT: Math.round(data.baseHT),
            montantTVA: Math.round(data.montantTVA),
            totalTTC: Math.round(data.totalTTC),
          }))
          .sort((a, b) => b.taux - a.taux);

        setTvaLines(result);
      } catch (error) {
        console.error("Erreur chargement TVA:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [periode]);

  // Totaux generaux
  const totaux = tvaLines.reduce(
    (acc, line) => ({
      baseHT: acc.baseHT + line.baseHT,
      montantTVA: acc.montantTVA + line.montantTVA,
      totalTTC: acc.totalTTC + line.totalTTC,
    }),
    { baseHT: 0, montantTVA: 0, totalTTC: 0 }
  );

  if (isLoading) {
    return (
      <Card size="3">
        <Flex justify="between" align="center" mb="4">
          <Flex align="center" gap="2">
            <Receipt size={20} style={{ color: "var(--blue-9)" }} />
            <Text size="4" weight="bold">
              Resume TVA
            </Text>
          </Flex>
          <Skeleton width="120px" height="32px" />
        </Flex>
        <Box>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width="100%" height="48px" mb="2" />
          ))}
        </Box>
      </Card>
    );
  }

  return (
    <Card size="3">
      <Flex justify="between" align="center" mb="4" wrap="wrap" gap="3">
        <Flex align="center" gap="2">
          <Receipt size={20} style={{ color: "var(--blue-9)" }} />
          <Text size="4" weight="bold">
            Resume TVA
          </Text>
        </Flex>
        <Select.Root value={periode} onValueChange={(v) => setPeriode(v as PeriodeType)}>
          <Select.Trigger placeholder="Période" />
          <Select.Content position="popper">
            <Select.Item value="jour">Aujourd&apos;hui</Select.Item>
            <Select.Item value="semaine">Cette semaine</Select.Item>
            <Select.Item value="mois">Ce mois</Select.Item>
            <Select.Item value="annee">Cette annee</Select.Item>
          </Select.Content>
        </Select.Root>
      </Flex>

      {totaux.totalTTC === 0 ? (
        <Flex align="center" justify="center" style={{ height: 200 }}>
          <Text size="3" color="gray">
            Aucune vente pour cette periode
          </Text>
        </Flex>
      ) : (
        <>
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Taux</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="right">Base HT</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="right">Montant TVA</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="right">Total TTC</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {tvaLines.map((line) => (
                <Table.Row key={line.taux}>
                  <Table.RowHeaderCell>
                    <Text size="2" weight="medium">
                      {line.label}
                    </Text>
                  </Table.RowHeaderCell>
                  <Table.Cell align="right">
                    <Text
                      size="2"
                      style={{
                        fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                      }}
                    >
                      {formatCurrency(line.baseHT)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell align="right">
                    <Text
                      size="2"
                      weight="medium"
                      style={{
                        fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                        color: line.montantTVA > 0 ? "var(--accent-9)" : "var(--gray-9)",
                      }}
                    >
                      {formatCurrency(line.montantTVA)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell align="right">
                    <Text
                      size="2"
                      style={{
                        fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                      }}
                    >
                      {formatCurrency(line.totalTTC)}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>

          <Separator size="4" my="3" />

          {/* Ligne de totaux */}
          <Flex justify="between" px="3" py="2">
            <Text size="3" weight="bold">
              Total general
            </Text>
            <Flex gap="6">
              <Box style={{ textAlign: "right", minWidth: 120 }}>
                <Text size="1" color="gray" style={{ display: "block" }}>
                  Base HT
                </Text>
                <Text
                  size="3"
                  weight="bold"
                  style={{ fontFamily: "var(--font-google-sans-code), ui-monospace, monospace" }}
                >
                  {formatCurrency(totaux.baseHT)}
                </Text>
              </Box>
              <Box style={{ textAlign: "right", minWidth: 120 }}>
                <Text size="1" color="gray" style={{ display: "block" }}>
                  TVA collectee
                </Text>
                <Text
                  size="3"
                  weight="bold"
                  style={{
                    fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                    color: "var(--accent-9)",
                  }}
                >
                  {formatCurrency(totaux.montantTVA)}
                </Text>
              </Box>
              <Box style={{ textAlign: "right", minWidth: 120 }}>
                <Text size="1" color="gray" style={{ display: "block" }}>
                  Total TTC
                </Text>
                <Text
                  size="3"
                  weight="bold"
                  style={{ fontFamily: "var(--font-google-sans-code), ui-monospace, monospace" }}
                >
                  {formatCurrency(totaux.totalTTC)}
                </Text>
              </Box>
            </Flex>
          </Flex>
        </>
      )}
    </Card>
  );
}
