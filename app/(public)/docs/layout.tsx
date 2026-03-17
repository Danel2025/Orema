import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation | Oréma N+",
  description:
    "Documentation complète d'Oréma N+ : guides d'utilisation, configuration, gestion des ventes et rapports.",
  keywords: [
    "documentation Oréma N+",
    "guide utilisation POS",
    "configuration caisse",
    "tutoriel point de vente",
    "aide Oréma N+",
    "mode d'emploi caisse enregistreuse",
  ],
  openGraph: {
    title: "Documentation | Oréma N+",
    description:
      "Documentation complète d'Oréma N+ : guides d'utilisation, configuration, gestion des ventes et rapports.",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
