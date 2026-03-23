"use client";

import { Flex, Heading, Text, Button } from "@/components/ui";
import { Warning, SignIn } from "@phosphor-icons/react";

interface DisplayErrorProps {
  title: string;
  message: string;
  showLoginLink?: boolean;
}

export function DisplayError({ title, message, showLoginLink }: DisplayErrorProps) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      gap="5"
      style={{
        height: "100vh",
        width: "100vw",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          backgroundColor: "var(--red-a3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Warning size={40} weight="fill" style={{ color: "var(--red-9)" }} />
      </div>

      <Flex direction="column" align="center" gap="2">
        <Heading as="h1" size="7" weight="bold">
          {title}
        </Heading>
        <Text size="3" color="gray" style={{ maxWidth: 480 }}>
          {message}
        </Text>
      </Flex>

      {showLoginLink ? <Button
          variant="solid"
          color="orange"
          size="3"
          asChild
          style={{ cursor: "pointer" }}
        >
          <a href="/login">
            <SignIn size={18} weight="bold" />
            Aller a la page de connexion
          </a>
        </Button> : null}
    </Flex>
  );
}
