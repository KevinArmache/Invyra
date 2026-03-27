"use server";

import { prisma } from "@/utils/prisma";
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
