"use client";

/**
 * ImportProduits - Composant d'import de produits depuis CSV
 */

import { useState, useRef } from "react";
import { X, Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getCSVTemplate,
  parseCSVImport,
  importProduitsCSV,
  exportProduitsCSV,
} from "@/actions/produits";
import type { ProduitCsvData } from "@/schemas/produit.schema";

interface ImportProduitsProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "upload" | "preview" | "importing" | "result";

export function ImportProduits({ onClose, onSuccess }: ImportProduitsProps) {
  const [step, setStep] = useState<Step>("upload");
  const [isLoading, setIsLoading] = useState(false);
  const [validData, setValidData] = useState<ProduitCsvData[]>([]);
  const [errors, setErrors] = useState<{ line: number; errors: string[] }[]>([]);
  const [importResult, setImportResult] = useState<{
    created: number;
    updated: number;
    errors: { nom: string; error: string }[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Télécharger le template CSV
  const handleDownloadTemplate = async () => {
    try {
      setIsLoading(true);
      const result = await getCSVTemplate();

      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.filename || "template_produits.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Template téléchargé");
      }
    } catch {
      toast.error("Erreur lors du téléchargement");
    } finally {
      setIsLoading(false);
    }
  };

  // Exporter les produits existants
  const handleExport = async () => {
    try {
      setIsLoading(true);
      const result = await exportProduitsCSV();

      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.filename || "produits.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Export téléchargé");
      }
    } catch {
      toast.error("Erreur lors de l'export");
    } finally {
      setIsLoading(false);
    }
  };

  // Lire et parser le fichier CSV
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type
    if (!file.name.endsWith(".csv")) {
      toast.error("Veuillez sélectionner un fichier CSV");
      return;
    }

    try {
      setIsLoading(true);
      const content = await file.text();
      const result = await parseCSVImport(content);

      if (!result.success) {
        toast.error(result.error || "Erreur lors du parsing");
        return;
      }

      if (result.data) {
        setValidData(result.data.valid);
        setErrors(result.data.errors);
        setStep("preview");
      }
    } catch {
      toast.error("Erreur lors de la lecture du fichier");
    } finally {
      setIsLoading(false);
    }
  };

  // Lancer l'import
  const handleImport = async () => {
    if (validData.length === 0) {
      toast.error("Aucune donnée valide à importer");
      return;
    }

    try {
      setStep("importing");
      const result = await importProduitsCSV(validData);

      if (result.success && result.data) {
        setImportResult(result.data);
        setStep("result");

        if (result.data.created > 0 || result.data.updated > 0) {
          onSuccess();
        }
      } else {
        toast.error("Erreur lors de l'import");
        setStep("preview");
      }
    } catch {
      toast.error("Erreur lors de l'import");
      setStep("preview");
    }
  };

  const buttonStyle = {
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 500,
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
  };

  return (
    <div
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
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--color-panel-solid)",
          borderRadius: 16,
          width: "100%",
          maxWidth: 700,
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
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--gray-12)", margin: 0 }}>
              Import / Export de produits
            </h2>
            <p style={{ fontSize: 14, color: "var(--gray-11)", margin: "4px 0 0" }}>
              Importez vos produits depuis un fichier CSV
            </p>
          </div>
          <button
            onClick={onClose}
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
        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
          {/* Step: Upload */}
          {step === "upload" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Export / Template buttons */}
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={handleDownloadTemplate}
                  disabled={isLoading}
                  style={{
                    ...buttonStyle,
                    flex: 1,
                    justifyContent: "center",
                    backgroundColor: "var(--gray-a3)",
                    color: "var(--gray-12)",
                    border: "1px solid var(--gray-a6)",
                  }}
                >
                  <Download size={16} />
                  Télécharger le template
                </button>
                <button
                  onClick={handleExport}
                  disabled={isLoading}
                  style={{
                    ...buttonStyle,
                    flex: 1,
                    justifyContent: "center",
                    backgroundColor: "var(--gray-a3)",
                    color: "var(--gray-12)",
                    border: "1px solid var(--gray-a6)",
                  }}
                >
                  <FileSpreadsheet size={16} />
                  Exporter mes produits
                </button>
              </div>

              {/* Drop zone */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: 48,
                  border: "2px dashed var(--gray-a6)",
                  borderRadius: 12,
                  textAlign: "center",
                  cursor: "pointer",
                  backgroundColor: "var(--gray-a2)",
                }}
              >
                {isLoading ? (
                  <Loader2
                    size={40}
                    style={{ color: "var(--gray-10)", margin: "0 auto", animation: "spin 1s linear infinite" }}
                  />
                ) : (
                  <Upload size={40} style={{ color: "var(--gray-10)", margin: "0 auto" }} />
                )}
                <p style={{ fontSize: 16, fontWeight: 500, color: "var(--gray-12)", marginTop: 16 }}>
                  Cliquez pour sélectionner un fichier CSV
                </p>
                <p style={{ fontSize: 14, color: "var(--gray-10)", marginTop: 8 }}>
                  ou glissez-déposez votre fichier ici
                </p>
              </div>

              {/* Instructions */}
              <div
                style={{
                  padding: 16,
                  backgroundColor: "var(--blue-a2)",
                  borderRadius: 8,
                  border: "1px solid var(--blue-a6)",
                }}
              >
                <h4 style={{ fontSize: 14, fontWeight: 600, color: "var(--blue-11)", margin: "0 0 8px" }}>
                  Format attendu
                </h4>
                <ul style={{ fontSize: 13, color: "var(--blue-11)", margin: 0, paddingLeft: 20 }}>
                  <li>Fichier CSV avec séparateur point-virgule (;)</li>
                  <li>Colonnes obligatoires : nom, prixVente, categorie</li>
                  <li>Taux TVA : 0, 10 ou 18</li>
                  <li>Valeurs booléennes : Oui/Non</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step: Preview */}
          {step === "preview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Stats */}
              <div style={{ display: "flex", gap: 16 }}>
                <div
                  style={{
                    flex: 1,
                    padding: 16,
                    backgroundColor: "var(--green-a2)",
                    borderRadius: 8,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 28, fontWeight: 700, color: "var(--green-11)" }}>
                    {validData.length}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--green-11)" }}>Produits valides</div>
                </div>
                <div
                  style={{
                    flex: 1,
                    padding: 16,
                    backgroundColor: errors.length > 0 ? "var(--red-a2)" : "var(--gray-a2)",
                    borderRadius: 8,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: errors.length > 0 ? "var(--red-11)" : "var(--gray-11)",
                    }}
                  >
                    {errors.length}
                  </div>
                  <div style={{ fontSize: 13, color: errors.length > 0 ? "var(--red-11)" : "var(--gray-11)" }}>
                    Erreurs
                  </div>
                </div>
              </div>

              {/* Errors */}
              {errors.length > 0 && (
                <div style={{ maxHeight: 200, overflow: "auto" }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: "var(--red-11)", marginBottom: 12 }}>
                    Erreurs à corriger
                  </h4>
                  {errors.map((err, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: 12,
                        backgroundColor: "var(--red-a2)",
                        borderRadius: 6,
                        marginBottom: 8,
                        fontSize: 13,
                      }}
                    >
                      <strong style={{ color: "var(--red-11)" }}>Ligne {err.line}:</strong>
                      <ul style={{ margin: "4px 0 0", paddingLeft: 20, color: "var(--red-11)" }}>
                        {err.errors.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Preview table */}
              {validData.length > 0 && (
                <div style={{ maxHeight: 300, overflow: "auto" }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: "var(--gray-12)", marginBottom: 12 }}>
                    Aperçu des produits à importer
                  </h4>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ backgroundColor: "var(--gray-a2)" }}>
                        <th style={{ padding: 8, textAlign: "left", borderBottom: "1px solid var(--gray-a6)" }}>
                          Nom
                        </th>
                        <th style={{ padding: 8, textAlign: "left", borderBottom: "1px solid var(--gray-a6)" }}>
                          Catégorie
                        </th>
                        <th style={{ padding: 8, textAlign: "right", borderBottom: "1px solid var(--gray-a6)" }}>
                          Prix
                        </th>
                        <th style={{ padding: 8, textAlign: "center", borderBottom: "1px solid var(--gray-a6)" }}>
                          TVA
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {validData.slice(0, 10).map((prod, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--gray-a4)" }}>{prod.nom}</td>
                          <td style={{ padding: 8, borderBottom: "1px solid var(--gray-a4)" }}>
                            {prod.categorie}
                          </td>
                          <td
                            style={{
                              padding: 8,
                              textAlign: "right",
                              borderBottom: "1px solid var(--gray-a4)",
                              fontFamily: "monospace",
                            }}
                          >
                            {prod.prixVente.toLocaleString()} FCFA
                          </td>
                          <td
                            style={{ padding: 8, textAlign: "center", borderBottom: "1px solid var(--gray-a4)" }}
                          >
                            {prod.tauxTva}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {validData.length > 10 && (
                    <p style={{ fontSize: 12, color: "var(--gray-10)", marginTop: 8 }}>
                      ... et {validData.length - 10} autres produits
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step: Importing */}
          {step === "importing" && (
            <div style={{ textAlign: "center", padding: 48 }}>
              <Loader2
                size={48}
                style={{ color: "var(--accent-9)", margin: "0 auto", animation: "spin 1s linear infinite" }}
              />
              <p style={{ fontSize: 16, fontWeight: 500, color: "var(--gray-12)", marginTop: 24 }}>
                Import en cours...
              </p>
              <p style={{ fontSize: 14, color: "var(--gray-10)", marginTop: 8 }}>
                {validData.length} produits à traiter
              </p>
            </div>
          )}

          {/* Step: Result */}
          {step === "result" && importResult ? <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ textAlign: "center", padding: 24 }}>
                <CheckCircle size={48} style={{ color: "var(--green-9)", margin: "0 auto" }} />
                <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--gray-12)", marginTop: 16 }}>
                  Import terminé
                </h3>
              </div>

              <div style={{ display: "flex", gap: 16 }}>
                <div
                  style={{
                    flex: 1,
                    padding: 16,
                    backgroundColor: "var(--green-a2)",
                    borderRadius: 8,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 28, fontWeight: 700, color: "var(--green-11)" }}>
                    {importResult.created}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--green-11)" }}>Créés</div>
                </div>
                <div
                  style={{
                    flex: 1,
                    padding: 16,
                    backgroundColor: "var(--blue-a2)",
                    borderRadius: 8,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 28, fontWeight: 700, color: "var(--blue-11)" }}>
                    {importResult.updated}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--blue-11)" }}>Mis à jour</div>
                </div>
                {importResult.errors.length > 0 && (
                  <div
                    style={{
                      flex: 1,
                      padding: 16,
                      backgroundColor: "var(--red-a2)",
                      borderRadius: 8,
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 28, fontWeight: 700, color: "var(--red-11)" }}>
                      {importResult.errors.length}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--red-11)" }}>Erreurs</div>
                  </div>
                )}
              </div>

              {importResult.errors.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: "var(--red-11)", marginBottom: 8 }}>
                    Erreurs d'import
                  </h4>
                  {importResult.errors.map((err, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: 8,
                        backgroundColor: "var(--red-a2)",
                        borderRadius: 4,
                        marginBottom: 4,
                        fontSize: 13,
                        color: "var(--red-11)",
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
          {step === "upload" && (
            <button
              onClick={onClose}
              style={{
                ...buttonStyle,
                backgroundColor: "var(--gray-a3)",
                color: "var(--gray-12)",
                border: "1px solid var(--gray-a6)",
              }}
            >
              Fermer
            </button>
          )}

          {step === "preview" && (
            <>
              <button
                onClick={() => {
                  setStep("upload");
                  setValidData([]);
                  setErrors([]);
                }}
                style={{
                  ...buttonStyle,
                  backgroundColor: "var(--gray-a3)",
                  color: "var(--gray-12)",
                  border: "1px solid var(--gray-a6)",
                }}
              >
                Retour
              </button>
              <button
                onClick={handleImport}
                disabled={validData.length === 0}
                style={{
                  ...buttonStyle,
                  backgroundColor: validData.length > 0 ? "var(--accent-9)" : "var(--gray-a6)",
                  color: "white",
                  opacity: validData.length > 0 ? 1 : 0.5,
                }}
              >
                <Upload size={16} />
                Importer {validData.length} produit{validData.length > 1 ? "s" : ""}
              </button>
            </>
          )}

          {step === "result" && (
            <button
              onClick={onClose}
              style={{
                ...buttonStyle,
                backgroundColor: "var(--accent-9)",
                color: "white",
              }}
            >
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
