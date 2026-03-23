"use client";

/**
 * ProductCard - Carte affichant un produit avec menu contextuel accessible
 * Utilise Radix UI DropdownMenu pour l'accessibilité clavier et ARIA
 */

import { Box, Flex, Text, DropdownMenu, IconButton } from "@radix-ui/themes";
import {
  DotsThreeVertical,
  PencilSimple,
  Trash,
  Power,
  Package,
  Warning,
  ListPlus,
} from "@phosphor-icons/react";
import { formatCurrency } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  nom: string;
  description?: string | null;
  prixVente: number | { toNumber(): number };
  tauxTva: string;
  actif: boolean;
  gererStock: boolean;
  stockActuel?: number | null;
  stockMin?: number | null;
  image?: string | null;
  categorie: {
    id: string;
    nom: string;
    couleur: string;
    icone?: string | null;
  };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActif: (id: string) => void;
  onManageSupplements?: (id: string, nom: string) => void;
}

export function ProductCard({
  id,
  nom,
  description,
  prixVente,
  tauxTva,
  actif,
  gererStock,
  stockActuel,
  stockMin,
  image,
  categorie,
  onEdit,
  onDelete,
  onToggleActif,
  onManageSupplements,
}: ProductCardProps) {
  // Convertir le prix en nombre
  const prix = typeof prixVente === "number" ? prixVente : Number(prixVente);

  // Vérifier si le stock est bas
  const stockBas = gererStock && stockActuel != null && stockMin != null && stockActuel <= stockMin;

  // Mapping TVA pour affichage
  const tvaLabel = tauxTva === "STANDARD" ? "18%" : tauxTva === "REDUIT" ? "10%" : "0%";

  return (
    <Box
      style={{
        backgroundColor: "var(--color-panel-solid)",
        borderRadius: 12,
        border: "1px solid var(--gray-a6)",
        overflow: "hidden",
        opacity: actif ? 1 : 0.6,
        transition: "all 0.15s ease",
      }}
    >
      {/* Image ou placeholder */}
      <div
        style={{
          height: 120,
          backgroundColor: categorie.couleur + "15",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {image ? (
          <img
            src={image}
            alt={nom}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <Package size={40} style={{ color: categorie.couleur, opacity: 0.5 }} aria-hidden="true" />
        )}

        {/* Badge catégorie */}
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            padding: "4px 8px",
            borderRadius: 6,
            backgroundColor: categorie.couleur,
            color: "white",
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {categorie.nom}
        </div>

        {/* Badge stock bas */}
        {stockBas ? <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              padding: "4px 8px",
              borderRadius: 6,
              backgroundColor: "var(--red-9)",
              color: "white",
              fontSize: 11,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Warning size={12} aria-hidden="true" />
            Stock bas
          </div> : null}

        {/* Badge inactif */}
        {!actif && (
          <div
            style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              padding: "4px 8px",
              borderRadius: 6,
              backgroundColor: "var(--gray-a9)",
              color: "white",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Inactif
          </div>
        )}
      </div>

      {/* Contenu */}
      <Box p="3">
        {/* Header avec nom et menu */}
        <Flex justify="between" align="start" mb="2">
          <Text
            as="p"
            size="2"
            weight="bold"
            style={{
              margin: 0,
              flex: 1,
              lineHeight: 1.3,
            }}
          >
            {nom}
          </Text>

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
                <PencilSimple size={14} aria-hidden="true" />
                Modifier
              </DropdownMenu.Item>

              {onManageSupplements ? <DropdownMenu.Item onSelect={() => onManageSupplements(id, nom)}>
                  <ListPlus size={14} aria-hidden="true" />
                  Suppléments
                </DropdownMenu.Item> : null}

              <DropdownMenu.Item
                onSelect={() => onToggleActif(id)}
              >
                <Power size={14} aria-hidden="true" />
                {actif ? "Désactiver" : "Activer"}
              </DropdownMenu.Item>

              <DropdownMenu.Separator />

              <DropdownMenu.Item color="red" onSelect={() => onDelete(id)}>
                <Trash size={14} aria-hidden="true" />
                Supprimer
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </Flex>

        {/* Description */}
        {description ? <Text
            as="p"
            size="1"
            color="gray"
            style={{
              margin: "0 0 8px 0",
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {description}
          </Text> : null}

        {/* Prix et infos */}
        <Flex justify="between" align="end">
          <Box>
            <Text
              as="p"
              size="4"
              weight="bold"
              style={{
                margin: 0,
                color: "var(--accent-11)",
                fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
              }}
            >
              {formatCurrency(prix)}
            </Text>
            <Text as="p" size="1" color="gray" style={{ margin: 0 }}>
              TVA {tvaLabel}
            </Text>
          </Box>

          {/* Stock */}
          {gererStock ? <Box style={{ textAlign: "right" }}>
              <Text
                as="p"
                size="2"
                weight="bold"
                style={{
                  margin: 0,
                  color: stockBas ? "var(--red-11)" : "var(--gray-12)",
                  fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                }}
              >
                {stockActuel ?? 0}
              </Text>
              <Text as="p" size="1" color="gray" style={{ margin: 0 }}>
                en stock
              </Text>
            </Box> : null}
        </Flex>
      </Box>
    </Box>
  );
}
