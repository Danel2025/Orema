// @ts-nocheck — Tables pas encore dans types/supabase.ts (migrations non appliquées). Supprimer après `pnpm db:types`.
/**
 * Requêtes Supabase pour les tarifs horaires
 */

import type { DbClient } from "../client";
import { getErrorMessage } from "../utils";

/**
 * Récupère tous les tarifs horaires d'un établissement
 */
export async function getTarifsHoraires(
  client: DbClient,
  etablissementId: string
) {
  const { data, error } = await client
    .from("tarifs_horaires")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .order("priorite", { ascending: false });

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return data ?? [];
}

/**
 * Crée un tarif horaire
 */
export async function createTarifHoraire(
  client: DbClient,
  etablissementId: string,
  data: {
    nom: string;
    heure_debut: string;
    heure_fin: string;
    jours_semaine: number[];
    type_ajustement: string;
    valeur_ajustement: number;
    categorie_id?: string | null;
    actif?: boolean;
    priorite?: number;
  }
) {
  const { data: tarif, error } = await client
    .from("tarifs_horaires")
    .insert({
      etablissement_id: etablissementId,
      nom: data.nom,
      heure_debut: data.heure_debut,
      heure_fin: data.heure_fin,
      jours_semaine: data.jours_semaine,
      type_ajustement: data.type_ajustement,
      valeur_ajustement: data.valeur_ajustement,
      categorie_id: data.categorie_id ?? null,
      actif: data.actif ?? true,
      priorite: data.priorite ?? 0,
    })
    .select()
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return tarif;
}

/**
 * Met à jour un tarif horaire
 */
export async function updateTarifHoraire(
  client: DbClient,
  tarifId: string,
  data: {
    nom?: string;
    heure_debut?: string;
    heure_fin?: string;
    jours_semaine?: number[];
    type_ajustement?: string;
    valeur_ajustement?: number;
    categorie_id?: string | null;
    actif?: boolean;
    priorite?: number;
  }
) {
  const { data: tarif, error } = await client
    .from("tarifs_horaires")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tarifId)
    .select()
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return tarif;
}

/**
 * Supprime un tarif horaire
 */
export async function deleteTarifHoraire(
  client: DbClient,
  tarifId: string
) {
  const { error } = await client
    .from("tarifs_horaires")
    .delete()
    .eq("id", tarifId);

  if (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Récupère le tarif horaire actif pour l'heure courante
 * Filtre par jour de semaine et plage horaire, trié par priorité
 * Optionnellement filtré par catégorie
 */
export async function getTarifActif(
  client: DbClient,
  etablissementId: string,
  categorieId?: string | null
) {
  // Obtenir l'heure et le jour actuels (timezone Africa/Libreville = UTC+1)
  const now = new Date();
  const gabonTime = new Date(now.getTime() + 1 * 60 * 60 * 1000);
  const heureActuelle = gabonTime.toISOString().slice(11, 16); // HH:MM
  const jourSemaine = gabonTime.getUTCDay() || 7; // 1=Lun ... 7=Dim (ISO)

  let query = client
    .from("tarifs_horaires")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .eq("actif", true)
    .lte("heure_debut", heureActuelle)
    .gte("heure_fin", heureActuelle)
    .contains("jours_semaine", [jourSemaine])
    .order("priorite", { ascending: false })
    .limit(1);

  if (categorieId) {
    // Tarif spécifique à la catégorie OU tarif global (categorie_id IS NULL)
    query = query.or(
      `categorie_id.eq.${categorieId},categorie_id.is.null`
    );
  } else {
    // Uniquement les tarifs globaux
    query = query.is("categorie_id", null);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return data?.[0] ?? null;
}
