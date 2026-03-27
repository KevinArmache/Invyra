'use client'

import { useEffect, useState, useTransition } from 'react'
import { updateUserRole, suspendUser, deleteUserAdmin } from '@/app/actions/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Shield, User, Ban, Trash2, CheckCircle, MoreVertical, RefreshCw } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useTranslation } from '@/utils/i18n/Context'
import { Input } from '@/components/ui/input'

function RoleBadge({ role }) {
  const { t } = useTranslation()

  if (role === 'admin') return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded-full">
      <Shield className="w-3 h-3" /> Admin
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 border border-border px-2 py-0.5 rounded-full">
      <User className="w-3 h-3" /> {t('portal.admin.standard_user')}
    </span>
  )
}

export default function UsersTable({ initialUsers }) {
  const { t, locale } = useTranslation()
  const [users, setUsers] = useState(initialUsers ?? [])
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState('')

  // Resync when data arrives from parent (fetch in AdminUsersPage)
  useEffect(() => {
    setUsers(initialUsers ?? [])
  }, [initialUsers])

  function refresh(updatedUser) {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
  }

  function handleToggleRole(user) {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    startTransition(async () => {
      try {
        const updated = await updateUserRole(user.id, newRole)
        refresh(updated)
        const roleLabel = newRole === 'admin' ? 'admin' : t('portal.admin.standard_user')
        toast.success(
          t('portal.admin.role_updated')
            .replace('{name}', updated.name || updated.email)
            .replace('{role}', roleLabel)
        )
      } catch (e) {
        toast.error(e.message)
      }
    })
  }

  function handleToggleSuspend(user) {
    startTransition(async () => {
      try {
        const updated = await suspendUser(user.id, !user.suspended)
        refresh(updated)
        toast.success(updated.suspended ? t('portal.admin.account_suspended') : t('portal.admin.account_reactivated'))
      } catch (e) {
        toast.error(e.message)
      }
    })
  }

  function handleDelete(user) {
    if (!confirm(t('portal.admin.delete_account_confirm').replace('{name}', user.name || user.email))) return
    startTransition(async () => {
      try {
        await deleteUserAdmin(user.id)
        setUsers(prev => prev.filter(u => u.id !== user.id))
        toast.success(t('portal.admin.account_deleted'))
      } catch (e) {
        toast.error(e.message)
      }
    })
  }

  const normalizedQuery = query.trim().toLowerCase()
  const filteredUsers = users.filter((user) => {
    if (!normalizedQuery) return true
    const name = (user.name || '').toLowerCase()
    const email = (user.email || '').toLowerCase()
    const company = (user.company || '').toLowerCase()
    return (
      name.includes(normalizedQuery) ||
      email.includes(normalizedQuery) ||
      company.includes(normalizedQuery)
    )
  })

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={locale === 'fr' ? 'Rechercher un utilisateur...' : 'Search a user...'}
        />
      </div>
      {isPending && (
        <div className="px-6 py-2 bg-primary/5 border-b border-border flex items-center gap-2 text-xs text-primary">
          <RefreshCw className="w-3 h-3 animate-spin" /> {t('portal.admin.updating')}
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('portal.admin.user')}</th>
            <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('portal.admin.role')}</th>
            <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('portal.admin.events')}</th>
            <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('portal.admin.status')}</th>
            <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('portal.admin.registered_on')}</th>
            <th className="px-6 py-3" />
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(user => (
            <tr key={user.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
              <td className="px-6 py-4">
                <div>
                  <p className="font-medium">{user.name || '—'}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  {user.company && <p className="text-xs text-muted-foreground">{user.company}</p>}
                </div>
              </td>
              <td className="px-6 py-4">
                <RoleBadge role={user.role} />
              </td>
              <td className="px-6 py-4 text-muted-foreground">
                {user._count?.events ?? 0}
              </td>
              <td className="px-6 py-4">
                {user.suspended ? (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                    <Ban className="w-3 h-3" /> {t('portal.admin.suspended')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> {t('portal.admin.active')}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-xs text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
              </td>
              <td className="px-6 py-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => handleToggleRole(user)}>
                      <Shield className="w-4 h-4 mr-2 text-primary" />
                      {user.role === 'admin' ? t('portal.admin.demote_user') : t('portal.admin.promote_admin')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleSuspend(user)}>
                      <Ban className="w-4 h-4 mr-2 text-amber-400" />
                      {user.suspended ? t('portal.admin.reactivate_account') : t('portal.admin.suspend_account')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDelete(user)} className="text-destructive focus:text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('portal.admin.delete_forever')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredUsers.length === 0 && (
        <div className="py-16 text-center text-muted-foreground text-sm">{t('portal.admin.no_users')}</div>
      )}
    </div>
  )
}
