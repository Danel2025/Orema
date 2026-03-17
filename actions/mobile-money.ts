"use server";

/**
 * Server Actions pour les paiements Mobile Money
 *
 * Gere l'initiation, la verification et l'annulation des paiements
 * Airtel Money et Moov Money pour le Gabon.
 *
 * Flow:
 * 1. Le caissier appelle initMobileMoneyPayment avec le montant et le numero
 * 2. Le paiement est enregistre en BD avec statut EN_ATTENTE
 * 3. L'API du provider est appelee pour initier le push USSD
 * 4. Le client confirme sur son telephone
 * 5. Le webhook (supabase/functions/webhook-mobile-money) recoit la confirmation
 * 6. Le frontend peut poller checkMobileMoneyStatus pour suivre l'avancement
 */

import { createAuthenticatedClient } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  getPaymentClient,
  generatePaymentReference,
  formatGabonPhone,
  type MobileMoneyProvider,
} from "@/lib/payments";

// ============================================================================
// TYPES
// ============================================================================

export type { MobileMoneyProvider } from "@/lib/payments";

interface InitPaymentParams {
  montant: number;
  telephone: string;
  provider: MobileMoneyProvider;
  venteId: string;
}

interface InitPaymentResult {
  success: boolean;
  referenceInterne?: string;
  error?: string;
}

interface PaymentStatusResult {
  success: boolean;
  statut?: "EN_ATTENTE" | "CONFIRME" | "ECHOUE" | "EXPIRE";
  referenceExterne?: string;
  error?: string;
}

/**
 * Type local pour la table paiements_mobile
 * (non encore presente dans les types Supabase generes)
 */
interface PaiementMobile {
  id: string;
  reference_interne: string;
  reference_externe: string | null;
  montant: number;
  telephone: string;
  provider: string;
  statut: string;
  expire_at: string;
  confirme_at: string | null;
  vente_id: string;
  etablissement_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// INITIATION DE PAIEMENT
// ============================================================================

/**
 * Initie un paiement Mobile Money
 *
 * 1. Valide les parametres
 * 2. Enregistre le paiement en BD (statut EN_ATTENTE)
 * 3. Appelle l'API du provider (Airtel ou Moov) pour le push USSD
 * 4. Retourne la reference interne pour le suivi
 */
export async function initMobileMoneyPayment(
  params: InitPaymentParams
): Promise<InitPaymentResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Non authentifié" };
  if (!user.etablissementId) return { success: false, error: "Aucun établissement associé" };
  const etablissementId = user.etablissementId;

  const { montant, telephone, provider, venteId } = params;

  // Validations
  if (montant <= 0) return { success: false, error: "Montant invalide" };
  if (!telephone || telephone.length < 8)
    return { success: false, error: "Numéro de téléphone invalide" };
  if (!venteId) return { success: false, error: "ID de vente manquant" };

  const phoneFormatted = formatGabonPhone(telephone);
  const referenceInterne = generatePaymentReference();

  try {
    const supabase = await createAuthenticatedClient({
      userId: user.userId,
      etablissementId,
      role: user.role,
    });

    // Verifier que la vente existe (RLS filtre par etablissement_id)
    const { data: vente } = await supabase
      .from("ventes")
      .select("id, total_final, statut")
      .eq("id", venteId)
      .single();

    if (!vente) {
      return { success: false, error: "Vente non trouvée" };
    }

    // Calculer l'expiration (15 minutes)
    const expireAt = new Date();
    expireAt.setMinutes(expireAt.getMinutes() + 15);

    // Enregistrer le paiement en BD avant l'appel API
    const { error: insertError } = await supabase
      .from("paiements_mobile" as never)
      .insert({
        reference_interne: referenceInterne,
        montant,
        telephone: "+" + phoneFormatted,
        provider,
        statut: "EN_ATTENTE",
        expire_at: expireAt.toISOString(),
        vente_id: venteId,
        etablissement_id: etablissementId,
      } as never);

    if (insertError) {
      console.error("[MobileMoney] Erreur insertion BD:", insertError);
      return { success: false, error: "Erreur lors de l'enregistrement du paiement" };
    }

    // Appeler l'API du provider pour initier le push USSD
    const client = getPaymentClient(provider);
    const apiResult = await client.initiatePayment({
      amount: montant,
      phone: phoneFormatted,
      reference: referenceInterne,
    });

    if (!apiResult.success) {
      // Marquer le paiement comme echoue en BD
      await supabase
        .from("paiements_mobile" as never)
        .update({
          statut: "ECHOUE",
          metadata: { erreur_api: apiResult.error },
        } as never)
        .eq("reference_interne", referenceInterne);

      console.error(
        `[MobileMoney] Echec initiation ${provider}:`,
        apiResult.error
      );
      return {
        success: false,
        error: apiResult.error || "Échec de l'initiation du paiement",
      };
    }

    // Mettre a jour avec l'ID de transaction du provider
    if (apiResult.transactionId) {
      await supabase
        .from("paiements_mobile" as never)
        .update({
          reference_externe: apiResult.transactionId,
        } as never)
        .eq("reference_interne", referenceInterne);
    }

    console.log(
      `[MobileMoney] Paiement initié: ${referenceInterne} - ${montant} FCFA - ${provider} - Tx: ${apiResult.transactionId}`
    );

    return { success: true, referenceInterne };
  } catch (error) {
    console.error("[MobileMoney] Erreur initiation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

// ============================================================================
// VERIFICATION DE STATUT
// ============================================================================

/**
 * Verifie le statut d'un paiement Mobile Money
 *
 * Interroge la BD et, si le paiement est toujours en attente,
 * peut aussi interroger l'API du provider pour une verification active.
 */
export async function checkMobileMoneyStatus(
  referenceInterne: string
): Promise<PaymentStatusResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Non authentifié" };
  if (!user.etablissementId) return { success: false, error: "Aucun établissement associé" };

  try {
    const supabase = await createAuthenticatedClient({
      userId: user.userId,
      etablissementId: user.etablissementId,
      role: user.role,
    });
    // RLS filtre automatiquement par etablissement_id
    const { data } = await supabase
      .from("paiements_mobile" as never)
      .select("*")
      .eq("reference_interne", referenceInterne)
      .single();

    const paiement = data as unknown as PaiementMobile | null;

    if (!paiement)
      return { success: false, error: "Paiement non trouvé" };

    // Verifier l'expiration
    if (
      paiement.statut === "EN_ATTENTE" &&
      new Date() > new Date(paiement.expire_at)
    ) {
      await supabase
        .from("paiements_mobile" as never)
        .update({ statut: "EXPIRE" } as never)
        .eq("reference_interne", referenceInterne);
      return { success: true, statut: "EXPIRE" };
    }

    // Si toujours en attente et qu'on a un ID de transaction, verifier aupres du provider
    if (paiement.statut === "EN_ATTENTE" && paiement.reference_externe) {
      try {
        const client = getPaymentClient(paiement.provider as MobileMoneyProvider);
        const statusResult = await client.checkStatus(paiement.reference_externe);

        if (statusResult.success && statusResult.status) {
          const statusMapping: Record<string, string> = {
            SUCCESS: "CONFIRME",
            SUCCESSFUL: "CONFIRME",
            FAILED: "ECHOUE",
            PENDING: "EN_ATTENTE",
          };

          const mappedStatus = statusMapping[statusResult.status] || "EN_ATTENTE";

          if (mappedStatus !== "EN_ATTENTE") {
            await supabase
              .from("paiements_mobile" as never)
              .update({
                statut: mappedStatus,
                confirme_at:
                  mappedStatus === "CONFIRME"
                    ? new Date().toISOString()
                    : null,
              } as never)
              .eq("reference_interne", referenceInterne);

            return {
              success: true,
              statut: mappedStatus as PaymentStatusResult["statut"],
              referenceExterne: paiement.reference_externe,
            };
          }
        }
      } catch (pollError) {
        // Ne pas echouer la verification si le poll API echoue
        console.warn(
          "[MobileMoney] Erreur poll API provider:",
          pollError
        );
      }
    }

    return {
      success: true,
      statut: paiement.statut as PaymentStatusResult["statut"],
      referenceExterne: paiement.reference_externe ?? undefined,
    };
  } catch (error) {
    console.error("[MobileMoney] Erreur vérification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

// ============================================================================
// ANNULATION
// ============================================================================

/**
 * Annule un paiement Mobile Money en attente
 */
export async function cancelMobileMoneyPayment(
  referenceInterne: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Non authentifié" };
  if (!user.etablissementId) return { success: false, error: "Aucun établissement associé" };

  try {
    const supabase = await createAuthenticatedClient({
      userId: user.userId,
      etablissementId: user.etablissementId,
      role: user.role,
    });
    // RLS filtre automatiquement par etablissement_id
    const { data } = await supabase
      .from("paiements_mobile" as never)
      .select("etablissement_id, statut")
      .eq("reference_interne", referenceInterne)
      .single();

    const paiement = data as unknown as Pick<PaiementMobile, "etablissement_id" | "statut"> | null;

    if (!paiement)
      return { success: false, error: "Paiement non trouvé" };
    if (paiement.statut !== "EN_ATTENTE")
      return { success: false, error: "Seuls les paiements en attente peuvent être annulés" };

    await supabase
      .from("paiements_mobile" as never)
      .update({ statut: "ECHOUE", metadata: { annule_par: user.userId } } as never)
      .eq("reference_interne", referenceInterne);

    console.log(`[MobileMoney] Paiement annulé: ${referenceInterne}`);
    return { success: true };
  } catch (error) {
    console.error("[MobileMoney] Erreur annulation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}
