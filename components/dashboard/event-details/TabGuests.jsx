'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Trash2, UserPlus, CheckCircle, XCircle, HelpCircle, MessageCircle } from 'lucide-react'
import CSVImporter from '@/components/invitation/CSVImporter'
import { addGuest } from '@/app/actions/guest'
import { toast } from 'sonner'

export default function TabGuests({ guests, eventId, onRefresh, onSendSingleEmail, onSendWhatsApp, onRemoveGuest }) {
  const [showAddGuest, setShowAddGuest] = useState(false)
  const [newGuest, setNewGuest] = useState({ name: '', email: '', phone: '' })

  async function handleAddGuest() {
    if (!newGuest.name || !newGuest.email) return
    try {
      await addGuest(eventId, newGuest)
      setNewGuest({ name: '', email: '', phone: '' })
      setShowAddGuest(false)
      toast.success('Invité ajouté.')
      onRefresh()
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Liste des invités</CardTitle>
          <CardDescription>Gérez vos invités et suivez leurs statuts individuels</CardDescription>
        </div>
        <Button size="sm" onClick={() => setShowAddGuest(!showAddGuest)}>
          {showAddGuest ? 'Fermer' : <><UserPlus className="w-4 h-4 mr-2" /> Ajouter</>}
        </Button>
      </CardHeader>

      <CardContent>
        {showAddGuest && (
          <div className="grid md:grid-cols-2 gap-6 mb-6 p-4 bg-muted/30 rounded-lg border border-border">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Ajout manuel</h3>
              <Input placeholder="Nom *" value={newGuest.name} onChange={e => setNewGuest(g => ({ ...g, name: e.target.value }))} className="bg-background" />
              <Input placeholder="Email *" type="email" value={newGuest.email} onChange={e => setNewGuest(g => ({ ...g, email: e.target.value }))} className="bg-background" />
              <Input placeholder="Téléphone" value={newGuest.phone} onChange={e => setNewGuest(g => ({ ...g, phone: e.target.value }))} className="bg-background" />
              <Button onClick={handleAddGuest} disabled={!newGuest.name || !newGuest.email}>Ajouter</Button>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Import CSV</h3>
              <CSVImporter
                onImport={async (gs) => {
                  for (const g of gs) await addGuest(eventId, g).catch(() => {})
                  onRefresh()
                  setShowAddGuest(false)
                }}
              />
            </div>
          </div>
        )}

        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Invité</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">WhatsApp</th>
                <th className="px-4 py-3 font-medium">RSVP</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {guests.map((g) => (
                <tr key={g.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    {g.name}
                    {g.plusOne && <span className="ml-2 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">+1</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="text-xs mb-1 truncate max-w-[150px]">{g.email}</div>
                    {g.emailSentAt || g.invitationSentAt ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded border border-blue-500/20">
                        <CheckCircle className="w-3 h-3" /> Envoyé {format(new Date(g.emailSentAt || g.invitationSentAt), 'dd/MM')}
                      </span>
                    ) : (
                      <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => onSendSingleEmail(g.id)}>
                        <Mail className="w-3 h-3 mr-1" /> Envoyer
                      </Button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="text-xs mb-1">{g.phone || <span className="text-muted-foreground/50">Aucun</span>}</div>
                    {g.phone && (
                      g.whatsappSentAt ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded border border-green-500/20">
                          <CheckCircle className="w-3 h-3" /> Envoyé {format(new Date(g.whatsappSentAt), 'dd/MM')}
                        </span>
                      ) : (
                        <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 text-green-600 border-green-200 hover:bg-green-50" onClick={() => onSendWhatsApp(g.id)}>
                          <MessageCircle className="w-3 h-3 mr-1" /> WhatsApp
                        </Button>
                      )
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {g.rsvpStatus === 'confirmed' && <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle className="w-3 h-3" /> Confirmé</span>}
                    {g.rsvpStatus === 'declined' && <span className="inline-flex items-center gap-1 text-red-500 text-xs font-medium"><XCircle className="w-3 h-3" /> Décliné</span>}
                    {g.rsvpStatus === 'maybe' && <span className="inline-flex items-center gap-1 text-yellow-600 text-xs font-medium"><HelpCircle className="w-3 h-3" /> Peut-être</span>}
                    {(!g.rsvpStatus || g.rsvpStatus === 'pending') && <span className="text-muted-foreground text-xs">—</span>}

                    {(g.dietaryRestrictions || g.notes) && (
                      <div className="text-[10px] mt-1 text-muted-foreground max-w-[150px] truncate" title={`${g.dietaryRestrictions || ''} ${g.notes || ''}`}>
                        {g.dietaryRestrictions && <span className="mr-1">🍽️ {g.dietaryRestrictions}</span>}
                        {g.notes && <span>📝 {g.notes}</span>}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => onRemoveGuest(g.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {guests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Aucun invité ajouté pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
