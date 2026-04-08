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
  Envelope,
  Phone,
  MapPin,
  Clock,
  PaperPlaneTilt,
  CaretRight,
  ChatCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";

const contactInfo = [
  {
    icon: Envelope,
    title: "Email",
    value: "contact@orema-nplus.ga",
    href: "mailto:contact@orema-nplus.ga",
    description: "Reponse sous 24 heures ouvrees",
  },
  {
    icon: Phone,
    title: "Téléphone",
    value: "+241 77 00 00 00",
    href: "tel:+24177000000",
    description: "Du lundi au vendredi, 8h - 18h",
  },
  {
    icon: MapPin,
    title: "Adresse",
    value: "Libreville, Gabon",
    href: null,
    description: "Quartier Louis, Boulevard Triomphal",
  },
];

const subjects = [
  "Demande d'information",
  "Demande de demonstration",
  "Support technique",
  "Partenariat commercial",
  "Facturation",
  "Autre",
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: subjects[0],
    message: "",
  });

  const mailtoLink = `mailto:contact@orema-nplus.ga?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(`Nom: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`)}`;

  return (
    <>
      <PageHeader
        title="Contactez-nous"
        subtitle="Notre equipe est disponible pour repondre a vos questions et vous accompagner."
        badge="Contact"
      />

      <Container size="4" py="9">
        {/* Contact Info Cards */}
        <Grid columns={{ initial: "1", md: "3" }} gap="4" mb="9">
          {contactInfo.map((info, index) => (
            <motion.div
              key={info.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
            >
              <Box
                p="6"
                style={{
                  background: "var(--gray-a2)",
                  borderRadius: 16,
                  border: "1px solid var(--gray-a4)",
                  height: "100%",
                }}
              >
                <Box
                  mb="4"
                  p="3"
                  style={{
                    background: "var(--accent-a3)",
                    borderRadius: 12,
                    width: "fit-content",
                  }}
                >
                  <info.icon
                    size={24}
                    weight="duotone"
                    style={{ color: "var(--accent-9)" }}
                  />
                </Box>
                <Heading size="4" mb="2">
                  {info.title}
                </Heading>
                {info.href ? (
                  <a
                    href={info.href}
                    style={{
                      color: "var(--accent-11)",
                      textDecoration: "none",
                      fontWeight: 600,
                      fontSize: 15,
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    {info.value}
                  </a>
                ) : (
                  <Text
                    size="3"
                    weight="bold"
                    style={{ display: "block", marginBottom: 8 }}
                  >
                    {info.value}
                  </Text>
                )}
                <Text size="2" color="gray">
                  {info.description}
                </Text>
              </Box>
            </motion.div>
          ))}
        </Grid>

        <Separator size="4" my="9" />

        {/* Form + Hours */}
        <Grid columns={{ initial: "1", lg: "3" }} gap="6" mb="9">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            style={{ gridColumn: "span 2" }}
          >
            <Box
              p="6"
              style={{
                background: "var(--gray-a2)",
                borderRadius: 16,
                border: "1px solid var(--gray-a4)",
              }}
            >
              <Flex align="center" gap="3" mb="6">
                <Box
                  p="3"
                  style={{
                    background: "var(--accent-a3)",
                    borderRadius: 12,
                  }}
                >
                  <PaperPlaneTilt
                    size={24}
                    weight="duotone"
                    style={{ color: "var(--accent-9)" }}
                  />
                </Box>
                <Box>
                  <Heading size="5">Envoyez-nous un message</Heading>
                  <Text size="2" color="gray">
                    Remplissez le formulaire ci-dessous
                  </Text>
                </Box>
              </Flex>

              <Flex direction="column" gap="4">
                <Grid columns={{ initial: "1", sm: "2" }} gap="4">
                  <Flex direction="column" gap="2">
                    <Text
                      as="label"
                      size="2"
                      weight="medium"
                      htmlFor="contact-name"
                    >
                      Nom complet
                    </Text>
                    <input
                      id="contact-name"
                      type="text"
                      placeholder="Votre nom"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      style={{
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: "1px solid var(--gray-a6)",
                        background: "var(--color-background)",
                        color: "var(--gray-12)",
                        fontSize: 14,
                        outline: "none",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    />
                  </Flex>

                  <Flex direction="column" gap="2">
                    <Text
                      as="label"
                      size="2"
                      weight="medium"
                      htmlFor="contact-email"
                    >
                      Adresse email
                    </Text>
                    <input
                      id="contact-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      style={{
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: "1px solid var(--gray-a6)",
                        background: "var(--color-background)",
                        color: "var(--gray-12)",
                        fontSize: 14,
                        outline: "none",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    />
                  </Flex>
                </Grid>

                <Flex direction="column" gap="2">
                  <Text
                    as="label"
                    size="2"
                    weight="medium"
                    htmlFor="contact-subject"
                  >
                    Sujet
                  </Text>
                  <select
                    id="contact-subject"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    style={{
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: "1px solid var(--gray-a6)",
                      background: "var(--color-background)",
                      color: "var(--gray-12)",
                      fontSize: 14,
                      outline: "none",
                      width: "100%",
                      boxSizing: "border-box",
                      cursor: "pointer",
                    }}
                  >
                    {subjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </Flex>

                <Flex direction="column" gap="2">
                  <Text
                    as="label"
                    size="2"
                    weight="medium"
                    htmlFor="contact-message"
                  >
                    Message
                  </Text>
                  <textarea
                    id="contact-message"
                    placeholder="Decrivez votre demande en quelques lignes..."
                    rows={5}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    style={{
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: "1px solid var(--gray-a6)",
                      background: "var(--color-background)",
                      color: "var(--gray-12)",
                      fontSize: 14,
                      outline: "none",
                      width: "100%",
                      boxSizing: "border-box",
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                </Flex>

                <a
                  href={mailtoLink}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "12px 28px",
                    borderRadius: 9999,
                    background: "var(--accent-9)",
                    color: "white",
                    fontWeight: 600,
                    fontSize: 14,
                    textDecoration: "none",
                    alignSelf: "flex-start",
                    cursor: "pointer",
                    transition: "opacity 0.2s ease",
                  }}
                >
                  <PaperPlaneTilt size={18} weight="bold" />
                  Envoyer le message
                </a>
              </Flex>
            </Box>
          </motion.div>

          {/* Hours & Info Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Flex direction="column" gap="4">
              {/* Opening Hours */}
              <Box
                p="6"
                style={{
                  background: "var(--gray-a2)",
                  borderRadius: 16,
                  border: "1px solid var(--gray-a4)",
                }}
              >
                <Flex align="center" gap="3" mb="4">
                  <Box
                    p="3"
                    style={{
                      background: "var(--accent-a3)",
                      borderRadius: 12,
                    }}
                  >
                    <Clock
                      size={24}
                      weight="duotone"
                      style={{ color: "var(--accent-9)" }}
                    />
                  </Box>
                  <Heading size="4">Horaires</Heading>
                </Flex>

                <Flex direction="column" gap="3">
                  <Flex justify="between" align="center">
                    <Text size="2" style={{ color: "var(--gray-11)" }}>
                      Lundi - Vendredi
                    </Text>
                    <Text size="2" weight="bold">
                      8h00 - 18h00
                    </Text>
                  </Flex>
                  <Box
                    style={{
                      height: 1,
                      background: "var(--gray-a4)",
                    }}
                  />
                  <Flex justify="between" align="center">
                    <Text size="2" style={{ color: "var(--gray-11)" }}>
                      Samedi
                    </Text>
                    <Text size="2" weight="bold">
                      9h00 - 13h00
                    </Text>
                  </Flex>
                  <Box
                    style={{
                      height: 1,
                      background: "var(--gray-a4)",
                    }}
                  />
                  <Flex justify="between" align="center">
                    <Text size="2" style={{ color: "var(--gray-11)" }}>
                      Dimanche
                    </Text>
                    <Text size="2" weight="bold" color="gray">
                      Ferme
                    </Text>
                  </Flex>
                </Flex>

                <Text
                  size="1"
                  color="gray"
                  mt="4"
                  style={{ display: "block" }}
                >
                  Fuseau horaire : Africa/Libreville (UTC+1)
                </Text>
              </Box>

              {/* Response Time */}
              <Box
                p="6"
                style={{
                  background: "var(--accent-a2)",
                  borderRadius: 16,
                  border: "1px solid var(--accent-a4)",
                }}
              >
                <Flex align="center" gap="3" mb="3">
                  <ChatCircle
                    size={24}
                    weight="duotone"
                    style={{ color: "var(--accent-9)" }}
                  />
                  <Text size="3" weight="bold">
                    Delai de reponse
                  </Text>
                </Flex>
                <Text
                  size="2"
                  style={{
                    color: "var(--gray-11)",
                    lineHeight: 1.7,
                    display: "block",
                  }}
                >
                  Nous nous engageons a repondre a toutes les demandes sous{" "}
                  <strong>24 heures ouvrees</strong>. Les demandes urgentes de
                  support technique sont traitees en priorite.
                </Text>
              </Box>
            </Flex>
          </motion.div>
        </Grid>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <Box
            p="8"
            style={{
              background: "var(--accent-9)",
              borderRadius: 20,
              textAlign: "center",
            }}
          >
            <Heading size="5" mb="3" style={{ color: "white" }}>
              Besoin d&apos;aide immediate ?
            </Heading>
            <Text
              size="3"
              mb="6"
              style={{
                color: "rgba(255,255,255,0.9)",
                maxWidth: 450,
                margin: "0 auto",
                display: "block",
              }}
            >
              Consultez notre centre d&apos;aide ou notre FAQ pour trouver
              rapidement des reponses a vos questions.
            </Text>
            <Flex gap="3" justify="center" wrap="wrap">
              <Link
                href="/support"
                style={{
                  textDecoration: "none",
                  background: "white",
                  color: "var(--accent-9)",
                  padding: "12px 24px",
                  borderRadius: 9999,
                  fontWeight: 600,
                  fontSize: 14,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                Centre d&apos;aide
                <CaretRight size={16} weight="bold" />
              </Link>
              <Link
                href="/faq"
                style={{
                  textDecoration: "none",
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  padding: "12px 24px",
                  borderRadius: 9999,
                  fontWeight: 600,
                  fontSize: 14,
                  border: "1px solid rgba(255,255,255,0.3)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                Consulter la FAQ
                <CaretRight size={16} weight="bold" />
              </Link>
            </Flex>
          </Box>
        </motion.div>
      </Container>
    </>
  );
}
