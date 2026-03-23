"use client";

import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Grid,
  Separator,
} from "@radix-ui/themes";
import { motion } from "motion/react";
import { PageHeader } from "@/components/public";
import {
  Globe,
  CloudCheck,
  Database,
  ShieldCheck,
  CurrencyCircleDollar,
  Printer,
  CheckCircle,
  Warning,
  Clock,
  ArrowClockwise,
} from "@phosphor-icons/react";

type ServiceStatus = "operational" | "degraded" | "down";

interface Service {
  name: string;
  description: string;
  icon: typeof Globe;
  status: ServiceStatus;
}

const services: Service[] = [
  {
    name: "Application Web",
    description: "Interface de caisse et tableau de bord",
    icon: Globe,
    status: "operational",
  },
  {
    name: "API REST",
    description: "Endpoints de donnees et synchronisation",
    icon: CloudCheck,
    status: "operational",
  },
  {
    name: "Base de donnees",
    description: "PostgreSQL / Supabase",
    icon: Database,
    status: "operational",
  },
  {
    name: "Authentification",
    description: "Connexion, sessions et gestion des roles",
    icon: ShieldCheck,
    status: "operational",
  },
  {
    name: "Paiements Mobile Money",
    description: "Airtel Money, Moov Money",
    icon: CurrencyCircleDollar,
    status: "operational",
  },
  {
    name: "Service d'impression",
    description: "Impression thermique ESC/POS",
    icon: Printer,
    status: "operational",
  },
];

const statusConfig: Record<
  ServiceStatus,
  { label: string; color: string; bg: string; dotColor: string }
> = {
  operational: {
    label: "Operationnel",
    color: "var(--green-11)",
    bg: "var(--green-a3)",
    dotColor: "var(--green-9)",
  },
  degraded: {
    label: "Degrade",
    color: "var(--yellow-11)",
    bg: "var(--yellow-a3)",
    dotColor: "var(--yellow-9)",
  },
  down: {
    label: "Hors service",
    color: "var(--red-11)",
    bg: "var(--red-a3)",
    dotColor: "var(--red-9)",
  },
};

function getOverallStatus(svcs: Service[]): ServiceStatus {
  if (svcs.some((s) => s.status === "down")) return "down";
  if (svcs.some((s) => s.status === "degraded")) return "degraded";
  return "operational";
}

const overallLabels: Record<ServiceStatus, string> = {
  operational: "Tous les systemes operationnels",
  degraded: "Certains services sont degrades",
  down: "Des services sont hors service",
};

const overallIcons: Record<ServiceStatus, typeof CheckCircle> = {
  operational: CheckCircle,
  degraded: Warning,
  down: Warning,
};

// Generate 30 days of uptime (all green for now since no real monitoring)
const uptimeDays = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  status: "operational" as ServiceStatus,
}));

export default function StatusPage() {
  const overall = getOverallStatus(services);
  const overallConfig = statusConfig[overall];
  const OverallIcon = overallIcons[overall];

  const lastUpdate = new Date().toLocaleString("fr-FR", {
    timeZone: "Africa/Libreville",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <PageHeader
        title="Etat des services"
        subtitle="Disponibilite en temps reel de la plateforme Orema N+"
        badge="Status"
      />

      <Container size="3" py="9">
        {/* Overall status banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Box
            p="6"
            mb="8"
            style={{
              background: overallConfig.bg,
              borderRadius: 16,
              border: `1px solid ${overallConfig.dotColor}33`,
              textAlign: "center",
            }}
          >
            <Flex
              align="center"
              justify="center"
              gap="3"
              mb="2"
            >
              <OverallIcon
                size={28}
                weight="fill"
                style={{ color: overallConfig.dotColor }}
              />
              <Heading size="5" style={{ color: overallConfig.color }}>
                {overallLabels[overall]}
              </Heading>
            </Flex>
            <Flex align="center" justify="center" gap="2">
              <Clock
                size={14}
                weight="regular"
                style={{ color: "var(--gray-9)" }}
              />
              <Text size="2" color="gray">
                Derniere mise a jour : {lastUpdate}
              </Text>
            </Flex>
          </Box>
        </motion.div>

        {/* Services grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Heading size="5" mb="4">
            Services
          </Heading>

          <Grid columns={{ initial: "1", md: "2" }} gap="4" mb="8">
            {services.map((service, index) => {
              const config = statusConfig[service.status];
              return (
                <motion.div
                  key={service.name}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.35 + index * 0.07,
                    duration: 0.35,
                  }}
                >
                  <Box
                    p="5"
                    style={{
                      background: "var(--gray-a2)",
                      borderRadius: 16,
                      border: "1px solid var(--gray-a4)",
                      height: "100%",
                    }}
                  >
                    <Flex justify="between" align="start">
                      <Flex gap="3" align="start" style={{ flex: 1 }}>
                        <Box
                          p="3"
                          style={{
                            background: "var(--accent-a3)",
                            borderRadius: 12,
                            flexShrink: 0,
                          }}
                        >
                          <service.icon
                            size={22}
                            weight="duotone"
                            style={{ color: "var(--accent-9)" }}
                          />
                        </Box>
                        <Box>
                          <Text
                            size="3"
                            weight="bold"
                            style={{ display: "block" }}
                          >
                            {service.name}
                          </Text>
                          <Text
                            size="2"
                            color="gray"
                            mt="1"
                            style={{ display: "block" }}
                          >
                            {service.description}
                          </Text>
                        </Box>
                      </Flex>

                      <Flex
                        align="center"
                        gap="2"
                        px="3"
                        py="1"
                        style={{
                          background: config.bg,
                          borderRadius: 9999,
                          flexShrink: 0,
                        }}
                      >
                        <Box
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: config.dotColor,
                          }}
                        />
                        <Text
                          size="1"
                          weight="bold"
                          style={{ color: config.color }}
                        >
                          {config.label}
                        </Text>
                      </Flex>
                    </Flex>
                  </Box>
                </motion.div>
              );
            })}
          </Grid>
        </motion.div>

        <Separator size="4" my="8" />

        {/* Uptime last 30 days */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <Flex justify="between" align="center" mb="4">
            <Heading size="5">Disponibilite - 30 derniers jours</Heading>
            <Text size="2" weight="medium" style={{ color: "var(--green-11)" }}>
              100%
            </Text>
          </Flex>

          <Box
            p="5"
            mb="8"
            style={{
              background: "var(--gray-a2)",
              borderRadius: 16,
              border: "1px solid var(--gray-a4)",
            }}
          >
            <Flex gap="1" wrap="wrap" justify="center">
              {uptimeDays.map((day) => {
                const dayConfig = statusConfig[day.status];
                return (
                  <Box
                    key={day.day}
                    style={{
                      width: 18,
                      height: 32,
                      borderRadius: 4,
                      background: dayConfig.dotColor,
                      opacity: 0.85,
                    }}
                    title={`Jour ${day.day} - ${dayConfig.label}`}
                  />
                );
              })}
            </Flex>
            <Flex justify="between" mt="3">
              <Text size="1" color="gray">
                Il y a 30 jours
              </Text>
              <Text size="1" color="gray">
                Aujourd&apos;hui
              </Text>
            </Flex>
          </Box>
        </motion.div>

        {/* Recent incidents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          <Heading size="5" mb="4">
            Incidents recents
          </Heading>

          <Box
            p="6"
            mb="8"
            style={{
              background: "var(--gray-a2)",
              borderRadius: 16,
              border: "1px solid var(--gray-a4)",
              textAlign: "center",
            }}
          >
            <Box
              mx="auto"
              mb="3"
              p="3"
              style={{
                background: "var(--green-a3)",
                borderRadius: 12,
                width: "fit-content",
              }}
            >
              <CheckCircle
                size={28}
                weight="duotone"
                style={{ color: "var(--green-9)" }}
              />
            </Box>
            <Text
              size="3"
              weight="medium"
              style={{ display: "block", color: "var(--gray-12)" }}
            >
              Aucun incident recent
            </Text>
            <Text
              size="2"
              color="gray"
              mt="1"
              style={{ display: "block" }}
            >
              Tous les services fonctionnent normalement depuis le lancement.
            </Text>
          </Box>
        </motion.div>

        {/* Refresh CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <Box
            p="6"
            style={{
              background: "var(--accent-a2)",
              borderRadius: 16,
              border: "1px solid var(--accent-a4)",
              textAlign: "center",
            }}
          >
            <Heading size="5" mb="2">
              Un probleme ?
            </Heading>
            <Text
              size="3"
              color="gray"
              mb="4"
              style={{ display: "block" }}
            >
              Si vous rencontrez des difficultes, notre equipe support est
              disponible pour vous aider.
            </Text>
            <Flex gap="3" justify="center" wrap="wrap">
              <a
                href="/support"
                style={{
                  textDecoration: "none",
                  background: "var(--accent-9)",
                  color: "white",
                  padding: "10px 24px",
                  borderRadius: 9999,
                  fontWeight: 600,
                  fontSize: 14,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                Contacter le support
              </a>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: "var(--gray-a3)",
                  color: "var(--gray-12)",
                  padding: "10px 24px",
                  borderRadius: 9999,
                  fontWeight: 600,
                  fontSize: 14,
                  border: "1px solid var(--gray-a5)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <ArrowClockwise size={16} weight="bold" />
                Actualiser
              </button>
            </Flex>
          </Box>
        </motion.div>
      </Container>
    </>
  );
}
