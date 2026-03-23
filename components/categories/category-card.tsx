"use client";

/**
 * CategoryCard - Carte affichant une catégorie avec menu contextuel accessible
 * Utilise Radix UI DropdownMenu pour l'accessibilité clavier et ARIA
 */

import {
  DotsThreeVertical,
  PencilSimple,
  Trash,
  Power,
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
  Printer,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { Box, Flex, Text, DropdownMenu, IconButton } from "@radix-ui/themes";

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

interface CategoryCardProps {
  id: string;
  nom: string;
  couleur: string;
  icone?: string | null;
  ordre: number;
  actif: boolean;
  imprimante?: {
    id: string;
    nom: string;
    type: string;
  } | null;
  _count: {
    produits: number;
  };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActif: (id: string) => void;
  isDragging?: boolean;
}

export function CategoryCard({
  id,
  nom,
  couleur,
  icone,
  actif,
  imprimante,
  _count,
  onEdit,
  onDelete,
  onToggleActif,
  isDragging,
}: CategoryCardProps) {
  // Récupérer l'icône dynamiquement
  const IconComponent = icone && iconMap[icone] ? iconMap[icone] : Package;

  return (
    <Box
      style={{
        backgroundColor: "var(--color-panel-solid)",
        borderRadius: 12,
        border: "1px solid var(--gray-a6)",
        padding: 16,
        opacity: actif ? 1 : 0.6,
        transition: "all 0.15s ease",
        transform: isDragging ? "scale(1.02)" : "scale(1)",
        boxShadow: isDragging ? "0 8px 24px rgba(0,0,0,0.15)" : "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {/* Header avec icône et menu */}
      <Flex justify="between" align="start" mb="3">
        {/* Icône colorée */}
        <Box
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: couleur + "20",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconComponent size={24} style={{ color: couleur }} aria-hidden="true" />
        </Box>

        {/* Menu d'actions accessible avec DropdownMenu Radix UI */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <IconButton
              variant="ghost"
              color="gray"
              size="2"
              aria-label={`Options pour ${nom}`}
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <DotsThreeVertical size={18} aria-hidden="true" />
            </IconButton>
          </DropdownMenu.Trigger>

          <DropdownMenu.Content size="1">
            <DropdownMenu.Item onSelect={() => onEdit(id)}>
              <PencilSimple size={16} aria-hidden="true" />
              Modifier
            </DropdownMenu.Item>

            <DropdownMenu.Item onSelect={() => onToggleActif(id)}>
              <Power size={16} aria-hidden="true" />
              {actif ? "Désactiver" : "Activer"}
            </DropdownMenu.Item>

            <DropdownMenu.Separator />

            <DropdownMenu.Item color="red" onSelect={() => onDelete(id)}>
              <Trash size={16} aria-hidden="true" />
              Supprimer
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Flex>

      {/* Nom et statut */}
      <Box mb="2">
        <Flex align="center" gap="2">
          <Text size="3" weight="bold">
            {nom}
          </Text>
          {!actif && (
            <Text
              size="1"
              weight="medium"
              style={{
                padding: "2px 6px",
                borderRadius: 4,
                backgroundColor: "var(--gray-a3)",
                color: "var(--gray-11)",
              }}
            >
              Inactif
            </Text>
          )}
        </Flex>
      </Box>

      {/* Infos */}
      <Flex align="center" gap="4">
        <Text size="2" color="gray">
          {_count.produits} produit{_count.produits > 1 ? "s" : ""}
        </Text>
        {imprimante ? <Flex align="center" gap="1">
            <Printer size={14} style={{ color: "var(--gray-11)" }} aria-hidden="true" />
            <Text size="2" color="gray">{imprimante.nom}</Text>
          </Flex> : null}
      </Flex>

      {/* Indicateur de couleur */}
      <Box
        mt="3"
        style={{
          height: 4,
          borderRadius: 2,
          backgroundColor: couleur,
        }}
      />
    </Box>
  );
}
