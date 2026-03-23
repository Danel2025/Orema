"use client";

/**
 * Layout Admin - Reserve au SUPER_ADMIN
 * Interface de gestion avec navigation dediee
 *
 * Note: Ce layout utilise des marges negatives pour compenser
 * le padding du DashboardShell parent (24px 32px)
 */

import { useAuth } from "@/lib/auth/context";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useMounted } from "@/hooks/use-mounted";
import { Box, Flex, Heading, Text, Badge, Spinner } from "@radix-ui/themes";
import * as Collapsible from "@radix-ui/react-collapsible";
import type { IconWeight } from "@phosphor-icons/react";
import {
  SquaresFour,
  FileText,
  BookOpenText,
  Newspaper,
  CaretLeft,
  CaretDown,
  ShieldCheck,
  Sparkle,
  Buildings,
  CreditCard,
} from "@phosphor-icons/react";
import Image from "next/image";
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
    icon: SquaresFour,
    exact: true,
  },
  {
    href: "/admin/etablissements",
    label: "Établissements",
    icon: Buildings,
  },
  {
    href: "/admin/billing",
    label: "Facturation",
    icon: CreditCard,
    exact: true,
  },
  {
    label: "Gestion du contenu",
    icon: FileText,
    isGroup: true,
    children: [
      {
        href: "/admin/contenu/documentation",
        label: "Documentation",
        icon: BookOpenText,
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
  Icon: React.ComponentType<{ size?: number; weight?: IconWeight; style?: React.CSSProperties }>;
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
              weight={isGroupActive ? "fill" : "regular"}
              style={{
                color: isGroupActive ? "var(--accent-9)" : "var(--gray-10)",
              }}
            />
            <Text
              size="2"
              weight="medium"
              style={{
                color: isGroupActive ? "var(--accent-11)" : "var(--gray-11)",
                flex: 1,
              }}
            >
              {item.label}
            </Text>
            <CaretDown
              size={14}
              weight="bold"
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
              <Link key={child.href} href={child.href} style={{ textDecoration: "none" }}>
                <Box
                  px="3"
                  py="2"
                  style={{
                    borderRadius: 8,
                    background: childActive ? "var(--accent-a3)" : "transparent",
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
                      weight={childActive ? "fill" : "regular"}
                      style={{
                        color: childActive ? "var(--accent-9)" : "var(--gray-10)",
                      }}
                    />
                    <Text
                      size="2"
                      weight={childActive ? "medium" : "regular"}
                      style={{
                        color: childActive ? "var(--accent-11)" : "var(--gray-11)",
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
                          background: "var(--accent-9)",
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isSuperAdmin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const mounted = useMounted();

  // Verification du role SUPER_ADMIN
  useEffect(() => {
    if (!isLoading && !isSuperAdmin) {
      router.push("/dashboard");
    }
  }, [isLoading, isSuperAdmin, router]);

  // Loading state
  if (isLoading || !mounted) {
    return (
      <Flex
        align="center"
        justify="center"
        style={{
          height: `calc(100vh - 64px)`,
          margin: `-${PARENT_PADDING_Y}px -${PARENT_PADDING_X}px`,
          background: "var(--gray-1)",
        }}
      >
        <Flex direction="column" align="center" gap="4">
          <Image
            src="/images/logos/ic-lg.webp"
            alt="Orema N+"
            width={64}
            height={64}
            style={{ borderRadius: 16 }}
          />
          <Spinner size="3" />
          <Text size="2" color="gray">
            Verification des permissions...
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
        margin: `-${PARENT_PADDING_Y}px -${PARENT_PADDING_X}px`,
        height: `calc(100vh - 64px)`,
        background: "var(--gray-1)",
        overflow: "hidden",
      }}
    >
      {/* Sidebar Admin */}
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
          }}
        >
          <Flex align="center" gap="3" mb="3">
            <Image
              src="/images/logos/ic-lg.webp"
              alt="Orema N+"
              width={36}
              height={36}
              style={{ borderRadius: 10 }}
            />
            <Box>
              <Heading size="3" style={{ lineHeight: 1.2 }}>
                Administration
              </Heading>
              <Flex align="center" gap="1" mt="1">
                <Sparkle size={12} weight="fill" style={{ color: "var(--accent-9)" }} />
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
        <Box p="3" style={{ flex: 1, overflowY: "auto" }}>
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
                <Link key={item.href} href={item.href!} style={{ textDecoration: "none" }}>
                  <Box
                    px="3"
                    py="2"
                    style={{
                      borderRadius: 8,
                      background: active ? "var(--accent-a3)" : "transparent",
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
                        weight={active ? "fill" : "regular"}
                        style={{
                          color: active ? "var(--accent-9)" : "var(--gray-10)",
                        }}
                      />
                      <Text
                        size="2"
                        weight={active ? "medium" : "regular"}
                        style={{
                          color: active ? "var(--accent-11)" : "var(--gray-11)",
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
                            background: "var(--accent-9)",
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
              <CaretLeft size={16} weight="bold" style={{ color: "var(--gray-10)" }} />
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
        {/* Top bar */}
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
                color="orange"
                variant="soft"
                size="1"
              >
                <Flex align="center" gap="1">
                  <ShieldCheck size={12} weight="fill" />
                  SUPER_ADMIN
                </Flex>
              </Badge>
              <Text size="2" color="gray">
                /
              </Text>
              <Text size="2" color="gray">
                {(() => {
                  const pageLabels: Record<string, string> = {
                    "/admin/etablissements": "Établissements",
                    "/admin/billing": "Facturation",
                    "/admin/contenu/blog": "Blog",
                    "/admin/contenu/documentation": "Documentation",
                    "/admin/contenu": "Gestion de contenu",
                    "/admin": "Vue d'ensemble",
                  };
                  const match = Object.keys(pageLabels)
                    .sort((a, b) => b.length - a.length)
                    .find((key) => pathname.startsWith(key));
                  return match ? pageLabels[match] : "Administration";
                })()}
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
              <Box p="5">{children}</Box>
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>
    </Flex>
  );
}
