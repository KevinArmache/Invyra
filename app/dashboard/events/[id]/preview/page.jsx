'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Pencil } from 'lucide-react'
import { getEventById } from '@/app/actions/event'

const InvitationScene = dynamic(() => import('@/components/3d/InvitationScene'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
})

export default function EventPreviewPage({ params }) {
  const { id } = use(params)
  const [started, setStarted] = useState(false)
  const [event, setEvent] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getEventById(id).then(data => { setEvent(data); setIsLoading(false) }).catch(() => setIsLoading(false))
  }, [id])

  const error = !event && !isLoading

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!event && !isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Event not found</h2>
          <Button asChild>
            <Link href="/dashboard/events">Back to Events</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-background">
      {/* 3D Scene */}
      <InvitationScene 
        event={event}
        guestName="Guest Preview"
        started={started}
        onStart={() => setStarted(true)}
      />

      {/* Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
        <Button variant="secondary" size="sm" asChild>
          <Link href={`/dashboard/events/${id}`}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Event
          </Link>
        </Button>
        <Button variant="secondary" size="sm" asChild>
          <Link href={`/dashboard/events/${id}/animation`}>
            <Pencil size={16} className="mr-2" />
            Edit Animation
          </Link>
        </Button>
      </div>

      {/* Start Button */}
      {!started && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center">
            <p className="text-white/80 text-lg mb-6">Preview Mode</p>
            <Button 
              size="lg" 
              onClick={() => setStarted(true)}
            >
              View Invitation
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
