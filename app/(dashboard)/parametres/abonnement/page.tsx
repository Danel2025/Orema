import { Suspense } from "react";
import { Box, Flex, Heading, Text, Skeleton } from "@radix-ui/themes";
import { getCurrentSubscription } from "@/actions/subscriptions";
import { getInvoices } from "@/actions/billing";
import { resolvePlanSlug } from "@/lib/config/plans";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AbonnementClient } from "./client";

export const metadata = {
  title: "Abonnement | Paramètres",
  description: "Gérez votre abonnement, vos quotas et vos factures",
};

interface PageProps {
  searchParams: Promise<{
    payment?: string;
    ref?: string;
    session_id?: string;
  }>;
}

function AbonnementSkeleton() {
  return (
    <Flex direction="column" gap="5">
      <Skeleton style={{ height: 100, borderRadius: 14 }} />
      <Skeleton style={{ height: 120, borderRadius: 14 }} />
      <Skeleton style={{ height: 400, borderRadius: 14 }} />
    </Flex>
  );
}

async function AbonnementLoader({
  paymentStatus,
  paymentRef,
  sessionId,
}: {
  paymentStatus?: string;
  paymentRef?: string;
  sessionId?: string;
}) {
  const [subResult, invoicesResult, user] = await Promise.all([
    getCurrentSubscription(),
    getInvoices(),
    getCurrentUser(),
  ]);

  const subscription = subResult.success ? subResult.data : null;
  const invoices = invoicesResult.success ? invoicesResult.data ?? [] : [];

  // Charger les infos de facturation de l'établissement
  let billingInfo: {
    nom: string;
    adresse: string;
    email: string;
    nif?: string;
    rccm?: string;
  } | undefined;

  if (user?.etablissementId) {
    const supabase = await createClient();
    const { data: etab } = await supabase
      .from("etablissements")
      .select("nom, adresse, email, nif, rccm")
      .eq("id", user.etablissementId)
      .single();

    if (etab) {
      const e = etab as {
        nom: string | null;
        adresse: string | null;
        email: string | null;
        nif: string | null;
        rccm: string | null;
      };
      billingInfo = {
        nom: e.nom ?? "",
        adresse: e.adresse ?? "",
        email: e.email ?? user.email ?? "",
        nif: e.nif ?? undefined,
        rccm: e.rccm ?? undefined,
      };
    }
  }

  return (
    <AbonnementClient
      paymentCallback={
        paymentStatus
          ? { payment: paymentStatus, ref: paymentRef, sessionId }
          : undefined
      }
      initialBillingInfo={billingInfo}
      initialSubscription={
        subscription
          ? {
              plan: resolvePlanSlug(subscription.plan),
              cycle: subscription.billingCycle,
              statut:
                subscription.status === "active" || subscription.status === "actif"
                  ? "actif"
                  : subscription.status === "en_essai"
                    ? "essai"
                    : subscription.status === "expire"
                      ? "expire"
                      : "annule",
              dateDebut: subscription.dateDebut ?? new Date().toISOString(),
              dateFin: subscription.dateFin ?? undefined,
              quotas: [
                {
                  label: "Utilisateurs",
                  current: subscription.quotas.utilisateurs.actuel,
                  max: subscription.quotas.utilisateurs.max,
                },
                {
                  label: "Produits",
                  current: subscription.quotas.produits.actuel,
                  max: subscription.quotas.produits.max,
                },
                {
                  label: "Ventes ce mois",
                  current: subscription.quotas.ventesMois.actuel,
                  max: subscription.quotas.ventesMois.max,
                },
              ],
            }
          : undefined
      }
      initialInvoices={invoices.map((inv) => ({
        id: inv.id,
        numero: inv.numero,
        date: inv.createdAt,
        montant: inv.montantTtc,
        statut:
          inv.statut === "paid" || inv.statut === "payee"
            ? ("payee" as const)
            : inv.statut === "overdue" || inv.statut === "en_retard"
              ? ("echue" as const)
              : ("en_attente" as const),
      }))}
    />
  );
}

export default async function AbonnementPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <Box p="4">
      <Flex direction="column" gap="2" mb="6">
        <Heading size="6" weight="bold">
          Abonnement
        </Heading>
        <Text size="2" color="gray">
          Gerez votre plan, vos quotas d&apos;utilisation et vos factures
        </Text>
      </Flex>

      <Suspense fallback={<AbonnementSkeleton />}>
        <AbonnementLoader
          paymentStatus={params.payment}
          paymentRef={params.ref}
          sessionId={params.session_id}
        />
      </Suspense>
    </Box>
  );
}
