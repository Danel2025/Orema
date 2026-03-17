"use client";

/**
 * SessionRequired - Composant qui bloque l'acces si aucune session n'est ouverte
 * Affiche un message et un bouton pour ouvrir la caisse
 * Utilise Radix UI Themes pour le styling
 */

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Card,
  Callout,
} from "@radix-ui/themes";
import {
  DoorClosed,
  DoorOpen,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { getActiveSession } from "@/actions/sessions";
import { OpenSessionDialog } from "./open-session-dialog";
import type { SessionActive } from "@/actions/sessions";

interface SessionRequiredProps {
  children: React.ReactNode;
  onSessionChange?: (session: SessionActive | null) => void;
}

export function SessionRequired({ children, onSessionChange }: SessionRequiredProps) {
  const [session, setSession] = useState<SessionActive | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOpenDialog, setShowOpenDialog] = useState(false);

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const activeSession = await getActiveSession();
      setSession(activeSession);
      onSessionChange?.(activeSession);
    } catch (error) {
      console.error("Erreur chargement session:", error);
    } finally {
      setIsLoading(false);
    }
  }, [onSessionChange]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const handleSessionOpened = () => {
    loadSession();
  };

  // Loading state
  if (isLoading) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        style={{ minHeight: "50vh" }}
        gap="3"
      >
        <Box
          style={{
            width: 48,
            height: 48,
            borderRadius: "var(--radius-3)",
            backgroundColor: "var(--gray-a3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "pulse 1.5s infinite",
          }}
        >
          <RefreshCw size={24} color="var(--gray-9)" style={{ animation: "spin 1s linear infinite" }} />
        </Box>
        <Text color="gray">Verification de la session...</Text>
        <style jsx global>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </Flex>
    );
  }

  // No session - Show blocker
  if (!session) {
    return (
      <>
        <Flex
          direction="column"
          align="center"
          justify="center"
          style={{ minHeight: "60vh" }}
          gap="4"
        >
          <Box
            style={{
              width: 80,
              height: 80,
              borderRadius: "var(--radius-4)",
              backgroundColor: "var(--red-a3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DoorClosed size={40} color="var(--red-11)" />
          </Box>

          <Flex direction="column" align="center" gap="2">
            <Text size="5" weight="bold">
              Caisse fermee
            </Text>
            <Text size="3" color="gray" align="center" style={{ maxWidth: 400 }}>
              Aucune session de caisse n'est ouverte. Vous devez ouvrir la caisse pour effectuer des ventes.
            </Text>
          </Flex>

          <Card
            style={{
              maxWidth: 400,
              backgroundColor: "var(--purple-a2)",
              borderColor: "var(--amber-a5)",
            }}
          >
            <Callout.Root color="amber" size="1">
              <Callout.Icon>
                <AlertTriangle size={16} />
              </Callout.Icon>
              <Callout.Text>
                Toutes les ventes seront enregistrees dans cette session jusqu'a sa cloture.
              </Callout.Text>
            </Callout.Root>
          </Card>

          <Flex gap="3" mt="2">
            <Button variant="soft" color="gray" onClick={loadSession}>
              <RefreshCw size={16} />
              Actualiser
            </Button>
            <Button color="green" size="3" onClick={() => setShowOpenDialog(true)}>
              <DoorOpen size={18} />
              Ouvrir la caisse
            </Button>
          </Flex>
        </Flex>

        <OpenSessionDialog
          open={showOpenDialog}
          onOpenChange={setShowOpenDialog}
          onSuccess={handleSessionOpened}
        />
      </>
    );
  }

  // Session active - Render children
  return <>{children}</>;
}

/**
 * Hook pour utiliser la session active dans les composants enfants
 */
export function useSessionRequired() {
  const [session, setSession] = useState<SessionActive | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const activeSession = await getActiveSession();
      setSession(activeSession);
      return activeSession;
    } catch (error) {
      console.error("Erreur chargement session:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    const activeSession = await getActiveSession();
    setSession(activeSession);
    return activeSession;
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  return {
    session,
    isLoading,
    hasSession: session !== null,
    refreshSession,
  };
}
