'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Eye, Info } from 'lucide-react'

const DEFAULT_JSX = `// Exemple de composant JSX/Tailwind
// Les variables {{EVENT_NAME}}, {{LOCATION}}, etc. sont remplacées automatiquement

export default function Invitation({ event, guestName, onRSVP }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 font-serif">
      <div className="relative max-w-lg w-full border border-yellow-600/50 p-12 text-center text-amber-50">
        {/* Coins décoratifs */}
        <div className="absolute top-2 left-2 w-5 h-5 border-t border-l border-yellow-500" />
        <div className="absolute top-2 right-2 w-5 h-5 border-t border-r border-yellow-500" />
        <div className="absolute bottom-2 left-2 w-5 h-5 border-b border-l border-yellow-500" />
        <div className="absolute bottom-2 right-2 w-5 h-5 border-b border-r border-yellow-500" />

        <p className="text-xs tracking-[0.3em] uppercase text-amber-200/60 mb-4">
          Vous êtes invité(e) à
        </p>

        <h1 className="text-4xl text-yellow-500 mb-4 leading-tight">
          {{EVENT_NAME}}
        </h1>

        <div className="w-16 h-px bg-yellow-600/50 mx-auto mb-6" />

        <p className="text-amber-100/80 mb-6">
          Cher(e) <strong className="text-amber-100">{{GUEST_NAME}}</strong>,
          <br />votre présence nous serait précieuse.
        </p>

        <div className="flex flex-col gap-2 text-sm text-amber-100/70 mb-6">
          <p>📍 {{LOCATION}}</p>
          <p>⏰ {{TIME}}</p>
          <p>👔 {{DRESS_CODE}}</p>
        </div>

        <div className="border border-yellow-600/20 bg-yellow-900/10 rounded p-4">
          <p className="text-xs tracking-widest uppercase text-amber-200/50 mb-3">
            Confirmer votre présence
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => onRSVP?.('yes')}
              className="bg-yellow-600 text-black px-5 py-2 text-xs font-bold tracking-widest uppercase hover:bg-yellow-500 transition"
            >
              ✓ Je serai là
            </button>
            <button
              onClick={() => onRSVP?.('no')}
              className="border border-amber-200/20 text-amber-200/50 px-5 py-2 text-xs tracking-widest uppercase hover:border-amber-200/40 transition"
            >
              ✗ Excusez-moi
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}`

export default function JsxTemplateEditor({ template, onChange }) {
  const [jsxCode, setJsxCode] = useState(template.jsxCode || DEFAULT_JSX)

  function applyChanges() {
    onChange({
      ...template,
      type: 'jsx',
      jsxCode,
    })
  }

  return (
    <div className="space-y-4 flex flex-col h-full">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
        <div className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
          <span>
            Écrivez votre composant React/JSX avec les classes Tailwind. Les variables entre  <code className="text-blue-300">{"{{DOUBLE_ACCOLADES}}"}</code> seront remplacées automatiquement à l'envoi. Le composant doit être un <code className="text-blue-300">export default</code> qui accepte <code className="text-blue-300">{"{ event, guestName, onRSVP }"}</code>.
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-1">
        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Code JSX / Tailwind</Label>
        <Textarea
          value={jsxCode}
          onChange={e => setJsxCode(e.target.value)}
          className="font-mono text-xs h-[400px] custom-scrollbar bg-background leading-relaxed"
          placeholder="export default function Invitation({ event, guestName, onRSVP }) { ... }"
        />
      </div>

      <Button onClick={applyChanges} className="w-full shrink-0">
        <Eye className="w-4 h-4 mr-2" /> Mettre à jour l'aperçu
      </Button>
    </div>
  )
}
