import { useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { saveUserTemplate } from '@/app/actions/template'
import { Save } from 'lucide-react'

const FONT_OPTIONS = [
  { label: 'Serif Classique (Georgia)', value: 'Georgia, serif' },
  { label: 'Cormorant (Élégant)', value: 'Cormorant Garamond, Georgia, serif' },
  { label: 'Playfair (Romantique)', value: 'Playfair Display, Georgia, serif' },
  { label: 'Lora (Nature)', value: 'Lora, Georgia, serif' },
  { label: 'Cinzel (Luxueux)', value: 'Cinzel, Georgia, serif' },
  { label: 'Inter (Moderne)', value: 'Inter, system-ui, sans-serif' },
  { label: 'Poppins (Fun)', value: 'Poppins, system-ui, sans-serif' },
]

const BORDER_STYLES = ['none', 'solid', 'double', 'dashed']

export default function TemplateEditor({ template, onChange }) {
  const [activeSection, setActiveSection] = useState('colors')
  const [saveName, setSaveName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function update(key, value) {
    onChange({ ...template, [key]: value })
  }

  async function handleSavePreset() {
    if (!saveName.trim()) return
    setIsSaving(true)
    try {
      await saveUserTemplate(saveName.trim(), template)
      alert('Modèle sauvegardé avec succès dans votre galerie !')
      setSaveName('')
    } catch (e) {
      alert('Erreur: ' + e.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (!template) return null

  return (
    <div className="space-y-6">
      {/* Section navigation pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'colors', label: '🎨 Couleurs' },
          { id: 'typography', label: '🔤 Police' },
          { id: 'border', label: '🖼️ Bordure' },
          { id: 'content', label: '📝 Textes' },
          { id: 'background', label: '🌌 Fond' },
        ].map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeSection === s.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Colors */}
      {activeSection === 'colors' && (
        <div className="space-y-4">
          <ColorRow label="Couleur primaire" value={template.primaryColor} onChange={v => update('primaryColor', v)} />
          <ColorRow label="Couleur secondaire" value={template.secondaryColor} onChange={v => update('secondaryColor', v)} />
          <ColorRow label="Couleur accent" value={template.accentColor} onChange={v => update('accentColor', v)} />
          <ColorRow label="Couleur texte" value={template.textColor} onChange={v => update('textColor', v)} />
          <ColorRow label="Bouton RSVP" value={template.buttonColor} onChange={v => update('buttonColor', v)} />
          <ColorRow label="Texte bouton" value={template.buttonTextColor} onChange={v => update('buttonTextColor', v)} />
          <div className="flex items-center justify-between py-2 border-t border-border/40">
            <label className="text-xs text-muted-foreground">✨ Effet scintillement</label>
            <input type="checkbox" checked={template.glitter || false} onChange={e => update('glitter', e.target.checked)} className="w-4 h-4" />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">🌸 Décorations florales</label>
            <input type="checkbox" checked={template.floral || false} onChange={e => update('floral', e.target.checked)} className="w-4 h-4" />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">🔲 Coins décoratifs</label>
            <input type="checkbox" checked={template.cornerDecoration || false} onChange={e => update('cornerDecoration', e.target.checked)} className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Typography */}
      {activeSection === 'typography' && (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Police</label>
            <select
              className="w-full bg-background border rounded px-2 py-1.5 text-sm"
              value={template.fontFamily}
              onChange={e => update('fontFamily', e.target.value)}
            >
              {FONT_OPTIONS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <SliderRow
            label="Taille du titre"
            value={parseFloat(template.headerFontSize) || 3}
            min={1.5} max={5} step={0.25}
            unit="rem"
            onChange={v => update('headerFontSize', `${v}rem`)}
          />
          <SliderRow
            label="Taille du texte"
            value={parseFloat(template.bodyFontSize) || 1}
            min={0.75} max={1.5} step={0.05}
            unit="rem"
            onChange={v => update('bodyFontSize', `${v}rem`)}
          />
        </div>
      )}

      {/* Border */}
      {activeSection === 'border' && (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Style de bordure</label>
            <div className="flex gap-2">
              {BORDER_STYLES.map(s => (
                <button
                  key={s}
                  onClick={() => update('borderStyle', s)}
                  className={`flex-1 py-2 text-xs rounded border transition-colors capitalize ${
                    template.borderStyle === s ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  {s === 'none' ? '—' : s}
                </button>
              ))}
            </div>
          </div>
          <ColorRow label="Couleur de bordure" value={template.borderColor} onChange={v => update('borderColor', v)} />
          <SliderRow
            label="Opacité de la bordure"
            value={(template.borderOpacity ?? 0.5) * 100}
            min={0} max={100} step={5}
            unit="%"
            onChange={v => update('borderOpacity', v / 100)}
          />
        </div>
      )}

      {/* Content texts */}
      {activeSection === 'content' && (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Titre de l'invitation</label>
            <Input value={template.headerText || ''} onChange={e => update('headerText', e.target.value)} className="text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Sous-titre</label>
            <Input value={template.subHeaderText || ''} onChange={e => update('subHeaderText', e.target.value)} className="text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Texte du bouton RSVP</label>
            <Input value={template.buttonLabel || ''} onChange={e => update('buttonLabel', e.target.value)} className="text-sm" />
          </div>
        </div>
      )}

      {/* Background */}
      {activeSection === 'background' && (
        <div className="space-y-4">
          <ColorRow label="Couleur de fond" value={template.bgColor || '#000000'} onChange={v => update('bgColor', v)} />
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Dégradé (couleur 1)</label>
            <input type="color" value={(template.bgGradient || [])[0] || '#000000'} onChange={e => update('bgGradient', [e.target.value, (template.bgGradient || [])[1] || '#000'])} className="w-12 h-8 p-0 border-0 cursor-pointer" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Dégradé (couleur 2)</label>
            <input type="color" value={(template.bgGradient || [])[1] || '#000000'} onChange={e => update('bgGradient', [(template.bgGradient || [])[0] || '#000', e.target.value])} className="w-12 h-8 p-0 border-0 cursor-pointer" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Image de fond (URL)</label>
            <Input
              placeholder="https://images.unsplash.com/..."
              value={template.bgImage || ''}
              onChange={e => update('bgImage', e.target.value || null)}
              className="text-sm"
            />
          </div>
        </div>
      )}

      {/* Save as preset */}
      <div className="pt-4 mt-6 border-t border-border">
        <label className="text-xs text-muted-foreground block mb-2 font-medium uppercase tracking-widest">Sauvegarder ce modèle</label>
        <div className="flex gap-2">
          <Input 
            placeholder="Nom du modèle" 
            value={saveName} 
            onChange={e => setSaveName(e.target.value)} 
            className="text-sm h-9"
          />
          <Button size="sm" variant="secondary" onClick={handleSavePreset} disabled={!saveName.trim() || isSaving} className="h-9 shrink-0">
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? '...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ColorRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)} className="w-10 h-7 p-0 border-0 cursor-pointer rounded" />
        <span className="text-xs text-muted-foreground font-mono w-16">{value}</span>
      </div>
    </div>
  )
}

function SliderRow({ label, value, min, max, step, unit, onChange }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-xs text-muted-foreground">{label}</label>
        <span className="text-xs">{Number(value).toFixed(step < 1 ? 2 : 0)}{unit}</span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={step} />
    </div>
  )
}
