import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accessibilité | Oréma N+",
  description:
    "Déclaration d'accessibilité d'Oréma N+ : notre engagement pour une plateforme accessible à tous, conforme WCAG 2.1 niveau AA.",
  keywords: [
    "accessibilité",
    "WCAG",
    "Oréma N+",
    "accessibilité web",
    "handicap",
    "lecteur d'écran",
    "navigation clavier",
  ],
  openGraph: {
    title: "Accessibilité | Oréma N+",
    description:
      "Déclaration d'accessibilité d'Oréma N+ : notre engagement pour une plateforme accessible à tous.",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
