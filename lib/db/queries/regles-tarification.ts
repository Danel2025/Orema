// @ts-nocheck — Tables pas encore dans types/supabase.ts (migrations non appliquées). Supprimer après `pnpm db:types`.
/**
 * Requêtes Supabase pour les règles de tarification
 */

import type { DbClient } from "../client";
import { getErrorMessage } from "../utils";

/**
 * Récupère toutes les règles de tarification d'un établissement
 */
export async function getReglesTarification(
  client: DbClient,
  etablissementId: string
) {
  const { data, error } = await client
    .from("regles_tarification")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .order("role");

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return data ?? [];
}

/**
 * Récupère la règle de tarification pour un rôle spécifique
 */
export async function getRegleForRole(
  client: DbClient,
  etablissementId: string,
  role: string
) {
  const { data, error } = await client
    .from("regles_tarification")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .eq("role", role)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(getErrorMessage(error));
  }

  return data;
}

/**
 * Upsert une règle de tarification (insert ou update via ON CONFLICT)
 */
export async function upsertRegleTarification(
  client: DbClient,
  etablissementId: string,
  regle: {
    role: string;
    remise_max_pourcent: number;
    peut_modifier_prix: boolean;
    peut_appliquer_remise: boolean;
    plafond_remise_transaction?: number;
    necessite_approbation_au_dela?: number | null;
  }
) {
  const { data, error } = await client
    .from("regles_tarification")
    .upsert(
      {
        etablissement_id: etablissementId,
        role: regle.role,
        remise_max_pourcent: regle.remise_max_pourcent,
        peut_modifier_prix: regle.peut_modifier_prix,
        peut_appliquer_remise: regle.peut_appliquer_remise,
        plafond_remise_transaction: regle.plafond_remise_transaction ?? 0,
        necessite_approbation_au_dela:
          regle.necessite_approbation_au_dela ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "etablissement_id,role" }
    )
    .select()
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return data;
}

/**
 * Supprime une règle de tarification
 */
export async function deleteRegleTarification(
  client: DbClient,
  etablissementId: string,
  role: string
) {
  const { error } = await client
    .from("regles_tarification")
    .delete()
    .eq("etablissement_id", etablissementId)
    .eq("role", role);

  if (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Récupère la configuration de tarification d'un établissement
 * (colonnes stockées dans la table etablissements)
 */
export async function getConfigTarification(
  client: DbClient,
  etablissementId: string
) {
  const { data, error } = await client
    .from("etablissements")
    .select(
      "protection_marge_active, marge_minimum_globale, approbation_remise_active, tarifs_horaires_actifs"
    )
    .eq("id", etablissementId)
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return {
    protectionMargeActive: data.protection_marge_active ?? false,
    margeMinimumGlobale: data.marge_minimum_globale ?? 0,
    approbationRemiseActive: data.approbation_remise_active ?? false,
    tarifsHorairesActifs: data.tarifs_horaires_actifs ?? false,
  };
}

/**
 * Met à jour la configuration de tarification d'un établissement
 */
export async function updateConfigTarification(
  client: DbClient,
  etablissementId: string,
  config: {
    protection_marge_active?: boolean;
    marge_minimum_globale?: number;
    approbation_remise_active?: boolean;
    tarifs_horaires_actifs?: boolean;
  }
) {
  const { data, error } = await client
    .from("etablissements")
    .update({
      ...config,
      updated_at: new Date().toISOString(),
    })
    .eq("id", etablissementId)
    .select(
      "protection_marge_active, marge_minimum_globale, approbation_remise_active, tarifs_horaires_actifs"
    )
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return {
    protectionMargeActive: data.protection_marge_active ?? false,
    margeMinimumGlobale: data.marge_minimum_globale ?? 0,
    approbationRemiseActive: data.approbation_remise_active ?? false,
    tarifsHorairesActifs: data.tarifs_horaires_actifs ?? false,
  };
}
