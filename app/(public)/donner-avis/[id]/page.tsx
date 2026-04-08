import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { AvisPublicForm } from "./form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const supabase = createServiceClient();
  const etablissement = await db.getEtablissementById(supabase, id);

  if (!etablissement) {
    return { title: "Établissement introuvable | Oréma N+" };
  }

  return {
    title: `Donner votre avis — ${etablissement.nom} | Oréma N+`,
    description: `Partagez votre expérience chez ${etablissement.nom}. Votre avis compte !`,
  };
}

export default async function DonnerAvisPage({ params }: PageProps) {
  const { id } = await params;

  // Vérifier que l'établissement existe
  const supabase = createServiceClient();
  const etablissement = await db.getEtablissementById(supabase, id);

  if (!etablissement) {
    notFound();
  }

  return (
    <AvisPublicForm
      etablissementId={id}
      etablissementNom={etablissement.nom}
    />
  );
}
