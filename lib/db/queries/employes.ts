/**
 * Requêtes Supabase pour les employés (utilisateurs)
 */

import type { DbClient } from "../client";
import type {
  Utilisateur,
  UtilisateurInsert,
  UtilisateurUpdate,
  Role,
  PaginationOptions,
  PaginatedResult,
} from "../types";
import { getPaginationParams, createPaginatedResult, getErrorMessage } from "../utils";
import { sanitizeSearchTerm } from "@/lib/utils/sanitize";

/** Utilisateur avec le champ calculé has_pin (true si un PIN est défini) */
export type UtilisateurSafe = Utilisateur & { has_pin: boolean };

/**
 * Récupère tous les employés d'un établissement
 */
export async function getEmployes(
  client: DbClient,
  etablissementId: string,
  options?: {
    actif?: boolean;
    role?: Role;
    search?: string;
  }
): Promise<UtilisateurSafe[]> {
  let query = client
    .from("utilisateurs")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .order("nom", { ascending: true });

  if (options?.actif !== undefined) {
    query = query.eq("actif", options.actif);
  }

  if (options?.role) {
    query = query.eq("role", options.role);
  }

  if (options?.search) {
    const cleanSearch = sanitizeSearchTerm(options.search);
    if (cleanSearch) {
      query = query.or(
        `nom.ilike.%${cleanSearch}%,prenom.ilike.%${cleanSearch}%,email.ilike.%${cleanSearch}%`
      );
    }
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  // Ne pas exposer les mots de passe et PIN
  // Retourner has_pin AVANT de masquer pin_code pour que l'action puisse vérifier
  return (data ?? []).map(({ password, pin_code, ...rest }) => ({
    ...rest,
    password: null,
    pin_code: null,
    has_pin: !!pin_code,
  }));
}

/**
 * Récupère les employés paginés
 */
export async function getEmployesPaginated(
  client: DbClient,
  etablissementId: string,
  options?: PaginationOptions & {
    actif?: boolean;
    role?: Role;
    search?: string;
  }
): Promise<PaginatedResult<UtilisateurSafe>> {
  const { offset, limit, page, pageSize } = getPaginationParams(options);

  let query = client
    .from("utilisateurs")
    .select("*", { count: "exact" })
    .eq("etablissement_id", etablissementId)
    .order("nom", { ascending: true })
    .range(offset, offset + limit - 1);

  if (options?.actif !== undefined) {
    query = query.eq("actif", options.actif);
  }

  if (options?.role) {
    query = query.eq("role", options.role);
  }

  if (options?.search) {
    const cleanSearch = sanitizeSearchTerm(options.search);
    if (cleanSearch) {
      query = query.or(
        `nom.ilike.%${cleanSearch}%,prenom.ilike.%${cleanSearch}%,email.ilike.%${cleanSearch}%`
      );
    }
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  const sanitized = (data ?? []).map(({ password, pin_code, ...rest }) => ({
    ...rest,
    password: null,
    pin_code: null,
    has_pin: !!pin_code,
  }));

  return createPaginatedResult(sanitized, count ?? 0, { page, pageSize });
}

/**
 * Récupère un employé par son ID
 */
export async function getEmployeById(client: DbClient, id: string): Promise<UtilisateurSafe | null> {
  const { data, error } = await client.from("utilisateurs").select("*").eq("id", id).single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(getErrorMessage(error));
  }

  // Ne pas exposer le mot de passe et PIN
  const { password, pin_code, ...rest } = data;
  return { ...rest, password: null, pin_code: null, has_pin: !!pin_code };
}

/**
 * Récupère un employé par son email
 */
export async function getEmployeByEmail(
  client: DbClient,
  email: string
): Promise<Utilisateur | null> {
  const { data, error } = await client.from("utilisateurs").select("*").eq("email", email).single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(getErrorMessage(error));
  }

  return data;
}

/**
 * Récupère un employé par son email (version complète avec password pour auth)
 */
export async function getEmployeByEmailForAuth(
  client: DbClient,
  email: string
): Promise<Utilisateur | null> {
  const { data, error } = await client
    .from("utilisateurs")
    .select("*")
    .eq("email", email)
    .eq("actif", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(getErrorMessage(error));
  }

  return data;
}

/**
 * Récupère un employé par son PIN (pour auth rapide)
 */
export async function getEmployeByPin(
  client: DbClient,
  etablissementId: string,
  pinCode: string
): Promise<Utilisateur | null> {
  const { data, error } = await client
    .from("utilisateurs")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .eq("pin_code", pinCode)
    .eq("actif", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(getErrorMessage(error));
  }

  return data;
}

/**
 * Crée un nouvel employé
 */
export async function createEmploye(
  client: DbClient,
  data: UtilisateurInsert
): Promise<UtilisateurSafe> {
  const { data: employe, error } = await client.from("utilisateurs").insert(data).select().single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  const { password, pin_code, ...rest } = employe;
  return { ...rest, password: null, pin_code: null, has_pin: !!pin_code };
}

/**
 * Met à jour un employé
 */
export async function updateEmploye(
  client: DbClient,
  id: string,
  data: UtilisateurUpdate
): Promise<UtilisateurSafe> {
  const { data: employe, error } = await client
    .from("utilisateurs")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  const { password, pin_code, ...rest } = employe;
  return { ...rest, password: null, pin_code: null, has_pin: !!pin_code };
}

/**
 * Met à jour le mot de passe d'un employé
 */
export async function updateEmployePassword(
  client: DbClient,
  id: string,
  hashedPassword: string
): Promise<void> {
  const { error } = await client
    .from("utilisateurs")
    .update({ password: hashedPassword, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Met à jour le PIN d'un employé
 */
export async function updateEmployePin(
  client: DbClient,
  id: string,
  hashedPin: string
): Promise<void> {
  const { error } = await client
    .from("utilisateurs")
    .update({ pin_code: hashedPin, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Supprime un employé (soft delete)
 */
export async function deleteEmploye(client: DbClient, id: string): Promise<void> {
  const { error } = await client
    .from("utilisateurs")
    .update({ actif: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Vérifie si un email existe déjà
 */
export async function emailExists(
  client: DbClient,
  email: string,
  excludeId?: string
): Promise<boolean> {
  let query = client
    .from("utilisateurs")
    .select("id", { count: "exact", head: true })
    .eq("email", email);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { count } = await query;

  return (count ?? 0) > 0;
}

/**
 * Vérifie si un PIN existe déjà dans l'établissement
 */
export async function pinExists(
  client: DbClient,
  etablissementId: string,
  pinCode: string,
  excludeId?: string
): Promise<boolean> {
  let query = client
    .from("utilisateurs")
    .select("id", { count: "exact", head: true })
    .eq("etablissement_id", etablissementId)
    .eq("pin_code", pinCode);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { count } = await query;

  return (count ?? 0) > 0;
}

/**
 * Compte le nombre d'employés
 */
export async function countEmployes(
  client: DbClient,
  etablissementId: string,
  options?: { actif?: boolean; role?: Role }
): Promise<number> {
  let query = client
    .from("utilisateurs")
    .select("*", { count: "exact", head: true })
    .eq("etablissement_id", etablissementId);

  if (options?.actif !== undefined) {
    query = query.eq("actif", options.actif);
  }

  if (options?.role) {
    query = query.eq("role", options.role);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return count ?? 0;
}
