"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, getSession } from "./auth";

// ─── Gestion des utilisateurs (Admin seulement) ──────────────────────────────

export async function getAllUsers() {
  await requireAdmin();
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
      role: true,
      plan: true,
      suspended: true,
      createdAt: true,
      _count: { select: { events: true, templates: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateUserRole(userId, role) {
  await requireAdmin();
  if (!["user", "admin"].includes(role)) throw new Error("Rôle invalide");

  const session = await getSession();
  if (userId === session.userId)
    throw new Error("Vous ne pouvez pas modifier votre propre rôle");

  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });
}

/**
 * Formule d'un compte : « free » (Découverte) ou « premium ». C'est ainsi
 * qu'un admin active l'Événement premium vendu sur la page Tarifs.
 */
export async function updateUserPlan(userId, plan) {
  await requireAdmin();
  if (!["free", "premium"].includes(plan)) throw new Error("Formule invalide");

  return prisma.user.update({
    where: { id: userId },
    data: { plan },
    select: { id: true, name: true, email: true, plan: true },
  });
}

export async function suspendUser(userId, suspend = true) {
  await requireAdmin();
  const session = await getSession();
  if (userId === session.userId)
    throw new Error("Vous ne pouvez pas vous suspendre vous-même");

  return prisma.user.update({
    where: { id: userId },
    data: { suspended: suspend },
    select: { id: true, name: true, suspended: true },
  });
}

export async function deleteUserAdmin(userId) {
  await requireAdmin();
  const session = await getSession();
  if (userId === session.userId)
    throw new Error("Vous ne pouvez pas supprimer votre propre compte");

  await prisma.user.delete({ where: { id: userId } });
  return { success: true };
}

// ─── Événements (Admin seulement) ────────────────────────────────────────────

/**
 * Tous les événements de la plateforme, avec leur propriétaire : la page
 * Admin › Événements. Les présents sont comptés en base (groupBy) plutôt
 * qu'en chargeant chaque invité.
 */
export async function getAllEventsAdmin() {
  await requireAdmin();
  const [events, confirmed] = await Promise.all([
    prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        eventDate: true,
        location: true,
        status: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { guests: true } },
      },
    }),
    prisma.guest.groupBy({
      by: ["eventId"],
      where: { rsvpStatus: "confirmed" },
      _count: { _all: true },
    }),
  ]);

  const confirmedByEvent = new Map(
    confirmed.map((row) => [row.eventId, row._count._all]),
  );
  return events.map(({ _count, ...event }) => ({
    ...event,
    guestCount: _count.guests,
    confirmedCount: confirmedByEvent.get(event.id) ?? 0,
  }));
}

/**
 * Propriétaire d'un événement, pour la mention affichée à un admin qui
 * consulte l'événement d'un autre compte.
 */
export async function getEventOwnerAdmin(eventId) {
  await requireAdmin();
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { user: { select: { id: true, name: true, email: true } } },
  });
  return event?.user ?? null;
}

export async function getAdminStats() {
  await requireAdmin();
  const [totalUsers, totalEvents, totalTemplates, admins] = await Promise.all([
    prisma.user.count(),
    prisma.event.count(),
    prisma.template.count(),
    prisma.user.count({ where: { role: "admin" } }),
  ]);
  return { totalUsers, totalEvents, totalTemplates, admins };
}
