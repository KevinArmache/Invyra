import "server-only";

import { prisma } from "@/lib/prisma";
import { FREE_GUEST_LIMIT } from "@/lib/site";

/**
 * Invités qu'un événement peut encore accueillir, selon l'offre de son
 * propriétaire. Sert aux inscriptions par le lien unique : la personne qui
 * s'inscrit n'a pas de session, c'est donc l'offre du propriétaire qui
 * compte (addGuest, lui, lit celle du compte connecté).
 *
 * Même barème que GUEST_LIMITS dans app/actions/guest.js : 15 invités pour
 * l'offre Découverte, sans limite en premium ou pour un admin.
 */
const GUEST_LIMITS = {
  free: FREE_GUEST_LIMIT,
  premium: Infinity,
};

/** @param {{ plan?: string, role?: string }} owner */
export function guestLimitFor(owner) {
  if (owner?.role === "admin") return Infinity;
  return GUEST_LIMITS[owner?.plan] ?? GUEST_LIMITS.free;
}

/**
 * @param {string} eventId
 * @param {{ plan?: string, role?: string }} owner
 * @returns {Promise<boolean>} vrai s'il reste au moins une place
 */
export async function hasGuestCapacity(eventId, owner) {
  const limit = guestLimitFor(owner);
  if (limit === Infinity) return true;
  const count = await prisma.guest.count({ where: { eventId } });
  return count < limit;
}
