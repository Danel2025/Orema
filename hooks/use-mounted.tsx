/**
 * Hook pour détecter si le composant est monté (côté client)
 * Utile pour éviter les erreurs d'hydratation avec les composants
 * qui génèrent des IDs aléatoires (ex: Radix UI Popover, DropdownMenu)
 *
 * Utilise useSyncExternalStore pour éviter les re-renders en cascade
 * (best practice React 19 / React Compiler).
 */

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Retourne `true` uniquement après l'hydratation côté client.
 * Utile pour les composants qui ne doivent pas être rendus en SSR.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
}

/**
 * Composant wrapper pour le rendu client-only.
 * Les enfants ne sont rendus qu'après l'hydratation.
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const mounted = useMounted();

  if (!mounted) {
    return fallback;
  }

  return <>{children}</>;
}
