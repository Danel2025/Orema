"use client";

/**
 * Page Hub Gestion de Contenu
 * Point d'entrée pour la documentation et le blog
 */

import { Box, Flex, Grid, Heading, Text, Badge } from "@radix-ui/themes";
import {
  BookOpenText,
  Newspaper,
  ArrowRight,
  FileText,
  Eye,
  Plus,
} from "@phosphor-icons/react";
import Link from "next/link";
import { motion } from "motion/react";

const contentTypes = [
  {
    title: "Documentation",
    description: "Gérez les catégories et articles du centre d'aide",
    icon: BookOpenText,
    color: "blue",
    href: "/admin/contenu/documentation",
    createHref: "/admin/contenu/documentation/nouveau",
    features: [
      "Catégories organisées",
      "Articles avec markdown",
      "Temps de lecture auto",
      "SEO optimisé",
    ],
  },
  {
    title: "Blog",
    description: "Gérez les articles, auteurs et catégories du blog",
    icon: Newspaper,
    color: "violet",
    href: "/admin/contenu/blog",
    createHref: "/admin/contenu/blog/nouveau",
    features: [
      "Articles mis en avant",
      "Gestion des auteurs",
      "Tags personnalisés",
      "Images de couverture",
    ],
  },
];

export default function ContenuPage() {
  return (
    <Box>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Box mb="6">
          <Heading size="6" mb="1">
            Gestion de contenu
          </Heading>
          <Text size="3" color="gray">
            Créez et gérez le contenu public de votre plateforme Oréma N+
          </Text>
        </Box>
      </motion.div>

      {/* Content Type Cards */}
      <Grid columns={{ initial: "1", md: "2" }} gap="5">
        {contentTypes.map((type, index) => {
          const Icon = type.icon;
          return (
            <motion.div
              key={type.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
              style={{ height: "100%" }}
            >
              <Box
                style={{
                  background: "var(--color-background)",
                  borderRadius: 12,
                  border: "1px solid var(--gray-a4)",
                  overflow: "hidden",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Card Header */}
                <Box
                  p="5"
                  style={{
                    background: `var(--${type.color}-a2)`,
                    borderBottom: `1px solid var(--${type.color}-a4)`,
                  }}
                >
                  <Flex align="center" gap="4">
                    <Box
                      style={{
                        width: 48,
                        height: 48,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: `var(--${type.color}-9)`,
                        borderRadius: 8,
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={24} weight="bold" color="white" />
                    </Box>
                    <Box>
                      <Heading size="4" mb="1">
                        {type.title}
                      </Heading>
                      <Text
                        size="2"
                        style={{ color: `var(--${type.color}-11)` }}
                      >
                        {type.description}
                      </Text>
                    </Box>
                  </Flex>
                </Box>

                {/* Features */}
                <Box p="5" style={{ flex: 1 }}>
                  <Text
                    size="2"
                    color="gray"
                    weight="medium"
                    as="div"
                    mb="3"
                  >
                    Fonctionnalités
                  </Text>
                  <Flex direction="column" gap="2" mb="5">
                    {type.features.map((feature) => (
                      <Flex key={feature} align="center" gap="3">
                        <Box
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: `var(--${type.color}-9)`,
                            flexShrink: 0,
                          }}
                        />
                        <Text size="2">{feature}</Text>
                      </Flex>
                    ))}
                  </Flex>

                  {/* Actions */}
                  <Flex gap="3">
                    <Link
                      href={type.href}
                      style={{ textDecoration: "none", flex: 1 }}
                    >
                      <Flex
                        align="center"
                        justify="center"
                        gap="2"
                        style={{
                          height: 40,
                          background: `var(--${type.color}-9)`,
                          borderRadius: 8,
                          color: "white",
                          fontWeight: 600,
                          fontSize: 14,
                          cursor: "pointer",
                          transition: "opacity 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = "0.9";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = "1";
                        }}
                      >
                        <Eye size={16} weight="bold" />
                        Voir tout
                      </Flex>
                    </Link>
                    <Link
                      href={type.createHref}
                      style={{ textDecoration: "none", flex: 1 }}
                    >
                      <Flex
                        align="center"
                        justify="center"
                        gap="2"
                        style={{
                          height: 40,
                          background: `var(--${type.color}-a3)`,
                          borderRadius: 8,
                          color: `var(--${type.color}-11)`,
                          fontWeight: 600,
                          fontSize: 14,
                          cursor: "pointer",
                          border: `1px solid var(--${type.color}-a5)`,
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = `var(--${type.color}-a4)`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = `var(--${type.color}-a3)`;
                        }}
                      >
                        <Plus size={16} weight="bold" />
                        Créer
                      </Flex>
                    </Link>
                  </Flex>
                </Box>
              </Box>
            </motion.div>
          );
        })}
      </Grid>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <Box
          mt="6"
          p="5"
          style={{
            background: "var(--gray-a2)",
            borderRadius: 12,
            border: "1px solid var(--gray-a4)",
          }}
        >
          <Flex align="start" gap="4">
            <Box
              style={{
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--gray-a3)",
                borderRadius: 8,
                flexShrink: 0,
              }}
            >
              <FileText
                size={20}
                weight="duotone"
                style={{ color: "var(--gray-10)" }}
              />
            </Box>
            <Box>
              <Heading size="3" mb="2">
                À propos du contenu
              </Heading>
              <Text size="2" color="gray" as="p" style={{ lineHeight: 1.6 }}>
                Le contenu que vous créez ici sera visible sur le site public de
                votre plateforme. Vous pouvez enregistrer des brouillons et les
                publier quand vous êtes prêt. Seul le contenu avec le statut
                &quot;Publié&quot; sera visible par les visiteurs.
              </Text>
              <Flex gap="2" mt="3" wrap="wrap">
                <Badge color="green" variant="soft">
                  Publié = Visible
                </Badge>
                <Badge color="gray" variant="soft">
                  Brouillon = Masqué
                </Badge>
                <Badge color="violet" variant="soft">
                  Archivé = Masqué
                </Badge>
              </Flex>
            </Box>
          </Flex>
        </Box>
      </motion.div>
    </Box>
  );
}
