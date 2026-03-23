"use client";

/**
 * Table des établissements avec sélection, tri sur headers, actions
 */

import { Box, Flex, Text, Badge, Table, Checkbox, Button, DropdownMenu } from "@radix-ui/themes";
import {
  Eye,
  PencilSimple,
  Pause,
  Play,
  Trash,
  DotsThreeVertical,
  CaretUp,
  CaretDown,
  Buildings,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { EtablissementWithStatsExtended } from "./types";

interface EtablissementsTableProps {
  etablissements: EtablissementWithStatsExtended[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (column: string) => void;
  onSuspend: (etab: EtablissementWithStatsExtended) => void;
  onReactivate: (etab: EtablissementWithStatsExtended) => void;
  onDelete: (etab: EtablissementWithStatsExtended) => void;
}

function SortIcon({ column, currentSort, sortOrder }: {
  column: string;
  currentSort: string;
  sortOrder: "asc" | "desc";
}) {
  if (column !== currentSort) {
    return (
      <Box style={{ opacity: 0.3, display: "inline-flex" }}>
        <CaretDown size={12} weight="bold" />
      </Box>
    );
  }
  return sortOrder === "asc" ? (
    <CaretUp size={12} weight="bold" style={{ color: "var(--accent-9)" }} />
  ) : (
    <CaretDown size={12} weight="bold" style={{ color: "var(--accent-9)" }} />
  );
}

function SortableHeader({
  label,
  column,
  currentSort,
  sortOrder,
  onSort,
  align = "left",
}: {
  label: string;
  column: string;
  currentSort: string;
  sortOrder: "asc" | "desc";
  onSort: (column: string) => void;
  align?: "left" | "center" | "right";
}) {
  return (
    <Table.ColumnHeaderCell
      align={align === "left" ? undefined : align}
      style={{ cursor: "pointer", userSelect: "none" }}
      onClick={() => onSort(column)}
    >
      <Flex
        align="center"
        gap="1"
        justify={align === "center" ? "center" : align === "right" ? "end" : "start"}
      >
        <Text size="2">{label}</Text>
        <SortIcon column={column} currentSort={currentSort} sortOrder={sortOrder} />
      </Flex>
    </Table.ColumnHeaderCell>
  );
}

function StatutBadge({ statut }: { statut: string }) {
  const config: Record<string, { color: "green" | "red" | "amber"; label: string }> = {
    actif: { color: "green", label: "Actif" },
    suspendu: { color: "red", label: "Suspendu" },
    en_essai: { color: "amber", label: "En essai" },
  };
  const c = config[statut] || { color: "gray" as const, label: statut };
  return (
    <Badge color={c.color} variant="soft" radius="full" size="1">
      {c.label}
    </Badge>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const config: Record<string, { color: "gray" | "orange" | "blue" | "violet"; label: string }> = {
    essentiel: { color: "gray", label: "Essentiel" },
    pro: { color: "blue", label: "Pro" },
    business: { color: "orange", label: "Business" },
    enterprise: { color: "violet", label: "Enterprise" },
  };
  const c = config[plan] || { color: "gray" as const, label: plan };
  return (
    <Badge color={c.color} variant="surface" radius="full" size="1">
      {c.label}
    </Badge>
  );
}

export function EtablissementsTable({
  etablissements,
  selectedIds,
  onSelectionChange,
  sortBy,
  sortOrder,
  onSortChange,
  onSuspend,
  onReactivate,
  onDelete,
}: EtablissementsTableProps) {
  const allSelected = etablissements.length > 0 && selectedIds.size === etablissements.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < etablissements.length;

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(etablissements.map((e) => e.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  };

  if (etablissements.length === 0) {
    return (
      <Flex direction="column" align="center" justify="center" py="8" gap="2">
        <Buildings size={32} weight="duotone" style={{ color: "var(--gray-8)" }} />
        <Text color="gray" size="2">
          Aucun établissement trouvé
        </Text>
      </Flex>
    );
  }

  return (
    <Box
      style={{
        background: "var(--color-background)",
        borderRadius: 12,
        border: "1px solid var(--gray-a4)",
        overflow: "hidden",
      }}
    >
      <Table.Root size="2">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell style={{ width: 44 }}>
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={toggleAll}
                size="2"
              />
            </Table.ColumnHeaderCell>
            <SortableHeader
              label="Établissement"
              column="nom"
              currentSort={sortBy}
              sortOrder={sortOrder}
              onSort={onSortChange}
            />
            <Table.ColumnHeaderCell>Contact</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell align="center">Statut</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell align="center">Plan</Table.ColumnHeaderCell>
            <SortableHeader
              label="Utilisateurs"
              column="nb_utilisateurs"
              currentSort={sortBy}
              sortOrder={sortOrder}
              onSort={onSortChange}
              align="center"
            />
            <Table.ColumnHeaderCell align="center">Produits</Table.ColumnHeaderCell>
            <SortableHeader
              label="Ventes"
              column="nb_ventes"
              currentSort={sortBy}
              sortOrder={sortOrder}
              onSort={onSortChange}
              align="center"
            />
            <SortableHeader
              label="CA"
              column="chiffre_affaires"
              currentSort={sortBy}
              sortOrder={sortOrder}
              onSort={onSortChange}
              align="right"
            />
            <SortableHeader
              label="Créé le"
              column="created_at"
              currentSort={sortBy}
              sortOrder={sortOrder}
              onSort={onSortChange}
              align="center"
            />
            <Table.ColumnHeaderCell align="right">Actions</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {etablissements.map((etab, index) => (
            <motion.tr
              key={etab.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              className="rt-TableRow"
              style={{
                background: selectedIds.has(etab.id) ? "var(--accent-a2)" : undefined,
              }}
            >
              <Table.Cell style={{ width: 44 }}>
                <Checkbox
                  checked={selectedIds.has(etab.id)}
                  onCheckedChange={() => toggleOne(etab.id)}
                  size="2"
                />
              </Table.Cell>
              <Table.Cell>
                <Link
                  href={`/admin/etablissements/${etab.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <Flex direction="column" gap="1">
                    <Text
                      weight="medium"
                      size="2"
                      style={{ color: "var(--accent-11)", cursor: "pointer" }}
                    >
                      {etab.nom}
                    </Text>
                    <Text
                      size="1"
                      color="gray"
                      style={{ fontFamily: "var(--code-font-family)" }}
                    >
                      {etab.id.slice(0, 8)}...
                    </Text>
                  </Flex>
                </Link>
              </Table.Cell>
              <Table.Cell>
                <Flex direction="column" gap="1">
                  <Text size="2">{etab.email || "—"}</Text>
                  <Text size="1" color="gray">
                    {etab.telephone || "—"}
                  </Text>
                </Flex>
              </Table.Cell>
              <Table.Cell align="center">
                <StatutBadge statut={etab.statut || "actif"} />
              </Table.Cell>
              <Table.Cell align="center">
                <PlanBadge plan={etab.plan || "essentiel"} />
              </Table.Cell>
              <Table.Cell align="center">
                <Badge color="blue" variant="soft" radius="full">
                  {etab.nbUtilisateurs}
                </Badge>
              </Table.Cell>
              <Table.Cell align="center">
                <Badge color="orange" variant="soft" radius="full">
                  {etab.nbProduits}
                </Badge>
              </Table.Cell>
              <Table.Cell align="center">
                <Badge color="green" variant="soft" radius="full">
                  {etab.nbVentes}
                </Badge>
              </Table.Cell>
              <Table.Cell align="right">
                <Text
                  size="2"
                  weight="medium"
                  style={{ fontFamily: "var(--font-google-sans-code), ui-monospace, monospace" }}
                >
                  {formatCurrency(etab.chiffreAffaires || 0)}
                </Text>
              </Table.Cell>
              <Table.Cell align="center">
                <Text size="2" color="gray">
                  {new Date(etab.createdAt).toLocaleDateString("fr-FR")}
                </Text>
              </Table.Cell>
              <Table.Cell align="right">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger>
                    <Button
                      variant="ghost"
                      color="gray"
                      size="1"
                      style={{ cursor: "pointer" }}
                    >
                      <DotsThreeVertical size={16} weight="bold" />
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content align="end" size="1">
                    <DropdownMenu.Item asChild>
                      <Link
                        href={`/admin/etablissements/${etab.id}`}
                        style={{ textDecoration: "none" }}
                      >
                        <Eye size={14} weight="bold" />
                        Voir détail
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <Link
                        href={`/admin/etablissements/${etab.id}?edit=true`}
                        style={{ textDecoration: "none" }}
                      >
                        <PencilSimple size={14} weight="bold" />
                        Modifier
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    {etab.statut === "suspendu" ? (
                      <DropdownMenu.Item
                        onClick={() => onReactivate(etab)}
                      >
                        <Play size={14} weight="bold" />
                        Réactiver
                      </DropdownMenu.Item>
                    ) : (
                      <DropdownMenu.Item
                        color="amber"
                        onClick={() => onSuspend(etab)}
                      >
                        <Pause size={14} weight="bold" />
                        Suspendre
                      </DropdownMenu.Item>
                    )}
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item
                      color="red"
                      onClick={() => onDelete(etab)}
                    >
                      <Trash size={14} weight="bold" />
                      Supprimer
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </Table.Cell>
            </motion.tr>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
