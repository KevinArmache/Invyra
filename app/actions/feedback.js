"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/app/actions/auth";
import { PUBLIC_TEMPLATE_WHERE } from "@/lib/landing/data";
import { VOTE_KINDS, readTemplateVotes } from "@/lib/templates/feedback";

/**
 * Votes sur les modèles publics (/templates/[id]) : un seul par personne,
 * j'aime ou je n'aime pas. Il faut un compte pour voter.
 *
 * Les refus attendus reviennent sous forme de code ({ error }) : en
 * production, le message d'une exception n'atteint pas le navigateur.
 *   "auth"      pas de session (ou session expirée)
 *   "not_found" modèle non public
 *   "invalid"   vote inconnu
 */

async function isPublicTemplate(templateId) {
  if (typeof templateId !== "string" || templateId.length > 64) return false;
  const template = await prisma.template.findFirst({
    where: { id: templateId, ...PUBLIC_TEMPLATE_WHERE },
    select: { id: true },
  });
  return Boolean(template);
}

/**
 * Vote sur un modèle. `kind` null retire le vote ; un nouveau vote remplace
 * le précédent. Renvoie les votes à jour, avec la liste des votants (voir
 * readTemplateVotes).
 *
 * @param {string} templateId
 * @param {"like"|"dislike"|null} kind
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

  return readTemplateVotes(templateId, {
    userId: user.userId,
    role: user.role,
  });
}
