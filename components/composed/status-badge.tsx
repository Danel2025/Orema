/**
 * StatusBadge - Badge pour afficher des statuts
 * Variantes prédéfinies pour les statuts courants du POS
 */

import { Badge } from "@/components/ui";
import type { ComponentPropsWithoutRef } from "react";

export type StatusType =
  | "active"
  | "inactive"
  | "pending"
  | "success"
  | "error"
  | "warning"
  | "occupied"
  | "free"
  | "in-preparation"
  | "bill-requested"
  | "needs-cleaning";

interface StatusBadgeProps extends Omit<ComponentPropsWithoutRef<typeof Badge>, "color" | "variant"> {
  status: StatusType;
}

const statusConfig: Record<StatusType, { color: ComponentPropsWithoutRef<typeof Badge>["color"]; label: string }> = {
  active: { color: "green", label: "Actif" },
  inactive: { color: "gray", label: "Inactif" },
  pending: { color: "amber", label: "En attente" },
  success: { color: "green", label: "Succès" },
  error: { color: "red", label: "Erreur" },
  warning: { color: "violet", label: "Attention" },
  occupied: { color: "amber", label: "Occupée" },
  free: { color: "green", label: "Libre" },
  "in-preparation": { color: "blue", label: "En préparation" },
  "bill-requested": { color: "violet", label: "Addition demandée" },
  "needs-cleaning": { color: "red", label: "À nettoyer" },
};

export function StatusBadge({ status, children, ...props }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge color={config.color} variant="soft" {...props}>
      {children || config.label}
    </Badge>
  );
}
