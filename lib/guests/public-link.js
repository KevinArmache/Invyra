import "server-only";

import { customAlphabet } from "nanoid";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/pdf/filename";
import { SITE_URL } from "@/lib/site";
import { stopsOf } from "@/lib/itinerary";
import { PUBLIC_MAX_SEATS } from "@/lib/tickets";

/**
 * Lien unique d'une invitation : /join/<slug>.
 *
 * Le slug commence par le titre de l'événement, lisible dans l'aperçu
 * WhatsApp, et finit par un suffixe aléatoire qui le rend impossible à
 * deviner. Régénérer le lien change le suffixe : l'ancien cesse de
 * fonctionner.
 */

/** Suffixe sans caractères ambigus (0/O, 1/l/I), pour un lien recopié à la main. */
const suffix = customAlphabet(
  "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ",
  10,
);

export function newPublicToken(title) {
  return `${slugify(title, "invitation").slice(0, 40).replace(/-+$/, "")}-${suffix()}`;
}

export function publicLinkUrl(token) {
  return token ? `${SITE_URL}/join/${token}` : null;
}

/**
 * Cookie posé après l'inscription, qui contient le jeton personnel de
 * l'invité : revenu sur le lien unique, il retrouve son invitation au lieu
 * de s'inscrire une seconde fois.
 */
export function joinCookieName(eventId) {
  return `inv_join_${eventId}`;
}

/**
 * Événement d'un lien unique actif, avec ce qu'en montre la page
 * d'inscription (même forme que l'événement de getInvitationByToken).
 *
 * @returns {Promise<null | { id: string, owner: object, maxSeats: number, event: object }>}
 *   null pour un lien inconnu, régénéré ou désactivé
 */
export async function findPublicEvent(slug) {
  if (typeof slug !== "string" || slug.length > 80) return null;

  const event = await prisma.event.findUnique({
    where: { publicToken: slug },
    include: {
      templateCopy: { select: { config: true } },
      user: { select: { plan: true, role: true } },
    },
  });
  if (!event || !event.publicLinkEnabled) return null;

  return {
    id: event.id,
    owner: event.user,
    maxSeats: Math.max(1, Math.min(event.publicMaxSeats, PUBLIC_MAX_SEATS)),
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      eventDate: event.eventDate,
      date: event.eventDate,
      location: event.location,
      time: event.time,
      dressCode: event.dressCode,
      contactPhone: event.contactPhone,
      customMessage: event.customMessage,
      hasDirections: stopsOf(event).length > 0,
      invitationTemplate: event.templateCopy?.config || event.invitationTemplate,
    },
  };
}
