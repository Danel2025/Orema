"use client";

import { Badge, Flex, Text } from "@radix-ui/themes";
import { STATUT_TABLE_COLORS, STATUT_TABLE_LABELS, StatutTable } from "@/schemas/table.schema";

interface StatusLegendProps {
  compact?: boolean;
}

/**
 * Styles inline pour chaque statut de table.
 * Utilisation de styles inline car les classes CSS personnalisées
 * peuvent ne pas être chargées correctement avec Tailwind v4.
 */
const STATUS_STYLES: Record<
  keyof typeof StatutTable,
  { bg: string; border: string; darkBg: string }
> = {
  LIBRE: { bg: "#dcfce7", border: "#22c55e", darkBg: "#052e16" },
  OCCUPEE: { bg: "#fef9c3", border: "#eab308", darkBg: "#422006" },
  EN_PREPARATION: { bg: "#dbeafe", border: "#3b82f6", darkBg: "#172554" },
  ADDITION: { bg: "#ffedd5", border: "#f97316", darkBg: "#431407" },
  A_NETTOYER: { bg: "#fee2e2", border: "#ef4444", darkBg: "#450a0a" },
};

export function StatusLegend({ compact = false }: StatusLegendProps) {
  const statuts = Object.keys(StatutTable) as (keyof typeof StatutTable)[];

  if (compact) {
    return (
      <Flex gap="2" wrap="wrap">
        {statuts.map((statut) => (
          <Badge
            key={statut}
            color={STATUT_TABLE_COLORS[statut] as "green" | "yellow" | "blue" | "orange" | "red"}
            variant="soft"
            size="1"
          >
            {STATUT_TABLE_LABELS[statut]}
          </Badge>
        ))}
      </Flex>
    );
  }

  return (
    <Flex gap="4" wrap="wrap" align="center">
      {statuts.map((statut) => {
        const style = STATUS_STYLES[statut];
        return (
          <Flex key={statut} align="center" gap="2">
            <div
              className="h-4 w-4 shrink-0 rounded"
              style={{
                backgroundColor: style.bg,
                border: `2px solid ${style.border}`,
              }}
            />
            <Text size="2" color="gray">
              {STATUT_TABLE_LABELS[statut]}
            </Text>
          </Flex>
        );
      })}
    </Flex>
  );
}
