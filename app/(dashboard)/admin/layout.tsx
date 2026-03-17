"use client";

/**
 * Layout Admin - Réservé au SUPER_ADMIN
 * Interface de gestion de contenu avec navigation dédiée
 *
 * Note: Ce layout utilise des marges négatives pour compenser
 * le padding du DashboardShell parent (24px 32px)
 */

import { useAuth } from "@/lib/auth/context";
import { redirect , usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Badge,
  Spinner,
} from "@radix-ui/themes";
import * as Collapsible from "@radix-ui/react-collapsible";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Newspaper,
  ChevronLeft,
  ChevronDown,
  Shield,
  Sparkles,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";

// Constantes pour les dimensions
const ADMIN_SIDEBAR_WIDTH = 280;
const PARENT_PADDING_Y = 24;
const PARENT_PADDING_X = 32;

/**
 * Navigation items pour l'admin
 */
const adminNavItems = [
  {
    href: "/admin",
    label: "Vue d'ensemble",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/admin/etablissements",
    label: "Établissements",
    icon: Building2,
  },
  {
    label: "Gestion du contenu",
    icon: FileText,
    isGroup: true,
    children: [
      {
        href: "/admin/contenu/documentation",
        label: "Documentation",
        icon: BookOpen,
      },
      {
        href: "/admin/contenu/blog",
        label: "Blog",
        icon: Newspaper,
      },
    ],
  },
];

/**
 * Composant pour les groupes de navigation collapsibles
 */
function CollapsibleNavGroup({
  item,
  Icon,
  isGroupActive,
  pathname,
}: {
  item: (typeof adminNavItems)[number];
  Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  isGroupActive: boolean;
  pathname: string;
}) {
  const [isOpen, setIsOpen] = useState(isGroupActive);

  return (
    <Collapsible.Root open={isOpen} onOpenChange={setIsOpen}>
      {/* Groupe parent (Trigger) */}
      <Collapsible.Trigger asChild>
        <Box
          px="3"
          py="2"
          style={{
            borderRadius: 8,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--gray-a3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <Flex align="center" gap="3">
            <Icon
              size={18}
              style={{
                color: isGroupActive ? "var(--violet-9)" : "var(--gray-10)",
              }}
            />
            <Text
              size="2"
              weight="medium"
              style={{
                color: isGroupActive ? "var(--violet-11)" : "var(--gray-11)",
                flex: 1,
              }}
            >
              {item.label}
            </Text>
            <ChevronDown
              size={14}
              style={{
                color: "var(--gray-9)",
                transition: "transform 0.2s ease",
                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </Flex>
        </Box>
      </Collapsible.Trigger>

      {/* Enfants du groupe (Content) */}
      <Collapsible.Content>
        <Flex
          direction="column"
          gap="1"
          mt="1"
          pl="5"
          style={{
            borderLeft: "2px solid var(--gray-a5)",
            marginLeft: 20,
          }}
        >
          {item.children?.map((child) => {
            const childActive = pathname.startsWith(child.href);
            const ChildIcon = child.icon;

            return (
              <Link
                key={child.href}
                href={child.href}
                style={{ textDecoration: "none" }}
              >
                <Box
                  px="3"
                  py="2"
                  style={{
                    borderRadius: 8,
                    background: childActive
                      ? "linear-gradient(135deg, var(--violet-a3) 0%, var(--purple-a3) 100%)"
                      : "transparent",
                    transition: "all 0.15s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!childActive) {
                      e.currentTarget.style.background = "var(--gray-a3)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!childActive) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <Flex align="center" gap="3">
                    <ChildIcon
                      size={16}
                      style={{
                        color: childActive ? "var(--violet-9)" : "var(--gray-10)",
                      }}
                    />
                    <Text
                      size="2"
                      weight={childActive ? "medium" : "regular"}
                      style={{
                        color: childActive ? "var(--violet-11)" : "var(--gray-11)",
                      }}
                    >
                      {child.label}
                    </Text>
                    {childActive ? <Box
                        style={{
                          marginLeft: "auto",
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "var(--violet-9)",
                        }}
                      /> : null}
                  </Flex>
                </Box>
              </Link>
            );
          })}
        </Flex>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isSuperAdmin } = useAuth();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Vérification du rôle SUPER_ADMIN
  useEffect(() => {
    if (!isLoading && !isSuperAdmin) {
      redirect("/dashboard");
    }
  }, [isLoading, isSuperAdmin]);

  // Loading state
  if (isLoading || !mounted) {
    return (
      <Flex
        align="center"
        justify="center"
        style={{
          height: `calc(100vh - 64px)`,
          margin: `-${PARENT_PADDING_Y}px -${PARENT_PADDING_X}px`,
          background: "var(--gray-1)"
        }}
      >
        <Flex direction="column" align="center" gap="4">
          <Box
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "linear-gradient(135deg, var(--violet-9) 0%, var(--purple-9) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 32px var(--violet-a5)",
            }}
          >
            <Shield size={32} style={{ color: "white" }} />
          </Box>
          <Spinner size="3" />
          <Text size="2" color="gray">
            Vérification des permissions...
          </Text>
        </Flex>
      </Flex>
    );
  }

  // Si pas SUPER_ADMIN, ne rien afficher (redirect en cours)
  if (!isSuperAdmin) {
    return null;
  }

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <Flex
        style={{
          // Marges négatives pour compenser le padding du parent
          margin: `-${PARENT_PADDING_Y}px -${PARENT_PADDING_X}px`,
          // Hauteur fixe pour permettre le scroll interne
          height: `calc(100vh - 64px)`, // 64px = hauteur du header principal
          background: "var(--gray-1)",
          overflow: "hidden",
        }}
      >
      {/* Sidebar Admin - Fixe, pas de scroll */}
      <Box
        style={{
          width: ADMIN_SIDEBAR_WIDTH,
          minWidth: ADMIN_SIDEBAR_WIDTH,
          borderRight: "1px solid var(--gray-a4)",
          background: "var(--color-background)",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* Header Sidebar */}
        <Box
          p="5"
          style={{
            borderBottom: "1px solid var(--gray-a4)",
            background: "linear-gradient(180deg, var(--violet-a2) 0%, transparent 100%)",
          }}
        >
          <Flex align="center" gap="3" mb="3">
            <Box
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "linear-gradient(135deg, var(--violet-9) 0%, var(--purple-9) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px var(--violet-a4)",
              }}
            >
              <Shield size={20} style={{ color: "white" }} />
            </Box>
            <Box>
              <Heading size="3" style={{ lineHeight: 1.2 }}>
                Admin Panel
              </Heading>
              <Flex align="center" gap="1" mt="1">
                <Sparkles size={12} style={{ color: "var(--violet-9)" }} />
                <Text size="1" color="gray">
                  SUPER_ADMIN
                </Text>
              </Flex>
            </Box>
          </Flex>

          {/* User info */}
          <Box
            p="3"
            style={{
              background: "var(--gray-a2)",
              borderRadius: 8,
            }}
          >
            <Text size="2" weight="medium" style={{ display: "block" }}>
              {user?.prenom} {user?.nom}
            </Text>
            <Text size="1" color="gray">
              {user?.email}
            </Text>
          </Box>
        </Box>

        {/* Navigation */}
        <Box p="3" style={{ flex: 1 }}>
          <Flex direction="column" gap="1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;

              // Si c'est un groupe avec des enfants (Collapsible)
              if (item.isGroup && item.children) {
                const isGroupActive = item.children.some((child) =>
                  pathname.startsWith(child.href)
                );

                return (
                  <CollapsibleNavGroup
                    key={item.label}
                    item={item}
                    Icon={Icon}
                    isGroupActive={isGroupActive}
                    pathname={pathname}
                  />
                );
              }

              // Item simple (non-groupe)
              const active = isActive(item.href!, item.exact);

              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  style={{ textDecoration: "none" }}
                >
                  <Box
                    px="3"
                    py="2"
                    style={{
                      borderRadius: 8,
                      background: active
                        ? "linear-gradient(135deg, var(--violet-a3) 0%, var(--purple-a3) 100%)"
                        : "transparent",
                      transition: "all 0.15s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = "var(--gray-a3)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <Flex align="center" gap="3">
                      <Icon
                        size={18}
                        style={{
                          color: active ? "var(--violet-9)" : "var(--gray-10)",
                        }}
                      />
                      <Text
                        size="2"
                        weight={active ? "medium" : "regular"}
                        style={{
                          color: active ? "var(--violet-11)" : "var(--gray-11)",
                        }}
                      >
                        {item.label}
                      </Text>
                      {active ? <Box
                          style={{
                            marginLeft: "auto",
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "var(--violet-9)",
                          }}
                        /> : null}
                    </Flex>
                  </Box>
                </Link>
              );
            })}
          </Flex>
        </Box>

        {/* Footer Sidebar */}
        <Box
          p="4"
          style={{
            borderTop: "1px solid var(--gray-a4)",
          }}
        >
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <Flex
              align="center"
              gap="2"
              p="3"
              style={{
                borderRadius: 8,
                background: "var(--gray-a2)",
                transition: "all 0.15s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--gray-a4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--gray-a2)";
              }}
            >
              <ChevronLeft size={16} style={{ color: "var(--gray-10)" }} />
              <Text size="2" color="gray">
                Retour au dashboard
              </Text>
            </Flex>
          </Link>
        </Box>
      </Box>

      {/* Main Content */}
      <Box
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* Top bar with breadcrumb - Fixed at top */}
        <Box
          px="5"
          py="3"
          style={{
            borderBottom: "1px solid var(--gray-a4)",
            background: "var(--color-background)",
            flexShrink: 0,
          }}
        >
          <Flex align="center" justify="between">
            <Flex align="center" gap="2">
              <Badge
                color="violet"
                variant="surface"
                size="1"
                style={{
                  background: "linear-gradient(135deg, var(--violet-a3) 0%, var(--purple-a3) 100%)",
                }}
              >
                <Flex align="center" gap="1">
                  <Shield size={12} />
                  SUPER_ADMIN
                </Flex>
              </Badge>
              <Text size="2" color="gray">
                •
              </Text>
              <Text size="2" color="gray">
                Gestion de contenu
              </Text>
            </Flex>

            <Text size="1" color="gray">
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </Flex>
        </Box>

        {/* Page Content - Scrollable */}
        <Box style={{ flex: 1, overflowY: "auto" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Box p="5">
                {children}
              </Box>
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>
    </Flex>
  );
}
