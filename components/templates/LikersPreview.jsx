"use client";

import { Users } from "lucide-react";

import InitialAvatar from "@/components/common/InitialAvatar";
import { useTranslation } from "@/lib/i18n/Context";

const button =
  "inline-flex min-w-0 items-center gap-2 rounded-full text-left text-xs text-ink-300 transition-colors duration-300 hover:text-ink-50 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none";

/**
 * Aperçu de qui aime un modèle : les pastilles des derniers votants, et
 * « Aimé par Marie D. et 23 autres personnes » (écrit, ou lu seulement par
 * les lecteurs d'écran quand la place manque). Un clic ouvre la liste.
 *
 * Sans « j'aime », rien ne s'affiche, sauf pour un admin qui a des « je
 * n'aime pas » à consulter.
 *
 * @param {object}  props.votes     voir getTemplateVotes
 * @param {boolean} [props.withText]
 * @param {(event: Event) => void} props.onOpen
 */
export default function LikersPreview({ votes, onOpen, withText = false, className = "" }) {
  const { t } = useTranslation();
  const f = (key) => t(`template_feedback.${key}`);

  if (votes.likes === 0) {
    if (!votes.isAdmin || votes.dislikes === 0) return null;
    return (
      <button type="button" onClick={onOpen} className={`${button} ${className}`}>
        <Users className="h-3.5 w-3.5 text-gold/80" aria-hidden="true" />
        {f("see_votes")}
      </button>
    );
  }

  const first = votes.likers[0];
  const firstName = first?.mine ? f("you_inline") : (first?.name ?? f("anonymous"));
  const others = votes.likes - 1;
  const sentence = f(
    others === 0
      ? "liked_by_one"
      : others === 1
        ? "liked_by_more_one"
        : "liked_by_more_other",
  )
    .replace("{name}", firstName)
    .replace("{count}", String(others));

  return (
    <button
      type="button"
      onClick={onOpen}
      title={f("see_likers")}
      className={`${button} ${className}`}
    >
      <span className="flex shrink-0 -space-x-2">
        {votes.likers.slice(0, 3).map((liker) => (
          <InitialAvatar
            key={liker.id}
            name={liker.name}
            className="h-6 w-6 bg-ink-800 text-[11px] ring-2 ring-ink-900"
          />
        ))}
      </span>
      {withText ? (
        <span className="truncate">{sentence}</span>
      ) : (
        <span className="sr-only">{sentence}</span>
      )}
    </button>
  );
}
