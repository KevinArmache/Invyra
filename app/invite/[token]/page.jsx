'use client'

import { useState, useEffect, use } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, HelpCircle, MailOpen } from 'lucide-react'
import InvitationPreview from '@/components/invitation/InvitationPreview'

export default function InvitationPage({ params }) {
  const { token } = use(params)
  const [invitation, setInvitation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [showEnvelope, setShowEnvelope] = useState(true) // Initial "Open" state
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
        
        if (!res.ok) throw new Error(data.error || 'Invitation introuvable')
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
      if (res.ok) setRsvpSubmitted(true)
    } catch (err) {
      console.error('RSVP failed:', err)
    } finally {
      setRsvpSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="h-[100dvh] bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="h-[100dvh] bg-background flex flex-col items-center justify-center p-4">
        <XCircle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Lien Invalide</h1>
        <p className="text-muted-foreground text-center">Cette invitation n'existe pas ou a expiré.</p>
      </div>
    )
  }

  const { event, guest } = invitation
  // Fallback if no template was saved
  const template = event.invitationTemplate || {
    style: 'elegant', primaryColor: '#d4af37', bgColor: '#111', textColor: '#fff'
  }

  return (
    <div className="h-[100dvh] w-full relative bg-black overflow-hidden flex flex-col items-center justify-center">
      
      {/* ── 1. Envelope Animation ── */}
      <AnimatePresence>
        {showEnvelope && (
          <motion.div 
            className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a0a0a] cursor-pointer"
            onClick={() => setShowEnvelope(false)}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          >
            <div className="text-center group">
              <div className="w-32 h-24 sm:w-48 sm:h-32 bg-muted/20 border-2 border-primary/50 flex flex-col items-center justify-center mx-auto mb-6 transform transition-transform group-hover:scale-110 group-hover:-translate-y-2 shadow-2xl shadow-primary/20 relative rounded-sm">
                <div className="absolute top-0 inset-x-0 border-t-[48px] border-l-[64px] border-r-[64px] sm:border-t-[64px] sm:border-l-[96px] sm:border-r-[96px] border-t-background border-l-transparent border-r-transparent origin-top transition-transform duration-500 group-hover:-rotate-x-180" style={{ transformStyle: 'preserve-3d' }} />
                <MailOpen className="w-8 h-8 sm:w-12 sm:h-12 text-primary opacity-80" />
              </div>
              <p className="text-muted-foreground tracking-widest uppercase text-xs sm:text-sm animate-pulse">
                Tapez pour ouvrir
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 2. Template Preview ── */}
      <motion.div 
        className="w-full h-full"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: showEnvelope ? 0 : 1, scale: showEnvelope ? 0.95 : 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      >
        <InvitationPreview
          template={template}
          event={event}
          guestName={guest.name}
          onRSVP={() => setShowRSVP(true)}
        />
      </motion.div>

      {/* ── 3. RSVP Modal Modal ── */}
      <AnimatePresence>
        {showRSVP && (
          <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
              <Card className="w-full max-w-md shadow-2xl border-primary/20 bg-background/95 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-xl">
                    {rsvpSubmitted ? 'Merci !' : 'Serez-vous présent(e) ?'}
                  </CardTitle>
                  <CardDescription>
                    {rsvpSubmitted ? 'Votre réponse a bien été enregistrée.' : `Bonjour ${guest.name.split(' ')[0]}, confirmez votre présence pour ${event.title}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {rsvpSubmitted ? (
                    <div className="text-center py-6">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <p className="text-foreground">
                        {rsvpForm.rsvp_status === 'confirmed' ? "Nous avons hâte de vous y voir !" : 
                         rsvpForm.rsvp_status === 'declined' ? "Désolé de ne pas pouvoir vous compter parmi nous." : 
                         "Nous vous tiendrons au courant !"}
                      </p>
                      <Button variant="outline" className="mt-8" onClick={() => setShowRSVP(false)}>Fermer</Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-3">
                        <RSVPOption 
                          icon={CheckCircle} color="green" label="Oui" value="confirmed" 
                          selected={rsvpForm.rsvp_status === 'confirmed'} onClick={() => handleRSVP('confirmed')} 
                        />
                        <RSVPOption 
                          icon={HelpCircle} color="yellow" label="Peut-être" value="maybe" 
                          selected={rsvpForm.rsvp_status === 'maybe'} onClick={() => handleRSVP('maybe')} 
                        />
                        <RSVPOption 
                          icon={XCircle} color="red" label="Non" value="declined" 
                          selected={rsvpForm.rsvp_status === 'declined'} onClick={() => handleRSVP('declined')} 
                        />
                      </div>

                      {rsvpForm.rsvp_status === 'confirmed' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Serez-vous accompagné(e) ?</label>
                            <Button variant={rsvpForm.plus_one ? 'default' : 'outline'} size="sm" onClick={() => setRsvpForm(p => ({ ...p, plus_one: !p.plus_one }))}>
                              {rsvpForm.plus_one ? 'Oui (+1)' : 'Non'}
                            </Button>
                          </div>
                          <div>
                            <label className="text-sm font-medium block mb-1">Régime alimentaire / Allergies</label>
                            <Textarea placeholder="Végétarien, sans gluten..." value={rsvpForm.dietary_restrictions} onChange={(e) => setRsvpForm(p => ({ ...p, dietary_restrictions: e.target.value }))} rows={2} />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-medium block mb-1">Petit mot pour les mariés/l'hôte (optionnel)</label>
                        <Textarea placeholder="..." value={rsvpForm.notes} onChange={(e) => setRsvpForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button variant="ghost" className="flex-1" onClick={() => setShowRSVP(false)}>Annuler</Button>
                        <Button className="flex-[2]" disabled={!rsvpForm.rsvp_status || rsvpSubmitting} onClick={submitRSVP}>
                          {rsvpSubmitting ? 'Envoi...' : 'Confirmer'}
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

function RSVPOption({ icon: Icon, color, label, selected, onClick }) {
  const colors = {
    green: selected ? 'border-green-500 bg-green-500/10 text-green-500' : 'border-border text-muted-foreground hover:border-green-500/50',
    yellow: selected ? 'border-yellow-500 bg-yellow-500/10 text-yellow-500' : 'border-border text-muted-foreground hover:border-yellow-500/50',
    red: selected ? 'border-red-500 bg-red-500/10 text-red-500' : 'border-border text-muted-foreground hover:border-red-500/50',
  }
  
  return (
    <button onClick={onClick} className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${colors[color]}`}>
      <Icon className="w-6 h-6" />
      <span className="text-xs font-semibold">{label}</span>
    </button>
  )
}
