"use server";

/**
 * Server Actions pour les logs d'audit des établissements (SUPER_ADMIN)
 */

import { createServiceClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/lib/auth";
import {
  getAdminAuditLogs,
  getAdminAuditStats,
  type AdminAuditLog,
  type AuditStatsResult,
} from "@/lib/db/queries/audit-logs";
import type { PaginatedResult } from "@/lib/db/types";

type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Récupère les logs d'audit d'un établissement avec filtres et pagination
 */
export async function getAuditLogs(
  etablissementId: string,
  filters?: {
    action?: string;
    entite?: string;
    utilisateur_id?: string;
    dateDebut?: string;
    dateFin?: string;
  },
  pagination?: { page?: number; pageSize?: number }
): Promise<ActionResult<PaginatedResult<AdminAuditLog>>> {
  try {
    await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    const result = await getAdminAuditLogs(supabase, etablissementId, filters, pagination);

    return { success: true, data: result };
  } catch (error) {
    console.error("Erreur getAuditLogs:", error);
    return { success: false, error: "Erreur lors de la récupération des logs d'audit" };
  }
}

/**
 * Récupère les statistiques d'audit d'un établissement
 */
export async function getAuditStats(
  etablissementId: string,
  dateDebut?: string,
  dateFin?: string
): Promise<ActionResult<AuditStatsResult>> {
  try {
    await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    const stats = await getAdminAuditStats(supabase, etablissementId, dateDebut, dateFin);

    return { success: true, data: stats };
  } catch (error) {
    console.error("Erreur getAuditStats:", error);
    return { success: false, error: "Erreur lors de la récupération des stats d'audit" };
  }
}
