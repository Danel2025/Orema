"use server";

/**
 * Server Actions pour l'authentification Supabase
 * Utilise uniquement Supabase Auth pour l'authentification
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { verifyPin } from "@/lib/auth/password";
import { loginSchema, pinLoginSchema, type LoginInput, type PinLoginInput } from "@/schemas/auth";
import { checkLockout, recordFailedAttempt, resetAttempts } from "@/lib/auth/login-lockout";
import { z } from "zod";

type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Connexion avec email et mot de passe via Supabase Auth
 */
export async function loginWithSupabase(input: LoginInput): Promise<ActionResult> {
  try {
    const validated = loginSchema.parse(input);

    // Lockout check
    const lockout = checkLockout(validated.email);
    if (lockout.locked) {
      return {
        success: false,
        error:
          "Compte temporairement verrouillé suite à trop de tentatives. Veuillez réessayer dans quelques minutes.",
      };
    }

    const supabase = createServiceClient();

    // Verifier que l'utilisateur existe dans notre table
    const { data: utilisateur } = await supabase
      .from("utilisateurs")
      .select("id, nom, prenom, actif, etablissement_id")
      .eq("email", validated.email)
      .single();

    if (!utilisateur || !utilisateur.actif) {
      recordFailedAttempt(validated.email);
      return { success: false, error: "Email ou mot de passe incorrect" };
    }

    // Connexion via Supabase Auth
    const authClient = await createClient();
    const { error } = await authClient.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    });

    if (error) {
      recordFailedAttempt(validated.email);
      return { success: false, error: "Email ou mot de passe incorrect" };
    }

    // Login reussi : reset les tentatives
    resetAttempts(validated.email);

    // Audit log
    await supabase.from("audit_logs").insert({
      action: "LOGIN",
      entite: "Utilisateur",
      entite_id: utilisateur.id,
      description: `Connexion de ${utilisateur.prenom} ${utilisateur.nom}`,
      utilisateur_id: utilisateur.id,
      etablissement_id: utilisateur.etablissement_id,
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    console.error("Supabase login failed");
    return { success: false, error: "Une erreur est survenue lors de la connexion" };
  }
}

/**
 * Connexion avec email et PIN
 * Note: L'auth PIN utilise la vérification locale du PIN hashé
 * puis crée une session Supabase avec un token custom
 */
export async function loginWithPinSupabase(input: PinLoginInput): Promise<ActionResult> {
  try {
    const validated = pinLoginSchema.parse(input);

    // Lockout check (PIN config: 3 tentatives / 5 min)
    const lockout = checkLockout(validated.email, true);
    if (lockout.locked) {
      return {
        success: false,
        error:
          "Compte temporairement verrouillé suite à trop de tentatives PIN. Veuillez réessayer dans quelques minutes.",
      };
    }

    // Utiliser le service client pour bypasser RLS (l'utilisateur n'est pas encore authentifie)
    const { createServiceClient: createSvcClient } = await import("@/lib/supabase/server");
    const supabase = createSvcClient();

    // Rechercher l'utilisateur
    const { data: utilisateur } = await supabase
      .from("utilisateurs")
      .select("id, nom, prenom, role, actif, pin_code, etablissement_id")
      .eq("email", validated.email)
      .single();

    if (!utilisateur || !utilisateur.actif) {
      recordFailedAttempt(validated.email, true);
      return { success: false, error: "Email ou PIN incorrect" };
    }

    if (!utilisateur.pin_code) {
      return { success: false, error: "Aucun PIN configuré pour cet utilisateur" };
    }

    // Verifier le PIN
    const isPinValid = await verifyPin(validated.pin, utilisateur.pin_code);
    if (!isPinValid) {
      recordFailedAttempt(validated.email, true);
      return { success: false, error: "Email ou PIN incorrect" };
    }

    // Login PIN reussi : reset les tentatives
    resetAttempts(validated.email, true);

    // Pour l'auth PIN, on cree une session legacy (JWT custom)
    // car Supabase Auth ne supporte pas l'auth par PIN
    const { createSession, setSessionCookie } = await import("@/lib/auth/session");
    const sessionPayload = {
      userId: utilisateur.id,
      email: validated.email,
      role: utilisateur.role,
      etablissementId: utilisateur.etablissement_id,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      isPinAuth: true,
    };
    const token = await createSession(sessionPayload);
    await setSessionCookie(token, true);

    // Audit log
    await supabase.from("audit_logs").insert({
      action: "LOGIN",
      entite: "Utilisateur",
      entite_id: utilisateur.id,
      description: `Connexion PIN de ${utilisateur.prenom} ${utilisateur.nom}`,
      utilisateur_id: utilisateur.id,
      etablissement_id: utilisateur.etablissement_id,
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    console.error("Supabase PIN login failed");
    return { success: false, error: "Une erreur est survenue lors de la connexion" };
  }
}

/**
 * Déconnexion de l'utilisateur
 */
export async function logoutSupabase(): Promise<void> {
  try {
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (user?.email) {
      const supabase = createServiceClient();
      const { data: utilisateur } = await supabase
        .from("utilisateurs")
        .select("id, etablissement_id, nom, prenom")
        .eq("email", user.email)
        .single();

      if (utilisateur) {
        // Audit log
        await supabase.from("audit_logs").insert({
          action: "LOGOUT",
          entite: "Utilisateur",
          entite_id: utilisateur.id,
          description: `Déconnexion de ${utilisateur.prenom} ${utilisateur.nom}`,
          utilisateur_id: utilisateur.id,
          etablissement_id: utilisateur.etablissement_id,
        });
      }
    }

    await authClient.auth.signOut();

    // Supprimer le cookie legacy si présent (pour les sessions PIN)
    const { deleteSessionCookie } = await import("@/lib/auth/session");
    await deleteSessionCookie();
  } catch {
    console.error("Supabase logout failed");
  }

  redirect("/login");
}

/**
 * Récupère l'utilisateur actuellement connecté
 * Supporte à la fois Supabase Auth et les sessions PIN (legacy)
 */
export async function getCurrentUserSupabase() {
  try {
    const authClient = await createClient();
    const {
      data: { user: supabaseUser },
    } = await authClient.auth.getUser();

    // Si pas de session Supabase, vérifier la session PIN legacy
    if (!supabaseUser?.email) {
      const { getSession } = await import("@/lib/auth/session");
      const legacySession = await getSession();

      if (!legacySession) return null;

      const supabase = createServiceClient();
      const { data: utilisateur } = await supabase
        .from("utilisateurs")
        .select(
          `
          id, nom, prenom, email, role, actif, etablissement_id,
          etablissements(id, nom, logo)
        `
        )
        .eq("id", legacySession.userId)
        .single();

      if (!utilisateur || !utilisateur.actif) return null;

      return {
        id: utilisateur.id,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        role: utilisateur.role,
        actif: utilisateur.actif,
        etablissementId: utilisateur.etablissement_id,
        etablissement: utilisateur.etablissements as unknown as {
          id: string;
          nom: string;
          logo: string | null;
        },
        authProvider: "pin" as const,
      };
    }

    const supabase = createServiceClient();
    const { data: utilisateur } = await supabase
      .from("utilisateurs")
      .select(
        `
        id, nom, prenom, email, role, actif, etablissement_id,
        etablissements(id, nom, logo)
      `
      )
      .eq("email", supabaseUser.email)
      .single();

    if (!utilisateur || !utilisateur.actif) return null;

    return {
      id: utilisateur.id,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      role: utilisateur.role,
      actif: utilisateur.actif,
      etablissementId: utilisateur.etablissement_id,
      etablissement: utilisateur.etablissements as unknown as { id: string; nom: string; logo: string | null },
      authProvider: "supabase" as const,
    };
  } catch {
    console.error("Failed to get current Supabase user");
    return null;
  }
}

/** Schema de validation pour la creation d'un utilisateur Supabase */
const createSupabaseUserSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre"
    ),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "CAISSIER", "SERVEUR"]).optional(),
});

/**
 * Creer un utilisateur dans Supabase Auth
 * Necessite un role ADMIN ou SUPER_ADMIN
 */
export async function createSupabaseUser(
  email: string,
  password: string,
  role?: string
): Promise<ActionResult<string>> {
  try {
    // Verifier l'authentification et les permissions
    const { requireAuth } = await import("@/lib/auth");
    const session = await requireAuth();

    if (!["SUPER_ADMIN", "ADMIN"].includes(session.role)) {
      return { success: false, error: "Permissions insuffisantes. Role ADMIN requis." };
    }

    // Validation des inputs
    const validated = createSupabaseUserSchema.parse({ email, password, role });

    // Prevention de l'escalade de privileges si un role est specifie
    if (validated.role) {
      const ROLE_HIERARCHY: readonly string[] = [
        "SERVEUR",
        "CAISSIER",
        "MANAGER",
        "ADMIN",
        "SUPER_ADMIN",
      ] as const;
      const creatorLevel = ROLE_HIERARCHY.indexOf(session.role);
      const targetLevel = ROLE_HIERARCHY.indexOf(validated.role);
      if (targetLevel >= creatorLevel) {
        return {
          success: false,
          error: "Vous ne pouvez pas créer un utilisateur avec un rôle égal ou supérieur au vôtre.",
        };
      }
    }

    const { createServiceClient: createSvcClient } = await import("@/lib/supabase/server");
    const supabaseAdmin = createSvcClient();

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: validated.email,
      password: validated.password,
      email_confirm: true,
    });

    if (error) {
      console.error("Supabase user creation failed");
      return { success: false, error: "Erreur lors de la creation de l'utilisateur" };
    }

    return { success: true, data: data.user.id };
  } catch {
    console.error("Supabase user creation failed");
    return { success: false, error: "Erreur lors de la creation de l'utilisateur" };
  }
}

/**
 * Met à jour le mot de passe d'un utilisateur dans Supabase Auth
 */
export async function updateSupabasePassword(newPassword: string): Promise<ActionResult> {
  try {
    const authClient = await createClient();
    const { error } = await authClient.auth.updateUser({ password: newPassword });

    if (error) {
      console.error("Supabase password update failed");
      return { success: false, error: "Erreur lors de la mise à jour du mot de passe" };
    }

    return { success: true };
  } catch {
    console.error("Supabase password update failed");
    return { success: false, error: "Erreur lors de la mise à jour du mot de passe" };
  }
}

/**
 * Détermine la route de redirection après connexion en fonction du rôle et des permissions
 *
 * Logique de redirection :
 * 1. Si l'utilisateur a des routes autorisées personnalisées → première route autorisée
 * 2. Sinon, selon le rôle :
 *    - SUPER_ADMIN, ADMIN, MANAGER → /caisse (tableau de bord POS)
 *    - CAISSIER → /caisse
 *    - SERVEUR → /salle
 */
export async function getDefaultRedirectRoute(): Promise<ActionResult<string>> {
  try {
    const user = await getCurrentUserSupabase();

    if (!user) {
      return { success: false, error: "Utilisateur non connecté" };
    }

    // Récupérer les routes autorisées de l'utilisateur
    const { createServiceClient } = await import("@/lib/supabase/server");
    const supabase = createServiceClient();

    const { data: utilisateur } = await supabase
      .from("utilisateurs")
      .select("allowed_routes")
      .eq("id", user.id)
      .single();

    // Vérifier si l'utilisateur a des routes personnalisées
    const userAllowedRoutes = utilisateur?.allowed_routes as string[] | null;

    if (userAllowedRoutes && userAllowedRoutes.length > 0) {
      // Utiliser la première route autorisée
      return { success: true, data: userAllowedRoutes[0] };
    }

    // Pour les non-admins, vérifier les routes par rôle
    if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
      const { data: roleConfig } = await supabase
        .from("role_permissions")
        .select("allowed_routes")
        .eq("role", user.role)
        .eq("etablissement_id", user.etablissementId)
        .maybeSingle();

      const roleAllowedRoutes = roleConfig?.allowed_routes as string[] | null;

      if (roleAllowedRoutes && roleAllowedRoutes.length > 0) {
        // Utiliser la première route autorisée par le rôle
        return { success: true, data: roleAllowedRoutes[0] };
      }
    }

    // Routes par défaut selon le rôle
    const defaultRoutes: Record<string, string> = {
      SUPER_ADMIN: "/dashboard",
      ADMIN: "/dashboard",
      MANAGER: "/dashboard",
      CAISSIER: "/caisse",
      SERVEUR: "/salle",
    };

    const defaultRoute = defaultRoutes[user.role] || "/caisse";
    return { success: true, data: defaultRoute };
  } catch {
    console.error("Failed to determine redirect route");
    // En cas d'erreur, rediriger vers la caisse par defaut
    return { success: true, data: "/caisse" };
  }
}
