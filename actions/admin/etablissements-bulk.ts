"use server";

/**
 * Server Actions pour les opérations en masse sur les établissements (SUPER_ADMIN)
 */

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/lib/auth";
import {
  bulkSettingsSchema,
  bulkSuspendSchema,
  bulkReactivateSchema,
  type BulkSettingsInput,
  type BulkSuspendInput,
  type BulkReactivateInput,
} from "@/schemas/admin-etablissement.schema";
import { logAdminAction } from "@/lib/db/queries/audit-logs";

type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Appliquer des paramètres à plusieurs établissements
 */
export async function bulkUpdateSettings(
  input: BulkSettingsInput
): Promise<ActionResult<{ updated: number; failed: string[] }>> {
  try {
    const session = await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    // Validation
    const validated = bulkSettingsSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: "Données invalides" };
    }

    const { etablissement_ids, settings } = validated.data;

    // Empêcher de modifier son propre établissement dans un batch
    const filteredIds = etablissement_ids.filter((id) => id !== session.etablissementId);

    // Construire l'objet de mise à jour
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    for (const [key, value] of Object.entries(settings)) {
      if (value !== undefined) {
        updateData[key] = value;
      }
    }

    let updated = 0;
    const failed: string[] = [];

    // Une seule requête au lieu de N requêtes séquentielles
    const { error } = await supabase
      .from("etablissements")
      .update(updateData as never)
      .in("id", filteredIds);

    if (error) {
      // En cas d'erreur globale, on marque tout comme failed
      failed.push(...filteredIds);
      console.error("Erreur bulk update:", error);
    } else {
      updated = filteredIds.length;
    }

    // Log audit
    if (session.etablissementId) {
      await logAdminAction(supabase, {
        etablissement_id: session.etablissementId,
        utilisateur_id: session.userId,
        action: "UPDATE",
        entite: "Établissement",
        description: `Mise à jour en masse de ${updated} établissements`,
        nouvelle_valeur: { settings, ids: filteredIds, updated, failed },
      });
    }

    revalidatePath("/admin/etablissements");

    return { success: true, data: { updated, failed } };
  } catch (error) {
    console.error("Erreur bulkUpdateSettings:", error);
    return { success: false, error: "Erreur lors de la mise à jour en masse" };
  }
}

/**
 * Suspendre plusieurs établissements
 */
export async function bulkSuspend(
  input: BulkSuspendInput
): Promise<ActionResult<{ suspended: number; failed: string[] }>> {
  try {
    const session = await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    // Validation
    const validated = bulkSuspendSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: "Données invalides" };
    }

    const { etablissement_ids, motif } = validated.data;

    // Exclure son propre établissement
    const filteredIds = etablissement_ids.filter((id) => id !== session.etablissementId);

    let suspended = 0;
    const failed: string[] = [];

    const bulkSuspendPayload: Record<string, unknown> = {
      statut: "suspendu",
      motif_suspension: motif,
      date_suspension: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Une seule requête au lieu de N requêtes séquentielles
    const { error } = await supabase
      .from("etablissements")
      .update(bulkSuspendPayload as never)
      .in("id", filteredIds);

    if (error) {
      failed.push(...filteredIds);
      console.error("Erreur bulk suspend:", error);
    } else {
      suspended = filteredIds.length;
    }

    // Log audit
    if (session.etablissementId) {
      await logAdminAction(supabase, {
        etablissement_id: session.etablissementId,
        utilisateur_id: session.userId,
        action: "UPDATE",
        entite: "Établissement",
        description: `Suspension en masse de ${suspended} établissements - Motif: ${motif}`,
        nouvelle_valeur: { motif, ids: filteredIds, suspended, failed },
      });
    }

    revalidatePath("/admin/etablissements");

    return { success: true, data: { suspended, failed } };
  } catch (error) {
    console.error("Erreur bulkSuspend:", error);
    return { success: false, error: "Erreur lors de la suspension en masse" };
  }
}

/**
 * Réactiver plusieurs établissements
 */
export async function bulkReactivate(
  input: BulkReactivateInput
): Promise<ActionResult<{ reactivated: number; failed: string[] }>> {
  try {
    const session = await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    // Validation
    const validated = bulkReactivateSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: "Données invalides" };
    }

    const { etablissement_ids } = validated.data;

    let reactivated = 0;
    const failed: string[] = [];

    const bulkReactivatePayload: Record<string, unknown> = {
      statut: "actif",
      motif_suspension: null,
      date_suspension: null,
      updated_at: new Date().toISOString(),
    };

    // Une seule requête au lieu de N requêtes séquentielles
    const { error } = await supabase
      .from("etablissements")
      .update(bulkReactivatePayload as never)
      .in("id", etablissement_ids);

    if (error) {
      failed.push(...etablissement_ids);
      console.error("Erreur bulk reactivate:", error);
    } else {
      reactivated = etablissement_ids.length;
    }

    // Log audit
    if (session.etablissementId) {
      await logAdminAction(supabase, {
        etablissement_id: session.etablissementId,
        utilisateur_id: session.userId,
        action: "UPDATE",
        entite: "Établissement",
        description: `Réactivation en masse de ${reactivated} établissements`,
        nouvelle_valeur: { ids: etablissement_ids, reactivated, failed },
      });
    }

    revalidatePath("/admin/etablissements");

    return { success: true, data: { reactivated, failed } };
  } catch (error) {
    console.error("Erreur bulkReactivate:", error);
    return { success: false, error: "Erreur lors de la réactivation en masse" };
  }
}
