"use client";

/**
 * Sélecteur d'icônes Lucide
 * Permet de choisir une icône parmi une liste prédéfinie
 */

import { useState, useMemo } from "react";
import { Box, Flex, Text, TextField, Popover, ScrollArea, Grid } from "@radix-ui/themes";
import { Search, Check, ChevronDown } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { docCategoryIcons, blogPostIcons } from "@/schemas/content.schema";

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  type?: "doc" | "blog";
  error?: string;
}

export function IconPicker({ value, onChange, label, type = "doc", error }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Utiliser les icônes appropriées selon le type
  const iconList = type === "blog" ? blogPostIcons : docCategoryIcons;

  // Filtrer les icônes
  const filteredIcons = useMemo(() => {
    if (!search) return iconList;
    return iconList.filter(
      (icon) =>
        icon.value.toLowerCase().includes(search.toLowerCase()) ||
        icon.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [iconList, search]);

  // Récupérer le composant icône actuel
  const CurrentIcon =
    (LucideIcons as unknown as Record<string, LucideIcon>)[value] || LucideIcons.FileText;
  const currentIconLabel = iconList.find((i) => i.value === value)?.label || value;

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
                p="2"
                style={{
                  background: "var(--violet-a3)",
                  borderRadius: 6,
                }}
              >
                <CurrentIcon size={16} style={{ color: "var(--violet-9)" }} />
              </Box>
              <Text size="2">{currentIconLabel}</Text>
            </Flex>
            <ChevronDown size={16} style={{ color: "var(--gray-9)" }} />
          </Flex>
        </Popover.Trigger>

        <Popover.Content style={{ width: 320, padding: 0 }} align="start">
          {/* Search */}
          <Box p="3" style={{ borderBottom: "1px solid var(--gray-a4)" }}>
            <TextField.Root
              placeholder="Rechercher une icône..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="2"
            >
              <TextField.Slot>
                <Search size={14} />
              </TextField.Slot>
            </TextField.Root>
          </Box>

          {/* Icons Grid */}
          <ScrollArea style={{ height: 280 }}>
            <Box p="3">
              <Grid columns="4" gap="2">
                {filteredIcons.map((icon) => {
                  const IconComponent =
                    (LucideIcons as unknown as Record<string, LucideIcon>)[icon.value] ||
                    LucideIcons.FileText;
                  const isSelected = value === icon.value;

                  return (
                    <Flex
                      key={icon.value}
                      direction="column"
                      align="center"
                      gap="1"
                      p="2"
                      style={{
                        borderRadius: 8,
                        cursor: "pointer",
                        background: isSelected ? "var(--violet-a3)" : "transparent",
                        border: isSelected ? "1px solid var(--violet-a6)" : "1px solid transparent",
                        transition: "all 0.15s ease",
                        position: "relative",
                      }}
                      onClick={() => {
                        onChange(icon.value);
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
                      <IconComponent
                        size={20}
                        style={{
                          color: isSelected ? "var(--violet-9)" : "var(--gray-11)",
                        }}
                      />
                      <Text
                        size="1"
                        style={{
                          color: isSelected ? "var(--violet-11)" : "var(--gray-11)",
                          textAlign: "center",
                          fontSize: 10,
                          lineHeight: 1.2,
                        }}
                      >
                        {icon.label}
                      </Text>
                      {isSelected ? (
                        <Box
                          style={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                          }}
                        >
                          <Check size={10} style={{ color: "var(--violet-9)" }} />
                        </Box>
                      ) : null}
                    </Flex>
                  );
                })}
              </Grid>

              {filteredIcons.length === 0 && (
                <Flex align="center" justify="center" py="6">
                  <Text size="2" color="gray">
                    Aucune icône trouvée
                  </Text>
                </Flex>
              )}
            </Box>
          </ScrollArea>
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

export default IconPicker;
