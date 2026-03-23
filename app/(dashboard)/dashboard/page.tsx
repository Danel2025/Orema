import { getKPIs, getTopProducts, getHistoriqueFactures } from "@/actions/rapports";
import { createClient, db } from "@/lib/db";
import { getEtablissementId } from "@/lib/etablissement";
import { DashboardContent } from "./content";

export default async function DashboardPage() {
  const etablissementId = await getEtablissementId();
  const supabase = await createClient();

  const [
    kpis,
    topProducts,
    ventesRecentes,
    nombreProduits,
    nombreClients,
    sessionCaisse,
    produitsRupture,
  ] = await Promise.all([
    getKPIs(),
    getTopProducts("jour", 5),
    getHistoriqueFactures({}, 1, 5),
    db.countProduits(supabase, etablissementId),
    db.countClients(supabase, etablissementId),
    db.getSessionCaisseEnCours(supabase, etablissementId),
    db.getProduitsRuptureStock(supabase, etablissementId),
  ]);

  return (
    <DashboardContent
      kpis={kpis}
      topProducts={topProducts}
      ventesRecentes={ventesRecentes}
      nombreProduits={nombreProduits}
      nombreClients={nombreClients}
      sessionCaisse={sessionCaisse as { date_ouverture: string } | null}
      produitsRupture={produitsRupture as { id: string; nom: string; stock_actuel: number | null; stock_min: number | null }[]}
    />
  );
}
