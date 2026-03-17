import { Box, Flex, Heading, Text , Button } from "@radix-ui/themes";
import { ClipboardList , ArrowLeft } from "lucide-react";
import { InventaireForm } from "@/components/stocks/inventaire-form";
import Link from "next/link";

export const metadata = {
  title: "Inventaire | Stocks | Orema N+",
  description: "Inventaire physique des stocks - Comptage et ajustement",
};

export default function InventairePage() {
  return (
    <Box p="4">
      <Flex direction="column" gap="4">
        {/* En-tete */}
        <Flex justify="between" align="center" wrap="wrap" gap="3">
          <Flex align="center" gap="3">
            <Link href="/stocks">
              <Button variant="ghost" color="gray" style={{ minHeight: 44 }}>
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <Box>
              <Flex align="center" gap="2">
                <ClipboardList size={22} style={{ color: "var(--accent-9)" }} />
                <Heading size="6" weight="bold">
                  Inventaire physique
                </Heading>
              </Flex>
              <Text size="2" color="gray">
                Comptez les produits et ajustez les stocks
              </Text>
            </Box>
          </Flex>
        </Flex>

        {/* Formulaire d'inventaire */}
        <InventaireForm />
      </Flex>
    </Box>
  );
}
