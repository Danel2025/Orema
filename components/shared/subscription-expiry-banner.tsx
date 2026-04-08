"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Callout, Flex, Button, IconButton, Text } from "@radix-ui/themes";
import { Warning, Clock, Info, X } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth/context";

type ExpiryState = "expired" | "expiring_soon" | "trial_ending" | null;

function getExpiryState(statut: string, dateFin?: string): ExpiryState {
  if (statut === "expire") return "expired";
  if (!dateFin) return null;

  const now = new Date();
  const fin = new Date(dateFin);
  const daysLeft = Math.ceil(
    (fin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysLeft <= 0) return "expired";
  if (statut === "en_essai" && daysLeft <= 3) return "trial_ending";
  if (daysLeft <= 7) return "expiring_soon";
  return null;
}

function formatDateFr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function SubscriptionExpiryBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const plan = user?.plan ?? "essentiel";
  const statut = user?.planStatut ?? "actif";
  const dateFin = user?.planDateFin;

  const expiryState = getExpiryState(statut, dateFin);

  // Vérifier le dismiss dans localStorage (reset chaque jour)
  useEffect(() => {
    if (!expiryState || expiryState === "expired") return;
    const today = new Date().toISOString().slice(0, 10);
    const key = `subscription_banner_dismissed_${today}`;
    if (localStorage.getItem(key) === "true") {
      setDismissed(true);
    }
  }, [expiryState]);

  if (!expiryState) return null;
  if (dismissed && expiryState !== "expired") return null;

  const handleDismiss = () => {
    const today = new Date().toISOString().slice(0, 10);
    const key = `subscription_banner_dismissed_${today}`;
    localStorage.setItem(key, "true");
    setDismissed(true);
  };

  const config = {
    expired: {
      color: "red" as const,
      icon: <Warning size={18} weight="fill" />,
      text: `Votre abonnement a expiré. Vous êtes sur le plan Essentiel (gratuit). Certaines fonctionnalités sont désactivées.`,
      buttonLabel: "Réactiver mon abonnement",
      canDismiss: false,
      role: "alert" as const,
    },
    expiring_soon: {
      color: "amber" as const,
      icon: <Clock size={18} weight="fill" />,
      text: `Votre abonnement expire le ${dateFin ? formatDateFr(dateFin) : ""}. Renouvelez pour continuer à bénéficier de toutes les fonctionnalités.`,
      buttonLabel: "Renouveler maintenant",
      canDismiss: true,
      role: undefined,
    },
    trial_ending: {
      color: "blue" as const,
      icon: <Info size={18} weight="fill" />,
      text: `Votre essai gratuit se termine le ${dateFin ? formatDateFr(dateFin) : ""}. Choisissez un plan pour continuer.`,
      buttonLabel: "Voir les plans",
      canDismiss: true,
      role: undefined,
    },
  };

  const current = config[expiryState];

  return (
    <Callout.Root
      color={current.color}
      variant="surface"
      mb="4"
      role={current.role}
    >
      <Callout.Icon>{current.icon}</Callout.Icon>
      <Flex
        align="center"
        justify="between"
        gap="4"
        wrap="wrap"
        style={{ flex: 1 }}
      >
        <Callout.Text style={{ flex: 1 }}>{current.text}</Callout.Text>
        <Flex align="center" gap="2" flexShrink="0">
          <Button asChild size="1" variant="solid" color={current.color}>
            <Link href="/parametres/abonnement">{current.buttonLabel}</Link>
          </Button>
          {current.canDismiss && (
            <IconButton
              variant="ghost"
              color="gray"
              size="1"
              onClick={handleDismiss}
              aria-label="Fermer la notification"
            >
              <X size={14} />
            </IconButton>
          )}
        </Flex>
      </Flex>
    </Callout.Root>
  );
}
