"use client";

/**
 * Loading state skeleton pour la page établissements
 */

import { Box, Flex, Grid, Skeleton } from "@radix-ui/themes";

export default function EtablissementsLoading() {
  return (
    <Box>
      {/* Header skeleton */}
      <Flex align="center" justify="between" mb="6">
        <Flex align="center" gap="3">
          <Skeleton style={{ width: 48, height: 48, borderRadius: 8 }} />
          <Box>
            <Skeleton style={{ width: 240, height: 24, marginBottom: 8 }} />
            <Skeleton style={{ width: 320, height: 14 }} />
          </Box>
        </Flex>
        <Flex gap="2">
          <Skeleton style={{ width: 80, height: 32, borderRadius: 8 }} />
          <Skeleton style={{ width: 170, height: 32, borderRadius: 8 }} />
        </Flex>
      </Flex>

      {/* Stats skeleton */}
      <Grid columns={{ initial: "2", md: "4" }} gap="4" mb="6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Box
            key={i}
            p="5"
            style={{
              background: "var(--color-panel-solid)",
              borderRadius: 12,
              border: "1px solid var(--gray-a6)",
            }}
          >
            <Flex justify="between" align="start" mb="4">
              <Skeleton style={{ width: 100, height: 14 }} />
              <Skeleton style={{ width: 48, height: 48, borderRadius: 12 }} />
            </Flex>
            <Skeleton style={{ width: 80, height: 32 }} />
          </Box>
        ))}
      </Grid>

      {/* Filters skeleton */}
      <Box
        p="4"
        mb="5"
        style={{
          background: "var(--color-background)",
          borderRadius: 12,
          border: "1px solid var(--gray-a4)",
        }}
      >
        <Flex direction="column" gap="3">
          <Skeleton style={{ width: "100%", height: 36, borderRadius: 6 }} />
          <Flex gap="3" wrap="wrap">
            <Skeleton style={{ width: 130, height: 32, borderRadius: 6 }} />
            <Skeleton style={{ width: 130, height: 32, borderRadius: 6 }} />
            <Skeleton style={{ width: 150, height: 32, borderRadius: 6 }} />
            <Skeleton style={{ width: 120, height: 32, borderRadius: 6 }} />
          </Flex>
        </Flex>
      </Box>

      {/* Table skeleton */}
      <Box
        style={{
          background: "var(--color-background)",
          borderRadius: 12,
          border: "1px solid var(--gray-a4)",
          overflow: "hidden",
        }}
      >
        {/* Header row */}
        <Box
          p="3"
          style={{ borderBottom: "1px solid var(--gray-a4)", background: "var(--gray-a2)" }}
        >
          <Flex gap="4">
            <Skeleton style={{ width: 20, height: 20 }} />
            <Skeleton style={{ width: 120, height: 16 }} />
            <Skeleton style={{ width: 100, height: 16 }} />
            <Skeleton style={{ width: 60, height: 16 }} />
            <Skeleton style={{ width: 60, height: 16 }} />
            <Skeleton style={{ width: 80, height: 16 }} />
            <Skeleton style={{ width: 60, height: 16 }} />
            <Skeleton style={{ width: 80, height: 16 }} />
            <Skeleton style={{ width: 100, height: 16 }} />
            <Skeleton style={{ width: 80, height: 16 }} />
          </Flex>
        </Box>

        {/* Data rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <Box
            key={i}
            px="3"
            py="4"
            style={{ borderBottom: "1px solid var(--gray-a3)" }}
          >
            <Flex gap="4" align="center">
              <Skeleton style={{ width: 20, height: 20 }} />
              <Box>
                <Skeleton style={{ width: 140, height: 16, marginBottom: 4 }} />
                <Skeleton style={{ width: 80, height: 12 }} />
              </Box>
              <Box>
                <Skeleton style={{ width: 120, height: 14, marginBottom: 4 }} />
                <Skeleton style={{ width: 90, height: 12 }} />
              </Box>
              <Skeleton style={{ width: 50, height: 22, borderRadius: 10 }} />
              <Skeleton style={{ width: 50, height: 22, borderRadius: 10 }} />
              <Skeleton style={{ width: 32, height: 22, borderRadius: 10 }} />
              <Skeleton style={{ width: 32, height: 22, borderRadius: 10 }} />
              <Skeleton style={{ width: 32, height: 22, borderRadius: 10 }} />
              <Skeleton style={{ width: 90, height: 16 }} />
              <Skeleton style={{ width: 70, height: 14 }} />
              <Skeleton style={{ width: 28, height: 28, borderRadius: 6 }} />
            </Flex>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
