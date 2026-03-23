"use client";

/**
 * Route Guard
 *
 * Verifie que l'utilisateur a acces a la route actuelle.
 * Redirige vers la premiere page autorisee si non autorise.
 */

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { Flex, Text } from "@radix-ui/themes";
import { Loader2, ShieldAlert } from "lucide-react";

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, canAccessRoute, accessibleRoutes } = useAuth();

  // Derive auth state during render (best practice: rerender-derived-state-no-effect)
  const { isChecking, isAuthorized, redirectTo } = useMemo(() => {
    if (!user) {
      return { isChecking: false, isAuthorized: false, redirectTo: null };
    }
    if (isAdmin) {
      return { isChecking: false, isAuthorized: true, redirectTo: null };
    }
    const result = canAccessRoute(pathname);
    if (result.allowed) {
      return { isChecking: false, isAuthorized: true, redirectTo: null };
    }
    // Not allowed - find redirect target
    const firstRoute = accessibleRoutes[0];
    return { isChecking: false, isAuthorized: false, redirectTo: firstRoute ?? null };
  }, [user, isAdmin, canAccessRoute, pathname, accessibleRoutes]);

  useEffect(() => {
    if (!isChecking && !isAuthorized && redirectTo) {
      router.replace(redirectTo.path);
    }
  }, [isChecking, isAuthorized, redirectTo, router]);

  // Chargement
  if (isChecking) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: "50vh" }}>
        <Loader2 className="animate-spin" size={32} style={{ color: "var(--accent-9)" }} />
      </Flex>
    );
  }

  // Non autorise et aucune route accessible
  if (!isAuthorized && !isAdmin) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        gap="4"
        style={{ minHeight: "50vh" }}
      >
        <ShieldAlert size={64} style={{ color: "var(--red-9)" }} />
        <Text size="5" weight="bold">
          Accès non autorisé
        </Text>
        <Text size="2" color="gray" align="center">
          Vous n'avez pas accès à cette page.
          <br />
          Contactez votre administrateur pour obtenir les autorisations nécessaires.
        </Text>
      </Flex>
    );
  }

  return <>{children}</>;
}
