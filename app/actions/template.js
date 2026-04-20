"use server";

import { prisma } from "@/utils/prisma";
import { getSession } from "@/app/actions/auth";

// L'ancienne logique de génération IA a été supprimée suite au refactoring.

const TEMPLATE_STATUSES = ["draft", "in_progress", "completed"];

function assertTemplateStatus(value) {
  if (value == null || value === "") return "draft";
  if (!TEMPLATE_STATUSES.includes(value)) {
    throw new Error(
      `Statut invalide. Valeurs autorisées : ${TEMPLATE_STATUSES.join(", ")}`
    );
  }
  return value;
}

// ──────────────────────────────────────────────
// User Custom Templates (Reusable)
// ──────────────────────────────────────────────
export async function saveUserTemplate(name, templateConfig, status) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  if (!name) throw new Error("Template name is required");

  const safeStatus = assertTemplateStatus(status);

  const tmpl = await prisma.template.create({
    data: {
      userId: user.userId,
      name,
      status: safeStatus,
      config: templateConfig,
    },
  });

  return tmpl;
}

export async function getTemplates() {
  const user = await getSession();
  if (!user) return [];

  return await prisma.template.findMany({
    where: {
      eventId: null,
    },
    include: {
      _count: {
        select: {
          eventCopies: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteTemplate(templateId) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  if (user.role !== "admin") {
    throw new Error("Seuls les administrateurs peuvent supprimer un modèle");
  }

  await prisma.$transaction(async (tx) => {
    // Detach event copies that still reference this source template
    // before deleting it to satisfy FK constraints in PostgreSQL.
    await tx.template.updateMany({
      where: { sourceTemplateId: templateId },
      data: { sourceTemplateId: null },
    });

    await tx.template.deleteMany({
      where: {
        id: templateId,
        eventId: null,
      },
    });
  });

  return { success: true };
}

export async function getUserTemplateById(templateId) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  const tmpl = await prisma.template.findFirst({
    where: { id: templateId, eventId: null },
  });

  if (!tmpl) throw new Error("Modèle non trouvé");
  return tmpl;
}

export async function updateUserTemplate(templateId, name, templateConfig, status) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  if (user.role !== "admin") {
    throw new Error("Seuls les administrateurs peuvent modifier un modèle");
  }

  if (!name) throw new Error("Le nom du modèle est requis");

  const safeStatus = assertTemplateStatus(status);

  const existing = await prisma.template.findFirst({
    where: { id: templateId, eventId: null },
  });
  if (!existing) throw new Error("Modèle non trouvé");

  const tmpl = await prisma.template.update({
    where: { id: templateId },
    data: {
      name,
      status: safeStatus,
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
    where: { id: eventId },
    include: { templateCopy: true },
  });
  if (!event) throw new Error("Event not found");

  if (event.templateCopy) {
    await prisma.template.update({
      where: { id: event.templateCopy.id },
      data: { config: template },
    });
  } else {
    await prisma.template.create({
      data: {
        userId: event.userId,
        eventId: event.id,
        name: `Copie de ${event.title}`,
        config: template,
      },
    });
  }

  return { success: true };
}

export async function assignTemplateToEvent(eventId, templateId) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  const event = await prisma.event.findFirst({
    where: { id: eventId },
    include: { templateCopy: true },
  });
  if (!event) throw new Error("Event not found");

  const template = await prisma.template.findFirst({
    where: {
      id: templateId,
      eventId: null,
    },
  });
  if (!template) throw new Error("Modèle introuvable");

  await prisma.$transaction(async (tx) => {
    if (event.templateCopy) {
      await tx.template.delete({
        where: { id: event.templateCopy.id },
      });
    }

    await tx.template.create({
      data: {
        userId: event.userId,
        eventId: event.id,
        sourceTemplateId: template.id,
        name: `${template.name} (copie - ${event.title})`,
        config: template.config,
      },
    });
  });

  return { success: true, template: template.config };
}
