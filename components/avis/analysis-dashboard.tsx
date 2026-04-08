"use client";

/**
 * AnalysisDashboard - Affichage des résultats d'analyse IA des avis
 * Note moyenne, points forts/faibles, tendance, actions recommandées
 */

import { useState } from "react";
import {
  Flex,
  Text,
  Badge,
  Box,
  Checkbox,
  Heading,
  Separator,
} from "@radix-ui/themes";
import {
  TrendUp,
  TrendDown,
  Minus,
  Target,
  Warning,
  Lightning,
  ListChecks,
  Star as StarIcon,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui";
import { StatCard } from "@/components/composed";
import { StarRating } from "./star-rating";
import { ReviewCard } from "./review-card";
import type { AnalyseResult, AvisAvecReponse } from "@/schemas/avis.schema";

interface AnalysisDashboardProps {
  analyse: AnalyseResult;
}

function TendanceIndicator({ tendance }: { tendance: AnalyseResult["tendance"] }) {
  const config = {
    positive: {
      icon: TrendUp,
      label: "En hausse",
      color: "var(--green-9)" as string,
    },
    stable: {
      icon: Minus,
      label: "Stable",
      color: "var(--gray-9)" as string,
    },
    negative: {
      icon: TrendDown,
      label: "En baisse",
      color: "var(--red-9)" as string,
    },
  };

  const { icon: Icon, label, color } = config[tendance];

  return (
    <Flex align="center" gap="2">
      <Icon size={20} weight="bold" style={{ color }} />
      <Text size="2" weight="medium" style={{ color }}>
        {label}
      </Text>
    </Flex>
  );
}

export function AnalysisDashboard({ analyse }: AnalysisDashboardProps) {
  const [checkedActions, setCheckedActions] = useState<Set<number>>(new Set());

  const toggleAction = (index: number) => {
    setCheckedActions((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <Flex direction="column" gap="5">
      {/* KPIs en haut */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        <StatCard
          title="Note moyenne"
          value={analyse.note_moyenne.toFixed(1)}
          icon={StarIcon}
          color="amber"
        />
        <StatCard
          title="Total avis analysés"
          value={String(analyse.total_avis)}
          icon={ListChecks}
          color="blue"
        />
        <div
          style={{
            backgroundColor: "var(--color-panel-solid)",
            borderRadius: 12,
            padding: 20,
            border: "1px solid var(--gray-a6)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <Flex direction="column" gap="3">
            <Text size="2" weight="medium" style={{ color: "var(--gray-11)" }}>
              Tendance
            </Text>
            <TendanceIndicator tendance={analyse.tendance} />
          </Flex>
        </div>
      </div>

      {/* Note moyenne avec étoiles */}
      <Card>
        <Flex align="center" gap="4" p="4">
          <Flex direction="column" align="center" gap="1">
            <Text
              size="8"
              weight="bold"
              style={{
                fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {analyse.note_moyenne.toFixed(1)}
            </Text>
            <StarRating value={analyse.note_moyenne} readOnly size={24} />
            <Text size="1" color="gray">
              sur 5
            </Text>
          </Flex>
          <Separator orientation="vertical" size="2" />
          <Flex direction="column" gap="1">
            <Text size="2" weight="medium">
              Période : {analyse.periode}
            </Text>
            <Text size="2" color="gray">
              Basé sur {analyse.total_avis} avis client{analyse.total_avis > 1 ? "s" : ""}
            </Text>
          </Flex>
        </Flex>
      </Card>

      {/* Points forts & faibles */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {/* Points forts */}
        <Card>
          <Flex direction="column" gap="3" p="4">
            <Flex align="center" gap="2">
              <Target size={20} weight="bold" style={{ color: "var(--green-9)" }} />
              <Heading as="h4" size="3" weight="medium">
                Points forts
              </Heading>
            </Flex>
            <Flex direction="column" gap="2">
              {analyse.points_forts.length > 0 ? (
                analyse.points_forts.map((point, i) => (
                  <Badge key={i} color="green" variant="soft" size="2">
                    {point}
                  </Badge>
                ))
              ) : (
                <Text size="2" color="gray">
                  Aucun point fort identifié
                </Text>
              )}
            </Flex>
          </Flex>
        </Card>

        {/* Points faibles */}
        <Card>
          <Flex direction="column" gap="3" p="4">
            <Flex align="center" gap="2">
              <Warning size={20} weight="bold" style={{ color: "var(--red-9)" }} />
              <Heading as="h4" size="3" weight="medium">
                Points à améliorer
              </Heading>
            </Flex>
            <Flex direction="column" gap="2">
              {analyse.points_faibles.length > 0 ? (
                analyse.points_faibles.map((point, i) => (
                  <Badge key={i} color="red" variant="soft" size="2">
                    {point}
                  </Badge>
                ))
              ) : (
                <Text size="2" color="gray">
                  Aucun point faible identifié
                </Text>
              )}
            </Flex>
          </Flex>
        </Card>
      </div>

      {/* Avis notables */}
      {analyse.avis_notables.length > 0 ? (
        <Flex direction="column" gap="3">
          <Flex align="center" gap="2">
            <Lightning size={20} weight="bold" style={{ color: "var(--accent-9)" }} />
            <Heading as="h4" size="3" weight="medium">
              Avis notables
            </Heading>
          </Flex>
          <Flex direction="column" gap="2">
            {analyse.avis_notables.map((avisNotable) => {
              const avisData: AvisAvecReponse = {
                id: avisNotable.id,
                etablissement_id: "",
                client_prenom: null,
                note: avisNotable.note,
                contenu: avisNotable.contenu,
                type_repas: null,
                created_at: "",
                updated_at: "",
              };

              return (
                <Box key={avisNotable.id}>
                  <ReviewCard avis={avisData} compact />
                  <Text
                    size="1"
                    color="gray"
                    style={{ fontStyle: "italic", marginTop: 4 }}
                  >
                    {avisNotable.raison}
                  </Text>
                </Box>
              );
            })}
          </Flex>
        </Flex>
      ) : null}

      {/* Actions recommandées */}
      {analyse.actions_recommandees.length > 0 ? (
        <Card>
          <Flex direction="column" gap="3" p="4">
            <Flex align="center" gap="2">
              <ListChecks size={20} weight="bold" style={{ color: "var(--accent-9)" }} />
              <Heading as="h4" size="3" weight="medium">
                Actions recommandées
              </Heading>
            </Flex>
            <Flex direction="column" gap="2">
              {analyse.actions_recommandees.map((action, i) => (
                <Text as="label" size="2" key={i}>
                  <Flex as="span" gap="2" align="start">
                    <Checkbox
                      size="2"
                      checked={checkedActions.has(i)}
                      onCheckedChange={() => toggleAction(i)}
                    />
                    <span
                      style={{
                        textDecoration: checkedActions.has(i)
                          ? "line-through"
                          : "none",
                        color: checkedActions.has(i)
                          ? "var(--gray-8)"
                          : "var(--gray-12)",
                      }}
                    >
                      {action}
                    </span>
                  </Flex>
                </Text>
              ))}
            </Flex>
          </Flex>
        </Card>
      ) : null}
    </Flex>
  );
}
