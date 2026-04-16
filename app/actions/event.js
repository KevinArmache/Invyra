"use server";

import { prisma } from "@/utils/prisma";
import {
  getSession,
  isEventOwnerOrAdmin,
  canAccessEvent,
} from "@/app/actions/auth";
import { getMyCollaboratorRole } from "@/app/actions/collaborator";

const PLAN_LIMITS = {
  free: 1,
  premium: 1,
  enterprise: Infinity,
};

export async function canCreateEvent() {
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
          select: { rsvpStatus: true, invitationViewedAt: true },
        },
      },
    });

    return events.map((e) => ({
      ...e,
      invitationTemplate: e.templateCopy?.config || e.invitationTemplate,
      templateCopy: undefined,
      guest_count: e._count.guests,
      confirmed_count: e.guests.filter((g) => g.rsvpStatus === "confirmed")
        .length,
      viewed_count: e.guests.filter((g) => g.invitationViewedAt !== null)
        .length,
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
          select: { id: true, config: true },
        },
        _count: {
          select: { guests: true },
        },
        guests: {
          select: { rsvpStatus: true, invitationViewedAt: true },
        },
      },
    });

    if (!event) throw new Error("Event not found");

    return {
      ...event,
      invitationTemplate:
        event.templateCopy?.config || event.invitationTemplate,
      templateCopy: undefined,
      guest_count: event._count.guests,
      confirmed_count: event.guests.filter((g) => g.rsvpStatus === "confirmed")
        .length,
      declined_count: event.guests.filter((g) => g.rsvpStatus === "declined")
        .length,
      viewed_count: event.guests.filter((g) => g.invitationViewedAt !== null)
        .length,
      guests: undefined,
    };
  } catch (error) {
    console.error("Error fetching event:", error);
    throw new Error("Failed to fetch event");
  }
}

export async function createEvent(data) {
  try {
    const user = await getSession();
    if (!user) throw new Error("Unauthorized");

    // ✅ Vérification plan
    const allowed = await canCreateEvent();

    if (!allowed) {
      throw new Error(
        "Limite atteinte : passez à un plan premium pour créer plus d'événements.",
      );
    }

    const {
      title,
      description,
      event_date,
      location,
      time,
      dress_code,
      custom_message,
    } = data;
    if (!title) throw new Error("Title is required");
    console.log(data);
    let adjustedDate = null;
    if (event_date) {
      adjustedDate = new Date(event_date); // Crée la date depuis la string
      adjustedDate.setHours(adjustedDate.getHours() + 1); // Ajoute 1 heure
    }
    const event = await prisma.event.create({
      data: {
        userId: user.userId,
        title,
        description: description || null,
        eventDate: adjustedDate,
        location: location || null,
        time: time || null,
        dressCode: dress_code || null,
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

    // ⚡ Ajuste event_date +1 heure
    let adjustedDate = undefined;
    if (data.event_date) {
      adjustedDate = new Date(data.event_date);
      adjustedDate.setHours(adjustedDate.getHours() + 1);
    }

    if (data.invitation_template !== undefined) {
      if (existing.templateCopy?.id) {
        await prisma.template.update({
          where: { id: existing.templateCopy.id },
          data: { config: data.invitation_template },
        });
      } else {
        await prisma.template.create({
          data: {
            userId: existing.userId,
            eventId: existing.id,
            name: `Copie de ${existing.title}`,
            config: data.invitation_template,
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
        eventDate: adjustedDate,
        location: data.location !== undefined ? data.location : undefined,
        time: data.time !== undefined ? data.time : undefined,
        dressCode: data.dress_code !== undefined ? data.dress_code : undefined,
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
