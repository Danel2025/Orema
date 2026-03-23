"use client";

/**
 * Sélecteur de couleurs Radix UI
 * Permet de choisir une couleur parmi les couleurs Radix
 */

import { useState } from "react";
import { Box, Flex, Text, Popover, Grid } from "@radix-ui/themes";
import { Check, ChevronDown, Palette } from "lucide-react";
import { contentColors } from "@/schemas/content.schema";

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
}

export function ColorPicker({ value, onChange, label, error }: ColorPickerProps) {
  const [open, setOpen] = useState(false);

  const currentColor = contentColors.find((c) => c.value === value) || contentColors[0];

  return (
    <Box>
      {label ? (
        <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
          {label}
        </Text>
      ) : null}

      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger>
          <Flex
            align="center"
            justify="between"
            px="3"
            py="2"
            style={{
              borderRadius: 8,
              border: error ? "1px solid var(--red-8)" : "1px solid var(--gray-a5)",
              background: "var(--color-background)",
              cursor: "pointer",
              minHeight: 40,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--violet-7)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = error ? "var(--red-8)" : "var(--gray-a5)";
            }}
          >
            <Flex align="center" gap="3">
              <Box
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: `var(--${currentColor.value}-9)`,
                  boxShadow: `0 2px 8px var(--${currentColor.value}-a5)`,
                }}
              />
              <Text size="2">{currentColor.label}</Text>
            </Flex>
            <ChevronDown size={16} style={{ color: "var(--gray-9)" }} />
          </Flex>
        </Popover.Trigger>

        <Popover.Content style={{ width: 280, padding: 0 }} align="start">
          {/* Header */}
          <Flex align="center" gap="2" p="3" style={{ borderBottom: "1px solid var(--gray-a4)" }}>
            <Palette size={16} style={{ color: "var(--gray-10)" }} />
            <Text size="2" weight="medium">
              Choisir une couleur
            </Text>
          </Flex>

          {/* Colors Grid */}
          <Box p="3">
            <Grid columns="5" gap="2">
              {contentColors.map((color) => {
                const isSelected = value === color.value;

                return (
                  <Flex
                    key={color.value}
                    direction="column"
                    align="center"
                    gap="1"
                    p="2"
                    style={{
                      borderRadius: 8,
                      cursor: "pointer",
                      background: isSelected ? `var(--${color.value}-a2)` : "transparent",
                      border: isSelected
                        ? `1px solid var(--${color.value}-a6)`
                        : "1px solid transparent",
                      transition: "all 0.15s ease",
                    }}
                    onClick={() => {
                      onChange(color.value);
                      setOpen(false);
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "var(--gray-a3)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <Box
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: `var(--${color.value}-9)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: isSelected ? `0 4px 12px var(--${color.value}-a5)` : "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {isSelected ? <Check size={14} style={{ color: "white" }} /> : null}
                    </Box>
                    <Text
                      size="1"
                      style={{
                        color: isSelected ? `var(--${color.value}-11)` : "var(--gray-11)",
                        textAlign: "center",
                        fontSize: 9,
                      }}
                    >
                      {color.label}
                    </Text>
                  </Flex>
                );
              })}
            </Grid>
          </Box>

          {/* Preview */}
          <Box
            p="3"
            style={{
              borderTop: "1px solid var(--gray-a4)",
              background: "var(--gray-a2)",
            }}
          >
            <Text size="1" color="gray" style={{ display: "block", marginBottom: 8 }}>
              Aperçu
            </Text>
            <Flex gap="2">
              <Box
                px="3"
                py="1"
                style={{
                  background: `var(--${value}-a3)`,
                  borderRadius: 6,
                  color: `var(--${value}-11)`,
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                Badge
              </Box>
              <Box
                px="3"
                py="1"
                style={{
                  background: `var(--${value}-9)`,
                  borderRadius: 6,
                  color: "white",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                Bouton
              </Box>
            </Flex>
          </Box>
        </Popover.Content>
      </Popover.Root>

      {error ? (
        <Text size="1" color="red" mt="1">
          {error}
        </Text>
      ) : null}
    </Box>
  );
}

export default ColorPicker;
