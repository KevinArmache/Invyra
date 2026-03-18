'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Trash2, LayoutTemplate } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getUserTemplates, deleteUserTemplate } from '@/app/actions/template'
import InvitationPreview from '@/components/invitation/InvitationPreview'

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    setLoading(true)
    try {
      const data = await getUserTemplates()
      setTemplates(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce modèle ?')) return
    try {
      await deleteUserTemplate(id)
      loadTemplates()
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mes Modèles</h1>
          <p className="text-muted-foreground mt-1">Créez et gérez vos designs réutilisables pour vos invitations.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/templates/new">
            <Plus className="w-4 h-4 mr-2" /> Nouveau modèle
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <LayoutTemplate className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground mb-2">Aucun modèle sauvegardé</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Créez votre propre modèle personnalisable avec l'IA ou à la main, pour le réutiliser lors de vos prochains événements.
            </p>
            <Button asChild>
              <Link href="/dashboard/templates/new">
                <Plus className="w-4 h-4 mr-2" /> Créer mon premier modèle
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {templates.map(tmpl => (
            <Card key={tmpl.id} className="overflow-hidden flex flex-col hover:border-primary/40 transition-colors">
              <div className="relative aspect-[3/4] bg-muted/20 border-b border-border overflow-hidden">
                {/* Scaled preview centered inside the card */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: 0, left: '50%',
                    transform: 'translateX(-50%) scale(0.55)',
                    transformOrigin: 'top center',
                    width: '182%',
                    height: '182%',
                  }}
                >
                  <InvitationPreview 
                    template={tmpl.config} 
                    event={{ title: tmpl.name, eventDate: new Date().toISOString(), location: 'Lieu de l\'événement', time: '19h00', dressCode: 'Tenue de soirée' }} 
                    guestName="Marie Dupont"
                  />
                </div>
                
                {/* Delete overlay */}
                <div className="absolute inset-0 flex items-start justify-end p-2 opacity-0 hover:opacity-100 transition-opacity">
                  <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full shadow-lg" onClick={(e) => { e.preventDefault(); handleDelete(tmpl.id) }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-4 flex flex-col gap-1 items-start bg-card z-10">
                <h3 className="font-semibold text-lg truncate w-full">{tmpl.name}</h3>
                <p className="text-xs text-muted-foreground w-full">Créé le {new Date(tmpl.createdAt).toLocaleDateString('fr-FR')}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
