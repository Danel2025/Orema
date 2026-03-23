"use server";

/**
 * Actions pour synchroniser Supabase Auth et la table utilisateurs
 */

import { createServiceClient } from "@/lib/db";
import { requireAnyRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

type SyncResult = {
  synced: number;
  skipped: number;
  errors: string[];
};

/**
 * Synchronise les utilisateurs de Supabase Auth vers la table utilisateurs
 * Crée les entrées manquantes dans la table utilisateurs
 */
export async function syncAuthToUtilisateurs(): Promise<ActionResult<SyncResult>> {
  try {
    // Vérifier les permissions (SUPER_ADMIN uniquement)
    const session = await requireAnyRole(["SUPER_ADMIN"]);
    if (!session.etablissementId) return { success: false, error: "Aucun établissement associé" };

    const supabase = createServiceClient();
    const adminSupabase = createServiceClient();

    // Récupérer tous les utilisateurs de Supabase Auth
    const { data: authUsers, error: authError } = await adminSupabase.auth.admin.listUsers();

    if (authError) {
      return { success: false, error: `Erreur Supabase Auth: ${authError.message}` };
    }

    // Récupérer tous les utilisateurs de la table utilisateurs
    const { data: dbUsers, error: dbError } = await supabase.from("utilisateurs").select("email");

    if (dbError) {
      return { success: false, error: `Erreur DB: ${dbError.message}` };
    }

    const existingEmails = new Set((dbUsers ?? []).map((u) => u.email.toLowerCase()));

    let synced = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const authUser of authUsers.users) {
      if (!authUser.email) {
        skipped++;
        continue;
      }

      const emailLower = authUser.email.toLowerCase();

      // Vérifier si l'utilisateur existe déjà dans la table
      if (existingEmails.has(emailLower)) {
        skipped++;
        continue;
      }

      // Créer l'utilisateur dans la table utilisateurs
      const metadata = authUser.user_metadata || {};
      const { error: insertError } = await supabase.from("utilisateurs").insert({
        email: authUser.email,
        nom: metadata.nom || "À définir",
        prenom: metadata.prenom || "",
        role: metadata.role || "CAISSIER",
        actif: true,
        etablissement_id: session.etablissementId,
        password: null, // Pas de mot de passe local, utilise Supabase Auth
      });

      if (insertError) {
        errors.push(`${authUser.email}: ${insertError.message}`);
      } else {
        synced++;
        console.log(`[Sync] Utilisateur créé: ${authUser.email}`);
      }
    }

    revalidatePath("/employes");

    return {
      success: true,
      data: { synced, skipped, errors },
    };
  } catch (error) {
    console.error("Erreur synchronisation:", error);
    return { success: false, error: "Erreur lors de la synchronisation" };
  }
}

/**
 * Synchronise un utilisateur spécifique de la table utilisateurs vers Supabase Auth
 * Crée le compte Supabase Auth s'il n'existe pas
 */
export async function syncUtilisateurToAuth(
  utilisateurId: string,
  password: string
): Promise<ActionResult> {
  try {
    const session = await requireAnyRole(["SUPER_ADMIN", "ADMIN"]);
    const supabase = createServiceClient();
    const adminSupabase = createServiceClient();

    // Récupérer l'utilisateur de la table
    const { data: utilisateur, error: userError } = await supabase
      .from("utilisateurs")
      .select("*")
      .eq("id", utilisateurId)
      .single();

    if (userError || !utilisateur) {
      return { success: false, error: "Utilisateur non trouvé" };
    }

    if (utilisateur.etablissement_id !== session.etablissementId) {
      return { success: false, error: "Accès non autorisé" };
    }

    // Vérifier si l'utilisateur existe déjà dans Supabase Auth
    const { data: authUsers } = await adminSupabase.auth.admin.listUsers();
    const existingAuthUser = authUsers?.users.find(
      (u) => u.email?.toLowerCase() === utilisateur.email.toLowerCase()
    );

    if (existingAuthUser) {
      return { success: false, error: "Cet utilisateur existe déjà dans Supabase Auth" };
    }

    // Créer l'utilisateur dans Supabase Auth
    const { error: createError } = await adminSupabase.auth.admin.createUser({
      email: utilisateur.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        role: utilisateur.role,
      },
    });

    if (createError) {
      return { success: false, error: `Erreur Supabase Auth: ${createError.message}` };
    }

    console.log(`[Sync] Utilisateur Supabase Auth créé: ${utilisateur.email}`);

    return { success: true };
  } catch (error) {
    console.error("Erreur sync vers Auth:", error);
    return { success: false, error: "Erreur lors de la synchronisation" };
  }
}

/**
 * Vérifie l'état de synchronisation entre Supabase Auth et la table utilisateurs
 */
export async function checkSyncStatus(): Promise<
  ActionResult<{
    authOnly: string[];
    dbOnly: string[];
    synced: string[];
  }>
> {
  try {
    await requireAnyRole(["SUPER_ADMIN", "ADMIN"]);

    const supabase = createServiceClient();
    const adminSupabase = createServiceClient();

    // Récupérer les utilisateurs des deux sources
    const { data: authUsers } = await adminSupabase.auth.admin.listUsers();
    const { data: dbUsers } = await supabase.from("utilisateurs").select("email");

    const authEmails = new Set(
      (authUsers?.users ?? []).filter((u) => u.email).map((u) => u.email!.toLowerCase())
    );
    const dbEmails = new Set((dbUsers ?? []).map((u) => u.email.toLowerCase()));

    const authOnly: string[] = [];
    const dbOnly: string[] = [];
    const synced: string[] = [];

    // Utilisateurs dans Auth mais pas dans DB
    for (const email of authEmails) {
      if (dbEmails.has(email)) {
        synced.push(email);
      } else {
        authOnly.push(email);
      }
    }

    // Utilisateurs dans DB mais pas dans Auth
    for (const email of dbEmails) {
      if (!authEmails.has(email)) {
        dbOnly.push(email);
      }
    }

    return {
      success: true,
      data: { authOnly, dbOnly, synced },
    };
  } catch (error) {
    console.error("Erreur vérification sync:", error);
    return { success: false, error: "Erreur lors de la vérification" };
  }
}
