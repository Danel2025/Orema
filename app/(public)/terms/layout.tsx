import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation | Oréma N+",
  description:
    "Conditions générales d'utilisation du service Oréma N+, solution de caisse pour le Gabon et l'Afrique.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
