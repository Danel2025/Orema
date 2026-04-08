"use client";

/**
 * ExportPDF - Bouton d'export PDF du rapport affiche
 * Utilise html2pdf.js en import dynamique pour generer un PDF A4
 */

import { useState } from "react";
import { Button } from "@radix-ui/themes";
import { FileText, CircleNotch } from "@phosphor-icons/react";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

interface ExportPDFProps {
  /** Selecteur CSS ou ref de l'element a exporter */
  targetSelector?: string;
  /** Nom du fichier PDF genere */
  filename?: string;
  /** Titre affiche dans l'en-tete du PDF */
  title?: string;
  /** Nom de l'etablissement pour l'en-tete */
  etablissementNom?: string;
  /** Orientation du PDF */
  orientation?: "portrait" | "landscape";
  /** Variante du bouton */
  variant?: "solid" | "soft" | "outline" | "ghost";
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function ExportPDF({
  targetSelector = "#rapport-content",
  filename = "rapport",
  title = "Rapport",
  etablissementNom,
  orientation = "portrait",
  variant = "soft",
}: ExportPDFProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Import dynamique de html2pdf.js
      const html2pdf = (await import("html2pdf.js")).default;

      // Recuperer l'element cible
      const element = document.querySelector(targetSelector);

      if (!element) {
        toast.error("Contenu du rapport introuvable");
        return;
      }

      // Creer un wrapper avec en-tete
      const wrapper = document.createElement("div");
      wrapper.style.fontFamily = "Arial, sans-serif";

      // En-tete (DOM programmatique pour eviter XSS)
      const header = document.createElement("div");
      header.style.padding = "20px";
      header.style.borderBottom = "2px solid #f97316";
      header.style.marginBottom = "20px";

      const headerFlex = document.createElement("div");
      headerFlex.style.display = "flex";
      headerFlex.style.justifyContent = "space-between";
      headerFlex.style.alignItems = "center";

      const leftCol = document.createElement("div");
      const h1 = document.createElement("h1");
      h1.style.color = "#f97316";
      h1.style.margin = "0";
      h1.style.fontSize = "24px";
      h1.textContent = title;
      leftCol.appendChild(h1);

      if (etablissementNom) {
        const pEtab = document.createElement("p");
        pEtab.style.color = "#666";
        pEtab.style.margin = "4px 0 0 0";
        pEtab.style.fontSize = "14px";
        pEtab.textContent = etablissementNom;
        leftCol.appendChild(pEtab);
      }

      const rightCol = document.createElement("div");
      rightCol.style.textAlign = "right";

      const pDate = document.createElement("p");
      pDate.style.color = "#666";
      pDate.style.margin = "0";
      pDate.style.fontSize = "12px";
      pDate.textContent = `Genere le ${new Date().toLocaleDateString("fr-GA", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })}`;
      rightCol.appendChild(pDate);

      const pTime = document.createElement("p");
      pTime.style.color = "#999";
      pTime.style.margin = "4px 0 0 0";
      pTime.style.fontSize = "11px";
      pTime.textContent = new Date().toLocaleTimeString("fr-GA", {
        hour: "2-digit",
        minute: "2-digit",
      });
      rightCol.appendChild(pTime);

      headerFlex.appendChild(leftCol);
      headerFlex.appendChild(rightCol);
      header.appendChild(headerFlex);

      // Cloner le contenu
      const content = element.cloneNode(true) as HTMLElement;
      content.style.padding = "0 20px";

      // Pied de page (DOM programmatique)
      const footer = document.createElement("div");
      footer.style.padding = "20px";
      footer.style.borderTop = "1px solid #eee";
      footer.style.marginTop = "20px";
      footer.style.textAlign = "center";
      const footerText = document.createElement("p");
      footerText.style.color = "#999";
      footerText.style.fontSize = "10px";
      footerText.style.margin = "0";
      footerText.textContent = "Orema N+ POS — Document généré automatiquement";
      footer.appendChild(footerText);

      wrapper.appendChild(header);
      wrapper.appendChild(content);
      wrapper.appendChild(footer);

      // Ajouter temporairement au DOM (requis par html2pdf)
      wrapper.style.position = "absolute";
      wrapper.style.left = "-9999px";
      wrapper.style.top = "0";
      document.body.appendChild(wrapper);

      // Options PDF
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `${filename}-${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: "jpeg" as const, quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
        },
        jsPDF: {
          unit: "mm" as const,
          format: "a4" as const,
          orientation: orientation as "portrait" | "landscape",
        },
      };

      // Generer et telecharger le PDF
      await html2pdf().set(opt).from(wrapper).save();

      // Nettoyer
      document.body.removeChild(wrapper);

      toast.success("PDF exporté avec succès");
    } catch (error) {
      console.error("Erreur export PDF:", error);

      // Fallback: ouvrir dans une nouvelle fenetre pour impression (DOM programmatique)
      const fallbackElement = document.querySelector(targetSelector);
      if (fallbackElement) {
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          const doc = printWindow.document;
          doc.open();

          // Construire le document de maniere securisee
          const doctype = doc.implementation.createDocumentType("html", "", "");
          const htmlDoc = doc.implementation.createHTMLDocument(title);
          if (doc.doctype) {
            doc.replaceChild(doctype, doc.doctype);
          }

          // Style
          const style = doc.createElement("style");
          style.textContent = [
            "body { font-family: Arial, sans-serif; padding: 20px; }",
            "h1 { color: #f97316; }",
            "table { width: 100%; border-collapse: collapse; }",
            "th { background-color: #f97316; color: white; padding: 8px; text-align: left; }",
            "td { padding: 8px; border: 1px solid #ddd; }",
            "tr:nth-child(even) { background-color: #f9f9f9; }",
            "@media print { .no-print { display: none; } }",
          ].join("\n");

          doc.head.appendChild(style);
          doc.title = title;

          // Contenu
          const h1 = doc.createElement("h1");
          h1.textContent = title;
          doc.body.appendChild(h1);

          if (etablissementNom) {
            const pEtab = doc.createElement("p");
            pEtab.textContent = etablissementNom;
            doc.body.appendChild(pEtab);
          }

          const pDate = doc.createElement("p");
          pDate.textContent = `Genere le ${new Date().toLocaleDateString("fr-GA")}`;
          doc.body.appendChild(pDate);

          doc.body.appendChild(doc.createElement("hr"));

          // Cloner le contenu original
          const clonedContent = fallbackElement.cloneNode(true) as HTMLElement;
          doc.body.appendChild(clonedContent);

          doc.body.appendChild(doc.createElement("br"));

          const printBtn = doc.createElement("button");
          printBtn.className = "no-print";
          printBtn.textContent = "Imprimer";
          printBtn.style.cssText =
            "padding: 10px 20px; background: #f97316; color: white; border: none; cursor: pointer; border-radius: 6px;";
          printBtn.addEventListener("click", () => printWindow.print());
          doc.body.appendChild(printBtn);

          doc.close();
        }
      }

      toast.error("Export PDF échoué, fenêtre d'impression ouverte");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button variant={variant} color="red" onClick={handleExport} disabled={isExporting}>
      {isExporting ? <CircleNotch size={16} className="animate-spin" /> : <FileText size={16} />}
      {isExporting ? "Export en cours..." : "Exporter PDF"}
    </Button>
  );
}
