'use client'

/**
 * Modal de réinitialisation du mot de passe
 * Permet de générer ou saisir manuellement un nouveau mot de passe
 */

import { useState, useEffect } from 'react'
import {
  Dialog,
  Button,
  Flex,
  Text,
  TextField,
  Callout,
  Progress,
} from '@radix-ui/themes'
import {
  Lock,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react'
import { toast } from 'sonner'

import { resetEmployePassword } from '@/actions/employes'

interface ResetPasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: {
    id: string
    nom: string
    prenom: string
  }
  onSuccess?: () => void
}

// Génère un mot de passe aléatoire sécurisé
function generateSecurePassword(): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%&*'

  let password = ''

  // Au moins 1 de chaque type
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]

  // Compléter à 10 caractères
  const allChars = lowercase + uppercase + numbers + symbols
  for (let i = 0; i < 6; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Mélanger les caractères
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

// Calcule la force du mot de passe (0-100)
function calculatePasswordStrength(password: string): number {
  let score = 0

  if (password.length >= 8) score += 20
  if (password.length >= 10) score += 10
  if (password.length >= 12) score += 10
  if (/[a-z]/.test(password)) score += 15
  if (/[A-Z]/.test(password)) score += 15
  if (/[0-9]/.test(password)) score += 15
  if (/[!@#$%^&*()_+\-=[\]{};':"|,.<>?]/.test(password)) score += 15

  return Math.min(score, 100)
}

function getStrengthColor(strength: number): 'red' | 'violet' | 'yellow' | 'green' {
  if (strength < 30) return 'red'
  if (strength < 50) return 'violet'
  if (strength < 70) return 'yellow'
  return 'green'
}

function getStrengthLabel(strength: number): string {
  if (strength < 30) return 'Faible'
  if (strength < 50) return 'Moyen'
  if (strength < 70) return 'Bon'
  return 'Fort'
}

export function ResetPasswordModal({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: ResetPasswordModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(true)
  const [copied, setCopied] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const strength = calculatePasswordStrength(password)
  const strengthColor = getStrengthColor(strength)
  const strengthLabel = getStrengthLabel(strength)

  // Génère un mot de passe à l'ouverture
  useEffect(() => {
    if (open) {
      setPassword(generateSecurePassword())
      setSuccess(false)
      setError(null)
      setCopied(false)
    }
  }, [open])

  const handleGeneratePassword = () => {
    setPassword(generateSecurePassword())
    setError(null)
  }

  const validatePassword = (): boolean => {
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return false
    }
    if (!/[A-Z]/.test(password)) {
      setError('Le mot de passe doit contenir au moins une majuscule')
      return false
    }
    if (!/[a-z]/.test(password)) {
      setError('Le mot de passe doit contenir au moins une minuscule')
      return false
    }
    if (!/[0-9]/.test(password)) {
      setError('Le mot de passe doit contenir au moins un chiffre')
      return false
    }
    setError(null)
    return true
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!validatePassword()) return

    setIsSubmitting(true)

    try {
      const result = await resetEmployePassword({
        employeId: employee.id,
        newPassword: password,
      })

      if (result.success) {
        setSuccess(true)
        toast.success('Mot de passe réinitialisé avec succès')
        onSuccess?.()
      } else {
        toast.error(result.error || 'Erreur lors de la réinitialisation')
      }
    } catch {
      toast.error('Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Mot de passe copié dans le presse-papiers')
  }

  const handleClose = () => {
    setPassword('')
    setSuccess(false)
    setError(null)
    setCopied(false)
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Content maxWidth="450px">
        <Dialog.Title>
          <Flex align="center" gap="2">
            <Lock size={20} />
            Réinitialiser le mot de passe
          </Flex>
        </Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Définir un nouveau mot de passe pour{' '}
          <Text weight="bold">
            {employee.prenom} {employee.nom}
          </Text>
        </Dialog.Description>

        <Flex direction="column" gap="4">
          {/* Message de succès */}
          {success ? <Callout.Root color="green">
              <Callout.Icon>
                <Check size={16} />
              </Callout.Icon>
              <Callout.Text>
                <Flex direction="column" gap="2">
                  <Text>Mot de passe reinitialise avec succes :</Text>
                  <Flex align="center" gap="2">
                    <Text
                      size="3"
                      weight="bold"
                      style={{
                        fontFamily: 'var(--font-google-sans-code), monospace',
                      }}
                    >
                      {showPassword ? password : '••••••••••'}
                    </Text>
                    <Button
                      variant="ghost"
                      size="1"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </Button>
                    <Button variant="ghost" size="1" onClick={handleCopyPassword}>
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </Button>
                  </Flex>
                  <Text size="1" color="gray">
                    Communiquez ce mot de passe a l&apos;employe. Il ne sera plus
                    visible apres fermeture.
                  </Text>
                </Flex>
              </Callout.Text>
            </Callout.Root> : null}

          {/* Formulaire de saisie */}
          {!success && (
            <>
              <Flex direction="column" gap="2">
                <Flex justify="between" align="center">
                  <Text as="label" size="2" weight="medium">
                    Nouveau mot de passe
                  </Text>
                  <Button
                    type="button"
                    variant="ghost"
                    size="1"
                    onClick={handleGeneratePassword}
                  >
                    <RefreshCw size={14} />
                    Générer
                  </Button>
                </Flex>

                <Flex gap="2">
                  <TextField.Root
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="Mot de passe"
                    type={showPassword ? 'text' : 'password'}
                    size="3"
                    style={{
                      flex: 1,
                      fontFamily: 'var(--font-google-sans-code), monospace',
                    }}
                  />
                  <Button
                    variant="soft"
                    color="gray"
                    size="3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                  <Button
                    variant="soft"
                    color="gray"
                    size="3"
                    onClick={handleCopyPassword}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </Button>
                </Flex>

                {/* Indicateur de force */}
                <Flex direction="column" gap="1">
                  <Flex justify="between" align="center">
                    <Text size="1" color="gray">
                      Force du mot de passe
                    </Text>
                    <Text size="1" color={strengthColor} weight="medium">
                      {strengthLabel}
                    </Text>
                  </Flex>
                  <Progress value={strength} color={strengthColor} size="1" />
                </Flex>

                {error ? <Flex align="center" gap="1">
                    <AlertCircle size={12} style={{ color: 'var(--red-9)' }} />
                    <Text size="1" color="red">
                      {error}
                    </Text>
                  </Flex> : null}
              </Flex>

              <Callout.Root color="amber" size="1">
                <Callout.Icon>
                  <AlertCircle size={14} />
                </Callout.Icon>
                <Callout.Text size="1">
                  L&apos;employe devra utiliser ce mot de passe pour se connecter.
                  Assurez-vous de le lui communiquer de maniere securisee.
                </Callout.Text>
              </Callout.Root>
            </>
          )}
        </Flex>

        {/* Actions */}
        <Flex gap="3" mt="5" justify="end">
          <Button variant="soft" color="gray" onClick={handleClose}>
            {success ? 'Fermer' : 'Annuler'}
          </Button>
          {!success && (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || password.length < 8}
            >
              {isSubmitting ? (
                <RefreshCw className="animate-spin" size={16} />
              ) : (
                <Lock size={16} />
              )}
              Réinitialiser
            </Button>
          )}
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )
}
