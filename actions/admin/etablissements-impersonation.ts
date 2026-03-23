"use server";

/**
 * Server Actions pour l'impersonation d'établissements (SUPER_ADMIN)
 *
 * Permet au SUPER_ADMIN de "se connecter en tant que" un établissement
 * pour voir/gérer ses données comme si c'était l'admin de cet établissement.
 *
 * L'impersonation est stockée via des cookies de session.
 */

import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/lib/auth";
import { logAdminAction } from "@/lib/db/queries/audit-logs";

type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

const IMPERSONATION_COOKIE = "orema-impersonation";

/**
 * Démarrer l'impersonation d'un établissement
 */
export async function startImpersonation(
  etablissementId: string
): Promise<ActionResult<{ etablissementNom: string }>> {
  try {
    const session = await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    // Vérifier que l'établissement existe
    const { data: etabRaw } = await supabase
      .from("etablissements")
      .select("id, nom")
      .eq("id", etablissementId)
      .single();

    if (!etabRaw) {
      return { success: false, error: "Établissement non trouvé" };
    }

    // Stocker l'impersonation dans un cookie
    const cookieStore = await cookies();
    cookieStore.set(IMPERSONATION_COOKIE, JSON.stringify({
      etablissementId: etabRaw.id,
      etablissementNom: etabRaw.nom,
      originalUserId: session.userId,
      startedAt: new Date().toISOString(),
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 4, // 4 heures max
      path: "/",
    });

    // Log audit
    if (session.etablissementId) {
      await logAdminAction(supabase, {
        etablissement_id: session.etablissementId,
        utilisateur_id: session.userId,
        action: "LOGIN",
        entite: "Établissement",
        entite_id: etablissementId,
        description: `Début d'impersonation de "${etabRaw.nom}"`,
      });
    }

    return { success: true, data: { etablissementNom: etabRaw.nom } };
  } catch (error) {
    console.error("Erreur startImpersonation:", error);
    return { success: false, error: "Erreur lors du démarrage de l'impersonation" };
  }
}

/**
 * Arrêter l'impersonation
 */
export async function stopImpersonation(): Promise<ActionResult> {
  try {
    const session = await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    const cookieStore = await cookies();
    const impersonationCookie = cookieStore.get(IMPERSONATION_COOKIE);

    if (!impersonationCookie?.value) {
      return { success: false, error: "Aucune impersonation active" };
    }

    const impersonationData = JSON.parse(impersonationCookie.value);

    // Supprimer le cookie
    cookieStore.delete(IMPERSONATION_COOKIE);

    // Log audit
    if (session.etablissementId) {
      await logAdminAction(supabase, {
        etablissement_id: session.etablissementId,
        utilisateur_id: session.userId,
        action: "LOGOUT",
        entite: "Établissement",
        entite_id: impersonationData.etablissementId,
        description: `Fin d'impersonation de "${impersonationData.etablissementNom}"`,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Erreur stopImpersonation:", error);
    return { success: false, error: "Erreur lors de l'arrêt de l'impersonation" };
  }
}

/**
 * Vérifier si une impersonation est active
 */
export async function getImpersonationStatus(): Promise<
  ActionResult<{
    active: boolean;
    etablissementId?: string;
    etablissementNom?: string;
    startedAt?: string;
  }>
> {
  try {
    await requireAnyRole(["SUPER_ADMIN"]);

    const cookieStore = await cookies();
    const impersonationCookie = cookieStore.get(IMPERSONATION_COOKIE);

    if (!impersonationCookie?.value) {
      return { success: true, data: { active: false } };
    }

    const data = JSON.parse(impersonationCookie.value);

    return {
      success: true,
      data: {
        active: true,
        etablissementId: data.etablissementId,
        etablissementNom: data.etablissementNom,
        startedAt: data.startedAt,
      },
    };
  } catch (error) {
    console.error("Erreur getImpersonationStatus:", error);
    return { success: false, error: "Erreur lors de la vérification de l'impersonation" };
  }
}
