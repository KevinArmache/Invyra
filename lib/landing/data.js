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

/**
 * Modèles de la vitrine : ceux mis en avant par un admin (étoile). Tant
 * qu'aucun ne l'est, on montre les modèles terminés, pour que la section ne
 * reste jamais vide.
 *
 * @returns {Promise<Array<{ id: string, name: string, category: string|null, config: object }>>}
 */
export async function getShowcaseTemplates() {
  const select = { id: true, name: true, category: true, config: true };
  try {
    const featured = await prisma.template.findMany({
      where: { featured: true, eventId: null },
      select,
      orderBy: { updatedAt: "desc" },
      take: 12,
    });
    if (featured.length > 0) return featured;

    return await prisma.template.findMany({
      where: { status: "completed", eventId: null },
      select,
      orderBy: { updatedAt: "desc" },
      take: 6,
    });
  } catch (error) {
    console.error("Modèles de la vitrine indisponibles :", error.message);
    return [];
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
