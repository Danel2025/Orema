"use client";

import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
} from "@radix-ui/themes";
import { ArrowRight, RocketLaunch } from "@phosphor-icons/react";
import Link from "next/link";
import { motion } from "motion/react";
import { FadeIn } from "./motion-wrapper";

export function Testimonials() {
  return (
    <Box
      id="testimonials"
      py="9"
      style={{ background: "var(--color-background)" }}
    >
      <Container size="4">
        {/* CTA Section */}
        <FadeIn>
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden"
            style={{
              padding: 48,
              borderRadius: 24,
              background:
                "var(--accent-9)",
            }}
          >
            {/* Pattern overlay */}
            <Box
              className="pointer-events-none absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />

            <Flex
              direction="column"
              align="center"
              gap="6"
              className="relative z-10"
              style={{ textAlign: "center" }}
            >
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                <Flex
                  align="center"
                  justify="center"
                  className="rounded-full"
                  style={{
                    width: 56,
                    height: 56,
                    background: "rgba(255,255,255,0.2)",
                  }}
                >
                  <RocketLaunch size={28} weight="fill" style={{ color: "white" }} />
                </Flex>
              </motion.div>

              <Flex direction="column" gap="3" align="center">
                <Heading size="7" style={{ color: "white" }}>
                  Pret a moderniser votre commerce ?
                </Heading>
                <Text
                  size="4"
                  style={{
                    color: "rgba(255,255,255,0.9)",
                    maxWidth: 480,
                  }}
                >
                  Orema N+ est concu pour les commerces gabonais.
                  Simple, fiable et adapte a vos besoins. Testez gratuitement.
                </Text>
              </Flex>

              <Flex gap="3">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/register"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "white",
                      color: "var(--accent-9)",
                      padding: "14px 28px",
                      borderRadius: 9999,
                      fontWeight: 600,
                      fontSize: 15,
                      textDecoration: "none",
                    }}
                  >
                    Essayer gratuitement
                    <ArrowRight size={16} />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="#contact"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "transparent",
                      color: "white",
                      padding: "14px 28px",
                      borderRadius: 9999,
                      fontWeight: 600,
                      fontSize: 15,
                      textDecoration: "none",
                      border: "2px solid rgba(255, 255, 255, 0.8)",
                    }}
                  >
                    Nous contacter
                  </Link>
                </motion.div>
              </Flex>
            </Flex>
          </motion.div>
        </FadeIn>
      </Container>
    </Box>
  );
}
