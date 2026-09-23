"use client";

/**
 * Rend une invitation (template code ou template à thème) dans une iframe
 * isolée. La construction du document est dans lib/invitation/document.js.
 *
 * ── Modèle de sécurité ────────────────────────────────────────────────────
 * Un template code est du HTML/JS arbitraire : l'iframe est donc la frontière
 * de sécurité, et elle doit réellement isoler.
 *
 * `allow-same-origin` n'est volontairement PAS dans la liste : combiné à
 * `allow-scripts`, il annule le bac à sable — le document obtient l'origine de
 * la page hôte et peut lire ses cookies et son DOM via `window.parent`. Sans
 * lui, le document a une origine opaque ; `postMessage` vers le parent
 * continue de fonctionner, donc le formulaire RSVP n'y perd rien.
 *
 * Corollaire côté parent : l'`origin` des messages vaut la chaîne "null", elle
 * ne peut donc pas servir à authentifier l'émetteur. Le parent compare
 * `event.source` à la `contentWindow` de son iframe — voir
 * InvitationExperience, qui passe cette référence via `iframeRef`.
 */

import { useMemo } from "react";

import { buildInvitationDocument } from "@/lib/invitation/document";

export default function InvitationPreview({
  template,
  event,
  guestName,
  rsvpData,
  readOnly,
  title = "Aperçu de l'invitation",
  iframeRef,
  showOpening = true,
  onLoad,
  className = "",
}) {
  const document_ = useMemo(
    () =>
      template && event
        ? buildInvitationDocument({
            config: template,
            event,
            guestName,
            rsvpData,
            readOnly,
            showOpening,
          })
        : null,
    [template, event, guestName, rsvpData, readOnly, showOpening],
  );

  if (!document_) return null;

  return (
    <iframe
      ref={iframeRef}
      srcDoc={document_}
      title={title}
      onLoad={onLoad}
      className={`h-full w-full border-0 ${className}`}
      style={{ minHeight: "100%", display: "block" }}
      // Voir l'en-tête du fichier : `allow-same-origin` est délibérément absent.
      sandbox="allow-scripts allow-forms allow-popups"
    />
  );
}
