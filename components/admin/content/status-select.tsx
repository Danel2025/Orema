"use client";

/**
 * Sélecteur de statut de contenu
 * Permet de choisir entre Brouillon, Publié, Archivé
 */

import { Box, Flex, Text, Select } from "@radix-ui/themes";
import { Eye, EyeOff, Archive } from "lucide-react";
import {
  contentStatusValues,
  contentStatusLabels,
  contentStatusColors,
  type ContentStatus,
} from "@/schemas/content.schema";

interface StatusSelectProps {
  value: ContentStatus;
  onChange: (value: ContentStatus) => void;
  label?: string;
  error?: string;
}

const statusIcons: Record<ContentStatus, React.ReactNode> = {
  DRAFT: <EyeOff size={14} />,
  PUBLISHED: <Eye size={14} />,
  ARCHIVED: <Archive size={14} />,
};

export function StatusSelect({ value, onChange, label, error }: StatusSelectProps) {
  return (
    <Box>
      {label ? (
        <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
          {label}
        </Text>
      ) : null}

      <Select.Root value={value} onValueChange={(v) => onChange(v as ContentStatus)}>
        <Select.Trigger
          style={{
            width: "100%",
            borderColor: error ? "var(--red-8)" : undefined,
          }}
        >
          <Flex align="center" gap="2">
            <Box
              style={{
                color: `var(--${contentStatusColors[value]}-9)`,
              }}
            >
              {statusIcons[value]}
            </Box>
            <Text>{contentStatusLabels[value]}</Text>
          </Flex>
        </Select.Trigger>
        <Select.Content position="popper">
          {contentStatusValues.map((status) => (
            <Select.Item key={status} value={status}>
              <Flex align="center" gap="2">
                <Box
                  style={{
                    color: `var(--${contentStatusColors[status]}-9)`,
                  }}
                >
                  {statusIcons[status]}
                </Box>
                <Text>{contentStatusLabels[status]}</Text>
              </Flex>
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>

      {/* Status explanation */}
      <Box mt="2">
        <Text size="1" color="gray">
          {value === "DRAFT" && "Le contenu n'est pas visible sur le site public."}
          {value === "PUBLISHED" && "Le contenu est visible sur le site public."}
          {value === "ARCHIVED" && "Le contenu est masqué et archivé."}
        </Text>
      </Box>

      {error ? (
        <Text size="1" color="red" mt="1">
          {error}
        </Text>
      ) : null}
    </Box>
  );
}

export default StatusSelect;
