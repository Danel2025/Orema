"use server";

/**
 * Server Actions pour la gestion des établissements (SUPER_ADMIN uniquement)
 *
 * Permet de :
 * - Lister tous les établissements avec stats
 * - Rechercher / filtrer / paginer
 * - Créer, modifier, supprimer un établissement
 * - Suspendre / réactiver
 * - Détail complet avec stats enrichies
 * - Liste des utilisateurs d'un établissement
 * - Stats détaillées (CA, panier moyen, top produits, heures de pointe)
 */

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/lib/auth";
import {
  createEtablissementSchema,
  updateEtablissementSchema,
  suspendEtablissementSchema,
  etablissementFilterSchema,
  PLAN_QUOTAS,
  type CreateEtablissementFormData,
  type UpdateEtablissementFormData,
  type SuspendEtablissementInput,
  type EtablissementFilterData,
} from "@/schemas/admin-etablissement.schema";
import {
  searchAdminEtablissements,
  getAdminEtablissementDetailStats,
  getAdminEtablissementStatsDetaillees,
  getAdminEtablissementUsers,
  type AdminEtablissementWithStats,
  type EtablissementDetailStats,
  type EtablissementStatsDetaillees,
  type EtablissementUser,
} from "@/lib/db/queries/admin-etablissements";
import { logAdminAction } from "@/lib/db/queries/audit-logs";

type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
  fieldErrors?: Record<string, string[]>;
};

export interface EtablissementWithStats {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  createdAt: Date;
  nbUtilisateurs: number;
  nbProduits: number;
  nbVentes: number;
  nbClients: number;
}

/**
 * Récupérer tous les établissements avec leurs statistiques
 * Réservé au SUPER_ADMIN
 */
export async function getAllEtablissements(): Promise<ActionResult<EtablissementWithStats[]>> {
  try {
    await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    // Récupérer les établissements
    const { data: etablissements, error } = await supabase
      .from("etablissements")
      .select("id, nom, email, telephone, adresse, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur récupération établissements:", error);
      return { success: false, error: "Erreur lors de la récupération des établissements" };
    }

    // Récupérer les stats pour TOUS les établissements en 4 requêtes (au lieu de N*4)
    const etabIds = (etablissements || []).map((e) => e.id);

    const [allUsers, allProduits, allVentes, allClients] = await Promise.all([
      supabase
        .from("utilisateurs")
        .select("etablissement_id")
        .in("etablissement_id", etabIds),
      supabase
        .from("produits")
        .select("etablissement_id")
        .in("etablissement_id", etabIds),
      supabase
        .from("ventes")
        .select("etablissement_id")
        .in("etablissement_id", etabIds),
      supabase
        .from("clients")
        .select("etablissement_id")
        .in("etablissement_id", etabIds),
    ]);

    // Construire les compteurs par établissement
    const countBy = (rows: Array<{ etablissement_id: string }> | null) => {
      const map = new Map<string, number>();
      for (const row of rows ?? []) {
        map.set(row.etablissement_id, (map.get(row.etablissement_id) ?? 0) + 1);
      }
      return map;
    };

    const userCounts = countBy(allUsers.data);
    const produitCounts = countBy(allProduits.data);
    const venteCounts = countBy(allVentes.data);
    const clientCounts = countBy(allClients.data);

    const etablissementsWithStats: EtablissementWithStats[] = (etablissements || []).map((etab) => ({
      id: etab.id,
      nom: etab.nom,
      email: etab.email,
      telephone: etab.telephone,
      adresse: etab.adresse,
      createdAt: new Date(etab.created_at),
      nbUtilisateurs: userCounts.get(etab.id) ?? 0,
      nbProduits: produitCounts.get(etab.id) ?? 0,
      nbVentes: venteCounts.get(etab.id) ?? 0,
      nbClients: clientCounts.get(etab.id) ?? 0,
    }));

    return { success: true, data: etablissementsWithStats };
  } catch (error) {
    console.error("Erreur getAllEtablissements:", error);
    return { success: false, error: "Erreur lors de la récupération des établissements" };
  }
}

/**
 * Supprimer un établissement et TOUTES ses données liées
 * Cette action est IRRÉVERSIBLE
 *
 * Ordre de suppression (pour respecter les contraintes FK) :
 * 1. Utilisateurs Supabase Auth
 * 2. Toutes les tables liées à l'établissement
 * 3. L'établissement lui-même
 */
export async function deleteEtablissement(
  etablissementId: string,
  confirmationNom: string
): Promise<ActionResult<{ deletedCounts: Record<string, number> }>> {
  try {
    const session = await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    // 1. Vérifier que l'établissement existe
    const { data: etablissement, error: fetchError } = await supabase
      .from("etablissements")
      .select("id, nom")
      .eq("id", etablissementId)
      .single();

    if (fetchError || !etablissement) {
      return { success: false, error: "Établissement non trouvé" };
    }

    // 2. Vérifier la confirmation du nom
    if (etablissement.nom !== confirmationNom) {
      return {
        success: false,
        error: `Le nom de confirmation ne correspond pas. Attendu: "${etablissement.nom}"`,
      };
    }

    // 3. Empêcher la suppression de son propre établissement
    if (etablissementId === session.etablissementId) {
      return {
        success: false,
        error: "Vous ne pouvez pas supprimer votre propre établissement",
      };
    }

    const deletedCounts: Record<string, number> = {};

    // 4. Récupérer tous les utilisateurs de cet établissement pour les supprimer de Supabase Auth
    const { data: utilisateurs } = await supabase
      .from("utilisateurs")
      .select("id, email")
      .eq("etablissement_id", etablissementId);

    // 5. Supprimer les utilisateurs de Supabase Auth
    if (utilisateurs && utilisateurs.length > 0) {
      for (const user of utilisateurs) {
        try {
          await supabase.auth.admin.deleteUser(user.id);
        } catch (e) {
          console.warn(`Impossible de supprimer l'auth user ${user.email}:`, e);
        }
      }
      deletedCounts["utilisateurs_auth"] = utilisateurs.length;
    }

    // 6. Supprimer toutes les données liées (ordre important pour les FK)
    // Les tables avec ON DELETE CASCADE seront supprimées automatiquement
    // mais on le fait explicitement pour avoir les compteurs

    // Paiements mobile
    const { count: paiementsMobile } = await supabase
      .from("paiements_mobile")
      .delete({ count: "exact" })
      .eq("etablissement_id", etablissementId);
    deletedCounts["paiements_mobile"] = paiementsMobile || 0;

    // Logs SMS
    const { count: logsSms } = await supabase
      .from("logs_sms")
      .delete({ count: "exact" })
      .eq("etablissement_id", etablissementId);
    deletedCounts["logs_sms"] = logsSms || 0;

    // Rapports Z
    const { count: rapportsZ } = await supabase
      .from("rapports_z")
      .delete({ count: "exact" })
      .eq("etablissement_id", etablissementId);
    deletedCounts["rapports_z"] = rapportsZ || 0;

    // Sync keys
    const { count: syncKeys } = await supabase
      .from("sync_keys")
      .delete({ count: "exact" })
      .eq("etablissement_id", etablissementId);
    deletedCounts["sync_keys"] = syncKeys || 0;

    // Audit logs
    const { count: auditLogs } = await supabase
      .from("audit_logs")
      .delete({ count: "exact" })
      .eq("etablissement_id", etablissementId);
    deletedCounts["audit_logs"] = auditLogs || 0;

    // Ventes (supprime aussi lignes_vente, paiements, lignes_vente_supplements via CASCADE)
    const { count: ventes } = await supabase
      .from("ventes")
      .delete({ count: "exact" })
      .eq("etablissement_id", etablissementId);
    deletedCounts["ventes"] = ventes || 0;

    // Sessions caisse
    const { count: sessionsCaisse } = await supabase
      .from("sessions_caisse")
      .delete({ count: "exact" })
      .eq("etablissement_id", etablissementId);
    deletedCounts["sessions_caisse"] = sessionsCaisse || 0;

    // Clients
    const { count: clients } = await supabase
      .from("clients")
      .delete({ count: "exact" })
      .eq("etablissement_id", etablissementId);
    deletedCounts["clients"] = clients || 0;

    // Mouvements stock (via produits)
    // Les mouvements seront supprimés en cascade avec les produits

    // Produits (supprime aussi supplements_produits, mouvements_stock via CASCADE)
    const { count: produits } = await supabase
      .from("produits")
      .delete({ count: "exact" })
      .eq("etablissement_id", etablissementId);
    deletedCounts["produits"] = produits || 0;

    // Catégories
    const { count: categories } = await supabase
      .from("categories")
      .delete({ count: "exact" })
      .eq("etablissement_id", etablissementId);
    deletedCounts["categories"] = categories || 0;

    // Tables
    const { count: tables } = await supabase
      .from("tables")
      .delete({ count: "exact" })
      .eq("etablissement_id", etablissementId);
    deletedCounts["tables"] = tables || 0;

    // Zones
    const { count: zones } = await supabase
      .from("zones")
      .delete({ count: "exact" })
      .eq("etablissement_id", etablissementId);
    deletedCounts["zones"] = zones || 0;

    // Imprimantes
    const { count: imprimantes } = await supabase
      .from("imprimantes")
      .delete({ count: "exact" })
      .eq("etablissement_id", etablissementId);
    deletedCounts["imprimantes"] = imprimantes || 0;

    // Role permissions
    const { count: rolePermissions } = await supabase
      .from("role_permissions")
      .delete({ count: "exact" })
      .eq("etablissement_id", etablissementId);
    deletedCounts["role_permissions"] = rolePermissions || 0;

    // Sessions utilisateurs
    // D'abord récupérer les IDs des utilisateurs
    const userIds = utilisateurs?.map((u) => u.id) || [];
    if (userIds.length > 0) {
      const { count: sessions } = await supabase
        .from("sessions")
        .delete({ count: "exact" })
        .in("utilisateur_id", userIds);
      deletedCounts["sessions"] = sessions || 0;
    }

    // Utilisateurs
    const { count: utilisateursCount } = await supabase
      .from("utilisateurs")
      .delete({ count: "exact" })
      .eq("etablissement_id", etablissementId);
    deletedCounts["utilisateurs"] = utilisateursCount || 0;

    // 7. Enfin, supprimer l'établissement lui-même
    const { error: deleteError } = await supabase
      .from("etablissements")
      .delete()
      .eq("id", etablissementId);

    if (deleteError) {
      console.error("Erreur suppression établissement:", deleteError);
      return {
        success: false,
        error: `Erreur lors de la suppression: ${deleteError.message}`,
      };
    }

    deletedCounts["etablissement"] = 1;

    // 8. Log dans l'audit de l'établissement du SUPER_ADMIN
    if (session.etablissementId) {
      await supabase.from("audit_logs").insert({
        action: "DELETE",
        entite: "Établissement",
        entite_id: etablissementId,
        description: `Suppression complète de l'établissement "${etablissement.nom}" et de toutes ses données`,
        utilisateur_id: session.userId,
        etablissement_id: session.etablissementId,
        nouvelle_valeur: JSON.stringify(deletedCounts),
      });
    }

    revalidatePath("/admin/etablissements");

    return {
      success: true,
      data: { deletedCounts },
    };
  } catch (error) {
    console.error("Erreur deleteEtablissement:", error);
    return { success: false, error: "Erreur lors de la suppression de l'établissement" };
  }
}

// ============================================================================
// CRÉATION D'ÉTABLISSEMENT
// ============================================================================

/**
 * Créer un nouvel établissement avec validation complète
 * Réservé au SUPER_ADMIN
 */
export async function createEtablissement(
  input: CreateEtablissementFormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    // Validation
    const validated = createEtablissementSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: "Données invalides",
        fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Vérifier unicité du nom
    const { data: existing } = await supabase
      .from("etablissements")
      .select("id")
      .eq("nom", validated.data.nom)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "Un établissement avec ce nom existe déjà" };
    }

    // Quotas par défaut selon le plan
    const plan = validated.data.plan || "essentiel";
    const quotas = PLAN_QUOTAS[plan as keyof typeof PLAN_QUOTAS] ?? PLAN_QUOTAS.essentiel;

    // Créer l'établissement
    // Cast nécessaire car les colonnes statut/plan/max_* sont ajoutées par migration
    const insertData: Record<string, unknown> = {
      nom: validated.data.nom,
      adresse: validated.data.adresse ?? null,
      telephone: validated.data.telephone,
      email: validated.data.email ?? null,
      nif: validated.data.nif ?? null,
      rccm: validated.data.rccm ?? null,
      statut: "actif",
      plan,
      max_utilisateurs: quotas.max_utilisateurs,
      max_produits: quotas.max_produits,
      max_ventes_mois: quotas.max_ventes_mois,
    };

    const { data: etablissement, error } = await supabase
      .from("etablissements")
      .insert(insertData as never)
      .select("id")
      .single();

    if (error) {
      console.error("Erreur création établissement:", error);
      return { success: false, error: `Erreur: ${error.message}` };
    }

    // Log audit
    if (session.etablissementId) {
      await logAdminAction(supabase, {
        etablissement_id: session.etablissementId,
        utilisateur_id: session.userId,
        action: "CREATE",
        entite: "Établissement",
        entite_id: etablissement.id,
        description: `Création de l'établissement "${validated.data.nom}"`,
        nouvelle_valeur: validated.data,
      });
    }

    revalidatePath("/admin/etablissements");

    return { success: true, data: { id: etablissement.id } };
  } catch (error) {
    console.error("Erreur createEtablissement:", error);
    return { success: false, error: "Erreur lors de la création de l'établissement" };
  }
}

// ============================================================================
// MODIFICATION D'ÉTABLISSEMENT
// ============================================================================

/**
 * Modifier les informations d'un établissement
 * Réservé au SUPER_ADMIN
 */
export async function updateEtablissement(
  etablissementId: string,
  input: UpdateEtablissementFormData
): Promise<ActionResult> {
  try {
    const session = await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    // Validation
    const validated = updateEtablissementSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: "Données invalides",
        fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Vérifier que l'établissement existe
    const { data: existing } = await supabase
      .from("etablissements")
      .select("id, nom")
      .eq("id", etablissementId)
      .single();

    if (!existing) {
      return { success: false, error: "Établissement non trouvé" };
    }

    // Si le nom change, vérifier l'unicité
    if (validated.data.nom && validated.data.nom !== existing.nom) {
      const { data: duplicate } = await supabase
        .from("etablissements")
        .select("id")
        .eq("nom", validated.data.nom)
        .neq("id", etablissementId)
        .maybeSingle();

      if (duplicate) {
        return { success: false, error: "Un autre établissement porte déjà ce nom" };
      }
    }

    // Build update data (only defined fields)
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const [key, value] of Object.entries(validated.data)) {
      if (value !== undefined) {
        updateData[key] = value ?? null;
      }
    }

    const { error } = await supabase
      .from("etablissements")
      .update(updateData)
      .eq("id", etablissementId);

    if (error) {
      console.error("Erreur modification établissement:", error);
      return { success: false, error: `Erreur: ${error.message}` };
    }

    // Log audit
    if (session.etablissementId) {
      await logAdminAction(supabase, {
        etablissement_id: session.etablissementId,
        utilisateur_id: session.userId,
        action: "UPDATE",
        entite: "Établissement",
        entite_id: etablissementId,
        description: `Modification de l'établissement "${existing.nom}"`,
        ancienne_valeur: existing,
        nouvelle_valeur: validated.data,
      });
    }

    revalidatePath("/admin/etablissements");
    revalidatePath(`/admin/etablissements/${etablissementId}`);

    return { success: true };
  } catch (error) {
    console.error("Erreur updateEtablissement:", error);
    return { success: false, error: "Erreur lors de la modification" };
  }
}

// ============================================================================
// SUSPENSION / RÉACTIVATION
// ============================================================================

/**
 * Suspendre un établissement
 * Réservé au SUPER_ADMIN
 */
export async function suspendEtablissement(
  etablissementId: string,
  input: SuspendEtablissementInput
): Promise<ActionResult> {
  try {
    const session = await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    // Validation
    const validated = suspendEtablissementSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: "Données invalides",
        fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Vérifier que l'établissement existe et n'est pas déjà suspendu
    // Note: les colonnes statut/plan sont ajoutées par migration, cast nécessaire
    // tant que les types Supabase ne sont pas regénérés
    const { data: existingRaw } = await supabase
      .from("etablissements")
      .select("*")
      .eq("id", etablissementId)
      .single();

    if (!existingRaw) {
      return { success: false, error: "Établissement non trouvé" };
    }

    const existing = existingRaw as Record<string, unknown>;
    if (existing.statut === "suspendu") {
      return { success: false, error: "L'établissement est déjà suspendu" };
    }

    // Empêcher la suspension de son propre établissement
    if (etablissementId === session.etablissementId) {
      return { success: false, error: "Vous ne pouvez pas suspendre votre propre établissement" };
    }

    const suspendPayload: Record<string, unknown> = {
      statut: "suspendu",
      motif_suspension: validated.data.motif,
      date_suspension: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("etablissements")
      .update(suspendPayload as never)
      .eq("id", etablissementId);

    if (error) {
      return { success: false, error: `Erreur: ${error.message}` };
    }

    // Log audit
    if (session.etablissementId) {
      await logAdminAction(supabase, {
        etablissement_id: session.etablissementId,
        utilisateur_id: session.userId,
        action: "UPDATE",
        entite: "Établissement",
        entite_id: etablissementId,
        description: `Suspension de "${String(existing.nom)}" - Motif: ${validated.data.motif}`,
        ancienne_valeur: { statut: String(existing.statut) },
        nouvelle_valeur: { statut: "suspendu", motif: validated.data.motif },
      });
    }

    revalidatePath("/admin/etablissements");
    revalidatePath(`/admin/etablissements/${etablissementId}`);

    return { success: true };
  } catch (error) {
    console.error("Erreur suspendEtablissement:", error);
    return { success: false, error: "Erreur lors de la suspension" };
  }
}

/**
 * Réactiver un établissement suspendu
 * Réservé au SUPER_ADMIN
 */
export async function reactivateEtablissement(
  etablissementId: string
): Promise<ActionResult> {
  try {
    const session = await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    // Vérifier que l'établissement existe et est suspendu
    const { data: existingRaw } = await supabase
      .from("etablissements")
      .select("*")
      .eq("id", etablissementId)
      .single();

    if (!existingRaw) {
      return { success: false, error: "Établissement non trouvé" };
    }

    const existing = existingRaw as Record<string, unknown>;
    if (existing.statut !== "suspendu") {
      return { success: false, error: "L'établissement n'est pas suspendu" };
    }

    const reactivatePayload: Record<string, unknown> = {
      statut: "actif",
      motif_suspension: null,
      date_suspension: null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("etablissements")
      .update(reactivatePayload as never)
      .eq("id", etablissementId);

    if (error) {
      return { success: false, error: `Erreur: ${error.message}` };
    }

    // Log audit
    if (session.etablissementId) {
      await logAdminAction(supabase, {
        etablissement_id: session.etablissementId,
        utilisateur_id: session.userId,
        action: "UPDATE",
        entite: "Établissement",
        entite_id: etablissementId,
        description: `Réactivation de "${String(existing.nom)}"`,
        ancienne_valeur: { statut: "suspendu" },
        nouvelle_valeur: { statut: "actif" },
      });
    }

    revalidatePath("/admin/etablissements");
    revalidatePath(`/admin/etablissements/${etablissementId}`);

    return { success: true };
  } catch (error) {
    console.error("Erreur reactivateEtablissement:", error);
    return { success: false, error: "Erreur lors de la réactivation" };
  }
}

// ============================================================================
// DÉTAIL & STATS
// ============================================================================

/**
 * Détail complet d'un établissement avec stats enrichies
 * Réservé au SUPER_ADMIN
 */
export async function getEtablissementDetail(
  etablissementId: string
): Promise<ActionResult<{ etablissement: Record<string, unknown>; stats: EtablissementDetailStats }>> {
  try {
    await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    const { data: etablissement, error } = await supabase
      .from("etablissements")
      .select("*")
      .eq("id", etablissementId)
      .single();

    if (error || !etablissement) {
      return { success: false, error: "Établissement non trouvé" };
    }

    const stats = await getAdminEtablissementDetailStats(supabase, etablissementId);

    return {
      success: true,
      data: { etablissement, stats },
    };
  } catch (error) {
    console.error("Erreur getEtablissementDetail:", error);
    return { success: false, error: "Erreur lors de la récupération du détail" };
  }
}

/**
 * Stats détaillées (CA par jour, panier moyen, top produits, heures de pointe)
 * Réservé au SUPER_ADMIN
 */
export async function getEtablissementStats(
  etablissementId: string,
  periode?: { dateDebut: string; dateFin: string }
): Promise<ActionResult<EtablissementStatsDetaillees>> {
  try {
    await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    const stats = await getAdminEtablissementStatsDetaillees(
      supabase,
      etablissementId,
      periode
    );

    return { success: true, data: stats };
  } catch (error) {
    console.error("Erreur getEtablissementStats:", error);
    return { success: false, error: "Erreur lors de la récupération des statistiques" };
  }
}

/**
 * Liste des utilisateurs d'un établissement
 * Réservé au SUPER_ADMIN
 */
export async function getEtablissementUsers(
  etablissementId: string
): Promise<ActionResult<EtablissementUser[]>> {
  try {
    await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    const users = await getAdminEtablissementUsers(supabase, etablissementId);

    return { success: true, data: users };
  } catch (error) {
    console.error("Erreur getEtablissementUsers:", error);
    return { success: false, error: "Erreur lors de la récupération des utilisateurs" };
  }
}

/**
 * Recherche d'établissements avec filtres, tri et pagination
 * Réservé au SUPER_ADMIN
 */
export async function searchEtablissements(
  filters: EtablissementFilterData
): Promise<ActionResult<{ data: AdminEtablissementWithStats[]; count: number; page: number; totalPages: number }>> {
  try {
    await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    const validated = etablissementFilterSchema.safeParse(filters);
    if (!validated.success) {
      return { success: false, error: "Filtres invalides" };
    }

    const result = await searchAdminEtablissements(
      supabase,
      {
        query: validated.data.search,
        statut: validated.data.statut,
        plan: validated.data.plan,
        sortBy: validated.data.sortBy,
        sortOrder: validated.data.sortOrder,
      },
      {
        page: validated.data.page ?? 1,
        pageSize: validated.data.pageSize ?? 20,
      }
    );

    return {
      success: true,
      data: {
        data: result.data,
        count: result.count,
        page: result.page,
        totalPages: result.totalPages,
      },
    };
  } catch (error) {
    console.error("Erreur searchEtablissements:", error);
    return { success: false, error: "Erreur lors de la recherche" };
  }
}

/**
 * Récupérer uniquement le nom d'un établissement par son ID
 * Plus léger que getAllEtablissements() ou getEtablissementDetail()
 * Réservé au SUPER_ADMIN
 */
export async function getEtablissementName(
  etablissementId: string
): Promise<ActionResult<{ nom: string }>> {
  try {
    await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("etablissements")
      .select("nom")
      .eq("id", etablissementId)
      .single();

    if (error || !data) {
      return { success: false, error: "Établissement non trouvé" };
    }

    return { success: true, data: { nom: data.nom } };
  } catch (error) {
    console.error("Erreur getEtablissementName:", error);
    return { success: false, error: "Erreur lors de la récupération du nom" };
  }
}
