"use client";

/**
 * Page Produits - Gestion des catégories et produits
 * Utilise Radix UI Tabs pour l'accessibilité (role="tablist", focus clavier, aria-selected)
 */

import { Box, Flex, Heading, Text, Tabs } from "@radix-ui/themes";
import { Package, FolderOpen } from "@phosphor-icons/react";
import { CategoryList } from "@/components/categories";
import { ProductList } from "@/components/produits";
import { SeedDataPanel } from "@/components/produits/SeedDataPanel";

export default function ProduitsPage() {
  return (
    <Box>
      {/* En-tête */}
      <Box mb="5">
        <Heading as="h1" size="8" weight="bold">
          Produits
        </Heading>
        <Text as="p" size="3" color="gray" mt="2">
          Gérez vos produits et catégories
        </Text>
      </Box>

      {/* Panneau de données modèles (visible uniquement pour les admins) */}
      <SeedDataPanel />

      {/* Onglets avec accessibilité complète (role="tablist", aria-selected, navigation clavier) */}
      <Tabs.Root defaultValue="produits">
        <Tabs.List size="2">
          <Tabs.Trigger value="produits" style={{ minHeight: 44 }}>
            <Flex align="center" gap="2">
              <Package size={18} aria-hidden="true" />
              Produits
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="categories" style={{ minHeight: 44 }}>
            <Flex align="center" gap="2">
              <FolderOpen size={18} aria-hidden="true" />
              Catégories
            </Flex>
          </Tabs.Trigger>
        </Tabs.List>

        <Box pt="5">
          <Tabs.Content value="produits">
            <ProductList />
          </Tabs.Content>

          <Tabs.Content value="categories">
            <CategoryList />
          </Tabs.Content>
        </Box>
      </Tabs.Root>
    </Box>
  );
}
