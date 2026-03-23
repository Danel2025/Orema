/**
 * DashboardCard - Card spéciale pour les sections du dashboard
 * Avec header, actions et contenu
 */

import { Card, Flex, Heading, Text, IconButton, Separator } from "@/components/ui";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export interface DashboardCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    icon: LucideIcon;
    onClick: () => void;
    label: string;
  };
  children: ReactNode;
}

export function DashboardCard({
  title,
  description,
  icon: Icon,
  action,
  children,
}: DashboardCardProps) {
  return (
    <Card>
      <Flex direction="column" gap="3">
        {/* Header */}
        <Flex justify="between" align="center" p="4" pb="0">
          <Flex align="center" gap="3">
            {Icon ? (
              <Flex
                align="center"
                justify="center"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "var(--radius-2)",
                  backgroundColor: "var(--accent-3)",
                }}
              >
                <Icon style={{ width: 20, height: 20, color: "var(--accent-9)" }} />
              </Flex>
            ) : null}
            <Flex direction="column" gap="1">
              <Heading as="h3" size="4" weight="medium">
                {title}
              </Heading>
              {description ? (
                <Text size="1" color="gray">
                  {description}
                </Text>
              ) : null}
            </Flex>
          </Flex>

          {action ? (
            <IconButton
              variant="ghost"
              color="gray"
              onClick={action.onClick}
              aria-label={action.label}
            >
              <action.icon style={{ width: 18, height: 18 }} />
            </IconButton>
          ) : null}
        </Flex>

        <Separator size="4" />

        {/* Content */}
        <Flex direction="column" p="4" pt="0">
          {children}
        </Flex>
      </Flex>
    </Card>
  );
}
