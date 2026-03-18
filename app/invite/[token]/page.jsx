'use client'

import { useState, useEffect, use, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, HelpCircle, MailOpen } from 'lucide-react'
import InvitationPreview from '@/components/invitation/InvitationPreview'
import { getInvitationByToken, updateRsvpStatus } from '@/app/actions/invitation'
import { toast } from 'sonner'

export default function InvitationPage({ params }) {
  const { token } = use(params)
  const [invitation, setInvitation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [showEnvelope, setShowEnvelope] = useState(true)

  useEffect(() => {
    async function fetchInvitation() {
      try {
        const data = await getInvitationByToken(token)
        setInvitation(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchInvitation()
  }, [token])

  useEffect(() => {
    function handleMessage(e) {
      if (e.data?.type === 'RSVP_SUBMIT') {
        handleRSVPSubmit(e.data.data)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [token])

  async function handleRSVPSubmit(formData) {
    if (!formData.rsvp_status) return
    try {
      await updateRsvpStatus(token, formData)
      
      // Mettre à jour l'UI localement (le parent) pour réagir aux props,
      // bien que visuellement l'iframe s'en charge elle-même.
      setInvitation(prev => ({
        ...prev,
        guest: { ...prev.guest, ...formData }
      }))
      
      // On retire l'alerte pour laisser l'iframe afficher son design 100% custom !
      // L'utilisateur ne sera plus interrompu par un bloc JS du navigateur.
    } catch (err) {
      console.error('RSVP failed:', err)
      toast.error("Une erreur est survenue lors de l'envoi de votre réponse.")
    }
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
  const template = event.invitationTemplate

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

      {/* ── Invitation Template (plein écran) ── */}
      <motion.section
        className="fixed inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: showEnvelope ? 0 : 1 }}
        transition={{ duration: 0.8, delay: 0.15 }}
        style={{ pointerEvents: showEnvelope ? 'none' : 'auto' }}
      >
        {template ? (
          <InvitationPreview
            template={template}
            event={event}
            guestName={guest.name}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-white/50">
            <p className="text-lg font-semibold mb-2">Invitation en cours de préparation</p>
            <p className="text-sm">L'organisateur n'a pas encore configuré le modèle de cette invitation.</p>
          </div>
        )}
      </motion.section>
    </div>
  )
}
