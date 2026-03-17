import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Devenez Partenaire | Oréma N+",
  description:
    "Rejoignez l'écosystème Oréma N+ en tant que partenaire. Intégrateurs, fournisseurs, solutions de paiement.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
