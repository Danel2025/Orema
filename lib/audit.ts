/**
 * Systeme de logs d'audit
 *
 * @security Fonctionnalites:
 * - Logging de toutes les actions sensibles
 * - Stockage des anciennes/nouvelles valeurs
 * - Capture de l'adresse IP et User-Agent
 * - Non-repudiation des actions
 */

import { type ActionAudit, ACTION_AUDIT } from "@/lib/db/types";
import { headers } from "next/headers";

/**
 * Type pour les donnees d'audit
 */
export interface AuditData {
  action: ActionAudit;
  entite: string;
  entiteId?: string;
  description?: string;
  ancienneValeur?: Record<string, unknown>;
  nouvelleValeur?: Record<string, unknown>;
  utilisateurId?: string;
  etablissementId: string;
  adresseIp?: string;
  userAgent?: string;
}

/**
 * Type pour le contexte de la requete
 */
export interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Recupere le contexte de la requete (IP, User-Agent)
 * Fonctionne dans les Server Components et Server Actions
 */
export async function getRequestContext(): Promise<RequestContext> {
  try {
    const headersList = await headers();

    // L'IP peut etre dans differents headers selon le proxy/load balancer
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
      headersList.get("x-real-ip") ||
      headersList.get("cf-connecting-ip") || // Cloudflare
      "unknown";

    const userAgent = headersList.get("user-agent") || "unknown";

    return {
      ipAddress,
      userAgent,
    };
  } catch {
    // En dehors d'une requete HTTP (cron jobs, etc.)
    return {
      ipAddress: "system",
      userAgent: "system",
    };
  }
}

/**
 * Prepare les donnees pour l'audit en supprimant les champs sensibles
 */
export function sanitizeForAudit<T extends Record<string, unknown>>(
  data: T,
  sensitiveFields: string[] = ["password", "pinCode", "token", "secret"]
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveFields.includes(key)) {
      sanitized[key] = "[REDACTED]";
    } else if (value instanceof Date) {
      sanitized[key] = value.toISOString();
    } else if (typeof value === "object" && value !== null) {
      // Recursif pour les objets imbriques
      sanitized[key] = sanitizeForAudit(value as Record<string, unknown>, sensitiveFields);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Calcule les differences entre deux objets (pour audit UPDATE)
 */
export function getDifferences(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>
): { ancien: Record<string, unknown>; nouveau: Record<string, unknown> } {
  const ancien: Record<string, unknown> = {};
  const nouveau: Record<string, unknown> = {};

  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

  for (const key of allKeys) {
    const oldValue = oldData[key];
    const newValue = newData[key];

    // Comparer les valeurs
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      ancien[key] = oldValue;
      nouveau[key] = newValue;
    }
  }

  return { ancien, nouveau };
}

/**
 * Descriptions humaines des actions d'audit
 */
export const ACTION_DESCRIPTIONS: Record<ActionAudit, string> = {
  CREATE: "Creation",
  UPDATE: "Modification",
  DELETE: "Suppression",
  LOGIN: "Connexion",
  LOGOUT: "Déconnexion",
  CAISSE_OUVERTURE: "Ouverture de caisse",
  CAISSE_CLOTURE: "Cloture de caisse",
  ANNULATION_VENTE: "Annulation de vente",
  REMISE_APPLIQUEE: "Remise appliquee",
};

/**
 * Formatte un log d'audit pour l'affichage
 */
export function formatAuditLog(log: {
  action: ActionAudit;
  entite: string;
  description?: string | null;
  createdAt: Date;
}): string {
  const actionText = ACTION_DESCRIPTIONS[log.action] || log.action;
  const dateText = new Intl.DateTimeFormat("fr-GA", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Africa/Libreville",
  }).format(log.createdAt);

  return `${dateText} - ${actionText} ${log.entite}${log.description ? `: ${log.description}` : ""}`;
}

/**
 * Categories d'actions pour le filtrage
 */
export const AUDIT_CATEGORIES = {
  AUTH: ["LOGIN", "LOGOUT"] as ActionAudit[],
  CAISSE: [
    "CAISSE_OUVERTURE",
    "CAISSE_CLOTURE",
    "ANNULATION_VENTE",
    "REMISE_APPLIQUEE",
  ] as ActionAudit[],
  DATA: ["CREATE", "UPDATE", "DELETE"] as ActionAudit[],
} as const;

/**
 * Verifie si une action est sensible (necessite une attention particuliere)
 */
export function isSensitiveAction(action: ActionAudit): boolean {
  const sensitiveActions: ActionAudit[] = ["DELETE", "ANNULATION_VENTE", "REMISE_APPLIQUEE"];
  return sensitiveActions.includes(action);
}

/**
 * Type pour les statistiques d'audit
 */
export interface AuditStats {
  totalLogs: number;
  byAction: Record<ActionAudit, number>;
  byEntite: Record<string, number>;
  sensitiveActionsCount: number;
}

/**
 * Calcule les statistiques d'audit
 */
export function calculateAuditStats(
  logs: Array<{ action: ActionAudit; entite: string }>
): AuditStats {
  const byAction = {} as Record<ActionAudit, number>;
  const byEntite = {} as Record<string, number>;
  let sensitiveActionsCount = 0;

  for (const log of logs) {
    // Compter par action
    byAction[log.action] = (byAction[log.action] || 0) + 1;

    // Compter par entite
    byEntite[log.entite] = (byEntite[log.entite] || 0) + 1;

    // Compter les actions sensibles
    if (isSensitiveAction(log.action)) {
      sensitiveActionsCount++;
    }
  }

  return {
    totalLogs: logs.length,
    byAction,
    byEntite,
    sensitiveActionsCount,
  };
}
