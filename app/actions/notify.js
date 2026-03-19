'use server'

import { prisma } from '@/utils/prisma'
import { getSession } from '@/app/actions/auth'
import nodemailer from 'nodemailer'

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
// Template email HTML (invitation)
// ──────────────────────────────────────────────
function buildInvitationEmail({ guestName, eventTitle, eventDate, eventLocation, inviteLink }) {
  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : ''

  return {
    subject: `🎉 Invitation : ${eventTitle}`,
    text: `Bonjour ${guestName},\n\nVous êtes invité(e) à "${eventTitle}".\n\nDate : ${formattedDate}\nLieu : ${eventLocation || 'À préciser'}\n\nVoir votre invitation : ${inviteLink}`,
    html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation Exclusive</title>
  <!-- Outlook fix -->
  <!--[if mso]>
  <style>
    table {border-collapse:collapse;border-spacing:0;margin:0;}
    div, td {padding:0;}
    div {margin:0 !important;}
  </style>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#161616;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#161616;width:100%;">
    <tr>
      <td align="center" style="padding:40px 15px;">
        
        <!-- Main Container -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1e1e1e;max-width:600px;border-radius:12px;overflow:hidden;border:1px solid #333333;">
          
          <!-- Decorative Header -->
          <tr>
            <td style="background:linear-gradient(90deg, #b38728, #fbf5b7, #fdde5c, #fbf5b7, #b38728);height:6px;"></td>
          </tr>
          
          <!-- Header / Logo Area -->
          <tr>
            <td align="center" style="padding:40px 30px 20px;">
              <h2 style="margin:0;color:#fbf5b7;font-size:14px;letter-spacing:4px;text-transform:uppercase;font-weight:400;">Invitation Officielle</h2>
              <div style="width:40px;height:1px;background-color:#b38728;margin:20px auto;"></div>
              <h1 style="margin:0;color:#ffffff;font-size:32px;font-weight:600;letter-spacing:1px;font-family:'Georgia', serif;">${eventTitle}</h1>
            </td>
          </tr>

          <!-- Welcome Text -->
          <tr>
            <td align="center" style="padding:10px 40px 30px;">
              <p style="margin:0;color:#c0c0c0;font-size:16px;line-height:24px;text-align:center;">
                Cher(e) <strong style="color:#ffffff;">${guestName}</strong>,
              </p>
              <p style="margin:16px 0 0;color:#c0c0c0;font-size:16px;line-height:24px;text-align:center;">
                Nous avons l'honneur de vous convier à un moment unique. Votre présence rendra cet événement encore plus exceptionnel.
              </p>
            </td>
          </tr>

          <!-- Event Details Block -->
          ${(formattedDate || eventLocation) ? `
          <tr>
            <td align="center" style="padding:0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#252525;border-radius:8px;padding:20px;">
                ${formattedDate ? `
                <tr>
                  <td align="center" style="padding-bottom:${eventLocation ? '12px' : '0'};">
                    <p style="margin:0;color:#b38728;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Quand</p>
                    <p style="margin:6px 0 0;color:#ffffff;font-size:15px;font-weight:500;">${formattedDate}</p>
                  </td>
                </tr>` : ''}
                ${eventLocation ? `
                <tr>
                  <td align="center" style="padding-top:${formattedDate ? '12px' : '0'};${formattedDate ? 'border-top:1px solid #333333;' : ''}">
                    <p style="margin:0;color:#b38728;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Où</p>
                    <p style="margin:6px 0 0;color:#ffffff;font-size:15px;font-weight:500;">${eventLocation}</p>
                  </td>
                </tr>` : ''}
              </table>
            </td>
          </tr>` : ''}

          <!-- CTA Area -->
          <tr>
            <td align="center" style="padding:10px 40px 50px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color:#fbf5b7;border-radius:30px;">
                    <a href="${inviteLink}" target="_blank" style="display:inline-block;padding:16px 36px;color:#161616;font-size:15px;font-weight:bold;text-decoration:none;letter-spacing:1px;">Accéder à l'invitation &amp; RSVP</a>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0;color:#888888;font-size:12px;">
                Si le bouton ne s'affiche pas correctement, copiez ce lien :<br>
                <a href="${inviteLink}" style="color:#b38728;text-decoration:underline;">${inviteLink}</a>
              </p>
            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td align="center" style="background-color:#141414;padding:30px 40px;border-top:1px solid #2a2a2a;">
              <p style="margin:0;color:#777777;font-size:12px;line-height:20px;">
                Ceci est une invitation strictement personnelle. Merci de ne pas la transférer.<br>
              </p>
              <table cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
                <tr>
                  <td style="padding:0 10px;">
                    <a href="#" style="color:#b38728;text-decoration:none;font-size:12px;">Support</a>
                  </td>
                  <td style="color:#444444;">|</td>
                  <td style="padding:0 10px;">
                    <a href="https://instagram.com/kevinarmache" style="color:#b38728;text-decoration:none;font-size:12px;">Développé par Kevin Armache</a>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0;color:#555555;font-size:11px;">
                &copy; 2026 Invyra. Tous droits réservés.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`
  }
}

// ──────────────────────────────────────────────
// Envoi individuel (1 invité)
// ──────────────────────────────────────────────
export async function sendInvitationEmail(guestId) {
  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    include: { event: true }
  })

  if (!guest || !guest.email) throw new Error('Invité introuvable ou adresse email manquante')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const inviteLink = `${appUrl}/invite/${guest.invitationToken}`

  const { subject, text, html } = buildInvitationEmail({
    guestName: guest.name,
    eventTitle: guest.event.title,
    eventDate: guest.event.eventDate,
    eventLocation: guest.event.location,
    inviteLink,
  })

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
  const session = await getSession()
  if (!session) throw new Error('Non authentifié')

  const event = await prisma.event.findFirst({
    where: { id: eventId },
  })
  if (!event) throw new Error('Événement introuvable')

  const guests = await prisma.guest.findMany({
    where: {
      eventId,
      email: { not: null },
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
    const inviteLink = `${appUrl}/invite/${guest.invitationToken}`
    const { subject, text, html } = buildInvitationEmail({
      guestName: guest.name,
      eventTitle: event.title,
      eventDate: event.eventDate,
      eventLocation: event.location,
      inviteLink,
    })

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
  const guest = await prisma.guest.update({
    where: { id: guestId },
    data: {
      whatsappSentAt: new Date(),
      invitationSentAt: new Date()
    }
  })
  return guest
}
