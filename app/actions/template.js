"use server";

import { prisma } from "@/utils/prisma";
import { getSession } from "@/app/actions/auth";

// L'ancienne logique de génération IA a été supprimée suite au refactoring.

// ──────────────────────────────────────────────
// User Custom Templates (Reusable)
// ──────────────────────────────────────────────
export async function saveUserTemplate(name, templateConfig) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  if (!name) throw new Error("Template name is required");

  const tmpl = await prisma.template.create({
    data: {
      userId: user.userId,
      name,
      config: templateConfig,
    },
  });

  return tmpl;
}

export async function getTemplates() {
  const user = await getSession();
  if (!user) return [];

  return await prisma.template.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteTemplate(templateId) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  if (user.role !== "admin") {
    throw new Error("Seuls les administrateurs peuvent supprimer un modèle");
  }

  await prisma.template.deleteMany({
    where: {
      id: templateId,
    },
  });

  return { success: true };
}

export async function getUserTemplateById(templateId) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  const tmpl = await prisma.template.findFirst({
    where: { id: templateId },
  });

  if (!tmpl) throw new Error("Modèle non trouvé");
  return tmpl;
}

export async function updateUserTemplate(templateId, name, templateConfig) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  if (user.role !== "admin") {
    throw new Error("Seuls les administrateurs peuvent modifier un modèle");
  }

  if (!name) throw new Error("Le nom du modèle est requis");

  const existing = await prisma.template.findFirst({
    where: { id: templateId },
  });
  if (!existing) throw new Error("Modèle non trouvé");

  const tmpl = await prisma.template.update({
    where: { id: templateId },
    data: {
      name,
      config: templateConfig,
    },
  });

  return tmpl;
}

// ──────────────────────────────────────────────
// Save a custom template to an event
// ──────────────────────────────────────────────
export async function saveTemplate(eventId, template) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  const event = await prisma.event.findFirst({
    where: { id: eventId, userId: user.userId },
  });
  if (!event) throw new Error("Event not found");

  await prisma.event.update({
    where: { id: eventId },
    data: { invitationTemplate: template },
  });

  return { success: true };
}
