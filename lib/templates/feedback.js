import { prisma } from "@/lib/prisma";

/**
 * Votes sur les modèles publics : j'aime / je n'aime pas. Lectures côté
 * serveur seulement, pour la page d'un modèle, les cartes de la collection
 * et les Server Actions de app/actions/feedback.js.
 *
 * Volontairement pas un fichier "use server" : ces fonctions ne doivent pas
 * devenir des points d'entrée appelables depuis le navigateur.
 *
 * Qui voit quoi :
 * - tout le monde voit les compteurs et la liste des « j'aime », sous un nom
 *   public (prénom et initiale du nom) ;
 * - un admin voit en plus le nom complet et l'email de chaque votant, et la
 *   liste des « je n'aime pas ».
 *
 * `viewer` est la personne qui regarde : { userId, role }, ou null.
 */

export const VOTE_KINDS = ["like", "dislike"];

/** Votants chargés par liste : les plus récents. */
const VOTERS_LIMIT = 100;

const VOTER = {
  id: true,
  userId: true,
  updatedAt: true,
  user: { select: { name: true, email: true } },
};

/**
 * Nom public d'un votant : le prénom et l'initiale du nom (« Marie D. »).
 * Le nom complet et l'email ne quittent le serveur que pour un admin.
 */
export function publicName(name) {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  const [first, ...rest] = parts;
  const last = rest.at(-1);
  return last ? `${first} ${last.charAt(0).toUpperCase()}.` : first;
}

function voterView(vote, viewer, isAdmin) {
  return {
    id: vote.id,
    name: publicName(vote.user.name),
    mine: Boolean(viewer) && vote.userId === viewer.userId,
    votedAt: vote.updatedAt,
    ...(isAdmin && { fullName: vote.user.name ?? null, email: vote.user.email }),
  };
}

/** Le votant connecté d'abord, puis les plus récents. */
function mineFirst(voters) {
  return [...voters].sort((a, b) => Number(b.mine) - Number(a.mine));
}

/**
 * Le rôle d'une session peut dater de quelques minutes (cache du cookie) :
 * l'accès aux emails des votants se vérifie en base.
 */
export async function viewerIsAdmin(viewer) {
  if (viewer?.role !== "admin") return false;
  const fresh = await prisma.user.findUnique({
    where: { id: viewer.userId },
    select: { role: true, suspended: true },
  });
  return fresh?.role === "admin" && !fresh.suspended;
}

async function votersOf(templateId, kind, viewer, isAdmin) {
  const votes = await prisma.templateVote.findMany({
    where: { templateId, kind },
    select: VOTER,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: VOTERS_LIMIT,
  });
  return mineFirst(votes.map((vote) => voterView(vote, viewer, isAdmin)));
}

/**
 * Votes d'un modèle tels que `viewer` peut les voir. Lève une erreur si la
 * base ne répond pas (voir getTemplateVotes pour la version tolérante).
 *
 * @returns {Promise<{
 *   likes: number, dislikes: number, myVote: "like"|"dislike"|null,
 *   likers: Array<object>, dislikers: Array<object>, isAdmin: boolean
 * }>}
 *   `dislikers` est vide sauf pour un admin.
 */
export async function readTemplateVotes(templateId, viewer) {
  const isAdmin = await viewerIsAdmin(viewer);
  const [groups, mine, likers, dislikers] = await Promise.all([
    prisma.templateVote.groupBy({
      by: ["kind"],
      where: { templateId },
      _count: { _all: true },
    }),
    viewer
      ? prisma.templateVote.findUnique({
          where: { templateId_userId: { templateId, userId: viewer.userId } },
          select: { kind: true },
        })
      : null,
    votersOf(templateId, "like", viewer, isAdmin),
    isAdmin ? votersOf(templateId, "dislike", viewer, isAdmin) : [],
  ]);
  const count = (kind) =>
    groups.find((group) => group.kind === kind)?._count._all ?? 0;

  return {
    likes: count("like"),
    dislikes: count("dislike"),
    myVote: VOTE_KINDS.includes(mine?.kind) ? mine.kind : null,
    likers,
    dislikers,
    isAdmin,
  };
}

/**
 * Votes d'un modèle pour sa page publique. Une base indisponible ne doit
 * pas empêcher la page de s'afficher : on renvoie alors des votes vides.
 */
export async function getTemplateVotes(templateId, viewer) {
  try {
    return await readTemplateVotes(templateId, viewer);
  } catch (error) {
    console.error("Votes du modèle indisponibles :", error.message);
    return {
      likes: 0,
      dislikes: 0,
      myVote: null,
      likers: [],
      dislikers: [],
      isAdmin: false,
    };
  }
}

/**
 * Ajoute à chaque modèle son nombre de « j'aime » (`likeCount`) pour les
 * cartes de la vitrine et de la collection. Si la lecture échoue, les
 * modèles reviennent sans compteur et les cartes n'en affichent pas.
 */
export async function withLikeCounts(templates) {
  if (templates.length === 0) return templates;

  try {
    const groups = await prisma.templateVote.groupBy({
      by: ["templateId"],
      where: {
        templateId: { in: templates.map((template) => template.id) },
        kind: "like",
      },
      _count: { _all: true },
    });
    const counts = new Map(
      groups.map((group) => [group.templateId, group._count._all]),
    );

    return templates.map((template) => ({
      ...template,
      likeCount: counts.get(template.id) ?? 0,
    }));
  } catch (error) {
    console.error("Compteurs de votes indisponibles :", error.message);
    return templates;
  }
}
