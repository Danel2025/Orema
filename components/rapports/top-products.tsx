"use client";

/**
 * TopProducts - Liste des produits les plus vendus
 * Affiche le classement des produits par quantite et CA
 */

import { useState, useEffect } from "react";
import { Box, Card, Flex, Text, Table, Badge, Select, Skeleton } from "@radix-ui/themes";
import { Trophy, TrendUp } from "@phosphor-icons/react";
import { getTopProducts, type TopProduct, type PeriodeType } from "@/actions/rapports";
import { formatCurrency } from "@/lib/utils";

interface TopProductsProps {
  initialData?: TopProduct[];
}

export function TopProducts({ initialData }: TopProductsProps) {
  const [data, setData] = useState<TopProduct[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [periode, setPeriode] = useState<PeriodeType>("jour");
  const [sortBy, setSortBy] = useState<"quantite" | "ca">("quantite");

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const result = await getTopProducts(periode, 10);
        setData(result);
      } catch (error) {
        console.error("Erreur chargement top produits:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [periode]);

  const sortedData = [...data].sort((a, b) => {
    if (sortBy === "quantite") {
      return b.quantite - a.quantite;
    }
    return b.ca - a.ca;
  });

  const getMedalColor = (index: number): "gold" | "gray" | "bronze" | null => {
    if (index === 0) return "gold";
    if (index === 1) return "gray";
    if (index === 2) return "bronze";
    return null;
  };

  const getMedalBg = (medal: "gold" | "gray" | "bronze" | null): string => {
    switch (medal) {
      case "gold":
        return "var(--purple-9)";
      case "gray":
        return "var(--gray-9)";
      case "bronze":
        return "var(--accent-8)";
      default:
        return "transparent";
    }
  };

  if (isLoading) {
    return (
      <Card size="3">
        <Flex justify="between" align="center" mb="4">
          <Flex align="center" gap="2">
            <Trophy size={20} style={{ color: "var(--purple-9)" }} />
            <Text size="4" weight="bold">
              Top produits
            </Text>
          </Flex>
          <Flex gap="2">
            <Skeleton width="100px" height="32px" />
            <Skeleton width="100px" height="32px" />
          </Flex>
        </Flex>
        <Box>
          {Array.from({ length: 5 }).map((_, i) => (
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
          <Trophy size={20} style={{ color: "var(--purple-9)" }} />
          <Text size="4" weight="bold">
            Top produits
          </Text>
        </Flex>
        <Flex gap="2">
          <Select.Root value={periode} onValueChange={(v) => setPeriode(v as PeriodeType)}>
            <Select.Trigger placeholder="Periode" />
            <Select.Content position="popper">
              <Select.Item value="jour">Aujourd'hui</Select.Item>
              <Select.Item value="semaine">Cette semaine</Select.Item>
              <Select.Item value="mois">Ce mois</Select.Item>
              <Select.Item value="annee">Cette annee</Select.Item>
            </Select.Content>
          </Select.Root>

          <Select.Root value={sortBy} onValueChange={(v) => setSortBy(v as "quantite" | "ca")}>
            <Select.Trigger placeholder="Trier par" />
            <Select.Content position="popper">
              <Select.Item value="quantite">Par quantite</Select.Item>
              <Select.Item value="ca">Par CA</Select.Item>
            </Select.Content>
          </Select.Root>
        </Flex>
      </Flex>

      {sortedData.length === 0 ? (
        <Flex align="center" justify="center" style={{ height: 200 }}>
          <Text size="3" color="gray">
            Aucune vente pour cette periode
          </Text>
        </Flex>
      ) : (
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell width="50px">#</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Produit</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Categorie</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell align="right">Quantite</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell align="right">CA</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {sortedData.map((product, index) => {
              const medal = getMedalColor(index);
              return (
                <Table.Row key={product.id}>
                  <Table.Cell>
                    {medal ? (
                      <Flex
                        align="center"
                        justify="center"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          backgroundColor: getMedalBg(medal),
                          color: "white",
                          fontWeight: 600,
                          fontSize: 12,
                        }}
                      >
                        {index + 1}
                      </Flex>
                    ) : (
                      <Text size="2" color="gray">
                        {index + 1}
                      </Text>
                    )}
                  </Table.Cell>
                  <Table.RowHeaderCell>
                    <Text size="2" weight="medium">
                      {product.nom}
                    </Text>
                  </Table.RowHeaderCell>
                  <Table.Cell>
                    <Badge variant="soft" color="gray">
                      {product.categorieNom}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell align="right">
                    <Text
                      size="2"
                      weight="medium"
                      style={{
                        fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                      }}
                    >
                      {product.quantite}
                    </Text>
                  </Table.Cell>
                  <Table.Cell align="right">
                    <Text
                      size="2"
                      weight="medium"
                      style={{
                        fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                      }}
                    >
                      {formatCurrency(product.ca)}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      )}
    </Card>
  );
}
