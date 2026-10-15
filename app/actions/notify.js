'use server'

import { prisma } from '@/lib/prisma'
import { getSession, isEventOwnerOrAdmin } from '@/app/actions/auth'
import { getMyCollaboratorRole } from '@/app/actions/collaborator'
import { sendMail } from '@/lib/email/transport'
import {
  EVENT_FOR_EMAIL,
  appUrl as baseAppUrl,
  deliverInvitationEmail,
  emailFor,
} from '@/lib/email/guest-invitation'

// ──────────────────────────────────────────────
// Droits : envoyer une invitation, ou récupérer son lien, est réservé au
// propriétaire de l'événement, à un admin ou à un collaborateur éditeur.
// Ces fonctions sont des server actions, appelables depuis le navigateur :
// sans ce contrôle, n'importe quel compte pourrait envoyer des e-mails ou
// lire le lien personnel d'un invité d'un autre événement.
// ──────────────────────────────────────────────
async function assertCanSendForEvent(eventId) {
  const session = await getSession()
  if (!session) throw new Error('Non authentifié')
  if (await isEventOwnerOrAdmin(eventId)) return
  if ((await getMyCollaboratorRole(eventId)) === 'editor') return
  throw new Error("Vous n'avez pas le droit d'envoyer les invitations de cet événement")
}

// ──────────────────────────────────────────────
// Envoi individuel (1 invité)
// ──────────────────────────────────────────────
export async function sendInvitationEmail(guestId) {
  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    select: { eventId: true, email: true }
  })

  if (!guest || !guest.email) throw new Error('Invité introuvable ou adresse email manquante')
  await assertCanSendForEvent(guest.eventId)

  return deliverInvitationEmail(guestId)
}

// ──────────────────────────────────────────────
// Envoi en masse (bulk) pour un événement
// ──────────────────────────────────────────────
export async function sendBulkInvitationEmails(eventId) {
  await assertCanSendForEvent(eventId)

  const event = await prisma.event.findFirst({
    where: { id: eventId },
    ...EVENT_FOR_EMAIL,
  })
  if (!event) throw new Error('Événement introuvable')

  const guests = await prisma.guest.findMany({
    where: {
      eventId,
      // Un invité inscrit par le lien unique peut ne pas avoir d'e-mail :
      // `not: ""` écarte aussi les NULL (en SQL, NULL <> '' n'est pas vrai).
      email: { not: "" },
      emailSentAt: null, // seulement ceux qui n'ont pas encore reçu l'email
    }
  })

  if (guests.length === 0) {
    return { success: true, sent: 0, message: 'Aucun invité en attente d\'email' }
  }

  const appUrl = baseAppUrl()

  let sent = 0
  const errors = []

  for (const guest of guests) {
    const { subject, text, html } = emailFor(guest, event, appUrl)

    try {
      await sendMail({ to: guest.email, subject, text, html })

      await prisma.guest.update({
        where: { id: guest.id },
        data: {
          emailSentAt: new Date(),
          invitationSentAt: new Date()
        }
      })

      sent++

      // Petit délai pour éviter de surcharger SMTP (rate limiting Gmail)
      await new Promise(r => setTimeout(r, 300))
    } catch (err) {
      console.error(`[Bulk Email] Erreur pour ${guest.email}:`, err.message)
      errors.push({ email: guest.email, error: err.message })
    }
  }

  return {
    success: true,
    sent,
    failed: errors.length,
    errors: errors.length > 0 ? errors : undefined,
    message: `${sent} email(s) envoyé(s) sur ${guests.length} invité(s).`
  }
}

// ──────────────────────────────────────────────
// WhatsApp — Génération du lien
// ──────────────────────────────────────────────
export async function generateWhatsAppLink(guestId) {
  const session = await getSession()
  if (!session) throw new Error('Non authentifié')

  const currentUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { phone: true }
  })

  if (!currentUser?.phone) {
    throw new Error('Veuillez renseigner votre numéro de téléphone dans les paramètres pour pouvoir envoyer des invitations WhatsApp')
  }

  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    include: { event: true }
  })

  if (!guest) throw new Error('Invité introuvable')
  await assertCanSendForEvent(guest.eventId)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const inviteLink = `${appUrl}/invite/${guest.invitationToken}`

  const text = `Bonjour ${guest.name} ! 🎉\n\nTu es invité(e) à *${guest.event.title}*.\n\nClique sur ce lien pour découvrir ton invitation officielle et me confirmer ta présence :\n${inviteLink}`
  const encodedText = encodeURIComponent(text)

  let phone = guest.phone ? guest.phone.replace(/[^\d+]/g, '') : ''
  const link = `https://wa.me/${phone}?text=${encodedText}`

  return { link, guestId }
}

// ──────────────────────────────────────────────
// WhatsApp — Marquer comme envoyé
// ──────────────────────────────────────────────
export async function markWhatsAppSent(guestId) {
  const target = await prisma.guest.findUnique({
    where: { id: guestId },
    select: { eventId: true }
  })
  if (!target) throw new Error('Invité introuvable')
  await assertCanSendForEvent(target.eventId)

  const guest = await prisma.guest.update({
    where: { id: guestId },
    data: {
      whatsappSentAt: new Date(),
      invitationSentAt: new Date()
    }
  })
  return guest
}
