"use client";

/**
 * Providers du dashboard
 *
 * Wrapper client qui fournit les contextes necessaires
 * pour le dashboard (Auth, etc.)
 */

import { type ReactNode } from "react";
import { AuthProvider, type AuthUser } from "@/lib/auth/context";
import { DashboardShell } from "./dashboard-shell";
import { RouteGuard } from "./route-guard";
import { NotificationBridgeProvider } from "./notification-bridge-provider";
import type { Permission } from "@/lib/permissions";

interface DashboardProvidersProps {
  children: ReactNode;
  user: AuthUser | null;
  permissions?: Permission[];
}

/**
 * Providers du dashboard
 *
 * Fournit le contexte d'authentification et le shell
 * pour toutes les pages du dashboard.
 */
export function DashboardProviders({ children, user, permissions }: DashboardProvidersProps) {
  return (
    <AuthProvider initialUser={user} initialPermissions={permissions}>
      <NotificationBridgeProvider>
        <DashboardShell>
          <RouteGuard>{children}</RouteGuard>
        </DashboardShell>
      </NotificationBridgeProvider>
    </AuthProvider>
  );
}
