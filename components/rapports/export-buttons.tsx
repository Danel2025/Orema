"use client";

/**
 * ExportButtons - Boutons d'export des rapports
 * Export en PDF, Excel et CSV
 */

import { useState } from "react";
import { Button, DropdownMenu, Flex, Text } from "@radix-ui/themes";
import { DownloadSimple, FileText, FileXls, File, CircleNotch } from "@phosphor-icons/react";
import { toast } from "sonner";

type ExportFormat = "pdf" | "excel" | "csv";

interface ExportButtonsProps {
  data: Record<string, unknown>[];
  filename?: string;
  title?: string;
  onExport?: (format: ExportFormat) => Promise<void>;
}

export function ExportButtons({
  data,
  filename = "rapport",
  title = "Rapport",
  onExport,
}: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    if (data.length === 0) {
      toast.error("Aucune donnee a exporter");
      return;
    }

    setIsExporting(format);

    try {
      if (onExport) {
        await onExport(format);
      } else {
        switch (format) {
          case "csv":
            exportToCSV(data, filename);
            break;
          case "excel":
            await exportToExcel(data, filename, title);
            break;
          case "pdf":
            await exportToPDF(data, filename, title);
            break;
        }
      }
      toast.success(`Export ${format.toUpperCase()} termine`);
    } catch (error) {
      console.error("Erreur export:", error);
      toast.error(`Erreur lors de l'export ${format.toUpperCase()}`);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button variant="soft" disabled={isExporting !== null}>
          {isExporting ? <CircleNotch size={16} className="animate-spin" /> : <DownloadSimple size={16} />}
          Exporter
          <DropdownMenu.TriggerIcon />
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content>
        <DropdownMenu.Item onClick={() => handleExport("pdf")}>
          <Flex align="center" gap="2">
            <FileText size={16} style={{ color: "var(--red-9)" }} />
            <Text>Exporter en PDF</Text>
          </Flex>
        </DropdownMenu.Item>

        <DropdownMenu.Item onClick={() => handleExport("excel")}>
          <Flex align="center" gap="2">
            <FileXls size={16} style={{ color: "var(--green-9)" }} />
            <Text>Exporter en Excel</Text>
          </Flex>
        </DropdownMenu.Item>

        <DropdownMenu.Item onClick={() => handleExport("csv")}>
          <Flex align="center" gap="2">
            <File size={16} style={{ color: "var(--blue-9)" }} />
            <Text>Exporter en CSV</Text>
          </Flex>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

/**
 * Export en CSV (natif, sans dependance)
 */
function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;

  // Obtenir les en-tetes
  const headers = Object.keys(data[0]);

  // Construire le contenu CSV
  const csvContent = [
    headers.join(";"),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Echapper les guillemets et entourer les valeurs contenant des virgules
          const stringValue = String(value ?? "");
          if (
            stringValue.includes(";") ||
            stringValue.includes('"') ||
            stringValue.includes("\n")
          ) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(";")
    ),
  ].join("\n");

  // Creer et telecharger le fichier
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Export en Excel (utilise xlsx si disponible)
 */
async function exportToExcel(data: Record<string, unknown>[], filename: string, title: string) {
  try {
    // Import dynamique de xlsx
    const XLSX = await import("xlsx");

    // Creer le workbook
    const wb = XLSX.utils.book_new();

    // Creer la feuille avec les donnees
    const ws = XLSX.utils.json_to_sheet(data);

    // Ajouter la feuille au workbook
    XLSX.utils.book_append_sheet(wb, ws, title);

    // Generer le fichier et telecharger
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    downloadBlob(blob, `${filename}.xlsx`);
  } catch (error) {
    // Fallback en CSV si xlsx n'est pas disponible
    console.warn("xlsx non disponible, export en CSV");
    exportToCSV(data, filename);
  }
}

/**
 * Echappe les caracteres HTML speciaux pour prevenir les injections XSS
 */
function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Export en PDF (utilise html2pdf si disponible)
 */
async function exportToPDF(data: Record<string, unknown>[], filename: string, title: string) {
  try {
    // Import dynamique de html2pdf
    const html2pdf = (await import("html2pdf.js")).default;

    // Creer le contenu HTML
    const headers = Object.keys(data[0]);
    const tableHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #f97316; margin-bottom: 20px;">${escapeHtml(title)}</h1>
        <p style="color: #666; margin-bottom: 20px;">
          Genere le ${escapeHtml(new Date().toLocaleDateString("fr-GA", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }))}
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background-color: #f97316; color: white;">
              ${headers.map((h) => `<th style="padding: 8px; text-align: left; border: 1px solid #ddd;">${escapeHtml(h)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (row, i) => `
              <tr style="background-color: ${i % 2 === 0 ? "#fff" : "#f9f9f9"};">
                ${headers
                  .map(
                    (h) => `<td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(String(row[h] ?? ""))}</td>`
                  )
                  .join("")}
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <p style="color: #999; margin-top: 20px; font-size: 10px;">
          Orema N+ POS - ${data.length} enregistrements
        </p>
      </div>
    `;

    // Creer un element temporaire
    const element = document.createElement("div");
    element.innerHTML = tableHTML;
    document.body.appendChild(element);

    // Options PDF
    const opt = {
      margin: 10,
      filename: `${filename}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" as const },
    };

    // Generer le PDF
    await html2pdf().set(opt).from(element).save();

    // Nettoyer
    document.body.removeChild(element);
  } catch (error) {
    // Fallback: ouvrir dans une nouvelle fenetre pour impression
    console.warn("html2pdf non disponible, ouverture pour impression");

    const headers = Object.keys(data[0]);
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #f97316; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background-color: #f97316; color: white; padding: 8px; text-align: left; }
          td { padding: 8px; border: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <p>Genere le ${escapeHtml(new Date().toLocaleDateString("fr-GA"))}</p>
        <table>
          <thead>
            <tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${data.map((row) => `<tr>${headers.map((h) => `<td>${escapeHtml(String(row[h] ?? ""))}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
        <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #f97316; color: white; border: none; cursor: pointer;">
          Imprimer
        </button>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  }
}

/**
 * Utilitaire pour telecharger un blob
 */
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
