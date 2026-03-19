'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Mail, Trash2, UserPlus, CheckCircle, XCircle, HelpCircle, MessageCircle, Clock, Send, RefreshCw, Search } from 'lucide-react'
import CSVImporter from '@/components/invitation/CSVImporter'
import { addGuest } from '@/app/actions/guest'
import { toast } from 'sonner'
import { useTranslation } from '@/utils/i18n/Context'

function RSVPBadge({ status }) {
  const { t } = useTranslation()
  if (status === 'confirmed') return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
      <CheckCircle className="w-3 h-3" /> {t('portal.events.details.guests.status.attending')}
    </span>
  )
  if (status === 'declined') return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded-full">
      <XCircle className="w-3 h-3" /> {t('portal.events.details.guests.status.declined')}
    </span>
  )
  if (status === 'maybe') return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
      <HelpCircle className="w-3 h-3" /> {t('portal.events.details.guests.status.pending')}
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 border border-border px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" /> {t('portal.events.details.guests.status.pending')}
    </span>
  )
}

function GuestRow({ g, onSendSingleEmail, onSendWhatsApp, onRemoveGuest }) {
  const [isSending, setIsSending] = useState(false)
  const emailSent = !!(g.emailSentAt || g.invitationSentAt)
  const whatsappSent = !!g.whatsappSentAt

  async function handleSendEmail() {
    setIsSending(true)
    await onSendSingleEmail(g.id)
    setIsSending(false)
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5 border-b border-border last:border-0 hover:bg-muted/20 transition-colors group">
      {/* Avatar + Nom */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0 text-sm font-bold text-primary uppercase">
          {g.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-sm flex items-center gap-1.5">
            {g.name}
            {g.plusOne && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium">+1</span>}
          </div>
          <div className="text-xs text-muted-foreground truncate">{g.email}</div>
          {g.phone && <div className="text-xs text-muted-foreground">{g.phone}</div>}
        </div>
      </div>

      {/* RSVP */}
      <div className="shrink-0">
        <RSVPBadge status={g.rsvpStatus} />
        {(g.dietaryRestrictions || g.notes) && (
          <div className="text-[10px] mt-1 text-muted-foreground truncate max-w-[120px]" title={`${g.dietaryRestrictions || ''} ${g.notes || ''}`}>
            {g.dietaryRestrictions && <span className="mr-1">🍽️ {g.dietaryRestrictions}</span>}
            {g.notes && <span>📝 {g.notes}</span>}
          </div>
        )}
      </div>

      {/* Actions de notification */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Email */}
        <Button
          size="sm"
          variant={emailSent ? "secondary" : "outline"}
          onClick={handleSendEmail}
          disabled={isSending}
          className={`h-8 gap-1.5 text-xs transition-all ${emailSent ? 'text-blue-500 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20' : 'border-border hover:border-primary/50 hover:text-primary hover:bg-primary/5'}`}
        >
          {isSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : emailSent ? <CheckCircle className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
          {emailSent ? 'Renvoyer' : 'Email'}
        </Button>

        {/* WhatsApp */}
        {g.phone && (
          <Button
            size="sm"
            variant={whatsappSent ? "secondary" : "outline"}
            onClick={() => onSendWhatsApp(g.id)}
            className={`h-8 gap-1.5 text-xs transition-all ${whatsappSent ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20' : 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/15 hover:border-emerald-500/60'}`}
          >
            {whatsappSent ? <CheckCircle className="w-3.5 h-3.5" /> : <MessageCircle className="w-3.5 h-3.5" />}
            {whatsappSent ? 'Renvoyer' : 'WhatsApp'}
          </Button>
        )}

        {/* Supprimer */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemoveGuest(g.id)}
          className="h-8 w-8 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

export default function TabGuests({ guests, eventId, onRefresh, onSendSingleEmail, onSendWhatsApp, onRemoveGuest }) {
  const { t } = useTranslation()
  const [showAddGuest, setShowAddGuest] = useState(false)
  const [newGuest, setNewGuest] = useState({ name: '', email: '', phone: '' })
  const [searchQuery, setSearchQuery] = useState('')

  async function handleAddGuest() {
    if (!newGuest.name || !newGuest.email) return
    try {
      await addGuest(eventId, newGuest)
      setNewGuest({ name: '', email: '', phone: '' })
      setShowAddGuest(false)
      toast.success(t('portal.events.new.success_guest'))
      onRefresh()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const confirmed = guests.filter(g => g.rsvpStatus === 'confirmed').length
  const pending = guests.filter(g => !g.rsvpStatus || g.rsvpStatus === 'pending').length

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle>{t('portal.events.details.guests.title')}</CardTitle>
          <CardDescription className="flex items-center gap-3 mt-1">
            <span>{guests.length} {t('portal.events.list.guests')}</span>
            {confirmed > 0 && <span className="text-emerald-500 font-medium">{confirmed} {t('portal.events.details.guests.status.attending')}</span>}
            {pending > 0 && <span className="text-amber-500 font-medium">{pending} {t('portal.events.details.guests.status.pending')}</span>}
          </CardDescription>
        </div>
        <Button
          size="sm"
          variant={showAddGuest ? 'secondary' : 'default'}
          onClick={() => setShowAddGuest(!showAddGuest)}
          className="gap-1.5"
        >
          <UserPlus className="w-4 h-4" />
          {showAddGuest ? t('common.close') : t('portal.events.details.guests.add_btn')}
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        {showAddGuest && (
          <div className="mx-6 mb-4 grid md:grid-cols-2 gap-6 p-4 bg-muted/30 rounded-xl border border-border">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><UserPlus className="w-4 h-4 text-primary" /> {t('portal.events.new.add_guest')}</h3>
              <Input placeholder={t('portal.events.new.labels.name')} value={newGuest.name} onChange={e => setNewGuest(g => ({ ...g, name: e.target.value }))} className="bg-background" />
              <Input placeholder={t('portal.events.new.labels.email')} type="email" value={newGuest.email} onChange={e => setNewGuest(g => ({ ...g, email: e.target.value }))} className="bg-background" />
              <Input placeholder={t('portal.events.new.labels.phone')} value={newGuest.phone} onChange={e => setNewGuest(g => ({ ...g, phone: e.target.value }))} className="bg-background" />
              <Button onClick={handleAddGuest} disabled={!newGuest.name || !newGuest.email} className="w-full gap-2">
                <UserPlus className="w-4 h-4" /> {t('portal.events.new.buttons.add')}
              </Button>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">{t('portal.events.new.import_csv')}</h3>
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

        {/* Search Bar */}
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher un invité par nom ou email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/20 border-border/50"
            />
          </div>
        </div>

        {/* Guest List */}
        <div className="rounded-b-xl overflow-hidden">
          {guests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <UserPlus className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">{t('portal.events.new.no_guests_yet')}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{t('portal.events.details.guests.add_btn')}</p>
            </div>
          ) : (
            guests.filter(g => 
              g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
              g.email.toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">Aucun invité ne correspond à votre recherche.</div>
            ) : (
              guests.filter(g => 
                g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                g.email.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(g => (
                <GuestRow
                  key={g.id}
                  g={g}
                  onSendSingleEmail={onSendSingleEmail}
                  onSendWhatsApp={onSendWhatsApp}
                  onRemoveGuest={onRemoveGuest}
                />
              ))
            )
          )}
        </div>
      </CardContent>
    </Card>
  )
}
