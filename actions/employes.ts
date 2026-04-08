"use server";

/**
 * Server Actions pour la gestion des employes
 * CRUD employe, reset PIN, statistiques
 * Migré de Prisma vers Supabase
 *
 * Synchronise avec Supabase Auth ET la table utilisateurs.
 */

import { revalidatePath } from "next/cache";
import { createAuthenticatedClient, createServiceClient, db } from "@/lib/db";
import { hashPassword, hashPin, requireAuth, requireAnyRole } from "@/lib/auth";
import { checkUserQuota } from "@/lib/plan-enforcement";
import {
  createEmployeSchema,
  updateEmployeSchema,
  resetPinSchema,
  resetPasswordSchema,
  toggleStatusSchema,
  type CreateEmployeInput,
  type UpdateEmployeInput,
  type ResetPinInput,
  type ResetPasswordInput,
  type ToggleStatusInput,
} from "@/schemas/employe";

type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Genere un code PIN aleatoire de N chiffres de maniere cryptographiquement securisee.
 * Utilise crypto.getRandomValues() (disponible nativement dans Node.js 19+ et l'environnement serveur Next.js)
 * au lieu de Math.random() qui est previsible et non securise pour la generation de secrets.
 */
function generateSecurePin(length: number = 4): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return (array[0] % Math.pow(10, length)).toString().padStart(length, "0");
}

export async function generateRandomPin(): Promise<string> {
  return generateSecurePin(4);
}

/**
 * Crée un client authentifié pour les actions employes.
 * Utilise requireAuth/requireAnyRole en amont pour la validation des permissions.
 */
async function getAuthClientFromSession(session: {
  userId: string;
  etablissementId: string | null;
  role: string;
}) {
  if (!session.etablissementId) throw new Error("Aucun établissement associé");
  const supabase = await createAuthenticatedClient({
    userId: session.userId,
    etablissementId: session.etablissementId,
    role: session.role,
  });
  return supabase;
}

/**
 * Recuperer tous les employes de l'etablissement
 * Protection: Le SUPER_ADMIN n'est visible que par lui-même ou d'autres SUPER_ADMIN
 */
export async function getEmployes(): Promise<
  ActionResult<
    Array<{
      id: string;
      nom: string;
      prenom: string;
      email: string;
      role: string;
      actif: boolean;
      createdAt: Date;
      hasPin: boolean;
      allowed_routes?: string[];
    }>
  >
> {
  try {
    const session = await requireAuth();
    if (!session.etablissementId) return { success: false, error: "Aucun établissement associé" };
    const supabase = await getAuthClientFromSession(session);

    const employes = await db.getEmployes(supabase, session.etablissementId);

    // Filtrer les SUPER_ADMIN si l'utilisateur courant n'est pas SUPER_ADMIN
    const filteredEmployes = employes.filter((e) => {
      // Si l'employé est SUPER_ADMIN
      if (e.role === "SUPER_ADMIN") {
        // Seul un SUPER_ADMIN peut le voir, ou c'est lui-même
        return session.role === "SUPER_ADMIN" || e.id === session.userId;
      }
      return true;
    });

    return {
      success: true,
      data: filteredEmployes.map((e) => ({
        id: e.id,
        nom: e.nom,
        prenom: e.prenom,
        email: e.email,
        role: e.role,
        actif: e.actif,
        createdAt: new Date(e.created_at),
        hasPin: e.has_pin ?? false,
        allowed_routes: e.allowed_routes ?? undefined,
      })),
    };
  } catch (error) {
    console.error("Erreur récupération employés:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération des employés",
    };
  }
}

/**
 * Recuperer un employe par son ID
 */
export async function getEmployeById(id: string): Promise<
  ActionResult<{
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role: string;
    actif: boolean;
    createdAt: Date;
    hasPin: boolean;
  }>
> {
  try {
    const session = await requireAuth();
    const supabase = await getAuthClientFromSession(session);

    // RLS filtre par etablissement_id
    const employe = await db.getEmployeById(supabase, id);

    if (!employe) {
      return {
        success: false,
        error: "Employe non trouve",
      };
    }

    return {
      success: true,
      data: {
        id: employe.id,
        nom: employe.nom,
        prenom: employe.prenom,
        email: employe.email,
        role: employe.role,
        actif: employe.actif,
        createdAt: new Date(employe.created_at),
        hasPin: employe.has_pin ?? false,
      },
    };
  } catch (error) {
    console.error("Erreur récupération employé:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération de l'employé",
    };
  }
}

/**
 * Creer un nouvel employe
 *
 * Cree l'utilisateur dans Supabase Auth (le trigger synchronise avec utilisateurs)
 * puis met à jour les données supplémentaires (mot de passe hashé, PIN).
 */
export async function createEmploye(input: CreateEmployeInput): Promise<ActionResult<string>> {
  try {
    // Verifier les permissions (SUPER_ADMIN ou ADMIN)
    const session = await requireAnyRole(["SUPER_ADMIN", "ADMIN"]);
    if (!session.etablissementId) return { success: false, error: "Aucun établissement associé" };
    const supabase = await getAuthClientFromSession(session);

    // Vérification du quota utilisateurs
    const quotaCheck = await checkUserQuota(supabase, session.etablissementId, { userRole: session.role });
    if (!quotaCheck.allowed) {
      return { success: false, error: quotaCheck.message };
    }

    // Valider les donnees
    const validated = createEmployeSchema.parse(input);

    // Verifier que l'email n'existe pas deja
    const emailExists = await db.emailExists(supabase, validated.email);

    if (emailExists) {
      return {
        success: false,
        error: "Cet email est déjà utilisé",
      };
    }

    // 1. Creer l'utilisateur dans Supabase Auth
    // Le trigger on_auth_user_created synchronise automatiquement avec utilisateurs
    // Note: createServiceClient nécessaire pour les opérations auth.admin
    const adminSupabase = createServiceClient();
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: validated.email,
      password: validated.password,
      email_confirm: true,
      user_metadata: {
        nom: validated.nom,
        prenom: validated.prenom,
        role: validated.role,
        etablissement_id: session.etablissementId!,
      },
    });

    if (authError) {
      console.error("Erreur création Supabase Auth:", authError);
      return {
        success: false,
        error: `Erreur Supabase Auth: ${authError.message}`,
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: "Erreur: utilisateur non créé dans Supabase Auth",
      };
    }

    // 2. Hasher le mot de passe pour la table utilisateurs (backup)
    const hashedPassword = await hashPassword(validated.password);

    // 3. Hasher le PIN si fourni
    let hashedPin: string | null = null;
    if (validated.pinCode) {
      hashedPin = await hashPin(validated.pinCode);
    }

    // 4. Mettre à jour l'employé créé par le trigger avec les données complètes
    // Le trigger crée l'utilisateur avec les métadonnées, on ajoute le mot de passe hashé et le PIN
    const { data: employe, error: updateError } = await adminSupabase
      .from("utilisateurs")
      .update({
        password: hashedPassword,
        pin_code: hashedPin,
        actif: validated.actif,
        etablissement_id: session.etablissementId!,
      })
      .eq("email", validated.email)
      .select()
      .single();

    if (updateError || !employe) {
      console.error("Erreur mise à jour employe:", updateError);
      return {
        success: false,
        error: "Erreur lors de la finalisation de la création",
      };
    }

    // 5. Logger l'audit
    await db.createAuditLog(supabase, {
      action: "CREATE",
      entite: "Utilisateur",
      entite_id: employe.id,
      description: `Creation employe ${employe.prenom} ${employe.nom} (${employe.role})`,
      utilisateur_id: session.userId,
      etablissement_id: session.etablissementId!,
    });

    revalidatePath("/employes");

    return {
      success: true,
      data: employe.id,
    };
  } catch (error) {
    console.error("Erreur création employé:", error);
    return {
      success: false,
      error: "Erreur lors de la création de l'employé",
    };
  }
}

/**
 * Mettre a jour un employe
 * Protection: Un ADMIN ne peut pas modifier un SUPER_ADMIN.
 */
export async function updateEmploye(input: UpdateEmployeInput): Promise<ActionResult> {
  try {
    // Verifier les permissions
    const session = await requireAnyRole(["SUPER_ADMIN", "ADMIN"]);
    const supabase = await getAuthClientFromSession(session);

    // Valider les donnees
    const validated = updateEmployeSchema.parse(input);

    // Verifier que l'employé existe (RLS filtre par etablissement_id)
    const existingEmploye = await db.getEmployeById(supabase, validated.id);

    if (!existingEmploye) {
      return {
        success: false,
        error: "Employe non trouve",
      };
    }

    // Protection SUPER_ADMIN: Un ADMIN ne peut pas modifier un SUPER_ADMIN
    if (existingEmploye.role === "SUPER_ADMIN" && session.role !== "SUPER_ADMIN") {
      return {
        success: false,
        error: "Vous n'avez pas l'autorisation de modifier un Super Administrateur",
      };
    }

    // Verifier si l'email est déjà utilisé par un autre utilisateur
    if (validated.email !== existingEmploye.email) {
      const emailExists = await db.emailExists(supabase, validated.email, validated.id);

      if (emailExists) {
        return {
          success: false,
          error: "Cet email est déjà utilisé",
        };
      }
    }

    // Mettre a jour l'employé
    await db.updateEmploye(supabase, validated.id, {
      nom: validated.nom,
      prenom: validated.prenom,
      email: validated.email,
      role: validated.role,
      actif: validated.actif,
    });

    // Logger l'audit
    await db.createAuditLog(supabase, {
      action: "UPDATE",
      entite: "Utilisateur",
      entite_id: validated.id,
      description: `Mise a jour employe ${validated.prenom} ${validated.nom}`,
      utilisateur_id: session.userId,
      etablissement_id: session.etablissementId!,
    });

    revalidatePath("/employes");

    return { success: true };
  } catch (error) {
    console.error("Erreur mise à jour employe:", error);
    return {
      success: false,
      error: "Erreur lors de la mise à jour de l'employé",
    };
  }
}

/**
 * Reset le code PIN d'un employe
 * Protection: Un ADMIN ne peut pas modifier le PIN d'un SUPER_ADMIN.
 */
export async function resetEmployePin(input: ResetPinInput): Promise<ActionResult<string>> {
  try {
    // Verifier les permissions
    const session = await requireAnyRole(["SUPER_ADMIN", "ADMIN"]);
    const supabase = await getAuthClientFromSession(session);

    // Valider les donnees
    const validated = resetPinSchema.parse(input);

    // Verifier que l'employé existe (RLS filtre par etablissement_id)
    const employe = await db.getEmployeById(supabase, validated.employeId);

    if (!employe) {
      return {
        success: false,
        error: "Employe non trouve",
      };
    }

    // Protection SUPER_ADMIN: Un ADMIN ne peut pas modifier le PIN d'un SUPER_ADMIN
    if (employe.role === "SUPER_ADMIN" && session.role !== "SUPER_ADMIN") {
      return {
        success: false,
        error: "Vous n'avez pas l'autorisation de modifier le PIN d'un Super Administrateur",
      };
    }

    // Hasher le nouveau PIN
    const hashedPin = await hashPin(validated.newPin);

    // Mettre a jour
    await db.updateEmployePin(supabase, validated.employeId, hashedPin);

    // Logger l'audit
    await db.createAuditLog(supabase, {
      action: "UPDATE",
      entite: "Utilisateur",
      entite_id: validated.employeId,
      description: `Reset PIN employe ${employe.prenom} ${employe.nom}`,
      utilisateur_id: session.userId,
      etablissement_id: session.etablissementId!,
    });

    revalidatePath("/employes");

    return { success: true };
  } catch (error) {
    console.error("Erreur reset PIN:", error);
    return {
      success: false,
      error: "Erreur lors du reset du PIN",
    };
  }
}

/**
 * Reset le mot de passe d'un employe
 *
 * Met a jour le mot de passe dans Supabase Auth ET dans la table utilisateurs.
 * Protection: Un ADMIN ne peut pas modifier le mot de passe d'un SUPER_ADMIN.
 */
export async function resetEmployePassword(input: ResetPasswordInput): Promise<ActionResult> {
  try {
    // Verifier les permissions
    const session = await requireAnyRole(["SUPER_ADMIN", "ADMIN"]);
    const supabase = await getAuthClientFromSession(session);

    // Valider les donnees
    const validated = resetPasswordSchema.parse(input);

    // Verifier que l'employé existe (RLS filtre par etablissement_id)
    const employe = await db.getEmployeById(supabase, validated.employeId);

    if (!employe) {
      return {
        success: false,
        error: "Employe non trouve",
      };
    }

    // Protection SUPER_ADMIN: Un ADMIN ne peut pas modifier le mot de passe d'un SUPER_ADMIN
    if (employe.role === "SUPER_ADMIN" && session.role !== "SUPER_ADMIN") {
      return {
        success: false,
        error:
          "Vous n'avez pas l'autorisation de modifier le mot de passe d'un Super Administrateur",
      };
    }

    // 1. Mettre a jour le mot de passe dans Supabase Auth
    // L'id utilisateur est le même que l'id auth (sync trigger)
    const adminSupabase = createServiceClient();
    const { error: updateAuthError } = await adminSupabase.auth.admin.updateUserById(
      validated.employeId,
      { password: validated.newPassword }
    );

    if (updateAuthError) {
      console.error("Erreur update password Supabase Auth:", updateAuthError);
      // Continuer meme si Supabase echoue (fallback table utilisateurs)
    }

    // 3. Hasher le nouveau mot de passe
    const hashedPassword = await hashPassword(validated.newPassword);

    // 4. Mettre a jour dans la table utilisateurs
    await db.updateEmployePassword(supabase, validated.employeId, hashedPassword);

    // 5. Logger l'audit
    await db.createAuditLog(supabase, {
      action: "UPDATE",
      entite: "Utilisateur",
      entite_id: validated.employeId,
      description: `Reset mot de passe employe ${employe.prenom} ${employe.nom}`,
      utilisateur_id: session.userId,
      etablissement_id: session.etablissementId!,
    });

    revalidatePath("/employes");

    return { success: true };
  } catch (error) {
    console.error("Erreur reset mot de passe:", error);
    return {
      success: false,
      error: "Erreur lors du reset du mot de passe",
    };
  }
}

/**
 * Activer/Désactiver un employé
 */
export async function toggleEmployeStatus(input: ToggleStatusInput): Promise<ActionResult> {
  try {
    // Verifier les permissions
    const session = await requireAnyRole(["SUPER_ADMIN", "ADMIN"]);
    const supabase = await getAuthClientFromSession(session);

    // Valider les donnees
    const validated = toggleStatusSchema.parse(input);

    // Verifier que l'employé existe (RLS filtre par etablissement_id)
    const employe = await db.getEmployeById(supabase, validated.employeId);

    if (!employe) {
      return {
        success: false,
        error: "Employe non trouve",
      };
    }

    // Empecher la desactivation de son propre compte
    if (validated.employeId === session.userId && !validated.actif) {
      return {
        success: false,
        error: "Vous ne pouvez pas desactiver votre propre compte",
      };
    }

    // Protection SUPER_ADMIN: Un ADMIN ne peut pas activer/desactiver un SUPER_ADMIN
    if (employe.role === "SUPER_ADMIN" && session.role !== "SUPER_ADMIN") {
      return {
        success: false,
        error: "Vous n'avez pas l'autorisation de modifier le statut d'un Super Administrateur",
      };
    }

    // Mettre a jour le statut
    await db.updateEmploye(supabase, validated.employeId, {
      actif: validated.actif,
    });

    // Logger l'audit
    await db.createAuditLog(supabase, {
      action: "UPDATE",
      entite: "Utilisateur",
      entite_id: validated.employeId,
      description: `${validated.actif ? "Activation" : "Desactivation"} employe ${employe.prenom} ${employe.nom}`,
      utilisateur_id: session.userId,
      etablissement_id: session.etablissementId!,
    });

    revalidatePath("/employes");

    return { success: true };
  } catch (error) {
    console.error("Erreur toggle statut:", error);
    return {
      success: false,
      error: "Erreur lors du changement de statut",
    };
  }
}

/**
 * Supprimer un employe
 *
 * Supprime l'utilisateur de Supabase Auth ET de la table utilisateurs.
 */
export async function deleteEmploye(employeId: string): Promise<ActionResult> {
  try {
    // Verifier les permissions
    const session = await requireAnyRole(["SUPER_ADMIN", "ADMIN"]);
    const supabase = await getAuthClientFromSession(session);

    // Verifier que l'employé existe (RLS filtre par etablissement_id)
    const employe = await db.getEmployeById(supabase, employeId);

    if (!employe) {
      return {
        success: false,
        error: "Employe non trouve",
      };
    }

    // Empecher la suppression de son propre compte
    if (employeId === session.userId) {
      return {
        success: false,
        error: "Vous ne pouvez pas supprimer votre propre compte",
      };
    }

    // Protection SUPER_ADMIN: On ne peut jamais supprimer un SUPER_ADMIN
    if (employe.role === "SUPER_ADMIN") {
      return {
        success: false,
        error:
          "Le compte Super Administrateur ne peut pas être supprimé. Vous pouvez le désactiver si nécessaire.",
      };
    }

    // Verifier s'il a des ventes associees (RLS filtre par etablissement_id)
    const { count: userVentesCount } = await supabase
      .from("ventes")
      .select("*", { count: "exact", head: true })
      .eq("utilisateur_id", employeId);

    if ((userVentesCount ?? 0) > 0) {
      return {
        success: false,
        error: `Cet employe a ${userVentesCount} vente(s) associee(s). Desactivez le compte plutot que de le supprimer.`,
      };
    }

    // 1. Supprimer de Supabase Auth
    // L'id utilisateur est le même que l'id auth (sync trigger)
    const adminSupabase = createServiceClient();
    const { error: deleteAuthError } = await adminSupabase.auth.admin.deleteUser(employeId);

    if (deleteAuthError) {
      console.error("Erreur suppression Supabase Auth:", deleteAuthError);
      // Continuer meme si Supabase echoue
    }

    // 2. Supprimer de la table utilisateurs
    await db.deleteEmploye(supabase, employeId);

    // 3. Logger l'audit
    await db.createAuditLog(supabase, {
      action: "DELETE",
      entite: "Utilisateur",
      entite_id: employeId,
      description: `Suppression employe ${employe.prenom} ${employe.nom}`,
      utilisateur_id: session.userId,
      etablissement_id: session.etablissementId!,
    });

    revalidatePath("/employes");

    return { success: true };
  } catch (error) {
    console.error("Erreur suppression employé:", error);
    return {
      success: false,
      error: "Erreur lors de la suppression de l'employé",
    };
  }
}

/**
 * Synchroniser un employe existant avec Supabase Auth
 *
 * Cree le compte Supabase Auth pour un utilisateur qui n'en a pas.
 * Utilise pour les utilisateurs crees avant l'integration Supabase.
 */
export async function syncEmployeToSupabase(
  employeId: string,
  password: string
): Promise<ActionResult> {
  try {
    // Verifier les permissions
    const session = await requireAnyRole(["SUPER_ADMIN", "ADMIN"]);
    const supabase = await getAuthClientFromSession(session);

    // Verifier que l'employé existe (RLS filtre par etablissement_id)
    const employe = await db.getEmployeById(supabase, employeId);

    if (!employe) {
      return {
        success: false,
        error: "Employe non trouve",
      };
    }

    // Verifier si l'utilisateur existe déjà dans Supabase Auth
    // L'id utilisateur est le même que l'id auth (sync trigger)
    const adminSupabase = createServiceClient();
    const { data: existingAuthUser, error: getUserError } =
      await adminSupabase.auth.admin.getUserById(employeId);

    if (!getUserError && existingAuthUser?.user) {
      return {
        success: false,
        error: "Cet utilisateur existe déjà dans Supabase Auth",
      };
    }

    // Creer l'utilisateur dans Supabase Auth
    const { data: authData, error: createError } = await adminSupabase.auth.admin.createUser({
      email: employe.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        nom: employe.nom,
        prenom: employe.prenom,
        role: employe.role,
      },
    });

    if (createError) {
      return {
        success: false,
        error: `Erreur création Supabase Auth: ${createError.message}`,
      };
    }

    // Mettre a jour le mot de passe dans la table aussi
    const hashedPassword = await hashPassword(password);
    await db.updateEmployePassword(supabase, employeId, hashedPassword);

    // Logger l'audit
    await db.createAuditLog(supabase, {
      action: "UPDATE",
      entite: "Utilisateur",
      entite_id: employeId,
      description: `Synchronisation Supabase Auth employe ${employe.prenom} ${employe.nom}`,
      utilisateur_id: session.userId,
      etablissement_id: session.etablissementId!,
    });

    return { success: true };
  } catch (error) {
    console.error("Erreur sync Supabase:", error);
    return {
      success: false,
      error: "Erreur lors de la synchronisation",
    };
  }
}

/**
 * Statistiques d'un employe
 */
export async function getEmployeStats(employeId: string): Promise<
  ActionResult<{
    totalVentes: number;
    chiffreAffaires: number;
    panierMoyen: number;
    ventesAujourdhui: number;
    caAujourdhui: number;
  }>
> {
  try {
    const session = await requireAuth();
    const supabase = await getAuthClientFromSession(session);

    // Verifier que l'employé existe (RLS filtre par etablissement_id)
    const employe = await db.getEmployeById(supabase, employeId);

    if (!employe) {
      return {
        success: false,
        error: "Employe non trouve",
      };
    }

    // Debut du jour
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Stats globales - ventes payées de cet employé
    const { data: ventesGlobales } = await supabase
      .from("ventes")
      .select("total_final")
      .eq("utilisateur_id", employeId)
      .eq("statut", "PAYEE");

    const totalVentes = ventesGlobales?.length ?? 0;
    const chiffreAffaires = (ventesGlobales ?? []).reduce(
      (sum, v) => sum + Number(v.total_final),
      0
    );
    const panierMoyen = totalVentes > 0 ? Math.round(chiffreAffaires / totalVentes) : 0;

    // Stats du jour
    const { data: ventesJour } = await supabase
      .from("ventes")
      .select("total_final")
      .eq("utilisateur_id", employeId)
      .eq("statut", "PAYEE")
      .gte("created_at", todayISO);

    const ventesAujourdhui = ventesJour?.length ?? 0;
    const caAujourdhui = (ventesJour ?? []).reduce((sum, v) => sum + Number(v.total_final), 0);

    return {
      success: true,
      data: {
        totalVentes,
        chiffreAffaires,
        panierMoyen,
        ventesAujourdhui,
        caAujourdhui,
      },
    };
  } catch (error) {
    console.error("Erreur statistiques employe:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération des statistiques",
    };
  }
}

/**
 * Mettre a jour les pages autorisees pour un employe
 * Permet aux admins de restreindre l'acces a certaines pages
 */
// ============= Gestion des pages par rôle =============

/**
 * Récupérer la configuration des pages autorisées par rôle
 */
export async function getRoleAllowedRoutes(): Promise<
  ActionResult<Record<string, string[] | null>>
> {
  try {
    const session = await requireAnyRole(["SUPER_ADMIN", "ADMIN"]);
    if (!session.etablissementId) return { success: false, error: "Aucun établissement associé" };
    const { getAllRoleAllowedRoutes } = await import("@/lib/permissions-db");
    const config = await getAllRoleAllowedRoutes(session.etablissementId);
    return { success: true, data: config };
  } catch (error) {
    console.error("Erreur récupération config pages par rôle:", error);
    return { success: false, error: "Erreur lors de la récupération" };
  }
}

/**
 * Sauvegarder les pages autorisées pour un rôle
 */
export async function saveRoleAllowedRoutes(input: {
  role: "MANAGER" | "CAISSIER" | "SERVEUR";
  allowedRoutes: string[] | null;
}): Promise<ActionResult> {
  try {
    const session = await requireAnyRole(["SUPER_ADMIN", "ADMIN"]);
    if (!session.etablissementId) return { success: false, error: "Aucun établissement associé" };
    const supabase = await getAuthClientFromSession(session);

    const { saveAllowedRoutesForRole } = await import("@/lib/permissions-db");
    await saveAllowedRoutesForRole(input.role, input.allowedRoutes, session.etablissementId);

    // Logger l'audit
    await db.createAuditLog(supabase, {
      action: "UPDATE",
      entite: "RolePermission",
      entite_id: input.role,
      description: `Modification des pages autorisées pour le rôle ${input.role} (${input.allowedRoutes ? input.allowedRoutes.length + " pages" : "accès standard"})`,
      utilisateur_id: session.userId,
      etablissement_id: session.etablissementId!,
    });

    revalidatePath("/employes");
    return { success: true };
  } catch (error) {
    console.error("Erreur sauvegarde pages par rôle:", error);
    return { success: false, error: "Erreur lors de la sauvegarde" };
  }
}

// ============= Gestion des pages par utilisateur =============

/**
 * Mettre a jour les pages autorisees pour un employe
 * Permet aux admins de restreindre l'acces a certaines pages
 */
export async function updateEmployeAllowedRoutes(input: {
  employeId: string;
  allowedRoutes: string[];
}): Promise<ActionResult> {
  try {
    // Verifier les permissions (seuls les admins peuvent modifier les acces)
    const session = await requireAnyRole(["SUPER_ADMIN", "ADMIN"]);
    const supabase = await getAuthClientFromSession(session);

    // Verifier que l'employé existe (RLS filtre par etablissement_id)
    const employe = await db.getEmployeById(supabase, input.employeId);

    if (!employe) {
      return {
        success: false,
        error: "Employe non trouve",
      };
    }

    // Ne pas permettre la modification des accès pour les admins
    if (employe.role === "SUPER_ADMIN" || employe.role === "ADMIN") {
      return {
        success: false,
        error: "Les administrateurs ont acces a toutes les pages par defaut",
      };
    }

    // Mettre a jour les allowed_routes
    const { error: updateError } = await supabase
      .from("utilisateurs")
      .update({ allowed_routes: input.allowedRoutes })
      .eq("id", input.employeId);

    if (updateError) {
      console.error("Erreur update allowed_routes:", updateError);
      return {
        success: false,
        error: "Erreur lors de la mise à jour des accès",
      };
    }

    // Logger l'audit
    await db.createAuditLog(supabase, {
      action: "UPDATE",
      entite: "Utilisateur",
      entite_id: input.employeId,
      description: `Modification des pages autorisees pour ${employe.prenom} ${employe.nom} (${input.allowedRoutes.length} pages)`,
      utilisateur_id: session.userId,
      etablissement_id: session.etablissementId!,
    });

    revalidatePath("/employes");

    return { success: true };
  } catch (error) {
    console.error("Erreur mise à jour allowed_routes:", error);
    return {
      success: false,
      error: "Erreur lors de la mise à jour des accès",
    };
  }
}
