'use client'

import { useState, useEffect, use, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, HelpCircle, MailOpen } from 'lucide-react'
import InvitationPreview from '@/components/invitation/InvitationPreview'
import { getInvitationByToken, updateRsvpStatus } from '@/app/actions/invitation'

export default function InvitationPage({ params }) {
  const { token } = use(params)
  const [invitation, setInvitation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [showEnvelope, setShowEnvelope] = useState(true)
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false)
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false)
  const rsvpRef = useRef(null)

  const [rsvpForm, setRsvpForm] = useState({
    rsvp_status: '',
    dietary_restrictions: '',
    plus_one: false,
    notes: ''
  })

  useEffect(() => {
    async function fetchInvitation() {
      try {
        const data = await getInvitationByToken(token)
        // If the guest already responded, pre-fill
        if (data.guest?.rsvp_status) {
          setRsvpForm(prev => ({ ...prev, rsvp_status: data.guest.rsvp_status }))
          setRsvpSubmitted(true)
        }
        setInvitation(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchInvitation()
  }, [token])

  async function submitRSVP() {
    if (!rsvpForm.rsvp_status) return
    setRsvpSubmitting(true)
    try {
      await updateRsvpStatus(token, rsvpForm)
      setRsvpSubmitted(true)
    } catch (err) {
      console.error('RSVP failed:', err)
    } finally {
      setRsvpSubmitting(false)
    }
  }

  // Scroll to RSVP section when button is clicked
  function handleOpenRSVP() {
    setTimeout(() => {
      rsvpRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  if (loading) {
    return (
      <div className="h-[100dvh] bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="h-[100dvh] bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Lien Invalide</h1>
        <p className="text-white/50 text-center">Cette invitation n'existe pas ou a expiré.</p>
      </div>
    )
  }

  const { event, guest } = invitation
  const primaryColor = event.invitationTemplate?.primaryColor || '#d4af37'
  const template = event.invitationTemplate || {
    style: 'elegant', primaryColor: '#d4af37', bgColor: '#111', textColor: '#fff'
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#0a0a0a] flex flex-col">

      {/* ── Envelope Opening Screen ── */}
      <AnimatePresence>
        {showEnvelope && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a] cursor-pointer"
            onClick={() => setShowEnvelope(false)}
            exit={{ opacity: 0, scale: 1.08, filter: 'blur(12px)' }}
            transition={{ duration: 0.9, ease: 'easeInOut' }}
          >
            <div className="text-center group select-none">
              <div className="w-32 h-24 sm:w-48 sm:h-32 border-2 border-white/20 flex flex-col items-center justify-center mx-auto mb-6 transform transition-transform group-hover:scale-105 group-hover:-translate-y-1 relative rounded-sm">
                <MailOpen className="w-8 h-8 sm:w-12 sm:h-12 text-white/60" />
              </div>
              <p className="text-white/40 tracking-widest uppercase text-xs sm:text-sm animate-pulse">
                Tapez pour ouvrir
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Invitation Template (full screen section) ── */}
      <motion.section
        className="w-full flex-shrink-0"
        style={{ height: '100dvh' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: showEnvelope ? 0 : 1 }}
        transition={{ duration: 0.8, delay: 0.15 }}
      >
        <InvitationPreview
          template={template}
          event={event}
          guestName={guest.name}
          onRSVP={handleOpenRSVP}
        />
      </motion.section>

      {/* ── RSVP Section (inline, below the invitation) ── */}
      <motion.section
        ref={rsvpRef}
        className="w-full flex-shrink-0 flex items-center justify-center py-16 px-4"
        style={{ minHeight: '100dvh', background: '#0d0d0d' }}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: showEnvelope ? 0 : 1, y: showEnvelope ? 40 : 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div className="w-full max-w-md">

          {rsvpSubmitted ? (
            /* ── Confirmation screen ── */
            <div className="text-center space-y-6">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                style={{ background: `${primaryColor}20`, border: `2px solid ${primaryColor}40` }}
              >
                {rsvpForm.rsvp_status === 'confirmed' && <CheckCircle className="w-10 h-10" style={{ color: primaryColor }} />}
                {rsvpForm.rsvp_status === 'declined' && <XCircle className="w-10 h-10 text-red-400" />}
                {rsvpForm.rsvp_status === 'maybe' && <HelpCircle className="w-10 h-10 text-yellow-400" />}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Merci, {guest.name.split(' ')[0]} !</h2>
                <p className="text-white/50 text-sm">
                  {rsvpForm.rsvp_status === 'confirmed'
                    ? "Votre présence a été confirmée. Nous avons hâte de vous y voir !"
                    : rsvpForm.rsvp_status === 'declined'
                    ? "Désolé de ne pas pouvoir vous compter parmi nous. Merci de nous avoir informés."
                    : "Nous avons bien noté votre réponse. Tenez-nous informé dès que possible."}
                </p>
              </div>
              <button
                onClick={() => setRsvpSubmitted(false)}
                className="text-xs text-white/30 hover:text-white/60 underline underline-offset-4 transition-colors"
              >
                Modifier ma réponse
              </button>
            </div>
          ) : (
            /* ── RSVP Form ── */
            <div className="space-y-8">

              {/* Title */}
              <div className="text-center">
                <p className="text-white/40 tracking-widest uppercase text-xs mb-3" style={{ letterSpacing: '0.3em' }}>
                  Répondre à l'invitation
                </p>
                <h2 className="text-2xl font-bold text-white">Serez-vous présent(e) ?</h2>
                <p className="text-white/40 text-sm mt-2">
                  Bonjour <span style={{ color: primaryColor }}>{guest.name.split(' ')[0]}</span>, confirmez votre présence pour <em>{event.title}</em>
                </p>
              </div>

              {/* Choice buttons */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'confirmed', label: 'Oui', icon: CheckCircle, ok: true },
                  { value: 'maybe', label: 'Peut-être', icon: HelpCircle, maybe: true },
                  { value: 'declined', label: 'Non', icon: XCircle, no: true },
                ].map(({ value, label, icon: Icon, ok, maybe, no }) => {
                  const selected = rsvpForm.rsvp_status === value
                  const colors = ok
                    ? selected ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-white/10 text-white/40 hover:border-green-500/40'
                    : maybe
                    ? selected ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400' : 'border-white/10 text-white/40 hover:border-yellow-500/40'
                    : selected ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-white/10 text-white/40 hover:border-red-500/40'
                  return (
                    <button
                      key={value}
                      onClick={() => setRsvpForm(p => ({ ...p, rsvp_status: value }))}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${colors}`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-xs font-semibold">{label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Extra fields shown only if confirmed */}
              <AnimatePresence>
                {rsvpForm.rsvp_status === 'confirmed' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4 overflow-hidden"
                  >
                    {/* Plus one */}
                    <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5">
                      <div>
                        <p className="text-sm font-medium text-white">Accompagné(e) ?</p>
                        <p className="text-xs text-white/40 mt-0.5">Venez-vous avec un(e) +1 ?</p>
                      </div>
                      <button
                        onClick={() => setRsvpForm(p => ({ ...p, plus_one: !p.plus_one }))}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                          rsvpForm.plus_one
                            ? 'text-white'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                        style={rsvpForm.plus_one ? { background: primaryColor } : {}}
                      >
                        {rsvpForm.plus_one ? 'Oui (+1)' : 'Non'}
                      </button>
                    </div>

                    {/* Dietary */}
                    <div>
                      <label className="block text-sm font-medium text-white/60 mb-2">
                        Régime alimentaire / Allergies
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Végétarien, sans gluten, allergies..."
                        value={rsvpForm.dietary_restrictions}
                        onChange={e => setRsvpForm(p => ({ ...p, dietary_restrictions: e.target.value }))}
                        className="w-full rounded-xl bg-white/5 border border-white/10 text-white/80 placeholder-white/20 text-sm px-4 py-3 resize-none focus:outline-none focus:border-white/30 transition-colors"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Notes */}
              {rsvpForm.rsvp_status && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Un petit mot pour l'organisateur <span className="text-white/30">(optionnel)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Message libre..."
                    value={rsvpForm.notes}
                    onChange={e => setRsvpForm(p => ({ ...p, notes: e.target.value }))}
                    className="w-full rounded-xl bg-white/5 border border-white/10 text-white/80 placeholder-white/20 text-sm px-4 py-3 resize-none focus:outline-none focus:border-white/30 transition-colors"
                  />
                </motion.div>
              )}

              {/* Submit */}
              <button
                onClick={submitRSVP}
                disabled={!rsvpForm.rsvp_status || rsvpSubmitting}
                className="w-full py-4 rounded-xl font-semibold text-sm tracking-widest uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: primaryColor, color: '#000' }}
              >
                {rsvpSubmitting ? 'Envoi en cours...' : 'Confirmer ma réponse'}
              </button>
            </div>
          )}

          {/* Developer credit */}
          <div className="mt-16 text-center">
            <a
              href="https://github.com/KevinArmache"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-white/20 hover:text-white/40 transition-colors tracking-widest uppercase"
            >
              Developed by Kevin Armache
            </a>
          </div>
        </div>
      </motion.section>
    </div>
  )
}
