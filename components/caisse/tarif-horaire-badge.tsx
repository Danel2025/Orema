"use client";

/**
 * TarifHoraireBadge - Badge affiché sur les produits dont le prix est ajusté par un tarif horaire
 */

import { Badge, Tooltip } from "@radix-ui/themes";
import { Clock } from "@phosphor-icons/react";
import { formatCurrency } from "@/lib/utils";

interface TarifHoraireBadgeProps {
  prixOriginal: number;
  prixAjuste: number;
  nomTarif: string;
}

export function TarifHoraireBadge({
  prixOriginal,
  prixAjuste,
  nomTarif,
}: TarifHoraireBadgeProps) {
  const isReduction = prixAjuste < prixOriginal;

  return (
    <Tooltip content={nomTarif}>
      <Badge
        color={isReduction ? "blue" : "violet"}
        variant="soft"
        size="1"
        style={{ cursor: "default", display: "inline-flex", alignItems: "center", gap: 4 }}
      >
        <Clock size={12} weight="bold" />
        <span
          style={{
            textDecoration: "line-through",
            opacity: 0.7,
            fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
          }}
        >
          {formatCurrency(prixOriginal)}
        </span>
        <span
          style={{
            fontWeight: 600,
            fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
          }}
        >
          {formatCurrency(prixAjuste)}
        </span>
      </Badge>
    </Tooltip>
  );
}
