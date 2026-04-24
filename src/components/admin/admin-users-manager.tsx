'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/lib/i18n'

type UserRole = 'admin' | 'manager' | 'staff'
type UserStatus = 'active' | 'inactive'

interface UserItem {
  id: string
  firstname: string
  lastname: string
  email: string
  role: UserRole
  status: UserStatus
  branchId: string | null
  branchName: string | null
  createdAt: string
}

interface BranchItem {
  id: string
  branchName: string
  country: 'TH' | 'LA'
}

interface Props {
  initialUsers: UserItem[]
  branches: BranchItem[]
  currentUserId: string
}

interface EditFormState {
  firstname: string
  lastname: string
  role: UserRole
  status: UserStatus
  branchId: string
  password: string
}

type ApiUserPayload = {
  id: string
  firstname: string
  lastname: string
  email: string
  role: UserRole
  status: UserStatus
  branchId: string | null
  createdAt: string
  branch?: { branchName: string } | null
}

function normalizeUser(payload: ApiUserPayload): UserItem {
  return {
    id: payload.id,
    firstname: payload.firstname,
    lastname: payload.lastname,
    email: payload.email,
    role: payload.role,
    status: payload.status,
    branchId: payload.branchId,
    branchName: payload.branch?.branchName ?? null,
    createdAt: payload.createdAt,
  }
}

export function AdminUsersManager({ initialUsers, branches, currentUserId }: Props) {
  const { t } = useI18n()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<UserItem[]>(initialUsers)
  const [loadingCreate, setLoadingCreate] = useState(false)
  const [activeEditUserId, setActiveEditUserId] = useState<string | null>(null)
  const [loadingActionUserId, setLoadingActionUserId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>(() => {
    const role = searchParams.get('role')
    if (role === 'admin' || role === 'manager' || role === 'staff') return role
    return 'all'
  })
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>(() => {
    const status = searchParams.get('status')
    if (status === 'active' || status === 'inactive') return status
    return 'all'
  })
  const [branchFilter, setBranchFilter] = useState<'all' | string>(() => searchParams.get('branch') ?? 'all')

  const [createForm, setCreateForm] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    role: 'staff' as UserRole,
    status: 'active' as UserStatus,
    branchId: '',
  })

  const [editForm, setEditForm] = useState<EditFormState | null>(null)

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()

    return users
      .filter((user) => {
        const matchesSearch = !q
          || `${user.firstname} ${user.lastname}`.toLowerCase().includes(q)
          || user.email.toLowerCase().includes(q)
        const matchesRole = roleFilter === 'all' || user.role === roleFilter
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter
        const matchesBranch = branchFilter === 'all' || user.branchId === branchFilter

        return matchesSearch && matchesRole && matchesStatus && matchesBranch
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [users, searchQuery, roleFilter, statusFilter, branchFilter])

  function onCreateChange<K extends keyof typeof createForm>(key: K, value: (typeof createForm)[K]) {
    setCreateForm((prev) => ({ ...prev, [key]: value }))
  }

  useEffect(() => {
    const params = new URLSearchParams()

    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    if (roleFilter !== 'all') params.set('role', roleFilter)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (branchFilter !== 'all') params.set('branch', branchFilter)

    const nextQuery = params.toString()
    const currentQuery = searchParams.toString()
    if (nextQuery === currentQuery) return

    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname
    window.history.replaceState(null, '', nextUrl)
  }, [searchQuery, roleFilter, statusFilter, branchFilter, pathname, searchParams])

  function resolveApiError(error: unknown, fallbackKey: string) {
    if (typeof error === 'string') {
      if (error.startsWith('admin.userCrud.api.')) return t(error)
      return error
    }
    return t(fallbackKey)
  }

  function onEditChange<K extends keyof EditFormState>(key: K, value: EditFormState[K]) {
    setEditForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  function startEdit(user: UserItem) {
    setActiveEditUserId(user.id)
    setEditForm({
      firstname: user.firstname,
      lastname: user.lastname,
      role: user.role,
      status: user.status,
      branchId: user.branchId ?? '',
      password: '',
    })
  }

  function cancelEdit() {
    setActiveEditUserId(null)
    setEditForm(null)
  }

  async function createUser(e: FormEvent) {
    e.preventDefault()
    setLoadingCreate(true)

    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstname: createForm.firstname,
          lastname: createForm.lastname,
          email: createForm.email,
          password: createForm.password,
          role: createForm.role,
          status: createForm.status,
          branchId: createForm.branchId || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(resolveApiError(data.error, 'admin.userCrud.createFailed'))
        return
      }

      const created = normalizeUser(data.data as ApiUserPayload)
      setUsers((prev) => [created, ...prev])
      setCreateForm({ firstname: '', lastname: '', email: '', password: '', role: 'staff', status: 'active', branchId: '' })
      toast.success(t('admin.userCrud.createSuccess'))
    } catch {
      toast.error(t('admin.userCrud.createFailed'))
    } finally {
      setLoadingCreate(false)
    }
  }

  async function saveEdit(userId: string) {
    if (!editForm) return

    setLoadingActionUserId(userId)
    try {
      const res = await fetch(`/api/v1/users/${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstname: editForm.firstname,
          lastname: editForm.lastname,
          role: editForm.role,
          status: editForm.status,
          branchId: editForm.branchId || null,
          password: editForm.password || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(resolveApiError(data.error, 'admin.userCrud.updateFailed'))
        return
      }

      const updated = normalizeUser(data.data as ApiUserPayload)
      setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      cancelEdit()
      toast.success(t('admin.userCrud.updateSuccess'))
    } catch {
      toast.error(t('admin.userCrud.updateFailed'))
    } finally {
      setLoadingActionUserId(null)
    }
  }

  async function deactivateUser(userId: string) {
    const confirmed = window.confirm(t('admin.userCrud.confirmDeactivate'))
    if (!confirmed) return

    setLoadingActionUserId(userId)
    try {
      const res = await fetch(`/api/v1/users/${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(resolveApiError(data.error, 'admin.userCrud.deactivateFailed'))
        return
      }

      setUsers((prev) => prev.map((item) => (item.id === userId ? { ...item, status: 'inactive' } : item)))
      toast.success(t('admin.userCrud.deactivateSuccess'))
    } catch {
      toast.error(t('admin.userCrud.deactivateFailed'))
    } finally {
      setLoadingActionUserId(null)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('admin.userCrud.createTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={createUser} data-testid="admin-user-create-form">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t('admin.userCrud.firstName')}</Label>
                <Input
                  data-testid="admin-user-create-firstname"
                  value={createForm.firstname}
                  onChange={(e) => onCreateChange('firstname', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('admin.userCrud.lastName')}</Label>
                <Input
                  data-testid="admin-user-create-lastname"
                  value={createForm.lastname}
                  onChange={(e) => onCreateChange('lastname', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t('admin.userCrud.email')}</Label>
                <Input
                  type="email"
                  data-testid="admin-user-create-email"
                  value={createForm.email}
                  onChange={(e) => onCreateChange('email', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('admin.userCrud.password')}</Label>
                <Input
                  type="password"
                  minLength={6}
                  data-testid="admin-user-create-password"
                  value={createForm.password}
                  onChange={(e) => onCreateChange('password', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label>{t('admin.userCrud.role')}</Label>
                <select
                  data-testid="admin-user-create-role"
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                  value={createForm.role}
                  onChange={(e) => onCreateChange('role', e.target.value as UserRole)}
                >
                  <option value="admin">{t('admin.userCrud.roles.admin')}</option>
                  <option value="manager">{t('admin.userCrud.roles.manager')}</option>
                  <option value="staff">{t('admin.userCrud.roles.staff')}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('admin.userCrud.status')}</Label>
                <select
                  data-testid="admin-user-create-status"
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                  value={createForm.status}
                  onChange={(e) => onCreateChange('status', e.target.value as UserStatus)}
                >
                  <option value="active">{t('admin.userCrud.statuses.active')}</option>
                  <option value="inactive">{t('admin.userCrud.statuses.inactive')}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('admin.userCrud.branch')}</Label>
                <select
                  data-testid="admin-user-create-branch"
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                  value={createForm.branchId}
                  onChange={(e) => onCreateChange('branchId', e.target.value)}
                >
                  <option value="">{t('common.none')}</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.branchName} ({branch.country})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loadingCreate} data-testid="admin-user-create-submit">
                {loadingCreate ? t('admin.userCrud.creating') : t('admin.userCrud.createAction')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('admin.usersTitle')} ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-4">
            <Input
              data-testid="admin-user-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('admin.userCrud.searchPlaceholder')}
            />
            <select
              data-testid="admin-user-filter-role"
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | UserRole)}
            >
              <option value="all">{t('admin.userCrud.allRoles')}</option>
              <option value="admin">{t('admin.userCrud.roles.admin')}</option>
              <option value="manager">{t('admin.userCrud.roles.manager')}</option>
              <option value="staff">{t('admin.userCrud.roles.staff')}</option>
            </select>
            <select
              data-testid="admin-user-filter-status"
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | UserStatus)}
            >
              <option value="all">{t('admin.userCrud.allStatuses')}</option>
              <option value="active">{t('admin.userCrud.statuses.active')}</option>
              <option value="inactive">{t('admin.userCrud.statuses.inactive')}</option>
            </select>
            <select
              data-testid="admin-user-filter-branch"
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <option value="all">{t('admin.userCrud.allBranches')}</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.branchName} ({branch.country})
                </option>
              ))}
            </select>
          </div>

          {filteredUsers.map((user) => {
            const isEditing = activeEditUserId === user.id
            const actionLoading = loadingActionUserId === user.id

            return (
              <div key={user.id} className="rounded-md border p-3 text-sm space-y-3" data-testid={`admin-user-card-${user.id}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{user.firstname} {user.lastname}</p>
                    <p className="text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.branchName ?? t('common.none')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase">{t(`admin.userCrud.roles.${user.role}`)}</p>
                    <p className={`text-xs ${user.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
                      {t(`admin.userCrud.statuses.${user.status}`)}
                    </p>
                  </div>
                </div>

                {isEditing && editForm ? (
                  <div className="space-y-3 border-t pt-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>{t('admin.userCrud.firstName')}</Label>
                        <Input
                          data-testid={`admin-user-edit-firstname-${user.id}`}
                          value={editForm.firstname}
                          onChange={(e) => onEditChange('firstname', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>{t('admin.userCrud.lastName')}</Label>
                        <Input
                          data-testid={`admin-user-edit-lastname-${user.id}`}
                          value={editForm.lastname}
                          onChange={(e) => onEditChange('lastname', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label>{t('admin.userCrud.role')}</Label>
                        <select
                          data-testid={`admin-user-edit-role-${user.id}`}
                          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                          value={editForm.role}
                          onChange={(e) => onEditChange('role', e.target.value as UserRole)}
                        >
                          <option value="admin">{t('admin.userCrud.roles.admin')}</option>
                          <option value="manager">{t('admin.userCrud.roles.manager')}</option>
                          <option value="staff">{t('admin.userCrud.roles.staff')}</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>{t('admin.userCrud.status')}</Label>
                        <select
                          data-testid={`admin-user-edit-status-${user.id}`}
                          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                          value={editForm.status}
                          onChange={(e) => onEditChange('status', e.target.value as UserStatus)}
                        >
                          <option value="active">{t('admin.userCrud.statuses.active')}</option>
                          <option value="inactive">{t('admin.userCrud.statuses.inactive')}</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>{t('admin.userCrud.branch')}</Label>
                        <select
                          data-testid={`admin-user-edit-branch-${user.id}`}
                          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                          value={editForm.branchId}
                          onChange={(e) => onEditChange('branchId', e.target.value)}
                        >
                          <option value="">{t('common.none')}</option>
                          {branches.map((branch) => (
                            <option key={branch.id} value={branch.id}>
                              {branch.branchName} ({branch.country})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>{t('admin.userCrud.newPasswordOptional')}</Label>
                      <Input
                        type="password"
                        minLength={6}
                        data-testid={`admin-user-edit-password-${user.id}`}
                        value={editForm.password}
                        onChange={(e) => onEditChange('password', e.target.value)}
                        placeholder={t('admin.userCrud.newPasswordPlaceholder')}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={cancelEdit} disabled={actionLoading}>
                        {t('common.cancel')}
                      </Button>
                      <Button type="button" onClick={() => saveEdit(user.id)} disabled={actionLoading} data-testid={`admin-user-save-${user.id}`}>
                        {actionLoading ? t('admin.userCrud.saving') : t('common.save')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end gap-2 border-t pt-3">
                    <Button type="button" variant="outline" onClick={() => startEdit(user)} disabled={actionLoading} data-testid={`admin-user-edit-${user.id}`}>
                      {t('admin.userCrud.edit')}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => deactivateUser(user.id)}
                      disabled={actionLoading || user.id === currentUserId}
                      data-testid={`admin-user-delete-${user.id}`}
                    >
                      {actionLoading ? t('admin.userCrud.working') : t('admin.userCrud.delete')}
                    </Button>
                  </div>
                )}
              </div>
            )
          })}

          {filteredUsers.length === 0 && (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              {t('admin.userCrud.noUsersFound')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
