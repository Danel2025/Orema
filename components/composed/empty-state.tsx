/**
 * EmptyState - Pattern pour afficher un etat vide
 * Utilise quand il n'y a pas de donnees a afficher
 */

import { Flex, Text, Heading, Button } from "@/components/ui";
import type { ReactNode, ComponentType } from "react";

export interface EmptyStateProps {
  icon: ComponentType<{ style?: React.CSSProperties; size?: number; className?: string }>;
  title: string;
  description: string;
  /** Action sous forme d'objet ou de composant React */
  action?:
    | {
        label: string;
        onClick: () => void;
      }
    | ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  // Determiner si action est un objet ou un ReactNode
  const isActionObject =
    action && typeof action === "object" && "label" in action && "onClick" in action;

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      gap="4"
      py="9"
      style={{ textAlign: "center" }}
    >
      <Flex
        align="center"
        justify="center"
        style={{
          width: 64,
          height: 64,
          borderRadius: "var(--radius-full)",
          backgroundColor: "var(--gray-3)",
        }}
      >
        <Icon style={{ width: 32, height: 32, color: "var(--gray-9)" }} />
      </Flex>

      <Flex direction="column" gap="2" style={{ maxWidth: 400 }}>
        <Heading as="h3" size="5" weight="medium">
          {title}
        </Heading>
        <Text size="2" color="gray">
          {description}
        </Text>
      </Flex>

      {isActionObject ? (
        <Button variant="solid" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : action ? (
        action
      ) : null}
    </Flex>
  );
}
