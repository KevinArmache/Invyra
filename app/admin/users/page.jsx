'use client'

import { useEffect, useState } from 'react'
import { getAllUsers } from '@/app/actions/admin'
import UsersTable from '@/components/admin/UsersTable'
import { Users } from 'lucide-react'
import { useTranslation } from '@/utils/i18n/Context'
import { toast } from 'sonner'

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const data = await getAllUsers()
        if (!alive) return
        setUsers(data || [])
      } catch (e) {
        if (!alive) return
        const message = e?.message || "Impossible de charger la liste des utilisateurs."
        setUsers([])
        setError(message)
        toast.error(message)
      } finally {
        if (!alive) return
        setLoading(false)
      }
    }

    load()
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            {t('portal.admin.users_management')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('portal.admin.users_count').replace('{count}', String(users.length))}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Chargement...
        </div>
      ) : (
        <UsersTable initialUsers={users} />
      )}
    </div>
  )
}
