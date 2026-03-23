"use server";

/**
 * Server Actions pour les logs d'audit
 * Migré de Prisma vers Supabase
 *
 * @security Protection CSRF automatique via Server Actions de Next.js
 * Toutes les mutations passent par des Server Actions
 */

import { createServiceClient, db } from "@/lib/db";
import type { ActionAudit } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { getRequestContext, sanitizeForAudit, getDifferences, type AuditData } from "@/lib/audit";

type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Cree une entree d'audit
 * Fonction interne utilisee par les autres Server Actions
 */
export async function createAuditLog(data: AuditData): Promise<void> {
  try {
    const context = await getRequestContext();
    const supabase = createServiceClient();

    await db.createAuditLog(supabase, {
      action: data.action as ActionAudit,
      entite: data.entite,
      entite_id: data.entiteId,
      description: data.description,
      ancienne_valeur: data.ancienneValeur
        ? JSON.stringify(sanitizeForAudit(data.ancienneValeur))
        : null,
      nouvelle_valeur: data.nouvelleValeur
        ? JSON.stringify(sanitizeForAudit(data.nouvelleValeur))
        : null,
      utilisateur_id: data.utilisateurId,
      etablissement_id: data.etablissementId,
      adresse_ip: data.adresseIp || context.ipAddress,
    });
  } catch (error) {
    // Ne pas faire echouer l'operation principale si l'audit echoue
    // Mais logger l'erreur pour investigation
    console.error("[Audit] Erreur creation log:", error);
  }
}

/**
 * Logue une action CREATE avec les nouvelles valeurs
 */
export async function logCreate<T extends Record<string, unknown>>(
  entite: string,
  entiteId: string,
  newData: T,
  session: { userId: string; etablissementId: string },
  description?: string
): Promise<void> {
  await createAuditLog({
    action: "CREATE",
    entite,
    entiteId,
    description,
    nouvelleValeur: newData,
    utilisateurId: session.userId,
    etablissementId: session.etablissementId,
  });
}

/**
 * Logue une action UPDATE avec les differences
 */
export async function logUpdate<T extends Record<string, unknown>>(
  entite: string,
  entiteId: string,
  oldData: T,
  newData: T,
  session: { userId: string; etablissementId: string },
  description?: string
): Promise<void> {
  const { ancien, nouveau } = getDifferences(oldData, newData);

  // Ne logger que s'il y a des changements
  if (Object.keys(ancien).length === 0) return;

  await createAuditLog({
    action: "UPDATE",
    entite,
    entiteId,
    description,
    ancienneValeur: ancien,
    nouvelleValeur: nouveau,
    utilisateurId: session.userId,
    etablissementId: session.etablissementId,
  });
}

/**
 * Logue une action DELETE avec les anciennes valeurs
 */
export async function logDelete<T extends Record<string, unknown>>(
  entite: string,
  entiteId: string,
  oldData: T,
  session: { userId: string; etablissementId: string },
  description?: string
): Promise<void> {
  await createAuditLog({
    action: "DELETE",
    entite,
    entiteId,
    description,
    ancienneValeur: oldData,
    utilisateurId: session.userId,
    etablissementId: session.etablissementId,
  });
}

/**
 * Logue une ouverture de caisse
 */
export async function logCaisseOuverture(
  sessionCaisseId: string,
  fondCaisse: number,
  session: { userId: string; etablissementId: string }
): Promise<void> {
  await createAuditLog({
    action: "CAISSE_OUVERTURE",
    entite: "SessionCaisse",
    entiteId: sessionCaisseId,
    description: `Ouverture caisse avec fond de ${fondCaisse} FCFA`,
    nouvelleValeur: { fondCaisse },
    utilisateurId: session.userId,
    etablissementId: session.etablissementId,
  });
}

/**
 * Logue une cloture de caisse
 */
export async function logCaisseCloture(
  sessionCaisseId: string,
  data: {
    totalVentes: number;
    especesComptees: number;
    ecart: number;
  },
  session: { userId: string; etablissementId: string }
): Promise<void> {
  await createAuditLog({
    action: "CAISSE_CLOTURE",
    entite: "SessionCaisse",
    entiteId: sessionCaisseId,
    description: `Cloture caisse - Total: ${data.totalVentes} FCFA, Ecart: ${data.ecart} FCFA`,
    nouvelleValeur: data,
    utilisateurId: session.userId,
    etablissementId: session.etablissementId,
  });
}

/**
 * Logue une annulation de vente
 */
export async function logAnnulationVente(
  venteId: string,
  numeroTicket: string,
  montant: number,
  motif: string,
  session: { userId: string; etablissementId: string }
): Promise<void> {
  await createAuditLog({
    action: "ANNULATION_VENTE",
    entite: "Vente",
    entiteId: venteId,
    description: `Annulation ticket ${numeroTicket} (${montant} FCFA) - Motif: ${motif}`,
    ancienneValeur: { numeroTicket, montant, statut: "PAYEE" },
    nouvelleValeur: { statut: "ANNULEE", motif },
    utilisateurId: session.userId,
    etablissementId: session.etablissementId,
  });
}

/**
 * Logue une remise appliquee
 */
export async function logRemiseAppliquee(
  venteId: string,
  data: {
    typeRemise: "POURCENTAGE" | "MONTANT_FIXE";
    valeurRemise: number;
    montantRemise: number;
    motif?: string;
  },
  session: { userId: string; etablissementId: string }
): Promise<void> {
  const description =
    data.typeRemise === "POURCENTAGE"
      ? `Remise de ${data.valeurRemise}% appliquee (${data.montantRemise} FCFA)`
      : `Remise de ${data.valeurRemise} FCFA appliquee`;

  await createAuditLog({
    action: "REMISE_APPLIQUEE",
    entite: "Vente",
    entiteId: venteId,
    description: data.motif ? `${description} - ${data.motif}` : description,
    nouvelleValeur: data,
    utilisateurId: session.userId,
    etablissementId: session.etablissementId,
  });
}

/**
 * Recupere les logs d'audit avec filtres
 */
export async function getAuditLogs(filters: {
  etablissementId?: string;
  action?: ActionAudit;
  entite?: string;
  utilisateurId?: string;
  dateDebut?: Date;
  dateFin?: Date;
  page?: number;
  limit?: number;
}): Promise<
  ActionResult<{
    logs: Array<{
      id: string;
      action: ActionAudit;
      entite: string;
      entiteId: string | null;
      description: string | null;
      ancienneValeur: string | null;
      nouvelleValeur: string | null;
      adresseIp: string | null;
      createdAt: Date;
      utilisateur: {
        nom: string;
        prenom: string;
        email: string;
      } | null;
    }>;
    total: number;
    page: number;
    totalPages: number;
  }>
> {
  try {
    // Verifier les permissions
    const session = await requireAuth();
    if (!session.etablissementId) return { success: false, error: "Aucun établissement associé" };
    requirePermission(session.role, "audit:lire");

    const supabase = createServiceClient();
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 50, 100); // Max 100 par page
    const offset = (page - 1) * limit;

    // Construire la requête
    let query = supabase
      .from("audit_logs")
      .select("*, utilisateurs(nom, prenom, email)", { count: "exact" })
      .eq("etablissement_id", session.etablissementId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.action) {
      query = query.eq("action", filters.action);
    }

    if (filters.entite) {
      query = query.eq("entite", filters.entite);
    }

    if (filters.utilisateurId) {
      query = query.eq("utilisateur_id", filters.utilisateurId);
    }

    if (filters.dateDebut) {
      query = query.gte("created_at", filters.dateDebut.toISOString());
    }

    if (filters.dateFin) {
      query = query.lte("created_at", filters.dateFin.toISOString());
    }

    const { data: logs, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const total = count ?? 0;

    return {
      success: true,
      data: {
        logs: (logs ?? []).map((log) => ({
          id: log.id,
          action: log.action as ActionAudit,
          entite: log.entite,
          entiteId: log.entite_id,
          description: log.description,
          ancienneValeur: log.ancienne_valeur,
          nouvelleValeur: log.nouvelle_valeur,
          adresseIp: log.adresse_ip,
          createdAt: new Date(log.created_at),
          utilisateur: log.utilisateurs,
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("[Audit] Erreur recuperation logs:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la recuperation des logs",
    };
  }
}

/**
 * Exporte les logs d'audit en JSON
 */
export async function exportAuditLogs(filters: {
  dateDebut?: Date;
  dateFin?: Date;
}): Promise<ActionResult<string>> {
  try {
    // Verifier les permissions
    const session = await requireAuth();
    if (!session.etablissementId) return { success: false, error: "Aucun établissement associé" };
    requirePermission(session.role, "audit:exporter");

    const supabase = createServiceClient();

    let query = supabase
      .from("audit_logs")
      .select("*, utilisateurs(nom, prenom, email)")
      .eq("etablissement_id", session.etablissementId)
      .order("created_at", { ascending: false });

    if (filters.dateDebut) {
      query = query.gte("created_at", filters.dateDebut.toISOString());
    }

    if (filters.dateFin) {
      query = query.lte("created_at", filters.dateFin.toISOString());
    }

    const { data: logs, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Logger l'export lui-meme
    await createAuditLog({
      action: "CREATE",
      entite: "ExportAudit",
      description: `Export de ${logs?.length ?? 0} logs d'audit`,
      utilisateurId: session.userId,
      etablissementId: session.etablissementId,
    });

    return {
      success: true,
      data: JSON.stringify(logs, null, 2),
    };
  } catch (error) {
    console.error("[Audit] Erreur export logs:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de l'export",
    };
  }
}

/**
 * Recupere les statistiques d'audit pour le tableau de bord
 */
export async function getAuditStats(periode: "jour" | "semaine" | "mois" = "jour"): Promise<
  ActionResult<{
    totalActions: number;
    connexions: number;
    modifications: number;
    suppressions: number;
    actionsSensibles: number;
    parUtilisateur: Array<{
      nom: string;
      prenom: string;
      count: number;
    }>;
  }>
> {
  try {
    const session = await requireAuth();
    if (!session.etablissementId) return { success: false, error: "Aucun établissement associé" };
    requirePermission(session.role, "audit:lire");

    const supabase = createServiceClient();

    // Calculer la date de debut selon la periode
    const now = new Date();
    let dateDebut: Date;
    switch (periode) {
      case "semaine":
        dateDebut = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "mois":
        dateDebut = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateDebut = new Date(now.setHours(0, 0, 0, 0));
    }

    const dateDebutISO = dateDebut.toISOString();

    // Récupérer tous les logs pour la période
    const { data: allLogs, error } = await supabase
      .from("audit_logs")
      .select("action, utilisateur_id")
      .eq("etablissement_id", session.etablissementId)
      .gte("created_at", dateDebutISO);

    if (error) {
      throw new Error(error.message);
    }

    const logs = allLogs ?? [];

    // Calculer les statistiques
    const totalActions = logs.length;
    const connexions = logs.filter((l) => l.action === "LOGIN").length;
    const modifications = logs.filter((l) => l.action === "UPDATE").length;
    const suppressions = logs.filter((l) => l.action === "DELETE").length;
    const annulations = logs.filter((l) => l.action === "ANNULATION_VENTE").length;
    const remises = logs.filter((l) => l.action === "REMISE_APPLIQUEE").length;

    // Grouper par utilisateur
    const userCounts = new Map<string, number>();
    for (const log of logs) {
      if (log.utilisateur_id) {
        userCounts.set(log.utilisateur_id, (userCounts.get(log.utilisateur_id) ?? 0) + 1);
      }
    }

    // Trier par count et prendre les 10 premiers
    const topUsers = [...userCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

    // Récupérer les noms des utilisateurs
    const userIds = topUsers.map(([id]) => id);
    let utilisateurs: Array<{ id: string; nom: string; prenom: string }> = [];

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("utilisateurs")
        .select("id, nom, prenom")
        .in("id", userIds);

      utilisateurs = users ?? [];
    }

    const utilisateurMap = new Map(utilisateurs.map((u) => [u.id, u]));

    return {
      success: true,
      data: {
        totalActions,
        connexions,
        modifications,
        suppressions,
        actionsSensibles: annulations + remises + suppressions,
        parUtilisateur: topUsers.map(([userId, count]) => {
          const utilisateur = utilisateurMap.get(userId);
          return {
            nom: utilisateur?.nom || "Inconnu",
            prenom: utilisateur?.prenom || "",
            count,
          };
        }),
      },
    };
  } catch (error) {
    console.error("[Audit] Erreur statistiques:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors du calcul des statistiques",
    };
  }
}
