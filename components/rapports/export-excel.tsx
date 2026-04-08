"use client";

/**
 * ExportExcel - Bouton d'export Excel du rapport
 * Utilise xlsx en import dynamique pour generer un fichier .xlsx multi-feuilles
 */

import { useState } from "react";
import { Button } from "@radix-ui/themes";
import { FileXls, CircleNotch } from "@phosphor-icons/react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { PlanGate } from "@/components/shared/plan-gate";

// ============================================================================
// TYPES
// ============================================================================

interface VenteResume {
  numero: string;
  date: string;
  type: string;
  sousTotal: number;
  tva: number;
  remise: number;
  total: number;
  statut: string;
}

interface TopProduitExport {
  nom: string;
  categorie: string;
  quantite: number;
  ca: number;
}

interface TVAExport {
  taux: string;
  baseHT: number;
  montantTVA: number;
  totalTTC: number;
}

interface ExportExcelProps {
  /** Donnees de resume des ventes */
  ventesResume?: VenteResume[];
  /** Donnees top produits */
  topProduits?: TopProduitExport[];
  /** Donnees TVA */
  tvaDonnees?: TVAExport[];
  /** Donnees brutes supplementaires (cle = nom feuille) */
  additionalSheets?: Record<string, Record<string, unknown>[]>;
  /** Nom du fichier */
  filename?: string;
  /** Titre du rapport */
  title?: string;
  /** Nom de l'etablissement */
  etablissementNom?: string;
  /** Variante du bouton */
  variant?: "solid" | "soft" | "outline" | "ghost";
}

// ============================================================================
// HELPERS
// ============================================================================

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function ExportExcel({
  ventesResume,
  topProduits,
  tvaDonnees,
  additionalSheets,
  filename = "rapport",
  title = "Rapport",
  etablissementNom,
  variant = "soft",
}: ExportExcelProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Import dynamique de xlsx
      const XLSX = await import("xlsx");

      const wb = XLSX.utils.book_new();
      const dateGeneration = new Date().toLocaleDateString("fr-GA", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      // ---- Feuille 1: Resume ----
      const resumeData = [
        [title],
        [etablissementNom || ""],
        [`Genere le ${dateGeneration}`],
        [],
        ["Indicateur", "Valeur"],
      ];

      if (ventesResume) {
        const totalVentes = ventesResume.filter((v) => v.statut === "PAYEE").length;
        const totalCA = ventesResume
          .filter((v) => v.statut === "PAYEE")
          .reduce((sum, v) => sum + v.total, 0);
        const totalRemises = ventesResume
          .filter((v) => v.statut === "PAYEE")
          .reduce((sum, v) => sum + v.remise, 0);
        const totalTVA = ventesResume
          .filter((v) => v.statut === "PAYEE")
          .reduce((sum, v) => sum + v.tva, 0);

        resumeData.push(
          ["Nombre de ventes", totalVentes.toString()],
          ["Chiffre d'affaires TTC", formatCurrency(totalCA)],
          ["Total remises", formatCurrency(totalRemises)],
          ["Total TVA", formatCurrency(totalTVA)],
          ["Panier moyen", formatCurrency(totalVentes > 0 ? Math.round(totalCA / totalVentes) : 0)]
        );
      }

      const wsResume = XLSX.utils.aoa_to_sheet(resumeData);
      // Largeur des colonnes
      wsResume["!cols"] = [{ wch: 25 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, wsResume, "Resume");

      // ---- Feuille 2: Detail ventes ----
      if (ventesResume && ventesResume.length > 0) {
        const ventesHeaders = [
          "Numéro ticket",
          "Date",
          "Type",
          "Sous-total HT",
          "TVA",
          "Remise",
          "Total TTC",
          "Statut",
        ];

        const ventesRows = ventesResume.map((v) => [
          v.numero,
          v.date,
          v.type,
          v.sousTotal,
          v.tva,
          v.remise,
          v.total,
          v.statut,
        ]);

        const wsVentes = XLSX.utils.aoa_to_sheet([ventesHeaders, ...ventesRows]);
        wsVentes["!cols"] = [
          { wch: 18 },
          { wch: 12 },
          { wch: 15 },
          { wch: 15 },
          { wch: 12 },
          { wch: 12 },
          { wch: 15 },
          { wch: 12 },
        ];
        XLSX.utils.book_append_sheet(wb, wsVentes, "Detail ventes");
      }

      // ---- Feuille 3: TVA ----
      if (tvaDonnees && tvaDonnees.length > 0) {
        const tvaHeaders = ["Taux", "Base HT (FCFA)", "Montant TVA (FCFA)", "Total TTC (FCFA)"];
        const tvaRows = tvaDonnees.map((t) => [t.taux, t.baseHT, t.montantTVA, t.totalTTC]);

        // Ligne total
        const totalHT = tvaDonnees.reduce((s, t) => s + t.baseHT, 0);
        const totalTVA = tvaDonnees.reduce((s, t) => s + t.montantTVA, 0);
        const totalTTC = tvaDonnees.reduce((s, t) => s + t.totalTTC, 0);
        tvaRows.push(["TOTAL", totalHT, totalTVA, totalTTC]);

        const wsTVA = XLSX.utils.aoa_to_sheet([tvaHeaders, ...tvaRows]);
        wsTVA["!cols"] = [{ wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(wb, wsTVA, "TVA");
      }

      // ---- Feuille 4: Top produits ----
      if (topProduits && topProduits.length > 0) {
        const prodHeaders = ["Produit", "Catégorie", "Quantité vendue", "CA (FCFA)"];
        const prodRows = topProduits.map((p) => [p.nom, p.categorie, p.quantite, p.ca]);

        const wsProd = XLSX.utils.aoa_to_sheet([prodHeaders, ...prodRows]);
        wsProd["!cols"] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(wb, wsProd, "Top produits");
      }

      // ---- Feuilles supplementaires ----
      if (additionalSheets) {
        for (const [sheetName, data] of Object.entries(additionalSheets)) {
          if (data.length > 0) {
            const ws = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31)); // Max 31 chars pour nom feuille
          }
        }
      }

      // Generer le fichier et telecharger
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      downloadBlob(blob, `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`);

      toast.success("Excel exporté avec succès");
    } catch (error) {
      console.error("Erreur export Excel:", error);
      toast.error("Erreur lors de l'export Excel");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <PlanGate minPlan="business">
      <Button variant={variant} color="green" onClick={handleExport} disabled={isExporting}>
        {isExporting ? <CircleNotch size={16} className="animate-spin" /> : <FileXls size={16} />}
        {isExporting ? "Export en cours..." : "Exporter Excel"}
      </Button>
    </PlanGate>
  );
}
