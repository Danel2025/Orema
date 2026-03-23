/**
 * Client Moov Money Gabon
 *
 * Gere l'initiation de paiements C2B (Customer to Business)
 * via l'API Moov Money pour le Gabon.
 *
 * Variables d'environnement requises:
 * - MOOV_MONEY_API_KEY
 * - MOOV_MONEY_MERCHANT_ID
 * - MOOV_MONEY_BASE_URL (ex: https://api.moov-africa.ga pour sandbox)
 * - MOOV_MONEY_CALLBACK_URL (URL du webhook)
 */

// ============================================================================
// TYPES
// ============================================================================

interface MoovPaymentRequest {
  merchantId: string;
  amount: number;
  currency: string;
  externalReference: string;
  phone: string;
  callbackUrl: string;
  description?: string;
}

interface MoovPaymentResponse {
  success: boolean;
  transactionId: string;
  status: "INITIATED" | "PENDING" | "SUCCESSFUL" | "FAILED";
  message?: string;
}

interface MoovStatusResponse {
  success: boolean;
  transactionId: string;
  externalReference: string;
  status: "PENDING" | "SUCCESSFUL" | "FAILED";
  amount: number;
  currency: string;
  message?: string;
}

export interface InitiatePaymentParams {
  amount: number;
  phone: string; // Format international sans +, ex: 24106XXXXXXX
  reference: string;
  description?: string;
}

export interface InitiatePaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface CheckStatusResult {
  success: boolean;
  status?: "PENDING" | "SUCCESSFUL" | "FAILED";
  transactionId?: string;
  message?: string;
  error?: string;
}

// ============================================================================
// CLIENT
// ============================================================================

export class MoovMoneyClient {
  private apiKey: string;
  private merchantId: string;
  private baseUrl: string;
  private callbackUrl: string;

  constructor() {
    this.apiKey = process.env.MOOV_MONEY_API_KEY || "";
    this.merchantId = process.env.MOOV_MONEY_MERCHANT_ID || "";
    this.baseUrl = process.env.MOOV_MONEY_BASE_URL || "https://api.moov-africa.ga";
    this.callbackUrl = process.env.MOOV_MONEY_CALLBACK_URL || "";

    if (!this.apiKey || !this.merchantId) {
      console.warn("[MoovMoney] Credentials manquantes. Les paiements ne fonctionneront pas.");
    }
  }

  /**
   * Initie un paiement C2B (Customer to Business)
   * Le client recevra une notification USSD pour confirmer le paiement.
   */
  async initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const payload: MoovPaymentRequest = {
      merchantId: this.merchantId,
      amount: params.amount,
      currency: "XAF",
      externalReference: params.reference,
      phone: params.phone.replace(/^\+?241/, ""),
      callbackUrl: this.callbackUrl,
      description: params.description || `Paiement Orema N+ - ${params.reference}`,
    };

    const response = await this.fetchWithRetry(`${this.baseUrl}/v1/merchant/payment/init`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "X-Merchant-ID": this.merchantId,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[MoovMoney] Erreur initiation paiement: ${response.status}`, text);
      return {
        success: false,
        error: `Erreur API Moov Money: ${response.status}`,
      };
    }

    const data: MoovPaymentResponse = await response.json();

    if (!data.success) {
      console.error("[MoovMoney] Paiement refuse:", data.message);
      return {
        success: false,
        error: data.message || "Paiement refuse par Moov Money",
      };
    }

    console.log(
      `[MoovMoney] Paiement initie: ${params.reference} - Transaction: ${data.transactionId}`
    );

    return {
      success: true,
      transactionId: data.transactionId,
    };
  }

  /**
   * Verifie le statut d'un paiement aupres de l'API Moov
   */
  async checkStatus(transactionId: string): Promise<CheckStatusResult> {
    const response = await this.fetchWithRetry(
      `${this.baseUrl}/v1/merchant/payment/status/${transactionId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "X-Merchant-ID": this.merchantId,
        },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error(`[MoovMoney] Erreur verification statut: ${response.status}`, text);
      return {
        success: false,
        error: `Erreur API Moov Money: ${response.status}`,
      };
    }

    const data: MoovStatusResponse = await response.json();

    return {
      success: true,
      status: data.status,
      transactionId: data.transactionId,
      message: data.message,
    };
  }

  /**
   * Genere une reference unique pour un paiement Moov
   */
  static generateReference(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const random = crypto.randomUUID().slice(0, 6).toUpperCase();
    return `ORE-${date}-${random}`;
  }

  /**
   * Fetch avec retry et backoff exponentiel
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    maxRetries = 3
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Ne pas retenter pour les erreurs client (4xx)
        if (response.status >= 400 && response.status < 500) {
          return response;
        }

        // Retenter pour les erreurs serveur (5xx)
        if (response.status >= 500 && attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          console.warn(
            `[MoovMoney] Retry ${attempt + 1}/${maxRetries} apres ${delay}ms (status ${response.status})`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          console.warn(
            `[MoovMoney] Retry ${attempt + 1}/${maxRetries} apres ${delay}ms:`,
            lastError.message
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error("[MoovMoney] Toutes les tentatives ont echoue");
  }
}

/** Singleton du client Moov Money */
export const moovMoneyClient = new MoovMoneyClient();
