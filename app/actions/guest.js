'use server'

import { prisma } from '@/utils/prisma'
import { getSession } from '@/app/actions/auth'
import { nanoid } from 'nanoid'
import { sendInvitationEmail } from './notify'

export async function getGuests(eventId) {
  try {
    const user = await getSession()
    if (!user) throw new Error('Unauthorized')

    const event = await prisma.event.findFirst({
      where: { id: eventId, userId: user.userId }
    })
    if (!event) throw new Error('Event not found')

    const guests = await prisma.guest.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' }
    })

    return guests
  } catch (error) {
    console.error('Error fetching guests:', error)
    throw new Error('Failed to fetch guests')
  }
}

export async function addGuest(eventId, data) {
  try {
    const user = await getSession()
    if (!user) throw new Error('Unauthorized')

    const event = await prisma.event.findFirst({
      where: { id: eventId, userId: user.userId }
    })
    if (!event) throw new Error('Event not found')

    const { name, email, phone, dietary_restrictions, plus_one, notes } = data
    if (!name || !email) throw new Error('Name and email are required')

    const existing = await prisma.guest.findFirst({
      where: { eventId, email }
    })
    if (existing) throw new Error('Guest with this email already exists')

    const guest = await prisma.guest.create({
      data: {
        eventId,
        name,
        email,
        phone: phone || null,
        dietaryRestrictions: dietary_restrictions || null,
        plusOne: plus_one || false,
        notes: notes || null,
        invitationToken: nanoid(32)
      }
    })

    // Auto-send if enabled
    if (event.autoSend) {
      if (email) {
        // Envoi asynchrone pour ne pas bloquer l'interface
        sendInvitationEmail(guest.id).catch(e => console.error("Auto-send email failed:", e))
      }
    }

    return guest
  } catch (error) {
    console.error('Error adding guest:', error)
    throw new Error(error.message || 'Failed to add guest')
  }
}

export async function updateGuest(guestId, data) {
  try {
    const user = await getSession()
    if (!user) throw new Error('Unauthorized')

    const guest = await prisma.guest.findFirst({
      where: {
        id: guestId,
        event: { userId: user.userId }
      }
    })
    if (!guest) throw new Error('Guest not found')

    const updated = await prisma.guest.update({
      where: { id: guestId },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        email: data.email !== undefined ? data.email : undefined,
        phone: data.phone !== undefined ? data.phone : undefined,
        dietaryRestrictions: data.dietary_restrictions !== undefined ? data.dietary_restrictions : undefined,
        plusOne: data.plus_one !== undefined ? data.plus_one : undefined,
        notes: data.notes !== undefined ? data.notes : undefined,
        rsvpStatus: data.rsvp_status !== undefined ? data.rsvp_status : undefined,
        rsvpRespondedAt: (data.rsvp_status !== undefined && guest.rsvpStatus !== data.rsvp_status) ? new Date() : undefined,
      }
    })

    return updated
  } catch (error) {
    console.error('Error updating guest:', error)
    throw new Error('Failed to update guest')
  }
}

export async function deleteGuest(guestId) {
  try {
    const user = await getSession()
    if (!user) throw new Error('Unauthorized')

    const guest = await prisma.guest.findFirst({
      where: {
        id: guestId,
        event: { userId: user.userId }
      }
    })
    if (!guest) throw new Error('Guest not found')

    await prisma.guest.delete({
      where: { id: guestId }
    })

    return { success: true }
  } catch (error) {
    console.error('Error deleting guest:', error)
    throw new Error('Failed to delete guest')
  }
}

// Suppression de l'ancienne fonction locale sendInvitationEmail (remplacée par celle de notify.js)

// ──────────────────────────────────────────────
// Send Bulk Invitations
// ──────────────────────────────────────────────
export async function sendBulkInvitations(eventId) {
  try {
    const user = await getSession()
    if (!user) throw new Error('Unauthorized')

    const event = await prisma.event.findFirst({
      where: { id: eventId, userId: user.userId },
      include: { guests: true }
    })
    if (!event) throw new Error('Event not found')

    const unsentGuests = event.guests.filter(g => !g.invitationSentAt)
    let sentCount = 0

    // Envoi via notify.js
    for (const guest of unsentGuests) {
      try {
        await sendInvitationEmail(guest.id)
        sentCount++
      } catch (e) {
        console.error(`Failed to send email to ${guest.email}`, e)
      }
    }

    return { success: true, sentCount, message: `${sentCount} invitations envoyées avec succès.` }
  } catch (error) {
    console.error('Bulk send error:', error)
    throw new Error(error.message || 'Failed to send bulk invitations')
  }
}
