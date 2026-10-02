"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { updateRsvpStatus } from "@/app/actions/invitation";
import GuestBar from "@/components/invitation/GuestBar";
import InvitationPreview from "@/components/invitation/InvitationPreview";
import RsvpDetailsSheet from "@/components/invitation/RsvpDetailsSheet";
import { useTranslation } from "@/lib/i18n/Context";

/**
 * Délai avant le panneau de réponse : le modèle joue d'abord sa propre
 * confirmation (confettis, cachet, avion en papier).
 */
const SHEET_DELAY = 1400;

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
 * Après une réponse, le panneau de réponse (RsvpDetailsSheet) s'ouvre
 * par-dessus le modèle. Une fois l'enveloppe ouverte (`INVITATION_OPENED`),
 * la barre de l'invité (GuestBar) mène à son billet et aux souvenirs.
 *
 * @param {string} props.background  couleur de fond du modèle
 * @param {string} [props.accent]    couleur d'accent du modèle
 */
export default function InvitationExperience({
  token,
  event,
  guest,
  background = "#0a0a0a",
  accent,
}) {
  const { t } = useTranslation();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  // Figé au premier rendu : l'invitation affiche elle-même la réponse de
  // l'invité. Si ces données changeaient, le document serait reconstruit et
  // l'invitation rechargée (retour en haut, animations rejouées).
  const [initialRsvp] = useState(guest);
  // Réponse à jour, pour le panneau et la barre de l'invité.
  const [rsvp, setRsvp] = useState(guest);
  // `key` remonte le panneau à chaque réponse, avec ses champs à jour.
  const [sheet, setSheet] = useState(null);
  const iframeRef = useRef(null);
  const sheetTimer = useRef(null);

  const submitRsvp = useCallback(
    async (payload) => {
      if (!payload?.rsvp_status) return;
      try {
        const result = await updateRsvpStatus(token, payload);
        setRsvp(result.guest);
        clearTimeout(sheetTimer.current);
        sheetTimer.current = setTimeout(() => {
          setSheet({ status: result.guest.rsvp_status, key: Date.now(), open: true });
        }, SHEET_DELAY);
      } catch (caught) {
        console.error("RSVP failed:", caught);
        toast.error(t("invite.rsvp_error"));
      }
    },
    [token, t],
  );

  useEffect(() => () => clearTimeout(sheetTimer.current), []);

  useEffect(() => {
    function handleMessage(messageEvent) {
      if (messageEvent.source !== iframeRef.current?.contentWindow) return;
      const type = messageEvent.data?.type;
      // Document analysé et polices prêtes (voir READY_SCRIPT dans
      // lib/invitation/document.js) : on n'attend pas les photos.
      if (type === "INVITATION_READY") {
        setIsLoaded(true);
        return;
      }
      if (type === "INVITATION_OPENED") {
        setIsOpened(true);
        return;
      }
      if (type !== "RSVP_SUBMIT") return;
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
        <span aria-hidden="true" className="animate-breathe mb-8 block">
          <span className="animate-draw-x block h-px w-16 bg-[#e2b963]/70" />
        </span>
        <p className="animate-rise font-display text-2xl text-white/90">
          {t("invite.preparing_title")}
        </p>
        <p
          className="animate-rise mt-3 max-w-sm text-sm leading-relaxed"
          style={{ "--rise-delay": "120ms" }}
        >
          {t("invite.preparing_desc")}
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
        title={t("invite.frame_title").replace("{title}", event.title)}
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
        <span className="sr-only">{t("invite.loading")}</span>
        <span className="block h-px w-16 animate-pulse bg-[#e2b963]/70" />
      </div>

      {isOpened && !sheet?.open && (
        <GuestBar
          token={token}
          showTicket={rsvp.rsvp_status === "confirmed"}
          showMemories={Boolean(event.guestbookEnabled || event.photosEnabled)}
        />
      )}

      {sheet && (
        <RsvpDetailsSheet
          key={sheet.key}
          open={sheet.open}
          onOpenChange={(open) => setSheet((current) => ({ ...current, open }))}
          status={sheet.status}
          token={token}
          guest={rsvp}
          accent={accent}
          showMemories={Boolean(event.guestbookEnabled || event.photosEnabled)}
          onSaved={setRsvp}
        />
      )}
    </main>
  );
}
