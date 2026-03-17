"use client";

/**
 * SupplementsManager - Gestion des suppléments/options d'un produit
 */

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import {
  getSupplements,
  createSupplement,
  updateSupplement,
  deleteSupplement,
  type SupplementFormData,
} from "@/actions/supplements";
import { formatCurrency } from "@/lib/utils";

interface Supplement {
  id: string;
  nom: string;
  prix: number;
}

interface SupplementsManagerProps {
  produitId: string;
  produitNom: string;
  onClose: () => void;
}

export function SupplementsManager({ produitId, produitNom, onClose }: SupplementsManagerProps) {
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SupplementFormData>({ nom: "", prix: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Charger les suppléments
  useEffect(() => {
    loadSupplements();
  }, [produitId]);

  const loadSupplements = async () => {
    setIsLoading(true);
    const result = await getSupplements(produitId);
    if (result.success && result.data) {
      setSupplements(result.data);
    }
    setIsLoading(false);
  };

  const handleAdd = () => {
    setFormData({ nom: "", prix: 0 });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (supplement: Supplement) => {
    setFormData({ nom: supplement.nom, prix: supplement.prix });
    setEditingId(supplement.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ nom: "", prix: 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingId) {
        const result = await updateSupplement(editingId, formData);
        if (result.success) {
          toast.success("Supplément modifié");
          await loadSupplements();
          handleCancel();
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await createSupplement(produitId, formData);
        if (result.success) {
          toast.success("Supplément ajouté");
          await loadSupplements();
          handleCancel();
        } else {
          toast.error(result.error);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce supplément ?")) return;

    const result = await deleteSupplement(id);
    if (result.success) {
      toast.success("Supplément supprimé");
      setSupplements(supplements.filter((s) => s.id !== id));
    } else {
      toast.error(result.error);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    fontSize: 14,
    borderRadius: 8,
    border: "1px solid var(--gray-a6)",
    backgroundColor: "var(--gray-a2)",
    color: "var(--gray-12)",
    outline: "none",
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
          maxWidth: 500,
          maxHeight: "80vh",
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
              Suppléments / Options
            </h2>
            <p style={{ fontSize: 14, color: "var(--gray-11)", margin: "4px 0 0" }}>
              {produitNom}
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
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <Loader2 size={24} style={{ color: "var(--gray-10)", animation: "spin 1s linear infinite" }} />
            </div>
          ) : (
            <>
              {/* Formulaire d'ajout/édition */}
              {showForm ? <form
                  onSubmit={handleSubmit}
                  style={{
                    padding: 16,
                    backgroundColor: "var(--gray-a2)",
                    borderRadius: 12,
                    marginBottom: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 12 }}>
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      placeholder="Nom du supplément"
                      required
                      style={inputStyle}
                    />
                    <input
                      type="number"
                      value={formData.prix || ""}
                      onChange={(e) => setFormData({ ...formData, prix: Number(e.target.value) || 0 })}
                      placeholder="Prix"
                      min={0}
                      step={100}
                      required
                      style={{ ...inputStyle, fontFamily: "monospace" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        borderRadius: 8,
                        border: "1px solid var(--gray-a6)",
                        backgroundColor: "transparent",
                        color: "var(--gray-12)",
                        cursor: "pointer",
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        fontWeight: 500,
                        borderRadius: 8,
                        border: "none",
                        backgroundColor: "var(--accent-9)",
                        color: "white",
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        opacity: isSubmitting ? 0.7 : 1,
                      }}
                    >
                      {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      {editingId ? "Modifier" : "Ajouter"}
                    </button>
                  </div>
                </form> : null}

              {/* Liste des suppléments */}
              {supplements.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: 40,
                    color: "var(--gray-10)",
                  }}
                >
                  <p style={{ margin: 0 }}>Aucun supplément</p>
                  <p style={{ margin: "8px 0 0", fontSize: 14 }}>
                    Ajoutez des options comme tailles, garnitures, etc.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {supplements.map((supplement) => (
                    <div
                      key={supplement.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        backgroundColor: "var(--gray-a2)",
                        borderRadius: 10,
                        border: "1px solid var(--gray-a4)",
                      }}
                    >
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 500, color: "var(--gray-12)" }}>
                          {supplement.nom}
                        </span>
                        <span
                          style={{
                            marginLeft: 12,
                            fontSize: 14,
                            fontFamily: "monospace",
                            color: "var(--accent-11)",
                          }}
                        >
                          +{formatCurrency(supplement.prix)}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          onClick={() => handleEdit(supplement)}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            border: "none",
                            backgroundColor: "transparent",
                            color: "var(--gray-11)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(supplement.id)}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            border: "none",
                            backgroundColor: "transparent",
                            color: "var(--red-11)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!showForm && (
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid var(--gray-a6)",
            }}
          >
            <button
              onClick={handleAdd}
              style={{
                width: "100%",
                padding: "12px 20px",
                fontSize: 14,
                fontWeight: 500,
                borderRadius: 10,
                border: "1px dashed var(--gray-a6)",
                backgroundColor: "transparent",
                color: "var(--gray-11)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Plus size={18} />
              Ajouter un supplément
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
