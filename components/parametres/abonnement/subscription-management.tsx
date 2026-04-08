"use client";

import { useState } from "react";
import {
  Box,
  Flex,
  Text,
  Heading,
  Button,
  Dialog,
  Callout,
} from "@radix-ui/themes";
import {
  XCircle,
  ArrowCounterClockwise,
  Warning,
  ArrowClockwise,
  CreditCard,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  cancelSubscription,
  reactivateSubscription,
  getCustomerPortalUrl,
} from "@/actions/subscriptions";
import type { PlanSlug } from "@/lib/config/plans";

// ── Types ──────────────────────────────────────────────────────────────

interface SubscriptionManagementProps {
  plan: PlanSlug;
  statut: "actif" | "essai" | "expire" | "annule";
  dateFin?: string;
  hasStripe?: boolean;
}

// ── Component ──────────────────────────────────────────────────────────

export function SubscriptionManagement({
  plan,
  statut,
  dateFin,
  hasStripe,
}: SubscriptionManagementProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  const isEssentiel = plan === "essentiel";
  const isAnnule = statut === "annule";
  const canCancel = !isEssentiel && !isAnnule;

  const dateFinFormatted = dateFin
    ? new Date(dateFin).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const result = await cancelSubscription();
      if (!result.success) {
        toast.error(result.error ?? "Erreur lors de l'annulation");
        return;
      }
      toast.success("Abonnement annulé avec succès");
      setCancelDialogOpen(false);
      // Force page reload to reflect the new state
      window.location.reload();
    } catch {
      toast.error("Une erreur inattendue est survenue");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReactivate = async () => {
    setIsReactivating(true);
    try {
      const result = await reactivateSubscription();
      if (!result.success) {
        toast.error(result.error ?? "Erreur lors de la réactivation");
        return;
      }
      toast.success("Abonnement réactivé avec succès");
      window.location.reload();
    } catch {
      toast.error("Une erreur inattendue est survenue");
    } finally {
      setIsReactivating(false);
    }
  };

  const handleStripePortal = async () => {
    setIsLoadingPortal(true);
    try {
      const result = await getCustomerPortalUrl();
      if (!result.success) {
        toast.error(result.error ?? "Erreur lors de l'accès au portail Stripe");
        return;
      }
      if (result.data?.url) {
        window.location.href = result.data.url;
      }
    } catch {
      toast.error("Une erreur inattendue est survenue");
    } finally {
      setIsLoadingPortal(false);
    }
  };

  // Ne rien afficher si plan essentiel et statut actif (rien à gérer)
  if (isEssentiel && !isAnnule) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
    >
      <Box
        p="5"
        style={{
          background: "var(--color-background)",
          borderRadius: 14,
          border: "1px solid var(--gray-a4)",
        }}
      >
        <Heading size="3" weight="bold" mb="4">
          Gestion de l&apos;abonnement
        </Heading>

        <Flex direction="column" gap="4">
          {/* Callout annulé */}
          {isAnnule && (
            <Callout.Root color="amber" variant="surface">
              <Callout.Icon>
                <Warning size={16} weight="fill" />
              </Callout.Icon>
              <Callout.Text size="2">
                Votre abonnement est annulé.
                {dateFinFormatted
                  ? ` Il restera actif jusqu'au ${dateFinFormatted}.`
                  : " Il n'est plus actif."}
              </Callout.Text>
            </Callout.Root>
          )}

          <Flex gap="3" wrap="wrap">
            {/* Bouton annuler */}
            {canCancel && (
              <Button
                color="red"
                variant="outline"
                onClick={() => setCancelDialogOpen(true)}
              >
                <XCircle size={16} weight="bold" />
                Annuler l&apos;abonnement
              </Button>
            )}

            {/* Bouton réactiver */}
            {isAnnule && (
              <Button
                color="green"
                onClick={handleReactivate}
                disabled={isReactivating}
              >
                {isReactivating ? (
                  <>
                    <ArrowClockwise size={14} weight="bold" className="animate-spin" />
                    Réactivation...
                  </>
                ) : (
                  <>
                    <ArrowCounterClockwise size={16} weight="bold" />
                    Réactiver l&apos;abonnement
                  </>
                )}
              </Button>
            )}

            {/* Bouton portail Stripe */}
            {hasStripe && (
              <Button
                variant="outline"
                color="gray"
                onClick={handleStripePortal}
                disabled={isLoadingPortal}
              >
                {isLoadingPortal ? (
                  <>
                    <ArrowClockwise size={14} weight="bold" className="animate-spin" />
                    Chargement...
                  </>
                ) : (
                  <>
                    <CreditCard size={16} weight="duotone" />
                    Gérer la facturation Stripe
                    <ArrowSquareOut size={14} weight="bold" />
                  </>
                )}
              </Button>
            )}
          </Flex>
        </Flex>
      </Box>

      {/* Dialog de confirmation d'annulation */}
      <Dialog.Root
        open={cancelDialogOpen}
        onOpenChange={(open) => {
          if (!isCancelling) setCancelDialogOpen(open);
        }}
      >
        <Dialog.Content maxWidth="480px">
          <Dialog.Title>
            <Flex align="center" gap="2">
              <Warning size={20} weight="fill" style={{ color: "var(--red-9)" }} />
              Annuler votre abonnement
            </Flex>
          </Dialog.Title>

          <Dialog.Description size="2" mb="4" color="gray">
            Êtes-vous sûr de vouloir annuler votre abonnement ?
          </Dialog.Description>

          <Callout.Root color="red" variant="surface" mb="4">
            <Callout.Icon>
              <Warning size={16} weight="fill" />
            </Callout.Icon>
            <Callout.Text size="2">
              L&apos;annulation prendra effet à la fin de votre période de facturation actuelle.
              {dateFinFormatted
                ? ` Votre abonnement restera actif jusqu'au ${dateFinFormatted}.`
                : ""}
              {" "}Après cette date, vous serez basculé sur le plan Essentiel (gratuit).
            </Callout.Text>
          </Callout.Root>

          <Flex gap="3" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" disabled={isCancelling}>
                Conserver mon abonnement
              </Button>
            </Dialog.Close>
            <Button color="red" onClick={handleCancel} disabled={isCancelling}>
              {isCancelling ? (
                <>
                  <ArrowClockwise size={14} weight="bold" className="animate-spin" />
                  Annulation en cours...
                </>
              ) : (
                <>
                  <XCircle size={14} weight="fill" />
                  Confirmer l&apos;annulation
                </>
              )}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </motion.div>
  );
}
