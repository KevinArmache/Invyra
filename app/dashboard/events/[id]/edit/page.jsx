'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Wand2 } from 'lucide-react'
import { getEventById, updateEvent } from '@/app/actions/event'

const themes = [
  { id: 'elegant', name: 'Elegant', description: 'Classic gold particles with soft lighting', color: '#d4af37' },
  { id: 'romantic', name: 'Romantic', description: 'Rose gold hues with floating hearts', color: '#c9a27e' },
  { id: 'modern', name: 'Modern', description: 'Clean geometric shapes with sleek animations', color: '#8b9dc3' },
  { id: 'festive', name: 'Festive', description: 'Colorful confetti and celebration vibes', color: '#ff6b6b' },
  { id: 'nature', name: 'Nature', description: 'Organic leaves and earthy tones', color: '#6b8e6b' },
  { id: 'cosmic', name: 'Cosmic', description: 'Starry night with galaxy particles', color: '#4a4e69' },
]

export default function EditEventPage({ params }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [event, setEvent] = useState(null)
  const [eventLoading, setEventLoading] = useState(true)

  useEffect(() => {
    getEventById(id).then(data => { setEvent(data); setEventLoading(false) }).catch(() => setEventLoading(false))
  }, [id])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    location: '',
    theme: 'elegant',
    custom_message: '',
    status: 'draft'
  })

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        event_date: event.eventDate ? new Date(event.eventDate).toISOString().slice(0, 16) : '',
        location: event.location || '',
        theme: event.theme || 'elegant',
        custom_message: event.customMessage || '',
        status: event.status || 'draft'
      })
    }
  }, [event])

  function handleChange(e) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await updateEvent(id, formData)
      router.push(`/dashboard/events/${id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (eventLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-foreground mb-4">Event not found</h2>
        <Button asChild>
          <Link href="/dashboard/events">Back to Events</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/events/${id}`}>
            <ArrowLeft size={20} />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Event</h1>
          <p className="text-muted-foreground mt-1">Update your event details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
            {error}
          </div>
        )}

        {/* Basic Details */}
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>Basic information about your event</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-foreground">
                Event Title *
              </label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Sarah & John's Wedding"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-foreground">
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                placeholder="Tell your guests what to expect..."
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="event_date" className="text-sm font-medium text-foreground">
                  Event Date
                </label>
                <Input
                  id="event_date"
                  name="event_date"
                  type="datetime-local"
                  value={formData.event_date}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium text-foreground">
                  Location
                </label>
                <Input
                  id="location"
                  name="location"
                  placeholder="e.g., The Grand Ballroom, NYC"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium text-foreground">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Theme Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-primary" />
              Animation Theme
            </CardTitle>
            <CardDescription>Choose a visual style for your invitation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, theme: theme.id }))}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    formData.theme === theme.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div 
                    className="w-8 h-8 rounded-full mb-3"
                    style={{ backgroundColor: theme.color }}
                  />
                  <h4 className="font-medium text-foreground">{theme.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{theme.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Custom Message */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Message</CardTitle>
            <CardDescription>Add a personal message to display on the invitation</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              name="custom_message"
              placeholder="We are thrilled to invite you to celebrate with us..."
              value={formData.custom_message}
              onChange={handleChange}
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href={`/dashboard/events/${id}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
