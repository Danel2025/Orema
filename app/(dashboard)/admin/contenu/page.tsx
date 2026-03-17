"use client";

/**
 * Page Hub Gestion de Contenu
 * Point d'entrée pour la documentation et le blog
 */

import {
  Box,
  Flex,
  Grid,
  Heading,
  Text,
  Badge,
} from "@radix-ui/themes";
import {
  BookOpen,
  Newspaper,
  ArrowRight,
  FileText,
  Eye,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";

const contentTypes = [
  {
    title: "Documentation",
    description: "Gérez les catégories et articles du centre d'aide",
    icon: BookOpen,
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
          <Heading size="6" mb="2">
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
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Box
                style={{
                  background: "var(--color-background)",
                  borderRadius: 20,
                  border: "1px solid var(--gray-a4)",
                  overflow: "hidden",
                  height: "100%",
                }}
              >
                {/* Header with gradient */}
                <Box
                  p="5"
                  style={{
                    background: `linear-gradient(135deg, var(--${type.color}-a2) 0%, var(--${type.color}-a3) 100%)`,
                    borderBottom: `1px solid var(--${type.color}-a4)`,
                  }}
                >
                  <Flex align="center" gap="4">
                    <Box
                      p="4"
                      style={{
                        background: `linear-gradient(135deg, var(--${type.color}-9) 0%, var(--${type.color}-10) 100%)`,
                        borderRadius: 14,
                        boxShadow: `0 4px 16px var(--${type.color}-a4)`,
                      }}
                    >
                      <Icon size={28} style={{ color: "white" }} />
                    </Box>
                    <Box>
                      <Heading size="5">{type.title}</Heading>
                      <Text size="2" style={{ color: `var(--${type.color}-11)` }}>
                        {type.description}
                      </Text>
                    </Box>
                  </Flex>
                </Box>

                {/* Features */}
                <Box p="5">
                  <Text size="2" color="gray" weight="medium" mb="3" style={{ display: "block" }}>
                    Fonctionnalités
                  </Text>
                  <Flex direction="column" gap="2" mb="5">
                    {type.features.map((feature) => (
                      <Flex key={feature} align="center" gap="2">
                        <Box
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: `var(--${type.color}-9)`,
                          }}
                        />
                        <Text size="2">{feature}</Text>
                      </Flex>
                    ))}
                  </Flex>

                  {/* Actions */}
                  <Flex gap="3">
                    <Link href={type.href} style={{ textDecoration: "none", flex: 1 }}>
                      <Flex
                        align="center"
                        justify="center"
                        gap="2"
                        py="3"
                        style={{
                          background: `linear-gradient(135deg, var(--${type.color}-9) 0%, var(--${type.color}-10) 100%)`,
                          borderRadius: 10,
                          color: "white",
                          fontWeight: 600,
                          fontSize: 14,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = `0 8px 20px var(--${type.color}-a4)`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <Eye size={16} />
                        Voir tout
                      </Flex>
                    </Link>
                    <Link href={type.createHref} style={{ textDecoration: "none", flex: 1 }}>
                      <Flex
                        align="center"
                        justify="center"
                        gap="2"
                        py="3"
                        style={{
                          background: `var(--${type.color}-a3)`,
                          borderRadius: 10,
                          color: `var(--${type.color}-11)`,
                          fontWeight: 600,
                          fontSize: 14,
                          cursor: "pointer",
                          border: `1px solid var(--${type.color}-a5)`,
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = `var(--${type.color}-a4)`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = `var(--${type.color}-a3)`;
                        }}
                      >
                        <Plus size={16} />
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
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Box
          mt="6"
          p="5"
          style={{
            background: "var(--gray-a2)",
            borderRadius: 16,
            border: "1px solid var(--gray-a4)",
          }}
        >
          <Flex align="start" gap="4">
            <Box
              p="3"
              style={{
                background: "var(--gray-a3)",
                borderRadius: 10,
              }}
            >
              <FileText size={20} style={{ color: "var(--gray-10)" }} />
            </Box>
            <Box>
              <Heading size="3" mb="2">
                À propos du contenu
              </Heading>
              <Text size="2" color="gray" style={{ lineHeight: 1.6 }}>
                Le contenu que vous créez ici sera visible sur le site public de votre plateforme.
                Vous pouvez enregistrer des brouillons et les publier quand vous êtes prêt.
                Seul le contenu avec le statut "Publié" sera visible par les visiteurs.
              </Text>
              <Flex gap="2" mt="3">
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
