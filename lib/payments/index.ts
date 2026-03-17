/**
 * Module de paiements Mobile Money
 *
 * Point d'entree pour les clients de paiement Airtel Money et Moov Money.
 *
 * @example
 * ```ts
 * import { airtelMoneyClient, moovMoneyClient, getPaymentClient } from '@/lib/payments'
 *
 * // Utilisation directe
 * const result = await airtelMoneyClient.initiatePayment({ amount: 5000, phone: '07XXXXXXX', reference: 'ORE-...' })
 *
 * // Utilisation dynamique selon le provider
 * const client = getPaymentClient('AIRTEL_MONEY')
 * const result = await client.initiatePayment({ amount: 5000, phone: '07XXXXXXX', reference: 'ORE-...' })
 * ```
 */

import { airtelMoneyClient , AirtelMoneyClient } from "./airtel-money";
import { moovMoneyClient , MoovMoneyClient } from "./moov-money";

export { AirtelMoneyClient, airtelMoneyClient } from "./airtel-money";
export { MoovMoneyClient, moovMoneyClient } from "./moov-money";

export type { InitiatePaymentParams as AirtelInitiateParams } from "./airtel-money";
export type { InitiatePaymentParams as MoovInitiateParams } from "./moov-money";

export type MobileMoneyProvider = "AIRTEL_MONEY" | "MOOV_MONEY";

/**
 * Interface commune pour les clients de paiement mobile
 */
export interface PaymentClient {
  initiatePayment(params: {
    amount: number;
    phone: string;
    reference: string;
    description?: string;
  }): Promise<{ success: boolean; transactionId?: string; error?: string }>;

  checkStatus(transactionId: string): Promise<{
    success: boolean;
    status?: string;
    error?: string;
  }>;
}

/**
 * Retourne le client de paiement correspondant au provider
 */
export function getPaymentClient(provider: MobileMoneyProvider): PaymentClient {
  switch (provider) {
    case "AIRTEL_MONEY":
      return airtelMoneyClient;
    case "MOOV_MONEY":
      return moovMoneyClient;
    default:
      throw new Error(`Provider de paiement inconnu: ${provider}`);
  }
}

/**
 * Genere une reference de paiement unique au format ORE-YYYYMMDD-XXXXXX
 */
export function generatePaymentReference(): string {
  return AirtelMoneyClient.generateReference();
}

/**
 * Formate un numero de telephone gabonais au format international
 * Accepte: 07XXXXXXX, 007XXXXXXX, 24107XXXXXXX, +24107XXXXXXX
 * Retourne: 24107XXXXXXX (sans +)
 */
export function formatGabonPhone(telephone: string): string {
  let cleaned = telephone.replace(/\D/g, "");

  // Supprimer le prefixe 00 si present
  if (cleaned.startsWith("00241")) {
    cleaned = cleaned.substring(2);
  }

  // Ajouter le prefixe pays si absent
  if (cleaned.startsWith("0")) {
    cleaned = "241" + cleaned.substring(1);
  } else if (!cleaned.startsWith("241") && cleaned.length <= 9) {
    cleaned = "241" + cleaned;
  }

  return cleaned;
}

/**
 * Detecte le provider probable a partir du numero de telephone gabonais
 * Airtel: 074, 077
 * Moov (ex-Libertis/Gabon Telecom): 062, 066, 060, 065
 */
export function detectProviderFromPhone(
  telephone: string
): MobileMoneyProvider | null {
  const cleaned = telephone.replace(/\D/g, "");
  // Extraire les 2 premiers chiffres du numero local
  let localPrefix: string;
  if (cleaned.startsWith("241")) {
    localPrefix = cleaned.substring(3, 5);
  } else if (cleaned.startsWith("0")) {
    localPrefix = cleaned.substring(1, 3);
  } else {
    localPrefix = cleaned.substring(0, 2);
  }

  const airtelPrefixes = ["74", "77"];
  const moovPrefixes = ["62", "66", "60", "65"];

  if (airtelPrefixes.includes(localPrefix)) return "AIRTEL_MONEY";
  if (moovPrefixes.includes(localPrefix)) return "MOOV_MONEY";

  return null;
}
