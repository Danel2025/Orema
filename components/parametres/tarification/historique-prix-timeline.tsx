"use client";

import { useState, useCallback } from "react";
import {
  Box,
  Flex,
  Text,
  TextField,
  Button,
  Badge,
  Callout,
  Separator,
} from "@radix-ui/themes";
import {
  ArrowsLeftRight,
  Tag,
  User,
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
  Info,
  ArrowRight,
} from "@phosphor-icons/react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getHistoriquePrixAction } from "@/actions/tarification";

interface HistoriquePrixEntry {
  id: string;
  produitNom: string;
  ancienPrix: number;
  nouveauPrix: number;
  utilisateurNom: string;
  raison?: string | null;
  createdAt: string;
}

interface HistoriquePrixTimelineProps {
  initialEntries: HistoriquePrixEntry[];
  initialTotal: number;
}

const PAGE_SIZE = 10;

export function HistoriquePrixTimeline({
  initialEntries,
  initialTotal,
}: HistoriquePrixTimelineProps) {
  const [entries, setEntries] = useState<HistoriquePrixEntry[]>(initialEntries);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [searchProduit, setSearchProduit] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchData = useCallback(
    async (newPage: number) => {
      setIsLoading(true);
      try {
        const result = await getHistoriquePrixAction({
          page: newPage,
          limit: PAGE_SIZE,
        });

        if (result.success && result.data) {
          // Map DB rows (snake_case) to UI types (camelCase)
          const mapped = result.data.data.map((h: any) => ({
            id: h.id,
            produitNom: h.produit_id,
            ancienPrix: h.ancien_prix,
            nouveauPrix: h.nouveau_prix,
            utilisateurNom: h.utilisateur_id,
            raison: h.raison,
            createdAt: h.created_at,
          }));
          setEntries(mapped);
          setTotal(result.data.total);
          setPage(newPage);
        }
      } catch {
        // silently fail, keep current data
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleSearch = () => {
    fetchData(1);
  };

  const handlePageChange = (newPage: number) => {
    fetchData(newPage);
  };

  const getPriceChangeColor = (ancien: number, nouveau: number): "green" | "red" | "gray" => {
    if (nouveau > ancien) return "red";
    if (nouveau < ancien) return "green";
    return "gray";
  };

  return (
    <Flex direction="column" gap="4">
      <Callout.Root color="blue" size="2">
        <Callout.Icon>
          <Info size={18} weight="regular" />
        </Callout.Icon>
        <Callout.Text>
          Historique de tous les changements de prix. Chaque modification est tracee
          avec l&apos;ancien prix, le nouveau prix, l&apos;auteur et la raison.
        </Callout.Text>
      </Callout.Root>

      {/* Filtres */}
      <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8 }} p="4">
        <Flex gap="3" wrap="wrap" align="end">
          <Box style={{ flex: "1 1 200px" }}>
            <Text as="div" size="1" weight="medium" mb="1" color="gray">
              Rechercher un produit
            </Text>
            <TextField.Root
              size="2"
              placeholder="Nom du produit..."
              value={searchProduit}
              onChange={(e) => setSearchProduit(e.target.value)}
            >
              <TextField.Slot>
                <MagnifyingGlass size={16} />
              </TextField.Slot>
            </TextField.Root>
          </Box>

          <Box style={{ flex: "0 1 160px" }}>
            <Text as="div" size="1" weight="medium" mb="1" color="gray">
              Date debut
            </Text>
            <TextField.Root
              type="date"
              size="2"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
            />
          </Box>

          <Box style={{ flex: "0 1 160px" }}>
            <Text as="div" size="1" weight="medium" mb="1" color="gray">
              Date fin
            </Text>
            <TextField.Root
              type="date"
              size="2"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
            />
          </Box>

          <Button size="2" onClick={handleSearch} disabled={isLoading}>
            <MagnifyingGlass size={16} />
            Filtrer
          </Button>
        </Flex>
      </Box>

      {/* Timeline */}
      <Flex align="center" gap="2" mb="1">
        <ArrowsLeftRight size={20} weight="duotone" style={{ color: "var(--accent-9)" }} />
        <Text size="4" weight="bold">
          Historique des prix
        </Text>
        <Badge size="1" variant="soft">
          {total} modification{total > 1 ? "s" : ""}
        </Badge>
      </Flex>

      {isLoading ? (
        <Box style={{ textAlign: "center", padding: "40px" }}>
          <Text size="2" color="gray">
            Chargement...
          </Text>
        </Box>
      ) : entries.length === 0 ? (
        <Box
          style={{
            border: "1px dashed var(--gray-a6)",
            borderRadius: 8,
            padding: "40px",
            textAlign: "center",
          }}
        >
          <Tag size={40} weight="thin" style={{ color: "var(--gray-8)", marginBottom: 12 }} />
          <Text as="p" size="2" color="gray">
            Aucun changement de prix enregistre.
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap="1">
          {entries.map((entry, index) => (
            <Box key={entry.id}>
              <Flex gap="3" p="3" style={{ borderRadius: 8 }}>
                {/* Timeline indicator */}
                <Flex
                  direction="column"
                  align="center"
                  style={{ width: 20, flexShrink: 0 }}
                >
                  <Box
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: `var(--${getPriceChangeColor(entry.ancienPrix, entry.nouveauPrix)}-9)`,
                      marginTop: 6,
                    }}
                  />
                  {index < entries.length - 1 && (
                    <Box
                      style={{
                        width: 2,
                        flex: 1,
                        backgroundColor: "var(--gray-a4)",
                        marginTop: 4,
                      }}
                    />
                  )}
                </Flex>

                {/* Content */}
                <Flex direction="column" gap="1" style={{ flex: 1 }}>
                  <Flex align="center" gap="2" wrap="wrap">
                    <Text size="2" weight="bold">
                      {entry.produitNom}
                    </Text>
                    <Flex align="center" gap="1">
                      <Text
                        size="2"
                        style={{
                          textDecoration: "line-through",
                          color: "var(--gray-9)",
                        }}
                      >
                        {formatCurrency(entry.ancienPrix)}
                      </Text>
                      <ArrowRight size={14} style={{ color: "var(--gray-8)" }} />
                      <Text
                        size="2"
                        weight="bold"
                        color={getPriceChangeColor(entry.ancienPrix, entry.nouveauPrix)}
                      >
                        {formatCurrency(entry.nouveauPrix)}
                      </Text>
                    </Flex>
                  </Flex>

                  <Flex gap="3" align="center" wrap="wrap">
                    <Flex align="center" gap="1">
                      <User size={14} style={{ color: "var(--gray-8)" }} />
                      <Text size="1" color="gray">
                        {entry.utilisateurNom}
                      </Text>
                    </Flex>
                    <Text size="1" color="gray">
                      {formatDate(entry.createdAt, "datetime")}
                    </Text>
                  </Flex>

                  {entry.raison ? <Text size="1" color="gray" style={{ fontStyle: "italic" }}>
                      Raison : {entry.raison}
                    </Text> : null}
                </Flex>
              </Flex>

              {index < entries.length - 1 && <Separator size="4" />}
            </Box>
          ))}
        </Flex>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Flex justify="center" align="center" gap="3" mt="2">
          <Button
            variant="soft"
            size="2"
            disabled={page <= 1 || isLoading}
            onClick={() => handlePageChange(page - 1)}
          >
            <CaretLeft size={16} />
            Precedent
          </Button>
          <Text size="2" color="gray">
            Page {page} / {totalPages}
          </Text>
          <Button
            variant="soft"
            size="2"
            disabled={page >= totalPages || isLoading}
            onClick={() => handlePageChange(page + 1)}
          >
            Suivant
            <CaretRight size={16} />
          </Button>
        </Flex>
      )}
    </Flex>
  );
}
