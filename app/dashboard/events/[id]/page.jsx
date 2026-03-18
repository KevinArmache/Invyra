'use client'

import { useState, use, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Eye, 
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Pencil,
  Send,
  Trash2,
  ExternalLink,
  Wand2
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { getEventById } from '@/app/actions/event'
import { getGuests, addGuest, deleteGuest, sendInvitationEmail } from '@/app/actions/guest'

export default function EventDetailPage({ params }) {
  const { id } = use(params)
  const [isAddGuestOpen, setIsAddGuestOpen] = useState(false)
  const [guestForm, setGuestForm] = useState({ name: '', email: '', phone: '' })
  const [addingGuest, setAddingGuest] = useState(false)
  const [event, setEvent] = useState(null)
  const [guests, setGuests] = useState([])
  const [eventLoading, setEventLoading] = useState(true)
  const [guestsLoading, setGuestsLoading] = useState(true)

  useEffect(() => {
    getEventById(id).then(data => { setEvent(data); setEventLoading(false) }).catch(() => setEventLoading(false))
    getGuests(id).then(data => { setGuests(data || []); setGuestsLoading(false) }).catch(() => setGuestsLoading(false))
  }, [id])

  async function handleAddGuest(e) {
    e.preventDefault()
    setAddingGuest(true)

    try {
      const guest = await addGuest(id, guestForm)
      setGuests(prev => [guest, ...prev])
      setGuestForm({ name: '', email: '', phone: '' })
      setIsAddGuestOpen(false)
      // Refresh event stats
      getEventById(id).then(data => setEvent(data))
    } catch (error) {
      console.error('Failed to add guest:', error)
    } finally {
      setAddingGuest(false)
    }
  }

  async function handleDeleteGuest(guestId) {
    if (!confirm('Are you sure you want to remove this guest?')) return

    try {
      await deleteGuest(guestId)
      setGuests(prev => prev.filter(g => g.id !== guestId))
      getEventById(id).then(data => setEvent(data))
    } catch (error) {
      console.error('Failed to delete guest:', error)
    }
  }

  async function handleSendInvitation(guestId) {
    try {
      await sendInvitationEmail(guestId)
      getGuests(id).then(data => setGuests(data || []))
    } catch (error) {
      console.error('Failed to send invitation:', error)
      alert('Failed to send invitation. Make sure RESEND_API_KEY is configured.')
    }
  }

  if (eventLoading) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
    )
  }

  if (!event && !eventLoading) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-foreground mb-4">Event not found</h2>
        <Button asChild>
          <Link href="/dashboard/events">Back to Events</Link>
        </Button>
      </div>
    )
  }

  const confirmedCount = guests.filter(g => g.rsvpStatus === 'confirmed').length
  const declinedCount = guests.filter(g => g.rsvpStatus === 'declined').length
  const pendingCount = guests.filter(g => !g.rsvpStatus).length
  const viewedCount = guests.filter(g => g.invitationViewedAt).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/events">
              <ArrowLeft size={20} />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{event.title}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-muted-foreground">
              {event.eventDate && (
                <span className="flex items-center gap-1">
                  <Calendar size={16} />
                  {new Date(event.eventDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              )}
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={16} />
                  {event.location}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/events/${id}/edit`}>
              <Pencil size={16} className="mr-2" />
              Edit
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/events/${id}/preview`}>
              <Eye size={16} className="mr-2" />
              Preview
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{guests.length}</div>
                <div className="text-sm text-muted-foreground">Total Guests</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{confirmedCount}</div>
                <div className="text-sm text-muted-foreground">Confirmed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{pendingCount}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{viewedCount}</div>
                <div className="text-sm text-muted-foreground">Viewed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Animation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-primary" />
              <CardTitle>AI Animation</CardTitle>
            </div>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/events/${id}/animation`}>
                Customize Animation
              </Link>
            </Button>
          </div>
          <CardDescription>
            Current theme: <span className="text-primary capitalize">{event.theme}</span>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Guest List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Guest List</CardTitle>
              <CardDescription>Manage your event guests and track RSVPs</CardDescription>
            </div>
            <Dialog open={isAddGuestOpen} onOpenChange={setIsAddGuestOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus size={16} className="mr-2" />
                  Add Guest
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Guest</DialogTitle>
                  <DialogDescription>
                    Add a guest to your event. They will receive a unique invitation link.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddGuest} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name *</label>
                    <Input
                      placeholder="John Doe"
                      value={guestForm.name}
                      onChange={(e) => setGuestForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email *</label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={guestForm.email}
                      onChange={(e) => setGuestForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <Input
                      placeholder="+1 (555) 123-4567"
                      value={guestForm.phone}
                      onChange={(e) => setGuestForm(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddGuestOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={addingGuest}>
                      {addingGuest ? 'Adding...' : 'Add Guest'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {guestsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : guests.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No guests yet</h3>
              <p className="text-muted-foreground mb-4">Add your first guest to start sending invitations</p>
            </div>
          ) : (
            <div className="space-y-2">
              {guests.map((guest) => (
                <div 
                  key={guest.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-card/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-medium">
                        {guest.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{guest.name}</h4>
                      <p className="text-sm text-muted-foreground">{guest.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      guest.rsvpStatus === 'confirmed' 
                        ? 'bg-green-500/20 text-green-400'
                        : guest.rsvpStatus === 'declined'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {guest.rsvpStatus || 'pending'}
                    </span>
                    {guest.invitationViewedAt && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Eye size={12} />
                        Viewed
                      </span>
                    )}
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleSendInvitation(guest.id)}
                        title="Send invitation email"
                      >
                        <Send size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        asChild
                        title="View invitation"
                      >
                        <Link href={`/invite/${guest.invitationToken}`} target="_blank">
                          <ExternalLink size={16} />
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteGuest(guest.id)}
                        title="Remove guest"
                      >
                        <Trash2 size={16} className="text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
