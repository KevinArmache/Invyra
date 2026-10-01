import { cache } from "react";
import { headers } from "next/headers";
import { MailX } from "lucide-react";

import { getInvitationByToken } from "@/app/actions/invitation";
import InvitationExperience from "@/components/invitation/InvitationExperience";
import InvitationUnavailable from "@/components/invitation/InvitationUnavailable";
import { toEditableConfig } from "@/lib/templates/validation";
import { templateLook as lookOf } from "@/lib/templates/look";
import { getTranslations } from "@/lib/i18n/server";

/**
 * Robots qui génèrent l'aperçu d'un lien partagé (WhatsApp, iMessage,
 * réseaux sociaux…). Leur visite ne doit pas compter comme une ouverture par
 * l'invité.
 */
const LINK_PREVIEW_BOTS =
  /bot|crawler|spider|facebookexternalhit|whatsapp|telegram|slack|discord|linkedin|skypeuripreview|embedly|pinterest|google-pagerenderer|vkshare/i;

const DEFAULT_BACKGROUND = "#0a0a0a";

async function isLinkPreviewBot() {
  const userAgent = (await headers()).get("user-agent") ?? "";
  return LINK_PREVIEW_BOTS.test(userAgent);
}

/**
 * Une seule lecture par requête, partagée entre métadonnées et page.
 *
 * - `{ invitation }` : trouvée ;
 * - `{ invitation: null }` : jeton inconnu ou révoqué, sans distinguer les
 *   deux pour ne pas confirmer l'existence d'une invitation à qui devine des
 *   jetons ;
 * - `{ failed: true }` : la base n'a pas répondu (Neon qui se réveille, même
 *   après les nouveaux essais du client Prisma). Surtout pas « Lien invalide » :
 *   l'invité doit pouvoir réessayer.
 */
const loadInvitation = cache(async (token) => {
  try {
    const invitation = await getInvitationByToken(token, {
      markViewed: !(await isLinkPreviewBot()),
    });
    return { invitation };
  } catch (error) {
    console.error("[invite] Chargement impossible :", error.message);
    return { invitation: null, failed: true };
  }
});

/** Couleur de fond et photo principale du modèle, pour la transition et l'aperçu du lien. */
function templateLook(invitation) {
  const look = lookOf(toEditableConfig(invitation?.event.invitationTemplate));
  return {
    background: look.background ?? DEFAULT_BACKGROUND,
    image: look.image,
  };
}

// Pas de generateViewport : une couleur de barre lue en base retarderait
// l'envoi de toute la page (Next attend le viewport avant le premier octet),
// et donc l'écran de chargement. InvitationExperience pose la couleur du
// modèle côté client.

export async function generateMetadata({ params }) {
  const { token } = await params;
  const [{ invitation }, { t }] = await Promise.all([
    loadInvitation(token),
    getTranslations(),
  ]);

  // Une invitation est nominative : elle ne doit jamais être indexée.
  const robots = { index: false, follow: false };
  if (!invitation) return { title: t("invite.meta_title"), robots };

  const { event, guest } = invitation;
  const { image } = templateLook(invitation);
  const title = `${event.title} · ${t("invite.meta_title")}`;
  const description = t("invite.meta_description").replace("{name}", guest.name);

  return {
    title: { absolute: title },
    description,
    robots,
    openGraph: {
      title,
      description,
      type: "website",
      ...(image && { images: [{ url: image, alt: event.title }] }),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image && { images: [image] }),
    },
  };
}

export default async function InvitationPage({ params }) {
  const { token } = await params;
  const { invitation, failed } = await loadInvitation(token);

  if (failed) return <InvitationUnavailable />;

  if (!invitation) {
    const { t } = await getTranslations();
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-[#0a0a0a] px-6 text-center">
        <span className="animate-scale-in relative mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-white/10">
          <span className="pulse-ring absolute inset-0 rounded-full" />
          <MailX className="h-7 w-7 text-white/40" strokeWidth={1.25} />
        </span>
        <h1
          className="animate-rise font-display text-3xl text-white/90"
          style={{ "--rise-delay": "150ms" }}
        >
          {t("invite.invalid_title")}
        </h1>
        <span
          aria-hidden="true"
          className="animate-draw-x mt-5 block h-px w-16 bg-[#e2b963]/60"
          style={{ "--rise-delay": "300ms" }}
        />
        <p
          className="animate-rise mt-5 max-w-sm text-sm leading-relaxed text-white/45"
          style={{ "--rise-delay": "250ms" }}
        >
          {t("invite.invalid_desc")}
        </p>
      </main>
    );
  }

  return (
    <InvitationExperience
      token={token}
      event={invitation.event}
      guest={invitation.guest}
      background={templateLook(invitation).background}
    />
  );
}
