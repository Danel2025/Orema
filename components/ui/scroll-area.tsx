/**
 * Composant ScrollArea basé sur Radix UI Themes
 *
 * Zone de défilement personnalisée avec scrollbar stylisée.
 * Utilisez ce composant pour créer des zones scrollables avec
 * une barre de défilement bien espacée du contenu.
 */

import { ScrollArea as RadixScrollArea, Box } from "@radix-ui/themes";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type RadixScrollAreaProps = ComponentPropsWithoutRef<typeof RadixScrollArea>;
type ScrollbarDirection = "vertical" | "horizontal" | "both";

export interface ScrollAreaProps extends Omit<RadixScrollAreaProps, "children"> {
  children: ReactNode;
  /** Padding pour espacer le contenu de la scrollbar (default: "5") */
  contentPadding?: "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
}

/**
 * ScrollArea - Zone de défilement stylisée
 *
 * @example vertical (défaut)
 * ```tsx
 * <ScrollArea style={{ height: 400 }}>
 *   <LongContent />
 * </ScrollArea>
 * ```
 *
 * @example horizontal
 * ```tsx
 * <ScrollArea scrollbars="horizontal" style={{ width: '100%' }}>
 *   <WideContent />
 * </ScrollArea>
 * ```
 *
 * @example avec padding personnalisé
 * ```tsx
 * <ScrollArea contentPadding="3" type="auto">
 *   <Content />
 * </ScrollArea>
 * ```
 */
export function ScrollArea({
  children,
  type = "always",
  scrollbars = "vertical",
  size = "1",
  contentPadding,
  ...props
}: ScrollAreaProps) {
  // Padding par défaut: plus grand pour vertical, plus petit pour horizontal
  const defaultPadding = scrollbars === "horizontal" ? "2" : "5";
  const padding = contentPadding ?? defaultPadding;

  // Appliquer le padding selon la direction du scroll
  const paddingProps = {
    pr: scrollbars === "vertical" || scrollbars === "both" ? padding : undefined,
    pb:
      scrollbars === "horizontal" || scrollbars === "both"
        ? scrollbars === "both"
          ? padding
          : padding
        : undefined,
  };

  return (
    <RadixScrollArea type={type} scrollbars={scrollbars} size={size} {...props}>
      <Box {...paddingProps}>{children}</Box>
    </RadixScrollArea>
  );
}

export type { RadixScrollAreaProps };
