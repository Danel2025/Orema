/**
 * Types pour les composants admin des établissements
 */

import type { EtablissementWithStats } from "@/actions/admin/etablissements";

/**
 * Extension du type existant avec les champs supplémentaires
 * provenant des nouvelles actions backend (statut, plan, CA)
 */
export interface EtablissementWithStatsExtended extends EtablissementWithStats {
  statut?: string;
  plan?: string;
  chiffreAffaires?: number;
  nif?: string | null;
  rccm?: string | null;
}

/**
 * Vue (cards ou table)
 */
export type ViewMode = "table" | "cards";
