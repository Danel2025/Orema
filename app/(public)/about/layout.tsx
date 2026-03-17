import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "À propos | Oréma N+",
  description:
    "Découvrez Oréma N+, la solution de caisse moderne née au Gabon pour l'Afrique. Notre mission, notre vision et notre équipe.",
  keywords: [
    "Oréma N+",
    "à propos",
    "caisse enregistreuse Gabon",
    "logiciel POS Afrique",
    "solution de caisse",
    "point de vente Libreville",
    "startup gabonaise",
    "commerce Afrique centrale",
  ],
  openGraph: {
    title: "À propos | Oréma N+",
    description:
      "Découvrez Oréma N+, la solution de caisse moderne née au Gabon pour l'Afrique.",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
