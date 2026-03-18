'use client'

import { useState, useEffect } from 'react'
import { getUserTemplates } from '@/app/actions/template'
import { TEMPLATE_PRESETS } from '@/lib/template-presets'
import InvitationPreview from './InvitationPreview'
import { Plus } from 'lucide-react'

export default function TemplateGallery({ selectedId, onSelect }) {
  const [customTemplates, setCustomTemplates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUserTemplates()
      .then(tmpls => setCustomTemplates(tmpls))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const categories = [...new Set(TEMPLATE_PRESETS.map(p => p.category))]

  return (
    <div className="space-y-8">
      {/* Custom User Templates */}
      {(!loading && customTemplates.length > 0) && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Mes Modèles Sauvegardés</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {customTemplates.map(preset => (
              <button
                key={preset.id}
                onClick={() => onSelect(preset.id, preset.config)}
                className={`relative rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.03] active:scale-[0.97] aspect-[3/4] ${
                  selectedId === preset.id
                    ? 'border-primary shadow-lg shadow-primary/30 ring-2 ring-primary/40'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <div className="absolute inset-0 scale-75 origin-top pointer-events-none">
                  <InvitationPreview
                    template={preset.config}
                    event={{ title: 'Mon Événement', eventDate: new Date().toISOString(), location: '' }}
                  />
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-2 text-left">
                  <span className="text-lg">⭐</span>
                  <p className="text-white text-xs font-semibold leading-tight mt-0.5">{preset.name}</p>
                </div>
                {selectedId === preset.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Preset Categories */}
      {categories.map(cat => (
        <div key={cat}>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">{cat}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TEMPLATE_PRESETS.filter(p => p.category === cat).map(preset => (
              <button
                key={preset.id}
                onClick={() => onSelect(preset.id, preset.template)}
                className={`relative rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.03] active:scale-[0.97] aspect-[3/4] ${
                  selectedId === preset.id
                    ? 'border-primary shadow-lg shadow-primary/30 ring-2 ring-primary/40'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                {/* Mini preview */}
                <div className="absolute inset-0 scale-75 origin-top pointer-events-none">
                  <InvitationPreview
                    template={preset.template}
                    event={{ title: 'Mon Événement', eventDate: new Date().toISOString(), location: 'Paris' }}
                    guestName="Alice"
                  />
                </div>
                {/* Label overlay */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-2 text-left">
                  <span className="text-lg">{preset.emoji}</span>
                  <p className="text-white text-xs font-semibold leading-tight mt-0.5">{preset.name}</p>
                </div>
                {selectedId === preset.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
