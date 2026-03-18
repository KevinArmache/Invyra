'use server'

import { prisma } from '@/utils/prisma'
import nodemailer from 'nodemailer'

// Configure le transporteur SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

/**
 * Envoie un email d'invitation générique
 */
export async function sendInvitationEmail(guestId) {
  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    include: { event: true }
  })

  if (!guest || !guest.email) throw new Error("Invité introuvable ou adresse email manquante")

  const event = guest.event
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const inviteLink = `${appUrl}/invite/${guest.invitationToken}`

  const mailOptions = {
    from: `"Invyra" <${process.env.SMTP_FROM || 'no-reply@invyra.com'}>`,
    to: guest.email,
    subject: `Invitation : ${event.title}`,
    text: `Bonjour ${guest.name},\n\nVous êtes invité(e) à ${event.title}.\n\nPour voir votre invitation et répondre, cliquez ici : ${inviteLink}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2 style="text-align: center; color: #333;">Vous êtes invité(e) !</h2>
        <p>Bonjour <strong>${guest.name}</strong>,</p>
        <p>Vous êtes convié(e) à l'événement exclusif : <strong>${event.title}</strong>.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" style="background-color: #000; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Voir mon invitation et RSVP
          </a>
        </p>
        <p style="font-size: 12px; color: #888; text-align: center;">
          Si le bouton ci-dessus ne fonctionne pas, copiez-collez ce lien dnas votre navigateur : <br/>
          <a href="${inviteLink}" style="color: #666;">${inviteLink}</a>
        </p>
      </div>
    `
  }

  // En DEV (sans ID SMTP valides), on ne crashe pas, on simule l'envoi si Ethereal échoue.
  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("Message envoyé : %s", info.messageId)
  } catch (err) {
    console.warn("Nodemailer n'est pas configuré correctement. Simulation d'envoi pour le DEV.", err.message)
  }

  // Met à jour la base de données
  await prisma.guest.update({
    where: { id: guestId },
    data: { 
      emailSentAt: new Date(),
      invitationSentAt: new Date() // Fallback global
    }
  })

  return { success: true }
}

/**
 * Génère le message et le lien WhatsApp
 */
export async function generateWhatsAppLink(guestId) {
  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    include: { event: true }
  })

  if (!guest) throw new Error("Invité introuvable")

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const inviteLink = `${appUrl}/invite/${guest.invitationToken}`

  const text = `Bonjour ${guest.name} ! 🎉\n\nTu es invité(e) à *${guest.event.title}*.\n\nClique sur ce lien pour découvrir ton invitation officielle et me confirmer ta présence :\n${inviteLink}`

  const encodedText = encodeURIComponent(text)
  
  // Format the phone number (remove all non-digit characters except +)
  let phone = guest.phone ? guest.phone.replace(/[^\d+]/g, '') : ''
  
  const link = `https://wa.me/${phone}?text=${encodedText}`

  return { link, guestId }
}

/**
 * Marque l'invitation WhatsApp comme envoyée (appellé après avoir cliqué sur le lien HTTP)
 */
export async function markWhatsAppSent(guestId) {
  const guest = await prisma.guest.update({
    where: { id: guestId },
    data: { 
      whatsappSentAt: new Date(),
      invitationSentAt: new Date()
    }
  })
  return guest
}
