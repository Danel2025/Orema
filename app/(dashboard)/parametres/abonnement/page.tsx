import { Suspense } from "react";
import { Box, Flex, Heading, Text, Skeleton } from "@radix-ui/themes";
import { getCurrentSubscription } from "@/actions/subscriptions";
import { getInvoices } from "@/actions/billing";
import { resolvePlanSlug } from "@/lib/config/plans";
import { AbonnementClient } from "./client";

export const metadata = {
  title: "Abonnement | Paramètres",
  description: "Gérez votre abonnement, vos quotas et vos factures",
};

function AbonnementSkeleton() {
  return (
    <Flex direction="column" gap="5">
      <Skeleton style={{ height: 100, borderRadius: 14 }} />
      <Skeleton style={{ height: 120, borderRadius: 14 }} />
      <Skeleton style={{ height: 400, borderRadius: 14 }} />
    </Flex>
  );
}

async function AbonnementLoader() {
  const [subResult, invoicesResult] = await Promise.all([
    getCurrentSubscription(),
    getInvoices(),
  ]);

  const subscription = subResult.success ? subResult.data : null;
  const invoices = invoicesResult.success ? invoicesResult.data ?? [] : [];

  return (
    <AbonnementClient
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

export default function AbonnementPage() {
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
        <AbonnementLoader />
      </Suspense>
    </Box>
  );
}
