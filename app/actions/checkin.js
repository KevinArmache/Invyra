"use server";

import { nanoid } from "nanoid";

import { prisma } from "@/lib/prisma";
import { getSession, isEventOwnerOrAdmin } from "@/app/actions/auth";
import { getMyCollaboratorRole } from "@/app/actions/collaborator";
import { SITE_URL } from "@/lib/site";
import {
  MAX_SEATS,
  clampSeats,
  expectedPeople,
  parseScannedCode,
} from "@/lib/tickets";

/**
 * Accueil des invités le jour J.
 *
 * L'hôte crée un lien secret (/check-in/<jeton>) qu'il confie à l'équipe
 * d'accueil : elle scanne les billets sans compte Invyra. Régénérer le lien
 * coupe l'accès de l'ancien.
 *
 * Côté équipe, chaque action reçoit ce jeton et retrouve l'événement à chaque
 * appel : un lien régénéré cesse de fonctionner aussitôt, même sur une page
 * déjà ouverte.
 */

// ─── Côté hôte ──────────────────────────────────────────────────────────────

async function canManage(eventId) {
  const session = await getSession();
  if (!session) return false;
  if (await isEventOwnerOrAdmin(eventId)) return true;
  return (await getMyCollaboratorRole(eventId)) === "editor";
}

function checkInUrl(token) {
  return token ? `${SITE_URL}/check-in/${token}` : null;
}

/**
 * Lien d'accueil de l'événement, s'il existe. Un collaborateur en lecture
 * seule ne le voit pas (`canManage: false`).
 *
 * @returns {Promise<{ canManage: boolean, url: string | null }>}
 */
export async function getCheckInLink(eventId) {
  if (!(await canManage(eventId))) return { canManage: false, url: null };
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { checkInToken: true },
  });
  return { canManage: true, url: checkInUrl(event?.checkInToken) };
}

/** Crée le lien d'accueil, ou le remplace : l'ancien ne fonctionne plus. */
export async function regenerateCheckInLink(eventId) {
  if (!(await canManage(eventId))) {
    throw new Error("Seul le propriétaire ou un éditeur peut gérer l'accueil.");
  }
  const event = await prisma.event.update({
    where: { id: eventId },
    data: { checkInToken: nanoid(24) },
    select: { checkInToken: true },
  });
  return { url: checkInUrl(event.checkInToken) };
}

// ─── Côté équipe d'accueil ──────────────────────────────────────────────────

const GUEST_SELECT = {
  id: true,
  eventId: true,
  name: true,
  seats: true,
  attendingCount: true,
  rsvpStatus: true,
  checkedInAt: true,
  checkedInCount: true,
};

/** Ce que l'écran d'accueil montre d'un invité. */
function guestView(guest) {
  return {
    id: guest.id,
    name: guest.name,
    seats: guest.seats,
    people: expectedPeople(guest),
    rsvpStatus: guest.rsvpStatus,
    checkedInAt: guest.checkedInAt,
    checkedInCount: guest.checkedInCount,
  };
}

/** Événement du lien d'accueil, ou null pour un jeton inconnu ou remplacé. */
async function findEvent(token) {
  if (typeof token !== "string" || token.length < 16 || token.length > 64) {
    return null;
  }
  return prisma.event.findUnique({
    where: { checkInToken: token },
    select: { id: true, title: true, eventDate: true, time: true, location: true },
  });
}

async function eventFor(token) {
  const event = await findEvent(token);
  if (!event) throw new Error("Lien d'accueil invalide");
  return event;
}

/** Invité de l'événement, ou erreur s'il n'en fait pas partie. */
async function guestOf(event, guestId) {
  const guest = await prisma.guest.findUnique({
    where: { id: String(guestId ?? "") },
    select: GUEST_SELECT,
  });
  if (!guest || guest.eventId !== event.id) throw new Error("Invité introuvable");
  return guest;
}

/**
 * Enregistre l'arrivée d'un invité s'il n'est pas déjà entré. La condition
 * `checkedInAt: null` est vérifiée par la base : deux agents qui scannent le
 * même billet au même moment ne l'enregistrent qu'une fois.
 *
 * @returns {Promise<boolean>} vrai si l'arrivée vient d'être enregistrée
 */
async function markArrived(guest) {
  const { count } = await prisma.guest.updateMany({
    where: { id: guest.id, checkedInAt: null },
    data: { checkedInAt: new Date(), checkedInCount: expectedPeople(guest) },
  });
  return count === 1;
}

/**
 * Compteurs de l'accueil et dernières arrivées.
 *
 * - personnes : arrivées / attendues (confirmés, nombre annoncé sinon places) ;
 * - invités : arrivés / confirmés.
 */
async function summaryOf(eventId) {
  const guests = await prisma.guest.findMany({
    where: { eventId },
    select: GUEST_SELECT,
  });

  const summary = {
    arrivedPeople: 0,
    expectedPeople: 0,
    arrivedGuests: 0,
    confirmedGuests: 0,
    totalGuests: guests.length,
  };
  for (const guest of guests) {
    if (guest.rsvpStatus === "confirmed") {
      summary.confirmedGuests += 1;
      summary.expectedPeople += expectedPeople(guest);
    }
    if (guest.checkedInAt) {
      summary.arrivedGuests += 1;
      summary.arrivedPeople += guest.checkedInCount ?? expectedPeople(guest);
    }
  }

  const recent = guests
    .filter((guest) => guest.checkedInAt)
    .sort((a, b) => b.checkedInAt - a.checkedInAt)
    .slice(0, 8)
    .map(guestView);

  return { summary, recent };
}

/**
 * État de l'accueil : l'événement, ses compteurs, les dernières arrivées.
 * null pour un lien inconnu ou remplacé ; une erreur de base remonte telle
 * quelle, pour que la page la distingue d'un lien invalide.
 */
export async function getCheckInState(token) {
  const event = await findEvent(token);
  if (!event) return null;
  const { summary, recent } = await summaryOf(event.id);
  return {
    event: {
      title: event.title,
      eventDate: event.eventDate,
      time: event.time,
      location: event.location,
    },
    summary,
    recent,
  };
}

/**
 * Billet scanné (ou code tapé à la main).
 *
 * @returns {Promise<{ status: "ok"|"already"|"not_confirmed"|"unknown", guest?: object }>}
 *   « ok » : l'arrivée vient d'être enregistrée ;
 *   « already » : l'invité est déjà entré (heure dans `guest.checkedInAt`) ;
 *   « not_confirmed » : billet valide, mais l'invité n'a pas confirmé, l'agent
 *   décide (voir checkInGuest) ;
 *   « unknown » : aucun invité de cet événement n'a ce code.
 */
export async function scanTicket(token, rawCode) {
  const event = await eventFor(token);
  const code = parseScannedCode(rawCode);
  if (!code) return { status: "unknown" };

  const guest = await prisma.guest.findUnique({
    where: { ticketCode: code },
    select: GUEST_SELECT,
  });
  if (!guest || guest.eventId !== event.id) return { status: "unknown" };

  if (guest.checkedInAt) return { status: "already", guest: guestView(guest) };
  if (guest.rsvpStatus !== "confirmed") {
    return { status: "not_confirmed", guest: guestView(guest) };
  }

  return checkInResult(guest);
}

/**
 * Fait entrer un invité choisi dans la recherche, ou laissé entrer par
 * l'agent alors qu'il n'avait pas confirmé.
 */
export async function checkInGuest(token, guestId) {
  const event = await eventFor(token);
  const guest = await guestOf(event, guestId);
  if (guest.checkedInAt) return { status: "already", guest: guestView(guest) };
  return checkInResult(guest);
}

async function checkInResult(guest) {
  const arrived = await markArrived(guest);
  const fresh = await prisma.guest.findUnique({
    where: { id: guest.id },
    select: GUEST_SELECT,
  });
  return { status: arrived ? "ok" : "already", guest: guestView(fresh) };
}

/** Corrige le nombre de personnes entrées avec un invité. */
export async function setCheckInCount(token, guestId, count) {
  const event = await eventFor(token);
  const guest = await guestOf(event, guestId);
  if (!guest.checkedInAt) throw new Error("Cet invité n'est pas encore entré");

  const updated = await prisma.guest.update({
    where: { id: guest.id },
    data: { checkedInCount: clampSeats(count, MAX_SEATS) },
    select: GUEST_SELECT,
  });
  return { guest: guestView(updated) };
}

/** Annule une entrée enregistrée par erreur. */
export async function undoCheckIn(token, guestId) {
  const event = await eventFor(token);
  const guest = await guestOf(event, guestId);

  const updated = await prisma.guest.update({
    where: { id: guest.id },
    data: { checkedInAt: null, checkedInCount: null },
    select: GUEST_SELECT,
  });
  return { guest: guestView(updated) };
}

/**
 * Recherche par nom (ou par code de billet) pour un invité sans téléphone
 * ou dont le billet ne se scanne pas.
 */
export async function searchCheckInGuests(token, query) {
  const event = await eventFor(token);
  const needle = String(query ?? "").trim().slice(0, 80);
  if (needle.length < 2) return { guests: [] };

  const code = parseScannedCode(needle);
  const guests = await prisma.guest.findMany({
    where: {
      eventId: event.id,
      OR: [
        { name: { contains: needle, mode: "insensitive" } },
        ...(code ? [{ ticketCode: code }] : []),
      ],
    },
    select: GUEST_SELECT,
    orderBy: { name: "asc" },
    take: 20,
  });
  return { guests: guests.map(guestView) };
}
