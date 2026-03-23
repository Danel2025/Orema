"use client";

import { useState, useEffect } from "react";
import { Box, Container, Flex, Heading, Text, Button } from "@radix-ui/themes";
import {
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { FadeIn } from "./motion-wrapper";

const demoSlides = [
  {
    src: "/images/demo/02-commande-en-cours.png",
    alt: "Commande en cours avec panier",
    label: "Prise de commande",
  },
  {
    src: "/images/demo/03-encaissement.png",
    alt: "Interface d'encaissement",
    label: "Encaissement",
  },
  {
    src: "/images/demo/04-rendu-monnaie.png",
    alt: "Calcul du rendu de monnaie",
    label: "Rendu monnaie",
  },
  {
    src: "/images/demo/05-rapports.png",
    alt: "Tableau de bord des rapports",
    label: "Rapports",
  },
  {
    src: "/images/demo/07-caisse-dark-mode.png",
    alt: "Interface en mode sombre",
    label: "Mode sombre",
  },
];

export function DemoSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % demoSlides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () =>
    goToSlide((currentSlide + 1) % demoSlides.length);
  const prevSlide = () =>
    goToSlide((currentSlide - 1 + demoSlides.length) % demoSlides.length);

  return (
    <Box
      id="demo"
      py="9"
      style={{
        background: "var(--gray-a2)",
      }}
    >
      <Container size="4">
        <Flex
          direction={{ initial: "column", lg: "row" }}
          gap="8"
          align="center"
        >
          {/* Left content */}
          <Box style={{ flex: 1 }}>
            <FadeIn direction="right">
              <Flex direction="column" gap="4">
                <Text
                  size="2"
                  weight="medium"
                  style={{
                    color: "var(--accent-11)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Demo
                </Text>

                <Heading
                  size="8"
                  weight="bold"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  Voyez l'interface en action
                </Heading>

                <Text
                  size="3"
                  color="gray"
                  style={{ lineHeight: 1.7, maxWidth: 400 }}
                >
                  De la prise de commande au rapport de fin de journee. Une
                  interface pensee pour la rapidite, meme aux heures de pointe.
                </Text>

                {/* CTA */}
                <Flex gap="3" mt="2">
                  <Button size="3" asChild>
                    <a href="#pricing">Essayer gratuitement</a>
                  </Button>
                  <Button size="3" variant="outline" asChild>
                    <a href="#contact">Demander une demo</a>
                  </Button>
                </Flex>
              </Flex>
            </FadeIn>
          </Box>

          {/* Right - Demo slideshow */}
          <Box style={{ flex: 1.2 }}>
            <FadeIn direction="left" delay={0.2}>
              <Box
                className="relative overflow-hidden rounded-xl"
                style={{
                  background: "var(--color-background)",
                  border: "1px solid var(--gray-a4)",
                  boxShadow:
                    "0 20px 40px -12px rgba(0, 0, 0, 0.1), 0 0 0 1px var(--gray-a3)",
                }}
              >
                {/* Browser mockup header */}
                <Flex
                  align="center"
                  gap="2"
                  px="4"
                  py="3"
                  style={{
                    background: "var(--gray-a2)",
                    borderBottom: "1px solid var(--gray-a4)",
                  }}
                >
                  <Box
                    className="h-3 w-3 rounded-full"
                    style={{ background: "#ff5f57" }}
                  />
                  <Box
                    className="h-3 w-3 rounded-full"
                    style={{ background: "#febc2e" }}
                  />
                  <Box
                    className="h-3 w-3 rounded-full"
                    style={{ background: "#28c840" }}
                  />
                  <Flex
                    align="center"
                    gap="2"
                    className="ml-4 flex-1 rounded-md"
                    px="3"
                    py="1"
                    style={{ background: "var(--gray-a3)" }}
                  >
                    <Box
                      className="h-2 w-2 rounded-full"
                      style={{ background: "#28c840" }}
                    />
                    <Text size="1" color="gray">
                      app.orema-nplus.ga
                    </Text>
                  </Flex>
                </Flex>

                {/* Slideshow */}
                <Box className="relative" style={{ aspectRatio: "16/9" }}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlide}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={demoSlides[currentSlide].src}
                        alt={demoSlides[currentSlide].alt}
                        fill
                        className="object-cover object-top"
                        priority={currentSlide === 0}
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Navigation arrows */}
                  <button
                    onClick={prevSlide}
                    className="absolute top-1/2 left-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full transition-opacity hover:opacity-80"
                    style={{
                      background: "rgba(255,255,255,0.9)",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                    }}
                    aria-label="Diapositive precedente"
                  >
                    <CaretLeft
                      size={18}
                      weight="bold"
                      style={{ color: "var(--gray-12)" }}
                    />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute top-1/2 right-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full transition-opacity hover:opacity-80"
                    style={{
                      background: "rgba(255,255,255,0.9)",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                    }}
                    aria-label="Diapositive suivante"
                  >
                    <CaretRight
                      size={18}
                      weight="bold"
                      style={{ color: "var(--gray-12)" }}
                    />
                  </button>

                  {/* Current slide label */}
                  <Box className="absolute bottom-4 left-4">
                    <Box
                      className="rounded-md"
                      style={{
                        background: "rgba(255,255,255,0.95)",
                        backdropFilter: "blur(8px)",
                        padding: "5px 12px",
                      }}
                    >
                      <Text
                        size="1"
                        weight="medium"
                        style={{ color: "var(--gray-12)" }}
                      >
                        {demoSlides[currentSlide].label}
                      </Text>
                    </Box>
                  </Box>

                  {/* Slide indicators */}
                  <Flex
                    gap="2"
                    align="center"
                    justify="center"
                    className="absolute bottom-4 left-1/2 -translate-x-1/2"
                  >
                    {demoSlides.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: index === currentSlide ? 20 : 6,
                          background:
                            index === currentSlide
                              ? "var(--accent-9)"
                              : "rgba(255,255,255,0.6)",
                        }}
                        aria-label={`Aller a la diapositive ${index + 1}`}
                      />
                    ))}
                  </Flex>
                </Box>
              </Box>
            </FadeIn>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}
