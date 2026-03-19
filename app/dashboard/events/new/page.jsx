'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { FileText, ArrowRight, ArrowLeft, Sparkles, Check, Plus, LayoutTemplate, Clock, Calendar, MapPin, Shirt } from 'lucide-react'
import { createEvent, updateEvent } from '@/app/actions/event'
import { addGuest } from '@/app/actions/guest'
import { getUserTemplates } from '@/app/actions/template'
import InvitationPreview from '@/components/invitation/InvitationPreview'
import CSVImporter from '@/components/invitation/CSVImporter'
import { useTranslation } from '@/utils/i18n/Context'

export default function NewEventPage() {
  const router = useRouter()
  const { t } = useTranslation()

  const STEPS = [
    { id: 1, label: t('portal.events.new.steps.details'), icon: FileText },
    { id: 2, label: t('portal.events.new.steps.template'), icon: LayoutTemplate },
    { id: 3, label: t('portal.events.new.steps.guests'), icon: Calendar },
  ]

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
      toast.success(t('portal.events.new.success_event'))
      setStep(2)
    } catch (e) {
      toast.error(e.message)
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
      toast.success(t('portal.events.new.success_guest'))
    } catch (e) {
      toast.error(e.message)
    } finally {
      setGuestLoading(false)
    }
  }

  async function handleCSVImport(guests) {
    setGuestLoading(true)
    let addedCount = 0
    try {
      for (const g of guests) {
        await addGuest(createdEventId, g).then(() => addedCount++).catch(() => {})
      }
      setAddedGuests(prev => [...prev, ...guests])
      toast.success(`${addedCount} invités importés avec succès.`)
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
    title: form.title || t('portal.events.new.labels.demo_name'),
    eventDate: form.event_date || new Date().toISOString(),
    location: form.location || t('portal.events.new.labels.demo_location'),
    time: form.time || '19:00',
    dressCode: form.dress_code || t('portal.events.new.labels.demo_dress_code'),
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('portal.events.new.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('portal.events.new.subtitle')}</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${step === s.id
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
            <CardTitle>{t('portal.events.new.details_title')}</CardTitle>
            <CardDescription>{t('portal.events.new.details_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">{t('portal.events.new.labels.title')}</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={t('portal.events.new.placeholders.title')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block flex items-center gap-1"><Calendar className="w-4 h-4" /> {t('portal.events.new.labels.date')}</label>
                <Input type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block flex items-center gap-1"><Clock className="w-4 h-4" /> {t('portal.events.new.labels.time')}</label>
                <Input value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} placeholder={t('portal.events.new.placeholders.time')} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block flex items-center gap-1"><MapPin className="w-4 h-4" /> {t('portal.events.new.labels.location')}</label>
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder={t('portal.events.new.placeholders.location')} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block flex items-center gap-1"><Shirt className="w-4 h-4" /> {t('portal.events.new.labels.dress_code')}</label>
                <Input value={form.dress_code} onChange={e => setForm(f => ({ ...f, dress_code: e.target.value }))} placeholder={t('portal.events.new.placeholders.dress_code')} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('portal.events.new.labels.description')}</label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={t('portal.events.new.placeholders.desc')} rows={3} />
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={handleCreateEvent} disabled={!form.title || loading} className="gap-2">
                {loading ? t('portal.events.new.buttons.creating') : t('portal.events.new.buttons.continue')} <ArrowRight className="w-4 h-4" />
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
                <span>{t('portal.events.new.template_title')}</span>
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/templates/new" target="_blank">
                    <Plus className="w-4 h-4 mr-2" /> {t('portal.events.new.buttons.create_template')}
                  </Link>
                </Button>
              </CardTitle>
              <CardDescription>
                {t('portal.events.new.template_desc')}
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
                  <p className="text-sm text-muted-foreground mb-4">{t('portal.events.new.no_templates')}</p>
                  <Button asChild size="sm">
                    <Link href="/dashboard/templates/new" target="_blank">
                      <Plus className="w-4 h-4 mr-2" /> {t('portal.events.new.buttons.first_template')}
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {templates.map(tmpl => (
                    <button
                      key={tmpl.id}
                      onClick={() => setSelectedTemplate(tmpl)}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-[3/4] ${selectedTemplate?.id === tmpl.id
                          ? 'border-primary ring-2 ring-primary scale-[0.98]'
                          : 'border-border hover:border-primary/40'
                        }`}
                    >
                      {/* Mini preview */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div style={{ width: '182%', height: '182%', transform: 'scale(0.55)', transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
                          <InvitationPreview
                            template={tmpl.config}
                            event={demoEvent}
                            guestName="Marie Dupont"
                          />
                        </div>
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
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2"><ArrowLeft className="w-4 h-4" /> {t('portal.events.new.buttons.back')}</Button>
            <Button onClick={handleGoToStep3} className="gap-2">
              {selectedTemplate ? t('portal.events.new.buttons.continue_with_template') : t('portal.events.new.buttons.skip')} <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3 ─────────────────────────────── */}
      {step === 3 && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">{t('portal.events.new.add_guest')}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder={t('portal.events.new.labels.name')} value={guestForm.name} onChange={e => setGuestForm(g => ({ ...g, name: e.target.value }))} />
                <Input type="email" placeholder={t('portal.events.new.labels.email')} value={guestForm.email} onChange={e => setGuestForm(g => ({ ...g, email: e.target.value }))} />
                <Input placeholder={t('portal.events.new.labels.phone')} value={guestForm.phone} onChange={e => setGuestForm(g => ({ ...g, phone: e.target.value }))} />
                <Button onClick={handleAddGuest} disabled={!guestForm.name || !guestForm.email || guestLoading} className="w-full">
                  {guestLoading ? t('portal.events.new.buttons.adding') : t('portal.events.new.buttons.add')}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">{t('portal.events.new.import_csv')}</CardTitle></CardHeader>
              <CardContent>
                <CSVImporter onImport={handleCSVImport} loading={guestLoading} />
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base">{t('portal.events.new.guest_list')}</CardTitle>
                <CardDescription>{addedGuests.length} {t('portal.events.new.guests_added')}</CardDescription>
              </CardHeader>
              <CardContent>
                {addedGuests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground"><p className="text-sm">{t('portal.events.new.no_guests_yet')}</p></div>
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
            <Button variant="outline" onClick={() => setStep(2)} className="gap-2"><ArrowLeft className="w-4 h-4" /> {t('portal.events.new.buttons.back')}</Button>
            <Button onClick={handleFinish} className="gap-2">
              <Check className="w-4 h-4" /> {t('portal.events.new.buttons.finish')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
