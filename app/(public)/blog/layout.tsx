import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Oréma N+",
  description:
    "Actualités, conseils et guides pour optimiser votre activité commerciale avec Oréma N+.",
  keywords: [
    "blog Oréma N+",
    "actualités POS",
    "conseils restaurant",
    "gestion commerce Gabon",
    "digitalisation commerce Afrique",
    "caisse enregistreuse astuces",
  ],
  openGraph: {
    title: "Blog | Oréma N+",
    description:
      "Actualités, conseils et guides pour optimiser votre activité commerciale avec Oréma N+.",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
