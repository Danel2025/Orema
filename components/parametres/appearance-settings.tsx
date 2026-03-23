"use client";

/**
 * AppearanceSettings - Parametres d'apparence de l'interface
 */

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { Box, Flex, Text, RadioCards, Button } from "@radix-ui/themes";
import { Sun, Moon, Desktop, Palette, TextT, Check } from "@phosphor-icons/react";
import { toast } from "sonner";

import { useMounted } from "@/hooks/use-mounted";
import { useUIStore } from "@/stores/ui-store";
import { themeOptions, accentColors, fontSizeOptions } from "@/schemas/parametres.schema";

export function AppearanceSettings() {
  const mounted = useMounted();
  const { theme, setTheme: setNextTheme } = useTheme();
  const { accentColor, setAccentColor, fontSize, setFontSize } = useUIStore();

  // Appliquer la taille de police
  useEffect(() => {
    const root = document.documentElement;
    const scale = fontSizeOptions.find((f) => f.value === fontSize)?.scale || 100;
    root.style.fontSize = `${scale}%`;
  }, [fontSize]);

  // Mapper le theme next-themes vers nos valeurs
  const currentTheme = theme === "system" ? "auto" : (theme as "light" | "dark" | "auto");

  const handleThemeChange = (newTheme: string) => {
    // Mapper nos valeurs vers next-themes
    const nextThemeValue = newTheme === "auto" ? "system" : newTheme;
    setNextTheme(nextThemeValue);
    toast.success(`Theme ${themeOptions.find((t) => t.value === newTheme)?.label} active`);
  };

  const handleAccentColorChange = (color: string) => {
    setAccentColor(color);
    toast.success(`Couleur d'accent changee`);
  };

  const handleFontSizeChange = (size: string) => {
    setFontSize(size as "small" | "medium" | "large");
    toast.success(`Taille de police ${fontSizeOptions.find((f) => f.value === size)?.label}`);
  };

  // Eviter le flash d'hydratation
  if (!mounted) {
    return (
      <Flex direction="column" gap="5">
        <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8 }} p="4">
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2">
              <Desktop size={20} weight="duotone" style={{ color: "var(--accent-9)" }} />
              <Text size="4" weight="bold">
                Theme de l'interface
              </Text>
            </Flex>
            <Text size="2" color="gray">
              Chargement...
            </Text>
          </Flex>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="5">
      {/* Selection du theme */}
      <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8 }} p="4">
        <Flex direction="column" gap="4">
          <Flex align="center" gap="2">
            <Desktop size={20} weight="duotone" style={{ color: "var(--accent-9)" }} />
            <Text size="4" weight="bold">
              Theme de l'interface
            </Text>
          </Flex>

          <RadioCards.Root
            value={currentTheme}
            onValueChange={handleThemeChange}
            columns={{ initial: "1", sm: "3" }}
          >
            <RadioCards.Item value="light">
              <Flex direction="column" align="center" gap="2" py="2">
                <Sun size={24} />
                <Text size="2" weight="medium">
                  Clair
                </Text>
                <Text size="1" color="gray">
                  Interface lumineuse
                </Text>
              </Flex>
            </RadioCards.Item>

            <RadioCards.Item value="dark">
              <Flex direction="column" align="center" gap="2" py="2">
                <Moon size={24} />
                <Text size="2" weight="medium">
                  Sombre
                </Text>
                <Text size="1" color="gray">
                  Confortable la nuit
                </Text>
              </Flex>
            </RadioCards.Item>

            <RadioCards.Item value="auto">
              <Flex direction="column" align="center" gap="2" py="2">
                <Desktop size={24} />
                <Text size="2" weight="medium">
                  Automatique
                </Text>
                <Text size="1" color="gray">
                  Suit le systeme
                </Text>
              </Flex>
            </RadioCards.Item>
          </RadioCards.Root>
        </Flex>
      </Box>

      {/* Couleur d'accent */}
      <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8 }} p="4">
        <Flex direction="column" gap="4">
          <Flex align="center" gap="2">
            <Palette size={20} weight="duotone" style={{ color: "var(--accent-9)" }} />
            <Text size="4" weight="bold">
              Couleur d'accent
            </Text>
          </Flex>

          <Text size="2" color="gray">
            Choisissez la couleur principale de l'interface
          </Text>

          <Flex gap="3" wrap="wrap">
            {accentColors.map((color) => (
              <Button
                key={color.value}
                variant={accentColor === color.value ? "solid" : "soft"}
                size="3"
                onClick={() => handleAccentColorChange(color.value)}
                style={{
                  backgroundColor: accentColor === color.value ? color.hex : undefined,
                  minWidth: 100,
                }}
              >
                <Box
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    backgroundColor: color.hex,
                    border:
                      accentColor === color.value ? "2px solid white" : "1px solid var(--gray-6)",
                  }}
                />
                {color.label}
                {accentColor === color.value && <Check size={14} />}
              </Button>
            ))}
          </Flex>

          {/* Apercu */}
          <Box
            style={{
              backgroundColor: "var(--gray-a2)",
              padding: "16px",
              borderRadius: "8px",
            }}
          >
            <Text size="2" weight="medium" mb="2">
              Apercu :
            </Text>
            <Flex gap="3" wrap="wrap" align="center">
              <Button
                size="2"
                style={{
                  backgroundColor: accentColors.find((c) => c.value === accentColor)?.hex,
                }}
              >
                Bouton principal
              </Button>
              <Button
                size="2"
                variant="soft"
                style={{
                  color: accentColors.find((c) => c.value === accentColor)?.hex,
                }}
              >
                Bouton secondaire
              </Button>
              <Box
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  backgroundColor: accentColors.find((c) => c.value === accentColor)?.hex,
                }}
              />
            </Flex>
          </Box>
        </Flex>
      </Box>

      {/* Taille de police */}
      <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8 }} p="4">
        <Flex direction="column" gap="4">
          <Flex align="center" gap="2">
            <TextT size={20} weight="duotone" style={{ color: "var(--accent-9)" }} />
            <Text size="4" weight="bold">
              Taille de l'interface
            </Text>
          </Flex>

          <Text size="2" color="gray">
            Ajustez la taille des textes et elements de l'interface
          </Text>

          <RadioCards.Root
            value={fontSize}
            onValueChange={handleFontSizeChange}
            columns={{ initial: "1", sm: "3" }}
          >
            {fontSizeOptions.map((option) => (
              <RadioCards.Item key={option.value} value={option.value}>
                <Flex direction="column" align="center" gap="2" py="2">
                  <Text
                    size="4"
                    weight="bold"
                    style={{
                      fontSize:
                        option.value === "small"
                          ? "14px"
                          : option.value === "large"
                            ? "20px"
                            : "16px",
                    }}
                  >
                    Aa
                  </Text>
                  <Text size="2" weight="medium">
                    {option.label}
                  </Text>
                  <Text size="1" color="gray">
                    {option.scale}%
                  </Text>
                </Flex>
              </RadioCards.Item>
            ))}
          </RadioCards.Root>

          <Text size="1" color="gray">
            Ces preferences sont sauvegardees localement sur cet appareil.
          </Text>
        </Flex>
      </Box>
    </Flex>
  );
}
