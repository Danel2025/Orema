import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guide de démarrage | Oréma N+",
  description:
    "Configurez votre système de caisse Oréma N+ en quelques étapes simples. Guide complet pour bien démarrer.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
