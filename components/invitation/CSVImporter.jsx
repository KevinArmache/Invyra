'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Upload, Users, CheckCircle, AlertTriangle } from 'lucide-react'

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(Boolean)
  const guests = []
  const errors = []

  lines.forEach((line, idx) => {
    // Support comma or semicolon delimiters
    const parts = line.split(/[,;]/).map(p => p.trim().replace(/^"|"$/g, ''))
    const [name, email, phone] = parts
    if (!name || !email) {
      errors.push(`Ligne ${idx + 1}: nom ou email manquant`)
    } else if (!email.includes('@')) {
      errors.push(`Ligne ${idx + 1}: email invalide (${email})`)
    } else {
      guests.push({ name, email, phone: phone || null })
    }
  })

  return { guests, errors }
}

export default function CSVImporter({ onImport, loading = false }) {
  const [csvText, setCsvText] = useState('')
  const [preview, setPreview] = useState(null)

  function handlePreview() {
    const result = parseCSV(csvText)
    setPreview(result)
  }

  function handleImport() {
    if (!preview?.guests?.length) return
    onImport(preview.guests)
  }

  const EXAMPLE = `Marie Dupont,marie@email.com,+33600000001
Jean Martin,jean@email.com
Sophie Bernard,sophie@email.com,+33600000003`

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground block mb-1">
          Coller le contenu CSV
        </label>
        <p className="text-xs text-muted-foreground mb-2">
          Format: <code className="bg-muted px-1 rounded">Nom,Email,Téléphone</code> (une ligne par invité, téléphone optionnel)
        </p>
        <Textarea
          placeholder={EXAMPLE}
          value={csvText}
          onChange={e => { setCsvText(e.target.value); setPreview(null) }}
          rows={6}
          className="font-mono text-xs"
        />
      </div>

      <Button variant="outline" size="sm" onClick={handlePreview} disabled={!csvText.trim()}>
        <Users className="w-4 h-4 mr-2" />
        Vérifier ({csvText.trim() ? csvText.trim().split('\n').filter(Boolean).length : 0} lignes)
      </Button>

      {preview && (
        <div className="rounded-lg border border-border overflow-hidden">
          {preview.errors.length > 0 && (
            <div className="bg-destructive/10 border-b border-destructive/20 p-3 space-y-1">
              {preview.errors.map((e, i) => (
                <p key={i} className="text-destructive text-xs flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" /> {e}
                </p>
              ))}
            </div>
          )}
          {preview.guests.length > 0 && (
            <div className="p-3 space-y-1 max-h-40 overflow-y-auto">
              {preview.guests.map((g, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <CheckCircle className="w-3 h-3 text-green-400 shrink-0" />
                  <span className="text-foreground font-medium">{g.name}</span>
                  <span className="text-muted-foreground">{g.email}</span>
                  {g.phone && <span className="text-muted-foreground">{g.phone}</span>}
                </div>
              ))}
            </div>
          )}
          <div className="border-t border-border/50 bg-muted/30 px-3 py-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              <span className="text-green-400 font-medium">{preview.guests.length}</span> valides,&nbsp;
              <span className="text-destructive font-medium">{preview.errors.length}</span> erreurs
            </p>
            <Button size="sm" onClick={handleImport} disabled={!preview.guests.length || loading}>
              <Upload className="w-3 h-3 mr-1" />
              {loading ? 'Import...' : `Importer ${preview.guests.length} invités`}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
