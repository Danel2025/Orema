"use client";

import Link from "next/link";
import { Callout, Button } from "@radix-ui/themes";
import { Rocket } from "@phosphor-icons/react";
import { usePlanFeature, usePlanAtLeast } from "@/hooks/use-plan-gate";
import type { PlanFeatures, PlanSlug } from "@/lib/config/plans";

interface UpgradeBannerProps {
  feature?: keyof PlanFeatures;
  minPlan?: PlanSlug;
  message?: string;
}

export function UpgradeBanner({ feature, minPlan, message }: UpgradeBannerProps) {
  const featureCheck = usePlanFeature(feature ?? "tables_salle");
  const planCheck = usePlanAtLeast(minPlan ?? "essentiel");

  const check = feature ? featureCheck : planCheck;

  if (check.allowed) return null;

  const displayMessage =
    message ?? `Cette fonctionnalité nécessite le plan ${check.planName}.`;

  return (
    <Callout.Root color="orange" variant="surface" size="2">
      <Callout.Icon>
        <Rocket size={18} weight="duotone" />
      </Callout.Icon>
      <Callout.Text>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span>{displayMessage}</span>
          <Button asChild size="1" variant="solid">
            <Link href="/parametres/abonnement" style={{ textDecoration: "none" }}>
              Voir les plans
            </Link>
          </Button>
        </span>
      </Callout.Text>
    </Callout.Root>
  );
}
