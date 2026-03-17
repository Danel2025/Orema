import { Box, Card, Flex, Grid, Heading, Text, Badge } from "@radix-ui/themes";
import { BarChart3, Package, ShoppingCart, Users, TrendingUp, ArrowUpRight } from "lucide-react";

export default function DashboardPage() {
  const stats = [
    {
      title: "Ventes du jour",
      value: "0",
      unit: "FCFA",
      icon: ShoppingCart,
      trend: "+0%",
      color: "violet" as const,
    },
    {
      title: "Produits en stock",
      value: "0",
      unit: "articles",
      icon: Package,
      trend: "0",
      color: "blue" as const,
    },
    {
      title: "Clients",
      value: "0",
      unit: "total",
      icon: Users,
      trend: "+0",
      color: "green" as const,
    },
    {
      title: "Commandes",
      value: "0",
      unit: "aujourd'hui",
      icon: BarChart3,
      trend: "+0%",
      color: "purple" as const,
    },
  ];

  return (
    <Box>
      {/* En-tête */}
      <Box mb="6">
        <Heading size="8" mb="2">
          Tableau de bord
        </Heading>
        <Text size="3" color="gray">
          Bienvenue sur Oréma N+ - Votre système de caisse moderne
        </Text>
      </Box>

      {/* Statistiques */}
      <Grid columns={{ initial: "1", sm: "2", lg: "4" }} gap="4" mb="6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} size="3">
              <Flex direction="column" gap="3">
                <Flex align="center" justify="between">
                  <Text size="2" weight="medium" color="gray">
                    {stat.title}
                  </Text>
                  <Box
                    style={{
                      padding: "8px",
                      borderRadius: "var(--radius-3)",
                      backgroundColor: `var(--${stat.color}-3)`,
                    }}
                  >
                    <Icon
                      size={20}
                      style={{ color: `var(--${stat.color}-11)` }}
                    />
                  </Box>
                </Flex>

                <Flex direction="column" gap="1">
                  <Flex align="baseline" gap="2">
                    <Heading size="7" className="price-fcfa">
                      {stat.value}
                    </Heading>
                    <Text size="2" color="gray">
                      {stat.unit}
                    </Text>
                  </Flex>

                  <Flex align="center" gap="1">
                    <TrendingUp size={14} style={{ color: "var(--green-11)" }} />
                    <Text size="1" color="green" weight="medium">
                      {stat.trend}
                    </Text>
                    <Text size="1" color="gray">
                      vs hier
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
            </Card>
          );
        })}
      </Grid>

      {/* Message de bienvenue */}
      <Card size="4" mb="6">
        <Flex direction="column" align="center" gap="4" py="6">
          <Box
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "var(--radius-full)",
              backgroundColor: "var(--accent-3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text size="8">🎉</Text>
          </Box>

          <Flex direction="column" align="center" gap="2">
            <Heading size="6">Bienvenue sur Oréma N+</Heading>
            <Text size="3" color="gray" align="center" style={{ maxWidth: "500px" }}>
              Votre système de caisse a été configuré avec succès.
              <br />
              Vous pouvez maintenant commencer à utiliser les fonctionnalités.
            </Text>
          </Flex>

          <Grid columns={{ initial: "1", md: "3" }} gap="4" width="100%" mt="4">
            <Card variant="surface">
              <Flex direction="column" gap="3" p="4">
                <Flex align="center" gap="2">
                  <Text size="6">📦</Text>
                  <Heading size="4">Produits</Heading>
                </Flex>
                <Text size="2" color="gray">
                  Ajoutez vos produits et catégories pour commencer
                </Text>
                <Flex align="center" gap="1" style={{ color: "var(--accent-11)" }}>
                  <Text size="2" weight="medium">
                    Configurer
                  </Text>
                  <ArrowUpRight size={14} />
                </Flex>
              </Flex>
            </Card>

            <Card variant="surface">
              <Flex direction="column" gap="3" p="4">
                <Flex align="center" gap="2">
                  <Text size="6">🛒</Text>
                  <Heading size="4">Caisse</Heading>
                </Flex>
                <Text size="2" color="gray">
                  Commencez à enregistrer des ventes
                </Text>
                <Flex align="center" gap="1" style={{ color: "var(--accent-11)" }}>
                  <Text size="2" weight="medium">
                    Ouvrir
                  </Text>
                  <ArrowUpRight size={14} />
                </Flex>
              </Flex>
            </Card>

            <Card variant="surface">
              <Flex direction="column" gap="3" p="4">
                <Flex align="center" gap="2">
                  <Text size="6">📊</Text>
                  <Heading size="4">Rapports</Heading>
                </Flex>
                <Text size="2" color="gray">
                  Consultez vos statistiques de vente
                </Text>
                <Flex align="center" gap="1" style={{ color: "var(--accent-11)" }}>
                  <Text size="2" weight="medium">
                    Voir
                  </Text>
                  <ArrowUpRight size={14} />
                </Flex>
              </Flex>
            </Card>
          </Grid>
        </Flex>
      </Card>

      {/* Section activité récente (placeholder) */}
      <Grid columns={{ initial: "1", lg: "2" }} gap="4">
        <Card size="3">
          <Flex direction="column" gap="3">
            <Flex align="center" justify="between">
              <Heading size="5">Activité récente</Heading>
              <Badge variant="soft">
                Nouveau
              </Badge>
            </Flex>
            <Text size="2" color="gray">
              Aucune activité pour le moment
            </Text>
          </Flex>
        </Card>

        <Card size="3">
          <Flex direction="column" gap="3">
            <Heading size="5">Alertes stock</Heading>
            <Text size="2" color="gray">
              Aucune alerte pour le moment
            </Text>
          </Flex>
        </Card>
      </Grid>
    </Box>
  );
}
