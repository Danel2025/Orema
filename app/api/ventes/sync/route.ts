/**
 * API Route pour synchroniser les ventes hors-ligne
 * Migré vers Supabase - Version optimisée
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getEtablissementId } from "@/lib/etablissement";
import type { ModePaiement, TypeVente, TypeRemise } from "@/lib/db";

const IDEMPOTENCY_KEY_TTL_HOURS = 24;

function getTauxTvaPercent(taux: string): number {
  if (taux === "EXONERE") return 0;
  if (taux === "REDUIT") return 10;
  return 18;
}

interface LigneInput {
  produitId: string;
  quantite: number;
  prixUnitaire: number;
  tauxTva: string;
  notes?: string;
}

interface PaiementInput {
  mode: string;
  montant: number;
  reference?: string;
}

interface VenteInput {
  idempotencyKey: string;
  typeVente: string;
  lignes: LigneInput[];
  modePaiement: string;
  montantRecu: number;
  montantRendu: number;
  reference?: string;
  paiements?: PaiementInput[];
  remise?: { type: "POURCENTAGE" | "MONTANT_FIXE"; valeur: number };
  tableId?: string;
  clientId?: string;
  sessionCaisseId?: string;
  adresseLivraison?: string;
  notesLivraison?: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const etablissementId = await getEtablissementId();
    const input: VenteInput = await request.json();
    const supabase = await createClient();

    if (!input.idempotencyKey) {
      return NextResponse.json({ error: "Clé d'idempotence manquante" }, { status: 400 });
    }

    // Vérifier si cette clé a déjà été traitée
    const { data: existingKey } = await supabase
      .from("sync_keys")
      .select("vente_id, numero_ticket")
      .eq("idempotency_key", input.idempotencyKey)
      .single();

    if (existingKey) {
      return NextResponse.json({
        success: true,
        idempotent: true,
        data: { id: existingKey.vente_id, numeroTicket: existingKey.numero_ticket },
      });
    }

    // Générer le numéro de ticket via RPC atomique (SELECT FOR UPDATE)
    const { data: numeroTicket, error: ticketError } = await supabase.rpc(
      "generate_numero_ticket" as never,
      {
        p_etablissement_id: etablissementId,
      } as never
    );

    if (ticketError || !numeroTicket) {
      throw new Error(
        `Erreur génération numéro ticket: ${ticketError?.message || "pas de résultat"}`
      );
    }

    // Calculer les totaux
    let sousTotal = 0;
    let totalTva = 0;

    const lignesData = input.lignes.map((ligne) => {
      const prixLigne = ligne.prixUnitaire * ligne.quantite;
      const tauxPercent = getTauxTvaPercent(ligne.tauxTva);
      const tvaMontant = Math.round((prixLigne * tauxPercent) / 100);

      sousTotal += prixLigne;
      totalTva += tvaMontant;

      return {
        produit_id: ligne.produitId,
        quantite: ligne.quantite,
        prix_unitaire: ligne.prixUnitaire,
        taux_tva: tauxPercent,
        montant_tva: tvaMontant,
        sous_total: prixLigne,
        total: prixLigne + tvaMontant,
        notes: ligne.notes,
      };
    });

    // Calculer la remise
    let totalRemise = 0;
    if (input.remise) {
      totalRemise =
        input.remise.type === "POURCENTAGE"
          ? Math.round((sousTotal * input.remise.valeur) / 100)
          : input.remise.valeur;
    }

    const totalFinal = sousTotal + totalTva - totalRemise;

    // Préparer les paiements
    let paiementsData: {
      mode_paiement: ModePaiement;
      montant: number;
      reference?: string | null;
      montant_recu?: number | null;
      monnaie_rendue?: number | null;
    }[] = [];

    if (input.modePaiement === "MIXTE" && input.paiements?.length) {
      paiementsData = input.paiements.map((p) => ({
        mode_paiement: p.mode as ModePaiement,
        montant: p.montant,
        reference: p.reference ?? null,
        montant_recu: p.mode === "ESPECES" ? p.montant : null,
        monnaie_rendue: null,
      }));
    } else {
      paiementsData = [
        {
          mode_paiement: input.modePaiement as ModePaiement,
          montant: totalFinal,
          reference: input.reference ?? null,
          montant_recu: input.modePaiement === "ESPECES" ? input.montantRecu : null,
          monnaie_rendue: input.modePaiement === "ESPECES" ? input.montantRendu : null,
        },
      ];
    }

    // Créer la vente
    const { data: vente, error: venteError } = await supabase
      .from("ventes")
      .insert({
        numero_ticket: numeroTicket,
        type: input.typeVente as TypeVente,
        statut: "PAYEE",
        sous_total: sousTotal,
        total_tva: totalTva,
        total_remise: totalRemise,
        total_final: totalFinal,
        type_remise: input.remise ? (input.remise.type as TypeRemise) : null,
        valeur_remise: input.remise?.valeur ?? null,
        etablissement_id: etablissementId,
        table_id: input.tableId ?? null,
        client_id: input.clientId ?? null,
        utilisateur_id: user.userId,
        session_caisse_id: input.sessionCaisseId ?? null,
        adresse_livraison: input.adresseLivraison ?? null,
        notes: input.notesLivraison ?? null,
      })
      .select()
      .single();

    if (venteError) throw venteError;

    // Créer les lignes de vente
    await supabase
      .from("lignes_vente")
      .insert(lignesData.map((l) => ({ ...l, vente_id: vente.id })));

    // Créer les paiements
    await supabase
      .from("paiements")
      .insert(paiementsData.map((p) => ({ ...p, vente_id: vente.id })));

    // Mettre à jour le stock via RPC transactionnel
    const lignesStock = input.lignes.map((l) => ({
      produit_id: l.produitId,
      quantite: l.quantite,
    }));

    const { error: stockError } = await supabase.rpc("deduire_stock_transactionnel" as never, {
      p_lignes: lignesStock,
      p_motif: "Vente hors-ligne - Ticket",
      p_reference: numeroTicket as string,
    } as never);

    if (stockError) {
      console.error("Erreur déduction stock sync:", stockError);
    }

    // Stocker la clé d'idempotence
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + IDEMPOTENCY_KEY_TTL_HOURS);

    await supabase.from("sync_keys").insert({
      idempotency_key: input.idempotencyKey,
      vente_id: vente.id,
      numero_ticket: numeroTicket,
      etablissement_id: etablissementId,
      expires_at: expiresAt.toISOString(),
    });

    return NextResponse.json({
      success: true,
      idempotent: false,
      data: { id: vente.id, numeroTicket },
    });
  } catch (error) {
    console.error("Erreur sync vente:", error);
    return NextResponse.json({ error: "Erreur lors de la synchronisation" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const supabase = await createClient();
    const { count } = await supabase
      .from("sync_keys")
      .delete({ count: "exact" })
      .lt("expires_at", new Date().toISOString());

    return NextResponse.json({ success: true, deleted: count });
  } catch (error) {
    console.error("Erreur nettoyage sync keys:", error);
    return NextResponse.json({ error: "Erreur lors du nettoyage" }, { status: 500 });
  }
}
