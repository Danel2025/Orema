"use client";

/**
 * ProductForm - Formulaire de création/édition de produit
 * Utilise Radix UI Dialog pour l'accessibilité (focus trap, Escape, ARIA)
 */

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, SpinnerGap, Barcode, Scan } from "@phosphor-icons/react";
import { Dialog, Flex, Text, Button, IconButton, Box, Tooltip } from "@radix-ui/themes";
import { useBarcodeScan } from "@/lib/hooks/use-barcode-scan";
import { toast } from "sonner";
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
    setValue,
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

  // Détection automatique des scans code-barres (scanner USB)
  useBarcodeScan({
    onScan: (barcode) => {
      setValue("codeBarre", barcode, { shouldValidate: true });
      toast.success(`Code-barres détecté : ${barcode}`);
    },
  });

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
    minHeight: 44,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 14,
    fontWeight: 500,
    color: "var(--gray-12)",
    marginBottom: 6,
  };

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <Dialog.Content maxWidth="600px" style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <Dialog.Title>{isEditing ? "Modifier le produit" : "Nouveau produit"}</Dialog.Title>

        {/* Form */}
        <form
          onSubmit={handleFormSubmit}
          style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
        >
          <Box
            style={{
              padding: "16px 0",
              display: "flex",
              flexDirection: "column",
              gap: 20,
              overflowY: "auto",
              flex: 1,
            }}
          >
            {/* Section: Image du produit */}
            <Box>
              <Text size="2" weight="bold" color="gray" mb="3" style={{ display: "block", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Image du produit
              </Text>
              <Controller
                name="image"
                control={control}
                render={({ field }) => (
                  <ImageUpload value={field.value} onChange={field.onChange} disabled={isLoading} />
                )}
              />
            </Box>

            {/* Section: Informations générales */}
            <Box>
              <Text size="2" weight="bold" color="gray" mb="3" style={{ display: "block", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Informations générales
              </Text>

              <Flex direction="column" gap="3">
                {/* Nom */}
                <Box>
                  <label htmlFor="produit-nom" style={labelStyle}>Nom du produit *</label>
                  <input
                    {...register("nom")}
                    id="produit-nom"
                    type="text"
                    placeholder="Ex: Poulet DG, Coca-Cola 33cl..."
                    style={{
                      ...inputStyle,
                      borderColor: errors.nom ? "var(--red-9)" : "var(--gray-a6)",
                    }}
                  />
                  {errors.nom ? <p role="alert" style={{ fontSize: 13, color: "var(--red-11)", marginTop: 4 }}>
                      {errors.nom.message}
                    </p> : null}
                </Box>

                {/* Description */}
                <Box>
                  <label htmlFor="produit-description" style={labelStyle}>Description</label>
                  <textarea
                    {...register("description")}
                    id="produit-description"
                    placeholder="Description du produit..."
                    rows={2}
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                    }}
                  />
                </Box>

                {/* Code-barres */}
                <Box>
                  <label htmlFor="produit-codeBarre" style={labelStyle}>
                    <Flex align="center" gap="1" asChild>
                      <span>
                        <Barcode size={16} aria-hidden="true" />
                        Code-barres
                      </span>
                    </Flex>
                  </label>
                  <Flex align="center" gap="2">
                    <input
                      {...register("codeBarre")}
                      id="produit-codeBarre"
                      type="text"
                      placeholder="Scanner ou saisir le code-barres..."
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <Tooltip content="Scannez un code-barres avec votre lecteur USB">
                      <Box
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          backgroundColor: "var(--accent-a3)",
                          color: "var(--accent-11)",
                          flexShrink: 0,
                        }}
                      >
                        <Scan size={20} aria-hidden="true" />
                      </Box>
                    </Tooltip>
                  </Flex>
                  <Text size="1" color="gray" mt="1" style={{ display: "block" }}>
                    Utilisez votre lecteur USB pour scanner automatiquement
                  </Text>
                </Box>

                {/* Catégorie */}
                <Box>
                  <label htmlFor="produit-categorieId" style={labelStyle}>Catégorie *</label>
                  <select
                    {...register("categorieId")}
                    id="produit-categorieId"
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
                  {errors.categorieId ? <p role="alert" style={{ fontSize: 13, color: "var(--red-11)", marginTop: 4 }}>
                      {errors.categorieId.message}
                    </p> : null}
                </Box>
              </Flex>
            </Box>

            {/* Section: Prix */}
            <Box>
              <Text size="2" weight="bold" color="gray" mb="3" style={{ display: "block", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Prix et TVA
              </Text>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                {/* Prix de vente */}
                <Box>
                  <label htmlFor="produit-prixVente" style={labelStyle}>Prix de vente (FCFA) *</label>
                  <input
                    {...register("prixVente", { valueAsNumber: true })}
                    id="produit-prixVente"
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
                  {errors.prixVente ? <p role="alert" style={{ fontSize: 13, color: "var(--red-11)", marginTop: 4 }}>
                      {errors.prixVente.message}
                    </p> : null}
                </Box>

                {/* Prix d'achat */}
                <Box>
                  <label htmlFor="produit-prixAchat" style={labelStyle}>Prix d&apos;achat (FCFA)</label>
                  <input
                    {...register("prixAchat", { valueAsNumber: true })}
                    id="produit-prixAchat"
                    type="number"
                    min={0}
                    step={100}
                    placeholder="Optionnel"
                    style={{
                      ...inputStyle,
                      fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                    }}
                  />
                </Box>

                {/* Taux TVA */}
                <Box>
                  <label htmlFor="produit-tauxTva" style={labelStyle}>Taux TVA *</label>
                  <select
                    {...register("tauxTva", { valueAsNumber: true })}
                    id="produit-tauxTva"
                    style={{
                      ...inputStyle,
                      cursor: "pointer",
                    }}
                  >
                    <option value={18}>18% (Standard)</option>
                    <option value={10}>10% (Réduit)</option>
                    <option value={0}>0% (Exonéré)</option>
                  </select>
                </Box>
              </div>
            </Box>

            {/* Section: Stock */}
            <Box>
              <Text size="2" weight="bold" color="gray" mb="3" style={{ display: "block", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Gestion du stock
              </Text>

              {/* Toggle gérer stock */}
              <Flex align="center" gap="3" mb="3">
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
              </Flex>

              {/* Champs stock (si activé) */}
              {gererStock ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 16 }}>
                  <Box>
                    <label htmlFor="produit-stockActuel" style={labelStyle}>Stock actuel</label>
                    <input
                      {...register("stockActuel", { valueAsNumber: true })}
                      id="produit-stockActuel"
                      type="number"
                      min={0}
                      placeholder="0"
                      style={inputStyle}
                    />
                  </Box>
                  <Box>
                    <label htmlFor="produit-stockMin" style={labelStyle}>Stock minimum</label>
                    <input
                      {...register("stockMin", { valueAsNumber: true })}
                      id="produit-stockMin"
                      type="number"
                      min={0}
                      placeholder="0"
                      style={inputStyle}
                    />
                  </Box>
                  <Box>
                    <label htmlFor="produit-stockMax" style={labelStyle}>Stock maximum</label>
                    <input
                      {...register("stockMax", { valueAsNumber: true })}
                      id="produit-stockMax"
                      type="number"
                      min={0}
                      placeholder="0"
                      style={inputStyle}
                    />
                  </Box>
                  <Box>
                    <label htmlFor="produit-unite" style={labelStyle}>Unité</label>
                    <input
                      {...register("unite")}
                      id="produit-unite"
                      type="text"
                      placeholder="pcs, kg, L..."
                      style={inputStyle}
                    />
                  </Box>
                </div> : null}
            </Box>

            {/* Section: Disponibilité */}
            <Box>
              <Text size="2" weight="bold" color="gray" mb="3" style={{ display: "block", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Disponibilité par mode de vente
              </Text>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { name: "disponibleDirect", label: "Vente directe" },
                  { name: "disponibleTable", label: "Service à table" },
                  { name: "disponibleLivraison", label: "Livraison" },
                  { name: "disponibleEmporter", label: "À emporter" },
                ].map((mode) => (
                  <Flex key={mode.name} align="center" gap="2">
                    <input
                      {...register(mode.name as keyof ProduitFormData)}
                      type="checkbox"
                      id={`produit-${mode.name}`}
                      style={{
                        width: 18,
                        height: 18,
                        accentColor: "var(--accent-9)",
                        cursor: "pointer",
                      }}
                    />
                    <label
                      htmlFor={`produit-${mode.name}`}
                      style={{
                        fontSize: 14,
                        color: "var(--gray-12)",
                        cursor: "pointer",
                      }}
                    >
                      {mode.label}
                    </label>
                  </Flex>
                ))}
              </div>
            </Box>

            {/* Actif */}
            <Flex
              align="center"
              gap="3"
              p="3"
              style={{
                backgroundColor: "var(--gray-a2)",
                borderRadius: 8,
              }}
            >
              <input
                {...register("actif")}
                type="checkbox"
                id="produit-actif"
                style={{
                  width: 20,
                  height: 20,
                  accentColor: "var(--accent-9)",
                  cursor: "pointer",
                }}
              />
              <label
                htmlFor="produit-actif"
                style={{
                  fontSize: 14,
                  color: "var(--gray-12)",
                  cursor: "pointer",
                }}
              >
                Produit actif (visible dans la caisse)
              </label>
            </Flex>
          </Box>

          {/* Footer */}
          <Flex gap="3" justify="end" pt="4" style={{ borderTop: "1px solid var(--gray-a6)" }}>
            <Dialog.Close>
              <Button type="button" variant="soft" color="gray" disabled={isLoading} size="2" style={{ minHeight: 44 }}>
                Annuler
              </Button>
            </Dialog.Close>
            <Button type="submit" disabled={isLoading} size="2" style={{ minHeight: 44 }}>
              {isLoading ? <SpinnerGap size={16} className="animate-spin" aria-hidden="true" /> : null}
              {isEditing ? "Enregistrer" : "Créer le produit"}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
