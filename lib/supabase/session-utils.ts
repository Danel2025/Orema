/**
 * Client Supabase pour le middleware Next.js (Edge Runtime)
 *
 * Ce client est specifiquement concu pour fonctionner dans le middleware
 * ou il faut gerer les cookies de maniere speciale via la Request/Response.
 *
 * Le middleware est critique pour:
 * - Rafraichir automatiquement les sessions expirees
 * - Rediriger les utilisateurs non authentifies
 * - Proteger les routes
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/supabase";

/**
 * Met a jour la session Supabase et retourne la reponse modifiee.
 *
 * Cette fonction doit etre appelee dans le middleware pour:
 * 1. Rafraichir le token d'acces si expire
 * 2. Mettre a jour les cookies de session
 *
 * @param request - La requete Next.js entrante
 * @returns L'objet contenant le client supabase et la reponse
 */
export async function updateSession(request: NextRequest) {
  // Creer une reponse initiale qui sera modifiee
  let supabaseResponse = NextResponse.next({
    request,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // D'abord, mettre a jour les cookies dans la requete
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          // Recreer la reponse avec la requete mise a jour
          supabaseResponse = NextResponse.next({
            request,
          });

          // Ensuite, mettre a jour les cookies dans la reponse
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // IMPORTANT: Ne pas utiliser getSession() ici car il ne garantit pas
  // que les donnees viennent du serveur Supabase (peut utiliser le cache).
  // getUser() fait toujours un appel au serveur pour valider le token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user, response: supabaseResponse };
}
