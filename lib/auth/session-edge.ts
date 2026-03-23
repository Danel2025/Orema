/**
 * Gestion des sessions JWT pour Edge Runtime
 * Utilise Web Crypto API (compatible Edge Runtime)
 */

import type { Role } from "@/lib/db/types";

export interface SessionPayload {
  userId: string;
  email: string;
  role: Role;
  etablissementId: string;
  nom: string;
  prenom: string;
  isPinAuth?: boolean;
}

// Clé secrète pour signer les JWT - OBLIGATOIRE via variable d'environnement
const getSecret = () => {
  const AUTH_SECRET = process.env.AUTH_SECRET;
  if (!AUTH_SECRET) {
    throw new Error(
      "FATAL: AUTH_SECRET environment variable is required. " +
        "Generate one with: openssl rand -base64 32"
    );
  }
  return AUTH_SECRET;
};

/**
 * Encode en base64url (compatible JWT)
 */
function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Encode une string en base64url
 */
function stringToBase64url(str: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  return base64urlEncode(data.buffer);
}

/**
 * Décode depuis base64url
 */
function base64urlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

/**
 * Importe la clé secrète pour HMAC
 */
async function importKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);

  return crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

/**
 * Crée une signature HMAC-SHA256 avec Web Crypto API
 */
async function sign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const key = await importKey(secret);

  const signature = await crypto.subtle.sign("HMAC", key, dataBuffer);

  return base64urlEncode(signature);
}

/**
 * Vérifie une signature HMAC-SHA256 avec Web Crypto API
 */
async function verify(data: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const key = await importKey(secret);

  // Décoder la signature depuis base64url
  const signatureStr = signature.replace(/-/g, "+").replace(/_/g, "/");
  let paddedSignature = signatureStr;
  while (paddedSignature.length % 4) {
    paddedSignature += "=";
  }
  const binarySignature = atob(paddedSignature);
  const signatureBytes = new Uint8Array(binarySignature.length);
  for (let i = 0; i < binarySignature.length; i++) {
    signatureBytes[i] = binarySignature.charCodeAt(i);
  }

  return crypto.subtle.verify("HMAC", key, signatureBytes, dataBuffer);
}

/**
 * Vérifie et décode un token JWT (Edge Runtime)
 */
export async function verifySessionEdge(token: string): Promise<SessionPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const [headerEncoded, payloadEncoded, signature] = parts;

    // Vérifier la signature avec Web Crypto API
    const isValid = await verify(`${headerEncoded}.${payloadEncoded}`, signature, getSecret());

    if (!isValid) {
      return null;
    }

    // Décoder le payload
    const payload = JSON.parse(base64urlDecode(payloadEncoded));

    // Vérifier l'expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    // Retirer les claims JWT standards
    const { iat, exp, ...sessionData } = payload;

    return sessionData as SessionPayload;
  } catch {
    console.error("Edge session verification failed");
    return null;
  }
}
