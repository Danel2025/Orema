import type { Metadata } from "next";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const metadata: Metadata = {
  title: "Bienvenue — Oréma N+",
  description:
    "Découvrez Oréma N+, le système de caisse moderne conçu pour les restaurants, bars et commerces du Gabon.",
};

export default function WelcomePage() {
  return <OnboardingWizard />;
}
