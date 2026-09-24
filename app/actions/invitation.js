'use server'

import { prisma } from '@/lib/prisma'

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
    guest: {
      id: guest.id,
      name: guest.name,
      email: guest.email,
      rsvp_status: guest.rsvpStatus,
      dietary_restrictions: guest.dietaryRestrictions,
      plus_one: guest.plusOne,
      notes: guest.notes
    },
    event: {
      id: guest.event.id,
      title: guest.event.title,
      description: guest.event.description,
      eventDate: guest.event.eventDate,
      date: guest.event.eventDate,
      location: guest.event.location,
      time: guest.event.time,
      dressCode: guest.event.dressCode,
      customMessage: guest.event.customMessage,
      invitationTemplate: guest.event.templateCopy?.config || guest.event.invitationTemplate
    }
  }
}

export async function updateRsvpStatus(token, data) {
  try {
    const { rsvp_status, dietary_restrictions, plus_one, notes } = data

    if (!rsvp_status || !['confirmed', 'declined', 'maybe'].includes(rsvp_status)) {
      throw new Error('Invalid RSVP status')
    }

    const guest = await prisma.guest.update({
      where: { invitationToken: token },
      data: {
        rsvpStatus: rsvp_status,
        dietaryRestrictions: dietary_restrictions !== undefined ? dietary_restrictions : undefined,
        plusOne: plus_one !== undefined ? plus_one : undefined,
        notes: notes !== undefined ? notes : undefined,
        rsvpRespondedAt: new Date()
      }
    })

    return {
      success: true,
      guest: { id: guest.id, name: guest.name, rsvp_status: guest.rsvpStatus }
    }
  } catch (error) {
    console.error('Error updating RSVP:', error)
    throw new Error('Failed to update RSVP')
  }
}
