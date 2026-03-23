"use server";

/**
 * Server Actions pour l'authentification
 * Migré vers Supabase
 */

import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/db";
import {
  hashPassword,
  hashPin,
  verifyPassword,
  verifyPin,
  createSession,
  setSessionCookie,
  deleteSessionCookie,
  getLegacySession,
  requireAuth,
} from "@/lib/auth";
import {
  loginSchema,
  pinLoginSchema,
  createUserSchema,
  updatePasswordSchema,
  updatePinSchema,
  type LoginInput,
  type PinLoginInput,
  type CreateUserInput,
  type UpdatePasswordInput,
  type UpdatePinInput,
} from "@/schemas/auth";
import { checkLockout, recordFailedAttempt, resetAttempts } from "@/lib/auth/login-lockout";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

type ActionResult<T = void> = { success: boolean; error?: string; data?: T };

export async function login(input: LoginInput): Promise<ActionResult> {
  try {
    const validated = loginSchema.parse(input);

    // Rate limiting
    const rateLimitResult = rateLimit(validated.email, RATE_LIMITS.LOGIN);
    if (!rateLimitResult.success) {
      return { success: false, error: "Trop de tentatives. Veuillez réessayer plus tard." };
    }

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

    const { data: user } = await supabase
      .from("utilisateurs")
      .select("id, email, password, nom, prenom, role, actif, etablissement_id")
      .eq("email", validated.email)
      .single();

    if (!user?.actif) {
      recordFailedAttempt(validated.email);
      return { success: false, error: "Email ou mot de passe incorrect" };
    }
    if (!user.password)
      return { success: false, error: "Cet utilisateur doit se connecter avec un PIN" };

    const isPasswordValid = await verifyPassword(validated.password, user.password);
    if (!isPasswordValid) {
      recordFailedAttempt(validated.email);
      return { success: false, error: "Email ou mot de passe incorrect" };
    }

    // Login reussi : reset les tentatives
    resetAttempts(validated.email);

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      etablissementId: user.etablissement_id,
      nom: user.nom,
      prenom: user.prenom,
    };
    const token = await createSession(sessionPayload);
    await setSessionCookie(token);

    await supabase.from("audit_logs").insert({
      action: "LOGIN",
      entite: "Utilisateur",
      entite_id: user.id,
      description: `Connexion de ${user.prenom} ${user.nom}`,
      utilisateur_id: user.id,
      etablissement_id: user.etablissement_id,
    });

    return { success: true };
  } catch {
    console.error("Login failed");
    return { success: false, error: "Une erreur est survenue lors de la connexion" };
  }
}

export async function loginWithPin(input: PinLoginInput): Promise<ActionResult> {
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

    const supabase = createServiceClient();

    const { data: user } = await supabase
      .from("utilisateurs")
      .select("id, email, pin_code, nom, prenom, role, actif, etablissement_id")
      .eq("email", validated.email)
      .single();

    if (!user?.actif) {
      recordFailedAttempt(validated.email, true);
      return { success: false, error: "Email ou PIN incorrect" };
    }
    if (!user.pin_code)
      return { success: false, error: "Aucun PIN configure pour cet utilisateur" };

    const isPinValid = await verifyPin(validated.pin, user.pin_code);
    if (!isPinValid) {
      recordFailedAttempt(validated.email, true);
      return { success: false, error: "Email ou PIN incorrect" };
    }

    // Login PIN reussi : reset les tentatives
    resetAttempts(validated.email, true);

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      etablissementId: user.etablissement_id,
      nom: user.nom,
      prenom: user.prenom,
      isPinAuth: true,
    };
    const token = await createSession(sessionPayload);
    await setSessionCookie(token, true);

    await supabase.from("audit_logs").insert({
      action: "LOGIN",
      entite: "Utilisateur",
      entite_id: user.id,
      description: `Connexion PIN de ${user.prenom} ${user.nom}`,
      utilisateur_id: user.id,
      etablissement_id: user.etablissement_id,
    });

    return { success: true };
  } catch {
    console.error("PIN login failed");
    return { success: false, error: "Une erreur est survenue lors de la connexion" };
  }
}

export async function logout(): Promise<void> {
  try {
    const session = await getLegacySession();
    if (session) {
      const supabase = createServiceClient();
      await supabase.from("audit_logs").insert({
        action: "LOGOUT",
        entite: "Utilisateur",
        entite_id: session.userId,
        description: `Déconnexion de ${session.prenom} ${session.nom}`,
        utilisateur_id: session.userId,
        etablissement_id: session.etablissementId,
      });
    }
    await deleteSessionCookie();
  } catch {
    console.error("Logout failed");
  }
  redirect("/login");
}

export async function createUser(input: CreateUserInput): Promise<ActionResult<string>> {
  try {
    const session = await requireAuth();
    if (!session.etablissementId) return { success: false, error: "Aucun etablissement associe" };
    if (!["SUPER_ADMIN", "ADMIN"].includes(session.role))
      return { success: false, error: "Permissions insuffisantes" };

    const validated = createUserSchema.parse(input);

    // Prevent privilege escalation: un utilisateur ne peut pas créer un compte
    // avec un rôle égal ou supérieur au sien
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

    const supabase = createServiceClient();

    const { data: existingUser } = await supabase
      .from("utilisateurs")
      .select("id")
      .eq("email", validated.email)
      .single();
    if (existingUser) return { success: false, error: "Cet email est déjà utilisé" };

    const hashedPassword = await hashPassword(validated.password);
    const hashedPin = validated.pinCode ? await hashPin(validated.pinCode) : null;

    const { data: user, error } = await supabase
      .from("utilisateurs")
      .insert({
        email: validated.email,
        password: hashedPassword,
        nom: validated.nom,
        prenom: validated.prenom,
        role: validated.role,
        pin_code: hashedPin,
        etablissement_id: validated.etablissementId,
      })
      .select("id")
      .single();

    if (error) throw error;

    await supabase.from("audit_logs").insert({
      action: "CREATE",
      entite: "Utilisateur",
      entite_id: user.id,
      description: `Création utilisateur ${validated.prenom} ${validated.nom} (${validated.role})`,
      utilisateur_id: session.userId,
      etablissement_id: session.etablissementId,
    });

    return { success: true, data: user.id };
  } catch {
    console.error("User creation failed");
    return {
      success: false,
      error: "Une erreur est survenue lors de la creation de l'utilisateur",
    };
  }
}

export async function updatePassword(input: UpdatePasswordInput): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    const validated = updatePasswordSchema.parse(input);

    // Importer le client Supabase pour l'authentification
    const { createClient } = await import("@/lib/supabase/server");
    const supabaseAuth = await createClient();

    // Vérifier le mot de passe actuel en essayant de se connecter
    const { error: signInError } = await supabaseAuth.auth.signInWithPassword({
      email: session.email,
      password: validated.currentPassword,
    });

    if (signInError) {
      return { success: false, error: "Mot de passe actuel incorrect" };
    }

    // Mettre à jour le mot de passe via Supabase Auth
    const { error: updateError } = await supabaseAuth.auth.updateUser({
      password: validated.newPassword,
    });

    if (updateError) {
      console.error("Password update failed");
      return { success: false, error: "Erreur lors de la mise a jour du mot de passe" };
    }

    // Log d'audit (seulement si un établissement est associé)
    if (session.etablissementId) {
      const supabase = createServiceClient();
      await supabase.from("audit_logs").insert({
        action: "UPDATE",
        entite: "Utilisateur",
        entite_id: session.userId,
        description: "Mot de passe modifié",
        utilisateur_id: session.userId,
        etablissement_id: session.etablissementId,
      });
    }

    return { success: true };
  } catch {
    console.error("Password update failed");
    return { success: false, error: "Une erreur est survenue" };
  }
}

export async function updatePin(input: UpdatePinInput): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    const validated = updatePinSchema.parse(input);
    const supabase = createServiceClient();

    const { data: user, error: queryError } = await supabase
      .from("utilisateurs")
      .select("pin_code")
      .eq("id", session.userId)
      .single();

    if (queryError || !user) {
      return { success: false, error: "Utilisateur non trouvé dans la base de données" };
    }

    // Si un PIN existe, vérifier l'ancien PIN
    if (user.pin_code) {
      if (!validated.currentPin) {
        return { success: false, error: "Veuillez saisir votre PIN actuel" };
      }
      const isPinValid = await verifyPin(validated.currentPin, user.pin_code);
      if (!isPinValid) {
        return { success: false, error: "PIN actuel incorrect" };
      }
    }
    // Si aucun PIN n'existe, on permet la création (pas besoin de currentPin)

    const hashedPin = await hashPin(validated.newPin);
    await supabase.from("utilisateurs").update({ pin_code: hashedPin }).eq("id", session.userId);

    // Log d'audit (seulement si un établissement est associé)
    if (session.etablissementId) {
      await supabase.from("audit_logs").insert({
        action: "UPDATE",
        entite: "Utilisateur",
        entite_id: session.userId,
        description: user.pin_code ? "PIN modifié" : "PIN créé",
        utilisateur_id: session.userId,
        etablissement_id: session.etablissementId,
      });
    }

    return { success: true };
  } catch {
    console.error("PIN update failed");
    return { success: false, error: "Une erreur est survenue" };
  }
}

export async function getCurrentUser() {
  try {
    const session = await getLegacySession();
    if (!session) return null;

    // Utiliser le service client pour bypasser RLS car la session est deja validee
    const supabase = createServiceClient();
    const { data: user } = await supabase
      .from("utilisateurs")
      .select(
        "id, email, nom, prenom, role, actif, etablissement_id, etablissements(id, nom, logo)"
      )
      .eq("id", session.userId)
      .single();

    if (!user?.actif) return null;

    return {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
      actif: user.actif,
      etablissementId: user.etablissement_id,
      etablissement: user.etablissements,
      isPinAuth: session.isPinAuth,
    };
  } catch {
    console.error("Failed to get current user");
    return null;
  }
}
