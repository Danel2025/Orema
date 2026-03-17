"use client";

import { Box, Flex, Heading, Text } from "@radix-ui/themes";
import { BookOpen, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface NewsletterProps {
  title?: string;
  description?: string;
  variant?: "default" | "compact";
}

export function Newsletter({
  title = "Restez informé",
  description = "Recevez nos derniers articles et conseils directement dans votre boîte mail.",
  variant = "default",
}: NewsletterProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Veuillez entrer votre adresse email");
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Veuillez entrer une adresse email valide");
      return;
    }

    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsLoading(false);
    setIsSubscribed(true);
    setEmail("");

    toast.success("Inscription réussie !", {
      description: "Vous recevrez bientôt nos actualités.",
    });
  };

  if (variant === "compact") {
    return (
      <Box
        p="5"
        style={{
          background: "var(--gray-a2)",
          borderRadius: 16,
          border: "1px solid var(--gray-a4)",
        }}
      >
        <Heading size="4" mb="3">
          {title}
        </Heading>
        <Text size="2" color="gray" mb="4" style={{ display: "block" }}>
          {description}
        </Text>
        {isSubscribed ? (
          <Flex align="center" gap="2" style={{ color: "var(--green-9)" }}>
            <CheckCircle size={18} />
            <Text size="2" weight="medium">
              Merci pour votre inscription !
            </Text>
          </Flex>
        ) : (
          <form onSubmit={handleSubmit}>
            <Flex gap="2">
              <input
                type="email"
                placeholder="Votre email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--gray-a5)",
                  background: "var(--color-background)",
                  color: "var(--gray-12)",
                  fontSize: 14,
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  padding: "10px 18px",
                  borderRadius: 8,
                  border: "none",
                  background:
                    "linear-gradient(135deg, var(--violet-9) 0%, var(--purple-9) 100%)",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isLoading ? "wait" : "pointer",
                  opacity: isLoading ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "S'abonner"
                )}
              </button>
            </Flex>
          </form>
        )}
      </Box>
    );
  }

  return (
    <Box
      p="8"
      style={{
        background:
          "linear-gradient(135deg, var(--violet-9) 0%, var(--purple-9) 100%)",
        borderRadius: 24,
        textAlign: "center",
      }}
    >
      <BookOpen
        size={48}
        style={{ color: "white", marginBottom: 16, opacity: 0.9 }}
      />
      <Heading size="5" mb="3" style={{ color: "white" }}>
        {title}
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
        {description}
      </Text>

      {isSubscribed ? (
        <Flex
          align="center"
          justify="center"
          gap="2"
          style={{
            color: "white",
            background: "rgba(255,255,255,0.2)",
            padding: "14px 28px",
            borderRadius: 9999,
            display: "inline-flex",
          }}
        >
          <CheckCircle size={20} />
          <Text size="3" weight="medium">
            Merci pour votre inscription !
          </Text>
        </Flex>
      ) : (
        <form onSubmit={handleSubmit}>
          <Flex gap="3" justify="center" wrap="wrap">
            <input
              type="email"
              placeholder="Votre adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              style={{
                padding: "14px 20px",
                borderRadius: 9999,
                border: "none",
                background: "rgba(255,255,255,0.95)",
                color: "var(--gray-12)",
                fontSize: 14,
                width: 280,
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: "14px 28px",
                borderRadius: 9999,
                border: "none",
                background: "var(--gray-12)",
                color: "white",
                fontSize: 14,
                fontWeight: 600,
                cursor: isLoading ? "wait" : "pointer",
                opacity: isLoading ? 0.7 : 1,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Inscription...
                </>
              ) : (
                "S'abonner"
              )}
            </button>
          </Flex>
          <Text
            size="1"
            mt="4"
            style={{
              color: "rgba(255,255,255,0.7)",
              display: "block",
            }}
          >
            Pas de spam, désinscription en un clic.
          </Text>
        </form>
      )}
    </Box>
  );
}
