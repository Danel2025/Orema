"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth/context";
import {
  PLANS,
  PLAN_SLUGS,
  resolvePlanSlug,
  type PlanSlug,
  type PlanFeatures,
} from "@/lib/config/plans";

/**
 * Retourne le plan minimum qui a une feature activee
 */
function getMinPlanForFeature(feature: keyof PlanFeatures): PlanSlug {
  const ordered = PLAN_SLUGS.slice().sort(
    (a, b) => PLANS[a].metadata.ordre_affichage - PLANS[b].metadata.ordre_affichage
  );

  for (const slug of ordered) {
    const value = PLANS[slug].features[feature];
    if (typeof value === "boolean" && value) return slug;
    if (typeof value === "string" && value !== "basique" && value !== "email") return slug;
  }

  return "enterprise";
}

/**
 * Hook pour verifier si une feature du plan est disponible
 */
export function usePlanFeature(feature: keyof PlanFeatures) {
  const { user } = useAuth();

  return useMemo(() => {
    // SUPER_ADMIN bypass toutes les restrictions de plan
    if (user?.role === "SUPER_ADMIN") {
      return { allowed: true, currentPlan: "enterprise" as PlanSlug, requiredPlan: "essentiel" as PlanSlug, planName: "Enterprise" };
    }

    const currentSlug = resolvePlanSlug(user?.plan ?? "essentiel");
    const currentPlan = PLANS[currentSlug];
    const requiredSlug = getMinPlanForFeature(feature);
    const requiredPlan = PLANS[requiredSlug];

    const featureValue = currentPlan.features[feature];
    let allowed: boolean;
    if (typeof featureValue === "boolean") {
      allowed = featureValue;
    } else {
      allowed = featureValue !== "basique" && featureValue !== "email";
    }

    return {
      allowed,
      currentPlan: currentSlug,
      requiredPlan: requiredSlug,
      planName: requiredPlan.nom,
    };
  }, [user?.plan, user?.role, feature]);
}

/**
 * Hook pour verifier si le plan actuel est au moins egal a un plan requis
 */
export function usePlanAtLeast(requiredPlan: PlanSlug) {
  const { user } = useAuth();

  return useMemo(() => {
    // SUPER_ADMIN bypass toutes les restrictions de plan
    if (user?.role === "SUPER_ADMIN") {
      return { allowed: true, currentPlan: "enterprise" as PlanSlug, requiredPlan, planName: PLANS[requiredPlan].nom };
    }

    const currentSlug = resolvePlanSlug(user?.plan ?? "essentiel");
    const currentOrder = PLANS[currentSlug].metadata.ordre_affichage;
    const requiredOrder = PLANS[requiredPlan].metadata.ordre_affichage;

    return {
      allowed: currentOrder >= requiredOrder,
      currentPlan: currentSlug,
      requiredPlan,
      planName: PLANS[requiredPlan].nom,
    };
  }, [user?.plan, user?.role, requiredPlan]);
}

export { getMinPlanForFeature };
