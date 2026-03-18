'use client'

import { use, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getEventById, deleteEvent } from '@/app/actions/event'
import { getGuests, sendBulkInvitations, deleteGuest } from '@/app/actions/guest'
import { sendInvitationEmail, generateWhatsAppLink, markWhatsAppSent } from '@/app/actions/notify'
import { Calendar, MapPin, Mail, Edit, Trash2, ArrowLeft, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import TabOverview from '@/components/dashboard/event-details/TabOverview'
import TabGuests from '@/components/dashboard/event-details/TabGuests'

export default function EventDetailPage({ params }) {
  const router = useRouter()
  const { id } = use(params)

  const [event, setEvent] = useState(null)
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [sendingBulk, setSendingBulk] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [eData, gData] = await Promise.all([getEventById(id), getGuests(id)])
      setEvent(eData)
      setGuests(gData)
    } catch (err) {
      console.error(err)
      router.push('/dashboard/events')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { loadData() }, [loadData])

  async function handleDeleteEvent() {
    if (!confirm('Voulez-vous vraiment supprimer cet événement ?')) return
    setDeleting(true)
    try {
      await deleteEvent(id)
      toast.success('Événement supprimé.')
      router.push('/dashboard/events')
    } catch (e) {
      toast.error('Erreur: ' + e.message)
      setDeleting(false)
    }
  }

  async function handleSendBulk() {
    if (!confirm("Envoyer les invitations à tous les invités n'ayant pas encore reçu d'email ?")) return
    setSendingBulk(true)
    try {
      const res = await sendBulkInvitations(id)
      toast.success(res.message)
      loadData()
    } catch (e) {
      toast.error('Erreur: ' + e.message)
    } finally {
      setSendingBulk(false)
    }
  }

  async function handleSendSingleEmail(guestId) {
    try {
      await sendInvitationEmail(guestId)
      toast.success('Email envoyé avec succès !')
      loadData()
    } catch (e) {
      toast.error("Erreur lors de l'envoi: " + e.message)
    }
  }

  async function handleSendWhatsApp(guestId) {
    try {
      const res = await generateWhatsAppLink(guestId)
      window.open(res.link, '_blank')
      await markWhatsAppSent(guestId)
      loadData()
    } catch (e) {
      toast.error('Erreur WhatsApp: ' + e.message)
    }
  }

  async function handleRemoveGuest(guestId) {
    if (!confirm('Supprimer cet invité ?')) return
    try {
      await deleteGuest(guestId)
      toast.success('Invité supprimé.')
      loadData()
    } catch (e) {
      toast.error(e.message)
    }
  }

  if (loading) {
    return <div className="h-40 flex items-center justify-center"><RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" /></div>
  }
  if (!event) return null

  const demoEvent = {
    title: event.title,
    eventDate: event.eventDate,
    location: event.location,
    time: event.time || '',
    dressCode: event.dressCode || '',
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <Link href="/dashboard/events" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
            <ArrowLeft className="w-4 h-4" /> Retour aux événements
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            {event.eventDate && (
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {format(new Date(event.eventDate), 'PPP', { locale: fr })}</span>
            )}
            {event.location && (
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {event.location}</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {event.invitationTemplate && (
            <Button variant="secondary" onClick={handleSendBulk} disabled={sendingBulk}>
              <Mail className="w-4 h-4 mr-2" />
              {sendingBulk ? 'Envoi...' : 'Envoyer les invitations'}
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/dashboard/events/${id}/edit`}><Edit className="w-4 h-4 mr-2" /> Éditer</Link>
          </Button>
          <Button variant="destructive" onClick={handleDeleteEvent} disabled={deleting}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="guests">Invités ({guests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <TabOverview event={{ ...event, id }} guests={guests} demoEvent={demoEvent} />
        </TabsContent>

        <TabsContent value="guests" className="mt-6">
          <TabGuests
            guests={guests}
            eventId={id}
            onRefresh={loadData}
            onSendSingleEmail={handleSendSingleEmail}
            onSendWhatsApp={handleSendWhatsApp}
            onRemoveGuest={handleRemoveGuest}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
