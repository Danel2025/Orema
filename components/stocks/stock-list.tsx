"use client";

/**
 * StockList - Liste des produits avec gestion de stock
 * Affiche le stock actuel, les seuils et le statut visuel
 */

import { useState } from "react";
import {
  Table,
  Badge,
  Flex,
  Text,
  TextField,
  Select,
  Box,
  Button,
  IconButton,
  Tooltip,
} from "@radix-ui/themes";
import {
  MagnifyingGlass,
  Package,
  Warning,
  XCircle,
  CheckCircle,
  ArrowsDownUp,
  DownloadSimple,
  Plus,
  ClockCounterClockwise,
} from "@phosphor-icons/react";
import { formatCurrency } from "@/lib/design-system/currency";
import type { ProduitAvecStatutStock, StockStatus } from "@/schemas/stock.schema";

interface StockListProps {
  produits: ProduitAvecStatutStock[];
  categories: { id: string; nom: string; couleur: string }[];
  onCreateMovement: (produitId: string, produitNom: string) => void;
  onViewHistory: (produitId: string, produitNom: string) => void;
  onExport: () => void;
}

const statusConfig: Record<
  StockStatus,
  { label: string; color: "green" | "violet" | "red"; icon: React.ReactNode }
> = {
  OK: {
    label: "OK",
    color: "green",
    icon: <CheckCircle size={14} />,
  },
  ALERTE: {
    label: "Alerte",
    color: "violet",
    icon: <Warning size={14} />,
  },
  RUPTURE: {
    label: "Rupture",
    color: "red",
    icon: <XCircle size={14} />,
  },
};

export function StockList({
  produits,
  categories,
  onCreateMovement,
  onViewHistory,
  onExport,
}: StockListProps) {
  const [search, setSearch] = useState("");
  const [categorieFilter, setCategorieFilter] = useState<string>("all");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"nom" | "stockActuel" | "statut">("nom");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Filtrer les produits
  const filteredProduits = produits.filter((p) => {
    const matchSearch = search === "" || p.nom.toLowerCase().includes(search.toLowerCase());
    const matchCategorie = categorieFilter === "all" || p.categorie.id === categorieFilter;
    const matchStatut = statutFilter === "all" || p.statut === statutFilter;

    return matchSearch && matchCategorie && matchStatut;
  });

  // Trier les produits
  const sortedProduits = [...filteredProduits].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case "nom":
        comparison = a.nom.localeCompare(b.nom);
        break;
      case "stockActuel":
        comparison = (a.stockActuel || 0) - (b.stockActuel || 0);
        break;
      case "statut":
        const statusOrder = { RUPTURE: 0, ALERTE: 1, OK: 2 };
        comparison = statusOrder[a.statut] - statusOrder[b.statut];
        break;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Statistiques rapides
  const stats = {
    total: produits.length,
    ok: produits.filter((p) => p.statut === "OK").length,
    alerte: produits.filter((p) => p.statut === "ALERTE").length,
    rupture: produits.filter((p) => p.statut === "RUPTURE").length,
  };

  return (
    <Flex direction="column" gap="4">
      {/* Résumé stock inline */}
      <Flex
        align="center"
        gap="5"
        py="2"
        px="3"
        style={{
          backgroundColor: "var(--color-panel-solid)",
          borderRadius: 8,
          border: "1px solid var(--gray-a4)",
        }}
      >
        <Flex align="center" gap="2">
          <Package size={16} weight="duotone" style={{ color: "var(--gray-11)" }} />
          <Text size="2" color="gray">Produits</Text>
          <Text size="3" weight="bold" style={{ fontFamily: "var(--font-google-sans-code), monospace", fontVariantNumeric: "tabular-nums" }}>
            {stats.total}
          </Text>
        </Flex>

        <Box style={{ width: 1, height: 20, backgroundColor: "var(--gray-a4)" }} />

        <Flex align="center" gap="2">
          <Box style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--green-9)" }} />
          <Text size="2" color="gray">En stock</Text>
          <Text size="3" weight="bold" color="green" style={{ fontFamily: "var(--font-google-sans-code), monospace", fontVariantNumeric: "tabular-nums" }}>
            {stats.ok}
          </Text>
        </Flex>

        <Flex align="center" gap="2">
          <Box style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--orange-9)" }} />
          <Text size="2" color="gray">Alerte</Text>
          <Text size="3" weight="bold" style={{ color: "var(--orange-9)", fontFamily: "var(--font-google-sans-code), monospace", fontVariantNumeric: "tabular-nums" }}>
            {stats.alerte}
          </Text>
        </Flex>

        <Flex align="center" gap="2">
          <Box style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--red-9)" }} />
          <Text size="2" color="gray">Rupture</Text>
          <Text size="3" weight="bold" color="red" style={{ fontFamily: "var(--font-google-sans-code), monospace", fontVariantNumeric: "tabular-nums" }}>
            {stats.rupture}
          </Text>
        </Flex>
      </Flex>

      {/* Filtres */}
      <Flex gap="3" wrap="wrap" align="end">
        <Box style={{ flex: "1 1 250px" }}>
          <Text as="label" size="2" weight="medium" mb="1">
            Rechercher
          </Text>
          <TextField.Root
            placeholder="Nom du produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          >
            <TextField.Slot>
              <MagnifyingGlass size={16} />
            </TextField.Slot>
          </TextField.Root>
        </Box>

        <Box style={{ flex: "0 0 180px" }}>
          <Text as="label" size="2" weight="medium" mb="1">
            Catégorie
          </Text>
          <Select.Root value={categorieFilter} onValueChange={setCategorieFilter}>
            <Select.Trigger placeholder="Toutes" style={{ width: "100%" }} />
            <Select.Content position="popper">
              <Select.Item value="all">Toutes les catégories</Select.Item>
              <Select.Separator />
              {categories.map((cat) => (
                <Select.Item key={cat.id} value={cat.id}>
                  <Flex align="center" gap="2">
                    <Box
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: cat.couleur,
                      }}
                    />
                    {cat.nom}
                  </Flex>
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Box>

        <Box style={{ flex: "0 0 150px" }}>
          <Text as="label" size="2" weight="medium" mb="1">
            Statut
          </Text>
          <Select.Root value={statutFilter} onValueChange={setStatutFilter}>
            <Select.Trigger placeholder="Tous" style={{ width: "100%" }} />
            <Select.Content position="popper">
              <Select.Item value="all">Tous les statuts</Select.Item>
              <Select.Separator />
              <Select.Item value="OK">
                <Flex align="center" gap="2">
                  <CheckCircle size={14} style={{ color: "var(--green-9)" }} />
                  OK
                </Flex>
              </Select.Item>
              <Select.Item value="ALERTE">
                <Flex align="center" gap="2">
                  <Warning size={14} style={{ color: "var(--accent-9)" }} />
                  En alerte
                </Flex>
              </Select.Item>
              <Select.Item value="RUPTURE">
                <Flex align="center" gap="2">
                  <XCircle size={14} style={{ color: "var(--red-9)" }} />
                  Rupture
                </Flex>
              </Select.Item>
            </Select.Content>
          </Select.Root>
        </Box>

        <Button variant="soft" color="gray" onClick={onExport}>
          <DownloadSimple size={16} />
          Exporter
        </Button>
      </Flex>

      {/* Tableau */}
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
              <Table.ColumnHeaderCell
                style={{ cursor: "pointer" }}
                onClick={() => handleSort("nom")}
              >
                <Flex align="center" gap="1">
                  Produit
                  <ArrowsDownUp size={14} style={{ opacity: 0.5 }} />
                </Flex>
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Catégorie</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell
                style={{ cursor: "pointer" }}
                onClick={() => handleSort("stockActuel")}
              >
                <Flex align="center" gap="1">
                  Stock actuel
                  <ArrowsDownUp size={14} style={{ opacity: 0.5 }} />
                </Flex>
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Stock min</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Stock max</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Unité</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell
                style={{ cursor: "pointer" }}
                onClick={() => handleSort("statut")}
              >
                <Flex align="center" gap="1">
                  Statut
                  <ArrowsDownUp size={14} style={{ opacity: 0.5 }} />
                </Flex>
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Valeur</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {sortedProduits.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={9}>
                  <Flex align="center" justify="center" py="6" direction="column" gap="2">
                    <Package size={32} style={{ color: "var(--gray-8)" }} />
                    <Text color="gray" size="2">
                      Aucun produit trouvé
                    </Text>
                  </Flex>
                </Table.Cell>
              </Table.Row>
            ) : (
              sortedProduits.map((produit) => {
                const config = statusConfig[produit.statut];
                const valeurStock =
                  (produit.stockActuel || 0) * (produit.prixAchat || produit.prixVente);

                return (
                  <Table.Row key={produit.id}>
                    <Table.RowHeaderCell>
                      <Text weight="medium">{produit.nom}</Text>
                    </Table.RowHeaderCell>
                    <Table.Cell>
                      <Flex align="center" gap="2">
                        <Box
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: produit.categorie.couleur,
                          }}
                        />
                        <Text size="2">{produit.categorie.nom}</Text>
                      </Flex>
                    </Table.Cell>
                    <Table.Cell>
                      <Text
                        weight="bold"
                        style={{
                          fontVariantNumeric: "tabular-nums",
                          color:
                            produit.statut === "RUPTURE"
                              ? "var(--red-9)"
                              : produit.statut === "ALERTE"
                                ? "var(--accent-9)"
                                : "inherit",
                        }}
                      >
                        {produit.stockActuel ?? 0}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2" color="gray" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {produit.stockMin ?? "-"}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2" color="gray" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {produit.stockMax ?? "-"}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2" color="gray">
                        {produit.unite || "-"}
                      </Text>
                    </Table.Cell>
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
                        size="2"
                        style={{
                          fontVariantNumeric: "tabular-nums",
                          fontFamily: "var(--font-google-sans-code), monospace",
                        }}
                      >
                        {formatCurrency(valeurStock)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex gap="1">
                        <Tooltip content="Mouvement de stock">
                          <IconButton
                            size="1"
                            variant="ghost"
                            onClick={() => onCreateMovement(produit.id, produit.nom)}
                          >
                            <Plus size={14} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip content="Historique">
                          <IconButton
                            size="1"
                            variant="ghost"
                            color="gray"
                            onClick={() => onViewHistory(produit.id, produit.nom)}
                          >
                            <ClockCounterClockwise size={14} />
                          </IconButton>
                        </Tooltip>
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                );
              })
            )}
          </Table.Body>
        </Table.Root>
      </Box>

      {/* Résumé */}
      <Flex justify="between" align="center">
        <Text size="2" color="gray">
          {sortedProduits.length} produit(s) sur {produits.length}
        </Text>
      </Flex>
    </Flex>
  );
}
