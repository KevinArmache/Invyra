import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { findPublicEvent, joinCookieName } from "@/lib/guests/public-link";
import { hasGuestCapacity } from "@/lib/guests/capacity";
import { toEditableConfig } from "@/lib/templates/validation";
import { templateLook } from "@/lib/templates/look";
import { getTranslations } from "@/lib/i18n/server";
import InvalidLink from "@/components/invitation/InvalidLink";
import InvitationUnavailable from "@/components/invitation/InvitationUnavailable";
import JoinExperience from "@/components/invitation/JoinExperience";

/**
 * Lien unique d'une invitation (voir app/actions/public-link.js) : la
 * personne saisit son nom et son téléphone, puis arrive sur son invitation
 * personnelle. Revenue sur ce lien depuis le même navigateur, elle y est
 * renvoyée directement.
 */

/**
 * Une seule lecture par requête, partagée entre métadonnées et page. Comme
 * pour /invite, une base qui ne répond pas (`failed`) n'est pas un lien
 * invalide.
 */
const loadJoin = cache(async (slug) => {
  try {
    return { found: await findPublicEvent(slug) };
  } catch (error) {
    console.error("[join] Chargement impossible :", error.message);
    return { found: null, failed: true };
  }
});

function lookOf(found) {
  return templateLook(toEditableConfig(found.event.invitationTemplate));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const [{ found }, { t }] = await Promise.all([loadJoin(slug), getTranslations()]);

  // Le lien est partagé largement, mais il ne doit pas être indexé.
  const robots = { index: false, follow: false };
  if (!found) return { title: t("join.meta_title"), robots };

  const { image } = lookOf(found);
  const title = `${found.event.title} · ${t("join.meta_title")}`;
  const description = t("join.meta_description");

  return {
    title: { absolute: title },
    description,
    robots,
    openGraph: {
      title,
      description,
      type: "website",
      ...(image && { images: [{ url: image, alt: found.event.title }] }),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image && { images: [image] }),
    },
  };
}

/**
 * Jeton personnel déjà obtenu par ce navigateur pour cet événement, s'il
 * est toujours valide (l'hôte a pu supprimer l'invité).
 */
async function returningToken(eventId) {
  const token = (await cookies()).get(joinCookieName(eventId))?.value;
  if (!token || token.length > 64) return null;
  const guest = await prisma.guest.findUnique({
    where: { invitationToken: token },
    select: { eventId: true },
  });
  return guest?.eventId === eventId ? token : null;
}

export default async function JoinPage({ params }) {
  const { slug } = await params;
  const { found, failed } = await loadJoin(slug);

  if (failed) return <InvitationUnavailable />;

  if (!found) {
    const { t } = await getTranslations();
    return (
      <InvalidLink title={t("join.invalid_title")} description={t("join.invalid_desc")} />
    );
  }

  // Hors de tout try : redirect() fonctionne en levant une exception.
  const token = await returningToken(found.id);
  if (token) redirect(`/invite/${token}`);

  const full = !(await hasGuestCapacity(found.id, found.owner));

  return (
    <JoinExperience
      slug={slug}
      event={found.event}
      maxSeats={found.maxSeats}
      accent={lookOf(found).accent}
      full={full}
    />
  );
}
