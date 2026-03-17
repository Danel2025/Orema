/**
 * Utilitaires pour les couleurs Radix UI
 * Mapping des couleurs Radix pour les composants
 */

import type { ComponentPropsWithoutRef } from "react";
import type { Badge } from "@radix-ui/themes";

export type RadixColor = ComponentPropsWithoutRef<typeof Badge>["color"];

/**
 * Couleurs par type de statut
 */
export const statusColors = {
  success: "green",
  error: "red",
  warning: "violet",
  info: "blue",
  pending: "amber",
  active: "green",
  inactive: "gray",
} as const;

/**
 * Couleurs pour les catégories de produits
 */
export const categoryColors = [
  "violet",
  "blue",
  "green",
  "purple",
  "red",
  "amber",
  "cyan",
  "pink",
  "teal",
  "indigo",
] as const;

/**
 * Couleurs pour les statistiques
 */
export const chartColors = {
  primary: "var(--violet-9)",
  secondary: "var(--blue-9)",
  tertiary: "var(--green-9)",
  quaternary: "var(--purple-9)",
  grid: "var(--gray-5)",
  text: "var(--gray-11)",
} as const;

/**
 * Obtient une couleur Radix CSS variable
 */
export function getRadixColor(color: string, scale: number = 9): string {
  return `var(--${color}-${scale})`;
}

/**
 * Mapping des couleurs de table (statut)
 */
export const tableStatusColors = {
  free: "green",
  occupied: "amber",
  "in-preparation": "blue",
  "bill-requested": "orange",
  "needs-cleaning": "red",
} as const;
