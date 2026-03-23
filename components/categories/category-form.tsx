"use client";

/**
 * CategoryForm - Formulaire de création/édition de catégorie
 * Utilise Radix UI Dialog pour l'accessibilité (focus trap, Escape, ARIA)
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  SpinnerGap,
  Package,
  Coffee,
  ForkKnife,
  Leaf,
  IceCream,
  BeerBottle,
  Wine,
  Hamburger,
  Pizza,
  BowlFood,
  Cow,
  Fish,
  Egg,
  Cookie,
  AppleLogo,
  ShoppingBag,
  Monitor,
  CookingPot,
  X,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { Dialog, Flex, Text, Button, Box, Select } from "@radix-ui/themes";
import {
  categorieSchema,
  categorieColors,
  categorieIcons,
  destinationOptions,
  type CategorieFormData,
  type DestinationPreparation,
} from "@/schemas/categorie.schema";

// Map des icônes disponibles (Phosphor)
const iconMap: Record<string, PhosphorIcon> = {
  Coffee,
  UtensilsCrossed: ForkKnife,
  Salad: Leaf,
  IceCreamCone: IceCream,
  Beer: BeerBottle,
  Wine,
  Sandwich: Hamburger,
  Pizza,
  Soup: BowlFood,
  Beef: Cow,
  Fish,
  Egg,
  Croissant: Cookie,
  Apple: AppleLogo,
  ShoppingBag,
  Package,
};

// Map des icônes pour les destinations de préparation
const destinationIconMap: Record<string, PhosphorIcon> = {
  AUTO: Monitor,
  CUISINE: CookingPot,
  BAR: BeerBottle,
  AUCUNE: X,
};

interface Imprimante {
  id: string;
  nom: string;
  type: string;
}

interface CategoryFormProps {
  initialData?: {
    id: string;
    nom: string;
    couleur: string;
    icone?: string | null;
    ordre: number;
    actif: boolean;
    imprimanteId?: string | null;
    destinationPreparation?: DestinationPreparation | null;
  };
  imprimantes: Imprimante[];
  onSubmit: (data: CategorieFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CategoryForm({
  initialData,
  imprimantes,
  onSubmit,
  onCancel,
  isLoading,
}: CategoryFormProps) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categorieSchema),
    defaultValues: {
      nom: initialData?.nom || "",
      couleur: initialData?.couleur || "#f97316",
      icone: initialData?.icone || null,
      ordre: initialData?.ordre || 0,
      actif: initialData?.actif ?? true,
      imprimanteId: initialData?.imprimanteId || null,
      destinationPreparation: initialData?.destinationPreparation || "AUTO",
    },
  });

  const selectedColor = watch("couleur");
  const selectedIcon = watch("icone");
  const selectedDestination = watch("destinationPreparation") as DestinationPreparation;

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data as CategorieFormData);
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
    marginBottom: 8,
  };

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <Dialog.Content maxWidth="500px" style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <Dialog.Title>
          {isEditing ? "Modifier la catégorie" : "Nouvelle catégorie"}
        </Dialog.Title>

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
            {/* Nom */}
            <Box>
              <label htmlFor="categorie-nom" style={labelStyle}>Nom *</label>
              <input
                {...register("nom")}
                id="categorie-nom"
                type="text"
                placeholder="Ex: Boissons, Plats, Desserts..."
                style={{
                  ...inputStyle,
                  borderColor: errors.nom ? "var(--red-9)" : "var(--gray-a6)",
                }}
              />
              {errors.nom ? <p role="alert" style={{ fontSize: 13, color: "var(--red-11)", marginTop: 4 }}>
                  {errors.nom.message}
                </p> : null}
            </Box>

            {/* Couleur */}
            <Box>
              <Text size="2" weight="medium" style={{ display: "block", marginBottom: 8 }}>
                Couleur
              </Text>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: 8,
                }}
              >
                {categorieColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setValue("couleur", color.value)}
                    aria-label={`Couleur ${color.label}${selectedColor === color.value ? " (sélectionnée)" : ""}`}
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      borderRadius: 8,
                      backgroundColor: color.value,
                      border:
                        selectedColor === color.value
                          ? "3px solid var(--gray-12)"
                          : "3px solid transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "transform 0.1s ease",
                      minWidth: 44,
                      minHeight: 44,
                    }}
                    title={color.label}
                  >
                    {selectedColor === color.value && (
                      <Check size={20} style={{ color: "white" }} aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>
            </Box>

            {/* Icône */}
            <Box>
              <Text size="2" weight="medium" style={{ display: "block", marginBottom: 8 }}>
                Icône
              </Text>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 8,
                  maxHeight: 200,
                  overflowY: "auto",
                  padding: 4,
                }}
              >
                {categorieIcons.map((icon) => {
                  const IconComponent = iconMap[icon.value];
                  const isSelected = selectedIcon === icon.value;

                  return (
                    <button
                      key={icon.value}
                      type="button"
                      onClick={() => setValue("icone", isSelected ? null : icon.value)}
                      aria-label={`Icône ${icon.label}${isSelected ? " (sélectionnée)" : ""}`}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                        padding: 12,
                        borderRadius: 8,
                        border: isSelected
                          ? `2px solid ${selectedColor}`
                          : "1px solid var(--gray-a6)",
                        backgroundColor: isSelected ? selectedColor + "15" : "transparent",
                        cursor: "pointer",
                        minHeight: 44,
                      }}
                      title={icon.label}
                    >
                      {IconComponent ? (
                        <IconComponent
                          size={24}
                          style={{ color: isSelected ? selectedColor : "var(--gray-11)" }}
                          aria-hidden="true"
                        />
                      ) : null}
                      <span
                        style={{
                          fontSize: 10,
                          color: "var(--gray-11)",
                          textAlign: "center",
                          lineHeight: 1.2,
                        }}
                      >
                        {icon.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Box>

            {/* Imprimante */}
            <Box>
              <label htmlFor="categorie-imprimanteId" style={labelStyle}>
                Imprimante associée
              </label>
              <select
                {...register("imprimanteId")}
                id="categorie-imprimanteId"
                style={{
                  ...inputStyle,
                  cursor: "pointer",
                }}
              >
                <option value="">Aucune (ticket caisse par défaut)</option>
                {imprimantes.map((imp) => (
                  <option key={imp.id} value={imp.id}>
                    {imp.nom} ({imp.type})
                  </option>
                ))}
              </select>
              <Text size="1" color="gray" mt="1" style={{ display: "block" }}>
                Les commandes de cette catégorie seront envoyées à cette imprimante
              </Text>
            </Box>

            {/* Destination de préparation */}
            <Box>
              <Text size="2" weight="medium" style={{ display: "block", marginBottom: 8 }}>
                Destination de préparation
              </Text>
              <Select.Root
                value={selectedDestination || "AUTO"}
                onValueChange={(value) =>
                  setValue("destinationPreparation", value as DestinationPreparation)
                }
              >
                <Select.Trigger
                  variant="surface"
                  style={{ width: "100%", minHeight: 44 }}
                >
                  <Flex as="span" align="center" gap="2">
                    {(() => {
                      const DestIcon = destinationIconMap[selectedDestination || "AUTO"];
                      return DestIcon ? <DestIcon size={16} aria-hidden="true" /> : null;
                    })()}
                    {destinationOptions.find((o) => o.value === (selectedDestination || "AUTO"))?.label}
                  </Flex>
                </Select.Trigger>
                <Select.Content position="popper">
                  {destinationOptions.map((option) => {
                    const OptionIcon = destinationIconMap[option.value];
                    return (
                      <Select.Item key={option.value} value={option.value}>
                        <Flex align="center" gap="2">
                          {OptionIcon ? <OptionIcon size={16} aria-hidden="true" /> : null}
                          {option.label}
                        </Flex>
                      </Select.Item>
                    );
                  })}
                </Select.Content>
              </Select.Root>
              <Text size="1" color="gray" mt="1" style={{ display: "block" }}>
                {destinationOptions.find((o) => o.value === (selectedDestination || "AUTO"))?.description}
              </Text>
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
                id="categorie-actif"
                style={{
                  width: 20,
                  height: 20,
                  accentColor: "var(--accent-9)",
                  cursor: "pointer",
                }}
              />
              <label
                htmlFor="categorie-actif"
                style={{
                  fontSize: 14,
                  color: "var(--gray-12)",
                  cursor: "pointer",
                }}
              >
                Catégorie active (visible dans la caisse)
              </label>
            </Flex>
          </Box>

          {/* Footer */}
          <Flex gap="3" justify="end" pt="4" style={{ borderTop: "1px solid var(--gray-a6)" }}>
            <Dialog.Close>
              <Button
                type="button"
                variant="soft"
                color="gray"
                disabled={isLoading}
                size="2"
                style={{ minHeight: 44 }}
              >
                Annuler
              </Button>
            </Dialog.Close>
            <Button type="submit" disabled={isLoading} size="2" style={{ minHeight: 44 }}>
              {isLoading ? <SpinnerGap size={16} className="animate-spin" aria-hidden="true" /> : null}
              {isEditing ? "Enregistrer" : "Créer la catégorie"}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
