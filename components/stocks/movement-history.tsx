"use client";

/**
 * MovementHistory - Historique des mouvements de stock
 * Avec filtres par type, date et produit
 */

import { useState, useEffect, useCallback } from "react";
import { Dialog, Flex, Text, Select, Box, Button, Table, Badge, TextField } from "@radix-ui/themes";
import { ScrollArea } from "@/components/ui";
import {
  ClockCounterClockwise,
  ArrowCircleDown,
  ArrowCircleUp,
  ArrowCounterClockwise,
  Trash,
  ClipboardText,
  CalendarBlank,
  Funnel,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import { getMovementHistory } from "@/actions/stocks";
import type { MouvementStockAvecProduit, TypeMouvementType } from "@/schemas/stock.schema";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface MovementHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produitId?: string;
  produitNom?: string;
}

const typeConfig: Record<
  TypeMouvementType,
  {
    label: string;
    icon: React.ReactNode;
    color: "green" | "red" | "blue" | "violet";
  }
> = {
  ENTREE: {
    label: "Entrée",
    icon: <ArrowCircleDown size={14} />,
    color: "green",
  },
  SORTIE: {
    label: "Sortie",
    icon: <ArrowCircleUp size={14} />,
    color: "red",
  },
  AJUSTEMENT: {
    label: "Ajustement",
    icon: <ArrowCounterClockwise size={14} />,
    color: "blue",
  },
  PERTE: {
    label: "Perte",
    icon: <Trash size={14} />,
    color: "violet",
  },
  INVENTAIRE: {
    label: "Inventaire",
    icon: <ClipboardText size={14} />,
    color: "blue",
  },
};

export function MovementHistory({
  open,
  onOpenChange,
  produitId,
  produitNom,
}: MovementHistoryProps) {
  const [mouvements, setMouvements] = useState<MouvementStockAvecProduit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const loadMovements = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getMovementHistory({
        produitId: produitId,
        type: typeFilter !== "all" ? (typeFilter as TypeMouvementType) : undefined,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo + "T23:59:59") : undefined,
        limit: 100,
      });

      if (result.success) {
        setMouvements(result.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique:", error);
    } finally {
      setIsLoading(false);
    }
  }, [produitId, typeFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (open) {
      loadMovements();
    }
  }, [open, loadMovements]);

  const handleRefresh = () => {
    loadMovements();
  };

  const handleResetFilters = () => {
    setTypeFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="800px" style={{ maxHeight: "80vh" }}>
        <Dialog.Title>
          <Flex align="center" gap="2">
            <ClockCounterClockwise size={20} />
            Historique des mouvements
          </Flex>
        </Dialog.Title>
        <Dialog.Description size="2" mb="4">
          {produitNom ? `Mouvements de stock pour: ${produitNom}` : "Tous les mouvements de stock"}
        </Dialog.Description>

        {/* Filtres */}
        <Flex gap="3" mb="4" wrap="wrap" align="end">
          <Box style={{ flex: "0 0 150px" }}>
            <Text as="label" size="1" weight="medium" mb="1">
              Type
            </Text>
            <Select.Root value={typeFilter} onValueChange={setTypeFilter}>
              <Select.Trigger style={{ width: "100%" }} />
              <Select.Content position="popper">
                <Select.Item value="all">Tous les types</Select.Item>
                <Select.Separator />
                {Object.entries(typeConfig).map(([key, config]) => (
                  <Select.Item key={key} value={key}>
                    <Flex align="center" gap="2">
                      <Box style={{ color: `var(--${config.color}-9)` }}>{config.icon}</Box>
                      {config.label}
                    </Flex>
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Box>

          <Box style={{ flex: "0 0 150px" }}>
            <Text as="label" size="1" weight="medium" mb="1">
              Du
            </Text>
            <TextField.Root
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            >
              <TextField.Slot>
                <CalendarBlank size={14} />
              </TextField.Slot>
            </TextField.Root>
          </Box>

          <Box style={{ flex: "0 0 150px" }}>
            <Text as="label" size="1" weight="medium" mb="1">
              Au
            </Text>
            <TextField.Root type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}>
              <TextField.Slot>
                <CalendarBlank size={14} />
              </TextField.Slot>
            </TextField.Root>
          </Box>

          <Flex gap="2">
            <Button variant="soft" color="gray" onClick={handleResetFilters}>
              <Funnel size={14} />
              Réinitialiser
            </Button>
            <Button variant="soft" onClick={handleRefresh} disabled={isLoading}>
              <ArrowsClockwise size={14} className={isLoading ? "animate-spin" : ""} />
              Actualiser
            </Button>
          </Flex>
        </Flex>

        {/* Tableau des mouvements */}
        <ScrollArea style={{ maxHeight: "400px" }}>
          <Box
            style={{
              border: "1px solid var(--gray-a6)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                  {!produitId && <Table.ColumnHeaderCell>Produit</Table.ColumnHeaderCell>}
                  <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Quantité</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Avant</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Après</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Motif</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Référence</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {isLoading ? (
                  <Table.Row>
                    <Table.Cell colSpan={produitId ? 7 : 8}>
                      <Flex align="center" justify="center" py="6">
                        <Text color="gray">Chargement...</Text>
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                ) : mouvements.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={produitId ? 7 : 8}>
                      <Flex align="center" justify="center" py="6" direction="column" gap="2">
                        <ClockCounterClockwise size={32} style={{ color: "var(--gray-8)" }} />
                        <Text color="gray" size="2">
                          Aucun mouvement trouvé
                        </Text>
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  mouvements.map((mouvement) => {
                    const config = typeConfig[mouvement.type];
                    const ecart = mouvement.quantiteApres - mouvement.quantiteAvant;

                    return (
                      <Table.Row key={mouvement.id}>
                        <Table.Cell>
                          <Flex direction="column">
                            <Text size="2">
                              {format(new Date(mouvement.createdAt), "dd MMM yyyy", {
                                locale: fr,
                              })}
                            </Text>
                            <Text size="1" color="gray">
                              {format(new Date(mouvement.createdAt), "HH:mm")}
                            </Text>
                          </Flex>
                        </Table.Cell>
                        {!produitId && (
                          <Table.Cell>
                            <Text size="2" weight="medium">
                              {mouvement.produit.nom}
                            </Text>
                          </Table.Cell>
                        )}
                        <Table.Cell>
                          <Badge color={config.color} variant="soft">
                            <Flex align="center" gap="1">
                              {config.icon}
                              {config.label}
                            </Flex>
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Text
                            weight="medium"
                            style={{
                              fontVariantNumeric: "tabular-nums",
                              color:
                                ecart > 0
                                  ? "var(--green-9)"
                                  : ecart < 0
                                    ? "var(--red-9)"
                                    : "inherit",
                            }}
                          >
                            {ecart >= 0 ? "+" : ""}
                            {ecart} {mouvement.produit.unite || ""}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text
                            size="2"
                            color="gray"
                            style={{ fontVariantNumeric: "tabular-nums" }}
                          >
                            {mouvement.quantiteAvant}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text
                            size="2"
                            weight="medium"
                            style={{ fontVariantNumeric: "tabular-nums" }}
                          >
                            {mouvement.quantiteApres}
                          </Text>
                        </Table.Cell>
                        <Table.Cell style={{ maxWidth: 200 }}>
                          <Text
                            size="2"
                            color="gray"
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={mouvement.motif || undefined}
                          >
                            {mouvement.motif || "-"}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2" color="gray">
                            {mouvement.reference || "-"}
                          </Text>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })
                )}
              </Table.Body>
            </Table.Root>
          </Box>
        </ScrollArea>

        {/* Résumé */}
        <Flex justify="between" align="center" mt="4">
          <Text size="2" color="gray">
            {mouvements.length} mouvement(s)
          </Text>
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Fermer
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
