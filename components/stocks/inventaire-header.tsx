"use client";

import { Box, Flex, Heading, Text, Button } from "@radix-ui/themes";
import { ClipboardText, ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";

export function InventaireHeader() {
  return (
    <Flex justify="between" align="center" wrap="wrap" gap="3">
      <Flex align="center" gap="3">
        <Link href="/stocks">
          <Button variant="ghost" color="gray" style={{ minHeight: 44 }}>
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <Box>
          <Flex align="center" gap="2">
            <ClipboardText size={22} style={{ color: "var(--accent-9)" }} />
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
  );
}
