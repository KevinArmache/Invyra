'use server'

import { after } from 'next/server'

import { prisma } from '@/lib/prisma'
import { sendMail } from '@/lib/email/transport'
import { buildTicketEmail, TICKET_QR_CID } from '@/lib/email/ticket-email'
import { ticketQrPng, ticketQrSvg } from '@/lib/qr'
import { directionsPath, stopsOf } from '@/lib/itinerary'
import { SITE_URL } from '@/lib/site'
import {
  clampSeats,
  expectedPeople,
  formatTicketCode,
  newTicketCode,
} from '@/lib/tickets'

const RSVP_STATUSES = ['confirmed', 'declined', 'maybe']

/** Longueurs maximales des textes saisis par l'invité. */
const DIETARY_MAX = 200
const NOTES_MAX = 500

/** Texte libre d'un invité : fins de ligne unifiées, espaces retirés, longueur bornée. */
function cleanText(value, max) {
  return String(value ?? '').replace(/\r\n?/g, '\n').trim().slice(0, max)
}

/** Ce que la page de l'invitation sait de l'invité (et transmet au modèle). */
function guestView(guest) {
  return {
    id: guest.id,
    name: guest.name,
    email: guest.email,
    rsvp_status: guest.rsvpStatus,
    dietary_restrictions: guest.dietaryRestrictions,
    notes: guest.notes,
    seats: guest.seats,
    attending_count: guest.attendingCount,
    has_ticket: guest.rsvpStatus === 'confirmed',
  }
}

/**
 * @param {string} token
 * @param {object} [options]
 * @param {boolean} [options.markViewed=true]  faux pour les robots d'aperçu de
 *   lien (WhatsApp, iMessage…) : leur passage ne veut pas dire que l'invité a
 *   ouvert son invitation.
 */
export async function getInvitationByToken(token, { markViewed = true } = {}) {
  // Une erreur de base (réveil de Neon, connexion coupée) remonte telle
  // quelle : la page doit pouvoir la distinguer d'un jeton inconnu, sans quoi
  // l'invité lirait « Lien invalide » pour un lien parfaitement valide.
  const guest = await prisma.guest.findUnique({
    where: { invitationToken: token },
    include: {
      event: {
        include: {
          templateCopy: {
            select: { config: true },
          },
        },
      },
    }
  })

  // Jeton inconnu ou révoqué.
  if (!guest) return null

  // Première ouverture : on la note, sans jamais bloquer l'affichage de
  // l'invitation si l'écriture échoue.
  if (markViewed && !guest.invitationViewedAt) {
    try {
      await prisma.guest.update({
        where: { id: guest.id },
        data: { invitationViewedAt: new Date() }
      })
    } catch (error) {
      console.error('[invite] Ouverture non enregistrée :', error.message)
    }
  }

  return {
    guest: guestView(guest),
    event: {
      id: guest.event.id,
      title: guest.event.title,
      description: guest.event.description,
      eventDate: guest.event.eventDate,
      date: guest.event.eventDate,
      location: guest.event.location,
      time: guest.event.time,
      dressCode: guest.event.dressCode,
      contactPhone: guest.event.contactPhone,
      customMessage: guest.event.customMessage,
      guestbookEnabled: guest.event.guestbookEnabled,
      photosEnabled: guest.event.photosEnabled,
      hasDirections: stopsOf(guest.event).length > 0,
      invitationTemplate: guest.event.templateCopy?.config || guest.event.invitationTemplate
    }
  }
}

/**
 * Réponse envoyée par le modèle (bouton « Je confirme », etc.).
 *
 * Les modèles transmettent aussi régime et notes, le plus souvent vides :
 * une valeur vide n'efface pas ce que l'invité a précisé dans le panneau de
 * réponse (saveRsvpDetails). `plus_one` n'est plus lu, les places sont
 * portées par `seats`.
 */
export async function updateRsvpStatus(token, data) {
  const status = data?.rsvp_status
  if (!RSVP_STATUSES.includes(status)) throw new Error('Invalid RSVP status')

  try {
    const current = await prisma.guest.findUnique({
      where: { invitationToken: token },
      select: { id: true, rsvpStatus: true, ticketCode: true },
    })
    if (!current) throw new Error('Guest not found')

    const dietary = cleanText(data.dietary_restrictions, DIETARY_MAX)
    const notes = cleanText(data.notes, NOTES_MAX)

    const guest = await prisma.guest.update({
      where: { id: current.id },
      data: {
        rsvpStatus: status,
        ...(dietary && { dietaryRestrictions: dietary }),
        ...(notes && { notes }),
        // Normalement déjà posé à la création de l'invité.
        ...(status === 'confirmed' && !current.ticketCode && { ticketCode: newTicketCode() }),
        rsvpRespondedAt: new Date()
      }
    })

    // Le billet part par e-mail quand l'invité confirme, une fois la réponse
    // renvoyée : l'envoi SMTP ne retarde pas l'invitation.
    if (status === 'confirmed' && current.rsvpStatus !== 'confirmed') {
      after(() => sendTicketEmail(guest.id))
    }

    return { success: true, guest: guestView(guest) }
  } catch (error) {
    console.error('Error updating RSVP:', error)
    throw new Error('Failed to update RSVP')
  }
}

/**
 * Précisions de l'invité après sa réponse (panneau de réponse) : nombre de
 * personnes (de 1 à ses places, seulement s'il a confirmé), régime et mot
 * pour les hôtes. Un champ absent n'est pas modifié.
 *
 * @returns {{ success: true, guest: object, ticket: { code: string, svg: string, people: number } | null }}
 */
export async function saveRsvpDetails(token, details = {}) {
  const current = await prisma.guest.findUnique({
    where: { invitationToken: token },
    select: { id: true, seats: true, rsvpStatus: true },
  })
  if (!current) throw new Error('Invitation introuvable')

  const data = {}
  if (details.dietaryRestrictions !== undefined) {
    data.dietaryRestrictions = cleanText(details.dietaryRestrictions, DIETARY_MAX) || null
  }
  if (details.notes !== undefined) {
    data.notes = cleanText(details.notes, NOTES_MAX) || null
  }
  if (current.rsvpStatus === 'confirmed' && details.attendingCount != null) {
    data.attendingCount = clampSeats(details.attendingCount, current.seats)
  }

  const guest = await prisma.guest.update({ where: { id: current.id }, data })

  const ticket =
    guest.rsvpStatus === 'confirmed' && guest.ticketCode
      ? {
          code: formatTicketCode(guest.ticketCode),
          svg: await ticketQrSvg(guest.ticketCode),
          people: expectedPeople(guest),
        }
      : null

  return { success: true, guest: guestView(guest), ticket }
}

/**
 * Billet d'un invité, pour sa page et son PDF. Ne compte pas comme une
 * ouverture de l'invitation.
 *
 * @returns {Promise<null | { guest: object, event: object }>}  null pour un
 *   jeton inconnu
 */
export async function getTicketByToken(token) {
  if (typeof token !== 'string' || token.length > 64) return null

  const guest = await prisma.guest.findUnique({
    where: { invitationToken: token },
    select: {
      id: true,
      name: true,
      seats: true,
      attendingCount: true,
      rsvpStatus: true,
      ticketCode: true,
      checkedInAt: true,
      event: {
        select: {
          title: true,
          eventDate: true,
          time: true,
          location: true,
          itinerary: true,
          contactPhone: true,
          guestbookEnabled: true,
          photosEnabled: true,
          invitationTemplate: true,
          templateCopy: { select: { config: true } },
        },
      },
    },
  })
  if (!guest) return null

  const confirmed = guest.rsvpStatus === 'confirmed'
  let code = guest.ticketCode
  if (confirmed && !code) {
    code = newTicketCode()
    await prisma.guest.update({ where: { id: guest.id }, data: { ticketCode: code } })
  }

  const { event } = guest
  return {
    guest: {
      name: guest.name,
      confirmed,
      people: expectedPeople(guest),
      ticketCode: confirmed ? code : null,
      checkedInAt: guest.checkedInAt,
    },
    event: {
      title: event.title,
      eventDate: event.eventDate,
      time: event.time,
      location: event.location,
      stops: stopsOf(event),
      contactPhone: event.contactPhone,
      guestbookEnabled: event.guestbookEnabled,
      photosEnabled: event.photosEnabled,
      invitationTemplate: event.templateCopy?.config || event.invitationTemplate,
    },
  }
}

/**
 * Itinéraire de l'événement, pour la page d'itinéraire d'un invité. Ne
 * compte pas comme une ouverture de l'invitation.
 *
 * @returns {Promise<null | { event: object }>}  null pour un jeton inconnu
 */
export async function getDirectionsByToken(token) {
  if (typeof token !== 'string' || token.length > 64) return null

  const guest = await prisma.guest.findUnique({
    where: { invitationToken: token },
    select: {
      event: {
        select: {
          title: true,
          eventDate: true,
          time: true,
          location: true,
          itinerary: true,
          invitationTemplate: true,
          templateCopy: { select: { config: true } },
        },
      },
    },
  })
  if (!guest) return null

  const { event } = guest
  return {
    event: {
      title: event.title,
      eventDate: event.eventDate,
      time: event.time,
      stops: stopsOf(event),
      invitationTemplate: event.templateCopy?.config || event.invitationTemplate,
    },
  }
}

/**
 * E-mail du billet. Lancé après la réponse (voir updateRsvpStatus) : une
 * erreur est journalisée, jamais renvoyée à l'invité.
 */
async function sendTicketEmail(guestId) {
  try {
    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
      select: {
        name: true,
        email: true,
        rsvpStatus: true,
        ticketCode: true,
        invitationToken: true,
        event: {
          select: { title: true, eventDate: true, time: true, location: true, itinerary: true },
        },
      },
    })
    if (!guest?.email || !guest.ticketCode || guest.rsvpStatus !== 'confirmed') return

    const stops = stopsOf(guest.event)

    const { subject, text, html } = buildTicketEmail({
      guestName: guest.name,
      eventTitle: guest.event.title,
      eventDate: guest.event.eventDate,
      eventTime: guest.event.time,
      eventLocation: guest.event.location,
      stops,
      directionsLink: stops.length ? `${SITE_URL}${directionsPath(guest.invitationToken)}` : '',
      ticketCode: guest.ticketCode,
      ticketLink: `${SITE_URL}/invite/${guest.invitationToken}/ticket`,
      appUrl: SITE_URL,
    })

    await sendMail({
      to: guest.email,
      subject,
      text,
      html,
      attachments: [
        {
          filename: 'billet.png',
          content: await ticketQrPng(guest.ticketCode),
          contentType: 'image/png',
          cid: TICKET_QR_CID,
        },
      ],
    })
  } catch (error) {
    console.error('[ticket] E-mail du billet non envoyé :', error.message)
  }
}
