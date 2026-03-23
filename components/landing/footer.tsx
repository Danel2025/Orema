"use client";

import {
  Box,
  Container,
  Flex,
  Grid,
  Text,
  Separator,
} from "@radix-ui/themes";
import {
  MapPin,
  Phone,
  EnvelopeSimple,
  FacebookLogo,
  InstagramLogo,
  LinkedinLogo,
} from "@phosphor-icons/react";
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
      { label: "API", href: "/docs/api" },
      { label: "Guide de démarrage", href: "/guide" },
      { label: "FAQ", href: "/faq" },
      { label: "Blog", href: "/blog" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
  company: {
    title: "Entreprise",
    links: [
      { label: "À propos", href: "/about" },
      { label: "Partenaires", href: "/partners" },
      { label: "Carrières", href: "/careers" },
      { label: "Contact", href: "/contact" },
      { label: "Support", href: "/support" },
    ],
  },
  legal: {
    title: "Légal",
    links: [
      { label: "CGU", href: "/terms" },
      { label: "Confidentialité", href: "/privacy" },
      { label: "Mentions légales", href: "/legal" },
      { label: "Accessibilité", href: "/accessibility" },
      { label: "Statut des services", href: "/status" },
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
        background: "var(--gray-2)",
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
            <Flex direction="column" gap="5" className="lg:col-span-2">
              {/* Logo */}
              <Flex align="center" gap="3">
                <Image
                  src="/images/logos/ic-lg.webp"
                  alt="Oréma N+"
                  width={40}
                  height={40}
                  style={{ objectFit: "contain" }}
                />
                <Text size="5" weight="bold" style={{ color: "var(--gray-12)" }}>
                  Oréma N+
                </Text>
              </Flex>

              <Text
                size="2"
                style={{ color: "var(--gray-10)", maxWidth: 280, lineHeight: 1.7 }}
              >
                Système de caisse moderne conçu pour les commerces gabonais et
                africains.
              </Text>

              {/* Contact info */}
              <Flex direction="column" gap="3">
                <Flex align="center" gap="2">
                  <MapPin
                    size={14}
                    style={{ color: "var(--gray-9)", flexShrink: 0 }}
                    aria-hidden="true"
                  />
                  <Text size="2" style={{ color: "var(--gray-10)" }}>
                    Libreville, Gabon
                  </Text>
                </Flex>
                <Flex align="center" gap="2">
                  <Phone
                    size={14}
                    style={{ color: "var(--gray-9)", flexShrink: 0 }}
                    aria-hidden="true"
                  />
                  <Text size="2" style={{ color: "var(--gray-10)" }}>
                    +241 77 00 00 00
                  </Text>
                </Flex>
                <Flex align="center" gap="2">
                  <EnvelopeSimple
                    size={14}
                    style={{ color: "var(--gray-9)", flexShrink: 0 }}
                    aria-hidden="true"
                  />
                  <Text size="2" style={{ color: "var(--gray-10)" }}>
                    contact@orema-nplus.ga
                  </Text>
                </Flex>
              </Flex>

              {/* Social links */}
              <Flex gap="3">
                {socialLinks.map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    style={{
                      display: "flex",
                      width: 34,
                      height: 34,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 6,
                      color: "var(--gray-10)",
                      transition: "color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--gray-12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--gray-10)";
                    }}
                  >
                    <social.icon
                      size={18}
                      weight="regular"
                      aria-hidden="true"
                    />
                  </a>
                ))}
              </Flex>
            </Flex>

            {/* Links columns */}
            {Object.values(footerLinks).map((section, index) => (
              <Flex key={index} direction="column" gap="4">
                <Text
                  size="2"
                  weight="bold"
                  style={{ color: "var(--gray-12)", letterSpacing: "0.02em" }}
                >
                  {section.title}
                </Text>
                <Flex direction="column" gap="2">
                  {section.links.map((link, i) => (
                    <Link
                      key={i}
                      href={link.href}
                      style={{
                        textDecoration: "none",
                        fontSize: 14,
                        color: "var(--gray-10)",
                        transition: "color 0.2s ease",
                        lineHeight: 1.8,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--gray-12)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--gray-10)";
                      }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </Flex>
              </Flex>
            ))}
          </Grid>

          <Separator size="4" my="6" style={{ opacity: 0.5 }} />

          {/* Bottom bar */}
          <Flex
            direction={{ initial: "column", sm: "row" }}
            justify="between"
            align={{ initial: "start", sm: "center" }}
            gap="3"
          >
            <Text size="1" style={{ color: "var(--gray-9)" }}>
              &copy; {new Date().getFullYear()} Oréma N+. Tous droits
              réservés.
            </Text>

            <Text size="1" style={{ color: "var(--gray-9)" }}>
              Conçu au Gabon
            </Text>
          </Flex>
        </Container>
      </footer>
    </Box>
  );
}
