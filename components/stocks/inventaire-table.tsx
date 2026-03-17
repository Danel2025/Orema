"use client";

/**
 * InventaireTable - Tableau de saisie des quantites pour l'inventaire
 * Affiche les produits avec stock theorique, champ de saisie et ecart calcule
 */

import { useState, useMemo } from "react";
import {
  Table,
  Badge,
  Flex,
  Text,
  TextField,
  Select,
  Box,
} from "@radix-ui/themes";
import {
  Search,
  ArrowUpDown,
  Package,
} from "lucide-react";
import { formatCurrency } from "@/lib/design-system";

export interface InventaireLigne {
  produitId: string;
  produitNom: string;
  stockTheorique: number;
  quantiteComptee: string;
  unite: string | null;
  categorie: { id: string; nom: string; couleur: string };
  prixAchat: number | null;
  prixVente: number;
}

interface InventaireTableProps {
  lignes: InventaireLigne[];
  categories: { id: string; nom: string; couleur: string }[];
  onQuantiteChange: (produitId: string, value: string) => void;
}

type SortField = "nom" | "stockTheorique" | "ecart" | "categorie";

export function InventaireTable({
  lignes,
  categories,
  onQuantiteChange,
}: InventaireTableProps) {
  const [search, setSearch] = useState("");
  const [categorieFilter, setCategorieFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("nom");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const getEcart = (ligne: InventaireLigne): number | null => {
    const qty = parseInt(ligne.quantiteComptee, 10);
    if (isNaN(qty)) return null;
    return qty - ligne.stockTheorique;
  };

  const getValeurEcart = (ligne: InventaireLigne): number | null => {
    const ecart = getEcart(ligne);
    if (ecart === null) return null;
    const prix = ligne.prixAchat ?? ligne.prixVente;
    return ecart * prix;
  };

  const filteredLignes = useMemo(() => {
    return lignes.filter((l) => {
      const matchSearch =
        search === "" ||
        l.produitNom.toLowerCase().includes(search.toLowerCase());
      const matchCategorie =
        categorieFilter === "all" || l.categorie.id === categorieFilter;
      return matchSearch && matchCategorie;
    });
  }, [lignes, search, categorieFilter]);

  const sortedLignes = useMemo(() => {
    return [...filteredLignes].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "nom":
          cmp = a.produitNom.localeCompare(b.produitNom);
          break;
        case "stockTheorique":
          cmp = a.stockTheorique - b.stockTheorique;
          break;
        case "ecart": {
          const ea = getEcart(a) ?? 0;
          const eb = getEcart(b) ?? 0;
          cmp = ea - eb;
          break;
        }
        case "categorie":
          cmp = a.categorie.nom.localeCompare(b.categorie.nom);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredLignes, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  return (
    <Flex direction="column" gap="3">
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
              <Search size={16} />
            </TextField.Slot>
          </TextField.Root>
        </Box>

        <Box style={{ flex: "0 0 200px" }}>
          <Text as="label" size="2" weight="medium" mb="1">
            Categorie
          </Text>
          <Select.Root value={categorieFilter} onValueChange={setCategorieFilter}>
            <Select.Trigger placeholder="Toutes" style={{ width: "100%" }} />
            <Select.Content>
              <Select.Item value="all">Toutes les categories</Select.Item>
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

        <Text size="2" color="gray" style={{ paddingBottom: 8 }}>
          {filteredLignes.length} / {lignes.length} produit(s)
        </Text>
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
                  <ArrowUpDown size={14} style={{ opacity: 0.5 }} />
                </Flex>
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell
                style={{ cursor: "pointer" }}
                onClick={() => handleSort("categorie")}
              >
                <Flex align="center" gap="1">
                  Categorie
                  <ArrowUpDown size={14} style={{ opacity: 0.5 }} />
                </Flex>
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell
                style={{ cursor: "pointer" }}
                onClick={() => handleSort("stockTheorique")}
              >
                <Flex align="center" gap="1">
                  Stock theorique
                  <ArrowUpDown size={14} style={{ opacity: 0.5 }} />
                </Flex>
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Compte</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell
                style={{ cursor: "pointer" }}
                onClick={() => handleSort("ecart")}
              >
                <Flex align="center" gap="1">
                  Ecart
                  <ArrowUpDown size={14} style={{ opacity: 0.5 }} />
                </Flex>
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Valeur ecart</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {sortedLignes.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={6}>
                  <Flex
                    align="center"
                    justify="center"
                    py="6"
                    direction="column"
                    gap="2"
                  >
                    <Package size={32} style={{ color: "var(--gray-8)" }} />
                    <Text color="gray" size="2">
                      Aucun produit trouve
                    </Text>
                  </Flex>
                </Table.Cell>
              </Table.Row>
            ) : (
              sortedLignes.map((ligne) => {
                const ecart = getEcart(ligne);
                const valeurEcart = getValeurEcart(ligne);

                return (
                  <Table.Row
                    key={ligne.produitId}
                    style={{
                      backgroundColor:
                        ecart !== null && ecart !== 0
                          ? ecart > 0
                            ? "var(--green-a2)"
                            : "var(--red-a2)"
                          : undefined,
                    }}
                  >
                    <Table.RowHeaderCell>
                      <Text weight="medium">{ligne.produitNom}</Text>
                    </Table.RowHeaderCell>
                    <Table.Cell>
                      <Flex align="center" gap="2">
                        <Box
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            backgroundColor: ligne.categorie.couleur,
                          }}
                        />
                        <Text size="2">{ligne.categorie.nom}</Text>
                      </Flex>
                    </Table.Cell>
                    <Table.Cell>
                      <Text style={{ fontVariantNumeric: "tabular-nums" }}>
                        {ligne.stockTheorique} {ligne.unite || ""}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <TextField.Root
                        type="number"
                        min="0"
                        placeholder="Qte"
                        value={ligne.quantiteComptee}
                        onChange={(e) =>
                          onQuantiteChange(ligne.produitId, e.target.value)
                        }
                        style={{
                          width: 100,
                          minHeight: 44,
                        }}
                      />
                    </Table.Cell>
                    <Table.Cell>
                      {ecart !== null && (
                        <Badge
                          color={
                            ecart === 0 ? "gray" : ecart > 0 ? "green" : "red"
                          }
                          variant="soft"
                          size="2"
                        >
                          {ecart >= 0 ? "+" : ""}
                          {ecart}
                        </Badge>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      {valeurEcart !== null && valeurEcart !== 0 && (
                        <Text
                          size="2"
                          color={valeurEcart > 0 ? "green" : "red"}
                          style={{
                            fontVariantNumeric: "tabular-nums",
                            fontFamily:
                              "var(--font-google-sans-code), monospace",
                          }}
                        >
                          {valeurEcart >= 0 ? "+" : "-"}
                          {formatCurrency(Math.abs(valeurEcart))}
                        </Text>
                      )}
                    </Table.Cell>
                  </Table.Row>
                );
              })
            )}
          </Table.Body>
        </Table.Root>
      </Box>
    </Flex>
  );
}
