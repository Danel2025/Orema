/**
 * Requêtes Supabase pour le module d'avis clients
 */

import type { DbClient } from "../client";
import { getErrorMessage } from "../utils";

// ============================================================================
// Types locaux pour les inserts (pas encore dans les types générés Supabase)
// ============================================================================

interface AvisInsert {
  etablissement_id: string;
  client_prenom?: string | null;
  note: number;
  contenu: string;
  type_repas?: string | null;
}

interface AvisReponseInsert {
  avis_id: string;
  contenu: string;
  ton_detecte: string;
  publie?: boolean;
}

interface AvisQuestionInsert {
  etablissement_id: string;
  question: string;
  type: string;
  options?: unknown;
  cible: string;
  contexte?: string | null;
  actif?: boolean;
}

interface AvisAnalyseInsert {
  etablissement_id: string;
  periode: string;
  total_avis: number;
  note_moyenne: number;
  points_forts: unknown;
  points_faibles: unknown;
  tendance: string;
  avis_notables: unknown;
  actions_recommandees: unknown;
}

interface AvisFilters {
  note_min?: number;
  note_max?: number;
  date_debut?: string;
  date_fin?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// Avis
// ============================================================================

/**
 * Récupère les avis d'un établissement avec filtres et pagination
 */
export async function getAvisByEtablissement(
  client: DbClient,
  etablissementId: string,
  filters?: AvisFilters
) {
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 20;
  const offset = (page - 1) * limit;

  let query = client
    .from("avis")
    .select("*, avis_reponses(*)", { count: "exact" })
    .eq("etablissement_id", etablissementId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters?.note_min !== undefined) {
    query = query.gte("note", filters.note_min);
  }
  if (filters?.note_max !== undefined) {
    query = query.lte("note", filters.note_max);
  }
  if (filters?.date_debut) {
    query = query.gte("created_at", filters.date_debut);
  }
  if (filters?.date_fin) {
    query = query.lte("created_at", filters.date_fin);
  }
  if (filters?.search) {
    query = query.ilike("contenu", `%${filters.search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return {
    data: data ?? [],
    count: count ?? 0,
    page,
    pageSize: limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

/**
 * Récupère un avis par son ID
 */
export async function getAvisById(client: DbClient, avisId: string) {
  const { data, error } = await client
    .from("avis")
    .select("*, avis_reponses(*)")
    .eq("id", avisId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(getErrorMessage(error));
  }

  return data;
}

/**
 * Crée un nouvel avis
 */
export async function createAvis(client: DbClient, data: AvisInsert) {
  const { data: newAvis, error } = await client
    .from("avis")
    .insert(data)
    .select()
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return newAvis;
}

// ============================================================================
// Réponses aux avis
// ============================================================================

/**
 * Récupère les réponses d'un avis
 */
export async function getAvisReponses(client: DbClient, avisId: string) {
  const { data, error } = await client
    .from("avis_reponses")
    .select("*")
    .eq("avis_id", avisId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return data ?? [];
}

/**
 * Sauvegarde une réponse générée par l'IA
 */
export async function saveAvisReponse(client: DbClient, data: AvisReponseInsert) {
  const { data: reponse, error } = await client
    .from("avis_reponses")
    .insert(data)
    .select()
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return reponse;
}

/**
 * Marque une réponse comme publiée
 */
export async function publierAvisReponse(client: DbClient, reponseId: string) {
  const { data, error } = await client
    .from("avis_reponses")
    .update({ publie: true })
    .eq("id", reponseId)
    .select()
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return data;
}

// ============================================================================
// Questions
// ============================================================================

/**
 * Récupère les questions d'un établissement
 */
export async function getAvisQuestions(
  client: DbClient,
  etablissementId: string,
  options?: { actif?: boolean; cible?: string }
) {
  let query = client
    .from("avis_questions")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .order("created_at", { ascending: false });

  if (options?.actif !== undefined) {
    query = query.eq("actif", options.actif);
  }
  if (options?.cible) {
    query = query.eq("cible", options.cible);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return data ?? [];
}

/**
 * Sauvegarde un ensemble de questions générées par l'IA
 */
export async function saveAvisQuestions(client: DbClient, questions: AvisQuestionInsert[]) {
  const { data, error } = await client
    .from("avis_questions")
    .insert(questions)
    .select();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return data ?? [];
}

// ============================================================================
// Analyses
// ============================================================================

/**
 * Récupère la dernière analyse d'un établissement
 */
export async function getLatestAvisAnalyse(client: DbClient, etablissementId: string) {
  const { data, error } = await client
    .from("avis_analyses")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(getErrorMessage(error));
  }

  return data;
}

/**
 * Récupère toutes les analyses d'un établissement
 */
export async function getAvisAnalyses(client: DbClient, etablissementId: string) {
  const { data, error } = await client
    .from("avis_analyses")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return data ?? [];
}

/**
 * Sauvegarde une analyse générée par l'IA
 */
export async function saveAvisAnalyse(client: DbClient, data: AvisAnalyseInsert) {
  const { data: analyse, error } = await client
    .from("avis_analyses")
    .insert(data)
    .select()
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return analyse;
}
