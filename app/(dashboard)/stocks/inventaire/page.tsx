import { Box, Flex } from "@radix-ui/themes";
import { InventaireForm } from "@/components/stocks/inventaire-form";
import { InventaireHeader } from "@/components/stocks/inventaire-header";

export const metadata = {
  title: "Inventaire | Stocks | Orema N+",
  description: "Inventaire physique des stocks - Comptage et ajustement",
};

export default function InventairePage() {
  return (
    <Box p="4">
      <Flex direction="column" gap="4">
        {/* En-tete */}
        <InventaireHeader />

        {/* Formulaire d'inventaire */}
        <InventaireForm />
      </Flex>
    </Box>
  );
}
