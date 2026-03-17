"use server";

/**
 * Server Actions pour l'envoi de SMS
 *
 * Ces actions appellent l'Edge Function send-sms pour envoyer
 * des SMS aux clients et au personnel.
 */

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import {
  confirmationCommande,
  notificationLivraison,
  rappelFidelite,
  alerteStockBas,
  messagePersonnalise,
  commandePrete,
  confirmationReservation,
} from "@/lib/sms";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SMSType =
  | "CONFIRMATION_COMMANDE"
  | "NOTIFICATION_LIVRAISON"
  | "RAPPEL_FIDELITE"
  | "ALERTE_STOCK"
  | "CUSTOM";

interface EnvoyerSMSParams {
  telephone: string;
  message: string;
  type: SMSType;
  metadata?: Record<string, unknown>;
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Validation du numéro gabonais (côté serveur)
// ---------------------------------------------------------------------------

const GABON_PHONE_REGEX = /^\+?241?\d{7,8}$/;

function validerTelephone(telephone: string): {
  valide: boolean;
  erreur?: string;
} {
  const cleaned = telephone.replace(/[\s\-\.\(\)]/g, "");

  if (!cleaned) {
    return { valide: false, erreur: "Numéro de téléphone requis" };
  }

  // Extraire les chiffres
  const digits = cleaned.replace(/\D/g, "");

  // Vérifier la longueur (7-8 chiffres nationaux, ou avec préfixe 241)
  if (digits.length < 7 || digits.length > 12) {
    return {
      valide: false,
      erreur: "Numéro gabonais invalide. Format attendu: +241XXXXXXX",
    };
  }

  // Vérification souple du format gabonais
  if (
    !GABON_PHONE_REGEX.test(cleaned) &&
    !/^0?\d{7,8}$/.test(digits)
  ) {
    return {
      valide: false,
      erreur: "Format de numéro gabonais invalide",
    };
  }

  return { valide: true };
}

// ---------------------------------------------------------------------------
// Action principale
// ---------------------------------------------------------------------------

/**
 * Envoie un SMS via l'Edge Function send-sms.
 *
 * @example
 * ```tsx
 * const result = await envoyerSMS({
 *   telephone: "+24177123456",
 *   message: "Votre commande est prête!",
 *   type: "CONFIRMATION_COMMANDE"
 * });
 * ```
 */
export async function envoyerSMS(
  params: EnvoyerSMSParams
): Promise<SMSResult> {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  // Validation côté serveur
  const validation = validerTelephone(params.telephone);
  if (!validation.valide) {
    return { success: false, error: validation.erreur };
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase.functions.invoke("send-sms", {
      body: {
        to: params.telephone,
        message: params.message,
        type: params.type,
        etablissementId: user.etablissementId,
        metadata: params.metadata,
      },
    });

    if (error) {
      console.error("[envoyerSMS] Erreur:", error);
      return { success: false, error: error.message };
    }

    if (data && !data.success) {
      return { success: false, error: data.error || "Échec d'envoi" };
    }

    console.info(
      `[SMS] Envoyé: ${params.type} -> ${params.telephone} (${data?.messageId})`
    );

    return {
      success: true,
      messageId: data?.messageId,
    };
  } catch (error) {
    console.error("[envoyerSMS] Exception:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

// ---------------------------------------------------------------------------
// Actions spécialisées avec templates
// ---------------------------------------------------------------------------

/**
 * Envoie un SMS de confirmation de commande.
 */
export async function envoyerConfirmationCommande(
  telephone: string,
  numeroCommande: string,
  total: string
): Promise<SMSResult> {
  return envoyerSMS({
    telephone,
    message: confirmationCommande(numeroCommande, total),
    type: "CONFIRMATION_COMMANDE",
    metadata: { numeroCommande, total },
  });
}

/**
 * Envoie un SMS "commande prête à récupérer".
 */
export async function envoyerCommandePrete(
  telephone: string,
  numeroCommande: string
): Promise<SMSResult> {
  return envoyerSMS({
    telephone,
    message: commandePrete(numeroCommande),
    type: "CONFIRMATION_COMMANDE",
    metadata: { numeroCommande },
  });
}

/**
 * Envoie un SMS de notification de livraison.
 */
export async function envoyerNotificationLivraison(
  telephone: string,
  adresse: string
): Promise<SMSResult> {
  return envoyerSMS({
    telephone,
    message: notificationLivraison(adresse),
    type: "NOTIFICATION_LIVRAISON",
    metadata: { adresse },
  });
}

/**
 * Envoie un SMS de rappel fidélité.
 */
export async function envoyerRappelFidelite(
  telephone: string,
  nom: string,
  points: number
): Promise<SMSResult> {
  return envoyerSMS({
    telephone,
    message: rappelFidelite(nom, points),
    type: "RAPPEL_FIDELITE",
    metadata: { nom, points },
  });
}

/**
 * Envoie une alerte de stock bas (notification interne au personnel).
 */
export async function envoyerAlerteStock(
  telephone: string,
  produit: string,
  stock: number
): Promise<SMSResult> {
  return envoyerSMS({
    telephone,
    message: alerteStockBas(produit, stock),
    type: "ALERTE_STOCK",
    metadata: { produit, stock },
  });
}

/**
 * Envoie un SMS de confirmation de réservation.
 */
export async function envoyerConfirmationReservation(
  telephone: string,
  details: {
    date: string;
    heure: string;
    nombrePersonnes: number;
  }
): Promise<SMSResult> {
  return envoyerSMS({
    telephone,
    message: confirmationReservation(
      details.date,
      details.heure,
      details.nombrePersonnes
    ),
    type: "CUSTOM",
    metadata: details,
  });
}

/**
 * Envoie un SMS personnalisé (texte libre).
 */
export async function envoyerSMSPersonnalise(
  telephone: string,
  texte: string
): Promise<SMSResult> {
  return envoyerSMS({
    telephone,
    message: messagePersonnalise(texte),
    type: "CUSTOM",
  });
}

// ---------------------------------------------------------------------------
// Compat : garder l'ancienne API exportée
// ---------------------------------------------------------------------------

/** @deprecated Utiliser envoyerSMS à la place */
export async function sendSMS(params: {
  telephone: string;
  message: string;
  type: string;
  metadata?: Record<string, unknown>;
}): Promise<SMSResult> {
  return envoyerSMS({
    telephone: params.telephone,
    message: params.message,
    type: (params.type.toUpperCase() as SMSType) || "CUSTOM",
    metadata: params.metadata,
  });
}

/** @deprecated Utiliser envoyerCommandePrete à la place */
export async function sendCommandePreteSMS(
  telephone: string,
  numeroCommande: string
): Promise<SMSResult> {
  return envoyerCommandePrete(telephone, numeroCommande);
}

/** @deprecated Utiliser envoyerNotificationLivraison à la place */
export async function sendLivraisonSMS(
  telephone: string,
  numeroCommande: string,
  estimatedTime?: string
): Promise<SMSResult> {
  const adresse = estimatedTime
    ? `votre adresse (arrivée estimée: ${estimatedTime})`
    : "votre adresse";
  return envoyerNotificationLivraison(telephone, adresse);
}

/** @deprecated Utiliser envoyerConfirmationReservation à la place */
export async function sendReservationSMS(
  telephone: string,
  details: {
    date: string;
    heure: string;
    nombrePersonnes: number;
    tableNumero?: string;
  }
): Promise<SMSResult> {
  return envoyerConfirmationReservation(telephone, details);
}
