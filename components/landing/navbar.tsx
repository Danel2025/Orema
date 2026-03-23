"use client";

import { useState, useEffect } from "react";
import { Box, Container, Flex, Text } from "@radix-ui/themes";
import { List, X } from "@phosphor-icons/react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const navLinks = [
  { label: "Fonctionnalités", href: "/#features" },
  { label: "Tarifs", href: "/#pricing" },
  { label: "À propos", href: "/about" },
  { label: "Documentation", href: "/docs" },
  { label: "FAQ", href: "/faq" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <Box
        asChild
        position="fixed"
        top="0"
        left="0"
        right="0"
        style={{ zIndex: 50 }}
      >
        <nav aria-label="Navigation principale">
          {/* Background with subtle glassmorphism */}
          <Box
            position="absolute"
            inset="0"
            style={{
              backgroundColor: isScrolled
                ? "color-mix(in srgb, var(--color-background) 85%, transparent)"
                : "transparent",
              backdropFilter: isScrolled ? "blur(12px) saturate(150%)" : "none",
              WebkitBackdropFilter: isScrolled
                ? "blur(12px) saturate(150%)"
                : "none",
              borderBottom: isScrolled
                ? "1px solid var(--gray-a3)"
                : "1px solid transparent",
              transition: "all 0.3s ease",
            }}
          />

          <Container size="4" position="relative">
            <Flex
              justify="between"
              align="center"
              py={isScrolled ? "3" : "4"}
              style={{ transition: "padding 0.3s ease" }}
            >
              {/* Logo */}
              <Link href="/" style={{ textDecoration: "none" }}>
                <Flex align="center" gap="3">
                  <Image
                    src="/images/logos/ic-lg.webp"
                    alt="Oréma N+"
                    width={36}
                    height={36}
                    style={{ objectFit: "contain" }}
                  />
                  <Text
                    size="5"
                    weight="bold"
                    className="hidden sm:block"
                    style={{ color: "var(--gray-12)", letterSpacing: "-0.02em" }}
                  >
                    Oréma N+
                  </Text>
                </Flex>
              </Link>

              {/* Desktop Navigation */}
              <Flex gap="1" align="center" className="hidden lg:flex">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{
                      textDecoration: "none",
                      display: "inline-block",
                      padding: "8px 16px",
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 500,
                      color: "var(--gray-11)",
                      transition: "color 0.2s ease, background-color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--gray-12)";
                      e.currentTarget.style.backgroundColor = "var(--gray-a3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--gray-11)";
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </Flex>

              {/* CTA Buttons */}
              <Flex gap="2" align="center">
                <ThemeToggle />
                {/* Connexion - outline style */}
                <Link
                  href="/login"
                  className="hidden sm:inline-flex"
                  style={{
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "8px 18px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--gray-11)",
                    border: "1px solid var(--gray-a5)",
                    transition:
                      "color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--gray-12)";
                    e.currentTarget.style.borderColor = "var(--gray-a7)";
                    e.currentTarget.style.backgroundColor = "var(--gray-a2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--gray-11)";
                    e.currentTarget.style.borderColor = "var(--gray-a5)";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  Connexion
                </Link>

                {/* Commencer - solid accent */}
                <Link
                  href="/register"
                  style={{
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 20px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "white",
                    backgroundColor: "var(--accent-9)",
                    transition:
                      "background-color 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--accent-10)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--accent-9)";
                  }}
                >
                  <span className="hidden sm:inline">Commencer</span>
                  <span className="sm:hidden">Essai</span>
                </Link>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-[var(--gray-a3)] lg:hidden"
                  aria-label={
                    isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"
                  }
                  aria-expanded={isMobileMenuOpen}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {isMobileMenuOpen ? (
                    <X
                      size={20}
                      style={{ color: "var(--gray-11)" }}
                      aria-hidden="true"
                    />
                  ) : (
                    <List
                      size={20}
                      style={{ color: "var(--gray-11)" }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              </Flex>
            </Flex>
          </Container>
        </nav>
      </Box>

      {/* Mobile Menu */}
      {isMobileMenuOpen ? <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ transition: "opacity 0.2s ease" }}
          />

          {/* Menu Panel */}
          <div
            className="fixed top-16 right-4 left-4 z-50 overflow-hidden rounded-xl lg:hidden"
            style={{
              background: "var(--color-background)",
              border: "1px solid var(--gray-a4)",
              boxShadow:
                "0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 0 0 1px var(--gray-a3)",
            }}
          >
            <Flex direction="column" p="3" gap="1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block rounded-lg px-4 py-3 transition-colors hover:bg-[var(--gray-a3)]"
                  style={{ textDecoration: "none" }}
                >
                  <Text
                    size="3"
                    weight="medium"
                    style={{ color: "var(--gray-12)" }}
                  >
                    {link.label}
                  </Text>
                </Link>
              ))}

              <Box
                my="2"
                style={{ height: 1, background: "var(--gray-a4)" }}
              />

              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-3 transition-colors hover:bg-[var(--gray-a3)]"
                style={{ textDecoration: "none" }}
              >
                <Text
                  size="3"
                  weight="medium"
                  style={{ color: "var(--gray-11)" }}
                >
                  Connexion
                </Text>
              </Link>

              <Link
                href="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ textDecoration: "none" }}
              >
                <Box
                  className="mt-1 flex items-center justify-center rounded-lg font-medium"
                  style={{
                    background: "var(--accent-9)",
                    color: "white",
                    padding: "12px 20px",
                    fontSize: 14,
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  Commencer
                </Box>
              </Link>
            </Flex>
          </div>
        </> : null}
    </>
  );
}
