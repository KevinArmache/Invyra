"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { updateRsvpStatus } from "@/app/actions/invitation";
import InvitationPreview from "@/components/invitation/InvitationPreview";

/**
 * L'invitation telle que la voit l'invité, en plein écran.
 *
 * L'écran d'ouverture (enveloppe, cachet, rideau) fait partie du document de
 * l'invitation (lib/invitation/opening.js) : la page ne fait qu'afficher ce
 * document, sur un fond de la couleur du modèle, et le révèle en fondu une
 * fois chargé. Aucun écran intermédiaire, aucun flash.
 *
 * Le relais RSVP écoute les `postMessage` de l'iframe. Comme celle-ci est en
 * bac à sable sans `allow-same-origin`, son origine vaut la chaîne "null" et
 * ne peut donc pas authentifier l'émetteur : on compare `event.source` à la
 * `contentWindow` de notre propre iframe. Sans ce contrôle, n'importe quel
 * script de la page pourrait envoyer une réponse à la place de l'invité.
 *
 * @param {string} props.background  couleur de fond du modèle
 */
export default function InvitationExperience({
  token,
  event,
  guest,
  background = "#0a0a0a",
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  // Figé au premier rendu : l'invitation affiche elle-même la réponse de
  // l'invité. Si ces données changeaient, le document serait reconstruit et
  // l'invitation rechargée (retour en haut, animations rejouées).
  const [initialRsvp] = useState(guest);
  const iframeRef = useRef(null);

  const submitRsvp = useCallback(
    async (payload) => {
      if (!payload?.rsvp_status) return;
      try {
        await updateRsvpStatus(token, payload);
      } catch (caught) {
        console.error("RSVP failed:", caught);
        toast.error("Votre réponse n'a pas pu être enregistrée. Réessayez.");
      }
    },
    [token],
  );

  useEffect(() => {
    function handleMessage(messageEvent) {
      if (messageEvent.source !== iframeRef.current?.contentWindow) return;
      // Document analysé et polices prêtes (voir READY_SCRIPT dans
      // lib/invitation/document.js) : on n'attend pas les photos.
      if (messageEvent.data?.type === "INVITATION_READY") {
        setIsLoaded(true);
        return;
      }
      if (messageEvent.data?.type !== "RSVP_SUBMIT") return;
      submitRsvp(messageEvent.data.data);
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [submitRsvp]);

  // Filet de sécurité : un modèle code dont le script casserait le signal ne
  // doit pas laisser l'invité devant un écran noir.
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Couleur de la barre du navigateur mobile, posée ici plutôt que par
  // generateViewport, qui retarderait toute la page (voir la page invite).
  useEffect(() => {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = background;
  }, [background]);

  const template = event.invitationTemplate;

  if (!template) {
    return (
      <main
        className="flex min-h-dvh flex-col items-center justify-center px-8 text-center text-white/60"
        style={{ background }}
      >
        <p className="font-display text-2xl text-white/90">
          Invitation en cours de préparation
        </p>
        <p className="mt-3 max-w-sm text-sm leading-relaxed">
          L&apos;organisateur n&apos;a pas encore choisi le modèle de cette
          invitation.
        </p>
      </main>
    );
  }

  return (
    <main className="fixed inset-0" style={{ background }}>
      <InvitationPreview
        iframeRef={iframeRef}
        template={template}
        event={event}
        guestName={guest.name}
        rsvpData={initialRsvp}
        title={`Invitation : ${event.title}`}
        onLoad={() => setIsLoaded(true)}
        // Invisible, l'invitation ne reçoit pas les touchers : sinon un
        // invité impatient ouvrirait l'enveloppe sans la voir.
        className={`transition-opacity duration-700 ease-out ${
          isLoaded ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Pendant le chargement du modèle (polices, photos) : le fond a déjà
          la couleur de l'invitation, seul un filet doré respire. */}
      <div
        aria-hidden={isLoaded}
        className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
          isLoaded ? "opacity-0" : "opacity-100"
        }`}
      >
        <span className="sr-only">Chargement de votre invitation</span>
        <span className="block h-px w-16 animate-pulse bg-[#e2b963]/70" />
      </div>
    </main>
  );
}
