"use client";

/**
 * Vue cards alternative pour les établissements
 */

import { Box, Flex, Grid, Text, Badge, Checkbox, Button, DropdownMenu } from "@radix-ui/themes";
import {
  Buildings,
  Users,
  Package,
  ShoppingCart,
  CurrencyCircleDollar,
  Eye,
  PencilSimple,
  Pause,
  Play,
  Trash,
  DotsThreeVertical,
  CalendarBlank,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { EtablissementWithStatsExtended } from "./types";

interface EtablissementsCardsProps {
  etablissements: EtablissementWithStatsExtended[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onSuspend: (etab: EtablissementWithStatsExtended) => void;
  onReactivate: (etab: EtablissementWithStatsExtended) => void;
  onDelete: (etab: EtablissementWithStatsExtended) => void;
}

function StatutDot({ statut }: { statut: string }) {
  const colors: Record<string, string> = {
    actif: "var(--green-9)",
    suspendu: "var(--red-9)",
    en_essai: "var(--amber-9)",
  };
  return (
    <Box
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: colors[statut] || "var(--gray-9)",
        flexShrink: 0,
      }}
    />
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

export function EtablissementsCards({
  etablissements,
  selectedIds,
  onSelectionChange,
  onSuspend,
  onReactivate,
  onDelete,
}: EtablissementsCardsProps) {
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
    <Grid columns={{ initial: "1", md: "2", lg: "3" }} gap="4">
      {etablissements.map((etab, index) => {
        const isSelected = selectedIds.has(etab.id);

        return (
          <motion.div
            key={etab.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.04 }}
          >
            <Box
              p="4"
              style={{
                background: "var(--color-background)",
                borderRadius: 12,
                border: `1px solid ${isSelected ? "var(--accent-8)" : "var(--gray-a4)"}`,
                transition: "all 0.15s ease",
                cursor: "default",
                boxShadow: isSelected ? "0 0 0 1px var(--accent-8)" : undefined,
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = "var(--gray-a6)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = "var(--gray-a4)";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            >
              {/* Header */}
              <Flex align="start" justify="between" mb="3">
                <Flex align="center" gap="2">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleOne(etab.id)}
                    size="2"
                  />
                  <StatutDot statut={etab.statut || "actif"} />
                  <Link
                    href={`/admin/etablissements/${etab.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <Text
                      weight="bold"
                      size="3"
                      style={{ color: "var(--gray-12)", cursor: "pointer" }}
                    >
                      {etab.nom}
                    </Text>
                  </Link>
                </Flex>

                <Flex align="center" gap="2">
                  <PlanBadge plan={etab.plan || "essentiel"} />
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
                        <DropdownMenu.Item onClick={() => onReactivate(etab)}>
                          <Play size={14} weight="bold" />
                          Réactiver
                        </DropdownMenu.Item>
                      ) : (
                        <DropdownMenu.Item color="amber" onClick={() => onSuspend(etab)}>
                          <Pause size={14} weight="bold" />
                          Suspendre
                        </DropdownMenu.Item>
                      )}
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item color="red" onClick={() => onDelete(etab)}>
                        <Trash size={14} weight="bold" />
                        Supprimer
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </Flex>
              </Flex>

              {/* Contact */}
              <Flex direction="column" gap="1" mb="3">
                <Text size="2" color="gray">
                  {etab.email || "Pas d'email"}
                </Text>
                <Text size="1" color="gray">
                  {etab.telephone || "Pas de téléphone"}
                </Text>
              </Flex>

              {/* Stats grid */}
              <Grid columns="2" gap="3" mb="3">
                <Flex align="center" gap="2">
                  <Users size={14} weight="duotone" style={{ color: "var(--blue-9)" }} />
                  <Text size="2">
                    <Text weight="bold">{etab.nbUtilisateurs}</Text>{" "}
                    <Text color="gray">utilisateurs</Text>
                  </Text>
                </Flex>
                <Flex align="center" gap="2">
                  <Package size={14} weight="duotone" style={{ color: "var(--orange-9)" }} />
                  <Text size="2">
                    <Text weight="bold">{etab.nbProduits}</Text>{" "}
                    <Text color="gray">produits</Text>
                  </Text>
                </Flex>
                <Flex align="center" gap="2">
                  <ShoppingCart size={14} weight="duotone" style={{ color: "var(--green-9)" }} />
                  <Text size="2">
                    <Text weight="bold">{etab.nbVentes}</Text>{" "}
                    <Text color="gray">ventes</Text>
                  </Text>
                </Flex>
                <Flex align="center" gap="2">
                  <CurrencyCircleDollar
                    size={14}
                    weight="duotone"
                    style={{ color: "var(--violet-9)" }}
                  />
                  <Text size="2" weight="bold">
                    {formatCurrency(etab.chiffreAffaires || 0)}
                  </Text>
                </Flex>
              </Grid>

              {/* Footer */}
              <Flex
                align="center"
                gap="1"
                pt="3"
                style={{ borderTop: "1px solid var(--gray-a3)" }}
              >
                <CalendarBlank size={12} weight="bold" style={{ color: "var(--gray-8)" }} />
                <Text size="1" color="gray">
                  Créé le {new Date(etab.createdAt).toLocaleDateString("fr-FR")}
                </Text>
              </Flex>
            </Box>
          </motion.div>
        );
      })}
    </Grid>
  );
}
