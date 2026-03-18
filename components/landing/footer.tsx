"use client";

import {
  Box,
  Container,
  Flex,
  Grid,
  Heading,
  Text,
  Separator,
} from "@radix-ui/themes";
import { MapPin, Phone, EnvelopeSimple, FacebookLogo, InstagramLogo, LinkedinLogo } from "@phosphor-icons/react";
import Link from "next/link";
import Image from "next/image";

const footerLinks = {
  product: {
    title: "Produit",
    links: [
      { label: "Fonctionnalités", href: "#features" },
      { label: "Tarifs", href: "#pricing" },
      { label: "Témoignages", href: "#testimonials" },
      { label: "Démo", href: "#demo" },
    ],
  },
  resources: {
    title: "Ressources",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "Guide de démarrage", href: "/guide" },
      { label: "FAQ", href: "/faq" },
      { label: "Blog", href: "/blog" },
    ],
  },
  company: {
    title: "Entreprise",
    links: [
      { label: "À propos", href: "/about" },
      { label: "Partenaires", href: "/partners" },
      { label: "Contact", href: "#contact" },
    ],
  },
  legal: {
    title: "Légal",
    links: [
      { label: "CGU", href: "/terms" },
      { label: "Confidentialité", href: "/privacy" },
      { label: "Mentions légales", href: "/legal" },
    ],
  },
};

const socialLinks = [
  { icon: FacebookLogo, href: "#", label: "Facebook" },
  { icon: InstagramLogo, href: "#", label: "Instagram" },
  { icon: LinkedinLogo, href: "#", label: "LinkedIn" },
];

export function Footer() {
  return (
    <Box
      id="contact"
      asChild
      style={{
        background: "var(--gray-1)",
        borderTop: "1px solid var(--gray-a4)",
      }}
    >
      <footer>
        <Container size="4" py="8">
          <Grid
            columns={{ initial: "1", sm: "2", lg: "6" }}
            gap={{ initial: "8", lg: "6" }}
          >
            {/* Brand column */}
            <Flex direction="column" gap="4" className="lg:col-span-2">
              {/* Logo */}
              <Flex align="center" gap="3">
                <Image
                  src="/images/logos/ic-lg.webp"
                  alt="Oréma N+"
                  width={44}
                  height={44}
                  style={{ objectFit: "contain" }}
                />
                <Heading size="5">Oréma N+</Heading>
              </Flex>

              <Text size="2" color="gray" style={{ maxWidth: 280 }}>
                Le cœur de votre commerce. Système de caisse moderne conçu pour
                l&apos;Afrique.
              </Text>

              {/* Contact info */}
              <Flex direction="column" gap="2">
                <Flex align="center" gap="2">
                  <MapPin size={14} style={{ color: "var(--gray-10)" }} aria-hidden="true" />
                  <Text size="2" color="gray">
                    Libreville, Gabon
                  </Text>
                </Flex>
                <Flex align="center" gap="2">
                  <Phone size={14} style={{ color: "var(--gray-10)" }} aria-hidden="true" />
                  <Text size="2" color="gray">
                    +241 77 00 00 00
                  </Text>
                </Flex>
                <Flex align="center" gap="2">
                  <EnvelopeSimple size={14} style={{ color: "var(--gray-10)" }} aria-hidden="true" />
                  <Text size="2" color="gray">
                    contact@orema-nplus.ga
                  </Text>
                </Flex>
              </Flex>

              {/* Social links */}
              <Flex gap="2">
                {socialLinks.map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    style={{
                      display: "flex",
                      width: 36,
                      height: 36,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 8,
                      background: "var(--gray-a3)",
                      cursor: "pointer",
                      transition: "background-color 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--gray-a4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--gray-a3)";
                    }}
                  >
                    <social.icon
                      size={16}
                      weight="fill"
                      style={{ color: "var(--gray-11)" }}
                      aria-hidden="true"
                    />
                  </a>
                ))}
              </Flex>
            </Flex>

            {/* Links columns */}
            {Object.values(footerLinks).map((section, index) => (
              <Flex key={index} direction="column" gap="4">
                <Text size="2" weight="bold">
                  {section.title}
                </Text>
                <Flex direction="column" gap="1">
                  {section.links.map((link, i) => (
                    <Link
                      key={i}
                      href={link.href}
                      style={{
                        textDecoration: "none",
                        display: "inline-block",
                        padding: "6px 10px",
                        marginLeft: "-10px",
                        borderRadius: 6,
                        fontSize: 14,
                        color: "var(--gray-11)",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--gray-a3)";
                        e.currentTarget.style.color = "var(--accent-9)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "var(--gray-11)";
                      }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </Flex>
              </Flex>
            ))}
          </Grid>

          <Separator size="4" my="6" />

          {/* Bottom bar */}
          <Flex
            direction={{ initial: "column", sm: "row" }}
            justify="between"
            align="center"
            gap="4"
          >
            <Text size="1" color="gray">
              © {new Date().getFullYear()} Oréma N+. Tous droits réservés.
            </Text>

            <Box
              px="3"
              py="1"
              className="rounded-md"
              style={{
                background: "var(--green-a3)",
                border: "1px solid var(--green-a5)",
              }}
            >
              <Flex align="center" gap="2">
                <Box
                  className="h-2 w-2 animate-pulse rounded-full"
                  style={{ background: "var(--green-9)" }}
                />
                <Text size="1" style={{ color: "var(--green-11)" }}>
                  Systèmes opérationnels
                </Text>
              </Flex>
            </Box>
          </Flex>
        </Container>
      </footer>
    </Box>
  );
}
