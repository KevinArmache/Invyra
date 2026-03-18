'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'
import { nanoid } from 'nanoid'
import { Resend } from 'resend'

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

export async function sendInvitationEmail(guestId) {
  try {
    const user = await getSession()
    if (!user) throw new Error('Unauthorized')

    if (!process.env.RESEND_API_KEY) {
      throw new Error('Email service not configured. Please add RESEND_API_KEY to environment variables.')
    }

    const guest = await prisma.guest.findFirst({
      where: { 
        id: guestId,
        event: { userId: user.userId }
      },
      include: {
        event: {
          include: { user: true }
        }
      }
    })

    if (!guest) throw new Error('Guest not found')

    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
    const invitationUrl = `${baseUrl}/invite/${guest.invitationToken}`

    const resend = new Resend(process.env.RESEND_API_KEY)

    const eventDate = guest.event.eventDate 
      ? new Date(guest.event.eventDate).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })
      : 'Date TBD'

    const { data: resendData, error } = await resend.emails.send({
      from: 'Invyra <invitations@resend.dev>',
      to: guest.email,
      subject: `You're Invited: ${guest.event.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin: 0; padding: 0; background-color: #1a1a2e; font-family: sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background: #232338; border-radius: 16px; border: 1px solid #3a3a52;">
                <tr><td align="center" style="padding: 40px 40px 20px;">
                  <h1 style="margin: 0; color: #d4af37; font-size: 28px;">Invyra</h1>
                </td></tr>
                <tr><td style="padding: 20px 40px;">
                  <h2 style="color: #fff; text-align: center;">You're Invited!</h2>
                  <p style="color: #a0a0b0; text-align: center;">Dear ${guest.name},</p>
                  <p style="color: #a0a0b0; text-align: center;">${guest.event.user.name || 'Your host'} has invited you to a special event.</p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(212,175,55,0.1); border: 1px solid rgba(212,175,55,0.3); border-radius: 12px; margin-bottom: 30px;">
                    <tr><td style="padding: 24px;">
                      <h3 style="color: #d4af37; text-align: center;">${guest.event.title}</h3>
                      <p style="color: #fff; text-align: center;">📅 ${eventDate}</p>
                      ${guest.event.location ? `<p style="color: #a0a0b0; text-align: center;">📍 ${guest.event.location}</p>` : ''}
                      ${guest.event.customMessage ? `<p style="color: #a0a0b0; text-align: center; font-style: italic;">"${guest.event.customMessage}"</p>` : ''}
                    </td></tr>
                  </table>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr><td align="center" style="padding: 10px 0 30px;">
                      <a href="${invitationUrl}" style="background: linear-gradient(135deg, #d4af37, #b8860b); color: #1a1a2e; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold;">View Your Invitation</a>
                    </td></tr>
                  </table>
                </td></tr>
                <tr><td style="padding: 30px 40px; border-top: 1px solid #3a3a52;">
                  <p style="color: #6a6a7a; font-size: 12px; text-align: center;">This invitation was sent via Invyra</p>
                  <p style="color: #4a4a5a; font-size: 11px; text-align: center;">If you can't click the button, copy this link: ${invitationUrl}</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body></html>
      `
    })

    if (error) throw new Error('Failed to send email')

    await prisma.guest.update({
      where: { id: guestId },
      data: { invitationSentAt: new Date() }
    })

    return { 
      success: true, 
      message: 'Invitation sent successfully',
      emailId: resendData.id
    }
  } catch (error) {
    console.error('Send invitation error:', error)
    throw new Error(error.message || 'Failed to send invitation')
  }
}
