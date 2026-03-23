/**
 * Client Airtel Money Gabon
 *
 * Gere l'initiation de paiements C2B (Customer to Business)
 * via l'API Airtel Money pour le Gabon.
 *
 * Variables d'environnement requises:
 * - AIRTEL_MONEY_CLIENT_ID
 * - AIRTEL_MONEY_CLIENT_SECRET
 * - AIRTEL_MONEY_BASE_URL (ex: https://openapiuat.airtel.africa pour sandbox)
 * - AIRTEL_MONEY_CALLBACK_URL (URL du webhook)
 */

// ============================================================================
// TYPES
// ============================================================================

interface AirtelAuthResponse {
  access_token: string;
  expires_in: string;
  token_type: string;
}

interface AirtelPaymentRequest {
  reference: string;
  subscriber: {
    country: string;
    currency: string;
    msisdn: string;
  };
  transaction: {
    amount: number;
    country: string;
    currency: string;
    id: string;
  };
}

interface AirtelPaymentResponse {
  data: {
    transaction: {
      id: string;
      status: string;
    };
  };
  status: {
    code: string;
    message: string;
    result_code: string;
    response_code: string;
    success: boolean;
  };
}

interface AirtelStatusResponse {
  data: {
    transaction: {
      airtel_money_id: string;
      id: string;
      message: string;
      status: string;
    };
  };
  status: {
    code: string;
    message: string;
    result_code: string;
    response_code: string;
    success: boolean;
  };
}

export interface InitiatePaymentParams {
  amount: number;
  phone: string; // Format international sans +, ex: 24107XXXXXXX
  reference: string;
}

export interface InitiatePaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface CheckStatusResult {
  success: boolean;
  status?: "SUCCESS" | "FAILED" | "PENDING" | "AMBIGUOUS";
  airtelMoneyId?: string;
  message?: string;
  error?: string;
}

// ============================================================================
// CACHE TOKEN
// ============================================================================

let cachedToken: { token: string; expiresAt: number } | null = null;

// ============================================================================
// CLIENT
// ============================================================================

export class AirtelMoneyClient {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;
  private callbackUrl: string;

  constructor() {
    this.clientId = process.env.AIRTEL_MONEY_CLIENT_ID || "";
    this.clientSecret = process.env.AIRTEL_MONEY_CLIENT_SECRET || "";
    this.baseUrl = process.env.AIRTEL_MONEY_BASE_URL || "https://openapiuat.airtel.africa";
    this.callbackUrl = process.env.AIRTEL_MONEY_CALLBACK_URL || "";

    if (!this.clientId || !this.clientSecret) {
      console.warn("[AirtelMoney] Credentials manquantes. Les paiements ne fonctionneront pas.");
    }
  }

  /**
   * Obtient un token OAuth2 (client credentials grant)
   * Le token est cache en memoire jusqu'a expiration.
   */
  private async getAccessToken(): Promise<string> {
    // Verifier le cache
    if (cachedToken && Date.now() < cachedToken.expiresAt) {
      return cachedToken.token;
    }

    const response = await this.fetchWithRetry(`${this.baseUrl}/auth/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "client_credentials",
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`[AirtelMoney] Echec authentification: ${response.status} - ${text}`);
    }

    const data: AirtelAuthResponse = await response.json();

    // Cacher le token avec une marge de 60 secondes
    const expiresInMs = (parseInt(data.expires_in, 10) - 60) * 1000;
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + expiresInMs,
    };

    return data.access_token;
  }

  /**
   * Initie un paiement C2B (Customer to Business)
   * Le client recevra une notification USSD pour confirmer le paiement.
   */
  async initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const token = await this.getAccessToken();

    const payload: AirtelPaymentRequest = {
      reference: params.reference,
      subscriber: {
        country: "GA",
        currency: "XAF",
        msisdn: params.phone.replace(/^\+?241/, ""),
      },
      transaction: {
        amount: params.amount,
        country: "GA",
        currency: "XAF",
        id: params.reference,
      },
    };

    const response = await this.fetchWithRetry(`${this.baseUrl}/merchant/v1/payments/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Country": "GA",
        "X-Currency": "XAF",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[AirtelMoney] Erreur initiation paiement: ${response.status}`, text);
      return {
        success: false,
        error: `Erreur API Airtel Money: ${response.status}`,
      };
    }

    const data: AirtelPaymentResponse = await response.json();

    if (!data.status.success) {
      console.error("[AirtelMoney] Paiement refuse:", data.status);
      return {
        success: false,
        error: data.status.message || "Paiement refuse par Airtel Money",
      };
    }

    console.log(
      `[AirtelMoney] Paiement initie: ${params.reference} - Transaction: ${data.data.transaction.id}`
    );

    return {
      success: true,
      transactionId: data.data.transaction.id,
    };
  }

  /**
   * Verifie le statut d'un paiement aupres de l'API Airtel
   */
  async checkStatus(transactionId: string): Promise<CheckStatusResult> {
    const token = await this.getAccessToken();

    const response = await this.fetchWithRetry(
      `${this.baseUrl}/standard/v1/payments/${transactionId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Country": "GA",
          "X-Currency": "XAF",
        },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error(`[AirtelMoney] Erreur verification statut: ${response.status}`, text);
      return {
        success: false,
        error: `Erreur API Airtel Money: ${response.status}`,
      };
    }

    const data: AirtelStatusResponse = await response.json();

    const statusMap: Record<string, CheckStatusResult["status"]> = {
      TS: "SUCCESS",
      TF: "FAILED",
      TIP: "PENDING",
      TA: "AMBIGUOUS",
    };

    return {
      success: true,
      status: statusMap[data.data.transaction.status] || "PENDING",
      airtelMoneyId: data.data.transaction.airtel_money_id,
      message: data.data.transaction.message,
    };
  }

  /**
   * Genere une reference unique pour un paiement Airtel
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
            `[AirtelMoney] Retry ${attempt + 1}/${maxRetries} apres ${delay}ms (status ${response.status})`
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
            `[AirtelMoney] Retry ${attempt + 1}/${maxRetries} apres ${delay}ms:`,
            lastError.message
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error("[AirtelMoney] Toutes les tentatives ont echoue");
  }
}

/** Singleton du client Airtel Money */
export const airtelMoneyClient = new AirtelMoneyClient();
