"use client";

/**
 * QuotaProgress - Barre de progression pour les quotas
 * Couleur dynamique selon le niveau d'utilisation avec animation
 */

import { Flex, Text } from "@/components/ui";
import { Progress } from "@radix-ui/themes";
import { motion } from "motion/react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

interface QuotaProgressProps {
  label: string;
  current: number;
  max: number;
  unit?: string;
  icon?: PhosphorIcon;
}

function getProgressColor(percentage: number): "green" | "orange" | "red" {
  if (percentage < 70) return "green";
  if (percentage < 90) return "orange";
  return "red";
}

export function QuotaProgress({
  label,
  current,
  max,
  unit,
  icon: Icon,
}: QuotaProgressProps) {
  const percentage = max > 0 ? Math.min(Math.round((current / max) * 100), 100) : 0;
  const color = getProgressColor(percentage);

  const formatValue = (val: number): string => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return val.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Flex direction="column" gap="2">
        {/* Header : label + valeurs */}
        <Flex justify="between" align="center">
          <Flex align="center" gap="2">
            {Icon ? (
              <Icon
                size={16}
                style={{ color: "var(--gray-10)" }}
              />
            ) : null}
            <Text size="2" weight="medium" style={{ color: "var(--gray-12)" }}>
              {label}
            </Text>
          </Flex>

          <Flex align="center" gap="1">
            <Text
              size="2"
              weight="medium"
              style={{
                fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                color: "var(--gray-12)",
              }}
            >
              {formatValue(current)}
            </Text>
            <Text size="1" color="gray">
              / {formatValue(max)}
              {unit ? ` ${unit}` : ""}
            </Text>
          </Flex>
        </Flex>

        {/* Barre de progression */}
        <Progress value={percentage} color={color} size="2" />

        {/* Pourcentage */}
        <Flex justify="end">
          <Text
            size="1"
            style={{
              color:
                color === "red"
                  ? "var(--red-9)"
                  : color === "orange"
                    ? "var(--orange-9)"
                    : "var(--gray-9)",
              fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
            }}
          >
            {percentage}%
          </Text>
        </Flex>
      </Flex>
    </motion.div>
  );
}
