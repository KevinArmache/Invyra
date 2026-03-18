'use client'

import { useState, useEffect, use } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, HelpCircle, Sparkles } from 'lucide-react'

const InvitationScene = dynamic(() => import('@/components/3d/InvitationScene'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading your invitation...</p>
      </div>
    </div>
  )
})

export default function InvitationPage({ params }) {
  const { token } = use(params)
  const [invitation, setInvitation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [started, setStarted] = useState(true)
  const [showRSVP, setShowRSVP] = useState(false)
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false)
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false)
  const [rsvpForm, setRsvpForm] = useState({
    rsvp_status: '',
    dietary_restrictions: '',
    plus_one: false,
    notes: ''
  })

  useEffect(() => {
    async function fetchInvitation() {
      try {
        const res = await fetch(`/api/invite/${token}`)
        const data = await res.json()
        
        if (!res.ok) {
          throw new Error(data.error || 'Invitation not found')
        }
        
        setInvitation(data.invitation)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchInvitation()
  }, [token])

  async function handleRSVP(status) {
    setRsvpForm(prev => ({ ...prev, rsvp_status: status }))
  }

  async function submitRSVP() {
    if (!rsvpForm.rsvp_status) return
    
    setRsvpSubmitting(true)
    
    try {
      const res = await fetch(`/api/invite/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rsvpForm)
      })
      
      if (res.ok) {
        setRsvpSubmitted(true)
      }
    } catch (err) {
      console.error('RSVP failed:', err)
    } finally {
      setRsvpSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your invitation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Invitation Not Found</CardTitle>
            <CardDescription>
              This invitation link may be invalid or has expired.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const { guest, event } = invitation

  return (
    <div className="h-[100dvh] w-full relative bg-background overflow-hidden">
      {/* 3D Scene */}
      <InvitationScene 
        event={event} 
        guestName={guest.name} 
        started={started}
        onStart={() => setStarted(true)}
      />



      {/* RSVP Button */}
      <AnimatePresence>
        {started && !showRSVP && (
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ delay: 2, duration: 0.5 }}
          >
            <Button 
              size="lg" 
              onClick={() => setShowRSVP(true)}
              className="shadow-2xl"
            >
              RSVP Now
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RSVP Modal */}
      <AnimatePresence>
        {showRSVP && (
          <motion.div
            className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>
                    {rsvpSubmitted ? 'Thank You!' : 'Will you attend?'}
                  </CardTitle>
                  <CardDescription>
                    {rsvpSubmitted 
                      ? `Your response has been recorded.`
                      : `Please let us know if you can make it to ${event.title}`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {rsvpSubmitted ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <p className="text-foreground">
                        {rsvpForm.rsvp_status === 'confirmed' 
                          ? "We can't wait to see you there!"
                          : rsvpForm.rsvp_status === 'declined'
                          ? "We're sorry you can't make it. You'll be missed!"
                          : "We'll keep you updated!"
                        }
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-6"
                        onClick={() => setShowRSVP(false)}
                      >
                        Close
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* RSVP Options */}
                      <div className="grid grid-cols-3 gap-4">
                        <button
                          onClick={() => handleRSVP('confirmed')}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            rsvpForm.rsvp_status === 'confirmed'
                              ? 'border-green-500 bg-green-500/10'
                              : 'border-border hover:border-green-500/50'
                          }`}
                        >
                          <CheckCircle className={`w-8 h-8 mx-auto mb-2 ${
                            rsvpForm.rsvp_status === 'confirmed' ? 'text-green-500' : 'text-muted-foreground'
                          }`} />
                          <span className="text-sm font-medium">Accept</span>
                        </button>
                        <button
                          onClick={() => handleRSVP('maybe')}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            rsvpForm.rsvp_status === 'maybe'
                              ? 'border-yellow-500 bg-yellow-500/10'
                              : 'border-border hover:border-yellow-500/50'
                          }`}
                        >
                          <HelpCircle className={`w-8 h-8 mx-auto mb-2 ${
                            rsvpForm.rsvp_status === 'maybe' ? 'text-yellow-500' : 'text-muted-foreground'
                          }`} />
                          <span className="text-sm font-medium">Maybe</span>
                        </button>
                        <button
                          onClick={() => handleRSVP('declined')}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            rsvpForm.rsvp_status === 'declined'
                              ? 'border-red-500 bg-red-500/10'
                              : 'border-border hover:border-red-500/50'
                          }`}
                        >
                          <XCircle className={`w-8 h-8 mx-auto mb-2 ${
                            rsvpForm.rsvp_status === 'declined' ? 'text-red-500' : 'text-muted-foreground'
                          }`} />
                          <span className="text-sm font-medium">Decline</span>
                        </button>
                      </div>

                      {/* Additional Info */}
                      {rsvpForm.rsvp_status === 'confirmed' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Bringing a plus one?</label>
                            <Button
                              variant={rsvpForm.plus_one ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setRsvpForm(prev => ({ ...prev, plus_one: !prev.plus_one }))}
                            >
                              {rsvpForm.plus_one ? 'Yes' : 'No'}
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Dietary restrictions</label>
                            <Textarea
                              placeholder="Any food allergies or preferences?"
                              value={rsvpForm.dietary_restrictions}
                              onChange={(e) => setRsvpForm(prev => ({ ...prev, dietary_restrictions: e.target.value }))}
                              rows={2}
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Message (optional)</label>
                        <Textarea
                          placeholder="Any message for the host?"
                          value={rsvpForm.notes}
                          onChange={(e) => setRsvpForm(prev => ({ ...prev, notes: e.target.value }))}
                          rows={2}
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-4">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setShowRSVP(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          className="flex-1"
                          disabled={!rsvpForm.rsvp_status || rsvpSubmitting}
                          onClick={submitRSVP}
                        >
                          {rsvpSubmitting ? 'Submitting...' : 'Submit RSVP'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
