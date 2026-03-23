"use client";

/**
 * StockValuation - Affichage de la valorisation du stock
 * Valeur totale et par catégorie
 */

import { Card, Flex, Text, Box, Progress } from "@radix-ui/themes";
import { TrendUp, Package, Stack } from "@phosphor-icons/react";
import { formatCurrency } from "@/lib/design-system/currency";
import type { ValorisationStock } from "@/schemas/stock.schema";

interface StockValuationProps {
  valorisation: ValorisationStock;
}

export function StockValuation({ valorisation }: StockValuationProps) {
  const maxCategoryValue = Math.max(...valorisation.valeurParCategorie.map((c) => c.valeur), 1);

  return (
    <Card>
      <Flex direction="column" gap="4">
        {/* En-tête */}
        <Flex justify="between" align="center">
          <Flex align="center" gap="2">
            <TrendUp size={18} style={{ color: "var(--accent-9)" }} />
            <Text size="3" weight="medium">
              Valorisation du stock
            </Text>
          </Flex>
        </Flex>

        {/* Valeur totale */}
        <Box
          style={{
            padding: 20,
            borderRadius: 12,
            background: "linear-gradient(135deg, var(--accent-9) 0%, var(--accent-11) 100%)",
          }}
        >
          <Flex direction="column" gap="2">
            <Flex align="center" gap="2">
              <Package size={16} style={{ color: "white", opacity: 0.8 }} />
              <Text size="2" style={{ color: "white", opacity: 0.8 }}>
                Valeur totale du stock
              </Text>
            </Flex>
            <Text
              size="7"
              weight="bold"
              style={{
                color: "white",
                fontFamily: "var(--font-google-sans-code), monospace",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatCurrency(valorisation.valeurTotale)}
            </Text>
            <Text size="2" style={{ color: "white", opacity: 0.7 }}>
              {valorisation.totalProduits} produit(s) en stock
            </Text>
          </Flex>
        </Box>

        {/* Répartition par catégorie */}
        <Flex direction="column" gap="3">
          <Flex align="center" gap="2">
            <Stack size={16} style={{ color: "var(--gray-11)" }} />
            <Text size="2" weight="medium" color="gray">
              Répartition par catégorie
            </Text>
          </Flex>

          {valorisation.valeurParCategorie.length === 0 ? (
            <Box py="4">
              <Text size="2" color="gray" align="center">
                Aucun stock valorisé
              </Text>
            </Box>
          ) : (
            <Flex direction="column" gap="3">
              {valorisation.valeurParCategorie.map((categorie) => {
                const percentage =
                  valorisation.valeurTotale > 0
                    ? (categorie.valeur / valorisation.valeurTotale) * 100
                    : 0;

                return (
                  <Box key={categorie.categorieId}>
                    <Flex justify="between" align="center" mb="1">
                      <Flex align="center" gap="2">
                        <Box
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: categorie.couleur,
                          }}
                        />
                        <Text size="2" weight="medium">
                          {categorie.categorieNom}
                        </Text>
                        <Text size="1" color="gray">
                          ({categorie.nombreProduits})
                        </Text>
                      </Flex>
                      <Text
                        size="2"
                        weight="medium"
                        style={{
                          fontFamily: "var(--font-google-sans-code), monospace",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {formatCurrency(categorie.valeur)}
                      </Text>
                    </Flex>
                    <Box style={{ position: "relative" }}>
                      <Progress
                        value={percentage}
                        style={{
                          height: 8,
                        }}
                      />
                    </Box>
                    <Flex justify="end" mt="1">
                      <Text size="1" color="gray">
                        {percentage.toFixed(1)}%
                      </Text>
                    </Flex>
                  </Box>
                );
              })}
            </Flex>
          )}
        </Flex>
      </Flex>
    </Card>
  );
}

/**
 * Widget compact pour le dashboard
 */
export function StockValuationWidget({ valorisation }: { valorisation: ValorisationStock }) {
  return (
    <Box
      style={{
        padding: 16,
        borderRadius: 12,
        backgroundColor: "var(--color-panel-solid)",
        border: "1px solid var(--gray-a6)",
      }}
    >
      <Flex direction="column" gap="2">
        <Flex align="center" gap="2">
          <TrendUp size={16} style={{ color: "var(--accent-9)" }} />
          <Text size="2" color="gray">
            Valeur du stock
          </Text>
        </Flex>
        <Text
          size="5"
          weight="bold"
          style={{
            fontFamily: "var(--font-google-sans-code), monospace",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatCurrency(valorisation.valeurTotale)}
        </Text>
        <Text size="1" color="gray">
          {valorisation.totalProduits} produit(s) en stock
        </Text>
      </Flex>
    </Box>
  );
}
