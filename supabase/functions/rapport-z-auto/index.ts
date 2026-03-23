/**
 * Edge Function: Rapport Z Automatique
 *
 * Génère automatiquement le rapport de clôture journalière
 * pour tous les établissements actifs.
 *
 * Déclenchée par un CRON job à minuit (Africa/Libreville).
 *
 * @endpoint POST /functions/v1/rapport-z-auto
 * @cron 0 0 * * * (tous les jours à minuit)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Types
interface VenteRow {
  id: string;
  numeroTicket: string;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  typeVente: string;
  createdAt: string;
  paiements: PaiementRow[];
}

interface PaiementRow {
  id: string;
  montant: number;
  modePaiement: string;
}

interface RapportZ {
  date: string;
  etablissementId: string;
  nombreVentes: number;
  nombreArticles: number;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  totalEspeces: number;
  totalCartes: number;
  totalAirtelMoney: number;
  totalMoovMoney: number;
  totalCheques: number;
  totalVirements: number;
  totalCompteClient: number;
  totalAutres: number;
  ventesParType: Record<string, { nombre: number; total: number }>;
  ventesParHeure: Record<string, number>;
  panierMoyen: number;
  premierTicket: string | null;
  dernierTicket: string | null;
}

// Client Supabase avec Service Role
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req: Request) => {
  // Vérifier l'authentification CRON
  const authHeader = req.headers.get("Authorization");
  const cronSecret = Deno.env.get("CRON_SECRET");

  // Permettre l'appel depuis Supabase CRON ou avec le secret
  const isFromSupabaseCron = req.headers.get("X-Supabase-Cron") === "true";
  const isValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isFromSupabaseCron && !isValidSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  console.log("[Rapport Z] Démarrage de la génération automatique");

  try {
    // Récupérer tous les établissements actifs
    const { data: etablissements, error: etabError } = await supabase
      .from("etablissements")
      .select("id, nom")
      .eq("actif", true);

    if (etabError) {
      throw new Error(`Erreur récupération établissements: ${etabError.message}`);
    }

    if (!etablissements || etablissements.length === 0) {
      console.log("[Rapport Z] Aucun établissement actif");
      return new Response(JSON.stringify({ message: "Aucun établissement actif" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Date de la veille (on génère le rapport pour hier)
    const hier = new Date();
    hier.setDate(hier.getDate() - 1);
    hier.setHours(0, 0, 0, 0);

    const aujourdhui = new Date(hier);
    aujourdhui.setDate(aujourdhui.getDate() + 1);

    const rapportsGeneres: string[] = [];
    const erreurs: string[] = [];

    // Générer le rapport pour chaque établissement
    for (const etab of etablissements) {
      try {
        // Vérifier si un rapport existe déjà pour cette date
        const { data: existant } = await supabase
          .from("rapports_z")
          .select("id")
          .eq("etablissementId", etab.id)
          .eq("date", hier.toISOString().split("T")[0])
          .single();

        if (existant) {
          console.log(
            `[Rapport Z] Rapport déjà existant pour ${etab.nom} (${hier.toISOString().split("T")[0]})`
          );
          continue;
        }

        // Récupérer les ventes de la journée
        const { data: ventes, error: ventesError } = await supabase
          .from("ventes")
          .select(
            `
            id,
            numeroTicket,
            totalHT,
            totalTVA,
            totalTTC,
            typeVente,
            createdAt,
            paiements (
              id,
              montant,
              modePaiement
            ),
            lignes:lignes_ventes (
              quantite
            )
          `
          )
          .eq("etablissementId", etab.id)
          .eq("statut", "PAYEE")
          .gte("createdAt", hier.toISOString())
          .lt("createdAt", aujourdhui.toISOString());

        if (ventesError) {
          throw new Error(`Erreur ventes ${etab.nom}: ${ventesError.message}`);
        }

        // Calculer le rapport
        const rapport = calculerRapportZ(etab.id, hier.toISOString().split("T")[0], ventes || []);

        // Sauvegarder le rapport
        const { error: insertError } = await supabase.from("rapports_z").insert({
          etablissementId: rapport.etablissementId,
          date: rapport.date,
          nombreVentes: rapport.nombreVentes,
          nombreArticles: rapport.nombreArticles,
          totalHT: rapport.totalHT,
          totalTVA: rapport.totalTVA,
          totalTTC: rapport.totalTTC,
          totalEspeces: rapport.totalEspeces,
          totalCartes: rapport.totalCartes,
          totalAirtelMoney: rapport.totalAirtelMoney,
          totalMoovMoney: rapport.totalMoovMoney,
          totalCheques: rapport.totalCheques,
          totalVirements: rapport.totalVirements,
          totalCompteClient: rapport.totalCompteClient,
          panierMoyen: rapport.panierMoyen,
          premierTicket: rapport.premierTicket,
          dernierTicket: rapport.dernierTicket,
          data: rapport, // JSON complet avec détails
        });

        if (insertError) {
          throw new Error(`Erreur insertion ${etab.nom}: ${insertError.message}`);
        }

        rapportsGeneres.push(etab.nom);
        console.log(`[Rapport Z] Rapport généré pour ${etab.nom}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        erreurs.push(`${etab.nom}: ${message}`);
        console.error(`[Rapport Z] Erreur pour ${etab.nom}:`, error);
      }
    }

    const response = {
      date: hier.toISOString().split("T")[0],
      rapportsGeneres,
      erreurs,
      total: rapportsGeneres.length,
    };

    console.log("[Rapport Z] Terminé:", response);

    return new Response(JSON.stringify(response), {
      status: erreurs.length > 0 && rapportsGeneres.length === 0 ? 500 : 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Rapport Z] Erreur globale:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erreur inconnue",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

/**
 * Calcule le rapport Z à partir des ventes
 */
function calculerRapportZ(etablissementId: string, date: string, ventes: any[]): RapportZ {
  // Initialiser le rapport
  const rapport: RapportZ = {
    date,
    etablissementId,
    nombreVentes: ventes.length,
    nombreArticles: 0,
    totalHT: 0,
    totalTVA: 0,
    totalTTC: 0,
    totalEspeces: 0,
    totalCartes: 0,
    totalAirtelMoney: 0,
    totalMoovMoney: 0,
    totalCheques: 0,
    totalVirements: 0,
    totalCompteClient: 0,
    totalAutres: 0,
    ventesParType: {},
    ventesParHeure: {},
    panierMoyen: 0,
    premierTicket: null,
    dernierTicket: null,
  };

  if (ventes.length === 0) {
    return rapport;
  }

  // Trier les ventes par date
  const ventesTries = [...ventes].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  rapport.premierTicket = ventesTries[0]?.numeroTicket ?? null;
  rapport.dernierTicket = ventesTries[ventesTries.length - 1]?.numeroTicket ?? null;

  // Parcourir les ventes
  for (const vente of ventes) {
    // Totaux
    rapport.totalHT += Number(vente.totalHT) || 0;
    rapport.totalTVA += Number(vente.totalTVA) || 0;
    rapport.totalTTC += Number(vente.totalTTC) || 0;

    // Nombre d'articles
    const nbArticles =
      vente.lignes?.reduce((sum: number, ligne: any) => sum + (ligne.quantite || 0), 0) ?? 0;
    rapport.nombreArticles += nbArticles;

    // Ventes par type
    const typeVente = vente.typeVente || "DIRECT";
    if (!rapport.ventesParType[typeVente]) {
      rapport.ventesParType[typeVente] = { nombre: 0, total: 0 };
    }
    rapport.ventesParType[typeVente].nombre++;
    rapport.ventesParType[typeVente].total += Number(vente.totalTTC) || 0;

    // Ventes par heure
    const heure = new Date(vente.createdAt).getHours().toString().padStart(2, "0");
    rapport.ventesParHeure[heure] = (rapport.ventesParHeure[heure] || 0) + 1;

    // Paiements par mode
    for (const paiement of vente.paiements || []) {
      const montant = Number(paiement.montant) || 0;
      switch (paiement.modePaiement) {
        case "ESPECES":
          rapport.totalEspeces += montant;
          break;
        case "CARTE_BANCAIRE":
          rapport.totalCartes += montant;
          break;
        case "AIRTEL_MONEY":
          rapport.totalAirtelMoney += montant;
          break;
        case "MOOV_MONEY":
          rapport.totalMoovMoney += montant;
          break;
        case "CHEQUE":
          rapport.totalCheques += montant;
          break;
        case "VIREMENT":
          rapport.totalVirements += montant;
          break;
        case "COMPTE_CLIENT":
          rapport.totalCompteClient += montant;
          break;
        default:
          rapport.totalAutres += montant;
      }
    }
  }

  // Panier moyen
  rapport.panierMoyen =
    rapport.nombreVentes > 0 ? Math.round(rapport.totalTTC / rapport.nombreVentes) : 0;

  return rapport;
}
