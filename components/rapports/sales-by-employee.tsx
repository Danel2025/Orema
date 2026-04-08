"use client";

/**
 * SalesByEmployee - Performance des employes/caissiers
 * Affiche le CA, nombre de ventes et panier moyen par employe
 */

import { useState, useEffect } from "react";
import { Box, Card, Flex, Text, Table, Avatar, Badge, Select, Skeleton } from "@radix-ui/themes";
import { Users, TrendUp } from "@phosphor-icons/react";
import { getSalesByEmployee, type SalesByEmployeeData, type PeriodeType } from "@/actions/rapports";
import { formatCurrency } from "@/lib/utils";

interface SalesByEmployeeProps {
  initialData?: SalesByEmployeeData[];
}

export function SalesByEmployee({ initialData }: SalesByEmployeeProps) {
  const [data, setData] = useState<SalesByEmployeeData[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [periode, setPeriode] = useState<PeriodeType>("jour");

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const result = await getSalesByEmployee(periode);
        setData(result);
      } catch (error) {
        console.error("Erreur chargement ventes par employe:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [periode]);

  // Calculer les stats globales
  const totalCA = data.reduce((sum, e) => sum + e.ca, 0);
  const totalVentes = data.reduce((sum, e) => sum + e.nombreVentes, 0);
  const avgPanier = totalVentes > 0 ? Math.round(totalCA / totalVentes) : 0;

  // Meilleur employe
  const bestEmployee = data.length > 0 ? data[0] : null;

  // Obtenir les initiales
  const getInitials = (nom: string, prenom: string | null): string => {
    const first = prenom ? prenom.charAt(0) : "";
    const last = nom.charAt(0);
    return `${first}${last}`.toUpperCase();
  };

  // Couleur selon le rang
  const getAvatarColor = (index: number): "violet" | "blue" | "green" | "purple" | "gray" => {
    const colors: ("violet" | "blue" | "green" | "purple" | "gray")[] = [
      "violet",
      "blue",
      "green",
      "purple",
      "gray",
    ];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <Card size="3">
        <Flex justify="between" align="center" mb="4">
          <Flex align="center" gap="2">
            <Users size={20} style={{ color: "var(--purple-9)" }} />
            <Text size="4" weight="bold">
              Performance employes
            </Text>
          </Flex>
          <Skeleton width="120px" height="32px" />
        </Flex>
        <Box>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width="100%" height="56px" mb="2" />
          ))}
        </Box>
      </Card>
    );
  }

  const hasData = data.length > 0;

  return (
    <Card size="3">
      <Flex justify="between" align="center" mb="4" wrap="wrap" gap="3">
        <Flex align="center" gap="2">
          <Users size={20} style={{ color: "var(--purple-9)" }} />
          <Text size="4" weight="bold">
            Performance employes
          </Text>
        </Flex>
        <Select.Root value={periode} onValueChange={(v) => setPeriode(v as PeriodeType)}>
          <Select.Trigger placeholder="Période" />
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
          {/* Meilleur employe */}
          {bestEmployee ? (
            <Box
              style={{
                padding: 16,
                borderRadius: 8,
                background: "linear-gradient(135deg, var(--accent-a3), var(--purple-a3))",
                border: "1px solid var(--accent-a6)",
              }}
            >
              <Flex justify="between" align="center">
                <Flex align="center" gap="3">
                  <Box
                    style={{
                      position: "relative",
                    }}
                  >
                    <Avatar
                      size="4"
                      fallback={getInitials(bestEmployee.nom, bestEmployee.prenom)}
                    />
                    <Box
                      style={{
                        position: "absolute",
                        bottom: -4,
                        right: -4,
                        backgroundColor: "var(--purple-9)",
                        borderRadius: "50%",
                        width: 20,
                        height: 20,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <TrendUp size={12} color="white" />
                    </Box>
                  </Box>
                  <Box>
                    <Text size="3" weight="bold">
                      {bestEmployee.prenom} {bestEmployee.nom}
                    </Text>
                    <Text size="2" color="gray">
                      Meilleur vendeur
                    </Text>
                  </Box>
                </Flex>
                <Box style={{ textAlign: "right" }}>
                  <Text
                    size="5"
                    weight="bold"
                    style={{
                      display: "block",
                      fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                    }}
                  >
                    {formatCurrency(bestEmployee.ca)}
                  </Text>
                  <Text size="2" color="gray">
                    {bestEmployee.nombreVentes} ventes
                  </Text>
                </Box>
              </Flex>
            </Box>
          ) : null}

          {/* Tableau des employes */}
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Employe</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="right">Ventes</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="right">CA</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="right">Panier moy.</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {data.map((employee, index) => (
                <Table.Row key={employee.id}>
                  <Table.RowHeaderCell>
                    <Flex align="center" gap="2">
                      <Avatar
                        size="2"
                        fallback={getInitials(employee.nom, employee.prenom)}
                        color={getAvatarColor(index)}
                      />
                      <Box>
                        <Text size="2" weight="medium">
                          {employee.prenom} {employee.nom}
                        </Text>
                      </Box>
                    </Flex>
                  </Table.RowHeaderCell>
                  <Table.Cell align="right">
                    <Badge variant="soft" color="gray">
                      {employee.nombreVentes}
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
                      {formatCurrency(employee.ca)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell align="right">
                    <Text
                      size="2"
                      style={{
                        fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                        color:
                          employee.panierMoyen >= avgPanier ? "var(--green-9)" : "var(--gray-11)",
                      }}
                    >
                      {formatCurrency(employee.panierMoyen)}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>

          {/* Totaux */}
          <Flex
            justify="between"
            align="center"
            style={{
              padding: "12px 16px",
              borderRadius: 8,
              backgroundColor: "var(--gray-a3)",
            }}
          >
            <Flex align="center" gap="4">
              <Text size="2" weight="medium" color="gray">
                Total
              </Text>
              <Badge color="gray" variant="soft">
                {data.length} employes
              </Badge>
              <Badge color="gray" variant="soft">
                {totalVentes} ventes
              </Badge>
            </Flex>
            <Flex align="center" gap="4">
              <Box style={{ textAlign: "right" }}>
                <Text size="1" color="gray">
                  CA total
                </Text>
                <Text
                  size="2"
                  weight="bold"
                  style={{
                    fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                  }}
                >
                  {formatCurrency(totalCA)}
                </Text>
              </Box>
              <Box style={{ textAlign: "right" }}>
                <Text size="1" color="gray">
                  Panier moy.
                </Text>
                <Text
                  size="2"
                  weight="bold"
                  style={{
                    fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                  }}
                >
                  {formatCurrency(avgPanier)}
                </Text>
              </Box>
            </Flex>
          </Flex>
        </Flex>
      )}
    </Card>
  );
}
