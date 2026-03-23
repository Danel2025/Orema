"use server";

/**
 * Server Action pour l'inscription avec création d'établissement
 *
 * Flow atomique:
 * 1. Vérifier unicité email
 * 2. Créer l'établissement
 * 3. Créer l'utilisateur Supabase Auth
 * 4. Créer l'utilisateur dans la table utilisateurs
 *
 * En cas d'erreur: rollback complet
 */

import { createServiceClient } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/auth/password";
import {
  registerUserSchema,
  registerEtablissementSchema,
  type RegisterUserInput,
  type RegisterEtablissementInput,
} from "@/schemas/register.schema";

type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

type RegisterResult = {
  userId: string;
  etablissementId: string;
};

export async function registerWithEtablissement(
  userInput: RegisterUserInput,
  etablissementInput: RegisterEtablissementInput
): Promise<ActionResult<RegisterResult>> {
  // Variables pour le rollback
  let createdEtablissementId: string | null = null;
  let createdAuthUserId: string | null = null;

  try {
    // Valider les entrées
    const validatedUser = registerUserSchema.parse(userInput);
    const validatedEtablissement = registerEtablissementSchema.parse(etablissementInput);

    // Utiliser le Service Client pour bypasser RLS
    const supabase = createServiceClient();

    // 1. Vérifier unicité de l'email
    const { data: existingUser } = await supabase
      .from("utilisateurs")
      .select("id")
      .eq("email", validatedUser.email)
      .single();

    if (existingUser) {
      return { success: false, error: "Cet email est déjà utilisé" };
    }

    // 2. Créer l'établissement avec valeurs par défaut Gabon
    const { data: etablissement, error: etablissementError } = await supabase
      .from("etablissements")
      .insert({
        nom: validatedEtablissement.nom,
        telephone: validatedEtablissement.telephone || null,
        adresse: validatedEtablissement.adresse || null,
        email: validatedEtablissement.email || validatedUser.email,
        nif: validatedEtablissement.nif || null,
        rccm: validatedEtablissement.rccm || null,
        devise_par: "XAF",
        taux_tva_standard: 18,
        taux_tva_reduit: 10,
        modes_paiement_actifs: ["ESPECES", "CARTE_BANCAIRE", "AIRTEL_MONEY", "MOOV_MONEY"],
      })
      .select("id")
      .single();

    if (etablissementError || !etablissement) {
      console.error("[Register] Erreur création établissement:", etablissementError);
      return { success: false, error: "Erreur lors de la création de l'établissement" };
    }

    createdEtablissementId = etablissement.id;

    // 3. Créer l'utilisateur Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: validatedUser.email,
      password: validatedUser.password,
      email_confirm: true, // Auto-confirme l'email
      user_metadata: {
        nom: validatedUser.nom,
        prenom: validatedUser.prenom,
        role: "ADMIN",
        etablissement_id: etablissement.id,
      },
    });

    if (authError || !authData.user) {
      console.error("[Register] Erreur création auth user:", authError);
      // Rollback: supprimer l'établissement
      await supabase.from("etablissements").delete().eq("id", etablissement.id);
      return { success: false, error: "Erreur lors de la création du compte" };
    }

    createdAuthUserId = authData.user.id;

    // 4. Mettre à jour la table utilisateurs (le trigger auth a déjà créé la ligne)
    const hashedPassword = await hashPassword(validatedUser.password);

    const { error: userError } = await supabase.from("utilisateurs").upsert(
      {
        id: authData.user.id,
        email: validatedUser.email,
        password: hashedPassword,
        nom: validatedUser.nom,
        prenom: validatedUser.prenom,
        role: "ADMIN",
        etablissement_id: etablissement.id,
        actif: true,
      },
      { onConflict: "id" }
    );

    if (userError) {
      console.error("[Register] Erreur création utilisateur:", userError);
      // Rollback complet (inclut l'utilisateur créé par le trigger)
      await supabase.from("utilisateurs").delete().eq("id", authData.user.id);
      await supabase.from("utilisateurs").delete().eq("email", validatedUser.email);
      await supabase.auth.admin.deleteUser(authData.user.id);
      await supabase.from("etablissements").delete().eq("id", etablissement.id);
      return { success: false, error: "Erreur lors de la création de l'utilisateur" };
    }

    // 5. Log d'audit
    await supabase.from("audit_logs").insert({
      action: "CREATE",
      entite: "Utilisateur",
      entite_id: authData.user.id,
      description: `Inscription: ${validatedUser.prenom} ${validatedUser.nom} (ADMIN) - Établissement: ${validatedEtablissement.nom}`,
      utilisateur_id: authData.user.id,
      etablissement_id: etablissement.id,
    });

    return {
      success: true,
      data: {
        userId: authData.user.id,
        etablissementId: etablissement.id,
      },
    };
  } catch (error) {
    console.error("[Register] Erreur inattendue:", error);

    // Rollback en cas d'exception (inclut l'utilisateur créé par le trigger)
    if (createdAuthUserId || createdEtablissementId) {
      try {
        const supabase = createServiceClient();
        // Supprimer l'utilisateur de la table (créé par trigger ou manuellement)
        if (createdAuthUserId) {
          await supabase.from("utilisateurs").delete().eq("id", createdAuthUserId);
          await supabase.auth.admin.deleteUser(createdAuthUserId);
        }
        if (createdEtablissementId) {
          // Supprimer aussi les utilisateurs orphelins liés à cet établissement
          await supabase
            .from("utilisateurs")
            .delete()
            .eq("etablissement_id", createdEtablissementId);
          await supabase.from("etablissements").delete().eq("id", createdEtablissementId);
        }
      } catch (rollbackError) {
        console.error("[Register] Erreur rollback:", rollbackError);
      }
    }

    return { success: false, error: "Une erreur inattendue est survenue" };
  }
}
