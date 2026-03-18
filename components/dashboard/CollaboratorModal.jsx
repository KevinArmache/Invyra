'use client'

import { useState, useTransition } from 'react'
import { addCollaborator, removeCollaborator, updateCollaboratorRole } from '@/app/actions/collaborator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserPlus, Trash2, Users, Shield, Eye, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

function CollabRoleBadge({ role }) {
  if (role === 'editor') return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
      <Shield className="w-3 h-3" /> Éditeur
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 border border-border px-2 py-0.5 rounded-full">
      <Eye className="w-3 h-3" /> Lecteur
    </span>
  )
}

export default function CollaboratorModal({ open, onClose, eventId, initialCollaborators = [] }) {
  const [collaborators, setCollaborators] = useState(initialCollaborators)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('editor')
  const [isPending, startTransition] = useTransition()

  function handleAdd() {
    if (!email.trim()) return
    startTransition(async () => {
      try {
        const collab = await addCollaborator(eventId, email.trim(), role)
        setCollaborators(prev => [...prev, collab])
        setEmail('')
        toast.success(`${collab.user.name || collab.user.email} ajouté comme ${role === 'editor' ? 'éditeur' : 'lecteur'}`)
      } catch (e) {
        toast.error(e.message)
      }
    })
  }

  function handleRemove(collabId) {
    startTransition(async () => {
      try {
        await removeCollaborator(collabId, eventId)
        setCollaborators(prev => prev.filter(c => c.id !== collabId))
        toast.success('Collaborateur retiré')
      } catch (e) {
        toast.error(e.message)
      }
    })
  }

  function handleRoleChange(collabId, newRole) {
    startTransition(async () => {
      try {
        const updated = await updateCollaboratorRole(collabId, eventId, newRole)
        setCollaborators(prev => prev.map(c => c.id === collabId ? { ...c, role: updated.role } : c))
        toast.success('Rôle mis à jour')
      } catch (e) {
        toast.error(e.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Collaborateurs
        </DialogTitle>

        {/* Formulaire ajout */}
        <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border">
          <p className="text-sm font-medium">Inviter un collaborateur</p>
          <p className="text-xs text-muted-foreground">L&apos;utilisateur doit déjà avoir un compte Invyra.</p>
          <div className="flex gap-2">
            <Input
              placeholder="Email du collaborateur"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className="flex-1"
            />
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">Éditeur</SelectItem>
                <SelectItem value="viewer">Lecteur</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} disabled={!email.trim() || isPending} className="w-full gap-2">
            {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Ajouter
          </Button>
        </div>

        {/* Liste des collaborateurs */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {collaborators.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Aucun collaborateur pour le moment</p>
          ) : (
            collaborators.map(c => (
              <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-card">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-sm font-bold shrink-0 uppercase">
                  {(c.user.name || c.user.email)?.[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{c.user.name || '—'}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.user.email}</p>
                </div>
                <Select value={c.role} onValueChange={val => handleRoleChange(c.id, val)}>
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">Éditeur</SelectItem>
                    <SelectItem value="viewer">Lecteur</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => handleRemove(c.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
