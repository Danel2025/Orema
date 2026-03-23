/**
 * Page de démonstration du Design System
 * Affiche tous les composants disponibles avec exemples
 */

"use client";

import {
  Box,
  Flex,
  Grid,
  Heading,
  Text,
  Button,
  Badge,
  Avatar,
  IconButton,
  Separator,
  Card,
} from "@/components/ui";
import { StatCard, StatusBadge, EmptyState, DashboardCard } from "@/components/composed";
import {
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Plus,
  Edit,
  Trash,
  Settings,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/design-system";

export default function DesignSystemPage() {
  return (
    <Flex direction="column" gap="8">
      {/* Header */}
      <Box>
        <Heading as="h1" size="8" weight="bold">
          Design System
        </Heading>
        <Text size="3" color="gray" mt="2">
          Bibliothèque de composants Radix UI Themes pour Oréma N+
        </Text>
      </Box>

      {/* Typography */}
      <Box>
        <Heading as="h2" size="6" mb="4">
          Typographie
        </Heading>
        <Card>
          <Flex direction="column" gap="4" p="5">
            <Box>
              <Text size="1" color="gray" mb="2">
                Headings
              </Text>
              <Flex direction="column" gap="3">
                <Heading as="h1" size="9">
                  Heading 9 - Extra Large
                </Heading>
                <Heading as="h2" size="7">
                  Heading 7 - Large
                </Heading>
                <Heading as="h3" size="5">
                  Heading 5 - Medium
                </Heading>
                <Heading as="h4" size="3">
                  Heading 3 - Small
                </Heading>
              </Flex>
            </Box>

            <Separator size="4" />

            <Box>
              <Text size="1" color="gray" mb="2">
                Text Sizes
              </Text>
              <Flex direction="column" gap="2">
                <Text size="5">Text size 5 - Extra large</Text>
                <Text size="4">Text size 4 - Large</Text>
                <Text size="3">Text size 3 - Medium</Text>
                <Text size="2">Text size 2 - Default</Text>
                <Text size="1">Text size 1 - Small</Text>
              </Flex>
            </Box>

            <Separator size="4" />

            <Box>
              <Text size="1" color="gray" mb="2">
                Text Weights
              </Text>
              <Flex direction="column" gap="2">
                <Text weight="bold" size="3">
                  Bold text
                </Text>
                <Text weight="medium" size="3">
                  Medium text
                </Text>
                <Text weight="regular" size="3">
                  Regular text
                </Text>
                <Text weight="light" size="3">
                  Light text
                </Text>
              </Flex>
            </Box>

            <Separator size="4" />

            <Box>
              <Text size="1" color="gray" mb="2">
                Monospace (Prix FCFA)
              </Text>
              <Text size="6" weight="bold" className="font-mono">
                {formatCurrency(1500000)}
              </Text>
            </Box>
          </Flex>
        </Card>
      </Box>

      {/* Buttons */}
      <Box>
        <Heading as="h2" size="6" mb="4">
          Boutons
        </Heading>
        <Card>
          <Flex direction="column" gap="5" p="5">
            <Box>
              <Text size="1" color="gray" mb="3">
                Variants
              </Text>
              <Flex gap="3" wrap="wrap">
                <Button variant="solid" color="violet">
                  Solid
                </Button>
                <Button variant="soft" color="violet">
                  Soft
                </Button>
                <Button variant="outline" color="violet">
                  Outline
                </Button>
                <Button variant="ghost" color="violet">
                  Ghost
                </Button>
              </Flex>
            </Box>

            <Separator size="4" />

            <Box>
              <Text size="1" color="gray" mb="3">
                Colors
              </Text>
              <Flex gap="3" wrap="wrap">
                <Button color="violet">Orange</Button>
                <Button color="blue">Blue</Button>
                <Button color="green">Green</Button>
                <Button color="red">Red</Button>
                <Button color="amber">Amber</Button>
                <Button color="gray">Gray</Button>
              </Flex>
            </Box>

            <Separator size="4" />

            <Box>
              <Text size="1" color="gray" mb="3">
                Sizes
              </Text>
              <Flex gap="3" align="center" wrap="wrap">
                <Button size="1" color="violet">
                  Small
                </Button>
                <Button size="2" color="violet">
                  Medium
                </Button>
                <Button size="3" color="violet">
                  Large
                </Button>
                <Button size="4" color="violet">
                  Extra Large
                </Button>
              </Flex>
            </Box>

            <Separator size="4" />

            <Box>
              <Text size="1" color="gray" mb="3">
                Icon Buttons
              </Text>
              <Flex gap="3" wrap="wrap">
                <IconButton variant="solid" color="violet">
                  <Plus size={18} />
                </IconButton>
                <IconButton variant="soft" color="blue">
                  <Edit size={18} />
                </IconButton>
                <IconButton variant="outline" color="red">
                  <Trash size={18} />
                </IconButton>
                <IconButton variant="ghost" color="gray">
                  <Settings size={18} />
                </IconButton>
              </Flex>
            </Box>
          </Flex>
        </Card>
      </Box>

      {/* Badges */}
      <Box>
        <Heading as="h2" size="6" mb="4">
          Badges
        </Heading>
        <Card>
          <Flex direction="column" gap="5" p="5">
            <Box>
              <Text size="1" color="gray" mb="3">
                Variants
              </Text>
              <Flex gap="3" wrap="wrap">
                <Badge variant="solid" color="violet">
                  Solid
                </Badge>
                <Badge variant="soft" color="violet">
                  Soft
                </Badge>
                <Badge variant="outline" color="violet">
                  Outline
                </Badge>
              </Flex>
            </Box>

            <Separator size="4" />

            <Box>
              <Text size="1" color="gray" mb="3">
                Status Badges
              </Text>
              <Flex gap="2" wrap="wrap">
                <StatusBadge status="active" />
                <StatusBadge status="inactive" />
                <StatusBadge status="pending" />
                <StatusBadge status="success" />
                <StatusBadge status="error" />
                <StatusBadge status="warning" />
              </Flex>
            </Box>

            <Separator size="4" />

            <Box>
              <Text size="1" color="gray" mb="3">
                Table Status
              </Text>
              <Flex gap="2" wrap="wrap">
                <StatusBadge status="free" />
                <StatusBadge status="occupied" />
                <StatusBadge status="in-preparation" />
                <StatusBadge status="bill-requested" />
                <StatusBadge status="needs-cleaning" />
              </Flex>
            </Box>
          </Flex>
        </Card>
      </Box>

      {/* Stat Cards */}
      <Box>
        <Heading as="h2" size="6" mb="4">
          Stat Cards
        </Heading>
        <Grid columns={{ initial: "1", sm: "2", lg: "4" }} gap="4">
          <StatCard
            title="Ventes du jour"
            value={formatCurrency(125000)}
            icon={ShoppingCart}
            color="violet"
            trend={{ value: "+12%", isPositive: true }}
          />
          <StatCard title="Produits" value="48" icon={Package} color="blue" />
          <StatCard
            title="Clients"
            value="156"
            icon={Users}
            color="green"
            trend={{ value: "-3%", isPositive: false }}
          />
          <StatCard title="Commandes" value="23" icon={BarChart3} color="purple" />
        </Grid>
      </Box>

      {/* Dashboard Cards */}
      <Box>
        <Heading as="h2" size="6" mb="4">
          Dashboard Cards
        </Heading>
        <Grid columns={{ initial: "1", lg: "2" }} gap="4">
          <DashboardCard
            title="Exemple avec contenu"
            description="Card avec header et actions"
            icon={Package}
            action={{
              icon: Settings,
              onClick: () => alert("Action clicked"),
              label: "Paramètres",
            }}
          >
            <Text size="2" color="gray">
              Voici un exemple de contenu dans une DashboardCard. Vous pouvez mettre n'importe quel
              composant ici.
            </Text>
          </DashboardCard>

          <DashboardCard
            title="Exemple avec Empty State"
            description="Aucune donnée disponible"
            icon={AlertCircle}
          >
            <EmptyState
              icon={Package}
              title="Aucune donnée"
              description="Cet exemple montre un état vide avec action."
              action={{
                label: "Ajouter des données",
                onClick: () => alert("Action clicked"),
              }}
            />
          </DashboardCard>
        </Grid>
      </Box>

      {/* Avatars */}
      <Box>
        <Heading as="h2" size="6" mb="4">
          Avatars
        </Heading>
        <Card>
          <Flex direction="column" gap="5" p="5">
            <Box>
              <Text size="1" color="gray" mb="3">
                Sizes
              </Text>
              <Flex gap="3" align="center">
                <Avatar fallback="A" size="1" color="violet" />
                <Avatar fallback="B" size="2" color="blue" />
                <Avatar fallback="C" size="3" color="green" />
                <Avatar fallback="D" size="4" color="purple" />
                <Avatar fallback="E" size="5" color="red" />
              </Flex>
            </Box>

            <Separator size="4" />

            <Box>
              <Text size="1" color="gray" mb="3">
                Colors
              </Text>
              <Flex gap="3">
                <Avatar fallback="O" color="violet" size="3" />
                <Avatar fallback="B" color="blue" size="3" />
                <Avatar fallback="G" color="green" size="3" />
                <Avatar fallback="R" color="red" size="3" />
                <Avatar fallback="A" color="amber" size="3" />
              </Flex>
            </Box>
          </Flex>
        </Card>
      </Box>

      {/* Colors */}
      <Box>
        <Heading as="h2" size="6" mb="4">
          Système de couleurs
        </Heading>
        <Card>
          <Flex direction="column" gap="5" p="5">
            <Box>
              <Text size="1" color="gray" mb="3">
                Accent Principal - Violet
              </Text>
              <Flex gap="2" wrap="wrap">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((scale) => (
                  <Box
                    key={scale}
                    style={{
                      width: 60,
                      height: 60,
                      backgroundColor: `var(--violet-${scale})`,
                      borderRadius: "var(--radius-2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      size="1"
                      weight="bold"
                      style={{
                        color: scale > 6 ? "white" : "var(--gray-12)",
                      }}
                    >
                      {scale}
                    </Text>
                  </Box>
                ))}
              </Flex>
            </Box>

            <Separator size="4" />

            <Box>
              <Text size="1" color="gray" mb="3">
                Gris - Slate
              </Text>
              <Flex gap="2" wrap="wrap">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((scale) => (
                  <Box
                    key={scale}
                    style={{
                      width: 60,
                      height: 60,
                      backgroundColor: `var(--gray-${scale})`,
                      borderRadius: "var(--radius-2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      size="1"
                      weight="bold"
                      style={{
                        color: scale > 6 ? "white" : "var(--gray-12)",
                      }}
                    >
                      {scale}
                    </Text>
                  </Box>
                ))}
              </Flex>
            </Box>
          </Flex>
        </Card>
      </Box>
    </Flex>
  );
}
