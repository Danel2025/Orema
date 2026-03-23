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
  Code,
  Key,
  ArrowsClockwise,
  Lightning,
  Shield,
  Warning,
  CaretRight,
  CopySimple,
} from "@phosphor-icons/react";
import Link from "next/link";

const endpoints = [
  {
    category: "Produits",
    icon: Code,
    items: [
      {
        method: "GET",
        url: "/api/produits",
        description: "Lister tous les produits avec pagination et filtres.",
        response: `{
  "data": [
    {
      "id": "prod_abc123",
      "nom": "Poulet braise",
      "prix": 5000,
      "categorie": "Plats",
      "disponible": true,
      "tva": 18
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}`,
      },
      {
        method: "GET",
        url: "/api/produits/:id",
        description:
          "Recuperer les details complets d'un produit par son identifiant.",
        response: `{
  "id": "prod_abc123",
  "nom": "Poulet braise",
  "prix": 5000,
  "description": "Poulet braise avec bananes plantains",
  "categorie": "Plats",
  "disponible": true,
  "tva": 18,
  "stock": 25,
  "createdAt": "2025-01-15T10:30:00Z"
}`,
      },
      {
        method: "POST",
        url: "/api/produits",
        description: "Créer un nouveau produit dans le catalogue.",
        response: `{
  "id": "prod_def456",
  "nom": "Jus de gingembre",
  "prix": 1500,
  "categorie": "Boissons",
  "disponible": true,
  "tva": 18,
  "message": "Produit cree avec succes"
}`,
      },
    ],
  },
  {
    category: "Ventes",
    icon: ArrowsClockwise,
    items: [
      {
        method: "GET",
        url: "/api/ventes",
        description:
          "Lister les ventes avec filtres par date, statut et mode de paiement.",
        response: `{
  "data": [
    {
      "id": "vnt_xyz789",
      "numero": "2025031500001",
      "montantTTC": 12500,
      "statut": "VALIDEE",
      "paiements": ["ESPECES"],
      "date": "2025-03-15T14:22:00Z"
    }
  ],
  "total": 156,
  "page": 1
}`,
      },
      {
        method: "POST",
        url: "/api/ventes",
        description:
          "Enregistrer une nouvelle vente avec ses lignes et paiements.",
        response: `{
  "id": "vnt_new001",
  "numero": "2025031500002",
  "montantHT": 10593,
  "montantTVA": 1907,
  "montantTTC": 12500,
  "statut": "VALIDEE",
  "message": "Vente enregistree avec succes"
}`,
      },
    ],
  },
  {
    category: "Clients",
    icon: Shield,
    items: [
      {
        method: "GET",
        url: "/api/clients",
        description:
          "Lister les clients avec recherche par nom, telephone ou email.",
        response: `{
  "data": [
    {
      "id": "cli_abc123",
      "nom": "Jean Ndong",
      "telephone": "+241 077 12 34 56",
      "pointsFidelite": 250,
      "totalAchats": 125000
    }
  ],
  "total": 89,
  "page": 1
}`,
      },
      {
        method: "GET",
        url: "/api/clients/:id",
        description:
          "Recuperer le profil complet d'un client avec son historique.",
        response: `{
  "id": "cli_abc123",
  "nom": "Jean Ndong",
  "telephone": "+241 077 12 34 56",
  "email": "jean.ndong@email.ga",
  "pointsFidelite": 250,
  "totalAchats": 125000,
  "derniereVisite": "2025-03-14T18:00:00Z"
}`,
      },
    ],
  },
  {
    category: "Rapports",
    icon: Lightning,
    items: [
      {
        method: "GET",
        url: "/api/rapports/ventes",
        description:
          "Obtenir les statistiques de ventes par periode (jour, semaine, mois).",
        response: `{
  "periode": "2025-03-15",
  "totalVentes": 45,
  "chiffreAffaires": 562500,
  "moyenneParVente": 12500,
  "topProduits": [
    { "nom": "Poulet braise", "quantite": 23 },
    { "nom": "Biere Castel", "quantite": 67 }
  ]
}`,
      },
      {
        method: "GET",
        url: "/api/rapports/z",
        description:
          "Générer le rapport Z (clôture de caisse) pour une session donnée.",
        response: `{
  "sessionId": "sess_abc123",
  "dateOuverture": "2025-03-15T08:00:00Z",
  "dateFermeture": "2025-03-15T22:00:00Z",
  "totalVentes": 45,
  "chiffreAffaires": 562500,
  "especes": 350000,
  "mobileMoney": 162500,
  "cartes": 50000,
  "ecart": 0
}`,
      },
    ],
  },
];

const errorCodes = [
  {
    code: "400",
    label: "Bad Request",
    description: "La requete est mal formee ou des parametres sont manquants.",
  },
  {
    code: "401",
    label: "Unauthorized",
    description: "Cle API manquante ou invalide.",
  },
  {
    code: "403",
    label: "Forbidden",
    description:
      "Vous n'avez pas les permissions pour acceder a cette ressource.",
  },
  {
    code: "404",
    label: "Not Found",
    description: "La ressource demandee n'existe pas.",
  },
  {
    code: "500",
    label: "Internal Server Error",
    description: "Erreur interne du serveur. Contactez le support si le probleme persiste.",
  },
];

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    GET: { bg: "var(--green-a3)", text: "var(--green-11)" },
    POST: { bg: "var(--blue-a3)", text: "var(--blue-11)" },
    PUT: { bg: "var(--orange-a3)", text: "var(--orange-11)" },
    DELETE: { bg: "var(--red-a3)", text: "var(--red-11)" },
  };

  const style = colors[method] || colors.GET;

  return (
    <Box
      px="3"
      py="1"
      style={{
        background: style.bg,
        borderRadius: 6,
        display: "inline-block",
        flexShrink: 0,
      }}
    >
      <Text size="2" weight="bold" style={{ color: style.text, fontFamily: "monospace" }}>
        {method}
      </Text>
    </Box>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <Box
      mt="3"
      p="4"
      style={{
        background: "var(--gray-12)",
        color: "var(--gray-1)",
        borderRadius: 8,
        fontFamily: "monospace",
        fontSize: 13,
        lineHeight: 1.6,
        overflow: "auto",
        whiteSpace: "pre",
      }}
    >
      {code}
    </Box>
  );
}

export default function ApiDocsPage() {
  return (
    <>
      <PageHeader
        badge="API"
        title="Documentation API"
        subtitle="Integrez Orema N+ a vos systemes existants grace a notre API RESTful."
      />

      <Container size="4" py="9">
        {/* Authentication */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Box
            mb="8"
            p="6"
            style={{
              background: "var(--accent-a2)",
              borderRadius: 16,
              border: "1px solid var(--accent-a4)",
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
                <Key
                  size={24}
                  weight="duotone"
                  style={{ color: "var(--accent-9)" }}
                />
              </Box>
              <Heading size="5">Authentification</Heading>
            </Flex>
            <Text
              size="3"
              style={{ color: "var(--gray-11)", lineHeight: 1.8, display: "block" }}
            >
              Toutes les requetes a l&apos;API doivent inclure votre cle API dans
              l&apos;en-tete <code>Authorization</code>. Les cles API sont associees a
              votre etablissement et peuvent etre generees depuis le panneau{" "}
              <strong>Parametres &gt; API</strong> de votre tableau de bord.
            </Text>

            <CodeBlock
              code={`// En-tete d'authentification
Authorization: Bearer votre_cle_api_ici

// Exemple avec cURL
curl -X GET https://api.orema-nplus.ga/api/produits \\
  -H "Authorization: Bearer sk_live_abc123def456" \\
  -H "Content-Type: application/json"`}
            />
          </Box>
        </motion.div>

        {/* Endpoints */}
        {endpoints.map((section, sectionIndex) => (
          <motion.div
            key={section.category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + sectionIndex * 0.1, duration: 0.5 }}
          >
            <Box mb="8">
              <Flex align="center" gap="3" mb="5">
                <Box
                  p="3"
                  style={{
                    background: "var(--accent-a3)",
                    borderRadius: 12,
                  }}
                >
                  <section.icon
                    size={24}
                    weight="duotone"
                    style={{ color: "var(--accent-9)" }}
                  />
                </Box>
                <Heading size="6">{section.category}</Heading>
              </Flex>

              <Flex direction="column" gap="4">
                {section.items.map((endpoint) => (
                  <Box
                    key={`${endpoint.method}-${endpoint.url}`}
                    p="5"
                    style={{
                      background: "var(--gray-a2)",
                      borderRadius: 16,
                      border: "1px solid var(--gray-a4)",
                    }}
                  >
                    <Flex align="center" gap="3" mb="3" wrap="wrap">
                      <MethodBadge method={endpoint.method} />
                      <Text
                        size="3"
                        weight="bold"
                        style={{ fontFamily: "monospace" }}
                      >
                        {endpoint.url}
                      </Text>
                    </Flex>
                    <Text
                      size="2"
                      style={{ color: "var(--gray-11)", display: "block" }}
                    >
                      {endpoint.description}
                    </Text>
                    <Text
                      size="2"
                      weight="medium"
                      mt="3"
                      style={{ color: "var(--gray-10)", display: "block" }}
                    >
                      Exemple de reponse :
                    </Text>
                    <CodeBlock code={endpoint.response} />
                  </Box>
                ))}
              </Flex>
            </Box>
          </motion.div>
        ))}

        <Separator size="4" my="8" />

        {/* Rate Limits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <Box
            mb="8"
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
                <ArrowsClockwise
                  size={24}
                  weight="duotone"
                  style={{ color: "var(--accent-9)" }}
                />
              </Box>
              <Heading size="5">Limites de requetes</Heading>
            </Flex>

            <Grid columns={{ initial: "1", md: "2" }} gap="4">
              <Box
                p="4"
                style={{
                  background: "var(--gray-a2)",
                  borderRadius: 12,
                  border: "1px solid var(--gray-a3)",
                }}
              >
                <Text size="2" weight="bold" style={{ display: "block" }} mb="1">
                  Limite standard
                </Text>
                <Text
                  size="6"
                  weight="bold"
                  style={{ color: "var(--accent-9)", display: "block" }}
                >
                  100 req/min
                </Text>
                <Text
                  size="2"
                  color="gray"
                  mt="2"
                  style={{ display: "block" }}
                >
                  Par cle API et par etablissement
                </Text>
              </Box>

              <Box
                p="4"
                style={{
                  background: "var(--gray-a2)",
                  borderRadius: 12,
                  border: "1px solid var(--gray-a3)",
                }}
              >
                <Text size="2" weight="bold" style={{ display: "block" }} mb="1">
                  Depassement
                </Text>
                <Text
                  size="6"
                  weight="bold"
                  style={{ color: "var(--orange-9)", display: "block" }}
                >
                  429
                </Text>
                <Text
                  size="2"
                  color="gray"
                  mt="2"
                  style={{ display: "block" }}
                >
                  Too Many Requests — reessayez apres le delai indique dans{" "}
                  <code>Retry-After</code>
                </Text>
              </Box>
            </Grid>

            <CodeBlock
              code={`// En-tetes de rate limiting dans la reponse
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1710504000
Retry-After: 30  // Present uniquement en cas de 429`}
            />
          </Box>
        </motion.div>

        {/* Error Codes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <Box
            mb="8"
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
                <Warning
                  size={24}
                  weight="duotone"
                  style={{ color: "var(--accent-9)" }}
                />
              </Box>
              <Heading size="5">Codes d&apos;erreur</Heading>
            </Flex>

            <Flex direction="column" gap="3">
              {errorCodes.map((error) => (
                <Flex
                  key={error.code}
                  align="center"
                  gap="4"
                  p="4"
                  style={{
                    background: "var(--gray-a2)",
                    borderRadius: 12,
                    border: "1px solid var(--gray-a3)",
                  }}
                >
                  <Box
                    px="3"
                    py="1"
                    style={{
                      background:
                        error.code === "500"
                          ? "var(--red-a3)"
                          : error.code === "401" || error.code === "403"
                            ? "var(--orange-a3)"
                            : "var(--gray-a3)",
                      borderRadius: 6,
                      flexShrink: 0,
                    }}
                  >
                    <Text
                      size="2"
                      weight="bold"
                      style={{
                        fontFamily: "monospace",
                        color:
                          error.code === "500"
                            ? "var(--red-11)"
                            : error.code === "401" || error.code === "403"
                              ? "var(--orange-11)"
                              : "var(--gray-11)",
                      }}
                    >
                      {error.code}
                    </Text>
                  </Box>
                  <Box style={{ flex: 1 }}>
                    <Text size="2" weight="bold" style={{ display: "block" }}>
                      {error.label}
                    </Text>
                    <Text size="2" color="gray">
                      {error.description}
                    </Text>
                  </Box>
                </Flex>
              ))}
            </Flex>

            <CodeBlock
              code={`// Structure d'une reponse d'erreur
{
  "error": {
    "code": 401,
    "message": "Cle API invalide ou expiree",
    "type": "UNAUTHORIZED",
    "timestamp": "2025-03-15T14:22:00Z"
  }
}`}
            />
          </Box>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          <Box
            p="8"
            style={{
              background: "var(--accent-9)",
              borderRadius: 20,
              textAlign: "center",
            }}
          >
            <Flex justify="center" mb="4">
              <Box
                p="3"
                style={{
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: 12,
                }}
              >
                <CopySimple size={28} weight="duotone" style={{ color: "white" }} />
              </Box>
            </Flex>
            <Heading size="6" mb="3" style={{ color: "white" }}>
              Pret a integrer Orema N+ ?
            </Heading>
            <Text
              size="4"
              mb="6"
              style={{
                color: "rgba(255,255,255,0.9)",
                maxWidth: 500,
                margin: "0 auto",
                display: "block",
              }}
            >
              Contactez-nous pour obtenir vos cles API et commencer
              l&apos;integration avec vos systemes.
            </Text>
            <Flex gap="3" justify="center" wrap="wrap">
              <Link
                href="mailto:api@orema-nplus.ga"
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
                Obtenir mes cles API
                <CaretRight size={16} weight="bold" />
              </Link>
              <Link
                href="/docs"
                style={{
                  textDecoration: "none",
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  padding: "12px 24px",
                  borderRadius: 9999,
                  fontWeight: 600,
                  fontSize: 14,
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              >
                Documentation generale
              </Link>
            </Flex>
          </Box>
        </motion.div>
      </Container>
    </>
  );
}
