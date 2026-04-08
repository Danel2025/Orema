"use client";

/**
 * Page de deconnexion
 *
 * Affiche un message de confirmation et effectue la deconnexion
 * de Supabase Auth et de l'auth legacy.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Flex, Heading, Text, Spinner } from "@radix-ui/themes";
import { LogOutIcon } from "lucide-react";
import { logoutSupabase } from "@/actions/auth-supabase";

export default function LogoutPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Déconnecter de Supabase/legacy auth
        await logoutSupabase();
        // La redirection est geree par l'action
      } catch (err) {
        console.error("Erreur lors de la deconnexion:", err);
        setError("Une erreur est survenue lors de la deconnexion");
        setIsLoading(false);

        // Rediriger quand meme apres un delai
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    };

    performLogout();
  }, [router]);

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      style={{ minHeight: "100vh", padding: "1rem" }}
    >
      <Card size="4" style={{ width: "100%", maxWidth: "400px" }}>
        <Flex direction="column" gap="4" align="center" p="4">
          <LogOutIcon size={48} style={{ color: "var(--accent-9)" }} />

          <Heading size="5" align="center">
            {error ? "Erreur" : "Déconnexion..."}
          </Heading>

          {isLoading ? (
            <Flex direction="column" gap="3" align="center">
              <Spinner size="3" />
              <Text size="2" color="gray">
                Déconnexion en cours, veuillez patienter...
              </Text>
            </Flex>
          ) : error ? (
            <Flex direction="column" gap="3" align="center">
              <Text size="2" color="red" align="center">
                {error}
              </Text>
              <Text size="1" color="gray">
                Redirection vers la page de connexion...
              </Text>
            </Flex>
          ) : (
            <Text size="2" color="gray">
              Vous avez ete deconnecte avec succes.
            </Text>
          )}
        </Flex>
      </Card>
    </Flex>
  );
}
