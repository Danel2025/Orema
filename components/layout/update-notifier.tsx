"use client";

import { useEffect, useState } from "react";
import { Flex, Text, Button } from "@radix-ui/themes";
import { ArrowsClockwise, X } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";

type UpdateStatus = "idle" | "available" | "downloading" | "error";

type UpdateRef = Awaited<ReturnType<typeof import("@tauri-apps/plugin-updater").check>>;

export function UpdateNotifier() {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [updateRef, setUpdateRef] = useState<UpdateRef>(null);
  const [version, setVersion] = useState("");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Ne rien faire si on n'est pas en mode Tauri
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window === "undefined" || !(window as any).__TAURI_INTERNALS__) {
      return;
    }

    let cancelled = false;

    async function checkForUpdate() {
      try {
        const { check } = await import("@tauri-apps/plugin-updater");
        const result = await check();

        if (cancelled) return;

        if (result) {
          setUpdateRef(result);
          setVersion(result.version);
          setStatus("available");
        }
      } catch {
        // Silencieux — ne pas bloquer l'utilisation du POS
      }
    }

    checkForUpdate();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleUpdate() {
    if (!updateRef) return;

    setStatus("downloading");

    try {
      await updateRef.downloadAndInstall();
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
    } catch {
      setStatus("error");
      // Revenir à l'état "disponible" après 3 secondes
      setTimeout(() => setStatus("available"), 3000);
    }
  }

  function handleDismiss() {
    setDismissed(true);
  }

  const visible = status === "available" || status === "downloading" || status === "error";

  return (
    <AnimatePresence>
      {visible && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            zIndex: 50,
            maxWidth: 380,
          }}
        >
          <Flex
            align="center"
            gap="3"
            p="3"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--gray-a6)",
              borderRadius: 10,
              boxShadow:
                "0 4px 12px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Flex align="center" gap="2" style={{ flex: 1, minWidth: 0 }}>
              <ArrowsClockwise
                size={18}
                weight="bold"
                style={{ color: "var(--accent-9)", flexShrink: 0 }}
              />
              <Text size="2" weight="medium" truncate>
                {status === "downloading"
                  ? "Téléchargement en cours..."
                  : status === "error"
                    ? "Erreur de mise à jour"
                    : `Mise à jour v${version} disponible`}
              </Text>
            </Flex>

            <Flex gap="2" align="center" style={{ flexShrink: 0 }}>
              {status === "available" && (
                <>
                  <Button
                    variant="outline"
                    size="1"
                    color="gray"
                    onClick={handleDismiss}
                  >
                    Plus tard
                  </Button>
                  <Button
                    variant="solid"
                    size="1"
                    onClick={handleUpdate}
                  >
                    Mettre à jour
                  </Button>
                </>
              )}

              {status === "downloading" && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <ArrowsClockwise size={16} weight="bold" style={{ color: "var(--accent-9)" }} />
                </motion.div>
              )}

              {status === "error" && (
                <Button
                  variant="ghost"
                  size="1"
                  color="gray"
                  onClick={handleDismiss}
                >
                  <X size={14} />
                </Button>
              )}
            </Flex>
          </Flex>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
