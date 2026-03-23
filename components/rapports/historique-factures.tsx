"use client";

/**
 * HistoriqueFactures - Consultation de l'historique des factures/tickets
 * Permet de rechercher, filtrer et visualiser les anciennes factures
 */

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  Flex,
  Text,
  Table,
  Badge,
  Button,
  TextField,
  Select,
  Skeleton,
  Dialog,
  Separator,
  ScrollArea,
  IconButton,
} from "@radix-ui/themes";
import {
  Receipt,
  MagnifyingGlass,
  CalendarBlank,
  User,
  Eye,
  Printer,
  CaretLeft,
  CaretRight,
  X,
  MapPin,
  CreditCard,
  Wallet,
  DeviceMobile,
  FileText,
  Clock,
  ShoppingBag,
  ForkKnife,
  Truck,
  Package,
} from "@phosphor-icons/react";
import {
  getHistoriqueFactures,
  getFactureDetail,
  type FactureHistorique,
  type FactureDetail,
  type HistoriqueFacturesFilters,
} from "@/actions/rapports";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";

// Labels pour les types de vente
const TYPE_VENTE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  DIRECT: { label: "Vente directe", icon: <ShoppingBag size={14} /> },
  TABLE: { label: "Service table", icon: <ForkKnife size={14} /> },
  LIVRAISON: { label: "Livraison", icon: <Truck size={14} /> },
  EMPORTER: { label: "A emporter", icon: <Package size={14} /> },
};

// Labels pour les statuts
const STATUT_CONFIG: Record<string, { label: string; color: "green" | "yellow" | "red" }> = {
  PAYEE: { label: "Payee", color: "green" },
  EN_COURS: { label: "En cours", color: "yellow" },
  ANNULEE: { label: "Annulee", color: "red" },
};

// Labels pour les modes de paiement
const MODE_PAIEMENT_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  ESPECES: { label: "Especes", icon: <Wallet size={14} /> },
  CARTE_BANCAIRE: { label: "Carte bancaire", icon: <CreditCard size={14} /> },
  AIRTEL_MONEY: { label: "Airtel Money", icon: <DeviceMobile size={14} /> },
  MOOV_MONEY: { label: "Moov Money", icon: <DeviceMobile size={14} /> },
  CHEQUE: { label: "Cheque", icon: <FileText size={14} /> },
  VIREMENT: { label: "Virement", icon: <CreditCard size={14} /> },
  COMPTE_CLIENT: { label: "Compte client", icon: <User size={14} /> },
  MIXTE: { label: "Mixte", icon: <Wallet size={14} /> },
};

export function HistoriqueFactures() {
  const [factures, setFactures] = useState<FactureHistorique[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filtres
  const [filters, setFilters] = useState<HistoriqueFacturesFilters>({});
  const [searchTicket, setSearchTicket] = useState("");

  // Detail facture
  const [selectedFacture, setSelectedFacture] = useState<FactureDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const pageSize = 15;

  // Charger les factures
  const loadFactures = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getHistoriqueFactures(filters, page, pageSize);
      setFactures(result.factures);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Erreur chargement factures:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadFactures();
  }, [loadFactures]);

  // Recherche par numero de ticket avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTicket !== (filters.numeroTicket || "")) {
        setFilters((prev) => ({ ...prev, numeroTicket: searchTicket || undefined }));
        setPage(1);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTicket, filters.numeroTicket]);

  // Voir le detail d'une facture
  const handleViewDetail = async (factureId: string) => {
    setIsLoadingDetail(true);
    setIsDetailOpen(true);
    try {
      const detail = await getFactureDetail(factureId);
      setSelectedFacture(detail);
    } catch (error) {
      console.error("Erreur chargement detail:", error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Changer les filtres
  const handleFilterChange = (key: keyof HistoriqueFacturesFilters, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPage(1);
  };

  // Reset filtres
  const handleResetFilters = () => {
    setFilters({});
    setSearchTicket("");
    setPage(1);
  };

  const hasActiveFilters =
    filters.dateDebut || filters.dateFin || filters.type || filters.statut || filters.numeroTicket;

  return (
    <Card size="3">
      {/* Header */}
      <Flex justify="between" align="center" mb="4">
        <Flex align="center" gap="2">
          <Receipt size={20} style={{ color: "var(--violet-9)" }} />
          <Text size="4" weight="bold">
            Historique des factures
          </Text>
        </Flex>
        <Badge color="gray" variant="soft">
          {total} facture{total > 1 ? "s" : ""}
        </Badge>
      </Flex>

      {/* Filtres */}
      <Box
        mb="4"
        style={{
          padding: 16,
          borderRadius: 8,
          backgroundColor: "var(--gray-a2)",
        }}
      >
        <Flex gap="3" wrap="wrap" align="end">
          {/* Recherche numero ticket */}
          <Box style={{ flex: 1, minWidth: 180 }}>
            <Text size="1" color="gray" mb="1" as="label">
              N de ticket
            </Text>
            <TextField.Root
              placeholder="Rechercher..."
              value={searchTicket}
              onChange={(e) => setSearchTicket(e.target.value)}
            >
              <TextField.Slot>
                <MagnifyingGlass size={14} />
              </TextField.Slot>
            </TextField.Root>
          </Box>

          {/* Date debut */}
          <Box style={{ minWidth: 150 }}>
            <Text size="1" color="gray" mb="1" as="label">
              Date debut
            </Text>
            <TextField.Root
              type="date"
              value={filters.dateDebut || ""}
              onChange={(e) => handleFilterChange("dateDebut", e.target.value)}
            >
              <TextField.Slot>
                <CalendarBlank size={14} />
              </TextField.Slot>
            </TextField.Root>
          </Box>

          {/* Date fin */}
          <Box style={{ minWidth: 150 }}>
            <Text size="1" color="gray" mb="1" as="label">
              Date fin
            </Text>
            <TextField.Root
              type="date"
              value={filters.dateFin || ""}
              onChange={(e) => handleFilterChange("dateFin", e.target.value)}
            >
              <TextField.Slot>
                <CalendarBlank size={14} />
              </TextField.Slot>
            </TextField.Root>
          </Box>

          {/* Type de vente */}
          <Box style={{ minWidth: 150 }}>
            <Text size="1" color="gray" mb="1" as="label">
              Type
            </Text>
            <Select.Root
              value={filters.type || "all"}
              onValueChange={(v) => handleFilterChange("type", v === "all" ? undefined : v)}
            >
              <Select.Trigger placeholder="Tous les types" style={{ width: "100%" }} />
              <Select.Content position="popper">
                <Select.Item value="all">Tous les types</Select.Item>
                <Select.Item value="DIRECT">Vente directe</Select.Item>
                <Select.Item value="TABLE">Service table</Select.Item>
                <Select.Item value="LIVRAISON">Livraison</Select.Item>
                <Select.Item value="EMPORTER">A emporter</Select.Item>
              </Select.Content>
            </Select.Root>
          </Box>

          {/* Statut */}
          <Box style={{ minWidth: 140 }}>
            <Text size="1" color="gray" mb="1" as="label">
              Statut
            </Text>
            <Select.Root
              value={filters.statut || "all"}
              onValueChange={(v) => handleFilterChange("statut", v === "all" ? undefined : v)}
            >
              <Select.Trigger placeholder="Tous" style={{ width: "100%" }} />
              <Select.Content position="popper">
                <Select.Item value="all">Tous</Select.Item>
                <Select.Item value="PAYEE">Payee</Select.Item>
                <Select.Item value="EN_COURS">En cours</Select.Item>
                <Select.Item value="ANNULEE">Annulee</Select.Item>
              </Select.Content>
            </Select.Root>
          </Box>

          {/* Reset */}
          {hasActiveFilters ? (
            <Button variant="ghost" color="gray" onClick={handleResetFilters}>
              <X size={14} />
              Effacer
            </Button>
          ) : null}
        </Flex>
      </Box>

      {/* Table */}
      {isLoading ? (
        <Box>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} width="100%" height="52px" mb="2" />
          ))}
        </Box>
      ) : factures.length === 0 ? (
        <Flex align="center" justify="center" style={{ height: 200 }}>
          <Text size="3" color="gray">
            Aucune facture trouvee
          </Text>
        </Flex>
      ) : (
        <>
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>N Ticket</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Client / Table</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center">Statut</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="right">Total</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center">Actions</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {factures.map((facture) => {
                const typeConfig = TYPE_VENTE_LABELS[facture.type];
                const statutConfig = STATUT_CONFIG[facture.statut];

                return (
                  <Table.Row key={facture.id}>
                    {/* Date */}
                    <Table.RowHeaderCell>
                      <Flex direction="column" gap="1">
                        <Flex align="center" gap="1">
                          <CalendarBlank size={12} />
                          <Text size="2" weight="medium">
                            {formatDate(facture.createdAt, "short")}
                          </Text>
                        </Flex>
                        <Flex align="center" gap="1">
                          <Clock size={12} />
                          <Text size="1" color="gray">
                            {formatTime(facture.createdAt)}
                          </Text>
                        </Flex>
                      </Flex>
                    </Table.RowHeaderCell>

                    {/* Numero ticket */}
                    <Table.Cell>
                      <Text
                        size="2"
                        weight="medium"
                        style={{
                          fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                        }}
                      >
                        #{facture.numeroTicket}
                      </Text>
                    </Table.Cell>

                    {/* Type */}
                    <Table.Cell>
                      <Flex align="center" gap="1">
                        {typeConfig?.icon}
                        <Text size="2">{typeConfig?.label || facture.type}</Text>
                      </Flex>
                    </Table.Cell>

                    {/* Client / Table */}
                    <Table.Cell>
                      {facture.client ? (
                        <Flex align="center" gap="1">
                          <User size={14} />
                          <Text size="2">
                            {facture.client.prenom} {facture.client.nom}
                          </Text>
                        </Flex>
                      ) : facture.table ? (
                        <Flex align="center" gap="1">
                          <ForkKnife size={14} />
                          <Text size="2">
                            Table {facture.table.numero}
                            {facture.table.zones ? (
                              <Text color="gray"> ({facture.table.zones.nom})</Text>
                            ) : null}
                          </Text>
                        </Flex>
                      ) : (
                        <Text size="2" color="gray">
                          -
                        </Text>
                      )}
                    </Table.Cell>

                    {/* Statut */}
                    <Table.Cell align="center">
                      <Badge color={statutConfig?.color || "gray"} variant="soft">
                        {statutConfig?.label || facture.statut}
                      </Badge>
                    </Table.Cell>

                    {/* Total */}
                    <Table.Cell align="right">
                      <Text
                        size="2"
                        weight="bold"
                        style={{
                          fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                          color: facture.statut === "ANNULEE" ? "var(--red-9)" : "var(--gray-12)",
                          textDecoration: facture.statut === "ANNULEE" ? "line-through" : "none",
                        }}
                      >
                        {formatCurrency(facture.totalFinal)}
                      </Text>
                    </Table.Cell>

                    {/* Actions */}
                    <Table.Cell align="center">
                      <Flex gap="1" justify="center">
                        <IconButton
                          variant="ghost"
                          size="1"
                          onClick={() => handleViewDetail(facture.id)}
                          title="Voir le detail"
                        >
                          <Eye size={16} />
                        </IconButton>
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>

          {/* Pagination */}
          {totalPages > 1 && (
            <Flex
              justify="between"
              align="center"
              mt="4"
              pt="4"
              style={{ borderTop: "1px solid var(--gray-a5)" }}
            >
              <Text size="2" color="gray">
                Page {page} sur {totalPages} ({total} resultats)
              </Text>
              <Flex gap="2">
                <Button
                  variant="soft"
                  color="gray"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <CaretLeft size={16} />
                  Precedent
                </Button>
                <Button
                  variant="soft"
                  color="gray"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Suivant
                  <CaretRight size={16} />
                </Button>
              </Flex>
            </Flex>
          )}
        </>
      )}

      {/* Dialog Detail Facture */}
      <Dialog.Root open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <Dialog.Content maxWidth="650px">
          <Dialog.Title>
            <Flex align="center" gap="2">
              <Receipt size={20} />
              Detail de la facture
            </Flex>
          </Dialog.Title>

          {isLoadingDetail ? (
            <Box py="6">
              <Flex direction="column" gap="3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} width="100%" height="40px" />
                ))}
              </Flex>
            </Box>
          ) : selectedFacture ? (
            <ScrollArea style={{ maxHeight: "70vh" }}>
              <Box py="4">
                {/* Header facture */}
                <Box
                  mb="4"
                  style={{
                    padding: 16,
                    borderRadius: 8,
                    backgroundColor: "var(--gray-a2)",
                  }}
                >
                  <Flex justify="between" wrap="wrap" gap="3">
                    <Box>
                      <Text size="1" color="gray">
                        Numero de ticket
                      </Text>
                      <Text
                        size="3"
                        weight="bold"
                        style={{
                          fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                        }}
                      >
                        #{selectedFacture.numeroTicket}
                      </Text>
                    </Box>
                    <Box>
                      <Text size="1" color="gray">
                        Date
                      </Text>
                      <Text size="2" weight="medium">
                        {formatDate(selectedFacture.createdAt, "datetime")}
                      </Text>
                    </Box>
                    <Box>
                      <Text size="1" color="gray">
                        Statut
                      </Text>
                      <Badge
                        color={STATUT_CONFIG[selectedFacture.statut]?.color || "gray"}
                        variant="soft"
                        size="2"
                      >
                        {STATUT_CONFIG[selectedFacture.statut]?.label || selectedFacture.statut}
                      </Badge>
                    </Box>
                  </Flex>

                  <Separator size="4" my="3" />

                  <Flex justify="between" wrap="wrap" gap="3">
                    <Box>
                      <Text size="1" color="gray">
                        Type
                      </Text>
                      <Flex align="center" gap="1">
                        {TYPE_VENTE_LABELS[selectedFacture.type]?.icon}
                        <Text size="2">
                          {TYPE_VENTE_LABELS[selectedFacture.type]?.label || selectedFacture.type}
                        </Text>
                      </Flex>
                    </Box>
                    {selectedFacture.utilisateur ? (
                      <Box>
                        <Text size="1" color="gray">
                          Caissier
                        </Text>
                        <Text size="2">
                          {selectedFacture.utilisateur.prenom} {selectedFacture.utilisateur.nom}
                        </Text>
                      </Box>
                    ) : null}
                    {selectedFacture.client ? (
                      <Box>
                        <Text size="1" color="gray">
                          Client
                        </Text>
                        <Text size="2">
                          {selectedFacture.client.prenom} {selectedFacture.client.nom}
                        </Text>
                      </Box>
                    ) : null}
                    {selectedFacture.table ? (
                      <Box>
                        <Text size="1" color="gray">
                          Table
                        </Text>
                        <Text size="2">
                          Table {selectedFacture.table.numero}
                          {selectedFacture.table.zones
                            ? ` (${selectedFacture.table.zones.nom})`
                            : null}
                        </Text>
                      </Box>
                    ) : null}
                  </Flex>

                  {selectedFacture.adresseLivraison ? (
                    <Box mt="3">
                      <Text size="1" color="gray">
                        Adresse de livraison
                      </Text>
                      <Flex align="center" gap="1">
                        <MapPin size={14} />
                        <Text size="2">{selectedFacture.adresseLivraison}</Text>
                      </Flex>
                    </Box>
                  ) : null}
                </Box>

                {/* Articles */}
                <Text size="3" weight="bold" mb="2">
                  Articles
                </Text>
                <Table.Root size="1" mb="4">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>Article</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell align="right">Qte</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell align="right">P.U.</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell align="right">Total</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {selectedFacture.lignes.map((ligne) => (
                      <Table.Row key={ligne.id}>
                        <Table.Cell>
                          <Flex direction="column" gap="1">
                            <Text size="2" weight="medium">
                              {ligne.produit?.nom || "Produit inconnu"}
                            </Text>
                            {ligne.supplements.length > 0 && (
                              <Text size="1" color="gray">
                                + {ligne.supplements.map((s) => s.nom).join(", ")}
                              </Text>
                            )}
                            {ligne.notes ? (
                              <Text size="1" color="violet">
                                Note: {ligne.notes}
                              </Text>
                            ) : null}
                          </Flex>
                        </Table.Cell>
                        <Table.Cell align="right">
                          <Text size="2">{ligne.quantite}</Text>
                        </Table.Cell>
                        <Table.Cell align="right">
                          <Text
                            size="2"
                            style={{
                              fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                            }}
                          >
                            {formatCurrency(ligne.prixUnitaire)}
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
                            {formatCurrency(ligne.total)}
                          </Text>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>

                {/* Totaux */}
                <Box
                  mb="4"
                  style={{
                    padding: 16,
                    borderRadius: 8,
                    backgroundColor: "var(--gray-a2)",
                  }}
                >
                  <Flex direction="column" gap="2">
                    <Flex justify="between">
                      <Text size="2">Sous-total HT</Text>
                      <Text
                        size="2"
                        style={{
                          fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                        }}
                      >
                        {formatCurrency(selectedFacture.sousTotal)}
                      </Text>
                    </Flex>
                    <Flex justify="between">
                      <Text size="2">TVA</Text>
                      <Text
                        size="2"
                        style={{
                          fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                        }}
                      >
                        {formatCurrency(selectedFacture.totalTva)}
                      </Text>
                    </Flex>
                    {selectedFacture.totalRemise > 0 && (
                      <Flex justify="between">
                        <Text size="2" color="green">
                          Remise
                          {selectedFacture.typeRemise === "POURCENTAGE" &&
                          selectedFacture.valeurRemise
                            ? ` (${selectedFacture.valeurRemise}%)`
                            : null}
                        </Text>
                        <Text
                          size="2"
                          color="green"
                          style={{
                            fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                          }}
                        >
                          -{formatCurrency(selectedFacture.totalRemise)}
                        </Text>
                      </Flex>
                    )}
                    <Separator size="4" />
                    <Flex justify="between">
                      <Text size="3" weight="bold">
                        TOTAL TTC
                      </Text>
                      <Text
                        size="3"
                        weight="bold"
                        style={{
                          fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                          color: "var(--violet-9)",
                        }}
                      >
                        {formatCurrency(selectedFacture.totalFinal)}
                      </Text>
                    </Flex>
                  </Flex>
                </Box>

                {/* Paiements */}
                {selectedFacture.paiements.length > 0 && (
                  <>
                    <Text size="3" weight="bold" mb="2">
                      Paiements
                    </Text>
                    <Table.Root size="1">
                      <Table.Body>
                        {selectedFacture.paiements.map((paiement) => {
                          const modeConfig = MODE_PAIEMENT_LABELS[paiement.modePaiement];
                          return (
                            <Table.Row key={paiement.id}>
                              <Table.Cell>
                                <Flex align="center" gap="2">
                                  {modeConfig?.icon}
                                  <Text size="2">{modeConfig?.label || paiement.modePaiement}</Text>
                                </Flex>
                                {paiement.reference ? (
                                  <Text size="1" color="gray">
                                    Ref: {paiement.reference}
                                  </Text>
                                ) : null}
                              </Table.Cell>
                              <Table.Cell align="right">
                                <Text
                                  size="2"
                                  weight="medium"
                                  style={{
                                    fontFamily:
                                      "var(--font-google-sans-code), ui-monospace, monospace",
                                  }}
                                >
                                  {formatCurrency(paiement.montant)}
                                </Text>
                                {paiement.montantRecu !== null && (
                                  <Flex direction="column" gap="0">
                                    <Text size="1" color="gray">
                                      Recu: {formatCurrency(paiement.montantRecu)}
                                    </Text>
                                    <Text size="1" color="gray">
                                      Rendu: {formatCurrency(paiement.monnaieRendue || 0)}
                                    </Text>
                                  </Flex>
                                )}
                              </Table.Cell>
                            </Table.Row>
                          );
                        })}
                      </Table.Body>
                    </Table.Root>
                  </>
                )}

                {/* Notes */}
                {selectedFacture.notes ? (
                  <Box mt="4">
                    <Text size="2" weight="bold" mb="1">
                      Notes
                    </Text>
                    <Text size="2" color="gray">
                      {selectedFacture.notes}
                    </Text>
                  </Box>
                ) : null}
              </Box>
            </ScrollArea>
          ) : (
            <Box py="6">
              <Text color="gray">Impossible de charger la facture</Text>
            </Box>
          )}

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Fermer
              </Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Card>
  );
}
