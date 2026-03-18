'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { saveUserTemplate } from '@/app/actions/template'
import { ArrowLeft, Save, Code, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CodeTemplateEditor from '@/components/invitation/CodeTemplateEditor'
import JsxTemplateEditor from '@/components/invitation/JsxTemplateEditor'
import InvitationPreview from '@/components/invitation/InvitationPreview'
import { TEMPLATE_PRESETS } from '@/lib/template-presets'

// Variables info display
const VARIABLE_TAGS = [
  { tag: '{{EVENT_NAME}}', desc: "Nom de l'événement" },
  { tag: '{{LOCATION}}', desc: "Lieu de l'événement" },
  { tag: '{{TIME}}', desc: "Heure de l'événement" },
  { tag: '{{DRESS_CODE}}', desc: 'Code vestimentaire' },
  { tag: '{{GUEST_NAME}}', desc: "Prénom & nom de l'invité" },
]

export default function NewTemplatePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('html')
  const [saveName, setSaveName] = useState('')
  const [saving, setSaving] = useState(false)

  // HTML/CSS editor state
  const [template, setTemplate] = useState({
    type: 'code',
    html: DEFAULT_HTML,
    css: DEFAULT_CSS,
    primaryColor: '#d4af37',
    bgColor: '#111111',
  })

  async function handleSave() {
    if (!saveName.trim()) {
      alert('Veuillez donner un nom à votre modèle.')
      return
    }
    setSaving(true)
    try {
      await saveUserTemplate(saveName.trim(), template)
      router.push('/dashboard/templates')
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const demoEvent = {
    title: 'Nom de votre événement',
    eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Château de Versailles, France',
    time: '19h00',
    dressCode: 'Tenue de gala',
    customMessage: "Votre présence nous comblerait de joie."
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
            <h1 className="text-2xl font-bold tracking-tight">Créer un nouveau modèle</h1>
            <p className="text-xs text-muted-foreground">Écrivez votre design en HTML/CSS ou JSX/Tailwind</p>
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
            <Save className="w-4 h-4" /> {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </Button>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-[440px_1fr] gap-5 min-h-0">
        {/* Left: Code Editor */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="px-3 pt-3 border-b border-border bg-muted/20 pb-3">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="html" className="gap-2">
                  <Code className="w-3.5 h-3.5" /> HTML / CSS
                </TabsTrigger>
                <TabsTrigger value="jsx" className="gap-2">
                  <Hash className="w-3.5 h-3.5" /> JSX / Tailwind
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Variables reference */}
            <div className="px-4 py-2 border-b border-border bg-muted/10 flex flex-wrap gap-1.5">
              {VARIABLE_TAGS.map(v => (
                <span key={v.tag} title={v.desc} className="bg-primary/10 text-primary text-[10px] font-mono px-1.5 py-0.5 rounded cursor-help border border-primary/20">
                  {v.tag}
                </span>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <TabsContent value="html" className="mt-0 h-full">
                <CodeTemplateEditor template={template} onChange={setTemplate} />
              </TabsContent>

              <TabsContent value="jsx" className="mt-0 h-full">
                <JsxTemplateEditor template={template} onChange={setTemplate} />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Right: Live Preview */}
        <div className="relative rounded-xl border border-border overflow-hidden bg-muted/20 h-full shadow-inner flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-[520px] aspect-[3/4] max-h-full rounded-md overflow-hidden shadow-2xl relative">
            <InvitationPreview
              template={template}
              event={demoEvent}
              guestName="Marie Dupont"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Default HTML Template ──────────────────────────────────────────
const DEFAULT_HTML = `<div class="invitation-wrapper">
  <div class="invite-card">
    <div class="corner top-left"></div>
    <div class="corner top-right"></div>
    <div class="corner bottom-left"></div>
    <div class="corner bottom-right"></div>

    <p class="label">Vous êtes invité(e) à</p>
    <h1 class="event-name">{{EVENT_NAME}}</h1>
    <div class="divider"></div>

    <p class="guest-greeting">Cher(e) <strong>{{GUEST_NAME}}</strong>,</p>
    <p class="msg">Votre présence nous ferait le plus grand honneur.</p>

    <div class="details">
      <div class="detail-row">
        <span class="icon">📍</span>
        <span>{{LOCATION}}</span>
      </div>
      <div class="detail-row">
        <span class="icon">⏰</span>
        <span>{{TIME}}</span>
      </div>
      <div class="detail-row">
        <span class="icon">👔</span>
        <span>{{DRESS_CODE}}</span>
      </div>
    </div>

    <div class="divider short"></div>

    <div class="rsvp-section">
      <p class="rsvp-label">Confirmer votre présence</p>
      <div class="rsvp-buttons">
        <button class="rsvp-yes">✓ Je serai présent(e)</button>
        <button class="rsvp-no">✗ Je ne pourrai pas venir</button>
      </div>
    </div>
  </div>
</div>`

const DEFAULT_CSS = `.invitation-wrapper {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #111111, #1c1c1c);
  font-family: 'Cormorant Garamond', Georgia, serif;
  padding: 20px;
  box-sizing: border-box;
}
.invite-card {
  position: relative;
  background: transparent;
  border: 1px solid rgba(212, 175, 55, 0.5);
  padding: 50px 40px;
  max-width: 480px;
  width: 100%;
  text-align: center;
  color: #f5f0e8;
}
.corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border-color: #d4af37;
  border-style: solid;
  border-width: 0;
}
.top-left    { top: 8px; left: 8px;  border-top-width:1.5px; border-left-width:1.5px; }
.top-right   { top: 8px; right: 8px; border-top-width:1.5px; border-right-width:1.5px; }
.bottom-left { bottom: 8px; left: 8px;  border-bottom-width:1.5px; border-left-width:1.5px; }
.bottom-right{ bottom: 8px; right: 8px; border-bottom-width:1.5px; border-right-width:1.5px; }
.label {
  font-size: 0.75rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(245, 240, 232, 0.6);
  margin-bottom: 10px;
}
.event-name {
  font-size: 2.2em;
  color: #d4af37;
  margin: 0 0 16px;
  line-height: 1.2;
  text-shadow: 0 2px 20px rgba(0,0,0,0.4);
}
.divider {
  width: 80px;
  height: 1px;
  background: rgba(212, 175, 55, 0.5);
  margin: 0 auto 20px;
}
.divider.short { width: 40px; margin: 16px auto; }
.guest-greeting { color: rgba(245,240,232,0.85); margin-bottom: 6px; font-size: 1.05em; }
.msg { color: rgba(245,240,232,0.65); font-style: italic; font-size: 0.95em; margin-bottom: 20px; }
.details { display: flex; flex-direction: column; gap: 8px; margin-bottom: 4px; }
.detail-row { display: flex; align-items: center; gap: 10px; justify-content: center; font-size: 0.9em; color: rgba(245,240,232,0.8); }
.icon { font-size: 1em; }
.rsvp-section { background: rgba(212,175,55,0.06); border: 1px solid rgba(212,175,55,0.2); border-radius: 4px; padding: 16px; }
.rsvp-label { font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(245,240,232,0.5); margin-bottom: 12px; }
.rsvp-buttons { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
.rsvp-yes, .rsvp-no {
  padding: 8px 18px;
  border: none;
  border-radius: 2px;
  font-size: 0.8em;
  letter-spacing: 0.1em;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s;
}
.rsvp-yes:hover, .rsvp-no:hover { transform: scale(1.03); }
.rsvp-yes { background: #d4af37; color: #111; }
.rsvp-no  { background: transparent; color: rgba(245,240,232,0.5); border: 1px solid rgba(245,240,232,0.2); }`
