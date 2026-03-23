"use client";

/**
 * CSVImportExport - Composant pour l'import/export CSV des produits
 * Utilise Radix UI Dialog pour l'accessibilité
 */

import { useState, useRef } from "react";
import {
  DownloadSimple,
  UploadSimple,
  FileText,
  WarningCircle,
  CheckCircle,
  X,
  SpinnerGap,
  Warning,
} from "@phosphor-icons/react";
import { Dialog, Flex, Text, Button, Box, Spinner } from "@radix-ui/themes";
import { toast } from "sonner";
import {
  exportProduitsCSV,
  getCSVTemplate,
  parseCSVImport,
  importProduitsCSV,
} from "@/actions/produits";
import type { ProduitCsvData } from "@/schemas/produit.schema";

interface CSVImportExportProps {
  onImportComplete?: () => void;
}

interface ParseResult {
  valid: ProduitCsvData[];
  errors: { line: number; errors: string[] }[];
}

export function CSVImportExport({ onImportComplete }: CSVImportExportProps) {
  const [showImportModal, setShowImportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importStep, setImportStep] = useState<"upload" | "preview" | "importing" | "done">(
    "upload"
  );
  const [importResult, setImportResult] = useState<{
    created: number;
    updated: number;
    errors: { nom: string; error: string }[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export CSV
  const handleExport = async () => {
    try {
      setIsExporting(true);
      const result = await exportProduitsCSV();

      if (result.success && result.data) {
        const blob = new Blob(["\ufeff" + result.data], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename || "produits.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("Export CSV terminé");
      } else {
        toast.error("Erreur lors de l'export");
      }
    } catch (error) {
      console.error("Erreur export:", error);
      toast.error("Erreur lors de l'export");
    } finally {
      setIsExporting(false);
    }
  };

  // Télécharger le template
  const handleDownloadTemplate = async () => {
    try {
      const result = await getCSVTemplate();

      if (result.success && result.data) {
        const blob = new Blob(["\ufeff" + result.data], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename || "template_produits.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("Template téléchargé");
      }
    } catch (error) {
      console.error("Erreur template:", error);
      toast.error("Erreur lors du téléchargement du template");
    }
  };

  // Gérer le fichier uploadé
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Le fichier doit être au format CSV");
      return;
    }

    try {
      setIsImporting(true);
      setImportStep("upload");

      const content = await file.text();
      const result = await parseCSVImport(content);

      if (result.success && result.data) {
        setParseResult(result.data);
        setImportStep("preview");
      } else {
        toast.error(result.error || "Erreur lors de la lecture du fichier");
      }
    } catch (error) {
      console.error("Erreur lecture:", error);
      toast.error("Erreur lors de la lecture du fichier");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Confirmer l'import
  const handleConfirmImport = async () => {
    if (!parseResult || parseResult.valid.length === 0) return;

    try {
      setImportStep("importing");
      const result = await importProduitsCSV(parseResult.valid);

      if (result.success && result.data) {
        setImportResult(result.data);
        setImportStep("done");
        onImportComplete?.();
      } else {
        toast.error(result.error || "Erreur lors de l'import");
        setImportStep("preview");
      }
    } catch (error) {
      console.error("Erreur import:", error);
      toast.error("Erreur lors de l'import");
      setImportStep("preview");
    }
  };

  // Réinitialiser le modal
  const handleCloseModal = () => {
    setShowImportModal(false);
    setParseResult(null);
    setImportResult(null);
    setImportStep("upload");
  };

  return (
    <>
      {/* Boutons Export/Import */}
      <Flex gap="2">
        {/* Export */}
        <Button
          variant="outline"
          color="gray"
          size="2"
          onClick={handleExport}
          disabled={isExporting}
          style={{ minHeight: 44 }}
        >
          {isExporting ? (
            <SpinnerGap size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <DownloadSimple size={16} aria-hidden="true" />
          )}
          Exporter CSV
        </Button>

        {/* Import */}
        <Button
          variant="outline"
          color="gray"
          size="2"
          onClick={() => setShowImportModal(true)}
          style={{ minHeight: 44 }}
        >
          <UploadSimple size={16} aria-hidden="true" />
          Importer CSV
        </Button>
      </Flex>

      {/* Modal d'import - Dialog Radix UI */}
      <Dialog.Root open={showImportModal} onOpenChange={(open) => { if (!open) handleCloseModal(); }}>
        <Dialog.Content maxWidth="600px" style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
          <Dialog.Title>Importer des produits</Dialog.Title>

          {/* Content */}
          <Box style={{ overflowY: "auto", flex: 1, paddingTop: 16 }}>
            {/* Step: Upload */}
            {importStep === "upload" && (
              <Box style={{ textAlign: "center" }}>
                {/* Zone de drop */}
                <Box
                  style={{
                    border: "2px dashed var(--gray-a6)",
                    borderRadius: 12,
                    padding: 40,
                    marginBottom: 24,
                    backgroundColor: "var(--gray-a2)",
                  }}
                >
                  <FileText size={48} style={{ color: "var(--gray-9)", marginBottom: 16 }} aria-hidden="true" />
                  <Text as="p" size="3" weight="medium" mb="2">
                    Sélectionnez un fichier CSV
                  </Text>
                  <Text as="p" size="2" color="gray" mb="4">
                    Format : CSV avec séparateur point-virgule (;)
                  </Text>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                    aria-label="Sélectionner un fichier CSV à importer"
                  />

                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    size="2"
                    style={{ minHeight: 44 }}
                  >
                    {isImporting ? (
                      <SpinnerGap size={16} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <UploadSimple size={16} aria-hidden="true" />
                    )}
                    Choisir un fichier
                  </Button>
                </Box>

                {/* Télécharger template */}
                <Box
                  p="4"
                  style={{
                    backgroundColor: "var(--blue-a2)",
                    borderRadius: 8,
                    border: "1px solid var(--blue-a6)",
                  }}
                >
                  <Text as="p" size="2" style={{ color: "var(--blue-11)" }} mb="3">
                    Besoin d&apos;un modèle ? Téléchargez le template CSV avec les colonnes requises.
                  </Text>
                  <Button
                    variant="outline"
                    color="blue"
                    size="1"
                    onClick={handleDownloadTemplate}
                    style={{ minHeight: 36 }}
                  >
                    <DownloadSimple size={14} aria-hidden="true" />
                    Télécharger le template
                  </Button>
                </Box>
              </Box>
            )}

            {/* Step: Preview */}
            {importStep === "preview" && parseResult ? <Box>
                {/* Résumé */}
                <Flex gap="4" mb="5">
                  <Box
                    style={{
                      flex: 1,
                      padding: 16,
                      backgroundColor: "var(--green-a2)",
                      borderRadius: 8,
                      border: "1px solid var(--green-a6)",
                    }}
                  >
                    <Flex align="center" gap="2" mb="1">
                      <CheckCircle size={18} style={{ color: "var(--green-9)" }} aria-hidden="true" />
                      <Text size="2" weight="medium" style={{ color: "var(--green-11)" }}>
                        Produits valides
                      </Text>
                    </Flex>
                    <Text size="7" weight="bold" style={{ color: "var(--green-11)" }}>
                      {parseResult.valid.length}
                    </Text>
                  </Box>

                  {parseResult.errors.length > 0 && (
                    <Box
                      style={{
                        flex: 1,
                        padding: 16,
                        backgroundColor: "var(--red-a2)",
                        borderRadius: 8,
                        border: "1px solid var(--red-a6)",
                      }}
                    >
                      <Flex align="center" gap="2" mb="1">
                        <Warning size={18} style={{ color: "var(--red-9)" }} aria-hidden="true" />
                        <Text size="2" weight="medium" style={{ color: "var(--red-11)" }}>
                          Erreurs
                        </Text>
                      </Flex>
                      <Text size="7" weight="bold" style={{ color: "var(--red-11)" }}>
                        {parseResult.errors.length}
                      </Text>
                    </Box>
                  )}
                </Flex>

                {/* Liste des erreurs */}
                {parseResult.errors.length > 0 && (
                  <Box
                    mb="5"
                    p="3"
                    style={{
                      maxHeight: 200,
                      overflowY: "auto",
                      backgroundColor: "var(--red-a2)",
                      borderRadius: 8,
                      border: "1px solid var(--red-a6)",
                    }}
                  >
                    <Text size="2" weight="bold" style={{ color: "var(--red-11)" }} mb="3">
                      Lignes avec erreurs :
                    </Text>
                    {parseResult.errors.map((err, i) => (
                      <Box
                        key={i}
                        style={{
                          fontSize: 12,
                          color: "var(--red-11)",
                          marginBottom: 8,
                          paddingBottom: 8,
                          borderBottom:
                            i < parseResult.errors.length - 1
                              ? "1px solid var(--red-a4)"
                              : "none",
                        }}
                      >
                        <strong>Ligne {err.line} :</strong>
                        <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                          {err.errors.map((e, j) => (
                            <li key={j}>{e}</li>
                          ))}
                        </ul>
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Aperçu des produits valides */}
                {parseResult.valid.length > 0 && (
                  <Box>
                    <Text size="2" weight="bold" color="gray" mb="3">
                      Aperçu des produits à importer :
                    </Text>
                    <Box
                      style={{
                        maxHeight: 200,
                        overflowY: "auto",
                        border: "1px solid var(--gray-a6)",
                        borderRadius: 8,
                      }}
                    >
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: 12,
                        }}
                      >
                        <thead>
                          <tr style={{ backgroundColor: "var(--gray-a2)", position: "sticky", top: 0 }}>
                            <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "var(--gray-11)" }}>
                              Nom
                            </th>
                            <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "var(--gray-11)" }}>
                              Catégorie
                            </th>
                            <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "var(--gray-11)" }}>
                              Prix
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {parseResult.valid.slice(0, 10).map((prod, i) => (
                            <tr key={i} style={{ borderTop: "1px solid var(--gray-a4)" }}>
                              <td style={{ padding: "8px 12px", color: "var(--gray-12)" }}>{prod.nom}</td>
                              <td style={{ padding: "8px 12px", color: "var(--gray-11)" }}>{prod.categorie}</td>
                              <td style={{ padding: "8px 12px", textAlign: "right", color: "var(--gray-12)", fontFamily: "var(--font-google-sans-code), ui-monospace, monospace" }}>
                                {prod.prixVente.toLocaleString("fr-FR")} FCFA
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {parseResult.valid.length > 10 && (
                        <Box p="2" style={{ textAlign: "center", fontSize: 12, color: "var(--gray-10)", backgroundColor: "var(--gray-a2)" }}>
                          ... et {parseResult.valid.length - 10} autres produits
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}
              </Box> : null}

            {/* Step: Importing */}
            {importStep === "importing" && (
              <Flex direction="column" align="center" py="8" role="status" aria-live="polite">
                <Spinner size="3" style={{ marginBottom: 16 }} />
                <Text size="3" weight="medium">Import en cours...</Text>
                <Text size="2" color="gray">Veuillez patienter</Text>
              </Flex>
            )}

            {/* Step: Done */}
            {importStep === "done" && importResult ? <Box style={{ textAlign: "center" }}>
                <CheckCircle size={64} style={{ color: "var(--green-9)", marginBottom: 16 }} aria-hidden="true" />
                <Text as="p" size="5" weight="bold" mb="5">
                  Import terminé !
                </Text>

                <Flex gap="4" justify="center" mb="5">
                  <Box p="4" style={{ backgroundColor: "var(--green-a2)", borderRadius: 8, minWidth: 100 }}>
                    <Text as="p" size="7" weight="bold" style={{ color: "var(--green-11)" }}>
                      {importResult.created}
                    </Text>
                    <Text as="p" size="1" style={{ color: "var(--green-11)" }}>créés</Text>
                  </Box>

                  <Box p="4" style={{ backgroundColor: "var(--blue-a2)", borderRadius: 8, minWidth: 100 }}>
                    <Text as="p" size="7" weight="bold" style={{ color: "var(--blue-11)" }}>
                      {importResult.updated}
                    </Text>
                    <Text as="p" size="1" style={{ color: "var(--blue-11)" }}>mis à jour</Text>
                  </Box>

                  {importResult.errors.length > 0 && (
                    <Box p="4" style={{ backgroundColor: "var(--red-a2)", borderRadius: 8, minWidth: 100 }}>
                      <Text as="p" size="7" weight="bold" style={{ color: "var(--red-11)" }}>
                        {importResult.errors.length}
                      </Text>
                      <Text as="p" size="1" style={{ color: "var(--red-11)" }}>erreurs</Text>
                    </Box>
                  )}
                </Flex>

                {importResult.errors.length > 0 && (
                  <Box
                    p="3"
                    mb="4"
                    style={{
                      textAlign: "left",
                      backgroundColor: "var(--red-a2)",
                      borderRadius: 8,
                      maxHeight: 150,
                      overflowY: "auto",
                    }}
                  >
                    <Text size="1" weight="bold" style={{ color: "var(--red-11)" }} mb="2">
                      Produits en erreur :
                    </Text>
                    {importResult.errors.map((err, i) => (
                      <Box key={i} style={{ fontSize: 12, color: "var(--red-11)", marginBottom: 4 }}>
                        <strong>{err.nom} :</strong> {err.error}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box> : null}
          </Box>

          {/* Footer */}
          <Flex gap="3" justify="end" pt="4" style={{ borderTop: "1px solid var(--gray-a6)" }}>
            {importStep === "preview" && (
              <>
                <Button
                  variant="soft"
                  color="gray"
                  size="2"
                  onClick={() => { setParseResult(null); setImportStep("upload"); }}
                  style={{ minHeight: 44 }}
                >
                  Retour
                </Button>
                <Button
                  size="2"
                  onClick={handleConfirmImport}
                  disabled={parseResult?.valid.length === 0}
                  style={{ minHeight: 44 }}
                >
                  Importer {parseResult?.valid.length || 0} produits
                </Button>
              </>
            )}

            {(importStep === "upload" || importStep === "done") && (
              <Dialog.Close>
                <Button variant="soft" color="gray" size="2" style={{ minHeight: 44 }}>
                  Fermer
                </Button>
              </Dialog.Close>
            )}
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}
