"use server";

/**
 * Server Actions pour la facturation admin des établissements (SUPER_ADMIN)
 */

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/lib/auth";
import {
  createFactureSchema,
  factureFilterSchema,
  type CreateFactureInput,
  type FactureFilterData,
} from "@/schemas/admin-etablissement.schema";
import {
  createFacture as createFactureQuery,
  listFactures as listFacturesQuery,
  markFacturePaid as markFacturePaidQuery,
  getFactureById,
  type FactureAdmin,
} from "@/lib/db/queries/factures";
import { logAdminAction } from "@/lib/db/queries/audit-logs";
import type { PaginatedResult } from "@/lib/db/types";
import type { ActionResult } from "@/lib/action-types";

/**
 * Créer une facture pour un établissement
 */
export async function createFacture(
  etablissementId: string,
  input: CreateFactureInput
): Promise<ActionResult<FactureAdmin>> {
  try {
    const session = await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    // Validation
    const validated = createFactureSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: "Données invalides" };
    }

    // Vérifier que l'établissement existe
    const { data: etab } = await supabase
      .from("etablissements")
      .select("id, nom")
      .eq("id", etablissementId)
      .single();

    if (!etab) {
      return { success: false, error: "Établissement non trouvé" };
    }

    const facture = await createFactureQuery(supabase, {
      etablissement_id: etablissementId,
      montant: validated.data.montant,
      notes: validated.data.notes,
      date_echeance: validated.data.date_echeance,
    });

    // Log audit
    if (session.etablissementId) {
      await logAdminAction(supabase, {
        etablissement_id: session.etablissementId,
        utilisateur_id: session.userId,
        action: "CREATE",
        entite: "facture",
        entite_id: facture.id,
        description: `Création facture ${facture.numero} - ${validated.data.montant} FCFA pour "${etab.nom}"`,
        nouvelle_valeur: { montant: validated.data.montant, numero: facture.numero },
      });
    }

    revalidatePath(`/admin/etablissements/${etablissementId}`);

    return { success: true, data: facture };
  } catch (error) {
    console.error("Erreur createFacture:", error);
    return { success: false, error: "Erreur lors de la création de la facture" };
  }
}

/**
 * Lister les factures d'un établissement
 */
export async function listFactures(
  etablissementId: string,
  filters?: FactureFilterData
): Promise<ActionResult<PaginatedResult<FactureAdmin>>> {
  try {
    await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    const validated = factureFilterSchema.safeParse(filters ?? {});
    const parsedFilters = validated.success ? validated.data : {};

    const result = await listFacturesQuery(
      supabase,
      etablissementId,
      {
        statut: parsedFilters.statut,
        dateDebut: parsedFilters.dateDebut,
        dateFin: parsedFilters.dateFin,
      },
      {
        page: parsedFilters.page ?? 1,
        pageSize: parsedFilters.pageSize ?? 20,
      }
    );

    return { success: true, data: result };
  } catch (error) {
    console.error("Erreur listFactures:", error);
    return { success: false, error: "Erreur lors de la récupération des factures" };
  }
}

/**
 * Marquer une facture comme payée
 */
export async function markFacturePaid(
  factureId: string
): Promise<ActionResult<FactureAdmin>> {
  try {
    const session = await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    // Vérifier que la facture existe
    const existing = await getFactureById(supabase, factureId);
    if (!existing) {
      return { success: false, error: "Facture non trouvée" };
    }

    if (existing.statut === "payee") {
      return { success: false, error: "La facture est déjà payée" };
    }

    const facture = await markFacturePaidQuery(supabase, factureId);

    // Log audit
    if (session.etablissementId) {
      await logAdminAction(supabase, {
        etablissement_id: session.etablissementId,
        utilisateur_id: session.userId,
        action: "UPDATE",
        entite: "facture",
        entite_id: factureId,
        description: `Facture ${existing.numero} marquée comme payée`,
        ancienne_valeur: { statut: existing.statut },
        nouvelle_valeur: { statut: "payee" },
      });
    }

    revalidatePath(`/admin/etablissements/${existing.etablissement_id}`);

    return { success: true, data: facture };
  } catch (error) {
    console.error("Erreur markFacturePaid:", error);
    return { success: false, error: "Erreur lors du marquage de la facture" };
  }
}

/**
 * Récupère le détail d'une facture
 */
export async function getFactureDetail(
  factureId: string
): Promise<ActionResult<FactureAdmin>> {
  try {
    await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    const facture = await getFactureById(supabase, factureId);
    if (!facture) {
      return { success: false, error: "Facture non trouvée" };
    }

    return { success: true, data: facture };
  } catch (error) {
    console.error("Erreur getFactureDetail:", error);
    return { success: false, error: "Erreur lors de la récupération de la facture" };
  }
}
