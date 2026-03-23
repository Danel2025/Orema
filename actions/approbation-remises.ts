// @ts-nocheck — Tables pas encore dans types/supabase.ts (migrations non appliquées). Supprimer après `pnpm db:types`.
"use server";

/**
 * Server Actions pour le système d'approbation des remises
 * Gère les demandes, approbations et refus de remises dépassant les seuils
 */

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  approbationRemiseSchema,
  reponseApprobationSchema,
  type ApprobationRemiseInput,
  type ReponseApprobationInput,
} from "@/schemas/tarification.schema";
import type { ActionResult } from "@/lib/action-types";
import type { ApprobationRemiseRow } from "@/lib/tarification/types";
import { createAuditLog } from "@/actions/audit";

// ============================================================================
// DEMANDE D'APPROBATION
// ============================================================================

/**
 * Crée une demande d'approbation de remise
 * Appelée quand un caissier/serveur tente une remise au-dessus de son seuil
 */
export async function demanderApprobationRemise(
  data: ApprobationRemiseInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) {
      return { success: false, error: "Vous devez être connecté" };
    }

    const validated = approbationRemiseSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Données invalides",
      };
    }

    const supabase = createServiceClient();

    const { data: inserted, error } = await supabase
      .from("approbations_remise")
      .insert({
        demandeur_id: user.userId,
        montant_remise: validated.data.montantRemise,
        pourcentage_remise: validated.data.pourcentageRemise,
        montant_vente: validated.data.montantVente,
        commentaire: validated.data.commentaire ?? null,
        statut: "en_attente",
        etablissement_id: user.etablissementId,
      })
      .select("id")
      .single();

    if (error) throw error;

    await createAuditLog({
      action: "CREATE",
      entite: "approbations_remise",
      entiteId: inserted.id,
      description: `Demande d'approbation de remise: ${validated.data.pourcentageRemise}% (${validated.data.montantRemise} FCFA)`,
      nouvelleValeur: validated.data as unknown as Record<string, unknown>,
      utilisateurId: user.userId,
      etablissementId: user.etablissementId,
    });

    revalidatePath("/caisse");
    return { success: true, data: { id: inserted.id } };
  } catch (error) {
    console.error("[demanderApprobationRemise] Erreur:", error);
    return { success: false, error: "Erreur lors de la demande d'approbation" };
  }
}

// ============================================================================
// TRAITEMENT APPROBATION
// ============================================================================

/**
 * Approuve ou refuse une demande de remise
 * Réservé aux ADMIN, MANAGER, SUPER_ADMIN
 */
export async function traiterApprobation(
  data: ReponseApprobationInput
): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) {
      return { success: false, error: "Vous devez être connecté" };
    }

    const rolesApprobateurs = ["SUPER_ADMIN", "ADMIN", "MANAGER"];
    if (!rolesApprobateurs.includes(user.role)) {
      return { success: false, error: "Seuls les managers et administrateurs peuvent approuver les remises" };
    }

    const validated = reponseApprobationSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Données invalides",
      };
    }

    const supabase = createServiceClient();

    // Vérifier que la demande existe et est en attente
    const { data: demande, error: fetchError } = await supabase
      .from("approbations_remise")
      .select("*")
      .eq("id", validated.data.approbationId)
      .eq("etablissement_id", user.etablissementId)
      .eq("statut", "en_attente")
      .single();

    if (fetchError || !demande) {
      return { success: false, error: "Demande d'approbation non trouvée ou déjà traitée" };
    }

    // Un utilisateur ne peut pas approuver sa propre demande
    if (demande.demandeur_id === user.userId) {
      return { success: false, error: "Vous ne pouvez pas approuver votre propre demande" };
    }

    const { error } = await supabase
      .from("approbations_remise")
      .update({
        statut: validated.data.statut,
        approbateur_id: user.userId,
        commentaire_reponse: validated.data.commentaire ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", validated.data.approbationId)
      .eq("etablissement_id", user.etablissementId);

    if (error) throw error;

    const action = validated.data.statut === "approuvee" ? "approuvée" : "refusée";

    await createAuditLog({
      action: "UPDATE",
      entite: "approbations_remise",
      entiteId: validated.data.approbationId,
      description: `Remise ${action}: ${demande.pourcentage_remise}% (${demande.montant_remise} FCFA)`,
      ancienneValeur: { statut: "en_attente" },
      nouvelleValeur: {
        statut: validated.data.statut,
        approbateur_id: user.userId,
        commentaire: validated.data.commentaire,
      },
      utilisateurId: user.userId,
      etablissementId: user.etablissementId,
    });

    revalidatePath("/caisse");
    revalidatePath("/parametres");
    return { success: true };
  } catch (error) {
    console.error("[traiterApprobation] Erreur:", error);
    return { success: false, error: "Erreur lors du traitement de l'approbation" };
  }
}

// ============================================================================
// CONSULTATION
// ============================================================================

/**
 * Récupère les approbations en attente pour l'établissement courant
 */
export async function getApprobationsPendantesAction(): Promise<
  ActionResult<ApprobationRemiseRow[]>
> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) {
      return { success: false, error: "Vous devez être connecté" };
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("approbations_remise")
      .select("*")
      .eq("etablissement_id", user.etablissementId)
      .eq("statut", "en_attente")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { success: true, data: data as ApprobationRemiseRow[] };
  } catch (error) {
    console.error("[getApprobationsPendantesAction] Erreur:", error);
    return { success: false, error: "Erreur lors du chargement des approbations" };
  }
}

/**
 * Récupère l'historique des approbations avec pagination
 */
export async function getApprobationsHistoriqueAction(
  page: number = 1,
  limit: number = 20
): Promise<
  ActionResult<{ data: ApprobationRemiseRow[]; total: number }>
> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) {
      return { success: false, error: "Vous devez être connecté" };
    }

    const offset = (page - 1) * limit;
    const supabase = createServiceClient();

    const { data, error, count } = await supabase
      .from("approbations_remise")
      .select("*", { count: "exact" })
      .eq("etablissement_id", user.etablissementId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      success: true,
      data: {
        data: data as ApprobationRemiseRow[],
        total: count ?? 0,
      },
    };
  } catch (error) {
    console.error("[getApprobationsHistoriqueAction] Erreur:", error);
    return { success: false, error: "Erreur lors du chargement de l'historique" };
  }
}
