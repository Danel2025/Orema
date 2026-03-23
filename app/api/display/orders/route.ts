/**
 * API Route pour recuperer les commandes d'un ecran d'affichage
 * GET /api/display/orders?token=xxx&type=cuisine|bar
 *
 * Pas de session utilisateur requise - valide le token de l'ecran
 * puis utilise le service client pour recuperer les commandes.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { isBarCategory } from "@/lib/print/router";
import type { PendingOrder } from "@/actions/preparation";
import type { StatutPreparation } from "@/lib/db/types";
import { z } from "zod";

const OrdersQuerySchema = z.object({
  token: z.string().min(1, "Token manquant"),
  type: z.enum(["cuisine", "bar"], { message: "Type invalide (cuisine ou bar)" }),
});

export async function GET(request: NextRequest) {
  try {
    const rawParams = {
      token: request.nextUrl.searchParams.get("token"),
      type: request.nextUrl.searchParams.get("type"),
    };
    const parsed = OrdersQuerySchema.safeParse(rawParams);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Paramètres invalides" },
        { status: 400 }
      );
    }

    const { token, type } = parsed.data;

    const supabase = createServiceClient();

    // Valider le token
    const { data: tokenResult, error: tokenError } = await supabase.rpc(
      "validate_display_token",
      { p_token: token }
    );

    if (tokenError) {
      console.error("[display/orders] RPC Error:", tokenError);
      return NextResponse.json({ error: "Erreur de validation" }, { status: 500 });
    }

    const validation = tokenResult as {
      valid: boolean;
      error?: string;
      etablissement_id?: string;
      categories?: string[] | null;
    };

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error || "Token invalide" }, { status: 401 });
    }

    const etablissementId = validation.etablissement_id!;
    const categoriesFilter = validation.categories;

    // Recuperer les commandes via service client (bypass RLS)
    const { data: rawLines, error: fetchError } = await supabase
      .from("lignes_vente")
      .select(
        `
        id,
        quantite,
        notes,
        statut_preparation,
        produit_id,
        vente_id,
        produits!inner(id, nom, categorie_id, categories!inner(id, nom)),
        ventes!inner(
          id,
          numero_ticket,
          type,
          created_at,
          etablissement_id,
          table_id,
          utilisateur_id,
          tables(numero, zone_id, zones(nom)),
          utilisateurs(nom, prenom)
        ),
        lignes_vente_supplements(nom, prix)
      `
      )
      .eq("ventes.etablissement_id", etablissementId)
      .in("statut_preparation", ["EN_ATTENTE", "EN_PREPARATION", "PRETE"])
      .eq("ventes.statut", "EN_COURS")
      .order("created_at", { ascending: true });

    if (fetchError) {
      console.error("[display/orders] Fetch error:", fetchError);
      return NextResponse.json({ error: "Erreur de recuperation" }, { status: 500 });
    }

    if (!rawLines || rawLines.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Filtrer par type (cuisine/bar) et eventuellement par categories configurees
    const filteredLines = rawLines.filter((line) => {
      const produit = line.produits as unknown as {
        id: string;
        nom: string;
        categorie_id: string;
        categories: { id: string; nom: string };
      };

      // Filtrer par categories configurees sur l'ecran
      if (categoriesFilter && categoriesFilter.length > 0) {
        return categoriesFilter.includes(produit.categorie_id);
      }

      // Sinon, filtrer par type cuisine/bar
      const categoryName = produit?.categories?.nom ?? null;
      if (type === "bar") {
        return isBarCategory(categoryName);
      }
      return !isBarCategory(categoryName);
    });

    // Grouper par vente_id
    const orderMap = new Map<string, PendingOrder>();

    for (const line of filteredLines) {
      const vente = line.ventes as unknown as {
        id: string;
        numero_ticket: string;
        type: string;
        created_at: string;
        etablissement_id: string;
        table_id: string | null;
        utilisateur_id: string;
        tables: { numero: string; zone_id: string | null; zones: { nom: string } | null } | null;
        utilisateurs: { nom: string; prenom: string } | null;
      };

      const produit = line.produits as unknown as {
        id: string;
        nom: string;
        categorie_id: string;
        categories: { id: string; nom: string };
      };

      const supplements = (
        line.lignes_vente_supplements as unknown as Array<{ nom: string; prix: number }>
      ) ?? [];

      const venteId = vente.id;

      if (!orderMap.has(venteId)) {
        const tableNumero = vente.tables?.numero ?? null;
        const tableZone = vente.tables?.zones?.nom ?? null;
        const serveurNom = vente.utilisateurs
          ? `${vente.utilisateurs.prenom} ${vente.utilisateurs.nom}`
          : null;

        orderMap.set(venteId, {
          vente_id: venteId,
          numero_ticket: vente.numero_ticket,
          type_vente: vente.type,
          created_at: vente.created_at,
          table_numero: tableNumero,
          table_zone: tableZone,
          serveur_nom: serveurNom,
          lignes: [],
        });
      }

      const order = orderMap.get(venteId)!;
      order.lignes.push({
        id: line.id,
        produit_nom: produit.nom,
        produit_id: produit.id,
        quantite: line.quantite,
        notes: line.notes,
        statut_preparation: line.statut_preparation as StatutPreparation,
        supplements: supplements.map((s) => ({ nom: s.nom, prix: Number(s.prix) })),
        categorie_nom: produit.categories?.nom ?? null,
      });
    }

    // Trier par date de creation (les plus anciennes d'abord)
    const orders = Array.from(orderMap.values()).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error("[display/orders] Error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
