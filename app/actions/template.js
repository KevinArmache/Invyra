"use server";

import { prisma } from "@/lib/prisma";
import { getSession, isEventOwnerOrAdmin } from "@/app/actions/auth";
import { getMyCollaboratorRole } from "@/app/actions/collaborator";
import { validateTemplateConfig } from "@/lib/templates/validation";
import { normalizeCategory } from "@/lib/templates/categories";

const TEMPLATE_STATUSES = ["draft", "in_progress", "completed"];

/** Modèles par page dans la galerie (/dashboard/templates). */
const TEMPLATES_PAGE_SIZE = 8;

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
 * Modèles réutilisables visibles par tout utilisateur connecté : toute la
 * galerie, quel que soit le statut. Les copies propres aux événements
 * (eventId) en sont exclues : elles portent les textes d'un client.
 */
const VISIBLE_TEMPLATES_WHERE = { eventId: null };

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
export async function saveUserTemplate(name, templateConfig, status, category) {
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
      category: normalizeCategory(category),
      config,
    },
  });

  return tmpl;
}

/** Tous les modèles visibles (choix du modèle d'un événement). */
export async function getTemplates() {
  const user = await getSession();
  if (!user) return [];

  return await prisma.template.findMany({
    where: VISIBLE_TEMPLATES_WHERE,
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

/**
 * Une page de la galerie des modèles, filtrée par catégorie et par nom.
 *
 * Chaque carte embarque la config complète du modèle (jusqu'à plusieurs
 * centaines de Ko de HTML pour un modèle code) : on n'envoie au navigateur que
 * celles de la page affichée.
 *
 * @param {object} options
 * @param {number} [options.page=1]
 * @param {string} [options.category]  clé de catégorie ; absente = toutes
 * @param {string} [options.query]     recherche dans le nom
 * @returns {Promise<{ templates, total, page, pageCount, categories, totalAll }>}
 *   `categories` : `[{ key, count }]` des catégories qui ont au moins un
 *   modèle visible (pour les filtres) ; `totalAll` : modèles visibles sans
 *   filtre (pour distinguer « aucun modèle » de « aucun résultat »).
 */
export async function getTemplatesPage({ page = 1, category, query } = {}) {
  const user = await getSession();
  if (!user) {
    return { templates: [], total: 0, page: 1, pageCount: 1, categories: [], totalAll: 0 };
  }

  const visible = VISIBLE_TEMPLATES_WHERE;
  const safeCategory = normalizeCategory(category);
  const search = typeof query === "string" ? query.trim().slice(0, 100) : "";
  const where = {
    AND: [
      visible,
      ...(safeCategory ? [{ category: safeCategory }] : []),
      ...(search ? [{ name: { contains: search, mode: "insensitive" } }] : []),
    ],
  };

  const [total, groups] = await Promise.all([
    prisma.template.count({ where }),
    prisma.template.groupBy({
      by: ["category"],
      where: visible,
      _count: { _all: true },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / TEMPLATES_PAGE_SIZE));
  const current = Math.min(Math.max(1, Math.floor(Number(page)) || 1), pageCount);

  const templates = await prisma.template.findMany({
    where,
    include: { _count: { select: { eventCopies: true } } },
    orderBy: { createdAt: "desc" },
    skip: (current - 1) * TEMPLATES_PAGE_SIZE,
    take: TEMPLATES_PAGE_SIZE,
  });

  return {
    templates,
    total,
    page: current,
    pageCount,
    categories: groups
      .filter((group) => normalizeCategory(group.category))
      .map((group) => ({ key: group.category, count: group._count._all })),
    totalAll: groups.reduce((sum, group) => sum + group._count._all, 0),
  };
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

export async function updateUserTemplate(templateId, name, templateConfig, status, category) {
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

  // Seuls les admins écrivent du code ; les autres gardent l'éditeur visuel
  // (textes, images, liens, couleurs).
  const config = validateTemplateConfig(templateConfig, {
    allowCode: user.role === "admin",
    base: existing.config,
  });

  const tmpl = await prisma.template.update({
    where: { id: templateId },
    data: {
      name,
      status: safeStatus,
      category: normalizeCategory(category),
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
    where: { id: templateId, ...VISIBLE_TEMPLATES_WHERE },
  });
  if (!source) throw new Error("Modèle non trouvé");

  // La copie est revalidée comme tout modèle écrit en base.
  const config = validateTemplateConfig(source.config, {
    allowCode: user.role === "admin",
  });

  return await prisma.template.create({
    data: {
      userId: user.userId,
      name: `${source.name} (copie)`.slice(0, 200),
      status: "draft",
      category: source.category,
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
// Save the invitation of an event
// ──────────────────────────────────────────────

/**
 * Enregistre l'invitation d'un événement (sa copie de modèle).
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
      where: { id: sourceTemplateId, ...VISIBLE_TEMPLATES_WHERE },
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
    where: { id: templateId, ...VISIBLE_TEMPLATES_WHERE },
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
