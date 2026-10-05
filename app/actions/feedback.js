"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/app/actions/auth";
import { PUBLIC_TEMPLATE_WHERE } from "@/lib/landing/data";
import {
  COMMENT_AUTHOR,
  VOTE_KINDS,
  commentView,
  voteSummary,
} from "@/lib/templates/feedback";
import { MAX_COMMENTS_PER_TEMPLATE } from "@/lib/site";

/**
 * Avis sur les modèles publics (/templates/[id]) : un vote par personne
 * (j'aime ou je n'aime pas) et des commentaires. Il faut un compte pour
 * l'un comme pour l'autre. Chacun supprime ses commentaires, un admin
 * supprime n'importe lequel.
 *
 * Les refus attendus reviennent sous forme de code ({ error }) : en
 * production, le message d'une exception n'atteint pas le navigateur.
 *   "auth"      pas de session (ou session expirée)
 *   "not_found" modèle non public, commentaire introuvable
 *   "invalid"   vote inconnu
 *   "empty"     commentaire vide
 *   "limit"     trop de commentaires sur ce modèle
 */

const COMMENT_MAX = 500;

async function isPublicTemplate(templateId) {
  if (typeof templateId !== "string" || templateId.length > 64) return false;
  const template = await prisma.template.findFirst({
    where: { id: templateId, ...PUBLIC_TEMPLATE_WHERE },
    select: { id: true },
  });
  return Boolean(template);
}

/**
 * Le rôle de la session peut dater de quelques minutes (cache du cookie) :
 * un droit de modération se vérifie en base.
 */
async function isAdmin(user) {
  if (user.role !== "admin") return false;
  const fresh = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { role: true, suspended: true },
  });
  return fresh?.role === "admin" && !fresh.suspended;
}

/**
 * Vote sur un modèle. `kind` null retire le vote ; un nouveau vote remplace
 * le précédent.
 *
 * @param {string} templateId
 * @param {"like"|"dislike"|null} kind
 * @returns {Promise<{ likes: number, dislikes: number, myVote: string|null } | { error: string }>}
 */
export async function voteTemplate(templateId, kind) {
  const user = await getSession();
  if (!user) return { error: "auth" };
  if (kind !== null && !VOTE_KINDS.includes(kind)) return { error: "invalid" };
  if (!(await isPublicTemplate(templateId))) return { error: "not_found" };

  if (kind) {
    await prisma.templateVote.upsert({
      where: { templateId_userId: { templateId, userId: user.userId } },
      create: { templateId, userId: user.userId, kind },
      update: { kind },
    });
  } else {
    await prisma.templateVote.deleteMany({
      where: { templateId, userId: user.userId },
    });
  }

  return voteSummary(templateId, user.userId);
}

/**
 * Publie un commentaire sur un modèle.
 *
 * @returns {Promise<{ comment: object } | { error: string }>}
 */
export async function postTemplateComment(templateId, text) {
  const user = await getSession();
  if (!user) return { error: "auth" };

  const message = String(text ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, COMMENT_MAX);
  if (!message) return { error: "empty" };
  if (!(await isPublicTemplate(templateId))) return { error: "not_found" };

  const count = await prisma.templateComment.count({
    where: { templateId, userId: user.userId },
  });
  if (count >= MAX_COMMENTS_PER_TEMPLATE) return { error: "limit" };

  const comment = await prisma.templateComment.create({
    data: { templateId, userId: user.userId, message },
    include: COMMENT_AUTHOR,
  });
  return { comment: commentView(comment, user) };
}

/**
 * Supprime un commentaire : le sien, ou n'importe lequel pour un admin.
 *
 * @returns {Promise<{ success: true } | { error: string }>}
 */
export async function deleteTemplateComment(commentId) {
  const user = await getSession();
  if (!user) return { error: "auth" };

  const id = String(commentId ?? "").slice(0, 64);
  const where = (await isAdmin(user)) ? { id } : { id, userId: user.userId };
  const { count } = await prisma.templateComment.deleteMany({ where });
  return count > 0 ? { success: true } : { error: "not_found" };
}
