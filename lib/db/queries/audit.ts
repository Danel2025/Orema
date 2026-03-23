/**
 * Requêtes Supabase pour les logs d'audit
 */

import type { DbClient } from "../client";
import type {
  AuditLog,
  AuditLogInsert,
  ActionAudit,
  PaginationOptions,
  PaginatedResult,
} from "../types";
import { getPaginationParams, createPaginatedResult, getErrorMessage } from "../utils";

/**
 * Récupère les logs d'audit d'un établissement
 */
export async function getAuditLogs(
  client: DbClient,
  etablissementId: string,
  options?: {
    action?: ActionAudit;
    utilisateurId?: string;
    entite?: string;
    entiteId?: string;
    dateDebut?: string;
    dateFin?: string;
  }
): Promise<AuditLog[]> {
  let query = client
    .from("audit_logs")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .order("created_at", { ascending: false });

  if (options?.action) {
    query = query.eq("action", options.action);
  }

  if (options?.utilisateurId) {
    query = query.eq("utilisateur_id", options.utilisateurId);
  }

  if (options?.entite) {
    query = query.eq("entite", options.entite);
  }

  if (options?.entiteId) {
    query = query.eq("entite_id", options.entiteId);
  }

  if (options?.dateDebut) {
    query = query.gte("created_at", options.dateDebut);
  }

  if (options?.dateFin) {
    query = query.lte("created_at", options.dateFin);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return data ?? [];
}

/**
 * Récupère les logs d'audit paginés
 */
export async function getAuditLogsPaginated(
  client: DbClient,
  etablissementId: string,
  options?: PaginationOptions & {
    action?: ActionAudit;
    utilisateurId?: string;
    entite?: string;
    dateDebut?: string;
    dateFin?: string;
  }
): Promise<PaginatedResult<AuditLog>> {
  const { offset, limit, page, pageSize } = getPaginationParams(options);

  let query = client
    .from("audit_logs")
    .select("*", { count: "exact" })
    .eq("etablissement_id", etablissementId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (options?.action) {
    query = query.eq("action", options.action);
  }

  if (options?.utilisateurId) {
    query = query.eq("utilisateur_id", options.utilisateurId);
  }

  if (options?.entite) {
    query = query.eq("entite", options.entite);
  }

  if (options?.dateDebut) {
    query = query.gte("created_at", options.dateDebut);
  }

  if (options?.dateFin) {
    query = query.lte("created_at", options.dateFin);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return createPaginatedResult((data ?? []) as AuditLog[], count ?? 0, { page, pageSize });
}

/**
 * Crée un log d'audit
 */
export async function createAuditLog(client: DbClient, data: AuditLogInsert): Promise<AuditLog> {
  const { data: log, error } = await client.from("audit_logs").insert(data).select().single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return log;
}

/**
 * Enregistre une action d'audit
 */
export async function logAuditAction(
  client: DbClient,
  etablissementId: string,
  action: ActionAudit,
  entite: string,
  options?: {
    utilisateurId?: string;
    entiteId?: string;
    description?: string;
    ancienneValeur?: unknown;
    nouvelleValeur?: unknown;
    adresseIp?: string;
  }
): Promise<AuditLog> {
  return createAuditLog(client, {
    etablissement_id: etablissementId,
    action,
    entite,
    utilisateur_id: options?.utilisateurId,
    entite_id: options?.entiteId,
    description: options?.description,
    ancienne_valeur: options?.ancienneValeur ? JSON.stringify(options.ancienneValeur) : null,
    nouvelle_valeur: options?.nouvelleValeur ? JSON.stringify(options.nouvelleValeur) : null,
    adresse_ip: options?.adresseIp,
  });
}

/**
 * Enregistre un login
 */
export async function logLogin(
  client: DbClient,
  etablissementId: string,
  utilisateurId: string,
  adresseIp?: string
): Promise<AuditLog> {
  return logAuditAction(client, etablissementId, "LOGIN", "utilisateur", {
    utilisateurId,
    entiteId: utilisateurId,
    description: "Connexion réussie",
    adresseIp,
  });
}

/**
 * Enregistre un logout
 */
export async function logLogout(
  client: DbClient,
  etablissementId: string,
  utilisateurId: string,
  adresseIp?: string
): Promise<AuditLog> {
  return logAuditAction(client, etablissementId, "LOGOUT", "utilisateur", {
    utilisateurId,
    entiteId: utilisateurId,
    description: "Déconnexion",
    adresseIp,
  });
}

/**
 * Enregistre une ouverture de caisse
 */
export async function logCaisseOuverture(
  client: DbClient,
  etablissementId: string,
  utilisateurId: string,
  sessionCaisseId: string,
  fondCaisse: number
): Promise<AuditLog> {
  return logAuditAction(client, etablissementId, "CAISSE_OUVERTURE", "session_caisse", {
    utilisateurId,
    entiteId: sessionCaisseId,
    description: `Ouverture de caisse avec fond de ${fondCaisse} FCFA`,
    nouvelleValeur: { fond_caisse: fondCaisse },
  });
}

/**
 * Enregistre une clôture de caisse
 */
export async function logCaisseCloture(
  client: DbClient,
  etablissementId: string,
  utilisateurId: string,
  sessionCaisseId: string,
  totaux: {
    totalVentes: number;
    totalEspeces: number;
    especesComptees: number;
    ecart: number;
  }
): Promise<AuditLog> {
  return logAuditAction(client, etablissementId, "CAISSE_CLOTURE", "session_caisse", {
    utilisateurId,
    entiteId: sessionCaisseId,
    description: `Clôture de caisse - Total: ${totaux.totalVentes} FCFA, Écart: ${totaux.ecart} FCFA`,
    nouvelleValeur: totaux,
  });
}

/**
 * Enregistre une annulation de vente
 */
export async function logAnnulationVente(
  client: DbClient,
  etablissementId: string,
  utilisateurId: string,
  venteId: string,
  motif?: string
): Promise<AuditLog> {
  return logAuditAction(client, etablissementId, "ANNULATION_VENTE", "vente", {
    utilisateurId,
    entiteId: venteId,
    description: motif ?? "Annulation de vente",
  });
}

/**
 * Enregistre une remise appliquée
 */
export async function logRemiseAppliquee(
  client: DbClient,
  etablissementId: string,
  utilisateurId: string,
  venteId: string,
  remise: { type: "POURCENTAGE" | "MONTANT_FIXE"; valeur: number; montant: number }
): Promise<AuditLog> {
  const description =
    remise.type === "POURCENTAGE"
      ? `Remise de ${remise.valeur}% appliquée (${remise.montant} FCFA)`
      : `Remise de ${remise.montant} FCFA appliquée`;

  return logAuditAction(client, etablissementId, "REMISE_APPLIQUEE", "vente", {
    utilisateurId,
    entiteId: venteId,
    description,
    nouvelleValeur: remise,
  });
}

/**
 * Compte les logs par action
 */
export async function countAuditLogsByAction(
  client: DbClient,
  etablissementId: string,
  dateDebut?: string,
  dateFin?: string
): Promise<Record<ActionAudit, number>> {
  let query = client.from("audit_logs").select("action").eq("etablissement_id", etablissementId);

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

  const counts: Record<ActionAudit, number> = {
    CREATE: 0,
    UPDATE: 0,
    DELETE: 0,
    LOGIN: 0,
    LOGOUT: 0,
    CAISSE_OUVERTURE: 0,
    CAISSE_CLOTURE: 0,
    ANNULATION_VENTE: 0,
    REMISE_APPLIQUEE: 0,
  };

  for (const log of data ?? []) {
    counts[log.action as ActionAudit]++;
  }

  return counts;
}
