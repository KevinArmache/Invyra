'use client'

import { useEffect, useState } from 'react'
import { getAllUsers } from '@/app/actions/admin'
import UsersTable from '@/components/admin/UsersTable'
import { Users } from 'lucide-react'
import { useTranslation } from '@/utils/i18n/Context'

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const [users, setUsers] = useState([])

  useEffect(() => {
    getAllUsers().then((data) => setUsers(data || [])).catch(() => setUsers([]))
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

      <UsersTable initialUsers={users} />
    </div>
  )
}
