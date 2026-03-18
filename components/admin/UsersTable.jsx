'use client'

import { useState, useTransition } from 'react'
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

function RoleBadge({ role }) {
  if (role === 'admin') return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded-full">
      <Shield className="w-3 h-3" /> Admin
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 border border-border px-2 py-0.5 rounded-full">
      <User className="w-3 h-3" /> Utilisateur
    </span>
  )
}

export default function UsersTable({ initialUsers }) {
  const [users, setUsers] = useState(initialUsers)
  const [isPending, startTransition] = useTransition()

  function refresh(updatedUser) {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
  }

  function handleToggleRole(user) {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    startTransition(async () => {
      try {
        const updated = await updateUserRole(user.id, newRole)
        refresh(updated)
        toast.success(`Rôle mis à jour : ${updated.name || updated.email} → ${newRole}`)
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
        toast.success(updated.suspended ? 'Compte suspendu' : 'Compte réactivé')
      } catch (e) {
        toast.error(e.message)
      }
    })
  }

  function handleDelete(user) {
    if (!confirm(`Supprimer définitivement le compte de ${user.name || user.email} ?`)) return
    startTransition(async () => {
      try {
        await deleteUserAdmin(user.id)
        setUsers(prev => prev.filter(u => u.id !== user.id))
        toast.success('Compte supprimé')
      } catch (e) {
        toast.error(e.message)
      }
    })
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {isPending && (
        <div className="px-6 py-2 bg-primary/5 border-b border-border flex items-center gap-2 text-xs text-primary">
          <RefreshCw className="w-3 h-3 animate-spin" /> Mise à jour en cours...
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Utilisateur</th>
            <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Rôle</th>
            <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Événements</th>
            <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Statut</th>
            <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Inscrit le</th>
            <th className="px-6 py-3" />
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
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
                    <Ban className="w-3 h-3" /> Suspendu
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Actif
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-xs text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString('fr-FR')}
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
                      {user.role === 'admin' ? 'Rétrograder en User' : 'Promouvoir Admin'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleSuspend(user)}>
                      <Ban className="w-4 h-4 mr-2 text-amber-400" />
                      {user.suspended ? 'Réactiver le compte' : 'Suspendre le compte'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDelete(user)} className="text-destructive focus:text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer définitivement
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <div className="py-16 text-center text-muted-foreground text-sm">Aucun utilisateur</div>
      )}
    </div>
  )
}
