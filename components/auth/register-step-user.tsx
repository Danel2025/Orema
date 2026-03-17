'use client'

/**
 * Étape 1 du wizard d'inscription: Informations utilisateur
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Button, Flex, Text, TextField } from '@radix-ui/themes'
import {
  MailIcon,
  LockIcon,
  UserIcon,
  AlertCircleIcon,
  EyeIcon,
  EyeOffIcon,
} from 'lucide-react'
import { useState } from 'react'
import {
  registerUserSchema,
  type RegisterUserInput,
} from '@/schemas/register.schema'

interface RegisterStepUserProps {
  onSubmit: (data: RegisterUserInput) => void
  defaultValues?: Partial<RegisterUserInput>
  isLoading?: boolean
}

export function RegisterStepUser({
  onSubmit,
  defaultValues,
  isLoading = false,
}: RegisterStepUserProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterUserInput>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      email: defaultValues?.email || '',
      password: defaultValues?.password || '',
      confirmPassword: defaultValues?.confirmPassword || '',
      nom: defaultValues?.nom || '',
      prenom: defaultValues?.prenom || '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Flex direction="column" gap="4">
        {/* Prénom */}
        <Box>
          <label htmlFor="prenom">
            <Text as="div" size="2" weight="medium" mb="2">
              Prénom <Text color="red">*</Text>
            </Text>
          </label>
          <TextField.Root
            id="prenom"
            type="text"
            placeholder="Jean"
            autoComplete="given-name"
            {...register('prenom')}
            disabled={isLoading}
          >
            <TextField.Slot side="left">
              <UserIcon size={16} />
            </TextField.Slot>
          </TextField.Root>
          {errors.prenom ? <Flex gap="1" align="center" mt="1">
              <AlertCircleIcon size={14} color="var(--red-9)" />
              <Text size="1" color="red">
                {errors.prenom.message}
              </Text>
            </Flex> : null}
        </Box>

        {/* Nom */}
        <Box>
          <label htmlFor="nom">
            <Text as="div" size="2" weight="medium" mb="2">
              Nom <Text color="red">*</Text>
            </Text>
          </label>
          <TextField.Root
            id="nom"
            type="text"
            placeholder="Dupont"
            autoComplete="family-name"
            {...register('nom')}
            disabled={isLoading}
          >
            <TextField.Slot side="left">
              <UserIcon size={16} />
            </TextField.Slot>
          </TextField.Root>
          {errors.nom ? <Flex gap="1" align="center" mt="1">
              <AlertCircleIcon size={14} color="var(--red-9)" />
              <Text size="1" color="red">
                {errors.nom.message}
              </Text>
            </Flex> : null}
        </Box>

        {/* Email */}
        <Box>
          <label htmlFor="email">
            <Text as="div" size="2" weight="medium" mb="2">
              Email <Text color="red">*</Text>
            </Text>
          </label>
          <TextField.Root
            id="email"
            type="email"
            placeholder="votre@email.com"
            autoComplete="email"
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

        {/* Mot de passe */}
        <Box>
          <label htmlFor="password">
            <Text as="div" size="2" weight="medium" mb="2">
              Mot de passe <Text color="red">*</Text>
            </Text>
          </label>
          <TextField.Root
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Min. 8 caractères"
            autoComplete="new-password"
            {...register('password')}
            disabled={isLoading}
          >
            <TextField.Slot side="left">
              <LockIcon size={16} />
            </TextField.Slot>
            <TextField.Slot side="right">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                }}
              >
                {showPassword ? (
                  <EyeOffIcon size={16} color="var(--gray-9)" />
                ) : (
                  <EyeIcon size={16} color="var(--gray-9)" />
                )}
              </button>
            </TextField.Slot>
          </TextField.Root>
          {errors.password ? <Flex gap="1" align="center" mt="1">
              <AlertCircleIcon size={14} color="var(--red-9)" />
              <Text size="1" color="red">
                {errors.password.message}
              </Text>
            </Flex> : null}
          <Text size="1" color="gray" mt="1">
            Majuscule, minuscule et chiffre requis
          </Text>
        </Box>

        {/* Confirmation mot de passe */}
        <Box>
          <label htmlFor="confirmPassword">
            <Text as="div" size="2" weight="medium" mb="2">
              Confirmer le mot de passe <Text color="red">*</Text>
            </Text>
          </label>
          <TextField.Root
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirmez votre mot de passe"
            autoComplete="new-password"
            {...register('confirmPassword')}
            disabled={isLoading}
          >
            <TextField.Slot side="left">
              <LockIcon size={16} />
            </TextField.Slot>
            <TextField.Slot side="right">
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                }}
              >
                {showConfirmPassword ? (
                  <EyeOffIcon size={16} color="var(--gray-9)" />
                ) : (
                  <EyeIcon size={16} color="var(--gray-9)" />
                )}
              </button>
            </TextField.Slot>
          </TextField.Root>
          {errors.confirmPassword ? <Flex gap="1" align="center" mt="1">
              <AlertCircleIcon size={14} color="var(--red-9)" />
              <Text size="1" color="red">
                {errors.confirmPassword.message}
              </Text>
            </Flex> : null}
        </Box>

        {/* Bouton suivant */}
        <Button
          type="submit"
          size="3"
          disabled={isLoading}
          style={{ cursor: isLoading ? 'not-allowed' : 'pointer', marginTop: '0.5rem' }}
        >
          Continuer
        </Button>
      </Flex>
    </form>
  )
}
