"use client";

/**
 * Layout minimal pour les ecrans d'affichage (mode kiosque)
 *
 * Pas de sidebar, pas de header, pas d'auth session.
 * Inclut uniquement les providers necessaires :
 * - Theme (Radix UI) en mode sombre
 * - QueryClientProvider (TanStack Query)
 * - Toaster (Sonner)
 */

import { Theme } from "@radix-ui/themes";
import { ThemeProvider } from "next-themes";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { getQueryClient } from "@/lib/query-client";

export default function DisplayLayout({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        forcedTheme="dark"
        disableTransitionOnChange
      >
        <Theme accentColor="orange" grayColor="slate" radius="medium" scaling="100%">
          <div
            style={{
              margin: 0,
              padding: 0,
              overflow: "hidden",
              width: "100vw",
              height: "100vh",
              backgroundColor: "var(--color-background)",
            }}
          >
            {children}
          </div>
          <Toaster position="top-right" richColors theme="dark" />
        </Theme>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
