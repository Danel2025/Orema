/**
 * Requêtes Supabase pour les établissements
 */

import type { DbClient } from "../client";
import type { Etablissement, EtablissementInsert, EtablissementUpdate } from "../types";
import {
  getErrorMessage,
  serializePrices,
  PRICE_FIELDS,
  generateTicketNumber,
  isTicketDateToday,
} from "../utils";

const ETABLISSEMENT_PRICE_FIELDS = PRICE_FIELDS.etablissements;

/**
 * Récupère un établissement par son ID
 */
export async function getEtablissementById(
  client: DbClient,
  id: string
): Promise<Etablissement | null> {
  const { data, error } = await client.from("etablissements").select("*").eq("id", id).single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(getErrorMessage(error));
  }

  return serializePrices(data, [...ETABLISSEMENT_PRICE_FIELDS]);
}

/**
 * Crée un nouvel établissement
 */
export async function createEtablissement(
  client: DbClient,
  data: EtablissementInsert
): Promise<Etablissement> {
  const { data: etablissement, error } = await client
    .from("etablissements")
    .insert(data)
    .select()
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return serializePrices(etablissement, [...ETABLISSEMENT_PRICE_FIELDS]);
}

/**
 * Met à jour un établissement
 */
export async function updateEtablissement(
  client: DbClient,
  id: string,
  data: EtablissementUpdate
): Promise<Etablissement> {
  const { data: etablissement, error } = await client
    .from("etablissements")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return serializePrices(etablissement, [...ETABLISSEMENT_PRICE_FIELDS]);
}

/**
 * Génère le prochain numéro de ticket pour un établissement
 * Format: YYYYMMDD00001
 */
export async function getNextTicketNumber(
  client: DbClient,
  etablissementId: string
): Promise<string> {
  const etablissement = await getEtablissementById(client, etablissementId);

  if (!etablissement) {
    throw new Error("Établissement non trouvé");
  }

  const today = new Date().toISOString().slice(0, 10);
  let nextNumber = 1;

  // Si la date du dernier ticket est aujourd'hui, incrémenter
  if (etablissement.date_numero_ticket === today) {
    nextNumber = etablissement.dernier_numero_ticket + 1;
  }

  // Mettre à jour l'établissement
  await updateEtablissement(client, etablissementId, {
    date_numero_ticket: today,
    dernier_numero_ticket: nextNumber,
  });

  return generateTicketNumber(nextNumber - 1);
}

/**
 * Met à jour les paramètres TVA
 */
export async function updateTauxTva(
  client: DbClient,
  etablissementId: string,
  tauxStandard: number,
  tauxReduit: number
): Promise<Etablissement> {
  return updateEtablissement(client, etablissementId, {
    taux_tva_standard: tauxStandard,
    taux_tva_reduit: tauxReduit,
  });
}

/**
 * Met à jour les informations légales
 */
export async function updateInfosLegales(
  client: DbClient,
  etablissementId: string,
  infos: {
    nif?: string;
    rccm?: string;
  }
): Promise<Etablissement> {
  return updateEtablissement(client, etablissementId, infos);
}

/**
 * Met à jour le logo
 */
export async function updateLogo(
  client: DbClient,
  etablissementId: string,
  logoUrl: string
): Promise<Etablissement> {
  return updateEtablissement(client, etablissementId, { logo: logoUrl });
}

/**
 * Récupère les paramètres d'un établissement pour l'affichage
 */
export async function getEtablissementSettings(
  client: DbClient,
  etablissementId: string
): Promise<{
  nom: string;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  nif: string | null;
  rccm: string | null;
  logo: string | null;
  tauxTvaStandard: number;
  tauxTvaReduit: number;
  devise: string;
} | null> {
  const etablissement = await getEtablissementById(client, etablissementId);

  if (!etablissement) return null;

  return {
    nom: etablissement.nom,
    adresse: etablissement.adresse,
    telephone: etablissement.telephone,
    email: etablissement.email,
    nif: etablissement.nif,
    rccm: etablissement.rccm,
    logo: etablissement.logo,
    tauxTvaStandard: etablissement.taux_tva_standard,
    tauxTvaReduit: etablissement.taux_tva_reduit,
    devise: etablissement.devise_par,
  };
}
