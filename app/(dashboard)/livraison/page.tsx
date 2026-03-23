import { Suspense } from "react";
import { getLivraisonsEnCours } from "@/actions/livraison";
import { LivraisonContent } from "./content";

export const metadata = {
  title: "Suivi des livraisons | Orema N+",
  description: "Suivez les livraisons en cours et gérez leur statut",
};

export default async function LivraisonPage() {
  const result = await getLivraisonsEnCours();

  const livraisons = result.success && result.data ? result.data : [];

  return <LivraisonContent livraisons={livraisons} />;
}
