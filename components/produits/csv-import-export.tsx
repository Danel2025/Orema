"use client";

/**
 * CSVImportExport - Composant pour l'import/export CSV des produits
 */

import { useState, useRef } from "react";
import {
  Download,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  FileWarning,
} from "lucide-react";
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
  const [importStep, setImportStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
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
        // Créer et télécharger le fichier
        const blob = new Blob(["\ufeff" + result.data], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename || "produits.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("Export CSV termine");
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

        toast.success("Template telecharge");
      }
    } catch (error) {
      console.error("Erreur template:", error);
      toast.error("Erreur lors du telechargement du template");
    }
  };

  // Gérer le fichier uploadé
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Le fichier doit etre au format CSV");
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
      <div style={{ display: "flex", gap: 8 }}>
        {/* Export */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 500,
            borderRadius: 8,
            border: "1px solid var(--gray-a6)",
            backgroundColor: "transparent",
            color: "var(--gray-11)",
            cursor: isExporting ? "not-allowed" : "pointer",
            opacity: isExporting ? 0.7 : 1,
          }}
        >
          {isExporting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Download size={16} />
          )}
          Exporter CSV
        </button>

        {/* Import */}
        <button
          onClick={() => setShowImportModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 500,
            borderRadius: 8,
            border: "1px solid var(--gray-a6)",
            backgroundColor: "transparent",
            color: "var(--gray-11)",
            cursor: "pointer",
          }}
        >
          <Upload size={16} />
          Importer CSV
        </button>
      </div>

      {/* Modal d'import */}
      {showImportModal ? <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 16,
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              backgroundColor: "var(--color-panel-solid)",
              borderRadius: 16,
              width: "100%",
              maxWidth: 600,
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 24px",
                borderBottom: "1px solid var(--gray-a6)",
              }}
            >
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: "var(--gray-12)",
                  margin: 0,
                }}
              >
                Importer des produits
              </h2>
              <button
                onClick={handleCloseModal}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: "var(--gray-a3)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--gray-11)",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
              {/* Step: Upload */}
              {importStep === "upload" && (
                <div style={{ textAlign: "center" }}>
                  {/* Zone de drop */}
                  <div
                    style={{
                      border: "2px dashed var(--gray-a6)",
                      borderRadius: 12,
                      padding: 40,
                      marginBottom: 24,
                      backgroundColor: "var(--gray-a2)",
                    }}
                  >
                    <FileText
                      size={48}
                      style={{ color: "var(--gray-9)", marginBottom: 16 }}
                    />
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: "var(--gray-12)",
                        marginBottom: 8,
                      }}
                    >
                      Selectionnez un fichier CSV
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--gray-10)",
                        marginBottom: 16,
                      }}
                    >
                      Format: CSV avec separateur point-virgule (;)
                    </p>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isImporting}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 20px",
                        fontSize: 14,
                        fontWeight: 600,
                        borderRadius: 8,
                        border: "none",
                        backgroundColor: "var(--accent-9)",
                        color: "white",
                        cursor: isImporting ? "not-allowed" : "pointer",
                        opacity: isImporting ? 0.7 : 1,
                      }}
                    >
                      {isImporting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Upload size={16} />
                      )}
                      Choisir un fichier
                    </button>
                  </div>

                  {/* Télécharger template */}
                  <div
                    style={{
                      padding: 16,
                      backgroundColor: "var(--blue-a2)",
                      borderRadius: 8,
                      border: "1px solid var(--blue-a6)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--blue-11)",
                        marginBottom: 12,
                      }}
                    >
                      Besoin d'un modele ? Telechargez le template CSV avec les colonnes requises.
                    </p>
                    <button
                      onClick={handleDownloadTemplate}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 14px",
                        fontSize: 13,
                        fontWeight: 500,
                        borderRadius: 6,
                        border: "1px solid var(--blue-a6)",
                        backgroundColor: "transparent",
                        color: "var(--blue-11)",
                        cursor: "pointer",
                      }}
                    >
                      <Download size={14} />
                      Telecharger le template
                    </button>
                  </div>
                </div>
              )}

              {/* Step: Preview */}
              {importStep === "preview" && parseResult ? <div>
                  {/* Résumé */}
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      marginBottom: 24,
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        padding: 16,
                        backgroundColor: "var(--green-a2)",
                        borderRadius: 8,
                        border: "1px solid var(--green-a6)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 4,
                        }}
                      >
                        <CheckCircle2 size={18} style={{ color: "var(--green-9)" }} />
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: "var(--green-11)",
                          }}
                        >
                          Produits valides
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 28,
                          fontWeight: 700,
                          color: "var(--green-11)",
                        }}
                      >
                        {parseResult.valid.length}
                      </div>
                    </div>

                    {parseResult.errors.length > 0 && (
                      <div
                        style={{
                          flex: 1,
                          padding: 16,
                          backgroundColor: "var(--red-a2)",
                          borderRadius: 8,
                          border: "1px solid var(--red-a6)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 4,
                          }}
                        >
                          <FileWarning size={18} style={{ color: "var(--red-9)" }} />
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: "var(--red-11)",
                            }}
                          >
                            Erreurs
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 28,
                            fontWeight: 700,
                            color: "var(--red-11)",
                          }}
                        >
                          {parseResult.errors.length}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Liste des erreurs */}
                  {parseResult.errors.length > 0 && (
                    <div
                      style={{
                        marginBottom: 24,
                        maxHeight: 200,
                        overflowY: "auto",
                        padding: 12,
                        backgroundColor: "var(--red-a2)",
                        borderRadius: 8,
                        border: "1px solid var(--red-a6)",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--red-11)",
                          marginBottom: 12,
                        }}
                      >
                        Lignes avec erreurs:
                      </h4>
                      {parseResult.errors.map((err, i) => (
                        <div
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
                          <strong>Ligne {err.line}:</strong>
                          <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                            {err.errors.map((e, j) => (
                              <li key={j}>{e}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Aperçu des produits valides */}
                  {parseResult.valid.length > 0 && (
                    <div>
                      <h4
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--gray-11)",
                          marginBottom: 12,
                        }}
                      >
                        Apercu des produits a importer:
                      </h4>
                      <div
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
                            <tr
                              style={{
                                backgroundColor: "var(--gray-a2)",
                                position: "sticky",
                                top: 0,
                              }}
                            >
                              <th
                                style={{
                                  padding: "8px 12px",
                                  textAlign: "left",
                                  fontWeight: 600,
                                  color: "var(--gray-11)",
                                }}
                              >
                                Nom
                              </th>
                              <th
                                style={{
                                  padding: "8px 12px",
                                  textAlign: "left",
                                  fontWeight: 600,
                                  color: "var(--gray-11)",
                                }}
                              >
                                Categorie
                              </th>
                              <th
                                style={{
                                  padding: "8px 12px",
                                  textAlign: "right",
                                  fontWeight: 600,
                                  color: "var(--gray-11)",
                                }}
                              >
                                Prix
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {parseResult.valid.slice(0, 10).map((prod, i) => (
                              <tr
                                key={i}
                                style={{
                                  borderTop: "1px solid var(--gray-a4)",
                                }}
                              >
                                <td
                                  style={{
                                    padding: "8px 12px",
                                    color: "var(--gray-12)",
                                  }}
                                >
                                  {prod.nom}
                                </td>
                                <td
                                  style={{
                                    padding: "8px 12px",
                                    color: "var(--gray-11)",
                                  }}
                                >
                                  {prod.categorie}
                                </td>
                                <td
                                  style={{
                                    padding: "8px 12px",
                                    textAlign: "right",
                                    color: "var(--gray-12)",
                                    fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                                  }}
                                >
                                  {prod.prixVente.toLocaleString("fr-FR")} FCFA
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {parseResult.valid.length > 10 && (
                          <div
                            style={{
                              padding: 8,
                              textAlign: "center",
                              fontSize: 12,
                              color: "var(--gray-10)",
                              backgroundColor: "var(--gray-a2)",
                            }}
                          >
                            ... et {parseResult.valid.length - 10} autres produits
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div> : null}

              {/* Step: Importing */}
              {importStep === "importing" && (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <Loader2
                    size={48}
                    className="animate-spin"
                    style={{ color: "var(--accent-9)", marginBottom: 16 }}
                  />
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 500,
                      color: "var(--gray-12)",
                    }}
                  >
                    Import en cours...
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--gray-10)",
                    }}
                  >
                    Veuillez patienter
                  </p>
                </div>
              )}

              {/* Step: Done */}
              {importStep === "done" && importResult ? <div style={{ textAlign: "center" }}>
                  <CheckCircle2
                    size={64}
                    style={{ color: "var(--green-9)", marginBottom: 16 }}
                  />
                  <h3
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: "var(--gray-12)",
                      marginBottom: 8,
                    }}
                  >
                    Import termine !
                  </h3>

                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      justifyContent: "center",
                      marginTop: 24,
                      marginBottom: 24,
                    }}
                  >
                    <div
                      style={{
                        padding: 16,
                        backgroundColor: "var(--green-a2)",
                        borderRadius: 8,
                        minWidth: 100,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 28,
                          fontWeight: 700,
                          color: "var(--green-11)",
                        }}
                      >
                        {importResult.created}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--green-11)",
                        }}
                      >
                        crees
                      </div>
                    </div>

                    <div
                      style={{
                        padding: 16,
                        backgroundColor: "var(--blue-a2)",
                        borderRadius: 8,
                        minWidth: 100,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 28,
                          fontWeight: 700,
                          color: "var(--blue-11)",
                        }}
                      >
                        {importResult.updated}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--blue-11)",
                        }}
                      >
                        mis a jour
                      </div>
                    </div>

                    {importResult.errors.length > 0 && (
                      <div
                        style={{
                          padding: 16,
                          backgroundColor: "var(--red-a2)",
                          borderRadius: 8,
                          minWidth: 100,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 28,
                            fontWeight: 700,
                            color: "var(--red-11)",
                          }}
                        >
                          {importResult.errors.length}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--red-11)",
                          }}
                        >
                          erreurs
                        </div>
                      </div>
                    )}
                  </div>

                  {importResult.errors.length > 0 && (
                    <div
                      style={{
                        textAlign: "left",
                        padding: 12,
                        backgroundColor: "var(--red-a2)",
                        borderRadius: 8,
                        marginBottom: 16,
                        maxHeight: 150,
                        overflowY: "auto",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "var(--red-11)",
                          marginBottom: 8,
                        }}
                      >
                        Produits en erreur:
                      </h4>
                      {importResult.errors.map((err, i) => (
                        <div
                          key={i}
                          style={{
                            fontSize: 12,
                            color: "var(--red-11)",
                            marginBottom: 4,
                          }}
                        >
                          <strong>{err.nom}:</strong> {err.error}
                        </div>
                      ))}
                    </div>
                  )}
                </div> : null}
            </div>

            {/* Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
                padding: "16px 24px",
                borderTop: "1px solid var(--gray-a6)",
              }}
            >
              {importStep === "preview" && (
                <>
                  <button
                    onClick={() => {
                      setParseResult(null);
                      setImportStep("upload");
                    }}
                    style={{
                      padding: "10px 20px",
                      fontSize: 14,
                      fontWeight: 500,
                      borderRadius: 8,
                      border: "1px solid var(--gray-a6)",
                      backgroundColor: "transparent",
                      color: "var(--gray-12)",
                      cursor: "pointer",
                    }}
                  >
                    Retour
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={parseResult?.valid.length === 0}
                    style={{
                      padding: "10px 20px",
                      fontSize: 14,
                      fontWeight: 600,
                      borderRadius: 8,
                      border: "none",
                      backgroundColor:
                        parseResult?.valid.length === 0
                          ? "var(--gray-a6)"
                          : "var(--accent-9)",
                      color: "white",
                      cursor:
                        parseResult?.valid.length === 0 ? "not-allowed" : "pointer",
                    }}
                  >
                    Importer {parseResult?.valid.length || 0} produits
                  </button>
                </>
              )}

              {(importStep === "upload" || importStep === "done") && (
                <button
                  onClick={handleCloseModal}
                  style={{
                    padding: "10px 20px",
                    fontSize: 14,
                    fontWeight: 500,
                    borderRadius: 8,
                    border: "1px solid var(--gray-a6)",
                    backgroundColor: "transparent",
                    color: "var(--gray-12)",
                    cursor: "pointer",
                  }}
                >
                  Fermer
                </button>
              )}
            </div>
          </div>
        </div> : null}
    </>
  );
}
