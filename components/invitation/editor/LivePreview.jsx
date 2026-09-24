"use client";

import { useDeferredValue, useState } from "react";
import { MailOpen } from "lucide-react";

import InvitationPreview from "@/components/invitation/InvitationPreview";
import { useTranslation } from "@/lib/i18n/Context";
import { isDesignConfig } from "@/lib/invitation/template-config";

/**
 * Aperçu des éditeurs de template.
 *
 * L'écran d'ouverture masquerait le contenu à chaque frappe : il n'est donc
 * affiché que sur demande (bouton « Voir l'ouverture »), ou quand on modifie
 * justement ses réglages. Modifier autre chose le fait disparaître.
 */
/**
 * L'ouverture a-t-elle changé ? Réglages dans content pour un design, à la
 * racine pour du code, où elle peut aussi être écrite en code (openingCode).
 */
function openingChanged(template, previous) {
  if (isDesignConfig(template)) {
    return template?.content?.opening !== previous?.content?.opening;
  }
  return (
    template?.opening !== previous?.opening ||
    template?.openingCode !== previous?.openingCode
  );
}

export default function LivePreview({ template, event, guestName }) {
  const { t } = useTranslation();
  // L'aperçu reconstruit tout le document à chaque changement : on le laisse
  // prendre du retard sur la frappe plutôt que de ralentir le formulaire.
  const deferred = useDeferredValue(template);
  const [showOpening, setShowOpening] = useState(false);
  const [replay, setReplay] = useState(0);
  const [previous, setPrevious] = useState(template);

  if (template !== previous) {
    setPrevious(template);
    setShowOpening(openingChanged(template, previous));
  }

  return (
    <div className="relative h-full w-full">
      <InvitationPreview
        key={replay}
        template={deferred}
        event={event}
        guestName={guestName}
        showOpening={showOpening}
      />
      <button
        type="button"
        onClick={() => {
          setShowOpening(true);
          setReplay((value) => value + 1);
        }}
        className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-ink-850/90 px-3 py-1.5 text-xs text-gold shadow-elevation-1 backdrop-blur transition-colors hover:bg-ink-800"
      >
        <MailOpen className="h-3.5 w-3.5" />
        {showOpening
          ? t("portal.editor.general.replay_opening")
          : t("portal.editor.general.show_opening")}
      </button>
    </div>
  );
}
