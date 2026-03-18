'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUserTemplateById, updateUserTemplate } from '@/app/actions/template'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import InvitationPreview from '@/components/invitation/InvitationPreview'
import CodeTemplateEditor from '@/components/invitation/CodeTemplateEditor'

export default function EditTemplatePage({ params }) {
  const router = useRouter()
  const { id } = use(params)
  
  const [saveName, setSaveName] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeMode, setActiveMode] = useState('edit')
  
  const [templateConfig, setTemplateConfig] = useState({
    type: 'code',
    html: '',
    css: '',
    js: ''
  })

  useEffect(() => {
    getUserTemplateById(id).then(tmpl => {
      setSaveName(tmpl.name)
      if (tmpl.config) {
        setTemplateConfig({
          type: 'code',
          html: tmpl.config.html || '',
          css: tmpl.config.css || '',
          js: tmpl.config.js || '',
          primaryColor: tmpl.config.primaryColor || '#d4af37',
          bgColor: tmpl.config.bgColor || '#111111'
        })
      }
      setLoading(false)
    }).catch(e => {
      alert(e.message)
      router.push('/dashboard/templates')
    })
  }, [id, router])

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
          {/* Left: HTML/CSS/JS Editor */}
          <div className={`overflow-hidden flex flex-col h-full bg-card rounded-xl border border-border shadow-sm ${activeMode === 'edit' ? 'flex' : 'hidden lg:flex'}`}>
            <CodeTemplateEditor 
              template={templateConfig} 
              onChange={setTemplateConfig} 
            />
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
