"use client";

import VoteButtons from "@/components/templates/VoteButtons";
import { useTemplateVotes } from "@/hooks/useTemplateVotes";

/**
 * « J'aime » et « Je n'aime pas » d'une carte de la collection (/templates) :
 * on vote sans ouvrir la page du modèle. Chaque carte garde son propre état
 * de vote, d'où ce composant à part.
 *
 * @param {string}  props.templateId
 * @param {object}  props.initial  voir withVoteCounts (lib/templates/feedback.js)
 * @param {boolean} props.isAuthenticated
 */
export default function CardVotes({
  templateId,
  initial,
  isAuthenticated,
  className = "",
}) {
  const { votes, vote } = useTemplateVotes({
    templateId,
    initial,
    isAuthenticated,
    viewerName: null,
  });

  return <VoteButtons {...votes} onVote={vote} className={className} />;
}
