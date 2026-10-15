"use server";

import { after } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";

import { prisma } from "@/lib/prisma";
import { getSession, isEventOwnerOrAdmin } from "@/app/actions/auth";
import { getMyCollaboratorRole } from "@/app/actions/collaborator";
import { deliverInvitationEmail } from "@/lib/email/guest-invitation";
import { hasGuestCapacity } from "@/lib/guests/capacity";
import {
  findPublicEvent,
  joinCookieName,
  newPublicToken,
  publicLinkUrl,
} from "@/lib/guests/public-link";
import { normalizePhone, phoneKey } from "@/lib/phone";
import { PUBLIC_MAX_SEATS, clampSeats, newTicketCode } from "@/lib/tickets";

/**
 * Lien unique de l'invitation.
 *
 * L'hôte partage un seul lien (/join/<jeton>). Chaque personne qui l'ouvre
 * saisit son nom et son téléphone : une ligne Guest est créée pour elle,
 * avec son propre jeton, puis elle est envoyée vers son invitation
 * personnelle (/invite/<jeton>). Réponse, billet, souvenirs et accueil
 * fonctionnent ensuite exactement comme pour un invité ajouté par l'hôte.
 *
 * Régénérer le lien coupe l'ancien ; le désactiver le met en pause sans le
 * perdre. Les invités déjà inscrits gardent leur invitation dans les deux cas.
 */

// ─── Côté hôte ──────────────────────────────────────────────────────────────

async function canManage(eventId) {
  const session = await getSession();
  if (!session) return false;
  if (await isEventOwnerOrAdmin(eventId)) return true;
  return (await getMyCollaboratorRole(eventId)) === "editor";
}

async function assertCanManage(eventId) {
  if (!(await canManage(eventId))) {
    throw new Error("Seul le propriétaire ou un éditeur peut gérer le lien unique.");
  }
}

/** Ce que le tableau de bord montre du lien. */
function linkView(event) {
  return {
    canManage: true,
    enabled: Boolean(event.publicLinkEnabled && event.publicToken),
    url: publicLinkUrl(event.publicToken),
    maxSeats: event.publicMaxSeats,
  };
}

const LINK_SELECT = {
  title: true,
  publicToken: true,
  publicLinkEnabled: true,
  publicMaxSeats: true,
};

/**
 * Lien unique de l'événement. Un collaborateur en lecture seule ne le voit
 * pas (`canManage: false`).
 *
 * @returns {Promise<{ canManage: boolean, enabled: boolean, url: string | null, maxSeats: number }>}
 */
export async function getPublicLink(eventId) {
  if (!(await canManage(eventId))) {
    return { canManage: false, enabled: false, url: null, maxSeats: 1 };
  }
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: LINK_SELECT,
  });
  if (!event) return { canManage: false, enabled: false, url: null, maxSeats: 1 };
  return linkView(event);
}

/**
 * Active ou met en pause le lien. Le jeton est créé à la première
 * activation et conservé ensuite : réactiver redonne le même lien.
 */
export async function setPublicLinkEnabled(eventId, enabled) {
  await assertCanManage(eventId);
  const current = await prisma.event.findUnique({
    where: { id: eventId },
    select: LINK_SELECT,
  });
  if (!current) throw new Error("Événement introuvable");

  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      publicLinkEnabled: Boolean(enabled),
      ...(enabled && !current.publicToken && { publicToken: newPublicToken(current.title) }),
    },
    select: LINK_SELECT,
  });
  return linkView(event);
}

/** Remplace le lien : l'ancien cesse de fonctionner aussitôt. */
export async function regeneratePublicLink(eventId) {
  await assertCanManage(eventId);
  const current = await prisma.event.findUnique({
    where: { id: eventId },
    select: { title: true },
  });
  if (!current) throw new Error("Événement introuvable");

  const event = await prisma.event.update({
    where: { id: eventId },
    data: { publicToken: newPublicToken(current.title), publicLinkEnabled: true },
    select: LINK_SELECT,
  });
  return linkView(event);
}

/** Nombre de personnes qu'un inscrit peut annoncer, lui compris. */
export async function updatePublicLinkSettings(eventId, { maxSeats }) {
  await assertCanManage(eventId);
  const event = await prisma.event.update({
    where: { id: eventId },
    data: { publicMaxSeats: clampSeats(maxSeats, PUBLIC_MAX_SEATS) },
    select: LINK_SELECT,
  });
  return linkView(event);
}

// ─── Côté invité ────────────────────────────────────────────────────────────

const NAME_MAX = 120;
const EMAIL_MAX = 200;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Texte saisi : espaces superflus retirés, longueur bornée. */
function cleanText(value, max) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

/** Un an : le temps qu'un invité retrouve son invitation depuis le lien unique. */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Inscription par le lien unique, appelée par le formulaire de la page
 * /join (useActionState), qui transmet le jeton du lien dans le champ
 * `slug`. Renvoie `{ error }` à afficher, ou redirige vers l'invitation
 * personnelle de l'invité.
 *
 * Un numéro déjà inscrit à cet événement ne reçoit pas le lien de l'autre
 * invité : qui connaît le numéro d'un proche ne doit pas pouvoir ouvrir son
 * invitation ni changer sa réponse.
 *
 * @returns {Promise<{ error: string, field?: string }>}
 */
export async function joinEvent(_previousState, formData) {
  // Champ invisible : seul un robot le remplit.
  if (cleanText(formData.get("website"), 100)) {
    return { error: "unknown" };
  }

  const found = await findPublicEvent(String(formData.get("slug") ?? ""));
  if (!found) return { error: "closed" };
  if (!found.event.invitationTemplate) return { error: "closed" };

  const name = cleanText(formData.get("name"), NAME_MAX);
  const phone = normalizePhone(formData.get("phone"));
  const email = cleanText(formData.get("email"), EMAIL_MAX).toLowerCase();
  const seats = clampSeats(formData.get("seats"), found.maxSeats);

  if (name.length < 2) return { error: "name", field: "name" };
  if (!phone) return { error: "phone", field: "phone" };
  if (email && !EMAIL_PATTERN.test(email)) return { error: "email", field: "email" };

  if (!(await hasGuestCapacity(found.id, found.owner))) {
    return { error: "full" };
  }

  // Un même numéro peut avoir été écrit autrement par l'hôte (« 0812… »,
  // « +243 812… ») : on compare les derniers chiffres (voir phoneKey).
  const key = phoneKey(phone);
  const withPhone = await prisma.guest.findMany({
    where: { eventId: found.id, phone: { not: null } },
    select: { phone: true },
  });
  if (withPhone.some((guest) => phoneKey(guest.phone) === key)) {
    return { error: "duplicate", field: "phone" };
  }

  let guest;
  try {
    guest = await prisma.guest.create({
      data: {
        eventId: found.id,
        name,
        email: email || null,
        phone,
        seats,
        source: "link",
        invitationToken: nanoid(32),
        ticketCode: newTicketCode(),
      },
      select: { id: true, invitationToken: true },
    });
  } catch (error) {
    // Unicité (eventId, email) : cet e-mail est déjà inscrit.
    if (error?.code === "P2002") return { error: "duplicate", field: "email" };
    console.error("[join] Inscription impossible :", error);
    return { error: "unknown" };
  }

  (await cookies()).set(joinCookieName(found.id), guest.invitationToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  // L'e-mail part une fois l'invité redirigé : l'envoi SMTP ne le fait pas
  // attendre, et un échec ne l'empêche pas d'ouvrir son invitation.
  if (email) {
    after(() =>
      deliverInvitationEmail(guest.id).catch((error) =>
        console.error("[join] E-mail d'invitation non envoyé :", error.message),
      ),
    );
  }

  redirect(`/invite/${guest.invitationToken}?welcome=1`);
}
