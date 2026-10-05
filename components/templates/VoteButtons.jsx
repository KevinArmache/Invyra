"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";

import { useTranslation } from "@/lib/i18n/Context";

const chip = (active) =>
  `inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs transition-[color,background-color,border-color,box-shadow,translate] duration-300 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
    active
      ? "border-gold bg-gold/10 text-ink-50 shadow-[0_0_14px_-4px_var(--gold)]"
      : "border-border text-ink-400 hover:border-gold/30 hover:text-ink-100"
  }`;

/**
 * « J'aime » et « Je n'aime pas » d'un modèle, avec leurs compteurs. Un
 * clic sur le vote actif le retire ; l'autre bouton le remplace.
 *
 * @param {number} props.likes
 * @param {number} props.dislikes
 * @param {"like"|"dislike"|null} props.myVote
 * @param {(kind: "like"|"dislike") => void} props.onVote
 */
export default function VoteButtons({
  likes,
  dislikes,
  myVote,
  onVote,
  className = "",
}) {
  const { t } = useTranslation();
  const items = [
    { kind: "like", Icon: ThumbsUp, count: likes, label: t("template_feedback.like") },
    {
      kind: "dislike",
      Icon: ThumbsDown,
      count: dislikes,
      label: t("template_feedback.dislike"),
    },
  ];

  return (
    <div
      role="group"
      aria-label={t("template_feedback.vote_label")}
      className={`flex items-center gap-2 ${className}`}
    >
      {items.map(({ kind, Icon, count, label }) => {
        const active = myVote === kind;
        return (
          <button
            key={kind}
            type="button"
            aria-pressed={active}
            title={label}
            onClick={() => onVote(kind)}
            className={chip(active)}
          >
            <Icon
              key={String(active)}
              className={`h-3.5 w-3.5 ${active ? "animate-pop text-gold" : ""}`}
              fill={active ? "currentColor" : "none"}
              fillOpacity={active ? 0.2 : 0}
              aria-hidden="true"
            />
            <span className="sr-only">{label}</span>
            <span data-numeric>{count}</span>
          </button>
        );
      })}
    </div>
  );
}
