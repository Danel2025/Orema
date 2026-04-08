"use server";

/**
 * Server Actions pour le module d'avis clients
 *
 * - getAvisAction : liste paginée des avis (auth requise)
 * - createAvisAction : création d'un avis (public, pas d'auth)
 * - analyserAvisAction : déclenche l'analyse IA (auth gérant)
 * - genererQuestionsAction : génère des questions IA (auth gérant)
 * - repondreAvisAction : génère une réponse IA à un avis (auth gérant)
 * - publierReponseAction : publie une réponse (auth gérant)
 */

import { revalidatePath } from "next/cache";
import { createAuthenticatedClient, db } from "@/lib/db";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { runAvisAI } from "@/lib/orema-avis";
import type { AvisData } from "@/lib/orema-avis";
import {
  avisSchema,
  type AvisFormData,
} from "@/schemas/avis.schema";
import { z } from "zod";

// ============================================================================
// Schémas de validation locaux pour les actions
// ============================================================================

const avisFilterSchema = z.object({
  note_min: z.coerce.number().int().min(1).max(5).optional(),
  note_max: z.coerce.number().int().min(1).max(5).optional(),
  date_debut: z.string().optional(),
  date_fin: z.string().optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

const repondreSchema = z.object({
  avis_id: z.string().uuid("ID avis invalide"),
  ton_reponse: z.enum(["professionnel", "chaleureux", "empathique"]),
});

const genererQuestionsSchema = z.object({
  cible: z.enum(["client_restaurant", "gerant_outil"]),
  contexte: z
    .string()
    .min(5, "Le contexte doit contenir au moins 5 caractères")
    .max(500)
    .transform((val) => val.trim()),
  ton: z.enum(["formel", "decontracte", "chaleureux"]),
  nb_questions: z.coerce.number().int().min(1).max(10),
});

const publierReponseSchema = z.object({
  reponse_id: z.string().uuid("ID réponse invalide"),
});

// ============================================================================
// Actions
// ============================================================================

/**
 * Récupère la liste paginée des avis d'un établissement
 */
export async function getAvisAction(
  etablissementId: string,
  filters?: {
    note_min?: number;
    note_max?: number;
    date_debut?: string;
    date_fin?: string;
    search?: string;
    page?: number;
    limit?: number;
  }
) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) {
    return { data: [], count: 0, page: 1, pageSize: 20, totalPages: 0 };
  }

  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId: user.etablissementId,
    role: user.role,
  });

  const validated = avisFilterSchema.safeParse(filters ?? {});
  const parsedFilters = validated.success ? validated.data : {};

  const result = await db.getAvisByEtablissement(
    supabase,
    user.etablissementId,
    parsedFilters
  );

  return result;
}

/**
 * Crée un nouvel avis (accessible publiquement — pas d'auth requise)
 */
export async function createAvisAction(data: AvisFormData & { etablissement_id: string }) {
  try {
    // Validation Zod avec le schéma du module avis
    const validated = avisSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Données invalides",
      };
    }

    // Valider l'ID établissement séparément
    const etablissementId = z.string().uuid().safeParse(data.etablissement_id);
    if (!etablissementId.success) {
      return { success: false, error: "ID établissement invalide" };
    }

    // Utiliser le service client (pas d'auth requise pour les avis publics)
    const supabase = createServiceClient();

    const avis = await db.createAvis(supabase, {
      etablissement_id: etablissementId.data,
      client_prenom: validated.data.client_prenom || null,
      note: validated.data.note,
      contenu: validated.data.contenu,
      type_repas: validated.data.type_repas || null,
    });

    return {
      success: true,
      data: avis,
    };
  } catch (error) {
    console.error("[createAvisAction] Erreur:", error);
    return {
      success: false,
      error: "Erreur lors de l'envoi de l'avis",
    };
  }
}

/**
 * Déclenche l'analyse IA des avis d'un établissement
 */
export async function analyserAvisAction(
  etablissementId: string,
  periode?: string
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) {
      return { success: false, error: "Vous devez être connecté" };
    }

    // Vérifier que l'utilisateur est au moins manager
    if (!["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user.role)) {
      return { success: false, error: "Permissions insuffisantes" };
    }

    const supabase = await createAuthenticatedClient({
      userId: user.userId,
      etablissementId: user.etablissementId,
      role: user.role,
    });

    // Récupérer les avis pour l'analyse (derniers 100 max)
    const result = await db.getAvisByEtablissement(supabase, user.etablissementId, {
      limit: 100,
      page: 1,
    });

    if (result.data.length === 0) {
      return {
        success: false,
        error: "Aucun avis à analyser pour cette période",
      };
    }

    // Préparer les données pour l'IA
    const avisData: AvisData[] = result.data.map((a) => ({
      id: a.id,
      note: a.note,
      contenu: a.contenu,
      date: a.created_at,
      prenom_client: a.client_prenom,
    }));

    // Appeler l'IA
    const analyse = await runAvisAI({
      mode: "analyse",
      avis: avisData,
      periode,
    });

    // Sauvegarder l'analyse en base
    const saved = await db.saveAvisAnalyse(supabase, {
      etablissement_id: user.etablissementId,
      periode: analyse.periode,
      total_avis: analyse.total_avis,
      note_moyenne: analyse.note_moyenne,
      points_forts: analyse.points_forts,
      points_faibles: analyse.points_faibles,
      tendance: analyse.tendance,
      avis_notables: analyse.avis_notables,
      actions_recommandees: analyse.actions_recommandees,
    });

    revalidatePath("/avis");

    return {
      success: true,
      data: saved,
    };
  } catch (error) {
    console.error("[analyserAvisAction] Erreur:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de l'analyse des avis",
    };
  }
}

/**
 * Génère des questions personnalisées via l'IA
 */
export async function genererQuestionsAction(params: {
  cible: "client_restaurant" | "gerant_outil";
  contexte: string;
  ton: "formel" | "decontracte" | "chaleureux";
  nb_questions: number;
}) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) {
      return { success: false, error: "Vous devez être connecté" };
    }

    if (!["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user.role)) {
      return { success: false, error: "Permissions insuffisantes" };
    }

    // Validation
    const validated = genererQuestionsSchema.safeParse(params);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Données invalides",
      };
    }

    // Appeler l'IA
    const questions = await runAvisAI({
      mode: "questions",
      params: validated.data,
    });

    // Sauvegarder les questions en base
    const supabase = await createAuthenticatedClient({
      userId: user.userId,
      etablissementId: user.etablissementId,
      role: user.role,
    });

    const questionsToInsert = questions.map((q) => ({
      etablissement_id: user.etablissementId!,
      question: q.question,
      type: q.type,
      options: q.options,
      cible: validated.data.cible,
      contexte: validated.data.contexte,
    }));

    const saved = await db.saveAvisQuestions(supabase, questionsToInsert);

    revalidatePath("/avis");

    return {
      success: true,
      data: saved,
    };
  } catch (error) {
    console.error("[genererQuestionsAction] Erreur:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la génération des questions",
    };
  }
}

/**
 * Génère une réponse IA à un avis client
 */
export async function repondreAvisAction(
  avisId: string,
  tonReponse: "professionnel" | "chaleureux" | "empathique"
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) {
      return { success: false, error: "Vous devez être connecté" };
    }

    if (!["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user.role)) {
      return { success: false, error: "Permissions insuffisantes" };
    }

    // Validation
    const validated = repondreSchema.safeParse({ avis_id: avisId, ton_reponse: tonReponse });
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Données invalides",
      };
    }

    const supabase = await createAuthenticatedClient({
      userId: user.userId,
      etablissementId: user.etablissementId,
      role: user.role,
    });

    // Récupérer l'avis
    const avis = await db.getAvisById(supabase, validated.data.avis_id);
    if (!avis) {
      return { success: false, error: "Avis non trouvé" };
    }

    // Récupérer le nom de l'établissement
    const etablissement = await db.getEtablissementById(supabase, user.etablissementId);
    if (!etablissement) {
      return { success: false, error: "Établissement non trouvé" };
    }

    // Appeler l'IA
    const reponseIA = await runAvisAI({
      mode: "reponse",
      params: {
        nom_etablissement: etablissement.nom,
        prenom_client: avis.client_prenom || "Client",
        note: avis.note,
        contenu_avis: avis.contenu,
        ton_reponse: validated.data.ton_reponse,
      },
    });

    // Sauvegarder la réponse en base
    const saved = await db.saveAvisReponse(supabase, {
      avis_id: validated.data.avis_id,
      contenu: reponseIA.reponse,
      ton_detecte: reponseIA.ton_detecte,
    });

    revalidatePath("/avis");

    return {
      success: true,
      data: saved,
    };
  } catch (error) {
    console.error("[repondreAvisAction] Erreur:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la génération de la réponse",
    };
  }
}

/**
 * Publie une réponse à un avis (la rend visible publiquement)
 */
export async function publierReponseAction(reponseId: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) {
      return { success: false, error: "Vous devez être connecté" };
    }

    if (!["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user.role)) {
      return { success: false, error: "Permissions insuffisantes" };
    }

    const validated = publierReponseSchema.safeParse({ reponse_id: reponseId });
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Données invalides",
      };
    }

    const supabase = await createAuthenticatedClient({
      userId: user.userId,
      etablissementId: user.etablissementId,
      role: user.role,
    });

    const updated = await db.publierAvisReponse(supabase, validated.data.reponse_id);

    revalidatePath("/avis");

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    console.error("[publierReponseAction] Erreur:", error);
    return {
      success: false,
      error: "Erreur lors de la publication de la réponse",
    };
  }
}

/**
 * Récupère la dernière analyse IA d'un établissement
 */
export async function getLatestAnalyseAction() {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) {
    return null;
  }

  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId: user.etablissementId,
    role: user.role,
  });

  return db.getLatestAvisAnalyse(supabase, user.etablissementId);
}

/**
 * Récupère les questions d'un établissement
 */
export async function getQuestionsAction(options?: { actif?: boolean; cible?: string }) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) {
    return [];
  }

  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId: user.etablissementId,
    role: user.role,
  });

  return db.getAvisQuestions(supabase, user.etablissementId, options);
}
