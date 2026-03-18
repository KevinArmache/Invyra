'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUserTemplateById, updateUserTemplate } from '@/app/actions/template'
import { ArrowLeft, Save, Code } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import InvitationPreview from '@/components/invitation/InvitationPreview'

const VARIABLE_TAGS = [
  { tag: '{{EVENT_NAME}}', desc: "Nom de l'événement" },
  { tag: '{{LOCATION}}', desc: "Lieu de l'événement" },
  { tag: '{{TIME}}', desc: "Heure de l'événement" },
  { tag: '{{DRESS_CODE}}', desc: 'Code vestimentaire' },
  { tag: '{{GUEST_NAME}}', desc: "Prénom & nom de l'invité" },
]

export default function EditTemplatePage({ params }) {
  const router = useRouter()
  const { id } = use(params)
  
  const [saveName, setSaveName] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [html, setHtml] = useState('')
  const [css, setCss] = useState('')
  const [activeMode, setActiveMode] = useState('edit')

  useEffect(() => {
    getUserTemplateById(id).then(tmpl => {
      setSaveName(tmpl.name)
      setHtml(tmpl.config?.html || '')
      setCss(tmpl.config?.css || '')
      setLoading(false)
    }).catch(e => {
      alert(e.message)
      router.push('/dashboard/templates')
    })
  }, [id, router])

  // Build the template config object from current HTML/CSS
  const templateConfig = {
    type: 'code',
    html,
    css,
    primaryColor: '#d4af37',
    bgColor: '#111111',
  }

  async function handleSave() {
    if (!saveName.trim()) {
      alert('Veuillez donner un nom à votre modèle.')
      return
    }
    setSaving(true)
    try {
      await updateUserTemplate(id, saveName.trim(), templateConfig)
      router.push('/dashboard/templates')
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  function handleApplyPreview() {
    setHtml(h => h + ' ')
    setTimeout(() => setHtml(h => h.trimEnd()), 10)
  }

  const demoEvent = {
    title: 'Gala de Bienfaisance 2025',
    eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Château de Fontainebleau, Seine-et-Marne',
    time: '19h30',
    dressCode: 'Tenue de gala',
  }

  if (loading) return null

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/templates"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Éditer le modèle</h1>
            <p className="text-xs text-muted-foreground">Modification de: {saveName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Input
            placeholder="Nom du modèle..."
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            className="w-full sm:w-52 bg-background"
          />
          <Button onClick={handleSave} disabled={saving || !saveName.trim()} className="gap-2 shrink-0">
            <Save className="w-4 h-4" /> {saving ? 'Enregistrement...' : 'Mettre à jour'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Toggle Mode on Mobile */}
        <div className="lg:hidden mb-4">
          <Tabs value={activeMode} onValueChange={setActiveMode}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit">Mode Édition</TabsTrigger>
              <TabsTrigger value="preview">Mode Aperçu</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex-1 grid lg:grid-cols-[440px_1fr] gap-5 min-h-0">
          {/* Left: HTML/CSS Editor */}
          <div className={`border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-full bg-card ${activeMode === 'edit' ? 'flex' : 'hidden lg:flex'}`}>
            <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center gap-2">
              <Code className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Éditeur HTML / CSS</span>
            </div>

            <div className="px-4 py-2 border-b border-border bg-muted/10 flex flex-wrap gap-1.5">
              {VARIABLE_TAGS.map(v => (
                <span key={v.tag} title={v.desc} className="bg-primary/10 text-primary text-[10px] font-mono px-1.5 py-0.5 rounded cursor-help border border-primary/20">
                  {v.tag}
                </span>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Structure HTML</Label>
                <Textarea
                  value={html}
                  onChange={e => setHtml(e.target.value)}
                  className="font-mono text-xs bg-background leading-relaxed resize-none"
                  style={{ minHeight: '280px' }}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Styles CSS</Label>
                <Textarea
                  value={css}
                  onChange={e => setCss(e.target.value)}
                  className="font-mono text-xs bg-background leading-relaxed resize-none"
                  style={{ minHeight: '280px' }}
                />
              </div>

              <Button onClick={handleApplyPreview} variant="secondary" className="w-full">
                Actualiser l'aperçu
              </Button>
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className={`relative rounded-xl border border-border overflow-hidden bg-muted/20 h-full shadow-inner flex items-center justify-center p-0 ${activeMode === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
            <div className="w-full h-full overflow-auto">
              <InvitationPreview
                template={templateConfig}
                event={demoEvent}
                guestName="Marie Dupont"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
