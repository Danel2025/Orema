import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Carrières | Oréma N+",
  description:
    "Rejoignez l'équipe Oréma N+ et participez à la transformation digitale du commerce en Afrique. Découvrez nos offres d'emploi.",
  keywords: [
    "Oréma N+",
    "recrutement",
    "emploi Gabon",
    "carrières tech Afrique",
    "développeur Libreville",
    "startup gabonaise",
    "offres emploi",
  ],
  openGraph: {
    title: "Carrières | Oréma N+",
    description:
      "Rejoignez l'équipe Oréma N+ et participez à la transformation digitale du commerce en Afrique.",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
