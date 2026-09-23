"use server";

import { prisma } from "@/utils/prisma";
import { getSession, isEventOwnerOrAdmin } from "@/app/actions/auth";
import { getMyCollaboratorRole } from "@/app/actions/collaborator";
import { validateTemplateConfig } from "@/lib/invitation/document";

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

/**
 * Seuls les administrateurs créent des modèles réutilisables (création et
 * duplication). Les clients choisissent un modèle puis personnalisent la
 * copie propre à leur événement.
 */
function assertCanCreateTemplate(session) {
  if (session?.role !== "admin") {
    throw new Error("Seuls les administrateurs peuvent créer des modèles");
  }
}

/** Admin ou propriétaire du modèle réutilisable (userId) */
function canManageReusableTemplate(session, template) {
  if (!session || !template) return false;
  if (session.role === "admin") return true;
  return template.userId != null && template.userId === session.userId;
}

/**
 * Modèles réutilisables visibles par l'utilisateur : tous pour un admin ;
 * sinon les modèles terminés, plus ses propres modèles quel que soit leur
 * statut. Les brouillons des autres restent privés.
 */
function visibleTemplatesWhere(session) {
  if (session.role === "admin") return { eventId: null };
  return {
    eventId: null,
    OR: [{ status: "completed" }, { userId: session.userId }],
  };
}

/** Même règle que updateEvent : propriétaire, admin ou collaborateur éditeur. */
async function assertCanEditEvent(eventId) {
  if (await isEventOwnerOrAdmin(eventId)) return;
  const role = await getMyCollaboratorRole(eventId);
  if (role !== "editor") {
    throw new Error(
      "Seul le propriétaire ou un éditeur peut modifier l'invitation de cet événement.",
    );
  }
}

// ──────────────────────────────────────────────
// User Custom Templates (Reusable)
// ──────────────────────────────────────────────
export async function saveUserTemplate(name, templateConfig, status) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  assertCanCreateTemplate(user);

  if (!name) throw new Error("Template name is required");

  const safeStatus = assertTemplateStatus(status);
  const config = validateTemplateConfig(templateConfig, {
    allowCode: user.role === "admin",
  });

  const tmpl = await prisma.template.create({
    data: {
      userId: user.userId,
      name,
      status: safeStatus,
      config,
    },
  });

  return tmpl;
}

export async function getTemplates() {
  const user = await getSession();
  if (!user) return [];

  return await prisma.template.findMany({
    where: visibleTemplatesWhere(user),
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

  const existing = await prisma.template.findFirst({
    where: { id: templateId, eventId: null },
  });
  if (!existing) throw new Error("Modèle non trouvé");
  if (!canManageReusableTemplate(user, existing)) {
    throw new Error("Vous n'avez pas le droit de supprimer ce modèle");
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
  if (!canManageReusableTemplate(user, tmpl)) {
    throw new Error("Vous n'avez pas le droit d'accéder à ce modèle");
  }
  return tmpl;
}

export async function updateUserTemplate(templateId, name, templateConfig, status) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");

  if (!name) throw new Error("Le nom du modèle est requis");

  const safeStatus = assertTemplateStatus(status);

  const existing = await prisma.template.findFirst({
    where: { id: templateId, eventId: null },
  });
  if (!existing) throw new Error("Modèle non trouvé");
  if (!canManageReusableTemplate(user, existing)) {
    throw new Error("Vous n'avez pas le droit de modifier ce modèle");
  }

  // L'auteur d'un modèle code créé avant les thèmes peut continuer à le
  // modifier ; écrire du code dans un modèle à thème reste réservé aux admins.
  // Sans ce droit, l'éditeur visuel reste permis (textes, images, couleurs).
  const config = validateTemplateConfig(templateConfig, {
    allowCode: user.role === "admin" || existing.config?.type !== "theme",
    base: existing.config,
  });

  const tmpl = await prisma.template.update({
    where: { id: templateId },
    data: {
      name,
      status: safeStatus,
      config,
    },
  });

  return tmpl;
}

/**
 * Copie d'un modèle visible, au nom de l'utilisateur, en brouillon : c'est le
 * point de départ pour décliner un modèle pour un nouveau client.
 */
export async function duplicateTemplate(templateId) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  assertCanCreateTemplate(user);

  const source = await prisma.template.findFirst({
    where: { id: templateId, ...visibleTemplatesWhere(user) },
  });
  if (!source) throw new Error("Modèle non trouvé");

  // Dupliquer un modèle code donnerait à son nouveau propriétaire le droit
  // d'en modifier le code (voir updateUserTemplate).
  const config = validateTemplateConfig(source.config, {
    allowCode: user.role === "admin",
  });

  return await prisma.template.create({
    data: {
      userId: user.userId,
      name: `${source.name} (copie)`.slice(0, 200),
      status: "draft",
      config,
    },
  });
}

/**
 * Affiche ou retire un modèle de la vitrine de la page d'accueil. Réservé
 * aux admins : la vitrine est publique.
 */
export async function setTemplateFeatured(templateId, featured) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  if (user.role !== "admin") {
    throw new Error("Seul un administrateur peut gérer la vitrine");
  }

  const existing = await prisma.template.findFirst({
    where: { id: templateId, eventId: null },
    select: { id: true },
  });
  if (!existing) throw new Error("Modèle non trouvé");

  return await prisma.template.update({
    where: { id: templateId },
    data: { featured: Boolean(featured) },
    select: { id: true, featured: true },
  });
}

// ──────────────────────────────────────────────
// Save the invitation design of an event
// ──────────────────────────────────────────────

/**
 * Enregistre le design d'un événement (sa copie de template).
 *
 * @param {string} eventId
 * @param {object} template  config à enregistrer
 * @param {string} [sourceTemplateId]  modèle de la galerie dont on part, s'il
 *   vient d'être choisi. Pour un modèle code choisi par un non-admin, le code
 *   envoyé doit être celui du modèle en base, textes, images, liens et
 *   couleurs mis à part (voir isVisualEdit).
 */
export async function saveTemplate(eventId, template, sourceTemplateId) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  await assertCanEditEvent(eventId);

  const event = await prisma.event.findFirst({
    where: { id: eventId },
    include: { templateCopy: true },
  });
  if (!event) throw new Error("Event not found");

  let source = null;
  if (sourceTemplateId) {
    source = await prisma.template.findFirst({
      where: { id: sourceTemplateId, ...visibleTemplatesWhere(user) },
    });
    if (!source) throw new Error("Modèle introuvable");
  }

  // Un non-admin ne peut pas écrire de code. Un template code n'est accepté
  // de sa part que s'il ne diffère du code en base (modèle choisi, sinon la
  // copie actuelle) que par ses textes, images, liens et couleurs : c'est ce
  // que produit l'éditeur visuel. Réglages d'ouverture et musique sont des
  // données, validées comme telles.
  const base =
    source?.config ??
    event.templateCopy?.config ??
    event.invitationTemplate ??
    null;
  const config = validateTemplateConfig(template, {
    allowCode: user.role === "admin",
    base,
  });

  const data = {
    config,
    ...(source && {
      sourceTemplateId: source.id,
      name: `${source.name} (copie - ${event.title})`,
    }),
  };

  if (event.templateCopy) {
    await prisma.template.update({
      where: { id: event.templateCopy.id },
      data,
    });
  } else {
    await prisma.template.create({
      data: {
        userId: event.userId,
        eventId: event.id,
        name: `Copie de ${event.title}`,
        ...data,
      },
    });
  }

  return { success: true };
}

export async function assignTemplateToEvent(eventId, templateId) {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  await assertCanEditEvent(eventId);

  const event = await prisma.event.findFirst({
    where: { id: eventId },
    include: { templateCopy: true },
  });
  if (!event) throw new Error("Event not found");

  const template = await prisma.template.findFirst({
    where: { id: templateId, ...visibleTemplatesWhere(user) },
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
