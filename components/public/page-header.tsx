"use client";

import { Box, Container, Heading, Text } from "@radix-ui/themes";
import { motion } from "motion/react";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  children?: ReactNode;
  align?: "left" | "center";
}

export function PageHeader({
  title,
  subtitle,
  badge,
  children,
  align = "center",
}: PageHeaderProps) {
  return (
    <Box
      position="relative"
      style={{
        background:
          "linear-gradient(180deg, var(--accent-2) 0%, var(--color-background) 100%)",
        overflow: "hidden",
      }}
    >
      {/* Subtle decorative gradient */}
      <Box
        position="absolute"
        aria-hidden="true"
        style={{
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, var(--accent-a3) 0%, transparent 70%)",
          top: -300,
          right: -200,
          pointerEvents: "none",
        }}
      />

      <Container size="3" py="9" position="relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: align }}
        >
          {badge ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <Box
                mb="4"
                px="4"
                py="2"
                style={{
                  display: "inline-block",
                  background: "var(--accent-a3)",
                  border: "1px solid var(--accent-a5)",
                  borderRadius: 9999,
                }}
              >
                <Text
                  size="2"
                  weight="medium"
                  style={{ color: "var(--accent-11)" }}
                >
                  {badge}
                </Text>
              </Box>
            </motion.div>
          ) : null}

          <Heading
            size="9"
            weight="bold"
            mb="4"
            style={{
              background:
                "linear-gradient(135deg, var(--gray-12) 0%, var(--gray-11) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {title}
          </Heading>

          {subtitle ? (
            <Text
              size="5"
              color="gray"
              style={{
                maxWidth: 600,
                margin: align === "center" ? "0 auto" : undefined,
                display: "block",
              }}
            >
              {subtitle}
            </Text>
          ) : null}

          {children ? <Box mt="6">{children}</Box> : null}
        </motion.div>
      </Container>
    </Box>
  );
}
