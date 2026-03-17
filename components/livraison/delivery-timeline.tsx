'use client';

import { Flex, Text } from '@/components/ui';
import {
  ChefHat,
  Package,
  Truck,
  Check,
  X,
  Ban,
  RotateCcw,
} from 'lucide-react';
import {
  type HistoriqueLivraison,
  type StatutLivraison,
  STATUT_LIVRAISON,
  STATUT_LIVRAISON_LABELS,
  STATUT_LIVRAISON_COLORS,
} from '@/lib/delivery';
import { formatTime, formatDate } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface DeliveryTimelineProps {
  historique: HistoriqueLivraison[];
}

// ============================================================================
// HELPERS
// ============================================================================

const STATUT_ICONS: Record<StatutLivraison, typeof Check> = {
  EN_PREPARATION: ChefHat,
  PRETE: Package,
  EN_COURS: Truck,
  LIVREE: Check,
  ECHOUEE: X,
  ANNULEE: Ban,
};

// ============================================================================
// COMPOSANT
// ============================================================================

export function DeliveryTimeline({ historique }: DeliveryTimelineProps) {
  // Trier par timestamp croissant (plus ancien en premier)
  const sorted = [...historique].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  if (sorted.length === 0) {
    return (
      <Text size="2" color="gray" style={{ textAlign: 'center', padding: 16 }}>
        Aucun historique disponible
      </Text>
    );
  }

  return (
    <div style={{ position: 'relative', paddingLeft: 28 }}>
      {/* Ligne verticale */}
      <div
        style={{
          position: 'absolute',
          left: 11,
          top: 12,
          bottom: 12,
          width: 2,
          backgroundColor: 'var(--gray-a5)',
          borderRadius: 1,
        }}
      />

      <Flex direction="column" gap="1">
        {sorted.map((entry, index) => {
          const isLast = index === sorted.length - 1;
          const color = STATUT_LIVRAISON_COLORS[entry.nouveauStatut] as string;
          const Icon = STATUT_ICONS[entry.nouveauStatut] ?? Check;
          const label = STATUT_LIVRAISON_LABELS[entry.nouveauStatut];

          return (
            <div
              key={entry.id}
              style={{
                position: 'relative',
                paddingBottom: isLast ? 0 : 16,
              }}
            >
              {/* Cercle de statut */}
              <div
                style={{
                  position: 'absolute',
                  left: -28,
                  top: 2,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: isLast
                    ? `var(--${color}-9)`
                    : `var(--${color}-a4)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1,
                }}
              >
                <Icon
                  size={12}
                  style={{
                    color: isLast ? 'white' : `var(--${color}-11)`,
                  }}
                />
              </div>

              {/* Contenu */}
              <Flex direction="column" gap="1">
                <Flex align="center" gap="2">
                  <Text size="2" weight={isLast ? 'bold' : 'medium'}>
                    {label}
                  </Text>
                </Flex>

                <Flex align="center" gap="2">
                  <Text
                    size="1"
                    color="gray"
                    style={{
                      fontFamily:
                        'var(--font-google-sans-code), ui-monospace, monospace',
                    }}
                  >
                    {formatDate(entry.timestamp)} {formatTime(entry.timestamp)}
                  </Text>
                  {entry.acteurNom ? <Text size="1" color="gray">
                      par {entry.acteurNom}
                    </Text> : null}
                </Flex>

                {entry.note ? <Text
                    size="1"
                    color="gray"
                    style={{
                      fontStyle: 'italic',
                      marginTop: 2,
                    }}
                  >
                    {entry.note}
                  </Text> : null}
              </Flex>
            </div>
          );
        })}
      </Flex>
    </div>
  );
}
