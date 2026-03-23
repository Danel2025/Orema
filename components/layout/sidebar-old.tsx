"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { Box, Flex, Text, Badge, Separator } from "@radix-ui/themes";
import {
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  Package,
  Warehouse,
  Users,
  UserCircle,
  BarChart3,
  Settings,
  Heart,
} from "lucide-react";

interface NavItem {
  label: string;
  href: Route;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    label: "Tableau de bord",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Caisse",
    href: "/caisse",
    icon: ShoppingCart,
    badge: "hot",
  },
  {
    label: "Plan de salle",
    href: "/salle",
    icon: UtensilsCrossed,
  },
  {
    label: "Produits",
    href: "/produits",
    icon: Package,
  },
  {
    label: "Stocks",
    href: "/stocks",
    icon: Warehouse,
  },
  {
    label: "Clients",
    href: "/clients",
    icon: Users,
  },
  {
    label: "Employés",
    href: "/employes",
    icon: UserCircle,
  },
  {
    label: "Rapports",
    href: "/rapports",
    icon: BarChart3,
  },
  {
    label: "Paramètres",
    href: "/parametres",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <Box
      asChild
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: "260px",
        height: "100vh",
        borderRight: "1px solid var(--gray-6)",
        backgroundColor: "var(--color-panel)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <aside>
        {/* Logo */}
        <Box p="5" pb="4">
          <Link href="/" style={{ textDecoration: "none" }}>
            <Flex align="center" gap="3">
              <Box
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "var(--radius-3)",
                  backgroundColor: "var(--accent-9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "var(--shadow-3)",
                }}
              >
                <Heart size={24} fill="white" style={{ color: "white" }} />
              </Box>
              <Flex direction="column" gap="0">
                <Text size="4" weight="bold" style={{ color: "var(--gray-12)" }}>
                  Oréma N+
                </Text>
                <Text size="1" color="gray">
                  Système POS
                </Text>
              </Flex>
            </Flex>
          </Link>
        </Box>

        <Separator size="4" mb="2" />

        {/* Navigation */}
        <Box
          asChild
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          <nav>
            <Flex direction="column" gap="1" p="3">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      textDecoration: "none",
                      borderRadius: "var(--radius-3)",
                      padding: "10px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      backgroundColor: isActive ? "var(--accent-9)" : "transparent",
                      color: isActive ? "white" : "var(--gray-11)",
                      fontWeight: isActive ? 600 : 500,
                      fontSize: "14px",
                      transition: "all 0.15s ease",
                      minHeight: "44px",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = "var(--gray-3)";
                        e.currentTarget.style.color = "var(--gray-12)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "var(--gray-11)";
                      }
                    }}
                  >
                    <Icon
                      size={20}
                      style={{
                        color: isActive ? "white" : "var(--gray-11)",
                        flexShrink: 0,
                      }}
                    />
                    <Text
                      size="2"
                      style={{
                        flex: 1,
                        color: "inherit",
                        fontWeight: "inherit",
                      }}
                    >
                      {item.label}
                    </Text>
                    {item.badge ? (
                      <Badge color="red" variant="solid" size="1">
                        Hot
                      </Badge>
                    ) : null}
                  </Link>
                );
              })}
            </Flex>
          </nav>
        </Box>

        {/* Footer */}
        <Box p="3" pt="4">
          <Separator size="4" mb="3" />
          <Box
            style={{
              borderRadius: "var(--radius-3)",
              backgroundColor: "var(--gray-3)",
              padding: "12px",
            }}
          >
            <Text size="1" color="gray" weight="medium">
              Version 1.0.0
            </Text>
            <br />
            <Text size="1" color="gray">
              © 2026 Oréma N+
            </Text>
          </Box>
        </Box>
      </aside>
    </Box>
  );
}
