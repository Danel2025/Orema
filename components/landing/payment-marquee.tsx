"use client";

import { Box, Container, Flex, Text } from "@radix-ui/themes";
import Image from "next/image";
import { CreditCard, Money, Bank } from "@phosphor-icons/react";

const paymentMethods = [
  { type: "image" as const, src: "/images/logo-airtel-money.png", alt: "Airtel Money" },
  { type: "image" as const, src: "/images/logo-moov-money.png", alt: "Moov Money" },
  { type: "icon" as const, icon: CreditCard, label: "Carte bancaire", color: "var(--blue-9)" },
  { type: "icon" as const, icon: Money, label: "Espèces", color: "var(--green-9)" },
  { type: "icon" as const, icon: Bank, label: "Virement", color: "var(--gray-9)" },
];

export function PaymentMarquee() {
  return (
    <Box
      py="5"
      style={{
        background: "var(--gray-a2)",
        borderTop: "1px solid var(--gray-a3)",
        borderBottom: "1px solid var(--gray-a3)",
      }}
    >
      <Container size="4">
        <Flex
          align="center"
          justify="center"
          gap={{ initial: "4", sm: "6" }}
          wrap="wrap"
        >
          <Text
            size="2"
            weight="medium"
            style={{
              color: "var(--gray-9)",
              flexShrink: 0,
              letterSpacing: "0.02em",
            }}
          >
            Paiements acceptés
          </Text>

          <Box
            style={{
              width: 1,
              height: 20,
              background: "var(--gray-a4)",
              flexShrink: 0,
            }}
            className="hidden sm:block"
          />

          <Flex
            align="center"
            gap={{ initial: "4", sm: "6" }}
            wrap="wrap"
            justify="center"
          >
            {paymentMethods.map((method, index) => (
              <Flex key={index} align="center" gap="2" style={{ opacity: 0.7 }}>
                {method.type === "image" ? (
                  <Image
                    src={method.src}
                    alt={method.alt}
                    width={72}
                    height={24}
                    style={{ objectFit: "contain" }}
                  />
                ) : (
                  <>
                    <method.icon
                      size={16}
                      weight="regular"
                      style={{ color: method.color }}
                    />
                    <Text size="2" style={{ color: "var(--gray-10)" }}>
                      {method.label}
                    </Text>
                  </>
                )}
              </Flex>
            ))}
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
}
