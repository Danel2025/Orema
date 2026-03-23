"use client";

import { useState } from "react";
import { Flex, Separator } from "@radix-ui/themes";
import { toast } from "sonner";
import { CurrentPlanCard } from "@/components/parametres/abonnement/current-plan-card";
import { PlanSelector } from "@/components/parametres/abonnement/plan-selector";
import { PaymentMethodSelector } from "@/components/parametres/abonnement/payment-method-selector";
import { InvoiceHistory } from "@/components/parametres/abonnement/invoice-history";
import { upgradePlan, downgradePlan } from "@/actions/subscriptions";
import { initiatePayment, downloadInvoice } from "@/actions/billing";
import { canUpgrade, type PlanSlug, type BillingCycle } from "@/lib/config/plans";
import type { Invoice } from "@/components/parametres/abonnement/invoice-history";
import type { PaymentMethod } from "@/components/parametres/abonnement/payment-method-selector";

// ── Types ──────────────────────────────────────────────────────────────

interface SubscriptionData {
  plan: PlanSlug;
  cycle: BillingCycle;
  statut: "actif" | "essai" | "expire" | "annule";
  dateDebut: string;
  dateFin?: string;
  quotas: { label: string; current: number; max: number }[];
}

interface AbonnementClientProps {
  initialSubscription?: SubscriptionData;
  initialInvoices?: Invoice[];
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
}: AbonnementClientProps) {
  const sub = initialSubscription ?? DEFAULT_SUBSCRIPTION;
  const [currentPlan] = useState<PlanSlug>(sub.plan);
  const [currentCycle] = useState<BillingCycle>(sub.cycle);
  const [invoices] = useState<Invoice[]>(initialInvoices);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("monetbil");

  const handleChangePlan = async (plan: PlanSlug, cycle: BillingCycle) => {
    const isUpgrading = canUpgrade(currentPlan, plan);

    if (isUpgrading) {
      // Upgrade : verifier puis initier le paiement
      const result = await upgradePlan(plan, cycle, "monetbil");
      if (!result.success) {
        toast.error(result.error ?? "Erreur lors de l'upgrade");
        return;
      }

      if (result.data?.requiresPayment) {
        // Initier le paiement
        const paymentResult = await initiatePayment({
          planSlug: plan,
          billingCycle: cycle,
          paymentMethod: "monetbil",
        });

        if (!paymentResult.success) {
          toast.error(paymentResult.error ?? "Erreur lors du paiement");
          return;
        }

        if (paymentResult.data?.paymentUrl) {
          window.location.href = paymentResult.data.paymentUrl;
          return;
        }
      }

      toast.success(`Plan mis a jour vers ${plan}`);
    } else {
      // Downgrade
      const result = await downgradePlan(plan);
      if (!result.success) {
        toast.error(result.error ?? "Erreur lors du downgrade");
        return;
      }

      const effectiveDate = result.data?.effectiveDate
        ? new Date(result.data.effectiveDate).toLocaleDateString("fr-FR")
        : "immediatement";

      toast.success(`Downgrade vers ${plan} effectif le ${effectiveDate}`);
    }
  };

  const handleChangePaymentMethod = async (method: PaymentMethod) => {
    setPaymentMethod(method);
    toast.success(
      method === "monetbil"
        ? "Airtel Money selectionne pour le prochain paiement"
        : "Carte bancaire selectionnee pour le prochain paiement"
    );
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

      {/* Methode de paiement */}
      <PaymentMethodSelector
        currentMethod={paymentMethod}
        onSelect={handleChangePaymentMethod}
      />

      <Separator size="4" />

      {/* Historique factures */}
      <InvoiceHistory
        invoices={invoices}
        totalPages={1}
        currentPage={1}
        onDownload={handleDownloadInvoice}
      />
    </Flex>
  );
}
