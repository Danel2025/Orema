"use client";

/**
 * Gestionnaire de facturation - Liste des factures, filtres, creation
 * Affiche les factures d'un etablissement avec actions
 */

import { useState, useMemo } from "react";
import {
  Box,
  Flex,
  Grid,
  Text,
  Heading,
  Badge,
  Button,
  Table,
  Dialog,
  TextField,
  TextArea,
  Select,
  Skeleton,
  Callout,
} from "@radix-ui/themes";
import {
  Receipt,
  Plus,
  Funnel,
  FileArrowDown,
  Eye,
  CalendarBlank,
  CurrencyCircleDollar,
  Clock,
  CheckCircle,
  Warning,
  ArrowClockwise,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import type { Facture, FactureStatut } from "../shared/types";

// ── Types ───────────────────────────────────────────────────────────────

interface FacturationManagerProps {
  etablissementId: string;
  factures: Facture[];
  isLoading?: boolean;
  onCreateFacture?: (data: CreateFactureData) => Promise<void>;
  onExport?: () => void;
  totalFacture?: number;
  totalPaye?: number;
  totalEnAttente?: number;
  totalEnRetard?: number;
}

interface CreateFactureData {
  montant: number;
  notes?: string;
  dateEcheance?: string;
}

type FilterStatut = "all" | FactureStatut;

// ── Helpers ─────────────────────────────────────────────────────────────

const statutConfig: Record<
  FactureStatut,
  { label: string; color: "gray" | "blue" | "green" | "red" }
> = {
  brouillon: { label: "Brouillon", color: "gray" },
  envoyee: { label: "En attente", color: "blue" },
  payee: { label: "Payée", color: "green" },
  annulee: { label: "Annulée", color: "red" },
};

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Stat Card ───────────────────────────────────────────────────────────

function FacturationStatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: typeof Receipt;
  color: string;
}) {
  return (
    <Box
      p="4"
      style={{
        background: "var(--color-background)",
        borderRadius: 12,
        border: "1px solid var(--gray-a4)",
      }}
    >
      <Flex align="center" justify="between" mb="2">
        <Text size="2" color="gray" weight="medium">
          {label}
        </Text>
        <Flex
          align="center"
          justify="center"
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: `var(--${color}-a3)`,
          }}
        >
          <Icon
            size={18}
            weight="duotone"
            style={{ color: `var(--${color}-9)` }}
          />
        </Flex>
      </Flex>
      <Text
        size="5"
        weight="bold"
        style={{
          fontFamily: "var(--font-google-sans-code), monospace",
          display: "block",
        }}
      >
        {value}
      </Text>
    </Box>
  );
}

// ── Skeleton ────────────────────────────────────────────────────────────

function FacturationSkeleton() {
  return (
    <Flex direction="column" gap="5">
      <Grid columns={{ initial: "2", md: "4" }} gap="4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} style={{ height: 100, borderRadius: 12 }} />
        ))}
      </Grid>
      <Skeleton style={{ height: 300, borderRadius: 12 }} />
    </Flex>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

export function FacturationManager({
  etablissementId,
  factures,
  isLoading = false,
  onCreateFacture,
  onExport,
  totalFacture = 0,
  totalPaye = 0,
  totalEnAttente = 0,
  totalEnRetard = 0,
}: FacturationManagerProps) {
  const [filterStatut, setFilterStatut] = useState<FilterStatut>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [newMontant, setNewMontant] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newDateEcheance, setNewDateEcheance] = useState("");

  const filteredFactures = useMemo(() => {
    return factures.filter((f) => {
      if (filterStatut !== "all" && f.statut !== filterStatut) return false;
      if (
        searchQuery &&
        !f.numero.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [factures, filterStatut, searchQuery]);

  const handleCreateFacture = async () => {
    if (!onCreateFacture) return;

    const montant = parseInt(newMontant);
    if (isNaN(montant) || montant <= 0) {
      toast.error("Le montant doit être supérieur à 0");
      return;
    }

    setIsCreating(true);
    try {
      await onCreateFacture({
        montant,
        notes: newNotes || undefined,
        dateEcheance: newDateEcheance || undefined,
      });
      toast.success("Facture créée avec succès");
      setCreateDialogOpen(false);
      resetForm();
    } catch {
      toast.error("Erreur lors de la création de la facture");
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setNewMontant("");
    setNewNotes("");
    setNewDateEcheance("");
  };

  if (isLoading) {
    return <FacturationSkeleton />;
  }

  return (
    <Flex direction="column" gap="5">
      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Grid columns={{ initial: "2", md: "4" }} gap="4">
          <FacturationStatCard
            label="Total facture"
            value={formatCurrency(totalFacture)}
            icon={Receipt}
            color="violet"
          />
          <FacturationStatCard
            label="Payé"
            value={formatCurrency(totalPaye)}
            icon={CheckCircle}
            color="green"
          />
          <FacturationStatCard
            label="En attente"
            value={formatCurrency(totalEnAttente)}
            icon={Clock}
            color="blue"
          />
          <FacturationStatCard
            label="En retard"
            value={formatCurrency(totalEnRetard)}
            icon={Warning}
            color="red"
          />
        </Grid>
      </motion.div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
      >
        <Box
          p="4"
          style={{
            background: "var(--color-background)",
            borderRadius: 12,
            border: "1px solid var(--gray-a4)",
          }}
        >
          <Flex gap="3" align="center" justify="between" wrap="wrap">
            <Flex gap="3" align="center" wrap="wrap" style={{ flex: 1 }}>
              {/* Recherche */}
              <Box style={{ minWidth: 200 }}>
                <TextField.Root
                  placeholder="Rechercher par numéro..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="2"
                >
                  <TextField.Slot>
                    <MagnifyingGlass
                      size={16}
                      weight="bold"
                      style={{ color: "var(--gray-9)" }}
                    />
                  </TextField.Slot>
                </TextField.Root>
              </Box>

              {/* Filtre statut */}
              <Flex align="center" gap="2">
                <Funnel
                  size={14}
                  weight="bold"
                  style={{ color: "var(--gray-9)" }}
                />
                <Select.Root
                  value={filterStatut}
                  onValueChange={(val) =>
                    setFilterStatut(val as FilterStatut)
                  }
                  size="2"
                >
                  <Select.Trigger
                    variant="surface"
                    style={{ minWidth: 140 }}
                  />
                  <Select.Content position="popper">
                    <Select.Item value="all">Tous les statuts</Select.Item>
                    <Select.Separator />
                    {Object.entries(statutConfig).map(([key, cfg]) => (
                      <Select.Item key={key} value={key}>
                        {cfg.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Flex>
            </Flex>

            {/* Actions */}
            <Flex gap="2">
              {onExport ? <Button
                  variant="soft"
                  color="gray"
                  size="2"
                  onClick={onExport}
                  style={{ cursor: "pointer" }}
                >
                  <FileArrowDown size={16} weight="bold" />
                  Exporter
                </Button> : null}
              {onCreateFacture ? <Button
                  size="2"
                  onClick={() => setCreateDialogOpen(true)}
                  style={{ cursor: "pointer" }}
                >
                  <Plus size={16} weight="bold" />
                  Créer une facture
                </Button> : null}
            </Flex>
          </Flex>
        </Box>
      </motion.div>

      {/* Table des factures */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.16 }}
      >
        <Box
          style={{
            background: "var(--color-background)",
            borderRadius: 12,
            border: "1px solid var(--gray-a4)",
            overflow: "hidden",
          }}
        >
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Numéro</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Date émission</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Échéance</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="right">
                  Montant
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center">
                  Statut
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="right">
                  Actions
                </Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredFactures.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={6}>
                    <Flex
                      direction="column"
                      align="center"
                      justify="center"
                      py="8"
                      gap="2"
                    >
                      <Receipt
                        size={32}
                        weight="duotone"
                        style={{ color: "var(--gray-8)" }}
                      />
                      <Text color="gray" size="2">
                        {filterStatut !== "all" || searchQuery
                          ? "Aucune facture ne correspond aux filtres"
                          : "Aucune facture pour cet établissement"}
                      </Text>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ) : (
                filteredFactures.map((facture) => {
                  const config = statutConfig[facture.statut];
                  return (
                    <Table.Row key={facture.id}>
                      <Table.Cell>
                        <Text
                          size="2"
                          weight="medium"
                          style={{
                            fontFamily:
                              "var(--font-google-sans-code), monospace",
                          }}
                        >
                          {facture.numero}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Flex align="center" gap="2">
                          <CalendarBlank
                            size={14}
                            weight="duotone"
                            style={{ color: "var(--gray-9)" }}
                          />
                          <Text size="2">
                            {formatDate(facture.dateEmission)}
                          </Text>
                        </Flex>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2" color="gray">
                          {formatDate(facture.dateEcheance)}
                        </Text>
                      </Table.Cell>
                      <Table.Cell align="right">
                        <Text
                          size="2"
                          weight="bold"
                          style={{
                            fontFamily:
                              "var(--font-google-sans-code), monospace",
                          }}
                        >
                          {formatCurrency(facture.montant)}
                        </Text>
                      </Table.Cell>
                      <Table.Cell align="center">
                        <Badge
                          color={config.color}
                          variant="soft"
                          size="1"
                          radius="full"
                        >
                          {config.label}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell align="right">
                        <Button
                          size="1"
                          variant="ghost"
                          color="gray"
                          style={{ cursor: "pointer" }}
                        >
                          <Eye size={14} weight="bold" />
                          Voir
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  );
                })
              )}
            </Table.Body>
          </Table.Root>
        </Box>

        {/* Compteur */}
        <Flex justify="between" align="center" mt="3" px="1">
          <Text size="2" color="gray">
            {filteredFactures.length} facture
            {filteredFactures.length > 1 ? "s" : ""}
            {filterStatut !== "all" || searchQuery
              ? ` (${factures.length} au total)`
              : ""}
          </Text>
        </Flex>
      </motion.div>

      {/* Dialog de creation */}
      <Dialog.Root
        open={createDialogOpen}
        onOpenChange={(open) => {
          if (!isCreating) {
            setCreateDialogOpen(open);
            if (!open) resetForm();
          }
        }}
      >
        <Dialog.Content maxWidth="450px">
          <Dialog.Title>
            <Flex align="center" gap="2">
              <CurrencyCircleDollar
                size={20}
                weight="duotone"
                style={{ color: "var(--accent-9)" }}
              />
              Créer une facture
            </Flex>
          </Dialog.Title>

          <Dialog.Description size="2" mb="4">
            Créez une facture manuelle pour cet établissement.
          </Dialog.Description>

          <Flex direction="column" gap="4">
            {/* Montant */}
            <Box>
              <Text
                as="label"
                size="2"
                weight="medium"
                mb="1"
                style={{ display: "block" }}
              >
                Montant (FCFA) *
              </Text>
              <TextField.Root
                placeholder="Ex: 75000"
                value={newMontant}
                onChange={(e) => setNewMontant(e.target.value)}
                type="number"
                min="1"
              >
                <TextField.Slot>
                  <CurrencyCircleDollar
                    size={16}
                    weight="bold"
                    style={{ color: "var(--gray-9)" }}
                  />
                </TextField.Slot>
                <TextField.Slot>
                  <Text size="2" color="gray">
                    FCFA
                  </Text>
                </TextField.Slot>
              </TextField.Root>
            </Box>

            {/* Date echeance */}
            <Box>
              <Text
                as="label"
                size="2"
                weight="medium"
                mb="1"
                style={{ display: "block" }}
              >
                Date d&apos;échéance
              </Text>
              <TextField.Root
                type="date"
                value={newDateEcheance}
                onChange={(e) => setNewDateEcheance(e.target.value)}
              >
                <TextField.Slot>
                  <CalendarBlank
                    size={16}
                    weight="bold"
                    style={{ color: "var(--gray-9)" }}
                  />
                </TextField.Slot>
              </TextField.Root>
            </Box>

            {/* Notes */}
            <Box>
              <Text
                as="label"
                size="2"
                weight="medium"
                mb="1"
                style={{ display: "block" }}
              >
                Notes
              </Text>
              <TextArea
                placeholder="Notes optionnelles..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                rows={3}
              />
            </Box>

            {newMontant && parseInt(newMontant) > 0 ? <Callout.Root color="blue" variant="surface">
                <Callout.Icon>
                  <Receipt size={16} weight="fill" />
                </Callout.Icon>
                <Callout.Text size="2">
                  Facture de{" "}
                  <Text weight="bold">
                    {formatCurrency(parseInt(newMontant))}
                  </Text>
                  {newDateEcheance ? <>
                      , échéance le{" "}
                      <Text weight="bold">{formatDate(newDateEcheance)}</Text>
                    </> : null}
                </Callout.Text>
              </Callout.Root> : null}
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" disabled={isCreating}>
                Annuler
              </Button>
            </Dialog.Close>
            <Button
              onClick={handleCreateFacture}
              disabled={isCreating || !newMontant || parseInt(newMontant) <= 0}
            >
              {isCreating ? (
                <>
                  <ArrowClockwise
                    size={14}
                    weight="bold"
                    className="animate-spin"
                  />
                  Création...
                </>
              ) : (
                <>
                  <Plus size={14} weight="bold" />
                  Créer la facture
                </>
              )}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Flex>
  );
}
