"use client";

/**
 * SessionStatus - Affiche le statut de la session de caisse dans le header
 * Version epuree et compacte
 */

import { useState, useEffect } from "react";
import { Box, Flex, Text, Button, Badge, Popover, Separator, DataList } from "@radix-ui/themes";
import {
  Door,
  User,
  Money,
  TrendUp,
  Receipt,
  CreditCard,
  DeviceMobile,
  CaretDown,
  XCircle,
  SignOut,
} from "@phosphor-icons/react";
import { formatCurrency, formatTime } from "@/lib/utils";
import type { SessionActive } from "@/actions/sessions";

interface SessionStatusProps {
  session: SessionActive | null;
  onOpenSession: () => void;
  onCloseSession: () => void;
}

export function SessionStatus({ session, onOpenSession, onCloseSession }: SessionStatusProps) {
  const [duration, setDuration] = useState({ hours: 0, minutes: 0 });

  useEffect(() => {
    if (!session) return;

    const calculateDuration = () => {
      const diff = Date.now() - new Date(session.dateOuverture).getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setDuration({ hours, minutes });
    };

    calculateDuration();
    const interval = setInterval(calculateDuration, 60000);
    return () => clearInterval(interval);
  }, [session]);

  // Pas de session active - bouton simple
  if (!session) {
    return (
      <Button color="green" variant="soft" onClick={onOpenSession}>
        <Door size={16} />
        Ouvrir la caisse
      </Button>
    );
  }

  // Session active - Badge compact avec popover
  return (
    <Flex align="center" gap="2">
      <Popover.Root>
        <Popover.Trigger>
          <button
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 12px",
              backgroundColor: "var(--green-a2)",
              borderRadius: 8,
              border: "1px solid var(--green-a5)",
              cursor: "pointer",
            }}
          >
            {/* Indicateur vert pulse */}
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "var(--green-9)",
                animation: "pulse 2s infinite",
              }}
            />

            {/* Compteur ventes */}
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--gray-12)",
                fontFamily: "var(--font-google-sans-code), monospace",
              }}
            >
              {session.nombreVentes}
            </span>
            <span style={{ fontSize: 12, color: "var(--gray-10)" }}>ventes</span>

            {/* Separateur */}
            <span style={{ width: 1, height: 16, backgroundColor: "var(--gray-a5)" }} />

            {/* Total CA */}
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--green-11)",
                fontFamily: "var(--font-google-sans-code), monospace",
              }}
            >
              {formatCurrency(session.totalVentes)}
            </span>

            {/* Duree */}
            <span
              style={{
                fontSize: 11,
                color: "var(--gray-9)",
                fontFamily: "var(--font-google-sans-code), monospace",
              }}
            >
              {duration.hours}h{duration.minutes.toString().padStart(2, "0")}
            </span>

            <CaretDown size={14} color="var(--gray-9)" />
          </button>
        </Popover.Trigger>

        <Popover.Content width="300px" size="2">
          <Flex direction="column" gap="3">
            {/* Header */}
            <Flex align="center" justify="between">
              <Flex align="center" gap="2">
                <Box
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: "var(--green-a3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Receipt size={16} color="var(--green-11)" weight="bold" />
                </Box>
                <Box>
                  <Text size="2" weight="bold">
                    Session active
                  </Text>
                  <Text size="1" color="gray">
                    Depuis {formatTime(new Date(session.dateOuverture))}
                  </Text>
                </Box>
              </Flex>
            </Flex>

            <Separator size="4" />

            {/* Infos */}
            <DataList.Root size="1">
              <DataList.Item>
                <DataList.Label>
                  <Flex align="center" gap="1">
                    <User size={12} weight="bold" />
                    Caissier
                  </Flex>
                </DataList.Label>
                <DataList.Value>
                  {session.utilisateur.prenom} {session.utilisateur.nom}
                </DataList.Value>
              </DataList.Item>

              <DataList.Item>
                <DataList.Label>
                  <Flex align="center" gap="1">
                    <Money size={12} />
                    Fond de caisse
                  </Flex>
                </DataList.Label>
                <DataList.Value>
                  <Text style={{ fontFamily: "var(--font-google-sans-code), monospace" }}>
                    {formatCurrency(session.fondCaisse)}
                  </Text>
                </DataList.Value>
              </DataList.Item>

              {session.nombreAnnulations > 0 && (
                <DataList.Item>
                  <DataList.Label>
                    <Flex align="center" gap="1">
                      <XCircle size={12} />
                      Annulations
                    </Flex>
                  </DataList.Label>
                  <DataList.Value>
                    <Badge color="red" variant="soft" size="1">
                      {session.nombreAnnulations}
                    </Badge>
                  </DataList.Value>
                </DataList.Item>
              )}
            </DataList.Root>

            <Separator size="4" />

            {/* Paiements */}
            <Box>
              <Text size="1" color="gray" mb="2">
                Paiements
              </Text>
              <Flex direction="column" gap="1">
                <Flex justify="between" align="center">
                  <Flex align="center" gap="2">
                    <Money size={12} color="var(--green-10)" />
                    <Text size="1">Especes</Text>
                  </Flex>
                  <Text
                    size="1"
                    weight="medium"
                    style={{ fontFamily: "var(--font-google-sans-code), monospace" }}
                  >
                    {formatCurrency(session.totalEspeces)}
                  </Text>
                </Flex>
                <Flex justify="between" align="center">
                  <Flex align="center" gap="2">
                    <CreditCard size={12} color="var(--blue-10)" />
                    <Text size="1">Cartes</Text>
                  </Flex>
                  <Text
                    size="1"
                    weight="medium"
                    style={{ fontFamily: "var(--font-google-sans-code), monospace" }}
                  >
                    {formatCurrency(session.totalCartes)}
                  </Text>
                </Flex>
                <Flex justify="between" align="center">
                  <Flex align="center" gap="2">
                    <DeviceMobile size={12} color="var(--accent-10)" />
                    <Text size="1">Mobile Money</Text>
                  </Flex>
                  <Text
                    size="1"
                    weight="medium"
                    style={{ fontFamily: "var(--font-google-sans-code), monospace" }}
                  >
                    {formatCurrency(session.totalMobileMoney)}
                  </Text>
                </Flex>
              </Flex>
            </Box>

            <Separator size="4" />

            {/* Bouton cloturer */}
            <Button variant="soft" onClick={onCloseSession} style={{ width: "100%" }}>
              <SignOut size={14} />
              Cloturer la caisse
            </Button>
          </Flex>
        </Popover.Content>
      </Popover.Root>

      {/* Animation pulse */}
      <style jsx global>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </Flex>
  );
}
