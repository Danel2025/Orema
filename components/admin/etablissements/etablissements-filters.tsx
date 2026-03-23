"use client";

/**
 * Barre de filtres pour la liste des établissements
 * Recherche, filtrage par statut/plan, tri
 */

import { Box, Flex, Text, Select, TextField, Button } from "@radix-ui/themes";
import {
  MagnifyingGlass,
  Funnel,
  ArrowsDownUp,
  X,
} from "@phosphor-icons/react";

export interface EtablissementFilters {
  search: string;
  statut: string;
  plan: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface EtablissementsFiltersProps {
  filters: EtablissementFilters;
  onFiltersChange: (filters: EtablissementFilters) => void;
  disabled?: boolean;
}

const defaultFilters: EtablissementFilters = {
  search: "",
  statut: "all",
  plan: "all",
  sortBy: "created_at",
  sortOrder: "desc",
};

export function EtablissementsFilters({
  filters,
  onFiltersChange,
  disabled = false,
}: EtablissementsFiltersProps) {
  const updateFilter = <K extends keyof EtablissementFilters>(
    key: K,
    value: EtablissementFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters =
    filters.search !== "" ||
    filters.statut !== "all" ||
    filters.plan !== "all" ||
    filters.sortBy !== "created_at" ||
    filters.sortOrder !== "desc";

  const resetFilters = () => {
    onFiltersChange(defaultFilters);
  };

  return (
    <Box
      p="4"
      style={{
        background: "var(--color-background)",
        borderRadius: 12,
        border: "1px solid var(--gray-a4)",
      }}
    >
      <Flex direction="column" gap="3">
        {/* Ligne 1 : Recherche */}
        <Flex gap="3" align="end" wrap="wrap">
          <Box style={{ flex: 1, minWidth: 240 }}>
            <TextField.Root
              placeholder="Rechercher par nom, email ou téléphone..."
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              disabled={disabled}
              size="2"
            >
              <TextField.Slot>
                <MagnifyingGlass size={16} weight="bold" style={{ color: "var(--gray-9)" }} />
              </TextField.Slot>
              {filters.search ? <TextField.Slot>
                  <Button
                    variant="ghost"
                    color="gray"
                    size="1"
                    onClick={() => updateFilter("search", "")}
                    style={{ cursor: "pointer" }}
                  >
                    <X size={14} weight="bold" />
                  </Button>
                </TextField.Slot> : null}
            </TextField.Root>
          </Box>
        </Flex>

        {/* Ligne 2 : Filtres et tri */}
        <Flex gap="3" align="center" wrap="wrap">
          <Flex align="center" gap="2">
            <Funnel size={14} weight="bold" style={{ color: "var(--gray-9)" }} />
            <Text size="2" color="gray" weight="medium">
              Filtres :
            </Text>
          </Flex>

          {/* Filtre statut */}
          <Select.Root
            value={filters.statut}
            onValueChange={(val) => updateFilter("statut", val)}
            size="2"
            disabled={disabled}
          >
            <Select.Trigger
              placeholder="Statut"
              variant="surface"
              style={{ minWidth: 130 }}
            />
            <Select.Content position="popper">
              <Select.Item value="all">Tous les statuts</Select.Item>
              <Select.Separator />
              <Select.Item value="actif">Actif</Select.Item>
              <Select.Item value="suspendu">Suspendu</Select.Item>
              <Select.Item value="en_essai">En essai</Select.Item>
            </Select.Content>
          </Select.Root>

          {/* Filtre plan */}
          <Select.Root
            value={filters.plan}
            onValueChange={(val) => updateFilter("plan", val)}
            size="2"
            disabled={disabled}
          >
            <Select.Trigger
              placeholder="Plan"
              variant="surface"
              style={{ minWidth: 130 }}
            />
            <Select.Content position="popper">
              <Select.Item value="all">Tous les plans</Select.Item>
              <Select.Separator />
              <Select.Item value="essentiel">Essentiel</Select.Item>
              <Select.Item value="pro">Pro</Select.Item>
              <Select.Item value="business">Business</Select.Item>
              <Select.Item value="enterprise">Enterprise</Select.Item>
            </Select.Content>
          </Select.Root>

          {/* Séparateur visuel */}
          <Box
            style={{
              width: 1,
              height: 24,
              background: "var(--gray-a5)",
            }}
          />

          {/* Tri */}
          <Flex align="center" gap="2">
            <ArrowsDownUp size={14} weight="bold" style={{ color: "var(--gray-9)" }} />
            <Text size="2" color="gray" weight="medium">
              Tri :
            </Text>
          </Flex>

          <Select.Root
            value={filters.sortBy}
            onValueChange={(val) => updateFilter("sortBy", val)}
            size="2"
            disabled={disabled}
          >
            <Select.Trigger
              variant="surface"
              style={{ minWidth: 150 }}
            />
            <Select.Content position="popper">
              <Select.Item value="nom">Nom</Select.Item>
              <Select.Item value="created_at">Date de création</Select.Item>
              <Select.Item value="chiffre_affaires">Chiffre d'affaires</Select.Item>
              <Select.Item value="nb_utilisateurs">Utilisateurs</Select.Item>
              <Select.Item value="nb_ventes">Ventes</Select.Item>
            </Select.Content>
          </Select.Root>

          <Select.Root
            value={filters.sortOrder}
            onValueChange={(val) => updateFilter("sortOrder", val as "asc" | "desc")}
            size="2"
            disabled={disabled}
          >
            <Select.Trigger variant="surface" style={{ minWidth: 120 }} />
            <Select.Content position="popper">
              <Select.Item value="desc">Décroissant</Select.Item>
              <Select.Item value="asc">Croissant</Select.Item>
            </Select.Content>
          </Select.Root>

          {/* Reset */}
          {hasActiveFilters ? <Button
              variant="ghost"
              color="gray"
              size="2"
              onClick={resetFilters}
              disabled={disabled}
              style={{ cursor: "pointer" }}
            >
              <X size={14} weight="bold" />
              Réinitialiser
            </Button> : null}
        </Flex>
      </Flex>
    </Box>
  );
}

export { defaultFilters };
