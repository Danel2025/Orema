/**
 * Gestion des sessions utilisateur avec JWT
 * Utilise crypto natif Node.js pour créer et vérifier les tokens JWT
 */

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { Role } from "@/lib/db/types";

const SESSION_COOKIE_NAME = "orema_session";
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 heures (un shift de travail POS)
const PIN_SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 heures pour sessions PIN

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

export interface SessionPayload {
  userId: string;
  email: string;
  role: Role;
  etablissementId: string;
  nom: string;
  prenom: string;
  isPinAuth?: boolean; // Indique si c'est une auth par PIN
}

/**
 * Encode en base64url (compatible JWT)
 */
function base64urlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Décode depuis base64url
 */
function base64urlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  return Buffer.from(str, "base64").toString("utf8");
}

/**
 * Crée une signature HMAC-SHA256
 */
function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

/**
 * Crée une nouvelle session JWT
 */
export async function createSession(payload: SessionPayload): Promise<string> {
  const duration = payload.isPinAuth ? PIN_SESSION_DURATION : SESSION_DURATION;
  const expiresAt = Math.floor((Date.now() + duration) / 1000);

  const header = { alg: "HS256", typ: "JWT" };
  const payloadWithExp = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: expiresAt,
  };

  const headerEncoded = base64urlEncode(JSON.stringify(header));
  const payloadEncoded = base64urlEncode(JSON.stringify(payloadWithExp));
  const signature = sign(`${headerEncoded}.${payloadEncoded}`, getSecret());

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

/**
 * Vérifie et décode un token JWT
 */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const [headerEncoded, payloadEncoded, signature] = parts;

    // Vérifier la signature
    const expectedSignature = sign(`${headerEncoded}.${payloadEncoded}`, getSecret());
    const signatureBuffer = Buffer.from(signature, "base64url");
    const expectedBuffer = Buffer.from(expectedSignature, "base64url");

    if (signatureBuffer.length !== expectedBuffer.length) {
      return null;
    }

    if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
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
    console.error("Session verification failed");
    return null;
  }
}

/**
 * Récupère la session depuis les cookies
 * Valide également que l'établissement existe toujours
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await verifySession(token);

  if (!session) {
    return null;
  }

  // Validation supplémentaire : vérifier que l'établissement existe
  // Utiliser le service client pour bypasser RLS (la session n'est pas encore validée par Supabase)
  try {
    const { createServiceClient } = await import("@/lib/supabase/server");
    const supabase = createServiceClient();
    const { data: etablissement } = await supabase
      .from("etablissements")
      .select("id")
      .eq("id", session.etablissementId)
      .single();

    // Si l'établissement n'existe plus, la session est invalide
    if (!etablissement) {
      return null;
    }
  } catch {
    console.error("[getSession] Failed to validate session");
    return null;
  }

  return session;
}

/**
 * Définit le cookie de session
 */
export async function setSessionCookie(token: string, isPinAuth = false) {
  const cookieStore = await cookies();
  const maxAge = isPinAuth
    ? PIN_SESSION_DURATION / 1000 // en secondes
    : SESSION_DURATION / 1000;

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });
}

/**
 * Supprime le cookie de session
 */
export async function deleteSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Vérifie si l'utilisateur est authentifié
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

/**
 * Vérifie si l'utilisateur a un rôle spécifique
 */
export async function hasRole(role: Role): Promise<boolean> {
  const session = await getSession();
  return session?.role === role;
}

/**
 * Vérifie si l'utilisateur a l'un des rôles spécifiés
 */
export async function hasAnyRole(roles: Role[]): Promise<boolean> {
  const session = await getSession();
  return session ? roles.includes(session.role) : false;
}

/**
 * Requiert une authentification, redirige sinon
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();

  if (!session) {
    throw new Error("Non authentifié");
  }

  return session;
}

/**
 * Requiert un rôle spécifique
 */
export async function requireRole(role: Role): Promise<SessionPayload> {
  const session = await requireAuth();

  if (session.role !== role) {
    throw new Error("Permissions insuffisantes");
  }

  return session;
}

/**
 * Requiert l'un des rôles spécifiés
 */
export async function requireAnyRole(roles: Role[]): Promise<SessionPayload> {
  const session = await requireAuth();

  if (!roles.includes(session.role)) {
    throw new Error("Permissions insuffisantes");
  }

  return session;
}
