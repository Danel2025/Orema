import { Suspense } from "react";
import { Box, Flex, Heading, Text } from "@radix-ui/themes";
import { StocksContent } from "./stocks-content";
import { Loading } from "@/components/shared/loading";
import { PlanGate } from "@/components/shared/plan-gate";

export const metadata = {
  title: "Stocks | Oréma N+",
  description: "Gestion des inventaires et mouvements de stock",
};

export default function StocksPage() {
  return (
    <Box p="4">
      <Flex direction="column" gap="4">
        {/* En-tête */}
        <Flex justify="between" align="center" wrap="wrap" gap="3">
          <Box>
            <Heading size="6" weight="bold">
              Gestion des stocks
            </Heading>
            <Text size="2" color="gray">
              Inventaires, mouvements et alertes de stock
            </Text>
          </Box>
        </Flex>

        {/* Contenu avec chargement des données */}
        <PlanGate feature="stocks_avances">
          <Suspense fallback={<Loading />}>
            <StocksContent />
          </Suspense>
        </PlanGate>
      </Flex>
    </Box>
  );
}
