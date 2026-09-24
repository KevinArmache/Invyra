'use server'

import { prisma } from '@/utils/prisma'
import { getSession, isEventOwnerOrAdmin } from '@/app/actions/auth'
import { getMyCollaboratorRole } from '@/app/actions/collaborator'
import { buildInvitationEmail } from '@/lib/email/invitation-email'
import { toEditableConfig } from '@/lib/invitation/document'
import nodemailer from 'nodemailer'

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

/** Événement avec ce qu'il faut pour l'e-mail : modèle et organisateur. */
const EVENT_FOR_EMAIL = {
  include: {
    templateCopy: { select: { config: true } },
    user: { select: { name: true } },
  },
}

/** Photo d'accueil du modèle de l'événement, s'il en a une. */
function eventImage(event) {
  const config = toEditableConfig(event.templateCopy?.config || event.invitationTemplate)
  return config?.type === 'theme' ? config.content.hero?.image || '' : ''
}

function emailFor(guest, event, appUrl) {
  return buildInvitationEmail({
    guestName: guest.name,
    eventTitle: event.title,
    eventDate: event.eventDate,
    eventTime: event.time,
    eventLocation: event.location,
    dressCode: event.dressCode,
    customMessage: event.customMessage,
    hostName: event.user?.name,
    imageUrl: eventImage(event),
    inviteLink: `${appUrl}/invite/${guest.invitationToken}`,
    appUrl,
  })
}

// ──────────────────────────────────────────────
// Transporteur SMTP Gmail (SSL sur le port 465)
// ──────────────────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: parseInt(process.env.SMTP_PORT || '465') === 465, // true pour 465 (SSL), false pour 587 (TLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

// ──────────────────────────────────────────────
// Envoi individuel (1 invité)
// ──────────────────────────────────────────────
export async function sendInvitationEmail(guestId) {
  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    include: { event: EVENT_FOR_EMAIL }
  })

  if (!guest || !guest.email) throw new Error('Invité introuvable ou adresse email manquante')
  await assertCanSendForEvent(guest.eventId)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const { subject, text, html } = emailFor(guest, guest.event, appUrl)

  const transporter = createTransporter()

  try {
    const info = await transporter.sendMail({
      from: `"Invyra" <${process.env.SMTP_USER}>`,
      to: guest.email,
      subject,
      text,
      html,
    })
    console.log('[Email] Envoyé avec succès :', info.messageId)
  } catch (err) {
    console.error('[Email] Erreur d\'envoi :', err.message)
    throw new Error(`Échec de l'envoi à ${guest.email} : ${err.message}`)
  }

  await prisma.guest.update({
    where: { id: guestId },
    data: {
      emailSentAt: new Date(),
      invitationSentAt: new Date()
    }
  })

  return { success: true }
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
      // `email` est obligatoire dans le schéma : on écarte seulement les vides.
      email: { not: "" },
      emailSentAt: null, // seulement ceux qui n'ont pas encore reçu l'email
    }
  })

  if (guests.length === 0) {
    return { success: true, sent: 0, message: 'Aucun invité en attente d\'email' }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const transporter = createTransporter()

  let sent = 0
  const errors = []

  for (const guest of guests) {
    const { subject, text, html } = emailFor(guest, event, appUrl)

    try {
      await transporter.sendMail({
        from: `"Invyra" <${process.env.SMTP_USER}>`,
        to: guest.email,
        subject,
        text,
        html,
      })

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
