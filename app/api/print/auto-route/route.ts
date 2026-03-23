/**
 * API Route pour le routage automatique d'impression
 * Migré vers Supabase
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  generateTicketClient,
  generateBonCuisine,
  generateBonBar,
  findTicketPrinter,
  routeLinesToPrinters,
  sendToPrinter,
  isBarCategory,
  isCuisineCategory,
  type TicketClientData,
  type BonPreparationData,
  type PrintLineItem,
  type PrintResult,
} from "@/lib/print";
import {
  generateTicketHTML,
  generateBonPreparationHTML,
} from "@/lib/print/system-print";

interface AutoRouteRequestBody {
  venteId: string;
  printTicket?: boolean;
  printKitchen?: boolean;
  printBar?: boolean;
  urgent?: boolean;
}

interface SystemPrintJob {
  type: "ticket" | "cuisine" | "bar";
  html: string;
}

interface AutoRouteResult {
  success: boolean;
  results: { ticket?: PrintResult; kitchen?: PrintResult; bar?: PrintResult };
  errors: string[];
  systemPrintJobs?: SystemPrintJob[];
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Non authentifie" }, { status: 401 });
    }

    const body = (await request.json()) as AutoRouteRequestBody;
    const {
      venteId,
      printTicket = true,
      printKitchen = true,
      printBar = true,
      urgent = false,
    } = body;

    if (!venteId) {
      return NextResponse.json({ success: false, error: "ID de vente requis" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: vente } = await supabase
      .from("ventes")
      .select(
        `
        *, etablissements(*), utilisateurs(nom, prenom), clients(nom, prenom),
        tables(numero, zones(nom)),
        lignes_vente(*, produits(nom, categories(id, nom, imprimante_id))),
        paiements(*)
      `
      )
      .eq("id", venteId)
      .single();

    if (!vente) {
      return NextResponse.json({ success: false, error: "Vente introuvable" }, { status: 404 });
    }

    const results: AutoRouteResult = { success: true, results: {}, errors: [] };
    const systemPrintJobs: SystemPrintJob[] = [];

    const etab = vente.etablissements as Record<string, unknown>;
    const venteUser = vente.utilisateurs as { nom: string; prenom: string | null };
    const client = vente.clients as { nom: string; prenom: string | null } | null;
    const table = vente.tables as { numero: string; zones: { nom: string } } | null;
    const lignes = vente.lignes_vente as Array<{
      quantite: number;
      prix_unitaire: string | number;
      total: string | number;
      notes: string | null;
      produits: {
        nom: string;
        categories: { id: string; nom: string; imprimante_id: string | null } | null;
      };
    }>;
    const paiements = vente.paiements as Array<{
      mode_paiement: string;
      montant: string | number;
      reference: string | null;
      montant_recu: string | number | null;
      monnaie_rendue: string | number | null;
    }>;

    // 1. Imprimer le ticket client
    if (printTicket) {
      const ticketPrinter = await findTicketPrinter(vente.etablissement_id);
      if (ticketPrinter) {
        const ticketData: TicketClientData = {
          etablissement: {
            nom: etab.nom as string,
            adresse: etab.adresse as string,
            telephone: etab.telephone as string,
            email: etab.email as string,
            nif: etab.nif as string,
            rccm: etab.rccm as string,
          },
          numeroTicket: vente.numero_ticket,
          dateVente: new Date(vente.created_at),
          typeVente: vente.type,
          tableNumero: table?.numero || null,
          tableZone: table?.zones?.nom || null,
          clientNom: client ? `${client.nom}${client.prenom ? " " + client.prenom : ""}` : null,
          caissierNom: `${venteUser.nom}${venteUser.prenom ? " " + venteUser.prenom : ""}`,
          lignes: lignes.map((l) => ({
            produitNom: l.produits.nom,
            quantite: l.quantite,
            prixUnitaire: Number(l.prix_unitaire),
            total: Number(l.total),
            notes: l.notes,
            categorieId: l.produits.categories?.id,
            categorieNom: l.produits.categories?.nom,
          })),
          sousTotal: Number(vente.sous_total),
          totalTva: Number(vente.total_tva),
          totalRemise: Number(vente.total_remise),
          totalFinal: Number(vente.total_final),
          remiseType: vente.type_remise as "POURCENTAGE" | "MONTANT_FIXE" | null,
          remiseValeur: vente.valeur_remise ? Number(vente.valeur_remise) : null,
          paiements: paiements.map((p) => ({
            mode: p.mode_paiement,
            montant: Number(p.montant),
            reference: p.reference,
            montantRecu: p.montant_recu ? Number(p.montant_recu) : null,
            monnaieRendue: p.monnaie_rendue ? Number(p.monnaie_rendue) : null,
          })),
          montantRecu: paiements.find((p) => p.montant_recu)
            ? Number(paiements.find((p) => p.montant_recu)!.montant_recu)
            : null,
          monnaieRendue: paiements.find((p) => p.monnaie_rendue)
            ? Number(paiements.find((p) => p.monnaie_rendue)!.monnaie_rendue)
            : null,
        };

        if (ticketPrinter.typeConnexion === "SYSTEME") {
          const html = generateTicketHTML(ticketData);
          systemPrintJobs.push({ type: "ticket", html });
          results.results.ticket = { success: true, message: "Impression systeme requise" };
        } else {
          const ticketCommands = generateTicketClient(
            ticketData,
            ticketPrinter.largeurPapier as 58 | 80
          );
          results.results.ticket = await sendToPrinter(ticketPrinter, ticketCommands);
          if (!results.results.ticket.success)
            results.errors.push(`Ticket: ${results.results.ticket.error}`);
        }
      } else {
        results.errors.push("Aucune imprimante ticket configurée");
      }
    }

    // 2. Router les lignes vers cuisine et bar
    const allLines: PrintLineItem[] = lignes.map((l) => ({
      produitNom: l.produits.nom,
      quantite: l.quantite,
      prixUnitaire: Number(l.prix_unitaire),
      total: Number(l.total),
      notes: l.notes,
      categorieId: l.produits.categories?.id,
      categorieNom: l.produits.categories?.nom,
    }));

    const kitchenLines = allLines.filter((line) => isCuisineCategory(line.categorieNom));
    const barLines = allLines.filter((line) => isBarCategory(line.categorieNom));

    // 3. Imprimer le bon cuisine
    if (printKitchen && kitchenLines.length > 0) {
      const routes = await routeLinesToPrinters(vente.etablissement_id, kitchenLines);
      for (const route of routes) {
        if (route.printer && route.lines.length > 0) {
          const bonData: BonPreparationData = {
            numeroCommande: vente.numero_ticket,
            dateCommande: new Date(vente.created_at),
            typeVente: vente.type,
            tableNumero: table?.numero || null,
            tableZone: table?.zones?.nom || null,
            clientNom: client ? `${client.nom}${client.prenom ? " " + client.prenom : ""}` : null,
            serveurNom: `${venteUser.nom}${venteUser.prenom ? " " + venteUser.prenom : ""}`,
            lignes: route.lines,
            notes: vente.notes,
            urgent,
          };

          if (route.printer.typeConnexion === "SYSTEME") {
            const html = generateBonPreparationHTML(bonData, "cuisine");
            systemPrintJobs.push({ type: "cuisine", html });
            if (!results.results.kitchen) {
              results.results.kitchen = { success: true, message: "Impression systeme requise" };
            }
          } else {
            const kitchenCommands = generateBonCuisine(
              bonData,
              route.printer.largeurPapier as 58 | 80
            );
            const kitchenResult = await sendToPrinter(route.printer, kitchenCommands);
            if (!results.results.kitchen) results.results.kitchen = kitchenResult;
            else if (!kitchenResult.success) results.errors.push(`Cuisine: ${kitchenResult.error}`);
          }
        }
      }
      if (!results.results.kitchen && kitchenLines.length > 0)
        results.errors.push("Aucune imprimante cuisine disponible");
    }

    // 4. Imprimer le bon bar
    if (printBar && barLines.length > 0) {
      const routes = await routeLinesToPrinters(vente.etablissement_id, barLines);
      for (const route of routes) {
        if (route.printer && route.lines.length > 0) {
          const bonData: BonPreparationData = {
            numeroCommande: vente.numero_ticket,
            dateCommande: new Date(vente.created_at),
            typeVente: vente.type,
            tableNumero: table?.numero || null,
            tableZone: table?.zones?.nom || null,
            clientNom: client ? `${client.nom}${client.prenom ? " " + client.prenom : ""}` : null,
            serveurNom: `${venteUser.nom}${venteUser.prenom ? " " + venteUser.prenom : ""}`,
            lignes: route.lines,
            notes: vente.notes,
            urgent,
          };

          if (route.printer.typeConnexion === "SYSTEME") {
            const html = generateBonPreparationHTML(bonData, "bar");
            systemPrintJobs.push({ type: "bar", html });
            if (!results.results.bar) {
              results.results.bar = { success: true, message: "Impression systeme requise" };
            }
          } else {
            const barCommands = generateBonBar(bonData, route.printer.largeurPapier as 58 | 80);
            const barResult = await sendToPrinter(route.printer, barCommands);
            if (!results.results.bar) results.results.bar = barResult;
            else if (!barResult.success) results.errors.push(`Bar: ${barResult.error}`);
          }
        }
      }
      if (!results.results.bar && barLines.length > 0)
        results.errors.push("Aucune imprimante bar disponible");
    }

    // Ajouter les jobs d'impression systeme a la reponse
    if (systemPrintJobs.length > 0) {
      results.systemPrintJobs = systemPrintJobs;
    }

    results.success = results.errors.length === 0;
    if (
      results.errors.length > 0 &&
      (results.results.ticket?.success ||
        results.results.kitchen?.success ||
        results.results.bar?.success)
    ) {
      return NextResponse.json({
        ...results,
        success: true,
        partialSuccess: true,
        message: "Certaines impressions ont échoué",
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("[API Print Auto-Route] Erreur:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur interne",
        results: {},
        errors: [error instanceof Error ? error.message : "Erreur interne"],
      },
      { status: 500 }
    );
  }
}
