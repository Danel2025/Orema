/**
 * Proxy Next.js 16 - Protection des routes et rafraichissement de session
 *
 * Remplace middleware.ts (format Next.js 16).
 * Compatible Edge Runtime (pas de Node.js APIs).
 * Utilise verifySessionEdge pour la verification JWT custom (sessions PIN).
 * Rafraichit la session Supabase pour les utilisateurs connectes via Supabase Auth.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { verifySessionEdge } from "@/lib/auth/session-edge";

/** Routes publiques qui ne necessitent pas d'authentification */
const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/auth/error",
  "/auth/verify",
  "/",
  "/docs",
  "/blog",
  "/about",
  "/faq",
  "/guide",
  "/legal",
  "/privacy",
  "/terms",
  "/partners",
];

/** Prefixes de routes publiques (match par startsWith) */
const PUBLIC_PREFIXES = ["/login/", "/docs/", "/blog/", "/_next/", "/api/health"];

/** Routes API qui necessitent une authentification */
const PROTECTED_API_PREFIX = "/api/";

/** Nom du cookie de session JWT custom */
const SESSION_COOKIE_NAME = "orema_session";

/**
 * Verifie si une route est publique
 */
function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) {
    return true;
  }

  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return true;
    }
  }

  if (pathname.includes(".")) {
    return true;
  }

  return false;
}

/**
 * Verifie si l'utilisateur a une session valide (Supabase OU JWT custom)
 */
async function hasValidSession(request: NextRequest): Promise<boolean> {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (sessionCookie) {
    const session = await verifySessionEdge(sessionCookie);
    if (session) {
      return true;
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return false;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {},
    },
  });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}

/**
 * Rafraichit la session Supabase (renouvelle les tokens si necessaire)
 */
function refreshSupabaseSession(
  request: NextRequest,
  response: NextResponse
): { supabase: ReturnType<typeof createServerClient>; response: NextResponse } {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { supabase: null as unknown as ReturnType<typeof createServerClient>, response };
  }

  let currentResponse = response;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        currentResponse = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          currentResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  return { supabase, response: currentResponse };
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes publiques : pas de verification
  if (isPublicRoute(pathname)) {
    let response = NextResponse.next({
      request: { headers: request.headers },
    });

    const { supabase, response: updatedResponse } = refreshSupabaseSession(request, response);
    response = updatedResponse;

    if (supabase) {
      try {
        await supabase.auth.getUser();
      } catch {
        // Ignorer les erreurs de refresh sur les routes publiques
      }
    }

    return response;
  }

  // Verifier l'authentification
  const authenticated = await hasValidSession(request);

  // Routes API protegees : retourner 401 JSON
  if (pathname.startsWith(PROTECTED_API_PREFIX)) {
    if (!authenticated) {
      return NextResponse.json({ error: "Non authentifie", code: "UNAUTHORIZED" }, { status: 401 });
    }
  }

  // Routes dashboard protegees : redirect vers login
  if (!authenticated) {
    const callbackUrl = encodeURIComponent(pathname);
    const loginUrl = new URL(`/login?callbackUrl=${callbackUrl}`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Utilisateur authentifie : rafraichir la session Supabase et continuer
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const { supabase, response: updatedResponse } = refreshSupabaseSession(request, response);
  response = updatedResponse;

  if (supabase) {
    try {
      await supabase.auth.getUser();
    } catch {
      // Ignorer les erreurs de refresh pour les utilisateurs avec session JWT custom
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico|.*\\.webp|.*\\.woff|.*\\.woff2).*)",
  ],
};
