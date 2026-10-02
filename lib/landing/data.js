import { prisma } from "@/lib/prisma";

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

/** Modèles par page dans la vitrine : deux rangées de trois. */
export const SHOWCASE_PAGE_SIZE = 6;

/**
 * Modèles de la vitrine, page par page : ceux mis en avant par un admin
 * (étoile). Tant qu'aucun ne l'est, on montre les modèles terminés, pour que
 * la section ne reste jamais vide.
 *
 * `first` est le premier modèle de la liste quelle que soit la page : la
 * démonstration de l'ouverture ne change pas quand on feuillette.
 *
 * @param {{ page?: number|string }} [options]  page demandée, bornée
 * @returns {Promise<{
 *   templates: Array<{ id: string, name: string, category: string|null, config: object }>,
 *   page: number, pageCount: number, total: number, first: object|null
 * }>}
 */
export async function getShowcaseTemplates({ page = 1 } = {}) {
  const select = { id: true, name: true, category: true, config: true };
  // L'identifiant départage les dates égales : une pagination stable.
  const orderBy = [{ updatedAt: "desc" }, { id: "asc" }];
  const empty = { templates: [], page: 1, pageCount: 1, total: 0, first: null };

  try {
    let where = { featured: true, eventId: null };
    let total = await prisma.template.count({ where });
    if (total === 0) {
      where = { status: "completed", eventId: null };
      total = await prisma.template.count({ where });
    }
    if (total === 0) return empty;

    const pageCount = Math.ceil(total / SHOWCASE_PAGE_SIZE);
    const current = Math.min(
      Math.max(1, Math.trunc(Number(page)) || 1),
      pageCount,
    );
    const [templates, first] = await Promise.all([
      prisma.template.findMany({
        where,
        select,
        orderBy,
        skip: (current - 1) * SHOWCASE_PAGE_SIZE,
        take: SHOWCASE_PAGE_SIZE,
      }),
      current === 1
        ? null
        : prisma.template.findFirst({ where, select, orderBy }),
    ]);

    return {
      templates,
      page: current,
      pageCount,
      total,
      first: first ?? templates[0] ?? null,
    };
  } catch (error) {
    console.error("Modèles de la vitrine indisponibles :", error.message);
    return empty;
  }
}

/**
 * Condition d'un modèle visible publiquement : un modèle de la galerie (pas
 * la copie d'un événement, qui porte les textes d'un client), publié
 * (terminé) ou mis en avant sur l'accueil. Les brouillons restent privés.
 */
const PUBLIC_TEMPLATE_WHERE = {
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
