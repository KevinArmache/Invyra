'use client'

import { useState, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Code, Eye } from 'lucide-react'

export default function CodeTemplateEditor({ template, onChange }) {
  const [html, setHtml] = useState(template.html || '<div class="my-invitation">\n  <h1>{{EVENT_TITLE}}</h1>\n  <p>Cher(e) {{GUEST_NAME}},</p>\n  <p>Vous êtes invité !</p>\n</div>')
  const [css, setCss] = useState(template.css || '.my-invitation {\n  text-align: center;\n  padding: 40px;\n  background: #111;\n  color: #fff;\n  border: 2px solid #d4af37;\n  border-radius: 8px;\n  font-family: Georgia, serif;\n}\n.my-invitation h1 {\n  color: #d4af37;\n  margin-bottom: 20px;\n}')

  // Effectue la mise à jour vers le template parent avec type='code'
  function applyChanges() {
    onChange({
      type: 'code',
      html,
      css,
      // Fallback values so other editors don't crash
      style: 'elegant',
      primaryColor: '#ffffff',
      bgColor: '#000000'
    })
  }

  // Force apply if switching from a visual template to code template
  useEffect(() => {
    if (template.type !== 'code') {
      applyChanges()
    }
  }, [])

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="bg-muted/30 p-4 rounded-lg border border-border">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
          <Code className="w-4 h-4 text-primary" /> Éditeur de Code Personnalisé
        </h3>
        <p className="text-xs text-muted-foreground">
          Créez votre design complet en HTML et CSS. Vous pouvez utiliser les variables suivantes qui seront remplacées dynamiquement :
          <br/><code className="text-primary">{"{{EVENT_TITLE}}"}</code>, <code className="text-primary">{"{{GUEST_NAME}}"}</code>, <code className="text-primary">{"{{EVENT_LOCATION}}"}</code>, <code className="text-primary">{"{{EVENT_DATE}}"}</code>
        </p>
      </div>

      <div className="space-y-3 flex-1">
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Structure (HTML)</Label>
          <Textarea 
            value={html}
            onChange={e => setHtml(e.target.value)}
            className="font-mono text-sm h-[200px] custom-scrollbar bg-background"
            placeholder="<div class='container'>...</div>"
          />
        </div>
        
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Styles (CSS)</Label>
          <Textarea 
            value={css}
            onChange={e => setCss(e.target.value)}
            className="font-mono text-sm h-[200px] custom-scrollbar bg-background"
            placeholder=".container { color: red; }"
          />
        </div>
      </div>

      <Button onClick={applyChanges} className="w-full shrink-0">
        <Eye className="w-4 h-4 mr-2" /> Mettre à jour l'aperçu
      </Button>
    </div>
  )
}
