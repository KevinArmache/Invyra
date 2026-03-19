'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Save, Check, X, LayoutTemplate } from 'lucide-react'
import { getEventById, updateEvent } from '@/app/actions/event'
import { getUserTemplates } from '@/app/actions/template'
import InvitationPreview from '@/components/invitation/InvitationPreview'
import { toast } from 'sonner'

export default function EditEventPage({ params }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [event, setEvent] = useState(null)
  const [eventLoading, setEventLoading] = useState(true)
  const [activeMode, setActiveMode] = useState('edit')

  // Template picker
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [savedTemplates, setSavedTemplates] = useState([])
  const [selectedForSwap, setSelectedForSwap] = useState(null)
  const [swapping, setSwapping] = useState(false)

  useEffect(() => {
    getEventById(id).then(data => { setEvent(data); setEventLoading(false) }).catch(() => setEventLoading(false))
  }, [id])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    location: '',
    time: '',
    dress_code: '',
    custom_message: '',
    status: 'draft'
  })

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        event_date: event.eventDate ? new Date(event.eventDate).toISOString().slice(0, 16) : '',
        location: event.location || '',
        time: event.time || '',
        dress_code: event.dressCode || event.dress_code || '',
        custom_message: event.customMessage || '',
        status: event.status || 'draft'
      })
    }
  }, [event])

  function handleChange(e) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

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
      toast.success("Modèle appliqué avec succès à l'événement.")
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSwapping(false)
    }
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault()
    setLoading(true)

    try {
      await updateEvent(id, formData)
      toast.success('Modifications enregistrées')
      router.push(`/dashboard/events/${id}`)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (eventLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-foreground mb-4">Événement introuvable</h2>
        <Button asChild>
          <Link href="/dashboard/events">Retour aux événements</Link>
        </Button>
      </div>
    )
  }

  // Derive template config (will update when event.invitationTemplate changes)
  const activeTemplate = event.invitationTemplate || { type: 'code', html: '', css: '' }

  // Derive dummy event for preview
  const previewEvent = {
    title: formData.title || 'Mon Événement',
    description: formData.description,
    eventDate: formData.event_date || new Date().toISOString(),
    location: formData.location || 'Lieu',
    time: formData.time || '19h00',
    dressCode: formData.dress_code || 'Tenue correcte exigée',
    customMessage: formData.custom_message,
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/events/${id}`}>
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Éditer l'événement</h1>
            <p className="text-xs text-muted-foreground mt-1">Modification de : {formData.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleSubmit} disabled={loading} className="gap-2">
            <Save className="w-4 h-4" /> {loading ? 'Enregistrement...' : 'Sauvegarder et quitter'}
          </Button>
        </div>
      </div>




      <div className="flex-1 flex flex-col min-h-0">
        {/* Toggle Mode on Mobile */}
        <div className="lg:hidden mb-4">
          <Tabs value={activeMode} onValueChange={setActiveMode}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit">Paramètres</TabsTrigger>
              <TabsTrigger value="preview">Aperçu en direct</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex-1 grid lg:grid-cols-[1fr_450px] xl:grid-cols-[1fr_500px] gap-6 min-h-0">
          {/* Left: Form */}
          <div className={`overflow-y-auto space-y-6 pb-20 custom-scrollbar ${activeMode === 'edit' ? 'block' : 'hidden lg:block'}`}>
            <Card>
              <CardHeader>
                <CardTitle>Informations principales</CardTitle>
                <CardDescription>Les détails qui apparaîtront sur l'invitation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium text-foreground">Titre de l'événement *</label>
                  <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium text-foreground">Description</label>
                  <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="event_date" className="text-sm font-medium text-foreground">Date de l'événement</label>
                    <Input id="event_date" name="event_date" type="datetime-local" value={formData.event_date} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="time" className="text-sm font-medium text-foreground">Heure (affichée)</label>
                    <Input id="time" name="time" placeholder="19h00" value={formData.time} onChange={handleChange} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="location" className="text-sm font-medium text-foreground">Lieu</label>
                    <Input id="location" name="location" value={formData.location} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="dress_code" className="text-sm font-medium text-foreground">Dress Code</label>
                    <Input id="dress_code" name="dress_code" value={formData.dress_code} onChange={handleChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="status" className="text-sm font-medium text-foreground">Statut</label>
                  <select id="status" name="status" value={formData.status} onChange={handleChange} className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground">
                    <option value="draft">Brouillon</option>
                    <option value="active">Actif</option>
                    <option value="completed">Terminé</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Message personnalisé</CardTitle>
                <CardDescription>Un message chaleureux pour accompagner l'invitation (Optionnel)</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea name="custom_message" value={formData.custom_message} onChange={handleChange} rows={4} />
              </CardContent>
            </Card>

            {/* Template Picker Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Modèle d'invitation</span>
                  <button
                    type="button"
                    onClick={openTemplatePicker}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    {event.invitationTemplate ? 'Changer le modèle' : 'Choisir un modèle'}
                  </button>
                </CardTitle>
                <CardDescription>Le modèle utilisé pour l'affichage de l'invitation</CardDescription>
              </CardHeader>
              <CardContent>
                {event.invitationTemplate ? (
                  <div className="flex items-center gap-2 text-xs text-green-500 font-medium bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20">
                    <Check className="w-4 h-4" /> Modèle actif — visible dans l'aperçu à droite
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun modèle sélectionné. Un modèle par défaut est utilisé.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Live Preview */}
          <div className={`relative rounded-xl border border-border overflow-hidden bg-muted/20 h-full shadow-inner flex items-center justify-center p-0 lg:p-4 ${activeMode === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
            <div className="w-full h-full max-w-[450px] shadow-2xl rounded-lg overflow-hidden border border-border/50">
              <InvitationPreview
                template={activeTemplate}
                event={previewEvent}
                guestName="Exemple Invité"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Template Picker Modal */}
      {showTemplatePicker && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowTemplatePicker(false) }}
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Choisir un modèle</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Sélectionnez un modèle pour l'appliquer à cet événement</p>
              </div>
              <button type="button" onClick={() => setShowTemplatePicker(false)} className="p-2 rounded-md hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {savedTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <LayoutTemplate className="w-10 h-10 mx-auto text-muted-foreground opacity-30 mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">Aucun modèle sauvegardé</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {savedTemplates.map(tmpl => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setSelectedForSwap(tmpl)}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all aspect-[3/4] bg-muted/20 ${
                        selectedForSwap?.id === tmpl.id ? 'border-primary ring-2 ring-primary' : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="absolute inset-0 pointer-events-none" style={{ transform: 'scale(0.55)', transformOrigin: 'top left', width: '182%', height: '182%' }}>
                        <InvitationPreview template={tmpl.config} event={previewEvent} guestName="Marie Dupont" readOnly />
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
                <button type="button" onClick={() => setShowTemplatePicker(false)} className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted">Annuler</button>
                <button type="button" onClick={handleApplyTemplate} disabled={!selectedForSwap || swapping} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50">
                  {swapping ? 'Application...' : 'Appliquer ce modèle'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
