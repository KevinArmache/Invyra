import "server-only";

import { prisma } from "@/lib/prisma";
import { buildInvitationEmail } from "@/lib/email/invitation-email";
import { sendMail } from "@/lib/email/transport";
import { directionsPath, stopsOf } from "@/lib/itinerary";
import { toEditableConfig } from "@/lib/templates/validation";
import { templateLook } from "@/lib/templates/look";

/**
 * E-mail d'invitation d'un invité, avec son lien personnel.
 *
 * Hors des server actions : aucune vérification de droits ici. Les appelants
 * la font avant (app/actions/notify.js pour l'hôte) ou n'en ont pas besoin
 * (app/actions/public-link.js, l'invité qui vient de s'inscrire reçoit sa
 * propre invitation). Exportée depuis un fichier « use server », cette
 * fonction deviendrait appelable par n'importe quel navigateur.
 */

/** Événement avec ce qu'il faut pour l'e-mail : modèle et organisateur. */
export const EVENT_FOR_EMAIL = {
  include: {
    templateCopy: { select: { config: true } },
    user: { select: { name: true } },
  },
};

export function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/** Photo d'accueil du modèle de l'événement, s'il en a une. */
function eventImage(event) {
  const config = toEditableConfig(event.templateCopy?.config || event.invitationTemplate);
  return templateLook(config).image || "";
}

export function emailFor(guest, event, baseUrl) {
  const stops = stopsOf(event);
  return buildInvitationEmail({
    guestName: guest.name,
    eventTitle: event.title,
    eventDate: event.eventDate,
    eventTime: event.time,
    eventLocation: event.location,
    stops,
    directionsLink: stops.length ? `${baseUrl}${directionsPath(guest.invitationToken)}` : "",
    dressCode: event.dressCode,
    customMessage: event.customMessage,
    contactPhone: event.contactPhone,
    hostName: event.user?.name,
    imageUrl: eventImage(event),
    inviteLink: `${baseUrl}/invite/${guest.invitationToken}`,
    appUrl: baseUrl,
  });
}

/**
 * Envoie l'invitation à l'adresse de l'invité et note l'envoi.
 *
 * @returns {Promise<{ success: true }>}
 * @throws si l'invité n'a pas d'adresse ou si l'envoi échoue
 */
export async function deliverInvitationEmail(guestId) {
  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    include: { event: EVENT_FOR_EMAIL },
  });
  if (!guest || !guest.email) throw new Error("Invité introuvable ou adresse email manquante");

  const { subject, text, html } = emailFor(guest, guest.event, appUrl());

  try {
    const info = await sendMail({ to: guest.email, subject, text, html });
    console.log("[Email] Envoyé avec succès :", info.messageId);
  } catch (err) {
    console.error("[Email] Erreur d'envoi :", err.message);
    throw new Error(`Échec de l'envoi à ${guest.email} : ${err.message}`);
  }

  await prisma.guest.update({
    where: { id: guestId },
    data: {
      emailSentAt: new Date(),
      invitationSentAt: new Date(),
    },
  });

  return { success: true };
}
