'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Calendar, 
  Plus, 
  Search, 
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  Users
} from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { getEvents, deleteEvent } from '@/app/actions/event'
import InvitationPreview from '@/components/invitation/InvitationPreview'
import { TEMPLATE_PRESETS } from '@/utils/template-presets'

export default function EventsPage() {
  const [search, setSearch] = useState('')
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [previewEvent, setPreviewEvent] = useState(null)

  useEffect(() => {
    getEvents().then(data => {
      setEvents(data || [])
      setIsLoading(false)
    }).catch(() => setIsLoading(false))
  }, [])
  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(eventId) {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return
    }

    try {
      await deleteEvent(eventId)
      setEvents(prev => prev.filter(e => e.id !== eventId))
    } catch (error) {
      console.error('Failed to delete event:', error)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Events</h1>
          <p className="text-muted-foreground mt-1">Manage all your events and invitations</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/events/new">
            <Plus size={20} className="mr-2" />
            Create Event
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {search ? 'No events found' : 'No events yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {search ? 'Try a different search term' : 'Create your first event to get started'}
            </p>
            {!search && (
              <Button asChild>
                <Link href="/dashboard/events/new">
                  <Plus size={20} className="mr-2" />
                  Create Event
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="group hover:border-primary/30 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={(e) => { e.preventDefault(); setPreviewEvent(event) }} title="Aperçu de l'invitation">
                      <Eye size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted" title="Éditer">
                      <Link href={`/dashboard/events/${event.id}/edit`}>
                        <Pencil size={16} />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.preventDefault(); handleDelete(event.id) }} title="Supprimer">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>

                <Link href={`/dashboard/events/${event.id}`}>
                  <h3 className="text-lg font-semibold text-foreground mb-2 hover:text-primary transition-colors">
                    {event.title}
                  </h3>
                </Link>

                <p className="text-sm text-muted-foreground mb-4">
                  {event.eventDate 
                    ? new Date(event.eventDate).toLocaleDateString('en-US', { 
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })
                    : 'Date not set'
                  }
                </p>

                {event.location && (
                  <p className="text-sm text-muted-foreground mb-4 truncate">
                    {event.location}
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users size={16} />
                    <span>{event.guest_count || 0} guests</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    event.status === 'active' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {event.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Fullscreen Preview Dialog */}
      <Dialog open={!!previewEvent} onOpenChange={(open) => !open && setPreviewEvent(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-[600px] h-[90vh] p-0 overflow-hidden bg-black border border-border">
          {previewEvent && (
            <div className="w-full h-full overflow-auto custom-scrollbar">
              <InvitationPreview 
                template={previewEvent.invitationTemplate || TEMPLATE_PRESETS[0].template} 
                event={{
                  title: previewEvent.title,
                  eventDate: previewEvent.eventDate,
                  location: previewEvent.location,
                  time: previewEvent.time,
                  dressCode: previewEvent.dressCode || previewEvent.dress_code,
                  customMessage: previewEvent.customMessage
                }} 
                guestName="Exemple Invité"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
