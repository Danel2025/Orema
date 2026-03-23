"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Supprime tous les cookies de session (custom JWT + Supabase)
 */
function clearAllSessionCookies() {
  // Clear custom JWT session
  document.cookie = "orema_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";

  // Clear Supabase auth cookies (sb-* prefix)
  document.cookie.split(";").forEach((cookie) => {
    const [name] = cookie.trim().split("=");
    if (name.startsWith("sb-")) {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    }
  });
}

/**
 * Composant pour valider et nettoyer les sessions corrompues
 * À utiliser dans les layouts ou pages critiques
 */
export function SessionValidator() {
  const router = useRouter();
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    // Écouter les erreurs de navigation
    const handleError = () => {
      setErrorCount((prev) => {
        const newCount = prev + 1;

        // Si trop d'erreurs consécutives, nettoyer la session
        if (newCount >= 3) {
          console.warn("[SessionValidator] Trop d'erreurs, nettoyage de la session");

          fetch("/api/clear-session", { method: "POST" })
            .then(() => {
              router.push("/login");
              router.refresh();
            })
            .catch(() => {
              // Fallback: clear all session cookies client-side
              clearAllSessionCookies();
              window.location.href = "/login";
            });

          return 0;
        }

        return newCount;
      });
    };

    // Reset le compteur après 10 secondes sans erreur
    const resetTimer = setTimeout(() => {
      setErrorCount(0);
    }, 10000);

    // Écouter les erreurs globales
    window.addEventListener("error", handleError);

    return () => {
      clearTimeout(resetTimer);
      window.removeEventListener("error", handleError);
    };
  }, [router, errorCount]);

  // Composant invisible, ne rend rien
  return null;
}

/**
 * Hook pour forcer le nettoyage de la session
 * Utile dans les pages de login ou d'erreur
 */
export function useClearSession() {
  const router = useRouter();

  const clearSession = async () => {
    try {
      await fetch("/api/clear-session", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("[useClearSession] Erreur:", error);
      // Fallback: clear cookies client-side
      clearAllSessionCookies();
      window.location.href = "/login";
    }
  };

  return { clearSession };
}
