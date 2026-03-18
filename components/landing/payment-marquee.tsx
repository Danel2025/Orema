"use client";

import { Box, Container, Flex, Text } from "@radix-ui/themes";
import Image from "next/image";
import { CreditCard, Money, Bank } from "@phosphor-icons/react";

const paymentMethods = [
  { type: "image", src: "/images/logo-airtel-money.png", alt: "Airtel Money" },
  { type: "image", src: "/images/logo-moov-money.png", alt: "Moov Money" },
  { type: "icon", icon: CreditCard, label: "Carte", color: "var(--blue-9)" },
  { type: "icon", icon: Money, label: "Espèces", color: "var(--green-9)" },
  { type: "icon", icon: Bank, label: "Virement", color: "var(--amber-9)" },
];

export function PaymentMarquee() {
  return (
    <Box
      py="5"
      style={{
        background: "var(--gray-a2)",
        borderTop: "1px solid var(--gray-a4)",
        borderBottom: "1px solid var(--gray-a4)",
      }}
    >
      <Container size="4">
        <Flex align="center" justify="center" gap="6" wrap="wrap">
          <Text size="2" color="gray" style={{ flexShrink: 0 }}>
            Paiements acceptés
          </Text>

          <Flex align="center" gap="5" wrap="wrap" justify="center">
            {paymentMethods.map((method, index) => (
              <Box
                key={index}
                style={{
                  opacity: 0.8,
                  transition: "opacity 0.2s",
                }}
                className="hover:opacity-100"
              >
                {method.type === "image" ? (
                  <Image
                    src={method.src!}
                    alt={method.alt!}
                    width={80}
                    height={28}
                    style={{ objectFit: "contain" }}
                  />
                ) : method.icon ? (
                  <Flex align="center" gap="2">
                    <method.icon size={18} weight="duotone" style={{ color: method.color }} />
                    <Text size="2" color="gray">{method.label}</Text>
                  </Flex>
                ) : null}
              </Box>
            ))}
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
}
