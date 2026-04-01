"use server";

import { prisma } from "@/utils/prisma";
import {
  getSession,
  isEventOwnerOrAdmin,
  canAccessEvent,
} from "@/app/actions/auth";
import { getMyCollaboratorRole } from "@/app/actions/collaborator";
import { nanoid } from "nanoid";
import { sendInvitationEmail, sendBulkInvitationEmails } from "./notify";

const GUEST_LIMITS = {
  free: 15,
  premium: Infinity,
  enterprise: Infinity,
};

// ─── Helper de vérification des droits ───────────────────────────────────────
async function checkEditorAccess(eventId) {
  const isOwnerOrAdmin = await isEventOwnerOrAdmin(eventId);
  if (!isOwnerOrAdmin) {
    const role = await getMyCollaboratorRole(eventId);
    if (role !== "editor") {
      throw new Error(
        "Accès refusé. Seul le propriétaire ou un éditeur peut modifier les invités.",
      );
    }
  }
}

export async function getGuests(eventId) {
  try {
    const hasAccess = await canAccessEvent(eventId);
    if (!hasAccess) throw new Error("Unauthorized");

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new Error("Event not found");

    const guests = await prisma.guest.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
    });

    return guests;
  } catch (error) {
    console.error("Error fetching guests:", error);
    throw new Error("Failed to fetch guests");
  }
}

export async function addGuest(eventId, data) {
  try {
    await checkEditorAccess(eventId);

    // 🔒 Vérification limite invités
    const session = await getSession();

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { plan: true, role: true },
    });

    if (!user) throw new Error("User not found");

    // 🚀 ADMIN = bypass
    if (user.role !== "admin") {
      const guestCount = await prisma.guest.count({
        where: { eventId },
      });

      const limit = GUEST_LIMITS[user.plan] ?? 0;

      if (guestCount >= limit) {
        throw new Error(
          "Limite atteinte : passez au premium pour ajouter plus d'invités.",
        );
      }
    }

    //FIN Vérification limite invités

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new Error("Event not found");

    const { name, email, phone, dietary_restrictions, plus_one, notes } = data;
    if (!name || !email) throw new Error("Name and email are required");

    const existing = await prisma.guest.findFirst({
      where: { eventId, email },
    });
    if (existing) throw new Error("Guest with this email already exists");

    const guest = await prisma.guest.create({
      data: {
        eventId,
        name,
        email,
        phone: phone || null,
        dietaryRestrictions: dietary_restrictions || null,
        plusOne: plus_one || false,
        notes: notes || null,
        invitationToken: nanoid(32),
      },
    });

    // Auto-send if enabled
    if (event.autoSend) {
      if (email) {
        // Envoi asynchrone pour ne pas bloquer l'interface
        sendInvitationEmail(guest.id).catch((e) =>
          console.error("Auto-send email failed:", e),
        );
      }
    }

    return guest;
  } catch (error) {
    console.error("Error adding guest:", error);
    throw new Error(error.message || "Failed to add guest");
  }
}

export async function updateGuest(guestId, data) {
  try {
    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
    });
    if (!guest) throw new Error("Guest not found");

    await checkEditorAccess(guest.eventId);

    const updated = await prisma.guest.update({
      where: { id: guestId },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        email: data.email !== undefined ? data.email : undefined,
        phone: data.phone !== undefined ? data.phone : undefined,
        dietaryRestrictions:
          data.dietary_restrictions !== undefined
            ? data.dietary_restrictions
            : undefined,
        plusOne: data.plus_one !== undefined ? data.plus_one : undefined,
        notes: data.notes !== undefined ? data.notes : undefined,
        rsvpStatus:
          data.rsvp_status !== undefined ? data.rsvp_status : undefined,
        rsvpRespondedAt:
          data.rsvp_status !== undefined &&
          guest.rsvpStatus !== data.rsvp_status
            ? new Date()
            : undefined,
      },
    });

    return updated;
  } catch (error) {
    console.error("Error updating guest:", error);
    throw new Error("Failed to update guest");
  }
}

export async function deleteGuest(guestId) {
  try {
    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
    });
    if (!guest) throw new Error("Guest not found");

    await checkEditorAccess(guest.eventId);

    await prisma.guest.delete({
      where: { id: guestId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting guest:", error);
    throw new Error("Failed to delete guest");
  }
}

// ──────────────────────────────────────────────
// Send Bulk Invitations
// ──────────────────────────────────────────────
export async function sendBulkInvitations(eventId) {
  try {
    await checkEditorAccess(eventId);
    const result = await sendBulkInvitationEmails(eventId);
    return {
      success: true,
      sentCount: result.sent,
      message:
        result.message || `${result.sent} invitations envoyées avec succès.`,
    };
  } catch (error) {
    console.error("Bulk send error:", error);
    throw new Error(error.message || "Failed to send bulk invitations");
  }
}
