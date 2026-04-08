import { Suspense } from "react";
import { Box, Flex, Heading, Text, Skeleton, Grid } from "@radix-ui/themes";
import { getKPIs } from "@/actions/rapports";
import { KPICards } from "@/components/rapports";
import { RapportsTabs } from "./rapports-tabs";
import { UpgradeBanner } from "@/components/shared/upgrade-banner";

// Composants de chargement
function KPICardsLoading() {
  return (
    <Grid columns={{ initial: "1", sm: "2", lg: "3", xl: "6" }} gap="4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} height="140px" style={{ borderRadius: 12 }} />
      ))}
    </Grid>
  );
}

// Composant KPIs avec fetch serveur
async function KPICardsServer() {
  const kpis = await getKPIs();
  return <KPICards kpis={kpis} />;
}

export default function RapportsPage() {
  return (
    <Box>
      {/* Header */}
      <Flex justify="between" align="center" mb="6">
        <Box>
          <Heading size="7" weight="bold" mb="1">
            Rapports
          </Heading>
          <Text size="3" color="gray">
            Statistiques et analyses de ventes
          </Text>
        </Box>
      </Flex>

      {/* KPIs */}
      <Box mb="6">
        <Suspense fallback={<KPICardsLoading />}>
          <KPICardsServer />
        </Suspense>
      </Box>

      {/* Banner upgrade pour rapports avancés */}
      <Box mb="4">
        <UpgradeBanner
          feature="rapports"
          message="Passez à un plan supérieur pour accéder aux rapports avancés, exports et analyses détaillées."
        />
      </Box>

      {/* Onglets */}
      <RapportsTabs />
    </Box>
  );
}
