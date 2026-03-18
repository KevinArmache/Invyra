'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function getEvents() {
  try {
    const user = await getSession()
    if (!user) throw new Error('Unauthorized')

    const events = await prisma.event.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { guests: true }
        },
        guests: {
          select: { rsvpStatus: true, invitationViewedAt: true }
        }
      }
    })

    return events.map(e => ({
      ...e,
      guest_count: e._count.guests,
      confirmed_count: e.guests.filter(g => g.rsvpStatus === 'confirmed').length,
      viewed_count: e.guests.filter(g => g.invitationViewedAt !== null).length,
      guests: undefined
    }))
  } catch (error) {
    console.error('Error fetching events:', error)
    throw new Error('Failed to fetch events')
  }
}

export async function getEventById(id) {
  try {
    const user = await getSession()
    if (!user) throw new Error('Unauthorized')

    const event = await prisma.event.findFirst({
      where: { id, userId: user.userId },
      include: {
        _count: {
          select: { guests: true }
        },
        guests: {
          select: { rsvpStatus: true, invitationViewedAt: true }
        }
      }
    })

    if (!event) throw new Error('Event not found')

    return {
      ...event,
      guest_count: event._count.guests,
      confirmed_count: event.guests.filter(g => g.rsvpStatus === 'confirmed').length,
      declined_count: event.guests.filter(g => g.rsvpStatus === 'declined').length,
      viewed_count: event.guests.filter(g => g.invitationViewedAt !== null).length,
      guests: undefined
    }
  } catch (error) {
    console.error('Error fetching event:', error)
    throw new Error('Failed to fetch event')
  }
}

export async function createEvent(data) {
  try {
    const user = await getSession()
    if (!user) throw new Error('Unauthorized')

    const { title, description, event_date, location, theme, custom_message } = data
    if (!title) throw new Error('Title is required')

    const event = await prisma.event.create({
      data: {
        userId: user.userId,
        title,
        description: description || null,
        eventDate: event_date ? new Date(event_date) : null,
        location: location || null,
        theme: theme || 'elegant',
        customMessage: custom_message || null,
        status: 'draft'
      }
    })

    return event
  } catch (error) {
    console.error('Error creating event:', error)
    throw new Error('Failed to create event')
  }
}

export async function updateEvent(id, data) {
  try {
    const user = await getSession()
    if (!user) throw new Error('Unauthorized')

    const existing = await prisma.event.findFirst({
      where: { id, userId: user.userId }
    })
    if (!existing) throw new Error('Event not found')

    const updated = await prisma.event.update({
      where: { id },
      data: {
        title: data.title !== undefined ? data.title : undefined,
        description: data.description !== undefined ? data.description : undefined,
        eventDate: data.event_date ? new Date(data.event_date) : undefined,
        location: data.location !== undefined ? data.location : undefined,
        theme: data.theme !== undefined ? data.theme : undefined,
        customMessage: data.custom_message !== undefined ? data.custom_message : undefined,
        animationConfig: data.animation_config !== undefined ? data.animation_config : undefined,
        status: data.status !== undefined ? data.status : undefined,
      }
    })

    return updated
  } catch (error) {
    console.error('Error updating event:', error)
    throw new Error('Failed to update event')
  }
}

export async function deleteEvent(id) {
  try {
    const user = await getSession()
    if (!user) throw new Error('Unauthorized')

    const existing = await prisma.event.findFirst({
      where: { id, userId: user.userId }
    })
    if (!existing) throw new Error('Event not found')

    await prisma.event.delete({
      where: { id }
    })

    return { success: true }
  } catch (error) {
    console.error('Error deleting event:', error)
    throw new Error('Failed to delete event')
  }
}
