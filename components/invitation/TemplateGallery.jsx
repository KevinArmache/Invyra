'use client'

import { useState, useEffect } from 'react'
import { getUserTemplates } from '@/app/actions/template'
import InvitationPreview from './InvitationPreview'

export default function TemplateGallery({ selectedId, onSelect }) {
  const [customTemplates, setCustomTemplates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUserTemplates()
      .then(tmpls => setCustomTemplates(tmpls))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-center py-8 text-sm text-muted-foreground animate-pulse">Chargement des modèles...</div>
  }

  if (customTemplates.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-xl">
        <p className="text-sm text-muted-foreground">Vous n'avez aucun modèle personnalisé.</p>
        <p className="text-xs text-muted-foreground mt-1">Créez-en un depuis l'onglet "Modèles" du menu principal.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Vos Modèles Customisés</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {customTemplates.map(preset => (
            <button
              key={preset.id}
              onClick={() => onSelect(preset.id, preset.config)}
              className={`relative rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.03] active:scale-[0.97] aspect-[3/4] bg-muted/20 ${
                selectedId === preset.id
                  ? 'border-primary shadow-lg shadow-primary/30 ring-2 ring-primary/40'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <div className="absolute inset-0 scale-75 origin-top pointer-events-none">
                <InvitationPreview
                  template={preset.config}
                  event={{ title: 'Votre Événement', eventDate: new Date().toISOString(), location: 'Lieu' }}
                  readOnly
                />
              </div>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-2 text-left">
                <span className="text-lg">💻</span>
                <p className="text-white text-xs font-semibold leading-tight mt-0.5 truncate">{preset.name}</p>
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
    </div>
  )
}
