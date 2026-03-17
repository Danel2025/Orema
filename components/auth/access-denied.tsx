'use client'

/**
 * Composant d'acces refuse
 *
 * Affiche une page d'erreur quand l'utilisateur
 * n'a pas les permissions necessaires.
 */

import Link from 'next/link'
import { Flex, Text, Button, Card, Callout } from '@radix-ui/themes'
import { ShieldX, Home, ArrowLeft, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'

interface AccessDeniedProps {
  /** Raison du refus d'acces */
  reason?: string
  /** Chemin de la route refusee */
  pathname?: string
}

/**
 * Page d'acces refuse
 *
 * Affiche un message clair a l'utilisateur et propose
 * des actions pour naviguer vers des pages accessibles.
 */
export function AccessDenied({ reason, pathname }: AccessDeniedProps) {
  const router = useRouter()
  const { user, roleInfo } = useAuth()

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      style={{ minHeight: '60vh' }}
      gap="6"
    >
      <Card size="4" style={{ maxWidth: 500, width: '100%' }}>
        <Flex direction="column" align="center" gap="4" p="4">
          {/* Icone */}
          <Flex
            align="center"
            justify="center"
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: 'var(--red-a3)',
            }}
          >
            <ShieldX size={40} style={{ color: 'var(--red-9)' }} />
          </Flex>

          {/* Titre */}
          <Flex direction="column" align="center" gap="1">
            <Text size="6" weight="bold" color="red">
              Acces refuse
            </Text>
            <Text size="2" color="gray" align="center">
              Vous n'avez pas les permissions necessaires pour acceder a cette page.
            </Text>
          </Flex>

          {/* Details */}
          {(reason || pathname || roleInfo) ? <Callout.Root color="amber" size="1" style={{ width: '100%' }}>
              <Callout.Icon>
                <AlertTriangle size={16} />
              </Callout.Icon>
              <Callout.Text>
                <Flex direction="column" gap="1">
                  {roleInfo ? <Text size="1">
                      <strong>Votre role :</strong> {roleInfo.displayName}
                    </Text> : null}
                  {pathname ? <Text size="1">
                      <strong>Page demandee :</strong> {pathname}
                    </Text> : null}
                  {reason ? <Text size="1">
                      <strong>Raison :</strong> {reason}
                    </Text> : null}
                </Flex>
              </Callout.Text>
            </Callout.Root> : null}

          {/* Actions */}
          <Flex gap="3" mt="2">
            <Button variant="soft" color="gray" onClick={() => router.back()}>
              <ArrowLeft size={16} />
              Retour
            </Button>
            <Button asChild>
              <Link href="/dashboard">
                <Home size={16} />
                Tableau de bord
              </Link>
            </Button>
          </Flex>

          {/* Message d'aide */}
          <Text size="1" color="gray" align="center" mt="2">
            Si vous pensez que c'est une erreur, contactez votre administrateur.
          </Text>
        </Flex>
      </Card>
    </Flex>
  )
}
