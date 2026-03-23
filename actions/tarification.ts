// @ts-nocheck — Tables pas encore dans types/supabase.ts (migrations non appliquées). Supprimer après `pnpm db:types`.
"use server";

/**
 * Server Actions pour la gestion de la tarification
 * Règles de remise par rôle, tarifs horaires, configuration globale, historique prix
 */

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  saveReglesSchema,
  tarifHoraireSchema,
  configTarificationSchema,
  type SaveReglesInput,
  type TarifHoraireInput,
  type ConfigTarification,
} from "@/schemas/tarification.schema";
import type { ActionResult } from "@/lib/action-types";
import type {
  RegleTarificationRow,
  TarifHoraireRow,
  HistoriquePrixRow,
  ConfigTarificationRow,
} from "@/lib/tarification/types";
import { createAuditLog } from "@/actions/audit";

// ============================================================================
// HELPERS
// ============================================================================

const ROLES_ADMIN = ["SUPER_ADMIN", "ADMIN"] as const;

function isAdmin(role: string): boolean {
  return (ROLES_ADMIN as readonly string[]).includes(role);
}

// ============================================================================
// REGLES DE TARIFICATION
// ============================================================================

/**
 * Sauvegarde les règles de tarification par rôle (upsert)
 */
export async function saveReglesTarification(
  data: SaveReglesInput
): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) {
      return { success: false, error: "Vous devez être connecté" };
    }
    if (!isAdmin(user.role)) {
      return { success: false, error: "Seuls les administrateurs peuvent modifier les règles de tarification" };
    }

    const validated = saveReglesSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Données invalides",
        fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const supabase = createServiceClient();
    const etablissementId = user.etablissementId;

    // Upsert chaque règle
    for (const regle of validated.data.regles) {
      const { error } = await supabase
        .from("regles_tarification")
        .upsert(
          {
            role: regle.role,
            remise_max_pourcent: regle.remiseMaxPourcent,
            peut_modifier_prix: regle.peutModifierPrix,
            peut_appliquer_remise: regle.peutAppliquerRemise,
            plafond_remise_transaction: regle.plafondRemiseTransaction,
            necessite_approbation_au_dela: regle.necessiteApprobationAuDela,
            etablissement_id: etablissementId,
          },
          { onConflict: "etablissement_id,role" }
        );

      if (error) {
        console.error("[saveReglesTarification] Erreur upsert:", error);
        throw error;
      }
    }

    // Audit log
    await createAuditLog({
      action: "UPDATE",
      entite: "regles_tarification",
      description: `Mise à jour des règles de tarification (${validated.data.regles.length} règles)`,
      nouvelleValeur: { regles: validated.data.regles },
      utilisateurId: user.userId,
      etablissementId,
    });

    revalidatePath("/parametres");
    return { success: true };
  } catch (error) {
    console.error("[saveReglesTarification] Erreur:", error);
    return { success: false, error: "Erreur lors de la sauvegarde des règles" };
  }
}

/**
 * Récupère les règles de tarification d'un établissement
 */
export async function getReglesTarificationAction(): Promise<
  ActionResult<RegleTarificationRow[]>
> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) {
      return { success: false, error: "Vous devez être connecté" };
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("regles_tarification")
      .select("*")
      .eq("etablissement_id", user.etablissementId)
      .order("role");

    if (error) throw error;

    return { success: true, data: data as RegleTarificationRow[] };
  } catch (error) {
    console.error("[getReglesTarificationAction] Erreur:", error);
    return { success: false, error: "Erreur lors du chargement des règles" };
  }
}

/**
 * Supprime une règle de tarification pour un rôle
 */
export async function deleteRegleAction(
  role: string
): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) {
      return { success: false, error: "Vous devez être connecté" };
    }
    if (!isAdmin(user.role)) {
      return { success: false, error: "Permissions insuffisantes" };
    }

    const supabase = createServiceClient();

    const { error } = await supabase
      .from("regles_tarification")
      .delete()
      .eq("etablissement_id", user.etablissementId)
      .eq("role", role);

    if (error) throw error;

    await createAuditLog({
      action: "DELETE",
      entite: "regles_tarification",
      description: `Suppression de la règle de tarification pour le rôle ${role}`,
      utilisateurId: user.userId,
      etablissementId: user.etablissementId,
    });

    revalidatePath("/parametres");
    return { success: true };
  } catch (error) {
    console.error("[deleteRegleAction] Erreur:", error);
    return { success: false, error: "Erreur lors de la suppression" };
  }
}

// ============================================================================
// HISTORIQUE DES PRIX
// ============================================================================

/**
 * Récupère l'historique des changements de prix
 */
export async function getHistoriquePrixAction(filters?: {
  produitId?: string;
  page?: number;
  limit?: number;
}): Promise<
  ActionResult<{ data: HistoriquePrixRow[]; total: number }>
> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) {
      return { success: false, error: "Vous devez être connecté" };
    }

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const offset = (page - 1) * limit;

    const supabase = createServiceClient();

    let query = supabase
      .from("historique_prix")
      .select("*", { count: "exact" })
      .eq("etablissement_id", user.etablissementId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters?.produitId) {
      query = query.eq("produit_id", filters.produitId);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      success: true,
      data: {
        data: data as HistoriquePrixRow[],
        total: count ?? 0,
      },
    };
  } catch (error) {
    console.error("[getHistoriquePrixAction] Erreur:", error);
    return { success: false, error: "Erreur lors du chargement de l'historique" };
  }
}

// ============================================================================
// TARIFS HORAIRES
// ============================================================================

/**
 * Récupère tous les tarifs horaires de l'établissement
 */
export async function getTarifsHorairesAction(): Promise<
  ActionResult<TarifHoraireRow[]>
> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) {
      return { success: false, error: "Vous devez être connecté" };
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("tarifs_horaires")
      .select("*")
      .eq("etablissement_id", user.etablissementId)
      .order("priorite", { ascending: false });

    if (error) throw error;

    return { success: true, data: data as TarifHoraireRow[] };
  } catch (error) {
    console.error("[getTarifsHorairesAction] Erreur:", error);
    return { success: false, error: "Erreur lors du chargement des tarifs" };
  }
}

/**
 * Crée un nouveau tarif horaire
 */
export async function saveTarifHoraire(
  data: TarifHoraireInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) {
      return { success: false, error: "Vous devez être connecté" };
    }
    if (!isAdmin(user.role)) {
      return { success: false, error: "Permissions insuffisantes" };
    }

    const validated = tarifHoraireSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Données invalides",
        fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const supabase = createServiceClient();

    const { data: inserted, error } = await supabase
      .from("tarifs_horaires")
      .insert({
        nom: validated.data.nom,
        heure_debut: validated.data.heureDebut,
        heure_fin: validated.data.heureFin,
        jours_semaine: validated.data.joursSemaine,
        type_ajustement: validated.data.typeAjustement,
        valeur_ajustement: validated.data.valeurAjustement,
        categorie_id: validated.data.categorieId,
        actif: validated.data.actif,
        priorite: validated.data.priorite,
        etablissement_id: user.etablissementId,
      })
      .select("id")
      .single();

    if (error) throw error;

    await createAuditLog({
      action: "CREATE",
      entite: "tarifs_horaires",
      entiteId: inserted.id,
      description: `Création du tarif horaire "${validated.data.nom}"`,
      nouvelleValeur: validated.data as unknown as Record<string, unknown>,
      utilisateurId: user.userId,
      etablissementId: user.etablissementId,
    });

    revalidatePath("/parametres");
    return { success: true, data: { id: inserted.id } };
  } catch (error) {
    console.error("[saveTarifHoraire] Erreur:", error);
    return { success: false, error: "Erreur lors de la création du tarif" };
  }
}

/**
 * Met à jour un tarif horaire existant
 */
export async function updateTarifHoraireAction(
  id: string,
  data: TarifHoraireInput
): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) {
      return { success: false, error: "Vous devez être connecté" };
    }
    if (!isAdmin(user.role)) {
      return { success: false, error: "Permissions insuffisantes" };
    }

    const validated = tarifHoraireSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Données invalides",
        fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const supabase = createServiceClient();

    // Vérifier que le tarif appartient à l'établissement
    const { data: existing, error: fetchError } = await supabase
      .from("tarifs_horaires")
      .select("id")
      .eq("id", id)
      .eq("etablissement_id", user.etablissementId)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: "Tarif horaire non trouvé" };
    }

    const { error } = await supabase
      .from("tarifs_horaires")
      .update({
        nom: validated.data.nom,
        heure_debut: validated.data.heureDebut,
        heure_fin: validated.data.heureFin,
        jours_semaine: validated.data.joursSemaine,
        type_ajustement: validated.data.typeAjustement,
        valeur_ajustement: validated.data.valeurAjustement,
        categorie_id: validated.data.categorieId,
        actif: validated.data.actif,
        priorite: validated.data.priorite,
      })
      .eq("id", id)
      .eq("etablissement_id", user.etablissementId);

    if (error) throw error;

    await createAuditLog({
      action: "UPDATE",
      entite: "tarifs_horaires",
      entiteId: id,
      description: `Mise à jour du tarif horaire "${validated.data.nom}"`,
      nouvelleValeur: validated.data as unknown as Record<string, unknown>,
      utilisateurId: user.userId,
      etablissementId: user.etablissementId,
    });

    revalidatePath("/parametres");
    return { success: true };
  } catch (error) {
    console.error("[updateTarifHoraireAction] Erreur:", error);
    return { success: false, error: "Erreur lors de la mise à jour du tarif" };
  }
}

/**
 * Supprime un tarif horaire
 */
export async function deleteTarifHoraireAction(
  id: string
): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) {
      return { success: false, error: "Vous devez être connecté" };
    }
    if (!isAdmin(user.role)) {
      return { success: false, error: "Permissions insuffisantes" };
    }

    const supabase = createServiceClient();

    // Vérifier l'existence et récupérer le nom pour l'audit
    const { data: existing, error: fetchError } = await supabase
      .from("tarifs_horaires")
      .select("id, nom")
      .eq("id", id)
      .eq("etablissement_id", user.etablissementId)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: "Tarif horaire non trouvé" };
    }

    const { error } = await supabase
      .from("tarifs_horaires")
      .delete()
      .eq("id", id)
      .eq("etablissement_id", user.etablissementId);

    if (error) throw error;

    await createAuditLog({
      action: "DELETE",
      entite: "tarifs_horaires",
      entiteId: id,
      description: `Suppression du tarif horaire "${existing.nom}"`,
      utilisateurId: user.userId,
      etablissementId: user.etablissementId,
    });

    revalidatePath("/parametres");
    return { success: true };
  } catch (error) {
    console.error("[deleteTarifHoraireAction] Erreur:", error);
    return { success: false, error: "Erreur lors de la suppression du tarif" };
  }
}

// ============================================================================
// CONFIGURATION GLOBALE TARIFICATION
// ============================================================================

/**
 * Récupère la configuration de tarification de l'établissement
 */
export async function getConfigTarificationAction(): Promise<
  ActionResult<ConfigTarificationRow>
> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) {
      return { success: false, error: "Vous devez être connecté" };
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("etablissements")
      .select(
        "protection_marge_active, marge_minimum_globale, approbation_remise_active, tarifs_horaires_actifs"
      )
      .eq("id", user.etablissementId)
      .single();

    if (error) throw error;

    return {
      success: true,
      data: data as ConfigTarificationRow,
    };
  } catch (error) {
    console.error("[getConfigTarificationAction] Erreur:", error);
    return { success: false, error: "Erreur lors du chargement de la configuration" };
  }
}

/**
 * Met à jour la configuration globale de tarification
 */
export async function updateConfigTarificationAction(
  data: ConfigTarification
): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) {
      return { success: false, error: "Vous devez être connecté" };
    }
    if (!isAdmin(user.role)) {
      return { success: false, error: "Permissions insuffisantes" };
    }

    const validated = configTarificationSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Données invalides",
        fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const supabase = createServiceClient();

    const { error } = await supabase
      .from("etablissements")
      .update({
        protection_marge_active: validated.data.protectionMargeActive,
        marge_minimum_globale: validated.data.margeMinimumGlobale,
        approbation_remise_active: validated.data.approbationRemiseActive,
        tarifs_horaires_actifs: validated.data.tarifsHorairesActifs,
      })
      .eq("id", user.etablissementId);

    if (error) throw error;

    await createAuditLog({
      action: "UPDATE",
      entite: "config_tarification",
      description: "Mise à jour de la configuration de tarification",
      nouvelleValeur: validated.data as unknown as Record<string, unknown>,
      utilisateurId: user.userId,
      etablissementId: user.etablissementId,
    });

    revalidatePath("/parametres");
    return { success: true };
  } catch (error) {
    console.error("[updateConfigTarificationAction] Erreur:", error);
    return { success: false, error: "Erreur lors de la mise à jour de la configuration" };
  }
}
