/**
 * ReviewCard - Carte d'affichage d'un avis client
 * Avec StarRating, badge couleur selon note, bouton répondre
 */

import { Card, Flex, Text, Badge, Box } from "@/components/ui";
import { ChatCircleDots } from "@phosphor-icons/react";
import { Button } from "@radix-ui/themes";
import { StarRating } from "./star-rating";
import { formatDate } from "@/lib/utils";
import type { AvisAvecReponse } from "@/schemas/avis.schema";

interface ReviewCardProps {
  avis: AvisAvecReponse;
  onRepondre?: (avis: AvisAvecReponse) => void;
  compact?: boolean;
}

function getNoteBadge(note: number): {
  color: "green" | "orange" | "red";
  label: string;
} {
  if (note >= 4) return { color: "green", label: "Positif" };
  if (note === 3) return { color: "orange", label: "Mitigé" };
  return { color: "red", label: "Négatif" };
}

export function ReviewCard({ avis, onRepondre, compact = false }: ReviewCardProps) {
  const badge = getNoteBadge(avis.note);
  const displayName = avis.client_prenom || "Anonyme";

  return (
    <Card size={compact ? "1" : "2"}>
      <Flex direction="column" gap="3">
        {/* Header : nom, date, badge */}
        <Flex justify="between" align="start" wrap="wrap" gap="2">
          <Flex direction="column" gap="1">
            <Flex align="center" gap="2">
              <Text size="2" weight="bold">
                {displayName}
              </Text>
              <Badge color={badge.color} variant="soft" size="1">
                {badge.label}
              </Badge>
            </Flex>
            <Text size="1" color="gray">
              {formatDate(avis.created_at, "long")}
            </Text>
          </Flex>

          <StarRating value={avis.note} readOnly size={compact ? 16 : 20} />
        </Flex>

        {/* Contenu de l'avis */}
        <Text size="2" style={{ lineHeight: 1.6, color: "var(--gray-12)" }}>
          {avis.contenu}
        </Text>

        {/* Réponse existante */}
        {avis.reponse ? (
          <Box
            style={{
              backgroundColor: "var(--accent-a2)",
              borderRadius: "var(--radius-2)",
              padding: "12px",
              borderLeft: "3px solid var(--accent-9)",
            }}
          >
            <Flex direction="column" gap="1">
              <Text size="1" weight="medium" color="gray">
                Réponse du gérant
              </Text>
              <Text size="2" style={{ lineHeight: 1.5 }}>
                {avis.reponse.contenu}
              </Text>
            </Flex>
          </Box>
        ) : null}

        {/* Bouton répondre */}
        {onRepondre && !avis.reponse ? (
          <Flex justify="end">
            <Button
              variant="soft"
              size="1"
              onClick={() => onRepondre(avis)}
            >
              <ChatCircleDots size={16} />
              Répondre
            </Button>
          </Flex>
        ) : null}
      </Flex>
    </Card>
  );
}
