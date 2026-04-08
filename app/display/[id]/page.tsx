import type { Metadata } from "next";
import { getEcranByToken } from "@/actions/ecrans";
import { DisplayScreen } from "./display-screen";
import { DisplayError } from "./display-error";

interface DisplayPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

export async function generateMetadata({
  searchParams,
}: DisplayPageProps): Promise<Metadata> {
  const { token } = await searchParams;

  if (!token) {
    return { title: "Erreur | Écran d'affichage" };
  }

  const result = await getEcranByToken(token);

  if (!result.success) {
    return { title: "Erreur | Écran d'affichage" };
  }

  return {
    title: `${result.data.nom} | Orema N+`,
    description: `Écran d'affichage ${result.data.type.toLowerCase()} - ${result.data.nom}`,
  };
}

export default async function DisplayPage({
  searchParams,
}: DisplayPageProps) {
  const { token } = await searchParams;

  // Pas de token fourni
  if (!token) {
    return (
      <DisplayError
        title="Token manquant"
        message="Aucun token d'authentification fourni. Veuillez scanner le QR code ou utiliser le lien complet."
      />
    );
  }

  // Valider le token via service client
  const result = await getEcranByToken(token);

  if (!result.success) {
    return (
      <DisplayError
        title="Token invalide ou expire"
        message={result.error}
        showLoginLink
      />
    );
  }

  const ecran = result.data;

  return (
    <DisplayScreen
      ecranId={ecran.id}
      ecranNom={ecran.nom}
      ecranType={ecran.type as "CUISINE" | "BAR" | "PERSONNALISE"}
      categories={ecran.categories}
      etablissementId={ecran.etablissement_id}
      sonActif={ecran.son_actif}
      delaiUrgence={ecran.delai_urgence_minutes}
    />
  );
}
