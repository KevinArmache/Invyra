'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getEventById, updateEvent } from '@/app/actions/event'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CodeTemplateEditor from '@/components/invitation/CodeTemplateEditor'
import TemplateGallery from '@/components/invitation/TemplateGallery'
import InvitationPreview from '@/components/invitation/InvitationPreview'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save } from 'lucide-react'

export default function TemplateConfigurationPage({ params }) {
  const router = useRouter()
  const { id } = use(params)

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Current working copy of the template
  const [template, setTemplate] = useState(null)
  const [activeTab, setActiveTab] = useState('code')

  useEffect(() => {
    getEventById(id).then(e => {
      setEvent(e)
      setTemplate(e.invitationTemplate || { type: 'code', html: '', css: '' })
      setLoading(false)
    })
  }, [id])

  async function handleSaveEventTemplate() {
    setSaving(true)
    try {
      await updateEvent(id, { invitation_template: template })
      toast.success('Le modèle a été enregistré pour cet événement.')
      router.push(`/dashboard/events/${id}`)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }



  if (loading) return null

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/events/${id}`}><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Configurer l'invitation</h1>
            <p className="text-sm text-muted-foreground">{event?.title}</p>
          </div>
        </div>
        <Button onClick={handleSaveEventTemplate} disabled={saving} className="gap-2 shrink-0">
          <Save className="w-4 h-4" /> {saving ? 'Enregistrement...' : 'Enregistrer et quitter'}
        </Button>
      </div>

      <div className="flex-1 grid lg:grid-cols-[400px_1fr] xl:grid-cols-[450px_1fr] gap-6 min-h-0">
        {/* Controls Sidebar */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="p-3 border-b border-border bg-muted/20">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="code">Code HTML/CSS</TabsTrigger>
                <TabsTrigger value="gallery">Galerie (Thèmes)</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <TabsContent value="code" className="mt-0 h-full">
                <div className="mb-4">
                  <CodeTemplateEditor template={template} onChange={setTemplate} />
                </div>
              </TabsContent>

              <TabsContent value="gallery" className="mt-0 space-y-8">


                {/* Preset Gallery */}
                <TemplateGallery
                  selectedId={null}
                  onSelect={(_, tmpl) => {
                    setTemplate(tmpl)
                    setActiveTab('code')
                  }}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Live Preview Area */}
        <div className="relative rounded-xl border border-border overflow-hidden bg-muted/20 h-full shadow-inner flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-[600px] aspect-[3/4] max-h-full rounded-md overflow-hidden shadow-2xl relative">
            <InvitationPreview
              template={template}
              event={event}
              guestName="Exemple Invité"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
