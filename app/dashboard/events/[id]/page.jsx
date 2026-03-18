'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getEventById, updateEvent, deleteEvent } from '@/app/actions/event'
import { getGuests, sendBulkInvitations } from '@/app/actions/guest'
import { getUserTemplates } from '@/app/actions/template'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import RSVPTracker from '@/components/invitation/RSVPTracker'
import CSVImporter from '@/components/invitation/CSVImporter'
import InvitationPreview from '@/components/invitation/InvitationPreview'
import { addGuest, deleteGuest } from '@/app/actions/guest'
import { Calendar, MapPin, Users, Mail, Edit, Trash2, ArrowLeft, RefreshCw, Eye, UserPlus, CheckCircle, XCircle, HelpCircle, Clock, LayoutTemplate, Replace, Check, X } from 'lucide-react'

export default function EventDetailPage({ params }) {
  const router = useRouter()
  const { id } = use(params)
  
  const [event, setEvent] = useState(null)
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [sendingBulk, setSendingBulk] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddGuest, setShowAddGuest] = useState(false)
  const [newGuest, setNewGuest] = useState({ name: '', email: '', phone: '' })

  // Template switcher state
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [savedTemplates, setSavedTemplates] = useState([])
  const [selectedForSwap, setSelectedForSwap] = useState(null)
  const [swapping, setSwapping] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [eData, gData] = await Promise.all([
        getEventById(id),
        getGuests(id)
      ])
      setEvent(eData)
      setGuests(gData)
    } catch (err) {
      console.error(err)
      router.push('/dashboard/events')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  async function openTemplatePicker() {
    setShowTemplatePicker(true)
    setSelectedForSwap(null)
    const templates = await getUserTemplates()
    setSavedTemplates(templates)
  }

  async function handleApplyTemplate() {
    if (!selectedForSwap) return
    setSwapping(true)
    try {
      await updateEvent(id, { invitation_template: selectedForSwap.config })
      setEvent(prev => ({ ...prev, invitationTemplate: selectedForSwap.config }))
      setShowTemplatePicker(false)
      setSelectedForSwap(null)
    } catch (e) {
      alert(e.message)
    } finally {
      setSwapping(false)
    }
  }

  async function handleDeleteEvent() {
    if (!confirm("Voulez-vous vraiment supprimer cet événement ?")) return
    setDeleting(true)
    try {
      await deleteEvent(id)
      router.push('/dashboard/events')
    } catch (e) {
      alert("Erreur: " + e.message)
      setDeleting(false)
    }
  }

  async function handleSendBulk() {
    if (!confirm("Envoyer les invitations à tous les invités n'ayant pas encore reçu d'email ?")) return
    setSendingBulk(true)
    try {
      const res = await sendBulkInvitations(id)
      alert(`${res.sentCount} invitations envoyées !`)
      loadData()
    } catch (e) {
      alert("Erreur: " + e.message)
    } finally {
      setSendingBulk(false)
    }
  }

  async function handleAddGuest() {
    if (!newGuest.name || !newGuest.email) return
    try {
      await addGuest(id, newGuest)
      setNewGuest({ name: '', email: '', phone: '' })
      setShowAddGuest(false)
      loadData()
    } catch (e) {
      alert(e.message)
    }
  }

  async function handleRemoveGuest(guestId) {
    if (!confirm("Supprimer cet invité ?")) return
    try {
      await deleteGuest(guestId)
      loadData()
    } catch (e) {
      alert(e.message)
    }
  }

  if (loading) {
    return <div className="h-40 flex items-center justify-center"><RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" /></div>
  }

  if (!event) return null

  const isSent = (guest) => guest.invitationSentAt !== null

  const demoEvent = {
    title: event.title,
    eventDate: event.eventDate,
    location: event.location,
    time: event.time || '',
    dressCode: event.dressCode || event.dress_code || '',
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
          {event.invitationTemplate ? (
            <Button variant="secondary" onClick={handleSendBulk} disabled={sendingBulk}>
              <Mail className="w-4 h-4 mr-2" />
              {sendingBulk ? 'Envoi...' : 'Envoyer les invitations'}
            </Button>
          ) : null}
          <Button variant="destructive" onClick={handleDeleteEvent} disabled={deleting}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="guests">Invités ({guests.length})</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Suivi des réponses RSVP</CardTitle>
              <CardDescription>Statistiques en temps réel des réponses de vos invités</CardDescription>
            </CardHeader>
            <CardContent>
              <RSVPTracker guests={guests} />
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* ── Template Card ────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Modèle d'invitation</span>
                  <Button size="sm" variant="outline" onClick={openTemplatePicker} className="gap-1.5 text-xs">
                    <Replace className="w-3.5 h-3.5" />
                    {event.invitationTemplate ? 'Changer le modèle' : 'Choisir un modèle'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.invitationTemplate ? (
                  <>
                    {/* Mini preview of current template */}
                    <div className="relative h-48 rounded-lg overflow-hidden border border-border shadow-sm">
                      <InvitationPreview
                        template={event.invitationTemplate}
                        event={demoEvent}
                        guestName="Exemple Invité"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-green-500 font-medium bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20">
                      <CheckCircle className="w-4 h-4" /> Modèle actif
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 border border-dashed border-border rounded-lg space-y-2">
                    <LayoutTemplate className="w-8 h-8 mx-auto text-muted-foreground opacity-30" />
                    <p className="text-sm text-muted-foreground">Aucun modèle sélectionné</p>
                    <p className="text-xs text-muted-foreground">Choisissez un modèle pour envoyer vos invitations</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Résumé de l'événement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.description && (
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Description</span>
                    <p className="text-sm mt-1">{event.description}</p>
                  </div>
                )}
                {event.customMessage && (
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Message aux invités</span>
                    <p className="text-sm mt-1 italic">"{event.customMessage}"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="guests" className="mt-6 space-y-6">
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
                        for (const g of gs) {
                          await addGuest(id, g).catch(()=>{})
                        }
                        loadData()
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
                      <th className="px-4 py-3 font-medium">Nom</th>
                      <th className="px-4 py-3 font-medium">Contact</th>
                      <th className="px-4 py-3 font-medium">Invitation</th>
                      <th className="px-4 py-3 font-medium">RSVP</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {guests.map((g) => (
                      <tr key={g.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{g.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {g.email}
                          {g.phone && <div className="text-xs">{g.phone}</div>}
                        </td>
                        <td className="px-4 py-3">
                          {isSent(g) ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                              <Mail className="w-3 h-3" /> Envoyée
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border">
                              <Clock className="w-3 h-3" /> En attente
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {g.rsvpStatus === 'confirmed' && <span className="inline-flex items-center gap-1 text-green-500 text-xs font-medium"><CheckCircle className="w-3 h-3" /> Confirmé</span>}
                          {g.rsvpStatus === 'declined' && <span className="inline-flex items-center gap-1 text-red-500 text-xs font-medium"><XCircle className="w-3 h-3" /> Décliné</span>}
                          {g.rsvpStatus === 'maybe' && <span className="inline-flex items-center gap-1 text-yellow-500 text-xs font-medium"><HelpCircle className="w-3 h-3" /> Peut-être</span>}
                          {(!g.rsvpStatus || g.rsvpStatus === 'pending') && <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveGuest(g.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
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
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres avancés</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">La modification des paramètres avancés est disponible via le wizard ou la page d'édition globale.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Template Picker Modal ─────────────────── */}
      {showTemplatePicker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={e => { if(e.target === e.currentTarget) setShowTemplatePicker(false) }}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Choisir un modèle</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Sélectionnez un modèle pour l'appliquer à cet événement</p>
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/templates/new" target="_blank">+ Nouveau modèle</Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setShowTemplatePicker(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {savedTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <LayoutTemplate className="w-10 h-10 mx-auto text-muted-foreground opacity-30 mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">Aucun modèle sauvegardé</p>
                  <Button asChild size="sm">
                    <Link href="/dashboard/templates/new" target="_blank">Créer mon premier modèle</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {savedTemplates.map(tmpl => (
                    <button
                      key={tmpl.id}
                      onClick={() => setSelectedForSwap(tmpl)}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all aspect-[3/4] ${
                        selectedForSwap?.id === tmpl.id
                          ? 'border-primary ring-2 ring-primary'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="absolute inset-0 scale-[0.55] origin-top pointer-events-none" style={{ width: '182%', height: '182%' }}>
                        <InvitationPreview template={tmpl.config} event={demoEvent} guestName="Marie Dupont" />
                      </div>
                      {selectedForSwap?.id === tmpl.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-primary-foreground" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1.5">
                        <p className="text-xs text-white font-medium truncate">{tmpl.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {savedTemplates.length > 0 && (
              <div className="p-4 border-t border-border flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowTemplatePicker(false)}>Annuler</Button>
                <Button onClick={handleApplyTemplate} disabled={!selectedForSwap || swapping}>
                  {swapping ? 'Application...' : 'Appliquer ce modèle'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
