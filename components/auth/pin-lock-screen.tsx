"use client";

/**
 * Écran de verrouillage par PIN
 *
 * S'affiche quand l'utilisateur est authentifié mais doit
 * entrer son PIN pour accéder à l'application.
 */

import { useState, useRef, useEffect, type ReactNode } from "react";
import { Box, Button, Flex, Heading, Text, Spinner } from "@radix-ui/themes";
import { LockKeyhole, LogOut, AlertCircle, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/context";
import { usePinLockStore } from "@/stores/pin-lock-store";
import { verifyPinForUnlock } from "@/actions/pin-unlock";
import { logoutSupabase } from "@/actions/auth-supabase";
import { useMounted } from "@/hooks/use-mounted";

interface PinLockScreenProps {
  children: ReactNode;
}

export function PinLockScreen({ children }: PinLockScreenProps) {
  const { user } = useAuth();
  const mounted = useMounted();
  const { isLocked, unlock, incrementFailedAttempts, failedAttempts } = usePinLockStore();

  const [pin, setPin] = useState(["", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Focus sur le premier input quand le lock screen apparaît
  useEffect(() => {
    if (isLocked && mounted) {
      // Petit délai pour laisser le DOM se stabiliser
      const timer = setTimeout(() => {
        inputRefs[0].current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLocked, mounted]);

  // Réinitialiser le PIN quand il y a une erreur
  useEffect(() => {
    if (error) {
      setPin(["", "", "", ""]);
      inputRefs[0].current?.focus();
    }
  }, [error]);

  const handlePinChange = (index: number, value: string) => {
    // Autoriser seulement les chiffres
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(null);

    // Auto-focus sur le prochain input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto-submit quand le PIN est complet
    if (value && index === 3) {
      const fullPin = newPin.join("");
      if (fullPin.length === 4) {
        handleVerifyPin(fullPin);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyPin = async (pinCode: string) => {
    if (isVerifying) return;

    setIsVerifying(true);
    setError(null);

    try {
      const result = await verifyPinForUnlock(pinCode);

      if (result.success) {
        unlock();
        toast.success("Session déverrouillée");
      } else {
        incrementFailedAttempts();
        setError(result.error || "PIN incorrect");

        // Après 5 tentatives, afficher un avertissement
        if (failedAttempts >= 4) {
          toast.error("Trop de tentatives échouées. Veuillez vous déconnecter.");
        }
      }
    } catch (err) {
      setError("Une erreur est survenue");
      console.error("[PIN Lock] Verification error:", err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutSupabase();
    } catch (err) {
      console.error("[PIN Lock] Logout error:", err);
      setIsLoggingOut(false);
    }
  };

  // Obtenir les initiales
  const getInitials = () => {
    if (!user) return "??";
    return `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase();
  };

  // Éviter les erreurs d'hydratation - ne rien afficher avant le montage
  if (!mounted) {
    return <>{children}</>;
  }

  // Si pas verrouillé ou pas d'utilisateur, afficher les enfants
  if (!isLocked || !user) {
    return <>{children}</>;
  }

  // Afficher l'écran de verrouillage
  return (
    <Box
      position="fixed"
      inset="0"
      style={{
        backgroundColor: "var(--color-background)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Flex
        direction="column"
        align="center"
        gap="6"
        p="6"
        style={{
          maxWidth: 400,
          width: "100%",
        }}
      >
        {/* Logo/Icône */}
        <Flex
          align="center"
          justify="center"
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: "var(--accent-3)",
          }}
        >
          <LockKeyhole size={40} style={{ color: "var(--accent-9)" }} />
        </Flex>

        {/* Titre */}
        <Flex direction="column" align="center" gap="1">
          <Heading size="6" weight="bold" style={{ color: "var(--accent-9)" }}>
            Session verrouillée
          </Heading>
          <Text size="2" color="gray">
            Entrez votre PIN pour continuer
          </Text>
        </Flex>

        {/* Info utilisateur */}
        <Flex
          align="center"
          gap="3"
          p="3"
          style={{
            backgroundColor: "var(--gray-a2)",
            borderRadius: "var(--radius-3)",
            width: "100%",
          }}
        >
          <Flex
            align="center"
            justify="center"
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              backgroundColor: "var(--accent-9)",
              color: "white",
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            {getInitials()}
          </Flex>
          <Box style={{ flex: 1 }}>
            <Text size="2" weight="medium">
              {user.prenom} {user.nom}
            </Text>
            <Text size="1" color="gray">
              {user.email}
            </Text>
          </Box>
        </Flex>

        {/* Inputs PIN */}
        <Flex direction="column" gap="3" align="center" style={{ width: "100%" }}>
          <Flex gap="3" justify="center">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isVerifying}
                autoComplete="off"
                style={{
                  width: 60,
                  height: 70,
                  fontSize: 32,
                  textAlign: "center",
                  border: error ? "2px solid var(--red-9)" : "2px solid var(--gray-6)",
                  borderRadius: 8,
                  outline: "none",
                  transition: "all 0.2s",
                  backgroundColor: "var(--gray-1)",
                  color: "var(--gray-12)",
                }}
                onFocus={(e) => {
                  if (!error) {
                    e.target.style.borderColor = "var(--accent-9)";
                    e.target.style.boxShadow = "0 0 0 3px var(--accent-3)";
                  }
                }}
                onBlur={(e) => {
                  if (!error) {
                    e.target.style.borderColor = "var(--gray-6)";
                    e.target.style.boxShadow = "none";
                  }
                }}
              />
            ))}
          </Flex>

          {/* Message d'erreur */}
          {error ? (
            <Flex gap="2" align="center">
              <AlertCircle size={14} color="var(--red-9)" />
              <Text size="2" color="red">
                {error}
              </Text>
            </Flex>
          ) : null}

          {/* Indicateur de vérification */}
          {isVerifying ? (
            <Flex gap="2" align="center">
              <Spinner size="1" />
              <Text size="2" color="gray">
                Vérification...
              </Text>
            </Flex>
          ) : null}
        </Flex>

        {/* Bouton de déconnexion */}
        <Button
          variant="soft"
          color="gray"
          size="2"
          onClick={handleLogout}
          disabled={isLoggingOut}
          style={{ cursor: isLoggingOut ? "not-allowed" : "pointer" }}
        >
          {isLoggingOut ? (
            <>
              <Spinner size="1" />
              Déconnexion...
            </>
          ) : (
            <>
              <LogOut size={16} />
              Se déconnecter
            </>
          )}
        </Button>

        {/* Note de sécurité */}
        {failedAttempts >= 3 && (
          <Text size="1" color="red" align="center">
            {5 - failedAttempts} tentative(s) restante(s) avant blocage
          </Text>
        )}
      </Flex>
    </Box>
  );
}
