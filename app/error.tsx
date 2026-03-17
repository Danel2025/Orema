'use client'

import { useEffect } from 'react'
import { Button, Flex, Heading, Text, Container } from '@radix-ui/themes'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log uniquement le digest (jamais la stack trace ou les details internes)
    console.error('Application error:', error.digest || 'unknown')
  }, [error])

  return (
    <Container size="2" py="9">
      <Flex direction="column" align="center" gap="4">
        <Heading size="6" color="red">
          Une erreur est survenue
        </Heading>
        <Text size="3" color="gray" align="center">
          Nous nous excusons pour la gene occasionnee.
        </Text>
        {error.digest ? <Text size="1" color="gray">
            Ref: {error.digest}
          </Text> : null}
        <Flex gap="3">
          <Button onClick={reset} variant="solid" color="violet">
            Reessayer
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
          >
            Accueil
          </Button>
        </Flex>
      </Flex>
    </Container>
  )
}
