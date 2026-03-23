"use client";

/**
 * Bannière d'impersonation - Affichée quand le super admin
 * visualise l'application en tant qu'un établissement.
 * Position fixed en haut, z-index élevé.
 */

import { Flex, Text, Button } from "@radix-ui/themes";
import { Eye, SignOut } from "@phosphor-icons/react";
import { motion } from "motion/react";

interface ImpersonationBannerProps {
  etablissementNom: string;
  onStop: () => void;
}

export function ImpersonationBanner({
  etablissementNom,
  onStop,
}: ImpersonationBannerProps) {
  return (
    <motion.div
      initial={{ y: -48, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -48, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "linear-gradient(135deg, var(--violet-9), var(--indigo-9))",
        borderBottom: "1px solid var(--violet-10)",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
      }}
    >
      <Flex
        align="center"
        justify="between"
        px="5"
        style={{
          height: 44,
          maxWidth: 1440,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <Flex align="center" gap="3">
          <Flex
            align="center"
            justify="center"
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "rgba(255, 255, 255, 0.15)",
            }}
          >
            <Eye size={16} weight="bold" style={{ color: "white" }} />
          </Flex>
          <Text
            size="2"
            weight="medium"
            style={{ color: "white" }}
          >
            Vous visualisez l&apos;application en tant que{" "}
            <Text weight="bold" style={{ color: "white" }}>
              {etablissementNom}
            </Text>
          </Text>
        </Flex>

        <Button
          size="1"
          variant="outline"
          onClick={onStop}
          style={{
            borderColor: "rgba(255, 255, 255, 0.3)",
            color: "white",
            cursor: "pointer",
            background: "rgba(255, 255, 255, 0.1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
          }}
        >
          <SignOut size={14} weight="bold" style={{ color: "white" }} />
          Quitter le mode visualisation
        </Button>
      </Flex>
    </motion.div>
  );
}
