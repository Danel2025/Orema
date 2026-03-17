'use client'

/**
 * Composant d'affichage et d'edition des permissions par role
 *
 * Affiche les 47 permissions granulaires organisees par groupes
 * avec des switches editables pour les admins.
 */

import { useState, useEffect, useTransition } from 'react'
import {
  Dialog,
  Button,
  Flex,
  Text,
  Badge,
  Box,
  Switch,
  Callout,
  Spinner,
} from '@radix-ui/themes'
import { ScrollArea } from '@/components/ui'
import * as Accordion from '@radix-ui/react-accordion'
import {
  Shield,
  Check,
  X,
  ChevronDown,
  RefreshCw,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/lib/auth/context'
import type { Permission } from '@/lib/permissions'
import { PERMISSION_GROUPS, countPermissionsByGroup } from '@/lib/permission-groups'
import {
  getAllRolePermissionConfigs,
  togglePermission,
  resetRolePermissionsToDefaults,
  enableAllPermissionsInGroup,
  disableAllPermissionsInGroup,
} from '@/actions/permissions'
import type { Role } from '@/lib/db/types'

const ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CAISSIER', 'SERVEUR']

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrateur',
  MANAGER: 'Manager',
  CAISSIER: 'Caissier',
  SERVEUR: 'Serveur',
}

const ROLE_COLORS: Record<Role, 'red' | 'violet' | 'blue' | 'green' | 'gray'> = {
  SUPER_ADMIN: 'red',
  ADMIN: 'violet',
  MANAGER: 'blue',
  CAISSIER: 'green',
  SERVEUR: 'gray',
}

interface RolePermissionsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedRole?: Role
}

interface PermissionConfig {
  permissions: Permission[]
  isCustom: boolean
  isEditable: boolean
}

export function RolePermissionsModal({
  open,
  onOpenChange,
  selectedRole,
}: RolePermissionsProps) {
  const [activeTab, setActiveTab] = useState<Role>(selectedRole || 'MANAGER')
  const [permissionConfigs, setPermissionConfigs] = useState<Record<Role, PermissionConfig> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Charger les configurations de permissions
  useEffect(() => {
    if (open) {
      loadPermissions()
    }
  }, [open])

  const loadPermissions = async () => {
    setIsLoading(true)
    try {
      const result = await getAllRolePermissionConfigs()
      if (result.success && result.data) {
        setPermissionConfigs(result.data)
      } else {
        toast.error(result.error || 'Erreur lors du chargement des permissions')
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des permissions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTogglePermission = async (role: Role, permission: Permission, enabled: boolean) => {
    if (!permissionConfigs) return

    // Mise a jour optimiste
    const oldConfig = permissionConfigs[role]
    const newPermissions = enabled
      ? [...oldConfig.permissions, permission]
      : oldConfig.permissions.filter((p) => p !== permission)

    setPermissionConfigs({
      ...permissionConfigs,
      [role]: { ...oldConfig, permissions: newPermissions, isCustom: true },
    })

    startTransition(async () => {
      const result = await togglePermission(role, permission, enabled)
      if (!result.success) {
        // Annuler la mise a jour optimiste
        setPermissionConfigs({
          ...permissionConfigs,
          [role]: oldConfig,
        })
        toast.error(result.error || 'Erreur lors de la modification')
      }
    })
  }

  const handleResetToDefaults = async (role: Role) => {
    startTransition(async () => {
      const result = await resetRolePermissionsToDefaults(role)
      if (result.success) {
        toast.success('Permissions reinitialisees aux valeurs par defaut')
        loadPermissions()
      } else {
        toast.error(result.error || 'Erreur lors de la reinitialisation')
      }
    })
  }

  const handleEnableAllInGroup = async (role: Role, groupPermissions: Permission[]) => {
    startTransition(async () => {
      const result = await enableAllPermissionsInGroup(role, groupPermissions)
      if (result.success) {
        loadPermissions()
      } else {
        toast.error(result.error || 'Erreur')
      }
    })
  }

  const handleDisableAllInGroup = async (role: Role, groupPermissions: Permission[]) => {
    startTransition(async () => {
      const result = await disableAllPermissionsInGroup(role, groupPermissions)
      if (result.success) {
        loadPermissions()
      } else {
        toast.error(result.error || 'Erreur')
      }
    })
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="800px" style={{ maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Dialog.Title>
          <Flex align="center" gap="2">
            <Shield size={20} />
            Permissions par role
          </Flex>
        </Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Configurez les permissions associees a chaque role dans le systeme
        </Dialog.Description>

        {isLoading ? (
          <Flex align="center" justify="center" py="9">
            <Spinner size="3" />
          </Flex>
        ) : permissionConfigs ? (
          <Box style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <Box mb="4" pb="3" style={{ borderBottom: '1px solid var(--gray-6)' }}>
              <Flex justify="between" align="center" wrap="wrap" gap="3">
                <Flex gap="2" wrap="wrap">
                  {ROLES.map((role) => (
                    <Button
                      key={role}
                      variant={activeTab === role ? 'solid' : 'soft'}
                      color={ROLE_COLORS[role]}
                      size="2"
                      onClick={() => setActiveTab(role)}
                    >
                      {ROLE_LABELS[role]}
                    </Button>
                  ))}
                </Flex>
                {activeTab !== 'SUPER_ADMIN' && permissionConfigs[activeTab]?.isEditable ? <Button
                    variant="outline"
                    color="gray"
                    size="1"
                    onClick={() => handleResetToDefaults(activeTab)}
                    disabled={isPending}
                  >
                    <RefreshCw size={14} />
                    Réinitialiser {ROLE_LABELS[activeTab]}
                  </Button> : null}
              </Flex>
            </Box>

            <ScrollArea style={{ flex: 1, minHeight: 0 }}>
              <RolePermissionsList
                role={activeTab}
                config={permissionConfigs[activeTab]}
                onToggle={(permission, enabled) =>
                  handleTogglePermission(activeTab, permission, enabled)
                }
                onReset={() => handleResetToDefaults(activeTab)}
                onEnableAllInGroup={(perms) => handleEnableAllInGroup(activeTab, perms)}
                onDisableAllInGroup={(perms) => handleDisableAllInGroup(activeTab, perms)}
                isPending={isPending}
              />
            </ScrollArea>
          </Box>
        ) : null}

        <Flex gap="3" mt="5" justify="end">
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

interface RolePermissionsListProps {
  role: Role
  config: PermissionConfig
  onToggle: (permission: Permission, enabled: boolean) => void
  onReset: () => void
  onEnableAllInGroup: (permissions: Permission[]) => void
  onDisableAllInGroup: (permissions: Permission[]) => void
  isPending: boolean
}

function RolePermissionsList({
  role,
  config,
  onToggle,
  onReset,
  onEnableAllInGroup,
  onDisableAllInGroup,
  isPending,
}: RolePermissionsListProps) {
  const { permissions, isCustom, isEditable } = config
  const permissionCounts = countPermissionsByGroup(permissions)

  return (
    <Flex direction="column" gap="3">
      {/* Description du role */}
      <Text size="2" color="gray">
        {getRoleDescription(role)}
      </Text>

      {/* Info sur les permissions personnalisees */}
      {isCustom ? <Callout.Root color="amber" size="1">
          <Callout.Icon>
            <Info size={14} />
          </Callout.Icon>
          <Callout.Text>
            Ce role a des permissions personnalisees.
            {isEditable ? <Button
                variant="ghost"
                size="1"
                color="amber"
                onClick={onReset}
                disabled={isPending}
                style={{ marginLeft: 8 }}
              >
                <RefreshCw size={12} />
                Reinitialiser
              </Button> : null}
          </Callout.Text>
        </Callout.Root> : null}

      {/* Info SUPER_ADMIN non modifiable */}
      {role === 'SUPER_ADMIN' && (
        <Callout.Root color="blue" size="1">
          <Callout.Icon>
            <Shield size={14} />
          </Callout.Icon>
          <Callout.Text>
            Les permissions de Super Admin ne peuvent pas etre modifiees.
          </Callout.Text>
        </Callout.Root>
      )}

      {/* Accordeons par groupe */}
      <Accordion.Root type="multiple" defaultValue={PERMISSION_GROUPS.map(g => g.key)}>
        {PERMISSION_GROUPS.map((group) => {
          const Icon = group.icon
          const counts = permissionCounts[group.key]
          const groupPermissionKeys = group.permissions.map(p => p.key)
          const allEnabled = counts.active === counts.total
          const noneEnabled = counts.active === 0

          return (
            <Accordion.Item key={group.key} value={group.key} style={{ borderBottom: '1px solid var(--gray-a6)' }}>
              <Accordion.Header>
                <Accordion.Trigger
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Flex align="center" gap="2">
                    <Icon size={16} style={{ color: 'var(--accent-9)' }} />
                    <Text weight="medium" size="2">{group.label}</Text>
                    <Badge variant="soft" color="gray" size="1">
                      {counts.active}/{counts.total}
                    </Badge>
                  </Flex>
                  <ChevronDown size={16} style={{ color: 'var(--gray-9)' }} />
                </Accordion.Trigger>
              </Accordion.Header>

              <Accordion.Content>
                <Flex direction="column" gap="2" pb="3">
                  {/* Boutons tout activer/desactiver */}
                  {isEditable ? <Flex gap="2" mb="2">
                      <Button
                        variant="soft"
                        size="1"
                        color="green"
                        onClick={() => onEnableAllInGroup(groupPermissionKeys)}
                        disabled={isPending || allEnabled}
                      >
                        <Check size={12} />
                        Tout activer
                      </Button>
                      <Button
                        variant="soft"
                        size="1"
                        color="red"
                        onClick={() => onDisableAllInGroup(groupPermissionKeys)}
                        disabled={isPending || noneEnabled}
                      >
                        <X size={12} />
                        Tout desactiver
                      </Button>
                    </Flex> : null}

                  {/* Liste des permissions */}
                  {group.permissions.map((perm) => {
                    const isEnabled = permissions.includes(perm.key)

                    return (
                      <Flex
                        key={perm.key}
                        align="center"
                        justify="between"
                        py="2"
                        px="3"
                        style={{
                          backgroundColor: 'var(--gray-a2)',
                          borderRadius: 6,
                        }}
                      >
                        <Flex direction="column" gap="1">
                          <Text size="2">{perm.label}</Text>
                          <Text size="1" color="gray">{perm.description}</Text>
                        </Flex>

                        {isEditable ? (
                          <Switch
                            size="1"
                            checked={isEnabled}
                            onCheckedChange={(checked) => onToggle(perm.key, checked)}
                            disabled={isPending}
                          />
                        ) : (
                          <Badge color={isEnabled ? 'green' : 'red'} variant="soft" size="1">
                            {isEnabled ? <Check size={12} /> : <X size={12} />}
                            {isEnabled ? 'Oui' : 'Non'}
                          </Badge>
                        )}
                      </Flex>
                    )
                  })}
                </Flex>
              </Accordion.Content>
            </Accordion.Item>
          )
        })}
      </Accordion.Root>
    </Flex>
  )
}

function getRoleDescription(role: Role): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Acces complet a toutes les fonctionnalites du systeme. Reserve au proprietaire ou gestionnaire principal.'
    case 'ADMIN':
      return 'Gestion complete de l\'etablissement : employes, produits, rapports et parametres.'
    case 'MANAGER':
      return 'Gestion operationnelle : produits, stock, clients. Peut faire des ventes et appliquer des remises.'
    case 'CAISSIER':
      return 'Operations de caisse : ventes, encaissements, gestion des clients. Acces limite aux rapports.'
    case 'SERVEUR':
      return 'Service en salle : prise de commandes sur tables. Ne peut pas encaisser directement.'
    default:
      return ''
  }
}

/**
 * Composant compact pour afficher les permissions d'un role
 */
export function RolePermissionsCompact({ role }: { role: Role }) {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const result = await getAllRolePermissionConfigs()
      if (result.success && result.data) {
        setPermissions(result.data[role].permissions)
      }
      setIsLoading(false)
    }
    load()
  }, [role])

  if (isLoading) {
    return <Spinner size="1" />
  }

  const counts = countPermissionsByGroup(permissions)
  const totalActive = Object.values(counts).reduce((sum, c) => sum + c.active, 0)
  const totalAll = Object.values(counts).reduce((sum, c) => sum + c.total, 0)

  return (
    <Flex direction="column" gap="2">
      <Flex align="center" gap="2">
        <Badge color={ROLE_COLORS[role]}>{ROLE_LABELS[role]}</Badge>
        <Text size="1" color="gray">
          {totalActive}/{totalAll} permissions
        </Text>
      </Flex>

      <Flex wrap="wrap" gap="1">
        {PERMISSION_GROUPS.slice(0, 4).map((group) => {
          const c = counts[group.key]
          const Icon = group.icon
          return (
            <Badge key={group.key} variant="surface" size="1" color="gray">
              <Icon size={12} />
              {group.label}: {c.active}/{c.total}
            </Badge>
          )
        })}
        {PERMISSION_GROUPS.length > 4 && (
          <Badge variant="surface" size="1" color="gray">
            +{PERMISSION_GROUPS.length - 4} groupes
          </Badge>
        )}
      </Flex>
    </Flex>
  )
}
