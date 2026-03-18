'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Calendar, MapPin, FileText, ArrowRight, ArrowLeft, Sparkles, Check, Plus, LayoutTemplate, Clock, Shirt } from 'lucide-react'
import { createEvent, updateEvent } from '@/app/actions/event'
import { addGuest } from '@/app/actions/guest'
import { getUserTemplates } from '@/app/actions/template'
import InvitationPreview from '@/components/invitation/InvitationPreview'
import CSVImporter from '@/components/invitation/CSVImporter'

const STEPS = [
  { id: 1, label: 'Informations', icon: FileText },
  { id: 2, label: 'Modèle', icon: LayoutTemplate },
  { id: 3, label: 'Invités', icon: Calendar },
]

export default function NewEventPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [createdEventId, setCreatedEventId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [guestForm, setGuestForm] = useState({ name: '', email: '', phone: '' })
  const [addedGuests, setAddedGuests] = useState([])
  const [guestLoading, setGuestLoading] = useState(false)
  const [templates, setTemplates] = useState([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    event_date: '',
    location: '',
    time: '',
    dress_code: '',
    custom_message: '',
  })

  // Load saved templates when reaching step 2
  useEffect(() => {
    if (step === 2) {
      setTemplatesLoading(true)
      getUserTemplates()
        .then(setTemplates)
        .finally(() => setTemplatesLoading(false))
    }
  }, [step])

  // ── Step 1: Create event ─────────────────────
  async function handleCreateEvent() {
    if (!form.title) return
    setLoading(true)
    try {
      const event = await createEvent(form)
      setCreatedEventId(event.id)
      setStep(2)
    } catch (e) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Step 3: Add guests ───────────────────────
  async function handleAddGuest() {
    if (!guestForm.name || !guestForm.email) return
    setGuestLoading(true)
    try {
      const g = await addGuest(createdEventId, guestForm)
      setAddedGuests(prev => [...prev, g])
      setGuestForm({ name: '', email: '', phone: '' })
    } catch (e) {
      alert(e.message)
    } finally {
      setGuestLoading(false)
    }
  }

  async function handleCSVImport(guests) {
    setGuestLoading(true)
    try {
      for (const g of guests) {
        await addGuest(createdEventId, g).catch(() => {})
      }
      setAddedGuests(prev => [...prev, ...guests])
    } finally {
      setGuestLoading(false)
    }
  }

  async function handleGoToStep3() {
    // Save the selected template config to the event before proceeding
    if (selectedTemplate && createdEventId) {
      try {
        await updateEvent(createdEventId, { invitation_template: selectedTemplate.config })
      } catch (e) {
        console.error('Failed to save template:', e)
      }
    }
    setStep(3)
  }

  function handleFinish() {
    router.push(`/dashboard/events/${createdEventId}`)
  }

  const demoEvent = {
    title: form.title || "Nom de l'événement",
    eventDate: form.event_date || new Date().toISOString(),
    location: form.location || 'Lieu',
    time: form.time || '19h00',
    dressCode: form.dress_code || 'Tenue de soirée',
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Créer un événement</h1>
        <p className="text-muted-foreground mt-1">Configurez votre invitation en 3 étapes</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              step === s.id
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                : step > s.id
                ? 'bg-primary/20 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}>
              {step > s.id ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`h-px w-8 transition-colors ${step > s.id ? 'bg-primary' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      {/* ── STEP 1 ─────────────────────────────── */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Informations de l'événement</CardTitle>
            <CardDescription>Décrivez votre événement pour personnaliser les invitations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Titre *</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Mariage de Marie & Jean" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block flex items-center gap-1"><Calendar className="w-4 h-4" /> Date</label>
                <Input type="datetime-local" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block flex items-center gap-1"><Clock className="w-4 h-4" /> Heure (affiché sur l'invitation)</label>
                <Input value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} placeholder="19h00" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block flex items-center gap-1"><MapPin className="w-4 h-4" /> Lieu</label>
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Château de Versailles, France" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block flex items-center gap-1"><Shirt className="w-4 h-4" /> Dress Code</label>
                <Input value={form.dress_code} onChange={e => setForm(f => ({ ...f, dress_code: e.target.value }))} placeholder="Tenue de gala" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Décrivez votre événement..." rows={3} />
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={handleCreateEvent} disabled={!form.title || loading} className="gap-2">
                {loading ? 'Création...' : 'Continuer'} <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── STEP 2: Template selection ────────── */}
      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Choisir un modèle d'invitation</span>
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/templates/new" target="_blank">
                    <Plus className="w-4 h-4 mr-2" /> Créer un modèle
                  </Link>
                </Button>
              </CardTitle>
              <CardDescription>
                Sélectionnez un de vos modèles sauvegardés. Le modèle détermine le design de toutes les invitations envoyées.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-lg">
                  <LayoutTemplate className="w-10 h-10 mx-auto text-muted-foreground opacity-30 mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">Vous n'avez pas encore de modèle sauvegardé.</p>
                  <Button asChild size="sm">
                    <Link href="/dashboard/templates/new" target="_blank">
                      <Plus className="w-4 h-4 mr-2" /> Créer mon premier modèle
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {templates.map(tmpl => (
                    <button
                      key={tmpl.id}
                      onClick={() => setSelectedTemplate(tmpl)}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-[3/4] ${
                        selectedTemplate?.id === tmpl.id
                          ? 'border-primary ring-2 ring-primary scale-[0.98]'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      {/* Mini preview */}
                      <div className="absolute inset-0 scale-[0.55] origin-top pointer-events-none" style={{ width: '182%', height: '182%' }}>
                        <InvitationPreview
                          template={tmpl.config}
                          event={demoEvent}
                          guestName="Marie Dupont"
                        />
                      </div>
                      {selectedTemplate?.id === tmpl.id && (
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
            </CardContent>
          </Card>

          {/* Preview of selected template */}
          {selectedTemplate && (
            <div className="h-64 rounded-xl overflow-hidden border border-border shadow-lg">
              <InvitationPreview
                template={selectedTemplate.config}
                event={demoEvent}
                guestName="Marie Dupont"
              />
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2"><ArrowLeft className="w-4 h-4" /> Retour</Button>
            <Button onClick={handleGoToStep3} className="gap-2">
              {selectedTemplate ? 'Continuer avec ce modèle' : 'Passer cette étape'} <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3 ─────────────────────────────── */}
      {step === 3 && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Ajouter manuellement</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Nom complet *" value={guestForm.name} onChange={e => setGuestForm(g => ({ ...g, name: e.target.value }))} />
                <Input type="email" placeholder="Email *" value={guestForm.email} onChange={e => setGuestForm(g => ({ ...g, email: e.target.value }))} />
                <Input placeholder="Téléphone (optionnel)" value={guestForm.phone} onChange={e => setGuestForm(g => ({ ...g, phone: e.target.value }))} />
                <Button onClick={handleAddGuest} disabled={!guestForm.name || !guestForm.email || guestLoading} className="w-full">
                  {guestLoading ? 'Ajout...' : "Ajouter l'invité"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Import CSV en masse</CardTitle></CardHeader>
              <CardContent>
                <CSVImporter onImport={handleCSVImport} loading={guestLoading} />
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base">Liste des invités</CardTitle>
                <CardDescription>{addedGuests.length} invité(s) ajouté(s)</CardDescription>
              </CardHeader>
              <CardContent>
                {addedGuests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground"><p className="text-sm">Aucun invité pour l'instant</p></div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {addedGuests.map((g, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                          {g.name[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{g.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{g.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(2)} className="gap-2"><ArrowLeft className="w-4 h-4" /> Retour</Button>
            <Button onClick={handleFinish} className="gap-2">
              <Check className="w-4 h-4" /> Terminer et gérer l'événement
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
