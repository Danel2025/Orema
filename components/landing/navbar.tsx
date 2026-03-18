"use client";

import { useState, useEffect } from "react";
import { Box, Container, Flex, Text } from "@radix-ui/themes";
import { ArrowRight, List, X } from "@phosphor-icons/react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";

const navLinks = [
  { label: "Fonctionnalités", href: "#features" },
  { label: "Tarifs", href: "#pricing" },
  { label: "Témoignages", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
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

  return (
    <>
      <Box
        asChild
        position="fixed"
        top="0"
        left="0"
        right="0"
        style={{
          zIndex: 50,
        }}
      >
        <motion.nav
          aria-label="Navigation principale"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Background avec glassmorphism */}
          <Box
            position="absolute"
            inset="0"
            className={isScrolled ? "navbar-scrolled" : ""}
            style={{
              backdropFilter: isScrolled ? "blur(16px) saturate(180%)" : "none",
              WebkitBackdropFilter: isScrolled ? "blur(16px) saturate(180%)" : "none",
              borderBottom: isScrolled
                ? "1px solid var(--gray-a4)"
                : "1px solid transparent",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />

          <Container size="4" position="relative">
            <Flex
              justify="between"
              align="center"
              py={isScrolled ? "3" : "5"}
              style={{ transition: "padding 0.4s ease" }}
            >
              {/* Logo */}
              <Link href="/" style={{ textDecoration: "none" }}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
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
                </motion.div>
              </Link>

              {/* Desktop Navigation */}
              <Flex gap="2" align="center" className="hidden lg:flex">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05, duration: 0.4 }}
                  >
                    <Link
                      href={link.href}
                      className="nav-link"
                      style={{
                        textDecoration: "none",
                        display: "inline-block",
                        padding: "10px 20px",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "var(--gray-11)",
                        transition: "background-color 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--gray-a3)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </Flex>

              {/* CTA Buttons */}
              <Flex gap="3" align="center">
                {/* Bouton Connexion */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="hidden sm:block"
                >
                  <Link
                    href="/login"
                    target="_blank"
                    style={{
                      textDecoration: "none",
                      display: "inline-block",
                      padding: "10px 20px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "var(--gray-11)",
                      transition: "background-color 0.2s ease",
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--gray-a3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    Connexion
                  </Link>
                </motion.div>

                {/* Bouton Essai Gratuit */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                >
                  <Link href="/register" target="_blank" style={{ textDecoration: "none" }}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex cursor-pointer items-center gap-2 rounded-full"
                      style={{
                        background: "var(--accent-9)",
                        color: "white",
                        padding: "10px 20px",
                      }}
                    >
                      <span className="text-sm font-medium">
                        <span className="hidden sm:inline">Essai gratuit</span>
                        <span className="sm:hidden">Essai</span>
                      </span>
                      <ArrowRight size={16} />
                    </motion.div>
                  </Link>
                </motion.div>

                {/* Mobile Menu Button */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="lg:hidden"
                >
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-[var(--gray-a3)]"
                    aria-label={isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                    aria-expanded={isMobileMenuOpen}
                  >
                    <AnimatePresence mode="wait">
                      {isMobileMenuOpen ? (
                        <motion.div
                          key="close"
                          initial={{ rotate: -90, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: 90, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <X size={20} style={{ color: "var(--gray-11)" }} aria-hidden="true" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="menu"
                          initial={{ rotate: 90, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: -90, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <List size={20} style={{ color: "var(--gray-11)" }} aria-hidden="true" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </motion.div>
              </Flex>
            </Flex>
          </Container>
        </motion.nav>
      </Box>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen ? <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed left-4 right-4 top-20 z-50 overflow-hidden rounded-2xl lg:hidden"
              style={{
                background: "var(--color-background)",
                border: "1px solid var(--gray-a4)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              }}
            >
              <Flex direction="column" p="4" gap="1">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block rounded-xl px-4 py-3 transition-colors hover:bg-[var(--gray-a3)]"
                      style={{ textDecoration: "none" }}
                    >
                      <Text size="3" weight="medium" style={{ color: "var(--gray-12)" }}>
                        {link.label}
                      </Text>
                    </Link>
                  </motion.div>
                ))}

                <Box my="2" style={{ height: 1, background: "var(--gray-a4)" }} />

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Link
                    href="/login"
                    target="_blank"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block rounded-xl px-4 py-3 transition-colors hover:bg-[var(--gray-a3)]"
                    style={{ textDecoration: "none" }}
                  >
                    <Text size="3" weight="medium" style={{ color: "var(--gray-11)" }}>
                      Connexion
                    </Text>
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <Link
                    href="/register"
                    target="_blank"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{ textDecoration: "none" }}
                  >
                    <Box
                      className="mt-2 flex items-center justify-center gap-2 rounded-xl font-medium"
                      style={{
                        background: "var(--accent-9)",
                        color: "white",
                        padding: "14px 20px",
                      }}
                    >
                      Essai gratuit
                      <ArrowRight size={16} />
                    </Box>
                  </Link>
                </motion.div>
              </Flex>
            </motion.div>
          </> : null}
      </AnimatePresence>
    </>
  );
}
