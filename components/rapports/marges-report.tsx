"use client";

/**
 * MargesReport - Rapport des marges beneficiaires
 * Affiche les marges par produit et par categorie avec graphique barres horizontales
 */

import { useState, useEffect, useMemo } from "react";
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
import { Box, Card, Flex, Text, Table, Badge, Select, Skeleton, Tabs } from "@radix-ui/themes";
import { TrendUp, Percent } from "@phosphor-icons/react";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { PeriodeType } from "@/actions/rapports";

// ============================================================================
// TYPES
// ============================================================================

interface ProduitMarge {
  id: string;
  nom: string;
  categorieNom: string;
  prixVente: number;
  prixAchat: number | null;
  quantiteVendue: number;
  totalVentes: number;
  totalCout: number;
  margeBrute: number;
  margePourcentage: number;
}

interface CategorieMarge {
  nom: string;
  totalVentes: number;
  totalCout: number;
  margeBrute: number;
  margePourcentage: number;
  nombreProduits: number;
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

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

function MargeTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { nom: string; margePourcentage: number } }>;
}) {
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
        <Text size="2" weight="bold" style={{ display: "block", marginBottom: 4 }}>
          {data.nom}
        </Text>
        <Text size="2" color="gray" style={{ display: "block" }}>
          Marge: {formatCurrency(payload[0].value)} ({data.margePourcentage}%)
        </Text>
      </Box>
    );
  }
  return null;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function MargesReport() {
  const [produits, setProduits] = useState<ProduitMarge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periode, setPeriode] = useState<PeriodeType>("mois");
  const [tab, setTab] = useState("produits");

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { from, to } = getDateRange(periode);

        // Recuperer les lignes de vente avec produits (prix_achat, categorie)
        const { data: lignes, error } = await supabase
          .from("lignes_vente")
          .select(
            `
            quantite, total, prix_unitaire,
            produits!inner(id, nom, prix_achat, prix_vente, categories(nom)),
            ventes!inner(statut, created_at, etablissement_id)
          `
          )
          .eq("ventes.statut", "PAYEE")
          .gte("ventes.created_at", from)
          .lte("ventes.created_at", to);

        if (error) {
          console.error("Erreur chargement marges:", error);
          return;
        }

        // Agreger par produit
        const map: Record<string, ProduitMarge> = {};

        for (const ligne of lignes || []) {
          const produit = ligne.produits as unknown as {
            id: string;
            nom: string;
            prix_achat: number | null;
            prix_vente: number;
            categories: { nom: string } | null;
          };
          if (!produit) continue;

          const id = produit.id;
          const quantite = Number(ligne.quantite);
          const prixUnitaire = Number(ligne.prix_unitaire);
          const totalLigne = Number(ligne.total);
          const prixAchat = produit.prix_achat ? Number(produit.prix_achat) : null;

          if (!map[id]) {
            map[id] = {
              id,
              nom: produit.nom,
              categorieNom: produit.categories?.nom || "Sans categorie",
              prixVente: Number(produit.prix_vente),
              prixAchat,
              quantiteVendue: 0,
              totalVentes: 0,
              totalCout: 0,
              margeBrute: 0,
              margePourcentage: 0,
            };
          }

          map[id].quantiteVendue += quantite;
          map[id].totalVentes += totalLigne;
          if (prixAchat !== null) {
            map[id].totalCout += prixAchat * quantite;
          }
        }

        // Calculer les marges
        const result = Object.values(map).map((p) => {
          const margeBrute = p.prixAchat !== null ? p.totalVentes - p.totalCout : 0;
          const margePourcentage =
            p.prixAchat !== null && p.totalVentes > 0
              ? Math.round((margeBrute / p.totalVentes) * 100)
              : 0;
          return { ...p, margeBrute, margePourcentage };
        });

        setProduits(result.sort((a, b) => b.margeBrute - a.margeBrute));
      } catch (error) {
        console.error("Erreur chargement marges:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [periode]);

  // Agreger par categorie
  const categories = useMemo<CategorieMarge[]>(() => {
    const catMap: Record<string, CategorieMarge> = {};

    for (const p of produits) {
      const nom = p.categorieNom;
      if (!catMap[nom]) {
        catMap[nom] = {
          nom,
          totalVentes: 0,
          totalCout: 0,
          margeBrute: 0,
          margePourcentage: 0,
          nombreProduits: 0,
        };
      }
      catMap[nom].totalVentes += p.totalVentes;
      catMap[nom].totalCout += p.totalCout;
      catMap[nom].nombreProduits++;
    }

    return Object.values(catMap)
      .map((c) => {
        const margeBrute = c.totalVentes - c.totalCout;
        const margePourcentage =
          c.totalVentes > 0 ? Math.round((margeBrute / c.totalVentes) * 100) : 0;
        return { ...c, margeBrute, margePourcentage };
      })
      .sort((a, b) => b.margeBrute - a.margeBrute);
  }, [produits]);

  // Top 10 pour le graphique
  const topMarges = useMemo(() => {
    return produits.filter((p) => p.prixAchat !== null && p.margeBrute > 0).slice(0, 10);
  }, [produits]);

  // Couleurs pour les barres
  const barColors = [
    "var(--accent-9)",
    "var(--accent-8)",
    "var(--accent-7)",
    "var(--blue-9)",
    "var(--blue-8)",
    "var(--green-9)",
    "var(--green-8)",
    "var(--purple-9)",
    "var(--purple-8)",
    "var(--purple-9)",
  ];

  if (isLoading) {
    return (
      <Card size="3">
        <Flex justify="between" align="center" mb="4">
          <Flex align="center" gap="2">
            <Percent size={20} style={{ color: "var(--accent-9)" }} />
            <Text size="4" weight="bold">
              Marges beneficiaires
            </Text>
          </Flex>
          <Skeleton width="120px" height="32px" />
        </Flex>
        <Box>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} width="100%" height="48px" mb="2" />
          ))}
        </Box>
      </Card>
    );
  }

  const produitsAvecCout = produits.filter((p) => p.prixAchat !== null);
  const produitsSansCout = produits.filter((p) => p.prixAchat === null);

  return (
    <Card size="3">
      <Flex justify="between" align="center" mb="4" wrap="wrap" gap="3">
        <Flex align="center" gap="2">
          <Percent size={20} style={{ color: "var(--accent-9)" }} />
          <Text size="4" weight="bold">
            Marges beneficiaires
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

      {produits.length === 0 ? (
        <Flex align="center" justify="center" style={{ height: 200 }}>
          <Text size="3" color="gray">
            Aucune vente pour cette periode
          </Text>
        </Flex>
      ) : (
        <Tabs.Root value={tab} onValueChange={setTab}>
          <Tabs.List mb="4">
            <Tabs.Trigger value="produits">Par produit</Tabs.Trigger>
            <Tabs.Trigger value="categories">Par categorie</Tabs.Trigger>
            <Tabs.Trigger value="graphique">Graphique</Tabs.Trigger>
          </Tabs.List>

          {/* Tableau par produit */}
          <Tabs.Content value="produits">
            {produitsAvecCout.length === 0 ? (
              <Flex align="center" justify="center" style={{ height: 150 }}>
                <Text size="3" color="gray">
                  Aucun produit avec prix d&apos;achat renseigne
                </Text>
              </Flex>
            ) : (
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Produit</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Catégorie</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell align="right">Prix vente</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell align="right">Cout</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell align="right">Qte vendue</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell align="right">Marge brute</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell align="right">%</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {produitsAvecCout.map((p) => (
                    <Table.Row key={p.id}>
                      <Table.RowHeaderCell>
                        <Text size="2" weight="medium">
                          {p.nom}
                        </Text>
                      </Table.RowHeaderCell>
                      <Table.Cell>
                        <Badge variant="soft" color="gray">
                          {p.categorieNom}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell align="right">
                        <Text
                          size="2"
                          style={{
                            fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                          }}
                        >
                          {formatCurrency(p.prixVente)}
                        </Text>
                      </Table.Cell>
                      <Table.Cell align="right">
                        <Text
                          size="2"
                          style={{
                            fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                          }}
                        >
                          {p.prixAchat !== null ? formatCurrency(p.prixAchat) : "N/A"}
                        </Text>
                      </Table.Cell>
                      <Table.Cell align="right">
                        <Text
                          size="2"
                          style={{
                            fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                          }}
                        >
                          {p.quantiteVendue}
                        </Text>
                      </Table.Cell>
                      <Table.Cell align="right">
                        <Text
                          size="2"
                          weight="medium"
                          style={{
                            fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                            color: p.margeBrute >= 0 ? "var(--green-9)" : "var(--red-9)",
                          }}
                        >
                          {formatCurrency(p.margeBrute)}
                        </Text>
                      </Table.Cell>
                      <Table.Cell align="right">
                        <Badge
                          variant="soft"
                          color={
                            p.margePourcentage >= 30
                              ? "green"
                              : p.margePourcentage >= 15
                                ? "amber"
                                : "red"
                          }
                        >
                          {p.margePourcentage}%
                        </Badge>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            )}

            {produitsSansCout.length > 0 && (
              <Box mt="4">
                <Text size="2" color="gray">
                  {produitsSansCout.length} produit(s) sans prix d&apos;achat renseigne
                </Text>
              </Box>
            )}
          </Tabs.Content>

          {/* Tableau par categorie */}
          <Tabs.Content value="categories">
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Catégorie</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell align="right">Nb produits</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell align="right">Total ventes</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell align="right">Total cout</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell align="right">Marge brute</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell align="right">%</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {categories.map((c) => (
                  <Table.Row key={c.nom}>
                    <Table.RowHeaderCell>
                      <Text size="2" weight="medium">
                        {c.nom}
                      </Text>
                    </Table.RowHeaderCell>
                    <Table.Cell align="right">
                      <Text
                        size="2"
                        style={{
                          fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                        }}
                      >
                        {c.nombreProduits}
                      </Text>
                    </Table.Cell>
                    <Table.Cell align="right">
                      <Text
                        size="2"
                        style={{
                          fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                        }}
                      >
                        {formatCurrency(c.totalVentes)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell align="right">
                      <Text
                        size="2"
                        style={{
                          fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                        }}
                      >
                        {formatCurrency(c.totalCout)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell align="right">
                      <Text
                        size="2"
                        weight="medium"
                        style={{
                          fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                          color: c.margeBrute >= 0 ? "var(--green-9)" : "var(--red-9)",
                        }}
                      >
                        {formatCurrency(c.margeBrute)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell align="right">
                      <Badge
                        variant="soft"
                        color={
                          c.margePourcentage >= 30
                            ? "green"
                            : c.margePourcentage >= 15
                              ? "amber"
                              : "red"
                        }
                      >
                        {c.margePourcentage}%
                      </Badge>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Tabs.Content>

          {/* Graphique barres horizontales */}
          <Tabs.Content value="graphique">
            {topMarges.length === 0 ? (
              <Flex align="center" justify="center" style={{ height: 300 }}>
                <Text size="3" color="gray">
                  Aucun produit avec marge disponible
                </Text>
              </Flex>
            ) : (
              <Box>
                <Text size="2" color="gray" mb="3" style={{ display: "block" }}>
                  Top 10 des marges beneficiaires
                </Text>
                <Box style={{ height: Math.max(300, topMarges.length * 45) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topMarges}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--gray-a5)"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fill: "var(--gray-11)", fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: "var(--gray-a6)" }}
                        tickFormatter={(v: number) => {
                          if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                          if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
                          return v.toString();
                        }}
                      />
                      <YAxis
                        dataKey="nom"
                        type="category"
                        width={120}
                        tick={{ fill: "var(--gray-11)", fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<MargeTooltip />} />
                      <Bar dataKey="margeBrute" radius={[0, 4, 4, 0]} maxBarSize={35}>
                        {topMarges.map((_, index) => (
                          <Cell key={index} fill={barColors[index % barColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            )}
          </Tabs.Content>
        </Tabs.Root>
      )}
    </Card>
  );
}
