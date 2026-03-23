"use server";

/**
 * Server Action pour déverrouiller la session avec un PIN
 * Migré vers Supabase
 */

import { createServiceClient } from "@/lib/db";
import { verifyPin } from "@/lib/auth/password";
import { getCurrentUserSupabase } from "./auth-supabase";
import { checkLockout, recordFailedAttempt, resetAttempts } from "@/lib/auth/login-lockout";

type ActionResult = { success: boolean; error?: string };

/**
 * Verifie le PIN de l'utilisateur connecte pour deverrouiller la session
 */
export async function verifyPinForUnlock(pin: string): Promise<ActionResult> {
  try {
    if (!/^\d{4,6}$/.test(pin)) {
      return { success: false, error: "PIN invalide (4-6 chiffres requis)" };
    }

    const currentUser = await getCurrentUserSupabase();
    if (!currentUser) {
      return { success: false, error: "Session expiree, veuillez vous reconnecter" };
    }

    // Lockout check (PIN config: 3 tentatives / 5 min)
    const lockoutKey = `unlock:${currentUser.id}`;
    const lockout = checkLockout(lockoutKey, true);
    if (lockout.locked) {
      return {
        success: false,
        error:
          "Déverrouillage temporairement bloqué suite à trop de tentatives. Veuillez réessayer dans quelques minutes.",
      };
    }

    const supabase = createServiceClient();
    const { data: utilisateur } = await supabase
      .from("utilisateurs")
      .select("id, pin_code, nom, prenom, etablissement_id")
      .eq("id", currentUser.id)
      .single();

    if (!utilisateur) return { success: false, error: "Utilisateur non trouve" };
    if (!utilisateur.pin_code)
      return { success: false, error: "Aucun PIN configure. Contactez un administrateur." };

    const isPinValid = await verifyPin(pin, utilisateur.pin_code);

    if (!isPinValid) {
      recordFailedAttempt(lockoutKey, true);
      try {
        await supabase.from("audit_logs").insert({
          action: "LOGIN",
          entite: "Utilisateur",
          entite_id: utilisateur.id,
          description: `Tentative de deverrouillage echouee`,
          utilisateur_id: utilisateur.id,
          etablissement_id: utilisateur.etablissement_id,
        });
      } catch {
        /* ignorer erreurs audit */
      }
      return { success: false, error: "PIN incorrect" };
    }

    // PIN valide : reset les tentatives
    resetAttempts(lockoutKey, true);

    try {
      await supabase.from("audit_logs").insert({
        action: "LOGIN",
        entite: "Utilisateur",
        entite_id: utilisateur.id,
        description: `Session deverrouillee`,
        utilisateur_id: utilisateur.id,
        etablissement_id: utilisateur.etablissement_id,
      });
    } catch {
      /* ignorer erreurs audit */
    }

    return { success: true };
  } catch {
    console.error("PIN unlock failed");
    return { success: false, error: "Une erreur est survenue" };
  }
}
