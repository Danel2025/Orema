import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ | Oréma N+",
  description:
    "Questions fréquentes sur Oréma N+ : configuration, paiements, impression, sécurité et fonctionnement mobile.",
  keywords: [
    "FAQ Oréma N+",
    "questions fréquentes POS",
    "aide caisse enregistreuse",
    "support Oréma",
    "configuration paiements",
    "imprimante thermique",
    "Mobile Money Gabon",
  ],
  openGraph: {
    title: "FAQ | Oréma N+",
    description:
      "Questions fréquentes sur Oréma N+ : configuration, paiements, impression, sécurité et fonctionnement mobile.",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
