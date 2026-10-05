import { prisma } from "@/lib/prisma";
import { normalizeCategory } from "@/lib/templates/categories";
import { withFeedbackCounts } from "@/lib/templates/feedback";

/**
 * Données publiques de la page d'accueil.
 *
 * Volontairement pas des Server Actions : un fichier "use server" exposerait
 * ces fonctions comme points d'entrée appelables par n'importe qui. Ici, elles
 * ne sont importées que par des Server Components.
 *
 * Rien d'identifiant ne sort d'ici : pour les dates, seulement le jour et le
 * nombre d'événements ; pour les modèles, seulement ceux mis en avant.
 */

const BUSINESS_TIME_ZONE = "Europe/Paris";

/** Jour courant (AAAA-MM-JJ) dans le fuseau de l'activité. */
export function todayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
  }).format(new Date());
}

/**
 * Jours déjà pris par au moins un événement, à partir d'aujourd'hui.
 * Plusieurs événements peuvent partager une date : on renvoie leur nombre,
 * la date reste réservable.
 *
 * @returns {Promise<Array<{ date: string, count: number }>>}
 */
export async function getBookedDates() {
  const today = todayKey();
  try {
    const events = await prisma.event.findMany({
      where: {
        eventDate: { gte: new Date(`${today}T00:00:00.000Z`) },
        status: { not: "archived" },
      },
      select: { eventDate: true },
    });

    // Les dates sont enregistrées à minuit UTC (voir createEvent) : le jour
    // se lit donc en UTC.
    const counts = new Map();
    for (const { eventDate } of events) {
      const key = eventDate.toISOString().slice(0, 10);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts]
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    // La page d'accueil doit s'afficher même si la base est indisponible.
    console.error("Dates réservées indisponibles :", error.message);
    return [];
  }
}

/** Modèles dans la vitrine de l'accueil : deux rangées de trois. */
export const SHOWCASE_SIZE = 6;

/** Modèles par page dans la collection (/templates) : 2, 3 ou 4 colonnes. */
export const COLLECTION_PAGE_SIZE = 12;

const SHOWCASE_SELECT = { id: true, name: true, category: true, config: true };
// L'identifiant départage les dates égales : une pagination stable.
const SHOWCASE_ORDER = [{ updatedAt: "desc" }, { id: "asc" }];
const FEATURED_WHERE = { featured: true, eventId: null };

/**
 * Vitrine de l'accueil : les premiers modèles mis en avant par un admin
 * (étoile). Tant qu'aucun ne l'est, on montre les modèles terminés, pour que
 * la section ne reste jamais vide. La suite se feuillette sur /templates.
 *
 * `first` sert à la démonstration de l'ouverture.
 *
 * @returns {Promise<{
 *   templates: Array<{ id: string, name: string, category: string|null, config: object,
 *     likeCount?: number, commentCount?: number }>,
 *   total: number, first: object|null, isFeatured: boolean
 * }>}
 *   `isFeatured` : les modèles sont bien ceux mis en avant (et non le repli),
 *   la collection /templates a donc quelque chose à montrer.
 */
export async function getShowcaseTemplates() {
  const empty = { templates: [], total: 0, first: null, isFeatured: false };

  try {
    let where = FEATURED_WHERE;
    let total = await prisma.template.count({ where });
    const isFeatured = total > 0;
    if (!isFeatured) {
      where = { status: "completed", eventId: null };
      total = await prisma.template.count({ where });
    }
    if (total === 0) return empty;

    const templates = await withFeedbackCounts(
      await prisma.template.findMany({
        where,
        select: SHOWCASE_SELECT,
        orderBy: SHOWCASE_ORDER,
        take: SHOWCASE_SIZE,
      }),
    );

    return { templates, total, first: templates[0] ?? null, isFeatured };
  } catch (error) {
    console.error("Modèles de la vitrine indisponibles :", error.message);
    return empty;
  }
}

/**
 * Collection publique (/templates) : uniquement les modèles mis en avant
 * par un admin, page par page, filtrables par catégorie. Pas de repli ici :
 * sans modèle étoilé, la collection est vide.
 *
 * @param {{ page?: number|string, category?: string }} [options]
 * @returns {Promise<{
 *   templates: Array<{ id: string, name: string, category: string|null, config: object,
 *     likeCount?: number, commentCount?: number }>,
 *   page: number, pageCount: number, total: number, totalAll: number,
 *   category: string|null, categories: string[]
 * }>}
 *   `total` : modèles du filtre courant ; `totalAll` : toute la collection ;
 *   `categories` : catégories qui ont au moins un modèle étoilé.
 */
export async function getCollectionTemplates({ page = 1, category } = {}) {
  const safeCategory = normalizeCategory(category);
  const empty = {
    templates: [],
    page: 1,
    pageCount: 1,
    total: 0,
    totalAll: 0,
    category: safeCategory,
    categories: [],
  };

  try {
    const where = safeCategory
      ? { ...FEATURED_WHERE, category: safeCategory }
      : FEATURED_WHERE;
    const [total, groups] = await Promise.all([
      prisma.template.count({ where }),
      prisma.template.groupBy({
        by: ["category"],
        where: FEATURED_WHERE,
        _count: { _all: true },
      }),
    ]);

    const pageCount = Math.max(1, Math.ceil(total / COLLECTION_PAGE_SIZE));
    const current = Math.min(
      Math.max(1, Math.trunc(Number(page)) || 1),
      pageCount,
    );
    const templates =
      total === 0
        ? []
        : await withFeedbackCounts(
            await prisma.template.findMany({
              where,
              select: SHOWCASE_SELECT,
              orderBy: SHOWCASE_ORDER,
              skip: (current - 1) * COLLECTION_PAGE_SIZE,
              take: COLLECTION_PAGE_SIZE,
            }),
          );

    return {
      templates,
      page: current,
      pageCount,
      total,
      totalAll: groups.reduce((sum, group) => sum + group._count._all, 0),
      category: safeCategory,
      categories: groups
        .map((group) => normalizeCategory(group.category))
        .filter(Boolean),
    };
  } catch (error) {
    console.error("Collection de modèles indisponible :", error.message);
    return empty;
  }
}

/**
 * Condition d'un modèle visible publiquement : un modèle de la galerie (pas
 * la copie d'un événement, qui porte les textes d'un client), publié
 * (terminé) ou mis en avant sur l'accueil. Les brouillons restent privés.
 * C'est aussi la condition pour voter ou commenter (app/actions/feedback.js).
 */
export const PUBLIC_TEMPLATE_WHERE = {
  eventId: null,
  OR: [{ status: "completed" }, { featured: true }],
};

/**
 * Un modèle partageable, pour sa page publique (/templates/[id]).
 *
 * @returns {Promise<{ id: string, name: string, category: string|null, config: object } | null>}
 *   null si le modèle n'existe pas ou n'est pas public
 */
export async function getPublicTemplate(id) {
  if (typeof id !== "string" || id.length > 64) return null;
  return prisma.template.findFirst({
    where: { id, ...PUBLIC_TEMPLATE_WHERE },
    select: { id: true, name: true, category: true, config: true },
  });
}

/**
 * Modèles publics, pour le sitemap. Une base indisponible ne doit pas
 * empêcher le sitemap de répondre.
 *
 * @returns {Promise<Array<{ id: string, updatedAt: Date }>>}
 */
export async function getPublicTemplateIds() {
  try {
    return await prisma.template.findMany({
      where: PUBLIC_TEMPLATE_WHERE,
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });
  } catch (error) {
    console.error("Modèles publics indisponibles :", error.message);
    return [];
  }
}
