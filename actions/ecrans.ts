"use server";

/**
 * Server Actions pour la gestion des écrans d'affichage (cuisine/bar)
 * Gère le CRUD, la génération de tokens et la validation
 */

import { revalidatePath } from "next/cache";
import { createAuthenticatedClient } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Rôles autorisés à gérer les écrans
const ROLES_GESTION_ECRANS = ["SUPER_ADMIN", "ADMIN", "MANAGER"] as const;

function canManageEcrans(role: string): boolean {
  return (ROLES_GESTION_ECRANS as readonly string[]).includes(role);
}

/** Génère un token aléatoire sécurisé */
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 48);
}

/** Calcule la date d'expiration (7 jours par défaut) */
function getExpirationDate(days: number = 7): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export type TypeEcran = "CUISINE" | "BAR" | "PERSONNALISE";

export interface EcranAffichage {
  id: string;
  nom: string;
  type: TypeEcran;
  token: string;
  token_expires_at: string;
  categories: string[] | null;
  son_actif: boolean;
  delai_urgence_minutes: number;
  etablissement_id: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateEcranData {
  nom: string;
  type: TypeEcran;
  categories?: string[] | null;
  son_actif?: boolean;
  delai_urgence_minutes?: number;
}

export interface UpdateEcranData {
  nom?: string;
  type?: TypeEcran;
  categories?: string[] | null;
  son_actif?: boolean;
  delai_urgence_minutes?: number;
  actif?: boolean;
}

/**
 * Récupère tous les écrans de l'établissement
 */
export async function getEcrans(): Promise<
  { success: true; data: EcranAffichage[] } | { success: false; error: string }
> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) {
      return { success: false, error: "Vous devez être connecté" };
    }

    const supabase = await createAuthenticatedClient({
      userId: user.userId,
      etablissementId: user.etablissementId,
      role: user.role,
    });

    const { data, error } = await supabase
      .from("ecrans_affichage")
      .select("*")
      .eq("etablissement_id", user.etablissementId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getEcrans] Error:", error);
      return { success: false, error: "Erreur lors de la récupération des écrans" };
    }

    return { success: true, data: (data ?? []) as EcranAffichage[] };
  } catch (error) {
    console.error("[getEcrans] Error:", error);
    return { success: false, error: "Erreur lors de la récupération des écrans" };
  }
}

/**
 * Récupère un écran par son ID
 */
export async function getEcranById(
  id: string
): Promise<{ success: true; data: EcranAffichage } | { success: false; error: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) {
      return { success: false, error: "Vous devez être connecté" };
    }

    const supabase = await createAuthenticatedClient({
      userId: user.userId,
      etablissementId: user.etablissementId,
      role: user.role,
    });

    const { data, error } = await supabase
      .from("ecrans_affichage")
      .select("*")
      .eq("id", id)
      .eq("etablissement_id", user.etablissementId)
      .single();

    if (error || !data) {
      return { success: false, error: "Écran non trouvé" };
    }

    return { success: true, data: data as EcranAffichage };
  } catch (error) {
    console.error("[getEcranById] Error:", error);
    return { success: false, error: "Erreur lors de la récupération de l'écran" };
  }
}

/**
 * Crée un nouvel écran avec token auto-généré
 */
export async function createEcran(
  input: CreateEcranData
): Promise<{ success: true; data: EcranAffichage } | { success: false; error: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) {
      return { success: false, error: "Vous devez être connecté" };
    }
    if (!canManageEcrans(user.role)) {
      return { success: false, error: "Permissions insuffisantes" };
    }

    // Validation basique
    if (!input.nom || input.nom.trim().length < 2) {
      return { success: false, error: "Le nom doit contenir au moins 2 caractères" };
    }
    if (!["CUISINE", "BAR", "PERSONNALISE"].includes(input.type)) {
      return { success: false, error: "Type d'écran invalide" };
    }

    const supabase = await createAuthenticatedClient({
      userId: user.userId,
      etablissementId: user.etablissementId,
      role: user.role,
    });

    const token = generateToken();
    const tokenExpiresAt = getExpirationDate(7);

    const { data, error } = await supabase
      .from("ecrans_affichage")
      .insert({
        nom: input.nom.trim(),
        type: input.type,
        token,
        token_expires_at: tokenExpiresAt,
        categories: input.categories ?? null,
        son_actif: input.son_actif ?? true,
        delai_urgence_minutes: input.delai_urgence_minutes ?? 15,
        etablissement_id: user.etablissementId,
        actif: true,
      })
      .select()
      .single();

    if (error) {
      console.error("[createEcran] Error:", error);
      return { success: false, error: "Erreur lors de la création de l'écran" };
    }

    revalidatePath("/parametres");

    return { success: true, data: data as EcranAffichage };
  } catch (error) {
    console.error("[createEcran] Error:", error);
    return { success: false, error: "Erreur lors de la création de l'écran" };
  }
}

/**
 * Met à jour un écran
 */
export async function updateEcran(
  id: string,
  input: UpdateEcranData
): Promise<{ success: true; data: EcranAffichage } | { success: false; error: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) {
      return { success: false, error: "Vous devez être connecté" };
    }
    if (!canManageEcrans(user.role)) {
      return { success: false, error: "Permissions insuffisantes" };
    }

    const supabase = await createAuthenticatedClient({
      userId: user.userId,
      etablissementId: user.etablissementId,
      role: user.role,
    });

    // Vérifier que l'écran existe et appartient à l'établissement
    const { data: existing } = await supabase
      .from("ecrans_affichage")
      .select("id")
      .eq("id", id)
      .eq("etablissement_id", user.etablissementId)
      .single();

    if (!existing) {
      return { success: false, error: "Écran non trouvé" };
    }

    // Construire les données de mise à jour
    const updateData: Record<string, unknown> = {};
    if (input.nom !== undefined) updateData.nom = input.nom.trim();
    if (input.type !== undefined) updateData.type = input.type;
    if (input.categories !== undefined) updateData.categories = input.categories;
    if (input.son_actif !== undefined) updateData.son_actif = input.son_actif;
    if (input.delai_urgence_minutes !== undefined)
      updateData.delai_urgence_minutes = input.delai_urgence_minutes;
    if (input.actif !== undefined) updateData.actif = input.actif;

    const { data, error } = await supabase
      .from("ecrans_affichage")
      .update(updateData)
      .eq("id", id)
      .eq("etablissement_id", user.etablissementId)
      .select()
      .single();

    if (error) {
      console.error("[updateEcran] Error:", error);
      return { success: false, error: "Erreur lors de la mise à jour de l'écran" };
    }

    revalidatePath("/parametres");

    return { success: true, data: data as EcranAffichage };
  } catch (error) {
    console.error("[updateEcran] Error:", error);
    return { success: false, error: "Erreur lors de la mise à jour de l'écran" };
  }
}

/**
 * Supprime un écran
 */
export async function deleteEcran(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) {
      return { success: false, error: "Vous devez être connecté" };
    }
    if (!canManageEcrans(user.role)) {
      return { success: false, error: "Permissions insuffisantes" };
    }

    const supabase = await createAuthenticatedClient({
      userId: user.userId,
      etablissementId: user.etablissementId,
      role: user.role,
    });

    const { error } = await supabase
      .from("ecrans_affichage")
      .delete()
      .eq("id", id)
      .eq("etablissement_id", user.etablissementId);

    if (error) {
      console.error("[deleteEcran] Error:", error);
      return { success: false, error: "Erreur lors de la suppression de l'écran" };
    }

    revalidatePath("/parametres");

    return { success: true };
  } catch (error) {
    console.error("[deleteEcran] Error:", error);
    return { success: false, error: "Erreur lors de la suppression de l'écran" };
  }
}

/**
 * Régénère le token d'un écran (nouveau token + nouvelle expiration 7j)
 */
export async function regenererToken(
  id: string
): Promise<{ success: true; data: EcranAffichage } | { success: false; error: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) {
      return { success: false, error: "Vous devez être connecté" };
    }
    if (!canManageEcrans(user.role)) {
      return { success: false, error: "Permissions insuffisantes" };
    }

    const supabase = await createAuthenticatedClient({
      userId: user.userId,
      etablissementId: user.etablissementId,
      role: user.role,
    });

    const newToken = generateToken();
    const newExpiration = getExpirationDate(7);

    const { data, error } = await supabase
      .from("ecrans_affichage")
      .update({
        token: newToken,
        token_expires_at: newExpiration,
      })
      .eq("id", id)
      .eq("etablissement_id", user.etablissementId)
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: "Écran non trouvé" };
    }

    revalidatePath("/parametres");

    return { success: true, data: data as EcranAffichage };
  } catch (error) {
    console.error("[regenererToken] Error:", error);
    return { success: false, error: "Erreur lors de la régénération du token" };
  }
}

/**
 * Prolonge le token d'un écran (ajoute 7 jours à l'expiration)
 */
export async function prolongerToken(
  id: string
): Promise<{ success: true; data: EcranAffichage } | { success: false; error: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) {
      return { success: false, error: "Vous devez être connecté" };
    }
    if (!canManageEcrans(user.role)) {
      return { success: false, error: "Permissions insuffisantes" };
    }

    const supabase = await createAuthenticatedClient({
      userId: user.userId,
      etablissementId: user.etablissementId,
      role: user.role,
    });

    // Récupérer l'écran pour obtenir l'expiration actuelle
    const { data: existing } = await supabase
      .from("ecrans_affichage")
      .select("token_expires_at")
      .eq("id", id)
      .eq("etablissement_id", user.etablissementId)
      .single();

    if (!existing) {
      return { success: false, error: "Écran non trouvé" };
    }

    // Ajouter 7 jours à l'expiration actuelle (ou depuis maintenant si déjà expiré)
    const currentExpiration = new Date(existing.token_expires_at);
    const baseDate = currentExpiration > new Date() ? currentExpiration : new Date();
    baseDate.setDate(baseDate.getDate() + 7);

    const { data, error } = await supabase
      .from("ecrans_affichage")
      .update({
        token_expires_at: baseDate.toISOString(),
      })
      .eq("id", id)
      .eq("etablissement_id", user.etablissementId)
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: "Erreur lors de la prolongation du token" };
    }

    revalidatePath("/parametres");

    return { success: true, data: data as EcranAffichage };
  } catch (error) {
    console.error("[prolongerToken] Error:", error);
    return { success: false, error: "Erreur lors de la prolongation du token" };
  }
}

/**
 * Récupère un écran par son token (pour la page /display)
 * Utilise le service client car pas de session utilisateur
 */
export async function getEcranByToken(
  token: string
): Promise<
  | { success: true; data: EcranAffichage }
  | { success: false; error: string }
> {
  try {
    const { createServiceClient } = await import("@/lib/supabase/server");
    const supabase = createServiceClient();

    const { data, error } = await supabase.rpc("validate_display_token", {
      p_token: token,
    });

    if (error) {
      console.error("[getEcranByToken] RPC Error:", error);
      return { success: false, error: "Erreur de validation du token" };
    }

    const result = data as {
      valid: boolean;
      error?: string;
      id?: string;
      nom?: string;
      type?: string;
      categories?: string[] | null;
      etablissement_id?: string;
      son_actif?: boolean;
      delai_urgence_minutes?: number;
    };

    if (!result.valid) {
      return { success: false, error: result.error || "Token invalide" };
    }

    // Récupérer l'écran complet via service client
    const { data: ecran, error: ecranError } = await supabase
      .from("ecrans_affichage")
      .select("*")
      .eq("id", result.id!)
      .single();

    if (ecranError || !ecran) {
      return { success: false, error: "Écran non trouvé" };
    }

    return { success: true, data: ecran as EcranAffichage };
  } catch (error) {
    console.error("[getEcranByToken] Error:", error);
    return { success: false, error: "Erreur lors de la récupération de l'écran" };
  }
}
