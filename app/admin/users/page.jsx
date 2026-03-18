import { getAllUsers } from '@/app/actions/admin'
import UsersTable from '@/components/admin/UsersTable'
import { Users } from 'lucide-react'

export const metadata = { title: 'Utilisateurs — Invyra Admin' }

export default async function AdminUsersPage() {
  const users = await getAllUsers()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Gestion des utilisateurs
          </h1>
          <p className="text-muted-foreground mt-1">
            {users.length} utilisateur{users.length > 1 ? 's' : ''} inscrit{users.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <UsersTable initialUsers={users} />
    </div>
  )
}
