"use client";

/**
 * Loading skeleton pour la page de détail d'un établissement
 */

import { Box, Flex, Grid, Skeleton, Tabs } from "@radix-ui/themes";

export default function EtablissementDetailLoading() {
  return (
    <Box>
      {/* Header skeleton */}
      <Flex align="center" justify="between" mb="6">
        <Flex align="center" gap="4">
          {/* Bouton retour */}
          <Skeleton style={{ width: 36, height: 36, borderRadius: 8 }} />

          <Flex direction="column" gap="2">
            {/* Nom */}
            <Skeleton style={{ width: 280, height: 28 }} />
            {/* Badges + date */}
            <Flex gap="2" align="center">
              <Skeleton style={{ width: 64, height: 22, borderRadius: 9999 }} />
              <Skeleton style={{ width: 80, height: 22, borderRadius: 9999 }} />
              <Skeleton style={{ width: 120, height: 16 }} />
            </Flex>
          </Flex>
        </Flex>

        {/* Boutons d'action */}
        <Flex gap="2">
          <Skeleton style={{ width: 100, height: 36, borderRadius: 8 }} />
          <Skeleton style={{ width: 110, height: 36, borderRadius: 8 }} />
          <Skeleton style={{ width: 110, height: 36, borderRadius: 8 }} />
        </Flex>
      </Flex>

      {/* Tabs skeleton */}
      <Tabs.Root defaultValue="info">
        <Tabs.List>
          <Tabs.Trigger value="info" disabled>
            <Skeleton style={{ width: 100, height: 16 }} />
          </Tabs.Trigger>
          <Tabs.Trigger value="stats" disabled>
            <Skeleton style={{ width: 90, height: 16 }} />
          </Tabs.Trigger>
          <Tabs.Trigger value="users" disabled>
            <Skeleton style={{ width: 90, height: 16 }} />
          </Tabs.Trigger>
          <Tabs.Trigger value="audit" disabled>
            <Skeleton style={{ width: 70, height: 16 }} />
          </Tabs.Trigger>
        </Tabs.List>

        <Box pt="5">
          {/* Content skeleton - simule l'onglet info */}
          <Grid columns={{ initial: "1", md: "2" }} gap="5">
            {/* Section infos générales */}
            <Box
              p="5"
              style={{
                background: "var(--color-background)",
                borderRadius: 12,
                border: "1px solid var(--gray-a4)",
              }}
            >
              <Skeleton style={{ width: 160, height: 20, marginBottom: 16 }} />
              <Flex direction="column" gap="3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Flex key={i} justify="between" align="center">
                    <Skeleton style={{ width: 80, height: 14 }} />
                    <Skeleton style={{ width: 160, height: 14 }} />
                  </Flex>
                ))}
              </Flex>
            </Box>

            {/* Section infos légales */}
            <Box
              p="5"
              style={{
                background: "var(--color-background)",
                borderRadius: 12,
                border: "1px solid var(--gray-a4)",
              }}
            >
              <Skeleton style={{ width: 160, height: 20, marginBottom: 16 }} />
              <Flex direction="column" gap="3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Flex key={i} justify="between" align="center">
                    <Skeleton style={{ width: 80, height: 14 }} />
                    <Skeleton style={{ width: 160, height: 14 }} />
                  </Flex>
                ))}
              </Flex>
            </Box>

            {/* Section paramètres */}
            <Box
              p="5"
              style={{
                background: "var(--color-background)",
                borderRadius: 12,
                border: "1px solid var(--gray-a4)",
              }}
            >
              <Skeleton style={{ width: 160, height: 20, marginBottom: 16 }} />
              <Flex direction="column" gap="3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Flex key={i} justify="between" align="center">
                    <Skeleton style={{ width: 100, height: 14 }} />
                    <Skeleton style={{ width: 120, height: 14 }} />
                  </Flex>
                ))}
              </Flex>
            </Box>

            {/* Section abonnement */}
            <Box
              p="5"
              style={{
                background: "var(--color-background)",
                borderRadius: 12,
                border: "1px solid var(--gray-a4)",
              }}
            >
              <Skeleton style={{ width: 160, height: 20, marginBottom: 16 }} />
              <Flex direction="column" gap="3">
                <Skeleton style={{ width: "100%", height: 8, borderRadius: 4 }} />
                <Skeleton style={{ width: "100%", height: 8, borderRadius: 4 }} />
                <Skeleton style={{ width: "100%", height: 8, borderRadius: 4 }} />
              </Flex>
            </Box>
          </Grid>
        </Box>
      </Tabs.Root>
    </Box>
  );
}
