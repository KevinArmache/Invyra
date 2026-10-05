import { prisma } from "@/lib/prisma";

/**
 * Avis sur les modèles publics : votes (j'aime / je n'aime pas) et
 * commentaires. Lectures côté serveur seulement, pour la page d'un modèle,
 * les cartes de la collection et les Server Actions de
 * app/actions/feedback.js.
 *
 * Volontairement pas un fichier "use server" : ces fonctions ne doivent pas
 * devenir des points d'entrée appelables depuis le navigateur.
 *
 * `viewer` est la personne qui regarde : { userId, role }, ou null.
 */

export const VOTE_KINDS = ["like", "dislike"];

/** Commentaires chargés sur la page d'un modèle : les plus récents. */
const COMMENTS_LIMIT = 100;

export const COMMENT_AUTHOR = { user: { select: { name: true } } };

/**
 * Nom affiché d'un auteur : le prénom et l'initiale du nom (« Marie D. »).
 * Le nom complet et l'email ne quittent pas le serveur.
 */
function publicName(name) {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  const [first, ...rest] = parts;
  const last = rest.at(-1);
  return last ? `${first} ${last.charAt(0).toUpperCase()}.` : first;
}

export function commentView(comment, viewer) {
  const mine = Boolean(viewer) && comment.userId === viewer.userId;
  return {
    id: comment.id,
    message: comment.message,
    name: publicName(comment.user.name),
    createdAt: comment.createdAt,
    mine,
    canDelete: mine || viewer?.role === "admin",
  };
}

/**
 * Compteurs de votes d'un modèle et vote de la personne connectée.
 *
 * @returns {Promise<{ likes: number, dislikes: number, myVote: "like"|"dislike"|null }>}
 */
export async function voteSummary(templateId, userId) {
  const [groups, mine] = await Promise.all([
    prisma.templateVote.groupBy({
      by: ["kind"],
      where: { templateId },
      _count: { _all: true },
    }),
    userId
      ? prisma.templateVote.findUnique({
          where: { templateId_userId: { templateId, userId } },
          select: { kind: true },
        })
      : null,
  ]);
  const count = (kind) =>
    groups.find((group) => group.kind === kind)?._count._all ?? 0;

  return {
    likes: count("like"),
    dislikes: count("dislike"),
    myVote: VOTE_KINDS.includes(mine?.kind) ? mine.kind : null,
  };
}

/**
 * Avis d'un modèle pour sa page publique. Une base indisponible ne doit pas
 * empêcher la page de s'afficher : on renvoie alors un avis vide.
 *
 * @returns {Promise<{
 *   likes: number, dislikes: number, myVote: string|null,
 *   comments: Array<object>, commentCount: number
 * }>}
 */
export async function getTemplateFeedback(templateId, viewer) {
  try {
    const [votes, comments, commentCount] = await Promise.all([
      voteSummary(templateId, viewer?.userId),
      prisma.templateComment.findMany({
        where: { templateId },
        include: COMMENT_AUTHOR,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: COMMENTS_LIMIT,
      }),
      prisma.templateComment.count({ where: { templateId } }),
    ]);
    return {
      ...votes,
      comments: comments.map((comment) => commentView(comment, viewer)),
      commentCount,
    };
  } catch (error) {
    console.error("Avis du modèle indisponibles :", error.message);
    return { likes: 0, dislikes: 0, myVote: null, comments: [], commentCount: 0 };
  }
}

/**
 * Ajoute à chaque modèle ses compteurs publics (`likeCount`,
 * `commentCount`) pour les cartes de la vitrine et de la collection. Si la
 * lecture échoue, les modèles reviennent sans compteurs et les cartes n'en
 * affichent pas.
 */
export async function withFeedbackCounts(templates) {
  if (templates.length === 0) return templates;
  const templateId = { in: templates.map((template) => template.id) };

  try {
    const [likes, comments] = await Promise.all([
      prisma.templateVote.groupBy({
        by: ["templateId"],
        where: { templateId, kind: "like" },
        _count: { _all: true },
      }),
      prisma.templateComment.groupBy({
        by: ["templateId"],
        where: { templateId },
        _count: { _all: true },
      }),
    ]);
    const likeCounts = new Map(
      likes.map((group) => [group.templateId, group._count._all]),
    );
    const commentCounts = new Map(
      comments.map((group) => [group.templateId, group._count._all]),
    );

    return templates.map((template) => ({
      ...template,
      likeCount: likeCounts.get(template.id) ?? 0,
      commentCount: commentCounts.get(template.id) ?? 0,
    }));
  } catch (error) {
    console.error("Compteurs d'avis indisponibles :", error.message);
    return templates;
  }
}
