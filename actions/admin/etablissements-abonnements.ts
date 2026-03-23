"use server";

/**
 * Server Actions pour la gestion des abonnements (SUPER_ADMIN)
 */

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/lib/auth";
import {
  updateAbonnementSchema,
  PLAN_QUOTAS,
  type UpdateAbonnementInput,
} from "@/schemas/admin-etablissement.schema";
import {
  getAbonnement as getAbonnementQuery,
  getAbonnementFull as getAbonnementFullQuery,
  getEtablissementPayments as getEtablissementPaymentsQuery,
  updateAbonnement as updateAbonnementQuery,
  checkQuotas as checkQuotasQuery,
  getAbonnementHistory as getAbonnementHistoryQuery,
  type AbonnementInfo,
  type AbonnementFullInfo,
  type QuotaUsage,
  type AbonnementHistoryEntry,
} from "@/lib/db/queries/abonnements";
import type { PaymentInfo } from "@/components/admin/etablissements/shared/types";
import { logAdminAction } from "@/lib/db/queries/audit-logs";
import type { ActionResult } from "@/lib/action-types";

/**
 * Récupère l'abonnement actif d'un établissement
 */
export async function getAbonnement(
  etablissementId: string
): Promise<ActionResult<AbonnementInfo>> {
  try {
    await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    const abonnement = await getAbonnementQuery(supabase, etablissementId);
    if (!abonnement) {
      return { success: false, error: "Établissement non trouvé" };
    }

    return { success: true, data: abonnement };
  } catch (error) {
    console.error("Erreur getAbonnement:", error);
    return { success: false, error: "Erreur lors de la récupération de l'abonnement" };
  }
}

/**
 * Met à jour l'abonnement d'un établissement
 */
export async function updateAbonnement(
  etablissementId: string,
  input: UpdateAbonnementInput
): Promise<ActionResult<AbonnementInfo>> {
  try {
    const session = await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    // Validation
    const validated = updateAbonnementSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: "Données invalides" };
    }

    // Récupérer l'ancien abonnement pour l'audit
    const ancien = await getAbonnementQuery(supabase, etablissementId);
    if (!ancien) {
      return { success: false, error: "Établissement non trouvé" };
    }

    // Mettre à jour
    const updated = await updateAbonnementQuery(supabase, etablissementId, {
      plan: validated.data.plan,
      max_utilisateurs: validated.data.max_utilisateurs,
      max_produits: validated.data.max_produits,
      max_ventes_mois: validated.data.max_ventes_mois,
    });

    // Log audit
    if (session.etablissementId) {
      await logAdminAction(supabase, {
        etablissement_id: session.etablissementId,
        utilisateur_id: session.userId,
        action: "UPDATE",
        entite: "abonnement",
        entite_id: etablissementId,
        description: `Changement de plan: ${ancien.plan} → ${validated.data.plan}`,
        ancienne_valeur: ancien,
        nouvelle_valeur: validated.data,
      });
    }

    revalidatePath(`/admin/etablissements/${etablissementId}`);

    return { success: true, data: updated };
  } catch (error) {
    console.error("Erreur updateAbonnement:", error);
    return { success: false, error: "Erreur lors de la mise à jour de l'abonnement" };
  }
}

/**
 * Vérifie l'utilisation des quotas d'un établissement
 */
export async function checkQuotas(
  etablissementId: string
): Promise<ActionResult<QuotaUsage>> {
  try {
    await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    const quotas = await checkQuotasQuery(supabase, etablissementId);

    return { success: true, data: quotas };
  } catch (error) {
    console.error("Erreur checkQuotas:", error);
    return { success: false, error: "Erreur lors de la vérification des quotas" };
  }
}

/**
 * Historique des changements de plan
 */
export async function getAbonnementHistory(
  etablissementId: string
): Promise<ActionResult<AbonnementHistoryEntry[]>> {
  try {
    await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    const history = await getAbonnementHistoryQuery(supabase, etablissementId);

    return { success: true, data: history };
  } catch (error) {
    console.error("Erreur getAbonnementHistory:", error);
    return { success: false, error: "Erreur lors de la récupération de l'historique" };
  }
}

/**
 * Récupère l'historique des paiements d'un établissement
 * Retourne les paiements formatés en PaymentInfo pour le frontend
 */
export async function getPaymentHistory(
  etablissementId: string
): Promise<ActionResult<PaymentInfo[]>> {
  try {
    await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    const rows = await getEtablissementPaymentsQuery(supabase, etablissementId);

    const payments: PaymentInfo[] = rows.map((row) => ({
      id: row.id,
      methode: row.methode as PaymentInfo["methode"],
      montant: row.montant,
      devise: row.devise,
      statut: row.statut as PaymentInfo["statut"],
      reference: row.reference_externe ?? undefined,
      dateCreation: row.created_at,
      datePaiement: row.statut === "complete" ? (row.updated_at ?? row.created_at) : undefined,
    }));

    return { success: true, data: payments };
  } catch (error) {
    console.error("Erreur getPaymentHistory:", error);
    return { success: false, error: "Erreur lors de la récupération des paiements" };
  }
}

/**
 * Récupère l'abonnement enrichi d'un établissement
 * Inclut les données réelles de la table abonnements (billing_cycle, dates, statut, prix)
 */
export async function getAbonnementFull(
  etablissementId: string
): Promise<ActionResult<AbonnementFullInfo>> {
  try {
    await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    const abonnement = await getAbonnementFullQuery(supabase, etablissementId);
    if (!abonnement) {
      return { success: false, error: "Établissement non trouvé" };
    }

    return { success: true, data: abonnement };
  } catch (error) {
    console.error("Erreur getAbonnementFull:", error);
    return { success: false, error: "Erreur lors de la récupération de l'abonnement" };
  }
}
