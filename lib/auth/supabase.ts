/**
 * Fonctions utilitaires pour l'authentification Supabase
 * Migré vers Supabase
 */

import { redirect } from "next/navigation";
import { createClient as createAuthClient, createServiceClient } from "@/lib/supabase/server";

type Role = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "CAISSIER" | "SERVEUR";

export interface AuthUser {
  authId: string;
  userId: string;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  /** ID de l'établissement (peut être null pour SUPER_ADMIN global) */
  etablissementId: string | null;
  etablissementNom?: string;
  /** Routes personnalisées autorisées (override les permissions du rôle pour les non-admins) */
  allowedRoutes?: string[];
}

export async function getSupabaseUser() {
  try {
    const supabase = await createAuthClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    // Silently handle expected auth errors (session expired, missing, or invalid refresh token)
    if (error) {
      const isExpectedError =
        error.message === "Auth session missing!" ||
        error.message.includes("Refresh Token") ||
        error.code === "refresh_token_not_found";
      if (!isExpectedError) {
        console.error("[getSupabaseUser] Erreur Supabase:", error.message);
      }
      return null;
    }
    return user;
  } catch (error) {
    console.error("[getSupabaseUser] Exception:", error);
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // Utiliser le service client pour bypasser les RLS
    const supabase = createServiceClient();

    // PRIORITÉ 1: Vérifier la session PIN (JWT custom) en premier
    // Car si l'utilisateur s'est connecté par PIN, c'est cette session qui compte
    const { getSession: getLegacySession } = await import("./session");
    const legacySession = await getLegacySession();

    if (legacySession) {
      const { data: utilisateur } = await supabase
        .from("utilisateurs")
        .select(
          "id, email, nom, prenom, role, actif, etablissement_id, allowed_routes, etablissements(id, nom)"
        )
        .eq("id", legacySession.userId)
        .single();

      if (utilisateur?.actif) {
        // Récupérer allowed_routes (routes individuelles par utilisateur)
        const allowedRoutes =
          (utilisateur.allowed_routes as string[] | null | undefined) ?? undefined;
        return {
          authId: legacySession.userId,
          userId: utilisateur.id,
          email: utilisateur.email,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          role: utilisateur.role as Role,
          etablissementId: utilisateur.etablissement_id,
          etablissementNom: (utilisateur.etablissements as unknown as { nom: string })?.nom,
          allowedRoutes,
        };
      }
    }

    // PRIORITÉ 2: Vérifier Supabase Auth
    const supabaseUser = await getSupabaseUser();

    if (supabaseUser?.email) {
      const { data: utilisateur } = await supabase
        .from("utilisateurs")
        .select(
          "id, email, nom, prenom, role, actif, etablissement_id, allowed_routes, etablissements(id, nom)"
        )
        .eq("email", supabaseUser.email)
        .single();

      if (utilisateur?.actif) {
        // Récupérer allowed_routes (routes individuelles par utilisateur)
        const allowedRoutes =
          (utilisateur.allowed_routes as string[] | null | undefined) ?? undefined;
        return {
          authId: supabaseUser.id,
          userId: utilisateur.id,
          email: utilisateur.email,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          role: utilisateur.role as Role,
          etablissementId: utilisateur.etablissement_id,
          etablissementNom: (utilisateur.etablissements as unknown as { nom: string })?.nom,
          allowedRoutes,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("[getCurrentUser] Erreur:", error);
    return null;
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié");
  return user;
}

export async function requireRole(role: Role): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role !== role) throw new Error("Permissions insuffisantes");
  return user;
}

export async function requireAnyRole(roles: Role[]): Promise<AuthUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) throw new Error("Permissions insuffisantes");
  return user;
}

export async function getEtablissementId(): Promise<string> {
  const user = await requireAuth();
  if (!user.etablissementId) {
    throw new Error("Aucun établissement associé à cet utilisateur");
  }
  return user.etablissementId;
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

export async function hasRole(role: Role): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === role;
}

export async function hasAnyRole(roles: Role[]): Promise<boolean> {
  const user = await getCurrentUser();
  return user ? roles.includes(user.role) : false;
}

export async function signOut(): Promise<never> {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect("/login");
}
