"use client";

/**
 * ProductForm - Formulaire de création/édition de produit
 */

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2, Barcode } from "lucide-react";
import { produitSchema, type ProduitFormData } from "@/schemas/produit.schema";
import { ImageUpload } from "./image-upload";

interface Categorie {
  id: string;
  nom: string;
  couleur: string;
}

interface ProductFormProps {
  initialData?: {
    id: string;
    nom: string;
    description?: string | null;
    codeBarre?: string | null;
    image?: string | null;
    prixVente: number | { toNumber?(): number };
    prixAchat?: number | { toNumber?(): number } | null;
    tauxTva: string;
    categorieId: string;
    gererStock: boolean;
    stockActuel?: number | null;
    stockMin?: number | null;
    stockMax?: number | null;
    unite?: string | null;
    disponibleDirect: boolean;
    disponibleTable: boolean;
    disponibleLivraison: boolean;
    disponibleEmporter: boolean;
    actif: boolean;
  };
  categories: Categorie[];
  onSubmit: (data: ProduitFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// Helper pour convertir Decimal en number
function toNumber(value: number | { toNumber?(): number } | null | undefined): number | undefined {
  if (value == null) return undefined;
  if (typeof value === "number") return value;
  if (typeof value.toNumber === "function") return value.toNumber();
  return Number(value);
}

// Mapping TVA enum vers number
function getTvaNumber(taux: string): number {
  if (taux === "EXONERE") return 0;
  if (taux === "REDUIT") return 10;
  return 18;
}

export function ProductForm({
  initialData,
  categories,
  onSubmit,
  onCancel,
  isLoading,
}: ProductFormProps) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(produitSchema),
    defaultValues: {
      nom: initialData?.nom || "",
      description: initialData?.description || "",
      codeBarre: initialData?.codeBarre || "",
      image: initialData?.image || "",
      prixVente: toNumber(initialData?.prixVente) || 0,
      prixAchat: toNumber(initialData?.prixAchat),
      tauxTva: initialData ? getTvaNumber(initialData.tauxTva) : 18,
      categorieId: initialData?.categorieId || "",
      gererStock: initialData?.gererStock ?? false,
      stockActuel: initialData?.stockActuel || undefined,
      stockMin: initialData?.stockMin || undefined,
      stockMax: initialData?.stockMax || undefined,
      unite: initialData?.unite || "",
      disponibleDirect: initialData?.disponibleDirect ?? true,
      disponibleTable: initialData?.disponibleTable ?? true,
      disponibleLivraison: initialData?.disponibleLivraison ?? true,
      disponibleEmporter: initialData?.disponibleEmporter ?? true,
      actif: initialData?.actif ?? true,
    },
  });

  const gererStock = watch("gererStock");

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data as ProduitFormData);
  });

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

  const labelStyle = {
    display: "block",
    fontSize: 14,
    fontWeight: 500,
    color: "var(--gray-12)",
    marginBottom: 6,
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
      onClick={onCancel}
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
            flexShrink: 0,
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
            {isEditing ? "Modifier le produit" : "Nouveau produit"}
          </h2>
          <button
            onClick={onCancel}
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

        {/* Form */}
        <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20, overflowY: "auto", flex: 1 }}>
            {/* Section: Image du produit */}
            <div>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--gray-11)",
                  marginBottom: 16,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Image du produit
              </h3>
              <Controller
                name="image"
                control={control}
                render={({ field }) => (
                  <ImageUpload
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isLoading}
                  />
                )}
              />
            </div>

            {/* Section: Informations générales */}
            <div>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--gray-11)",
                  marginBottom: 16,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Informations générales
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Nom */}
                <div>
                  <label style={labelStyle}>Nom du produit *</label>
                  <input
                    {...register("nom")}
                    type="text"
                    placeholder="Ex: Poulet DG, Coca-Cola 33cl..."
                    style={{
                      ...inputStyle,
                      borderColor: errors.nom ? "var(--red-9)" : "var(--gray-a6)",
                    }}
                  />
                  {errors.nom ? <p style={{ fontSize: 13, color: "var(--red-11)", marginTop: 4 }}>
                      {errors.nom.message}
                    </p> : null}
                </div>

                {/* Description */}
                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea
                    {...register("description")}
                    placeholder="Description du produit..."
                    rows={2}
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                    }}
                  />
                </div>

                {/* Code-barres */}
                <div>
                  <label style={labelStyle}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Barcode size={16} />
                      Code-barres
                    </span>
                  </label>
                  <input
                    {...register("codeBarre")}
                    type="text"
                    placeholder="Ex: 6901234567890"
                    style={inputStyle}
                  />
                </div>

                {/* Catégorie */}
                <div>
                  <label style={labelStyle}>Catégorie *</label>
                  <select
                    {...register("categorieId")}
                    style={{
                      ...inputStyle,
                      cursor: "pointer",
                      borderColor: errors.categorieId ? "var(--red-9)" : "var(--gray-a6)",
                    }}
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nom}
                      </option>
                    ))}
                  </select>
                  {errors.categorieId ? <p style={{ fontSize: 13, color: "var(--red-11)", marginTop: 4 }}>
                      {errors.categorieId.message}
                    </p> : null}
                </div>
              </div>
            </div>

            {/* Section: Prix */}
            <div>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--gray-11)",
                  marginBottom: 16,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Prix et TVA
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                {/* Prix de vente */}
                <div>
                  <label style={labelStyle}>Prix de vente (FCFA) *</label>
                  <input
                    {...register("prixVente", { valueAsNumber: true })}
                    type="number"
                    min={0}
                    step={100}
                    placeholder="0"
                    style={{
                      ...inputStyle,
                      fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                      borderColor: errors.prixVente ? "var(--red-9)" : "var(--gray-a6)",
                    }}
                  />
                  {errors.prixVente ? <p style={{ fontSize: 13, color: "var(--red-11)", marginTop: 4 }}>
                      {errors.prixVente.message}
                    </p> : null}
                </div>

                {/* Prix d'achat */}
                <div>
                  <label style={labelStyle}>Prix d'achat (FCFA)</label>
                  <input
                    {...register("prixAchat")}
                    type="number"
                    min={0}
                    step={100}
                    placeholder="Optionnel"
                    style={{
                      ...inputStyle,
                      fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                    }}
                  />
                </div>

                {/* Taux TVA */}
                <div>
                  <label style={labelStyle}>Taux TVA *</label>
                  <select
                    {...register("tauxTva", { valueAsNumber: true })}
                    style={{
                      ...inputStyle,
                      cursor: "pointer",
                    }}
                  >
                    <option value={18}>18% (Standard)</option>
                    <option value={10}>10% (Réduit)</option>
                    <option value={0}>0% (Exonéré)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section: Stock */}
            <div>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--gray-11)",
                  marginBottom: 16,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Gestion du stock
              </h3>

              {/* Toggle gérer stock */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <input
                  {...register("gererStock")}
                  type="checkbox"
                  id="gererStock"
                  style={{
                    width: 20,
                    height: 20,
                    accentColor: "var(--accent-9)",
                    cursor: "pointer",
                  }}
                />
                <label
                  htmlFor="gererStock"
                  style={{
                    fontSize: 14,
                    color: "var(--gray-12)",
                    cursor: "pointer",
                  }}
                >
                  Gérer le stock de ce produit
                </label>
              </div>

              {/* Champs stock (si activé) */}
              {gererStock ? <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Stock actuel</label>
                    <input
                      {...register("stockActuel")}
                      type="number"
                      min={0}
                      placeholder="0"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Stock minimum</label>
                    <input
                      {...register("stockMin")}
                      type="number"
                      min={0}
                      placeholder="0"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Stock maximum</label>
                    <input
                      {...register("stockMax")}
                      type="number"
                      min={0}
                      placeholder="0"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Unité</label>
                    <input
                      {...register("unite")}
                      type="text"
                      placeholder="pcs, kg, L..."
                      style={inputStyle}
                    />
                  </div>
                </div> : null}
            </div>

            {/* Section: Disponibilité */}
            <div>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--gray-11)",
                  marginBottom: 16,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Disponibilité par mode de vente
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { name: "disponibleDirect", label: "Vente directe" },
                  { name: "disponibleTable", label: "Service à table" },
                  { name: "disponibleLivraison", label: "Livraison" },
                  { name: "disponibleEmporter", label: "À emporter" },
                ].map((mode) => (
                  <div
                    key={mode.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <input
                      {...register(mode.name as keyof ProduitFormData)}
                      type="checkbox"
                      id={mode.name}
                      style={{
                        width: 18,
                        height: 18,
                        accentColor: "var(--accent-9)",
                        cursor: "pointer",
                      }}
                    />
                    <label
                      htmlFor={mode.name}
                      style={{
                        fontSize: 14,
                        color: "var(--gray-12)",
                        cursor: "pointer",
                      }}
                    >
                      {mode.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Actif */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 16,
                backgroundColor: "var(--gray-a2)",
                borderRadius: 8,
              }}
            >
              <input
                {...register("actif")}
                type="checkbox"
                id="actif"
                style={{
                  width: 20,
                  height: 20,
                  accentColor: "var(--accent-9)",
                  cursor: "pointer",
                }}
              />
              <label
                htmlFor="actif"
                style={{
                  fontSize: 14,
                  color: "var(--gray-12)",
                  cursor: "pointer",
                }}
              >
                Produit actif (visible dans la caisse)
              </label>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              padding: "16px 24px",
              borderTop: "1px solid var(--gray-a6)",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
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
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 8,
                border: "none",
                backgroundColor: "var(--accent-9)",
                color: "white",
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
              {isEditing ? "Enregistrer" : "Créer le produit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
