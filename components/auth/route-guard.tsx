"use client";

/**
 * Composant de protection des routes
 *
 * Verifie les permissions de l'utilisateur et affiche
 * soit le contenu, soit une page d'acces refuse.
 */

import { usePathname } from "next/navigation";
import { type ReactNode, useMemo } from "react";
import { useAuth } from "@/lib/auth/context";
import { AccessDenied } from "./access-denied";

interface RouteGuardProps {
  children: ReactNode;
}

/**
 * Garde de route qui verifie les permissions
 *
 * Utilise la configuration des routes pour determiner
 * si l'utilisateur a acces a la page courante.
 *
 * @example
 * ```tsx
 * <RouteGuard>
 *   <PageContent />
 * </RouteGuard>
 * ```
 */
export function RouteGuard({ children }: RouteGuardProps) {
  const pathname = usePathname();
  const { user, canAccessRoute, isLoading } = useAuth();

  const accessResult = useMemo(() => {
    if (!user) return { allowed: false, reason: "Non authentifie" };
    return canAccessRoute(pathname);
  }, [user, pathname, canAccessRoute]);

  // Pendant le chargement, afficher le contenu (le layout gere le loading)
  if (isLoading) {
    return <>{children}</>;
  }

  // Si pas d'utilisateur, le layout devrait rediriger vers /login
  // Mais au cas ou, on bloque l'acces
  if (!user) {
    return <>{children}</>;
  }

  // Si acces refuse, afficher la page d'erreur
  if (!accessResult.allowed) {
    return <AccessDenied reason={accessResult.reason} pathname={pathname} />;
  }

  // Acces autorise
  return <>{children}</>;
}
