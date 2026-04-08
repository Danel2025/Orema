"use client";

import { Box, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { Heart } from "@phosphor-icons/react";
import Image from "next/image";
import { ReviewForm } from "@/components/avis";
import { createAvisAction } from "@/actions/avis";
import type { AvisFormData } from "@/schemas/avis.schema";

interface AvisPublicFormProps {
  etablissementId: string;
  etablissementNom: string;
}

export function AvisPublicForm({
  etablissementId,
  etablissementNom,
}: AvisPublicFormProps) {
  const handleSubmit = async (
    data: AvisFormData
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await createAvisAction({
      ...data,
      etablissement_id: etablissementId,
    });
    return result;
  };

  return (
    <Container size="1" py="8" px="4">
      <Flex direction="column" align="center" gap="6">
        {/* En-tête */}
        <Flex direction="column" align="center" gap="3" style={{ textAlign: "center" }}>
          <Image
            src="/images/logos/ic-lg.webp"
            alt="Oréma N+"
            width={48}
            height={48}
            style={{ objectFit: "contain", width: "auto", height: "auto" }}
          />
          <Heading size="6" weight="bold">
            {etablissementNom}
          </Heading>
          <Flex align="center" gap="2">
            <Heart size={20} weight="fill" style={{ color: "var(--accent-9)" }} />
            <Text size="3" color="gray">
              Votre avis compte pour nous
            </Text>
          </Flex>
          <Text size="2" color="gray" style={{ maxWidth: 400 }}>
            Prenez un instant pour nous dire comment s'est passée votre
            expérience. Cela nous aide à nous améliorer.
          </Text>
        </Flex>

        {/* Formulaire */}
        <Box
          style={{
            width: "100%",
            maxWidth: 480,
            padding: "var(--space-5)",
            borderRadius: "var(--radius-4)",
            border: "1px solid var(--gray-a4)",
            backgroundColor: "var(--color-surface)",
          }}
        >
          <ReviewForm
            etablissementId={etablissementId}
            onSubmit={handleSubmit}
          />
        </Box>

        {/* Footer discret */}
        <Text size="1" color="gray" style={{ opacity: 0.6 }}>
          Propulsé par Oréma N+
        </Text>
      </Flex>
    </Container>
  );
}
