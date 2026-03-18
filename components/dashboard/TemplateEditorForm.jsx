'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Save } from 'lucide-react'
import CodeTemplateEditor from '@/components/invitation/CodeTemplateEditor'
import InvitationPreview from '@/components/invitation/InvitationPreview'
import { toast } from 'sonner'

const DEMO_EVENT = {
  title: 'Gala de Bienfaisance 2025',
  eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  location: 'Château de Fontainebleau, Seine-et-Marne',
  time: '19h30',
  dressCode: 'Tenue de gala',
}

/**
 * Composant partagé entre la création et l'édition d'un modèle personnalisé.
 * @param {{ initialName: string, initialConfig: object, onSave: (name: string, config: object) => Promise<void>, isEditing: boolean }} props
 */
export default function TemplateEditorForm({ initialName = '', initialConfig, isEditing = false, onSave }) {
  const router = useRouter()
  const [saveName, setSaveName] = useState(initialName)
  const [saving, setSaving] = useState(false)
  const [activeMode, setActiveMode] = useState('edit')
  const [templateConfig, setTemplateConfig] = useState(initialConfig ?? { type: 'code', html: '', css: '', js: '' })

  async function handleSave() {
    if (!saveName.trim()) {
      toast.warning('Veuillez donner un nom à votre modèle.')
      return
    }
    setSaving(true)
    try {
      await onSave(saveName.trim(), templateConfig)
      router.push('/dashboard/templates')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/templates"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditing ? `Éditer le modèle` : 'Créer un nouveau modèle'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isEditing ? `Modification de : ${initialName}` : 'Concevez votre design en HTML, CSS et JS'}
            </p>
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
            <Save className="w-4 h-4" /> {saving ? (isEditing ? 'Enregistrement...' : 'Sauvegarde...') : (isEditing ? 'Mettre à jour' : 'Enregistrer')}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Mobile Mode Toggle */}
        <div className="lg:hidden mb-4">
          <Tabs value={activeMode} onValueChange={setActiveMode}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit">Mode Édition</TabsTrigger>
              <TabsTrigger value="preview">Mode Aperçu</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 grid lg:grid-cols-[440px_1fr] gap-5 min-h-0">
          {/* Code Editor */}
          <div className={`overflow-hidden flex flex-col h-full bg-card rounded-xl border border-border shadow-sm ${activeMode === 'edit' ? 'flex' : 'hidden lg:flex'}`}>
            <CodeTemplateEditor template={templateConfig} onChange={setTemplateConfig} />
          </div>

          {/* Live Preview */}
          <div className={`relative rounded-xl border border-border overflow-hidden bg-muted/20 h-full shadow-inner flex items-center justify-center p-0 ${activeMode === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
            <div className="w-full h-full overflow-auto">
              <InvitationPreview template={templateConfig} event={DEMO_EVENT} guestName="Marie Dupont" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
