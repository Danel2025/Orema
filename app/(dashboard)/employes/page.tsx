'use client'

/**
 * Page de gestion des employes
 * Liste, creation, modification, gestion PIN
 *
 * Cette page utilise le contexte d'auth pour filtrer
 * les actions selon les permissions de l'utilisateur.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Flex,
  Text,
  Button,
  TextField,
  Table,
  Badge,
  IconButton,
  DropdownMenu,
  Card,
  Skeleton,
  AlertDialog,
  Switch,
  Tooltip,
} from '@radix-ui/themes'
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Key,
  BarChart3,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  RefreshCw,
  Lock,
  LayoutGrid,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  EmployeeFormModal,
  PinManagement,
  RolePermissionsModal,
  EmployeeStats,
  PageAccessModal,
  RolePageAccessModal,
  ResetPasswordModal,
} from '@/components/employes'
import { EmptyState } from '@/components/composed'
import {
  ROLE_LABELS,
  ROLE_COLORS,
  type RoleType,
} from '@/schemas/employe'
import {
  getEmployes,
  deleteEmploye,
  toggleEmployeStatus,
  getRoleAllowedRoutes,
  saveRoleAllowedRoutes,
} from '@/actions/employes'
import { useAuth } from '@/lib/auth/context'

interface Employee {
  id: string
  nom: string
  prenom: string
  email: string
  role: string
  actif: boolean
  createdAt: Date
  hasPin: boolean
  allowed_routes?: string[]
}

export default function EmployesPage() {
  // Auth context - permissions
  const { can, canManage, user } = useAuth()

  // Permissions pour cette page
  const canCreate = can('employe:creer')
  const canModify = can('employe:modifier')
  const canDelete = can('employe:supprimer')
  const canResetPin = can('employe:reset_pin')
  const canModifyRole = can('employe:modifier_role')

  // State
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>()
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [pinEmployee, setPinEmployee] = useState<Employee | null>(null)
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false)
  const [permissionsRole, setPermissionsRole] = useState<RoleType | undefined>()
  const [statsModalOpen, setStatsModalOpen] = useState(false)
  const [statsEmployee, setStatsEmployee] = useState<Employee | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [pageAccessModalOpen, setPageAccessModalOpen] = useState(false)
  const [pageAccessEmployee, setPageAccessEmployee] = useState<Employee | null>(null)
  const [rolePageAccessModalOpen, setRolePageAccessModalOpen] = useState(false)
  const [rolePageAccessConfig, setRolePageAccessConfig] = useState<Record<string, string[] | null>>({})
  const [isLoadingRoleConfig, setIsLoadingRoleConfig] = useState(false)
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false)
  const [resetPasswordEmployee, setResetPasswordEmployee] = useState<Employee | null>(null)

  // Load employees
  const loadEmployees = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getEmployes()
      if (result.success && result.data) {
        setEmployees(result.data)
      } else {
        toast.error(result.error || 'Erreur lors du chargement')
      }
    } catch (error) {
      toast.error('Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEmployees()
  }, [loadEmployees])

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees

    const query = searchQuery.toLowerCase()
    return employees.filter(
      (e) =>
        e.nom.toLowerCase().includes(query) ||
        e.prenom.toLowerCase().includes(query) ||
        e.email.toLowerCase().includes(query) ||
        ROLE_LABELS[e.role as RoleType].toLowerCase().includes(query)
    )
  }, [employees, searchQuery])

  // Stats
  const stats = useMemo(() => ({
    total: employees.length,
    actifs: employees.filter((e) => e.actif).length,
    inactifs: employees.filter((e) => !e.actif).length,
  }), [employees])

  // Handlers
  const handleCreateEmployee = () => {
    setSelectedEmployee(undefined)
    setFormModalOpen(true)
  }

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setFormModalOpen(true)
  }

  const handleManagePin = (employee: Employee) => {
    setPinEmployee(employee)
    setPinModalOpen(true)
  }

  const handleViewStats = (employee: Employee) => {
    setStatsEmployee(employee)
    setStatsModalOpen(true)
  }

  const handleViewPermissions = (role?: RoleType) => {
    setPermissionsRole(role)
    setPermissionsModalOpen(true)
  }

  const handleManagePageAccess = (employee: Employee) => {
    setPageAccessEmployee(employee)
    setPageAccessModalOpen(true)
  }

  const handleOpenRolePageAccess = async () => {
    setIsLoadingRoleConfig(true)
    try {
      const result = await getRoleAllowedRoutes()
      if (result.success && result.data) {
        setRolePageAccessConfig(result.data)
      }
    } catch (error) {
      toast.error('Erreur lors du chargement de la configuration')
    } finally {
      setIsLoadingRoleConfig(false)
      setRolePageAccessModalOpen(true)
    }
  }

  const handleSaveRolePageAccess = async (
    role: RoleType,
    allowedRoutes: string[] | null
  ) => {
    // Les admins ont accès à tout, pas besoin de sauvegarder
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      return { success: true }
    }
    const result = await saveRoleAllowedRoutes({ role: role as 'MANAGER' | 'CAISSIER' | 'SERVEUR', allowedRoutes })
    if (result.success) {
      // Mettre à jour la config locale
      setRolePageAccessConfig((prev) => ({ ...prev, [role]: allowedRoutes }))
    }
    return result
  }

  const handleToggleStatus = async (employee: Employee) => {
    try {
      const result = await toggleEmployeStatus({
        employeId: employee.id,
        actif: !employee.actif,
      })

      if (result.success) {
        toast.success(
          employee.actif ? 'Employe desactive' : 'Employe active'
        )
        loadEmployees()
      } else {
        toast.error(result.error || 'Erreur lors du changement de statut')
      }
    } catch (error) {
      toast.error('Une erreur est survenue')
    }
  }

  const handleResetPassword = (employee: Employee) => {
    setResetPasswordEmployee(employee)
    setResetPasswordModalOpen(true)
  }

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteEmploye(employeeToDelete.id)

      if (result.success) {
        toast.success('Employe supprime')
        setDeleteDialogOpen(false)
        setEmployeeToDelete(null)
        loadEmployees()
      } else {
        toast.error(result.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      toast.error('Une erreur est survenue')
    } finally {
      setIsDeleting(false)
    }
  }

  const confirmDelete = (employee: Employee) => {
    setEmployeeToDelete(employee)
    setDeleteDialogOpen(true)
  }

  return (
    <Flex direction="column" gap="5">
      {/* Header */}
      <Flex justify="between" align="start">
        <Flex direction="column" gap="1">
          <Flex align="center" gap="2">
            <Users size={28} style={{ color: 'var(--accent-9)' }} />
            <Text size="7" weight="bold">
              Employes
            </Text>
          </Flex>
          <Text size="2" color="gray">
            Gestion du personnel et des acces
          </Text>
        </Flex>

        <Flex gap="2">
          <Button variant="soft" color="gray" onClick={() => handleViewPermissions()}>
            <Shield size={16} />
            Permissions
          </Button>
          <Button
            variant="soft"
            color="gray"
            onClick={handleOpenRolePageAccess}
            disabled={isLoadingRoleConfig}
          >
            <LayoutGrid size={16} />
            Pages par rôle
          </Button>
          {canCreate ? <Button onClick={handleCreateEmployee}>
              <Plus size={16} />
              Nouvel employe
            </Button> : null}
        </Flex>
      </Flex>

      {/* Stats Cards */}
      <Flex gap="3">
        <Card style={{ flex: 1 }}>
          <Flex direction="column" gap="1">
            <Text size="2" color="gray">
              Total employes
            </Text>
            <Text
              size="6"
              weight="bold"
              style={{ fontFamily: 'var(--font-google-sans-code), monospace' }}
            >
              {isLoading ? <Skeleton width="40px" height="24px" /> : stats.total}
            </Text>
          </Flex>
        </Card>
        <Card style={{ flex: 1 }}>
          <Flex direction="column" gap="1">
            <Flex align="center" gap="1">
              <UserCheck size={14} style={{ color: 'var(--green-9)' }} />
              <Text size="2" color="gray">
                Actifs
              </Text>
            </Flex>
            <Text
              size="6"
              weight="bold"
              style={{
                fontFamily: 'var(--font-google-sans-code), monospace',
                color: 'var(--green-9)',
              }}
            >
              {isLoading ? <Skeleton width="40px" height="24px" /> : stats.actifs}
            </Text>
          </Flex>
        </Card>
        <Card style={{ flex: 1 }}>
          <Flex direction="column" gap="1">
            <Flex align="center" gap="1">
              <UserX size={14} style={{ color: 'var(--red-9)' }} />
              <Text size="2" color="gray">
                Inactifs
              </Text>
            </Flex>
            <Text
              size="6"
              weight="bold"
              style={{
                fontFamily: 'var(--font-google-sans-code), monospace',
                color: 'var(--red-9)',
              }}
            >
              {isLoading ? <Skeleton width="40px" height="24px" /> : stats.inactifs}
            </Text>
          </Flex>
        </Card>
      </Flex>

      {/* Search and filters */}
      <Flex gap="3" align="center">
        <TextField.Root
          placeholder="Rechercher un employe..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, maxWidth: 400 }}
        >
          <TextField.Slot>
            <Search size={16} />
          </TextField.Slot>
        </TextField.Root>

        <IconButton
          variant="soft"
          color="gray"
          onClick={loadEmployees}
          disabled={isLoading}
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </IconButton>
      </Flex>

      {/* Employees Table */}
      {isLoading ? (
        <Card>
          <Flex direction="column" gap="3" p="4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height="48px" />
            ))}
          </Flex>
        </Card>
      ) : filteredEmployees.length === 0 ? (
        <EmptyState
          icon={Users}
          title={searchQuery ? 'Aucun resultat' : 'Aucun employe'}
          description={
            searchQuery
              ? 'Modifiez votre recherche pour trouver des employes'
              : 'Commencez par ajouter votre premier employe'
          }
          action={
            !searchQuery && (
              <Button onClick={handleCreateEmployee}>
                <Plus size={16} />
                Ajouter un employe
              </Button>
            )
          }
        />
      ) : (
        <Card>
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Employe</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Role</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>PIN</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Statut</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell width="60px" />
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {filteredEmployees.map((employee) => (
                <Table.Row key={employee.id}>
                  <Table.Cell>
                    <Flex direction="column" gap="1">
                      <Text weight="medium">
                        {employee.prenom} {employee.nom}
                      </Text>
                    </Flex>
                  </Table.Cell>

                  <Table.Cell>
                    <Text size="2" color="gray">
                      {employee.email}
                    </Text>
                  </Table.Cell>

                  <Table.Cell>
                    <Badge
                      color={ROLE_COLORS[employee.role as RoleType]}
                      variant="soft"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleViewPermissions(employee.role as RoleType)}
                    >
                      {ROLE_LABELS[employee.role as RoleType]}
                    </Badge>
                  </Table.Cell>

                  <Table.Cell>
                    {employee.hasPin ? (
                      <Tooltip content="PIN configure">
                        <Badge color="green" variant="soft">
                          <Key size={12} />
                          Configure
                        </Badge>
                      </Tooltip>
                    ) : (
                      <Tooltip content="Aucun PIN">
                        <Badge color="gray" variant="soft">
                          <Lock size={12} />
                          Non defini
                        </Badge>
                      </Tooltip>
                    )}
                  </Table.Cell>

                  <Table.Cell>
                    <Flex align="center" gap="2">
                      <Switch
                        size="1"
                        checked={employee.actif}
                        onCheckedChange={() => handleToggleStatus(employee)}
                        disabled={!canModify || !canManage(employee.role as RoleType)}
                      />
                      <Text size="2" color={employee.actif ? 'green' : 'red'}>
                        {employee.actif ? 'Actif' : 'Inactif'}
                      </Text>
                    </Flex>
                  </Table.Cell>

                  <Table.Cell>
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger>
                        <IconButton variant="ghost" size="1">
                          <MoreHorizontal size={16} />
                        </IconButton>
                      </DropdownMenu.Trigger>

                      <DropdownMenu.Content>
                        {/* Actions de modification - seulement si permissions */}
                        {canModify && canManage(employee.role as RoleType) ? <>
                            <DropdownMenu.Item
                              onClick={() => handleEditEmployee(employee)}
                            >
                              <Pencil size={14} />
                              Modifier
                            </DropdownMenu.Item>

                            {canResetPin ? <DropdownMenu.Item
                                onClick={() => handleManagePin(employee)}
                              >
                                <Key size={14} />
                                {employee.hasPin ? 'Modifier PIN' : 'Definir PIN'}
                              </DropdownMenu.Item> : null}

                            <DropdownMenu.Item
                              onClick={() => handleResetPassword(employee)}
                            >
                              <Lock size={14} />
                              Reset mot de passe
                            </DropdownMenu.Item>

                            {/* Acces aux pages - seulement pour les non-admins */}
                            {employee.role !== 'SUPER_ADMIN' && employee.role !== 'ADMIN' && (
                              <DropdownMenu.Item
                                onClick={() => handleManagePageAccess(employee)}
                              >
                                <LayoutGrid size={14} />
                                Acces aux pages
                              </DropdownMenu.Item>
                            )}

                            <DropdownMenu.Separator />
                          </> : null}

                        {/* Actions de consultation - toujours visibles */}
                        <DropdownMenu.Item
                          onClick={() => handleViewStats(employee)}
                        >
                          <BarChart3 size={14} />
                          Statistiques
                        </DropdownMenu.Item>

                        <DropdownMenu.Item
                          onClick={() => handleViewPermissions(employee.role as RoleType)}
                        >
                          <Shield size={14} />
                          Permissions
                        </DropdownMenu.Item>

                        {/* Action de suppression - seulement si permissions */}
                        {canDelete && canManage(employee.role as RoleType) ? <DropdownMenu.Item
                            color="red"
                            onClick={() => confirmDelete(employee)}
                          >
                            <Trash2 size={14} />
                            Supprimer
                          </DropdownMenu.Item> : null}
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Card>
      )}

      {/* Modals */}
      <EmployeeFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        employee={selectedEmployee}
        onSuccess={loadEmployees}
      />

      {pinEmployee ? <PinManagement
          open={pinModalOpen}
          onOpenChange={setPinModalOpen}
          employee={pinEmployee}
          onSuccess={loadEmployees}
        /> : null}

      <RolePermissionsModal
        open={permissionsModalOpen}
        onOpenChange={setPermissionsModalOpen}
        selectedRole={permissionsRole}
      />

      {statsEmployee ? <EmployeeStats
          open={statsModalOpen}
          onOpenChange={setStatsModalOpen}
          employee={statsEmployee}
        /> : null}

      {/* Page Access Modal (individuel) */}
      <PageAccessModal
        open={pageAccessModalOpen}
        onOpenChange={setPageAccessModalOpen}
        employee={pageAccessEmployee}
        onSuccess={loadEmployees}
      />

      {/* Role Page Access Modal (par rôle) */}
      <RolePageAccessModal
        open={rolePageAccessModalOpen}
        onOpenChange={setRolePageAccessModalOpen}
        initialConfig={rolePageAccessConfig}
        onSave={handleSaveRolePageAccess}
      />

      {/* Reset Password Modal */}
      {resetPasswordEmployee ? <ResetPasswordModal
          open={resetPasswordModalOpen}
          onOpenChange={setResetPasswordModalOpen}
          employee={resetPasswordEmployee}
        /> : null}

      {/* Delete Confirmation Dialog */}
      <AlertDialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialog.Content maxWidth="450px">
          <AlertDialog.Title>Supprimer l'employe</AlertDialog.Title>
          <AlertDialog.Description size="2">
            Etes-vous sur de vouloir supprimer{' '}
            <Text weight="bold">
              {employeeToDelete?.prenom} {employeeToDelete?.nom}
            </Text>{' '}
            ? Cette action est irreversible.
          </AlertDialog.Description>

          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray" disabled={isDeleting}>
                Annuler
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button
                color="red"
                onClick={handleDeleteEmployee}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <RefreshCw className="animate-spin" size={16} />
                ) : (
                  <Trash2 size={16} />
                )}
                Supprimer
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Flex>
  )
}
