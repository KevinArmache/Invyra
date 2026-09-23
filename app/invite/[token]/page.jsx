import { cache } from "react";
import { headers } from "next/headers";
import { XCircle } from "lucide-react";

import { getInvitationByToken } from "@/app/actions/invitation";
import InvitationExperience from "@/components/invitation/InvitationExperience";
import { toEditableConfig } from "@/lib/invitation/document";

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
 * Une seule lecture par requête, partagée entre métadonnées, viewport et
 * page. Jeton inconnu ou révoqué : `null`, sans distinguer les deux cas pour
 * ne pas confirmer l'existence d'une invitation à qui devine des jetons.
 */
const loadInvitation = cache(async (token) => {
  try {
    return await getInvitationByToken(token, {
      markViewed: !(await isLinkPreviewBot()),
    });
  } catch {
    return null;
  }
});

/** Couleur de fond et photo principale du modèle, pour la transition et l'aperçu du lien. */
function templateLook(invitation) {
  const config = toEditableConfig(invitation?.event.invitationTemplate);
  if (config?.type !== "theme") {
    return { background: DEFAULT_BACKGROUND, image: null };
  }
  return {
    background: config.style.background ?? DEFAULT_BACKGROUND,
    image: config.content.hero?.image || null,
  };
}

export async function generateMetadata({ params }) {
  const { token } = await params;
  const invitation = await loadInvitation(token);

  // Une invitation est nominative : elle ne doit jamais être indexée.
  const robots = { index: false, follow: false };
  if (!invitation) return { title: "Invitation", robots };

  const { event, guest } = invitation;
  const { image } = templateLook(invitation);
  const title = `${event.title} · Invitation`;
  const description = `${guest.name}, vous êtes invité(e). Ouvrez votre invitation et confirmez votre présence.`;

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

export async function generateViewport({ params }) {
  const { token } = await params;
  const invitation = await loadInvitation(token);
  // La barre du navigateur mobile prend la couleur de l'invitation.
  return { themeColor: templateLook(invitation).background };
}

export default async function InvitationPage({ params }) {
  const { token } = await params;
  const invitation = await loadInvitation(token);

  if (!invitation) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-[#0a0a0a] px-6 text-center">
        <XCircle className="mb-6 h-12 w-12 text-white/25" strokeWidth={1.25} />
        <h1 className="font-display text-3xl text-white/90">Lien invalide</h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/45">
          Cette invitation n&apos;existe pas ou n&apos;est plus active.
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
