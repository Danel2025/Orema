"use client";

import { Theme } from "@radix-ui/themes";
import type { ThemeProps } from "@radix-ui/themes";
import { ThemeProvider } from "next-themes";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode} from "react";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { getQueryClient } from "@/lib/query-client";
import { useUIStore } from "@/stores/ui-store";

// Couleurs d'accent valides pour Radix UI Themes
type RadixAccentColor = ThemeProps["accentColor"];

// Mapping des tailles de police vers le scaling Radix
const fontSizeScaling: Record<string, ThemeProps["scaling"]> = {
  small: "90%",
  medium: "100%",
  large: "110%",
};

/**
 * Providers globaux pour l'application Oréma N+
 *
 * - QueryClientProvider: Gestion du state serveur avec TanStack Query
 * - ThemeProvider (next-themes): Gestion du dark mode avec prévention du flash
 * - Theme (Radix UI): Système de design avec accent dynamique
 * - Toaster (Sonner): Notifications toast
 *
 * Pattern recommandé par Radix UI pour le dark mode avec Next.js
 * @see https://www.radix-ui.com/themes/docs/theme/dark-mode
 */
export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  const [mounted, setMounted] = useState(false);

  // Lire les préférences depuis le store UI
  const { accentColor, fontSize } = useUIStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Valeurs par défaut pour SSR
  const currentAccentColor = (mounted ? accentColor : "violet") as RadixAccentColor;
  const currentScaling = mounted ? fontSizeScaling[fontSize] || "100%" : "100%";

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <Theme
          accentColor={currentAccentColor}
          grayColor="slate"
          radius="medium"
          scaling={currentScaling}
        >
          {children}
          <Toaster position="top-right" richColors />
        </Theme>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
