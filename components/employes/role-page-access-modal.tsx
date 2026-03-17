'use client'

/**
 * Modal de configuration des pages autorisées par rôle
 * Permet aux admins de définir quelles pages chaque rôle peut voir
 */

import { useState, useEffect } from 'react'
import {
  Dialog,
  Button,
  Flex,
  Text,
  Checkbox,
  Badge,
  Separator,
  Tabs,
  Callout,
  Switch,
} from '@radix-ui/themes'
import {
  Loader2,
  Save,
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  Package,
  Warehouse,
  Users,
  UserCircle,
  BarChart3,
  Settings,
  Info,
  RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'
import { ROLE_LABELS, ROLE_COLORS, type RoleType } from '@/schemas/employe'

interface PageConfig {
  path: string
  label: string
  description: string
  icon: React.ComponentType<{ size?: number }>
}

const AVAILABLE_PAGES: PageConfig[] = [
  {
    path: '/',
    label: 'Tableau de bord',
    description: 'Vue globale de l\'activite',
    icon: LayoutDashboard,
  },
  {
    path: '/caisse',
    label: 'Caisse',
    description: 'Point de vente et encaissement',
    icon: ShoppingCart,
  },
  {
    path: '/salle',
    label: 'Plan de salle',
    description: 'Gestion des tables et service',
    icon: UtensilsCrossed,
  },
  {
    path: '/produits',
    label: 'Produits',
    description: 'Catalogue des produits',
    icon: Package,
  },
  {
    path: '/stocks',
    label: 'Stocks',
    description: 'Gestion des stocks et inventaire',
    icon: Warehouse,
  },
  {
    path: '/clients',
    label: 'Clients',
    description: 'Fichier clients et fidelite',
    icon: Users,
  },
  {
    path: '/employes',
    label: 'Employes',
    description: 'Gestion du personnel',
    icon: UserCircle,
  },
  {
    path: '/rapports',
    label: 'Rapports',
    description: 'Statistiques et analyses',
    icon: BarChart3,
  },
  {
    path: '/parametres',
    label: 'Parametres',
    description: 'Configuration du systeme',
    icon: Settings,
  },
]

// Rôles non-admin configurables
const CONFIGURABLE_ROLES: RoleType[] = ['MANAGER', 'CAISSIER', 'SERVEUR']

interface RoleConfig {
  useCustomAccess: boolean
  allowedRoutes: string[]
}

interface RolePageAccessModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialConfig?: Record<string, string[] | null>
  onSave: (role: RoleType, allowedRoutes: string[] | null) => Promise<{ success: boolean; error?: string }>
}

export function RolePageAccessModal({
  open,
  onOpenChange,
  initialConfig,
  onSave,
}: RolePageAccessModalProps) {
  const [activeTab, setActiveTab] = useState<RoleType>('MANAGER')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [configs, setConfigs] = useState<Record<RoleType, RoleConfig>>({
    MANAGER: { useCustomAccess: false, allowedRoutes: [] },
    CAISSIER: { useCustomAccess: false, allowedRoutes: [] },
    SERVEUR: { useCustomAccess: false, allowedRoutes: [] },
    SUPER_ADMIN: { useCustomAccess: false, allowedRoutes: [] },
    ADMIN: { useCustomAccess: false, allowedRoutes: [] },
  })

  // Initialiser avec la config existante
  useEffect(() => {
    if (initialConfig) {
      const newConfigs = { ...configs }
      for (const role of CONFIGURABLE_ROLES) {
        const routes = initialConfig[role]
        newConfigs[role] = {
          useCustomAccess: routes !== null && routes !== undefined,
          allowedRoutes: routes || [],
        }
      }
      setConfigs(newConfigs)
    }
  }, [initialConfig])

  const handleToggleCustomAccess = (role: RoleType, enabled: boolean) => {
    setConfigs((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        useCustomAccess: enabled,
        allowedRoutes: enabled ? prev[role].allowedRoutes : [],
      },
    }))
  }

  const handleToggleRoute = (role: RoleType, path: string) => {
    setConfigs((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        allowedRoutes: prev[role].allowedRoutes.includes(path)
          ? prev[role].allowedRoutes.filter((r) => r !== path)
          : [...prev[role].allowedRoutes, path],
      },
    }))
  }

  const handleSelectAll = (role: RoleType) => {
    setConfigs((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        allowedRoutes: AVAILABLE_PAGES.map((p) => p.path),
      },
    }))
  }

  const handleDeselectAll = (role: RoleType) => {
    setConfigs((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        allowedRoutes: [],
      },
    }))
  }

  const handleSave = async (role: RoleType) => {
    setIsSubmitting(true)

    try {
      const config = configs[role]
      // Si useCustomAccess est false, envoyer null (pas de restriction)
      const routesToSave = config.useCustomAccess ? config.allowedRoutes : null

      const result = await onSave(role, routesToSave)

      if (result.success) {
        toast.success(`Configuration sauvegardée pour ${ROLE_LABELS[role]}`)
      } else {
        toast.error(result.error || 'Erreur lors de la sauvegarde')
      }
    } catch {
      toast.error('Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentConfig = configs[activeTab]

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="650px">
        <Dialog.Title>Configuration des pages par rôle</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Définissez quelles pages sont accessibles pour chaque rôle non-administrateur
        </Dialog.Description>

        <Tabs.Root value={activeTab} onValueChange={(v) => setActiveTab(v as RoleType)}>
          <Tabs.List>
            {CONFIGURABLE_ROLES.map((role) => (
              <Tabs.Trigger key={role} value={role}>
                <Flex align="center" gap="2">
                  <Badge color={ROLE_COLORS[role]} size="1" variant="soft">
                    {ROLE_LABELS[role]}
                  </Badge>
                  {configs[role].useCustomAccess ? <Badge color="violet" size="1">
                      {configs[role].allowedRoutes.length}
                    </Badge> : null}
                </Flex>
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {CONFIGURABLE_ROLES.map((role) => (
            <Tabs.Content key={role} value={role}>
              <Flex direction="column" gap="4" pt="4">
                {/* Toggle accès personnalisé */}
                <Flex
                  align="center"
                  justify="between"
                  p="3"
                  style={{
                    backgroundColor: 'var(--gray-a2)',
                    borderRadius: 8,
                  }}
                >
                  <Flex direction="column" gap="1">
                    <Text weight="medium">Restreindre l'accès aux pages</Text>
                    <Text size="1" color="gray">
                      {configs[role].useCustomAccess
                        ? 'Seules les pages cochées seront accessibles'
                        : 'Accès standard selon les permissions du rôle'}
                    </Text>
                  </Flex>
                  <Switch
                    checked={configs[role].useCustomAccess}
                    onCheckedChange={(checked) => handleToggleCustomAccess(role, checked)}
                  />
                </Flex>

                {configs[role].useCustomAccess ? (
                  <>
                    {/* Actions rapides */}
                    <Flex gap="2">
                      <Button
                        type="button"
                        variant="soft"
                        size="1"
                        onClick={() => handleSelectAll(role)}
                      >
                        Tout sélectionner
                      </Button>
                      <Button
                        type="button"
                        variant="soft"
                        size="1"
                        color="gray"
                        onClick={() => handleDeselectAll(role)}
                      >
                        Tout désélectionner
                      </Button>
                    </Flex>

                    {/* Liste des pages */}
                    <Flex
                      direction="column"
                      gap="2"
                      style={{ maxHeight: '300px', overflowY: 'auto' }}
                    >
                      {AVAILABLE_PAGES.map((page) => {
                        const Icon = page.icon
                        const isSelected = configs[role].allowedRoutes.includes(page.path)

                        return (
                          <Text
                            as="label"
                            size="2"
                            key={page.path}
                            style={{
                              cursor: 'pointer',
                              padding: '12px',
                              borderRadius: '8px',
                              backgroundColor: isSelected
                                ? 'var(--accent-a3)'
                                : 'var(--gray-a2)',
                              border: isSelected
                                ? '1px solid var(--accent-6)'
                                : '1px solid transparent',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Flex gap="3" align="center">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleToggleRoute(role, page.path)}
                              />
                              <Flex
                                align="center"
                                justify="center"
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 6,
                                  backgroundColor: isSelected
                                    ? 'var(--accent-9)'
                                    : 'var(--gray-a4)',
                                  color: isSelected ? 'white' : 'var(--gray-11)',
                                }}
                              >
                                <Icon size={16} />
                              </Flex>
                              <Flex direction="column" gap="0">
                                <Text weight="medium">{page.label}</Text>
                                <Text size="1" color="gray">
                                  {page.description}
                                </Text>
                              </Flex>
                            </Flex>
                          </Text>
                        )
                      })}
                    </Flex>

                    {/* Compteur */}
                    <Flex justify="between" align="center">
                      <Text size="1" color="gray">
                        {configs[role].allowedRoutes.length === 0 && (
                          <Text color="red">Attention : aucune page sélectionnée</Text>
                        )}
                      </Text>
                      <Badge color={configs[role].allowedRoutes.length > 0 ? 'green' : 'red'}>
                        {configs[role].allowedRoutes.length} / {AVAILABLE_PAGES.length} pages
                      </Badge>
                    </Flex>
                  </>
                ) : (
                  <Callout.Root color="blue">
                    <Callout.Icon>
                      <Info size={16} />
                    </Callout.Icon>
                    <Callout.Text>
                      Les {ROLE_LABELS[role].toLowerCase()}s ont accès aux pages selon leurs
                      permissions par défaut. Activez la restriction pour personnaliser.
                    </Callout.Text>
                  </Callout.Root>
                )}

                <Separator size="4" />

                {/* Bouton de sauvegarde */}
                <Flex justify="end">
                  <Button onClick={() => handleSave(role)} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Save size={16} />
                    )}
                    Enregistrer pour {ROLE_LABELS[role]}
                  </Button>
                </Flex>
              </Flex>
            </Tabs.Content>
          ))}
        </Tabs.Root>

        {/* Fermer */}
        <Flex justify="end" mt="4">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Fermer
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )
}
