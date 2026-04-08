"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Flex, Separator } from "@radix-ui/themes";
import { toast } from "sonner";
import { CurrentPlanCard } from "@/components/parametres/abonnement/current-plan-card";
import { PlanSelector } from "@/components/parametres/abonnement/plan-selector";
import { InvoiceHistory } from "@/components/parametres/abonnement/invoice-history";
import { UpgradeCheckoutDialog } from "@/components/parametres/abonnement/upgrade-checkout-dialog";
import { SubscriptionManagement } from "@/components/parametres/abonnement/subscription-management";
import {
  PaymentStatusBanner,
  type PaymentBannerStatus,
} from "@/components/parametres/abonnement/payment-status-banner";
import { downgradePlan } from "@/actions/subscriptions";
import { downloadInvoice, getPaymentStatus } from "@/actions/billing";
import { canUpgrade, type PlanSlug, type BillingCycle } from "@/lib/config/plans";
import type { Invoice } from "@/components/parametres/abonnement/invoice-history";

// ── Types ──────────────────────────────────────────────────────────────

interface SubscriptionData {
  plan: PlanSlug;
  cycle: BillingCycle;
  statut: "actif" | "essai" | "expire" | "annule";
  dateDebut: string;
  dateFin?: string;
  quotas: { label: string; current: number; max: number }[];
  hasStripe?: boolean;
}

interface PaymentCallback {
  payment: string;
  ref?: string;
  sessionId?: string;
}

interface AbonnementClientProps {
  initialSubscription?: SubscriptionData;
  initialInvoices?: Invoice[];
  paymentCallback?: PaymentCallback;
  initialBillingInfo?: {
    nom: string;
    adresse: string;
    email: string;
    nif?: string;
    rccm?: string;
  };
}

// ── Defaults ───────────────────────────────────────────────────────────

const DEFAULT_SUBSCRIPTION: SubscriptionData = {
  plan: "essentiel",
  cycle: "mensuel",
  statut: "actif",
  dateDebut: new Date().toISOString(),
  quotas: [
    { label: "Utilisateurs", current: 0, max: 2 },
    { label: "Produits", current: 0, max: 50 },
    { label: "Ventes ce mois", current: 0, max: 500 },
  ],
};

// ── Main Client Component ──────────────────────────────────────────────

export function AbonnementClient({
  initialSubscription,
  initialInvoices = [],
  paymentCallback,
  initialBillingInfo,
}: AbonnementClientProps) {
  const router = useRouter();
  const sub = initialSubscription ?? DEFAULT_SUBSCRIPTION;
  const [currentPlan] = useState<PlanSlug>(sub.plan);
  const [currentCycle] = useState<BillingCycle>(sub.cycle);
  const [invoices] = useState<Invoice[]>(initialInvoices);

  // Payment callback banner state
  const [bannerStatus, setBannerStatus] = useState<PaymentBannerStatus | null>(null);
  const pollingRef = useRef(false);

  const cleanUrl = useCallback(() => {
    router.replace("/parametres/abonnement");
  }, [router]);

  // Polling du statut de paiement Monetbil
  useEffect(() => {
    if (!paymentCallback || pollingRef.current) return;

    const { payment, ref, sessionId } = paymentCallback;

    // Paiement annule
    if (payment === "cancelled") {
      setBannerStatus("cancelled");
      toast.error("Paiement annulé");
      cleanUrl();
      return;
    }

    // Stripe success: le webhook confirme en arriere-plan
    if (payment === "success" && sessionId) {
      setBannerStatus("success");
      toast.success("Paiement confirmé ! Votre plan a été mis à jour.");
      router.refresh();
      cleanUrl();
      return;
    }

    // Monetbil: polling du statut via ref
    if (payment === "done" && ref) {
      pollingRef.current = true;
      setBannerStatus("checking");

      let attempts = 0;
      const MAX_ATTEMPTS = 12;
      const POLL_INTERVAL = 5000;

      const poll = async () => {
        attempts++;
        try {
          const result = await getPaymentStatus(ref);
          if (result.success && result.data) {
            if (result.data.status === "reussi") {
              setBannerStatus("success");
              toast.success("Paiement confirmé ! Votre plan a été mis à jour.");
              router.refresh();
              cleanUrl();
              return;
            }
            if (result.data.status === "echoue") {
              setBannerStatus("error");
              toast.error("Le paiement n'a pas abouti");
              cleanUrl();
              return;
            }
          }
        } catch {
          // Ignorer les erreurs reseau pendant le polling
        }

        if (attempts >= MAX_ATTEMPTS) {
          // Timeout: le webhook n'a peut-etre pas encore ete recu
          setBannerStatus("error");
          toast.error(
            "La vérification du paiement a expiré. Vérifiez votre paiement dans quelques instants."
          );
          cleanUrl();
          return;
        }

        // Continuer le polling
        setTimeout(poll, POLL_INTERVAL);
      };

      poll();
    }
  }, [paymentCallback, router, cleanUrl]);

  // Upgrade checkout dialog state
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [upgradeTarget, setUpgradeTarget] = useState<{
    plan: PlanSlug;
    cycle: BillingCycle;
  } | null>(null);

  const handleChangePlan = async (plan: PlanSlug, cycle: BillingCycle) => {
    const isUpgrading = canUpgrade(currentPlan, plan);

    if (isUpgrading) {
      // Ouvrir le dialog de checkout pour l'upgrade
      setUpgradeTarget({ plan, cycle });
      setUpgradeDialogOpen(true);
    } else {
      // Downgrade direct
      const result = await downgradePlan(plan);
      if (!result.success) {
        toast.error(result.error ?? "Erreur lors du downgrade");
        return;
      }

      const effectiveDate = result.data?.effectiveDate
        ? new Date(result.data.effectiveDate).toLocaleDateString("fr-FR")
        : "immédiatement";

      toast.success(`Downgrade vers ${plan} effectif le ${effectiveDate}`);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    const result = await downloadInvoice(invoiceId);
    if (!result.success) {
      toast.error(result.error ?? "Erreur lors du téléchargement");
      return;
    }

    if (result.data?.url) {
      window.open(result.data.url, "_blank");
    }
  };

  return (
    <Flex direction="column" gap="6">
      {/* Banner de statut de paiement */}
      {bannerStatus && (
        <PaymentStatusBanner
          status={bannerStatus}
          onClose={() => setBannerStatus(null)}
        />
      )}

      {/* Plan actuel + quotas */}
      <CurrentPlanCard
        plan={sub.plan}
        cycle={sub.cycle}
        statut={sub.statut}
        dateDebut={sub.dateDebut}
        dateFin={sub.dateFin}
        quotas={sub.quotas}
      />

      <Separator size="4" />

      {/* Plans disponibles */}
      <PlanSelector
        currentPlan={currentPlan}
        currentCycle={currentCycle}
        onChangePlan={handleChangePlan}
      />

      <Separator size="4" />

      {/* Gestion de l'abonnement */}
      <SubscriptionManagement
        plan={sub.plan}
        statut={sub.statut}
        dateFin={sub.dateFin}
        hasStripe={sub.hasStripe}
      />

      <Separator size="4" />

      {/* Historique factures */}
      <InvoiceHistory
        invoices={invoices}
        totalPages={1}
        currentPage={1}
        onDownload={handleDownloadInvoice}
      />

      {/* Dialog de checkout pour upgrade */}
      {upgradeTarget && (
        <UpgradeCheckoutDialog
          open={upgradeDialogOpen}
          onOpenChange={setUpgradeDialogOpen}
          currentPlan={currentPlan}
          currentCycle={currentCycle}
          targetPlan={upgradeTarget.plan}
          targetCycle={upgradeTarget.cycle}
          initialBillingInfo={initialBillingInfo}
        />
      )}
    </Flex>
  );
}
