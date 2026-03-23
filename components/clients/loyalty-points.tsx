"use client";

/**
 * LoyaltyPoints - Composant pour afficher les points de fidelite
 */

import { Card, Flex, Text, Badge, Separator, Progress } from "@radix-ui/themes";
import { ScrollArea } from "@/components/ui";
import { Star, Trophy, Gift, Receipt } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface LoyaltyTransaction {
  id: string;
  venteId: string;
  numeroTicket: string;
  montantVente: number;
  pointsGagnes: number;
  createdAt: Date;
}

interface LoyaltyPointsProps {
  clientNom: string;
  pointsFidelite: number;
  transactions?: LoyaltyTransaction[];
}

// Regle de fidelite: 1 point par 1000 FCFA
const POINTS_PAR_FCFA = 1000;

// Niveaux de fidelite
const LOYALTY_LEVELS = [
  { name: "Bronze", minPoints: 0, color: "violet" as const, icon: Star },
  { name: "Argent", minPoints: 50, color: "gray" as const, icon: Star },
  { name: "Or", minPoints: 100, color: "amber" as const, icon: Trophy },
  { name: "Platine", minPoints: 200, color: "blue" as const, icon: Gift },
];

function getLoyaltyLevel(points: number) {
  for (let i = LOYALTY_LEVELS.length - 1; i >= 0; i--) {
    if (points >= LOYALTY_LEVELS[i].minPoints) {
      return LOYALTY_LEVELS[i];
    }
  }
  return LOYALTY_LEVELS[0];
}

function getNextLevel(points: number) {
  for (const level of LOYALTY_LEVELS) {
    if (points < level.minPoints) {
      return level;
    }
  }
  return null; // Max level atteint
}

export function LoyaltyPoints({
  clientNom,
  pointsFidelite,
  transactions = [],
}: LoyaltyPointsProps) {
  const currentLevel = getLoyaltyLevel(pointsFidelite);
  const nextLevel = getNextLevel(pointsFidelite);
  const LevelIcon = currentLevel.icon;

  // Calculer la progression vers le niveau suivant
  let progressPercent = 100;
  let pointsToNextLevel = 0;

  if (nextLevel) {
    const pointsInCurrentLevel = pointsFidelite - currentLevel.minPoints;
    const pointsNeededForNextLevel = nextLevel.minPoints - currentLevel.minPoints;
    progressPercent = Math.min(100, (pointsInCurrentLevel / pointsNeededForNextLevel) * 100);
    pointsToNextLevel = nextLevel.minPoints - pointsFidelite;
  }

  // Total des points gagnes ce mois
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  const pointsThisMonth = transactions
    .filter((tx) => new Date(tx.createdAt) >= thisMonth)
    .reduce((sum, tx) => sum + tx.pointsGagnes, 0);

  return (
    <Card>
      <Flex direction="column" gap="4">
        {/* Header avec niveau */}
        <Flex justify="between" align="center">
          <Flex align="center" gap="2">
            <Star size={20} className="text-amber-500" />
            <Text size="3" weight="medium">
              Programme fidelite
            </Text>
          </Flex>
          <Badge size="2" color={currentLevel.color} variant="soft">
            <LevelIcon size={14} />
            {currentLevel.name}
          </Badge>
        </Flex>

        {/* Points actuels */}
        <Card variant="surface">
          <Flex direction="column" gap="3" align="center" py="2">
            <Text size="6" weight="bold" style={{ fontFamily: "var(--font-google-sans-code)" }}>
              {pointsFidelite}
            </Text>
            <Text size="2" color="gray">
              points de fidelite
            </Text>
          </Flex>
        </Card>

        {/* Progression vers le niveau suivant */}
        {nextLevel ? (
          <Flex direction="column" gap="2">
            <Flex justify="between" align="center">
              <Text size="2" color="gray">
                Prochain niveau: {nextLevel.name}
              </Text>
              <Text size="2" color="gray">
                {pointsToNextLevel} points restants
              </Text>
            </Flex>
            <Progress value={progressPercent} color={currentLevel.color} />
          </Flex>
        ) : null}

        {/* Statistiques */}
        <Flex gap="4">
          <Card variant="surface" style={{ flex: 1 }}>
            <Flex direction="column" align="center" gap="1">
              <Text size="4" weight="bold">
                {pointsThisMonth}
              </Text>
              <Text size="1" color="gray" align="center">
                Points ce mois
              </Text>
            </Flex>
          </Card>
          <Card variant="surface" style={{ flex: 1 }}>
            <Flex direction="column" align="center" gap="1">
              <Text size="4" weight="bold">
                {transactions.length}
              </Text>
              <Text size="1" color="gray" align="center">
                Transactions
              </Text>
            </Flex>
          </Card>
        </Flex>

        {/* Regle de fidelite */}
        <Card variant="surface" style={{ backgroundColor: "var(--accent-a2)" }}>
          <Flex align="center" gap="2">
            <Gift size={16} style={{ color: "var(--accent-9)" }} />
            <Text size="2">
              Gagnez <strong>1 point</strong> par <strong>{formatCurrency(POINTS_PAR_FCFA)}</strong>{" "}
              depenses
            </Text>
          </Flex>
        </Card>

        {/* Historique des points */}
        {transactions.length > 0 && (
          <>
            <Separator size="4" />
            <Flex direction="column" gap="2">
              <Text size="2" weight="medium" color="gray">
                Historique des points
              </Text>
              <ScrollArea style={{ maxHeight: 200 }}>
                <Flex direction="column" gap="2">
                  {transactions.slice(0, 10).map((tx) => (
                    <Flex
                      key={tx.id}
                      justify="between"
                      align="center"
                      py="2"
                      style={{
                        borderBottom: "1px solid var(--gray-a4)",
                      }}
                    >
                      <Flex align="center" gap="2">
                        <Receipt size={16} className="text-gray-500" />
                        <Flex direction="column">
                          <Text size="2">Ticket #{tx.numeroTicket}</Text>
                          <Text size="1" color="gray">
                            {formatCurrency(tx.montantVente)}
                          </Text>
                        </Flex>
                      </Flex>
                      <Flex direction="column" align="end">
                        <Text size="2" weight="medium" color="green">
                          +{tx.pointsGagnes} pts
                        </Text>
                        <Text size="1" color="gray">
                          {formatDate(tx.createdAt)}
                        </Text>
                      </Flex>
                    </Flex>
                  ))}
                </Flex>
              </ScrollArea>
            </Flex>
          </>
        )}

        {transactions.length === 0 && (
          <Flex direction="column" align="center" gap="2" py="4" style={{ color: "var(--gray-9)" }}>
            <Star size={24} />
            <Text size="2" color="gray">
              Aucun point gagne pour le moment
            </Text>
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
