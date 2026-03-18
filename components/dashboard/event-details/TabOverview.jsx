'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit, CheckCircle, LayoutTemplate } from 'lucide-react'
import RSVPTracker from '@/components/invitation/RSVPTracker'
import InvitationPreview from '@/components/invitation/InvitationPreview'

export default function TabOverview({ event, guests, demoEvent }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Suivi des réponses RSVP</CardTitle>
        </CardHeader>
        <CardContent>
          <RSVPTracker guests={guests} />
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Template Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Modèle d'invitation</span>
              <Button size="sm" variant="outline" asChild className="gap-1.5 text-xs">
                <Link href={`/dashboard/events/${event.id}/edit`}>
                  <Edit className="w-3.5 h-3.5" />
                  {event.invitationTemplate ? 'Changer le modèle' : 'Choisir un modèle'}
                </Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {event.invitationTemplate ? (
              <>
                <div className="relative h-48 rounded-lg overflow-hidden border border-border shadow-sm">
                  <InvitationPreview
                    template={event.invitationTemplate}
                    event={demoEvent}
                    guestName="Exemple Invité"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-green-500 font-medium bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20">
                  <CheckCircle className="w-4 h-4" /> Modèle actif
                </div>
              </>
            ) : (
              <div className="text-center py-6 border border-dashed border-border rounded-lg space-y-2">
                <LayoutTemplate className="w-8 h-8 mx-auto text-muted-foreground opacity-30" />
                <p className="text-sm text-muted-foreground">Aucun modèle sélectionné</p>
                <p className="text-xs text-muted-foreground">Choisissez un modèle pour envoyer vos invitations</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Résumé de l'événement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {event.description && (
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Description</span>
                <p className="text-sm mt-1">{event.description}</p>
              </div>
            )}
            {event.customMessage && (
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Message aux invités</span>
                <p className="text-sm mt-1 italic">"{event.customMessage}"</p>
              </div>
            )}
            {!event.description && !event.customMessage && (
              <p className="text-sm text-muted-foreground">Aucune description ou message personnalisé.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
