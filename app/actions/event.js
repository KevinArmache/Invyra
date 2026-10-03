"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/prisma/client";
import {
  getSession,
  isEventOwnerOrAdmin,
  canAccessEvent,
} from "@/app/actions/auth";
import { getMyCollaboratorRole } from "@/app/actions/collaborator";
import { validateTemplateConfig } from "@/lib/templates/validation";
import { deriveLocation, parseItineraryField } from "@/lib/itinerary";

const PLAN_LIMITS = {
  free: 1,
  premium: 1,
};

/** Message montré quand la formule n'autorise pas un événement de plus. */
const EVENT_LIMIT_MESSAGE =
  "Votre formule comprend 1 événement. Écrivez-nous sur WhatsApp pour en créer un autre.";

/** Ce qu'on lit des invités pour compter envois, ouvertures et réponses. */
const GUEST_COUNTS_SELECT = {
  rsvpStatus: true,
  invitationViewedAt: true,
  invitationSentAt: true,
};

/**
 * Compteurs d'un événement à partir de ses invités. « Peut-être » est une
 * réponse à part entière : le tableau de bord et la fiche de l'événement
 * doivent compter la même chose.
 */
function guestCounts(guests) {
  const counts = {
    confirmed_count: 0,
    declined_count: 0,
    maybe_count: 0,
    viewed_count: 0,
    sent_count: 0,
  };
  for (const guest of guests) {
    if (guest.rsvpStatus === "confirmed") counts.confirmed_count += 1;
    else if (guest.rsvpStatus === "declined") counts.declined_count += 1;
    else if (guest.rsvpStatus === "maybe") counts.maybe_count += 1;
    if (guest.invitationViewedAt) counts.viewed_count += 1;
    if (guest.invitationSentAt) counts.sent_count += 1;
  }
  return counts;
}

/**
 * Numéro de contact affiché sur les invitations : texte libre (le format est
 * guidé par le champ du formulaire), borné à 30 caractères, null si vide.
 */
function cleanContactPhone(value) {
  return String(value ?? "").trim().slice(0, 30) || null;
}

/**
 * Itinéraire envoyé par le formulaire (voir lib/itinerary.js) et lieu qui
 * le résume. `undefined` si le champ est absent ou illisible : rien n'est
 * alors modifié.
 */
function itineraryData(raw) {
  const stops = parseItineraryField(raw);
  if (stops === undefined) {
    if (raw !== undefined) console.warn("[event] Itinéraire illisible, ignoré.");
    return undefined;
  }
  return {
    // Une colonne JSON se vide avec DbNull : `null` y est refusé.
    itinerary: stops.length > 0 ? stops : Prisma.DbNull,
    location: deriveLocation(stops),
  };
}

async function canCreateEvent() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  // 🔒 Toujours récupérer depuis la DB (jamais depuis le frontend)
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { plan: true, role: true }, // 👈 important (admin ici)
  });

  if (!user) throw new Error("User not found");

  // 🚀 ADMIN = bypass total
  if (user.role === "admin") {
    return true;
  }

  const eventCount = await prisma.event.count({
    where: { userId: session.userId },
  });

  const limit = PLAN_LIMITS[user.plan] ?? 0;

  return eventCount < limit;
}

export async function getEvents() {
  try {
    const user = await getSession();
    if (!user) throw new Error("Unauthorized");

    const events = await prisma.event.findMany({
      where: {
        OR: [
          { userId: user.userId },
          { collaborators: { some: { userId: user.userId, accepted: true } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        templateCopy: {
          select: { config: true },
        },
        _count: {
          select: { guests: true },
        },
        guests: {
          select: GUEST_COUNTS_SELECT,
        },
      },
    });

    return events.map((e) => ({
      ...e,
      invitationTemplate: e.templateCopy?.config || e.invitationTemplate,
      templateCopy: undefined,
      checkInToken: undefined,
      guest_count: e._count.guests,
      ...guestCounts(e.guests),
      guests: undefined,
    }));
  } catch (error) {
    console.error("Error fetching events:", error);
    throw new Error("Failed to fetch events");
  }
}

export async function getEventById(id) {
  try {
    const user = await getSession();
    if (!user) throw new Error("Unauthorized");

    const hasAccess = await canAccessEvent(id);
    if (!hasAccess) throw new Error("Accès refusé");

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        templateCopy: {
          select: { id: true, config: true, sourceTemplateId: true },
        },
        _count: {
          select: { guests: true },
        },
        guests: {
          select: GUEST_COUNTS_SELECT,
        },
      },
    });

    if (!event) throw new Error("Event not found");

    return {
      ...event,
      invitationTemplate:
        event.templateCopy?.config || event.invitationTemplate,
      templateSourceId: event.templateCopy?.sourceTemplateId ?? null,
      templateCopy: undefined,
      // Le lien d'accueil ne passe que par getCheckInLink, réservé à ceux
      // qui peuvent modifier l'événement.
      checkInToken: undefined,
      guest_count: event._count.guests,
      ...guestCounts(event.guests),
      guests: undefined,
    };
  } catch (error) {
    console.error("Error fetching event:", error);
    throw new Error("Failed to fetch event");
  }
}

export async function createEvent(data) {
  // Hors du try : ce message doit arriver tel quel à l'utilisateur, alors que
  // les autres erreurs sont remplacées par un message générique.
  const allowed = await canCreateEvent();
  if (!allowed) throw new Error(EVENT_LIMIT_MESSAGE);

  try {
    const user = await getSession();
    if (!user) throw new Error("Unauthorized");

    const {
      title,
      description,
      event_date,
      location,
      time,
      dress_code,
      contact_phone,
      custom_message,
    } = data;
    if (!title) throw new Error("Title is required");
    const itinerary = itineraryData(data.itinerary);

    // `datetime-local` renvoie une heure locale ; `new Date()` la lit comme
    // telle et Prisma la stocke correctement. Le +1 h appliqué ici décalait
    // chaque événement d'une heure à la création — les dates enregistrées
    // avant ce correctif sont donc en avance d'une heure en base.
    const eventDate = event_date ? new Date(event_date) : null;
    const event = await prisma.event.create({
      data: {
        userId: user.userId,
        title,
        description: description || null,
        eventDate,
        location: location || null,
        ...itinerary,
        time: time || null,
        dressCode: dress_code || null,
        contactPhone: cleanContactPhone(contact_phone),
        customMessage: custom_message || null,
        status: "draft",
      },
    });

    return event;
  } catch (error) {
    console.error("Error creating event:", error);
    throw Error("Failed to create event");
  }
}

export async function updateEvent(id, data) {
  try {
    const user = await getSession();
    if (!user) throw new Error("Unauthorized");

    const isOwnerOrAdmin = await isEventOwnerOrAdmin(id);
    if (!isOwnerOrAdmin) {
      const role = await getMyCollaboratorRole(id);
      if (role !== "editor") {
        throw new Error(
          "Seul le propriétaire ou un éditeur peut modifier cet événement.",
        );
      }
    }

    const existing = await prisma.event.findUnique({
      where: { id },
      include: { templateCopy: { select: { id: true } } },
    });
    if (!existing) throw new Error("Event not found");

    // Voir createEvent : aucun décalage ne doit être appliqué ici non plus.
    const eventDate = data.event_date ? new Date(data.event_date) : undefined;
    const itinerary = itineraryData(data.itinerary);

    if (data.invitation_template !== undefined) {
      const config = validateTemplateConfig(data.invitation_template, {
        allowCode: user.role === "admin",
      });
      if (existing.templateCopy?.id) {
        await prisma.template.update({
          where: { id: existing.templateCopy.id },
          data: { config },
        });
      } else {
        await prisma.template.create({
          data: {
            userId: existing.userId,
            eventId: existing.id,
            name: `Copie de ${existing.title}`,
            config,
          },
        });
      }
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        title: data.title !== undefined ? data.title : undefined,
        description:
          data.description !== undefined ? data.description : undefined,
        eventDate,
        location: data.location !== undefined ? data.location : undefined,
        // L'itinéraire, quand il est envoyé, fixe aussi le lieu.
        ...itinerary,
        time: data.time !== undefined ? data.time : undefined,
        dressCode: data.dress_code !== undefined ? data.dress_code : undefined,
        contactPhone:
          data.contact_phone !== undefined
            ? cleanContactPhone(data.contact_phone)
            : undefined,
        customMessage:
          data.custom_message !== undefined ? data.custom_message : undefined,
        animationConfig:
          data.animation_config !== undefined
            ? data.animation_config
            : undefined,
        invitationTemplate: undefined,
        emailTemplate:
          data.email_template !== undefined ? data.email_template : undefined,
        status: data.status !== undefined ? data.status : undefined,
      },
    });

    return {
      ...updated,
      invitationTemplate:
        data.invitation_template !== undefined
          ? data.invitation_template
          : updated.invitationTemplate,
    };
  } catch (error) {
    console.error("Error updating event:", error);
    throw new Error("Failed to update event");
  }
}

export async function deleteEvent(id) {
  try {
    const user = await getSession();
    if (!user) throw new Error("Unauthorized");

    const isOwnerOrAdmin = await isEventOwnerOrAdmin(id);
    if (!isOwnerOrAdmin)
      throw new Error(
        "Seul le propriétaire de l'événement ou un administrateur peut le supprimer.",
      );

    const existing = await prisma.event.findUnique({
      where: { id },
    });
    if (!existing) throw new Error("Event not found");

    await prisma.$transaction(async (tx) => {
      await tx.template.deleteMany({
        where: { eventId: id },
      });

      await tx.event.delete({
        where: { id },
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    throw new Error("Failed to delete event");
  }
}

/**
 * Dernières ouvertures et réponses des invités, sur les événements que
 * l'utilisateur possède ou suit comme collaborateur (même règle que
 * getEvents).
 *
 * Un invité peut produire deux entrées : son ouverture, puis sa réponse.
 *
 * @param {number} [limit=8]
 * @returns {Promise<Array<{ id, type, guestName, eventId, eventTitle, at }>>}
 *   `type` : "viewed" | "confirmed" | "declined" | "maybe"
 */
export async function getRecentActivity(limit = 8) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  const take = Math.min(Math.max(1, Number(limit) || 8), 30);
  const guests = await prisma.guest.findMany({
    where: {
      event: {
        OR: [
          { userId: user.userId },
          { collaborators: { some: { userId: user.userId, accepted: true } } },
        ],
      },
      OR: [
        { invitationViewedAt: { not: null } },
        { rsvpRespondedAt: { not: null } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: take * 3,
    select: {
      id: true,
      name: true,
      rsvpStatus: true,
      invitationViewedAt: true,
      rsvpRespondedAt: true,
      event: { select: { id: true, title: true } },
    },
  });

  const items = [];
  for (const guest of guests) {
    const base = {
      guestName: guest.name,
      eventId: guest.event.id,
      eventTitle: guest.event.title,
    };
    if (guest.rsvpRespondedAt && guest.rsvpStatus) {
      items.push({
        ...base,
        id: `${guest.id}:rsvp`,
        type: guest.rsvpStatus,
        at: guest.rsvpRespondedAt,
      });
    }
    if (guest.invitationViewedAt) {
      items.push({
        ...base,
        id: `${guest.id}:viewed`,
        type: "viewed",
        at: guest.invitationViewedAt,
      });
    }
  }

  return items
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, take);
}
