"use client";

import { useState, useEffect } from "react";
import { Box, Container, Flex, Heading, Text, Button } from "@radix-ui/themes";
import { Play, Monitor, Smartphone, Tablet, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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

  const nextSlide = () => goToSlide((currentSlide + 1) % demoSlides.length);
  const prevSlide = () => goToSlide((currentSlide - 1 + demoSlides.length) % demoSlides.length);

  return (
    <Box
      id="demo"
      py="9"
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, var(--gray-a2) 0%, var(--color-background) 100%)",
      }}
    >
      {/* Background decoration */}
      <Box
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, var(--violet-a3), transparent 50%),
                            radial-gradient(circle at 80% 50%, var(--purple-a3), transparent 50%)`,
        }}
      />

      <Container size="4" className="relative z-10">
        <Flex
          direction={{ initial: "column", lg: "row" }}
          gap="8"
          align="center"
        >
          {/* Left content */}
          <Box style={{ flex: 1 }}>
            <FadeIn direction="right">
              <Flex direction="column" gap="5">
                <Box
                  className="w-fit rounded-full"
                  style={{
                    background: "var(--violet-a3)",
                    border: "1px solid var(--violet-a5)",
                    padding: "8px 18px",
                  }}
                >
                  <Flex align="center" gap="2">
                    <Play size={14} style={{ color: "var(--violet-9)", flexShrink: 0 }} />
                    <Text
                      size="2"
                      weight="medium"
                      style={{ color: "var(--violet-11)" }}
                    >
                      Démo interactive
                    </Text>
                  </Flex>
                </Box>

                <Heading size="8">
                  Voyez Oréma N+ en action
                </Heading>

                <Text size="3" color="gray" style={{ lineHeight: 1.7 }}>
                  Découvrez comment notre système de caisse peut transformer
                  votre quotidien. Une interface pensée pour la rapidité et
                  la simplicité, même aux heures de pointe.
                </Text>

                {/* Device compatibility */}
                <Flex gap="4" mt="2">
                  {[
                    { icon: Monitor, label: "Desktop" },
                    { icon: Tablet, label: "Tablette" },
                    { icon: Smartphone, label: "Mobile" },
                  ].map((device, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ y: -2 }}
                      className="flex items-center gap-2 rounded-lg"
                      style={{
                        background: "var(--gray-a3)",
                        border: "1px solid var(--gray-a4)",
                        padding: "8px 12px",
                      }}
                    >
                      <device.icon size={16} style={{ color: "var(--gray-10)", flexShrink: 0 }} />
                      <Text size="1" color="gray">
                        {device.label}
                      </Text>
                    </motion.div>
                  ))}
                </Flex>

                {/* CTA */}
                <Flex gap="3" mt="2">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button size="3" asChild>
                      <a href="#pricing">
                        Essayer gratuitement
                      </a>
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button size="3" variant="outline" asChild>
                      <a href="#contact">
                        Demander une démo
                      </a>
                    </Button>
                  </motion.div>
                </Flex>
              </Flex>
            </FadeIn>
          </Box>

          {/* Right - Demo slideshow */}
          <Box style={{ flex: 1.2 }}>
            <FadeIn direction="left" delay={0.2}>
              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                {/* Video container */}
                <Box
                  className="relative overflow-hidden rounded-2xl"
                  style={{
                    background: "var(--color-background)",
                    border: "1px solid var(--gray-a4)",
                    boxShadow:
                      "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px var(--gray-a3)",
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
                    <Box className="h-3 w-3 rounded-full" style={{ background: "#ff5f57" }} />
                    <Box className="h-3 w-3 rounded-full" style={{ background: "#febc2e" }} />
                    <Box className="h-3 w-3 rounded-full" style={{ background: "#28c840" }} />
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
                        transition={{ duration: 0.5 }}
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
                      className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-110"
                      style={{
                        background: "rgba(255,255,255,0.9)",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                      }}
                    >
                      <ChevronLeft size={20} style={{ color: "var(--gray-12)" }} />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-110"
                      style={{
                        background: "rgba(255,255,255,0.9)",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                      }}
                    >
                      <ChevronRight size={20} style={{ color: "var(--gray-12)" }} />
                    </button>

                    {/* Current slide label */}
                    <Box className="absolute bottom-4 left-4">
                      <Box
                        className="rounded-full"
                        style={{
                          background: "rgba(255,255,255,0.95)",
                          backdropFilter: "blur(10px)",
                          padding: "6px 14px",
                        }}
                      >
                        <Text size="1" weight="medium" style={{ color: "var(--gray-12)" }}>
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
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: index === currentSlide ? 24 : 8,
                            background: index === currentSlide
                              ? "var(--violet-9)"
                              : "rgba(255,255,255,0.7)",
                          }}
                        />
                      ))}
                    </Flex>
                  </Box>
                </Box>

                {/* Glow effect */}
                <Box
                  className="pointer-events-none absolute -inset-4 -z-10 rounded-3xl opacity-30 blur-3xl"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--violet-6) 0%, var(--purple-6) 100%)",
                  }}
                />
              </motion.div>
            </FadeIn>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}
