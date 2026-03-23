/**
 * Requêtes Supabase pour les audit_logs (contexte admin SUPER_ADMIN)
 * Séparé de audit.ts qui gère les logs d'un établissement spécifique
 */

import type { DbClient } from "../client";
import type { PaginationOptions, PaginatedResult } from "../types";
import { getPaginationParams, createPaginatedResult, getErrorMessage } from "../utils";

// ============================================================================
// TYPES
// ============================================================================

export interface AdminAuditLog {
  id: string;
  action: string;
  entite: string;
  entite_id: string | null;
  description: string | null;
  utilisateur_id: string | null;
  etablissement_id: string;
  ancienne_valeur: string | null;
  nouvelle_valeur: string | null;
  adresse_ip: string | null;
  created_at: string;
  utilisateur_nom?: string;
  utilisateur_prenom?: string;
}

export interface AuditStatsResult {
  actions_par_type: Record<string, number>;
  activite_par_jour: Array<{ date: string; count: number }>;
  total: number;
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Récupère les logs d'audit paginés pour un établissement (admin)
 */
export async function getAdminAuditLogs(
  client: DbClient,
  etablissementId: string,
  filters?: {
    action?: string;
    entite?: string;
    utilisateur_id?: string;
    dateDebut?: string;
    dateFin?: string;
  },
  pagination?: PaginationOptions
): Promise<PaginatedResult<AdminAuditLog>> {
  const { offset, limit, page, pageSize } = getPaginationParams(pagination);

  let query = client
    .from("audit_logs")
    .select(
      "id, action, entite, entite_id, description, utilisateur_id, etablissement_id, ancienne_valeur, nouvelle_valeur, adresse_ip, created_at",
      { count: "exact" }
    )
    .eq("etablissement_id", etablissementId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters?.action) {
    query = query.eq("action", filters.action);
  }

  if (filters?.entite) {
    query = query.eq("entite", filters.entite);
  }

  if (filters?.utilisateur_id) {
    query = query.eq("utilisateur_id", filters.utilisateur_id);
  }

  if (filters?.dateDebut) {
    query = query.gte("created_at", filters.dateDebut);
  }

  if (filters?.dateFin) {
    query = query.lte("created_at", filters.dateFin);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  // Enrichir avec les noms des utilisateurs
  const logs = data ?? [];
  const userIds = [...new Set(logs.filter((l) => l.utilisateur_id).map((l) => l.utilisateur_id!))];

  const userMap = new Map<string, { nom: string; prenom: string }>();
  if (userIds.length > 0) {
    const { data: users } = await client
      .from("utilisateurs")
      .select("id, nom, prenom")
      .in("id", userIds);

    for (const u of users ?? []) {
      userMap.set(u.id, { nom: u.nom, prenom: u.prenom });
    }
  }

  const enriched: AdminAuditLog[] = logs.map((log) => ({
    ...log,
    utilisateur_nom: log.utilisateur_id ? userMap.get(log.utilisateur_id)?.nom : undefined,
    utilisateur_prenom: log.utilisateur_id ? userMap.get(log.utilisateur_id)?.prenom : undefined,
  }));

  return createPaginatedResult(enriched, count ?? 0, { page, pageSize });
}

/**
 * Stats d'audit pour un établissement (nb par type d'action, activité par jour)
 */
export async function getAdminAuditStats(
  client: DbClient,
  etablissementId: string,
  dateDebut?: string,
  dateFin?: string
): Promise<AuditStatsResult> {
  // Récupérer le total global
  let totalQuery = client
    .from("audit_logs")
    .select("id", { count: "exact", head: true })
    .eq("etablissement_id", etablissementId);

  if (dateDebut) {
    totalQuery = totalQuery.gte("created_at", dateDebut);
  }
  if (dateFin) {
    totalQuery = totalQuery.lte("created_at", dateFin);
  }

  const { count: totalCount, error: totalError } = await totalQuery;

  if (totalError) {
    throw new Error(getErrorMessage(totalError));
  }

  // Récupérer uniquement action et created_at avec une limite raisonnable
  // pour calculer les stats sans exploser la mémoire
  let query = client
    .from("audit_logs")
    .select("action, created_at")
    .eq("etablissement_id", etablissementId)
    .limit(10000);

  if (dateDebut) {
    query = query.gte("created_at", dateDebut);
  }

  if (dateFin) {
    query = query.lte("created_at", dateFin);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  const logs = data ?? [];

  // Actions par type
  const actions_par_type: Record<string, number> = {};
  for (const log of logs) {
    actions_par_type[log.action] = (actions_par_type[log.action] ?? 0) + 1;
  }

  // Activité par jour
  const jourMap = new Map<string, number>();
  for (const log of logs) {
    const date = log.created_at.slice(0, 10);
    jourMap.set(date, (jourMap.get(date) ?? 0) + 1);
  }
  const activite_par_jour = Array.from(jourMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    actions_par_type,
    activite_par_jour,
    total: totalCount ?? logs.length,
  };
}

/**
 * Enregistre une action d'audit admin
 */
export async function logAdminAction(
  client: DbClient,
  params: {
    etablissement_id: string;
    utilisateur_id: string;
    action: string;
    entite: string;
    entite_id?: string;
    description?: string;
    ancienne_valeur?: unknown;
    nouvelle_valeur?: unknown;
  }
): Promise<void> {
  const { error } = await client.from("audit_logs").insert({
    etablissement_id: params.etablissement_id,
    utilisateur_id: params.utilisateur_id,
    action: params.action,
    entite: params.entite,
    entite_id: params.entite_id,
    description: params.description,
    ancienne_valeur: params.ancienne_valeur
      ? JSON.stringify(params.ancienne_valeur)
      : null,
    nouvelle_valeur: params.nouvelle_valeur
      ? JSON.stringify(params.nouvelle_valeur)
      : null,
  });

  if (error) {
    console.error("[logAdminAction] Erreur:", error);
  }
}
