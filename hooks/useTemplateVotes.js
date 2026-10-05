"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { voteTemplate } from "@/app/actions/feedback";
import { useTranslation } from "@/lib/i18n/Context";

/**
 * Votes après le passage de `current.myVote` à `next`, affichés avant la
 * réponse du serveur : compteurs, et la personne connectée ajoutée en tête
 * des « j'aime » ou retirée.
 */
function applyVote(current, next, viewerName) {
  const counts = { likes: current.likes, dislikes: current.dislikes };
  if (current.myVote === "like") counts.likes -= 1;
  if (current.myVote === "dislike") counts.dislikes -= 1;
  if (next === "like") counts.likes += 1;
  if (next === "dislike") counts.dislikes += 1;

  const others = current.likers.filter((liker) => !liker.mine);
  const me = { id: "me", name: viewerName, mine: true, votedAt: new Date() };
  return {
    ...current,
    ...counts,
    myVote: next,
    likers: next === "like" ? [me, ...others] : others,
  };
}

/**
 * État des votes d'un modèle sur sa page publique. Le vote s'affiche tout
 * de suite, puis prend les votes renvoyés par le serveur ; s'il échoue,
 * l'affichage revient à l'état précédent.
 *
 * @param {object}  options.initial  voir getTemplateVotes (lib/templates/feedback.js)
 * @param {string|null} options.viewerName  nom public de la personne connectée
 */
export function useTemplateVotes({ templateId, initial, isAuthenticated, viewerName }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [votes, setVotes] = useState(initial);
  // Un vote à la fois : un double clic ne doit pas croiser deux requêtes.
  const voting = useRef(false);

  function promptLogin() {
    const loginHref = `/login?redirect=${encodeURIComponent(`/templates/${templateId}`)}`;
    toast(t("template_feedback.login_required"), {
      action: {
        label: t("template_feedback.login"),
        onClick: () => router.push(loginHref),
      },
    });
  }

  async function vote(kind) {
    if (!isAuthenticated) {
      promptLogin();
      return;
    }
    if (voting.current) return;
    voting.current = true;

    const previous = votes;
    const next = previous.myVote === kind ? null : kind;
    setVotes(applyVote(previous, next, viewerName));
    try {
      const result = await voteTemplate(templateId, next);
      if (result.error) {
        setVotes(previous);
        if (result.error === "auth") promptLogin();
        else if (result.error === "not_found") {
          toast.error(t("template_feedback.unavailable"));
        } else toast.error(t("common.error"));
        return;
      }
      setVotes(result);
    } catch {
      setVotes(previous);
      toast.error(t("common.error"));
    } finally {
      voting.current = false;
    }
  }

  return { votes, vote };
}
