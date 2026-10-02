"use server";

import { prisma } from "@/lib/prisma";
import {
  getSession,
  isEventOwnerOrAdmin,
  canAccessEvent,
} from "@/app/actions/auth";
import { getMyCollaboratorRole } from "@/app/actions/collaborator";
import { nanoid } from "nanoid";
import { sendInvitationEmail, sendBulkInvitationEmails } from "./notify";
import { FREE_GUEST_LIMIT } from "@/lib/site";
import { clampSeats, newTicketCode } from "@/lib/tickets";

const GUEST_LIMITS = {
  free: FREE_GUEST_LIMIT,
  premium: Infinity,
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
          `L'offre Découverte est limitée à ${FREE_GUEST_LIMIT} invités. Passez à l'Événement premium pour en ajouter d'autres.`,
        );
      }
    }

    //FIN Vérification limite invités

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new Error("Event not found");

    const { name, email, phone, seats } = data;
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
        seats: clampSeats(seats),
        invitationToken: nanoid(32),
        ticketCode: newTicketCode(),
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

/**
 * Modifie un invité : nom, email, téléphone et places réservées. Si l'invité
 * avait annoncé plus de personnes que ses nouvelles places, sa réponse est
 * ramenée à ce nombre.
 */
export async function updateGuest(guestId, data) {
  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    select: { id: true, eventId: true, attendingCount: true },
  });
  if (!guest) throw new Error("Invité introuvable");

  await checkEditorAccess(guest.eventId);

  const name = String(data?.name ?? "").trim().slice(0, 120);
  const email = String(data?.email ?? "").trim().slice(0, 200);
  const phone = String(data?.phone ?? "").trim().slice(0, 30);
  const seats = clampSeats(data?.seats);
  if (!name || !email.includes("@")) {
    throw new Error("Le nom et un email valide sont obligatoires.");
  }

  const duplicate = await prisma.guest.findFirst({
    where: { eventId: guest.eventId, email, NOT: { id: guest.id } },
    select: { id: true },
  });
  if (duplicate) throw new Error("Un autre invité utilise déjà cet email.");

  return prisma.guest.update({
    where: { id: guest.id },
    data: {
      name,
      email,
      phone: phone || null,
      seats,
      ...(guest.attendingCount > seats && { attendingCount: seats }),
    },
  });
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
