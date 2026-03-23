"use server";

import { deleteSessionCookie } from "@/lib/auth/session";
import { redirect } from "next/navigation";

/**
 * Server Action pour nettoyer la session utilisateur
 * Supprime le cookie et redirige vers la page de login
 */
export async function clearSessionAction() {
  try {
    await deleteSessionCookie();
    console.log("[clearSessionAction] Session cleared successfully");
  } catch (error) {
    console.error("[clearSessionAction] Error clearing session:", error);
  }

  // Rediriger vers login après nettoyage
  redirect("/login");
}

/**
 * Server Action pour nettoyer la session sans redirection
 * Utile pour les appels depuis le client qui gèrent leur propre navigation
 */
export async function clearSessionSilent(): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteSessionCookie();
    console.log("[clearSessionSilent] Session cleared successfully");
    return { success: true };
  } catch (error) {
    console.error("[clearSessionSilent] Error clearing session:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
