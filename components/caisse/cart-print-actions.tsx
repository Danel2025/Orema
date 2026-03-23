"use client";

/**
 * CartPrintActions - Boutons d'impression pour le panier
 *
 * Permet d'imprimer:
 * - L'addition (pre-note pour le client)
 * - Les bons de fabrication (cuisine/bar)
 */

import { useState, useCallback } from "react";
import { DropdownMenu, Tooltip } from "@radix-ui/themes";
import { Printer, Receipt, CookingPot, Wine, FileText, SpinnerGap, CaretDown } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cart-store";
import type { AdditionData, BonPreparationData } from "@/lib/print/types";
import {
  printViaSystem,
  generateAdditionHTML,
  generateBonPreparationHTML,
} from "@/lib/print/system-print";

interface CartPrintActionsProps {
  etablissement: {
    nom: string;
    adresse?: string | null;
    telephone?: string | null;
    email?: string | null;
    nif?: string | null;
    rccm?: string | null;
    messageTicket?: string | null;
  };
  serveurNom: string;
  disabled?: boolean;
}

type PrintType = "addition" | "cuisine" | "bar";

export function CartPrintActions({
  etablissement,
  serveurNom,
  disabled = false,
}: CartPrintActionsProps) {
  const {
    items,
    sousTotal,
    totalTva,
    totalRemise,
    totalFinal,
    remise,
    typeVente,
    table,
    client,
    adresseLivraison,
    telephoneLivraison,
  } = useCartStore();

  const [isPrinting, setIsPrinting] = useState(false);
  const [printingType, setPrintingType] = useState<PrintType | null>(null);

  /**
   * Cree les donnees d'addition a partir du panier
   */
  const createAdditionData = useCallback((): AdditionData => {
    return {
      etablissement: {
        nom: etablissement.nom,
        adresse: etablissement.adresse || null,
        telephone: etablissement.telephone || null,
        email: etablissement.email || null,
        nif: etablissement.nif || null,
        rccm: etablissement.rccm || null,
        messageTicket: etablissement.messageTicket || null,
      },
      dateAddition: new Date(),
      typeVente,
      tableNumero: table?.numero || null,
      tableZone: table?.zone?.nom || null,
      couverts: table?.couverts,
      clientNom: client ? `${client.nom}${client.prenom ? " " + client.prenom : ""}` : null,
      serveurNom,
      lignes: items.map((item) => ({
        produitNom: item.produit.nom,
        quantite: item.quantite,
        prixUnitaire: item.prixUnitaire + (item.totalSupplements || 0),
        total: item.total,
        notes: item.notes || null,
        supplements: item.supplements,
        remiseLigne: item.remiseLigne || null,
        montantRemiseLigne: item.montantRemiseLigne || null,
      })),
      sousTotal,
      totalTva,
      totalRemise,
      totalFinal,
      remiseType: remise?.type || null,
      remiseValeur: remise?.valeur || null,
      adresseLivraison: adresseLivraison || null,
      telephoneLivraison: telephoneLivraison || null,
    };
  }, [
    etablissement,
    items,
    sousTotal,
    totalTva,
    totalRemise,
    totalFinal,
    remise,
    typeVente,
    table,
    client,
    adresseLivraison,
    telephoneLivraison,
    serveurNom,
  ]);

  /**
   * Cree les donnees de bon de preparation
   */
  const createBonData = useCallback(
    (type: "cuisine" | "bar"): BonPreparationData => {
      // Filtrer les lignes selon le type
      const filteredItems = items.filter((item) => {
        // Utiliser le nom de la categorie pour determiner cuisine/bar
        const catNom = item.categorieNom?.toLowerCase() || "";
        const isBar = [
          "boisson",
          "bar",
          "cocktail",
          "vin",
          "biere",
          "bières",
          "alcool",
          "soft",
          "jus",
          "cafe",
          "the",
          "spiritueux",
        ].some((mot) => catNom.includes(mot));

        return type === "bar" ? isBar : !isBar;
      });

      return {
        numeroCommande: `TEMP-${Date.now()}`,
        dateCommande: new Date(),
        typeVente,
        tableNumero: table?.numero || null,
        tableZone: table?.zone?.nom || null,
        clientNom: client ? `${client.nom}${client.prenom ? " " + client.prenom : ""}` : null,
        serveurNom,
        lignes: filteredItems.map((item) => ({
          produitNom: item.produit.nom,
          quantite: item.quantite,
          prixUnitaire: 0,
          total: 0,
          notes: item.notes || null,
          supplements: item.supplements?.map((s) => ({ nom: s.nom, prix: s.prix })),
        })),
        notes: null,
        urgent: false,
      };
    },
    [items, typeVente, table, client, serveurNom]
  );

  /**
   * Gere l'impression via le systeme (window.print)
   * Utilise l'impression systeme pour compatibilite avec toutes les imprimantes
   */
  const handlePrint = useCallback(
    async (type: PrintType) => {
      if (isPrinting || items.length === 0) return;

      setIsPrinting(true);
      setPrintingType(type);

      try {
        let html: string;
        let successMessage: string;

        switch (type) {
          case "addition": {
            const data = createAdditionData();
            html = generateAdditionHTML(data);
            successMessage = "Addition imprimee";
            break;
          }
          case "cuisine": {
            const data = createBonData("cuisine");
            if (data.lignes.length === 0) {
              toast.info("Aucun article cuisine a imprimer");
              return;
            }
            html = generateBonPreparationHTML(data, "cuisine");
            successMessage = "Bon cuisine imprime";
            break;
          }
          case "bar": {
            const data = createBonData("bar");
            if (data.lignes.length === 0) {
              toast.info("Aucun article bar a imprimer");
              return;
            }
            html = generateBonPreparationHTML(data, "bar");
            successMessage = "Bon bar imprime";
            break;
          }
        }

        const result = await printViaSystem(html);

        if (result.success) {
          toast.success(successMessage);
        } else {
          toast.error(result.error || "Erreur d'impression");
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Erreur d'impression";
        toast.error(errorMsg);
      } finally {
        setIsPrinting(false);
        setPrintingType(null);
      }
    },
    [isPrinting, items.length, createAdditionData, createBonData]
  );

  // Ne pas afficher si pas d'articles
  if (items.length === 0) {
    return null;
  }

  return (
    <div style={{ display: "flex", gap: 8 }}>
      {/* Bouton Imprimer l'addition */}
      <Tooltip content="Imprimer l'addition pour le client">
        <button
          onClick={() => handlePrint("addition")}
          disabled={disabled || isPrinting}
          style={{
            flex: 1,
            padding: "10px 16px",
            fontSize: 14,
            fontWeight: 500,
            color: "var(--gray-11)",
            backgroundColor: "var(--gray-a3)",
            border: "1px solid var(--gray-a6)",
            borderRadius: 8,
            cursor: disabled || isPrinting ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: disabled || isPrinting ? 0.6 : 1,
          }}
        >
          {isPrinting && printingType === "addition" ? (
            <SpinnerGap size={16} className="animate-spin" />
          ) : (
            <Receipt size={16} />
          )}
          Addition
        </button>
      </Tooltip>

      {/* Menu dropdown pour les bons de fabrication */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <button
            disabled={disabled || isPrinting}
            style={{
              padding: "10px 12px",
              fontSize: 14,
              fontWeight: 500,
              color: "var(--gray-11)",
              backgroundColor: "var(--gray-a3)",
              border: "1px solid var(--gray-a6)",
              borderRadius: 8,
              cursor: disabled || isPrinting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              opacity: disabled || isPrinting ? 0.6 : 1,
            }}
          >
            {isPrinting && (printingType === "cuisine" || printingType === "bar") ? (
              <SpinnerGap size={16} className="animate-spin" />
            ) : (
              <Printer size={16} />
            )}
            Bons
            <CaretDown size={14} />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content align="end">
          <DropdownMenu.Item onClick={() => handlePrint("cuisine")}>
            <CookingPot size={14} />
            Bon cuisine
          </DropdownMenu.Item>

          <DropdownMenu.Item onClick={() => handlePrint("bar")}>
            <Wine size={14} />
            Bon bar
          </DropdownMenu.Item>

          <DropdownMenu.Separator />

          <DropdownMenu.Item
            onClick={() => {
              handlePrint("cuisine");
              setTimeout(() => handlePrint("bar"), 500);
            }}
          >
            <FileText size={14} />
            Tous les bons
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  );
}
