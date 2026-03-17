'use client'

/**
 * Page de connexion rapide par PIN
 * Pour les caissiers et serveurs
 */

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { toast } from 'sonner'
import { Box, Button, Card, Flex, Heading, Text, TextField } from '@radix-ui/themes'
import { KeyRoundIcon, MailIcon, AlertCircleIcon, ArrowLeftIcon } from 'lucide-react'
import { loginWithPinSupabase, getDefaultRedirectRoute } from '@/actions/auth-supabase'
import { pinLoginSchema, type PinLoginInput } from '@/schemas/auth'

export default function PinLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [pin, setPin] = useState(['', '', '', ''])
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PinLoginInput>({
    resolver: zodResolver(pinLoginSchema),
  })

  // Focus sur le premier input au chargement
  useEffect(() => {
    inputRefs[0].current?.focus()
  }, [])

  const handlePinChange = (index: number, value: string) => {
    // Autoriser seulement les chiffres
    if (!/^\d*$/.test(value)) return

    const newPin = [...pin]
    newPin[index] = value

    setPin(newPin)
    setValue('pin', newPin.join(''))

    // Auto-focus sur le prochain input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
  }

  const onSubmit = async (data: PinLoginInput) => {
    if (pin.some((digit) => !digit)) {
      toast.error('Veuillez entrer un PIN complet')
      return
    }

    setIsLoading(true)

    try {
      const result = await loginWithPinSupabase(data)

      if (result.success) {
        toast.success('Connexion réussie')
        // Déterminer la route de redirection selon le rôle et les permissions
        const redirectResult = await getDefaultRedirectRoute()
        const redirectPath = redirectResult.success && redirectResult.data ? redirectResult.data : '/caisse'
        // Forcer un rechargement complet pour que le middleware détecte le nouveau cookie
        window.location.href = redirectPath
      } else {
        toast.error(result.error || 'Erreur de connexion')
        // Réinitialiser le PIN
        setPin(['', '', '', ''])
        inputRefs[0].current?.focus()
      }
    } catch (error) {
      toast.error('Une erreur est survenue')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      style={{ minHeight: '100vh', padding: '1rem' }}
    >
      <Card size="4" style={{ width: '100%', maxWidth: '400px' }}>
        <Flex direction="column" gap="6">
          {/* En-tête */}
          <Flex direction="column" gap="2" align="center">
            <Heading size="6" weight="bold" style={{ color: 'var(--accent-9)' }}>
              Oréma N+
            </Heading>
            <Text size="2" color="gray">
              Connexion rapide par PIN
            </Text>
          </Flex>

          {/* Formulaire */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <Flex direction="column" gap="5">
              {/* Email */}
              <Box>
                <label htmlFor="email">
                  <Text as="div" size="2" weight="medium" mb="2">
                    Email
                  </Text>
                </label>
                <TextField.Root
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  {...register('email')}
                  disabled={isLoading}
                >
                  <TextField.Slot side="left">
                    <MailIcon size={16} />
                  </TextField.Slot>
                </TextField.Root>
                {errors.email ? <Flex gap="1" align="center" mt="1">
                    <AlertCircleIcon size={14} color="var(--red-9)" />
                    <Text size="1" color="red">
                      {errors.email.message}
                    </Text>
                  </Flex> : null}
              </Box>

              {/* Code PIN */}
              <Box>
                <Flex align="center" gap="2" mb="3">
                  <KeyRoundIcon size={16} />
                  <Text size="2" weight="medium">
                    Code PIN (4 chiffres)
                  </Text>
                </Flex>

                {/* Inputs PIN */}
                <Flex gap="3" justify="center">
                  {pin.map((digit, index) => (
                    <input
                      key={index}
                      ref={inputRefs[index]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      disabled={isLoading}
                      style={{
                        width: '60px',
                        height: '70px',
                        fontSize: '32px',
                        textAlign: 'center',
                        border: '2px solid var(--gray-6)',
                        borderRadius: '8px',
                        outline: 'none',
                        transition: 'all 0.2s',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--accent-9)'
                        e.target.style.boxShadow = '0 0 0 3px var(--accent-3)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--gray-6)'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  ))}
                </Flex>

                {errors.pin ? <Flex gap="1" align="center" mt="2" justify="center">
                    <AlertCircleIcon size={14} color="var(--red-9)" />
                    <Text size="1" color="red">
                      {errors.pin.message}
                    </Text>
                  </Flex> : null}
              </Box>

              {/* Bouton de connexion */}
              <Button
                type="submit"
                size="3"
                disabled={isLoading}
                style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </Flex>
          </form>

          {/* Lien retour */}
          <Flex direction="column" gap="2" align="center">
            <Link href="/login">
              <Flex gap="2" align="center">
                <ArrowLeftIcon size={14} />
                <Text size="2" weight="medium" style={{ color: 'var(--accent-9)' }}>
                  Retour à la connexion normale
                </Text>
              </Flex>
            </Link>
          </Flex>
        </Flex>
      </Card>

      {/* Footer */}
      <Text size="1" color="gray" mt="4">
        Oréma N+ POS System © 2026
      </Text>
    </Flex>
  )
}
