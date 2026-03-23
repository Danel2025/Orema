/**
 * API Route pour valider les ventes avant synchronisation
 * Migré vers Supabase
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getEtablissementId } from "@/lib/etablissement";

interface LigneInput {
  produitId: string;
  quantite: number;
  prixUnitaire: number;
  tauxTva: string;
}

interface ValidationInput {
  lignes: LigneInput[];
  typeVente: "DIRECT" | "TABLE" | "LIVRAISON" | "EMPORTER";
}

interface ValidationWarning {
  type:
    | "PRIX_CHANGE"
    | "STOCK_INSUFFISANT"
    | "PRODUIT_SUPPRIME"
    | "PRODUIT_INACTIF"
    | "PRODUIT_INDISPONIBLE";
  produitId: string;
  produitNom: string;
  ancienneValeur?: number;
  nouvelleValeur?: number;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const etablissementId = await getEtablissementId();
    const input: ValidationInput = await request.json();

    if (!input.lignes?.length) {
      return NextResponse.json({ error: "Aucune ligne de vente à valider" }, { status: 400 });
    }

    const supabase = await createClient();
    const warnings: ValidationWarning[] = [];
    let produitsValides = 0;
    let produitsAvecWarning = 0;
    let produitsInvalides = 0;

    // Récupérer tous les produits en une seule requête
    const produitIds = input.lignes.map((l) => l.produitId);
    const { data: produits } = await supabase
      .from("produits")
      .select(
        `
        id, nom, prix_vente, actif, gerer_stock, stock_actuel,
        disponible_direct, disponible_table, disponible_livraison, disponible_emporter
      `
      )
      .eq("etablissement_id", etablissementId)
      .in("id", produitIds);

    const produitsMap = new Map((produits || []).map((p) => [p.id, p]));

    // Vérifier chaque ligne
    for (const ligne of input.lignes) {
      const produit = produitsMap.get(ligne.produitId);

      if (!produit) {
        produitsInvalides++;
        warnings.push({
          type: "PRODUIT_SUPPRIME",
          produitId: ligne.produitId,
          produitNom: "Produit inconnu",
          message: "Ce produit n'existe plus ou a été supprimé.",
        });
        continue;
      }

      if (!produit.actif) {
        produitsInvalides++;
        warnings.push({
          type: "PRODUIT_INACTIF",
          produitId: ligne.produitId,
          produitNom: produit.nom,
          message: `Le produit "${produit.nom}" a été désactivé.`,
        });
        continue;
      }

      const disponibiliteMap: Record<string, boolean> = {
        DIRECT: produit.disponible_direct,
        TABLE: produit.disponible_table,
        LIVRAISON: produit.disponible_livraison,
        EMPORTER: produit.disponible_emporter,
      };

      if (!disponibiliteMap[input.typeVente]) {
        produitsInvalides++;
        warnings.push({
          type: "PRODUIT_INDISPONIBLE",
          produitId: ligne.produitId,
          produitNom: produit.nom,
          message: `Le produit "${produit.nom}" n'est pas disponible pour ce type de vente.`,
        });
        continue;
      }

      let hasWarning = false;

      const prixActuel = Number(produit.prix_vente);
      if (prixActuel !== ligne.prixUnitaire) {
        hasWarning = true;
        produitsAvecWarning++;
        warnings.push({
          type: "PRIX_CHANGE",
          produitId: ligne.produitId,
          produitNom: produit.nom,
          ancienneValeur: ligne.prixUnitaire,
          nouvelleValeur: prixActuel,
          message: `Le prix de "${produit.nom}" a changé : ${ligne.prixUnitaire.toLocaleString()} FCFA → ${prixActuel.toLocaleString()} FCFA`,
        });
      }

      if (
        produit.gerer_stock &&
        produit.stock_actuel !== null &&
        produit.stock_actuel < ligne.quantite
      ) {
        if (!hasWarning) produitsAvecWarning++;
        hasWarning = true;
        warnings.push({
          type: "STOCK_INSUFFISANT",
          produitId: ligne.produitId,
          produitNom: produit.nom,
          ancienneValeur: ligne.quantite,
          nouvelleValeur: produit.stock_actuel,
          message: `Stock insuffisant pour "${produit.nom}" : ${ligne.quantite} demandé(s), ${produit.stock_actuel} disponible(s)`,
        });
      }

      if (!hasWarning) produitsValides++;
    }

    const hasBlockingIssues = warnings.some(
      (w) =>
        w.type === "PRODUIT_SUPPRIME" ||
        w.type === "PRODUIT_INACTIF" ||
        w.type === "PRODUIT_INDISPONIBLE"
    );

    return NextResponse.json({
      valid: warnings.length === 0,
      canProceed: !hasBlockingIssues,
      warnings,
      summary: {
        totalProduits: input.lignes.length,
        produitsValides,
        produitsAvecWarning,
        produitsInvalides,
      },
    });
  } catch (error) {
    console.error("Erreur validation vente:", error);
    return NextResponse.json({ error: "Erreur lors de la validation" }, { status: 500 });
  }
}
