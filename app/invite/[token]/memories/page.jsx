import { cache } from "react";
import Link from "next/link";
import { ArrowLeft, Images } from "lucide-react";

import { getMemories } from "@/app/actions/memories";
import BrandMark from "@/components/common/BrandMark";
import InvalidLink from "@/components/invitation/InvalidLink";
import InvitationUnavailable from "@/components/invitation/InvitationUnavailable";
import Guestbook from "@/components/memories/Guestbook";
import PhotoWall from "@/components/memories/PhotoWall";
import { Button } from "@/components/ui/button";
import { eventDayLabel } from "@/lib/invitation/dates";
import { getTranslations } from "@/lib/i18n/server";
import { MAX_PHOTOS_PER_GUEST, MAX_VIDEOS_PER_GUEST } from "@/lib/site";
import { templateLook } from "@/lib/templates/look";
import { toEditableConfig } from "@/lib/templates/validation";

/**
 * Souvenirs d'un événement, vus par un invité : le livre d'or et le mur de
 * photos et vidéos. Accessible avec le jeton de l'invitation (voir
 * app/actions/memories.js) ; ne compte pas comme une ouverture.
 */

/** Une lecture par requête, partagée entre métadonnées et page. */
const loadMemories = cache(async (token) => {
  try {
    return { memories: await getMemories(token) };
  } catch (error) {
    console.error("[memories] Chargement impossible :", error.message);
    return { memories: null, failed: true };
  }
});

export async function generateMetadata({ params }) {
  const { token } = await params;
  const [{ memories }, { t }] = await Promise.all([
    loadMemories(token),
    getTranslations(),
  ]);

  // Réservé aux invités : jamais indexé.
  const robots = { index: false, follow: false };
  if (!memories) return { title: t("invite.memories.meta_title"), robots };

  const title = `${t("invite.memories.meta_title")} · ${memories.event.title}`;
  const description = t("invite.memories.meta_description").replace(
    "{title}",
    memories.event.title,
  );
  const { image } = templateLook(toEditableConfig(memories.event.invitationTemplate));

  return {
    title: { absolute: title },
    description,
    robots,
    openGraph: {
      title,
      description,
      type: "website",
      ...(image && { images: [{ url: image, alt: memories.event.title }] }),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image && { images: [image] }),
    },
  };
}

export default async function MemoriesPage({ params }) {
  const { token } = await params;
  const { memories, failed } = await loadMemories(token);
  if (failed) return <InvitationUnavailable />;

  const { t, locale } = await getTranslations();
  const m = (key) => t(`invite.memories.${key}`);

  if (!memories) {
    return (
      <InvalidLink
        title={t("invite.invalid_title")}
        description={t("invite.invalid_desc")}
        icon={Images}
      />
    );
  }

  const { event, guest, messages, photos } = memories;
  const day = eventDayLabel(event.eventDate, locale);

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-ink-900 px-4 pt-6 pb-[calc(3rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--gold)_12%,transparent),transparent_70%)]"
      />

      <div className="relative mx-auto max-w-6xl">
        <nav className="flex items-center justify-between gap-3">
          <BrandMark href="/" size="sm" priority />
          <Button asChild variant="ghost" size="sm">
            <Link href={`/invite/${token}`}>
              <ArrowLeft />
              <span className="hidden sm:inline">{m("back")}</span>
            </Link>
          </Button>
        </nav>

        <header className="mx-auto mt-10 max-w-2xl text-center sm:mt-14">
          <p className="animate-fade-in eyebrow text-gold">{m("eyebrow")}</p>
          <h1 className="animate-rise mt-3 font-display text-4xl leading-tight wrap-break-word text-ink-50 sm:text-5xl">
            {event.title}
          </h1>
          {day && (
            <p
              className="animate-rise mt-2 text-sm text-ink-400"
              style={{ "--rise-delay": "80ms" }}
            >
              {day}
            </p>
          )}
          <hr
            className="rule-gold animate-draw-x mx-auto mt-5 w-20"
            style={{ "--rise-delay": "180ms" }}
          />
          <p
            className="animate-rise mt-5 text-sm leading-relaxed text-ink-300"
            style={{ "--rise-delay": "120ms" }}
          >
            {m("subtitle")}
          </p>
        </header>

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start lg:gap-10">
          <section
            aria-labelledby="guestbook-title"
            className="animate-rise"
            style={{ "--rise-delay": "200ms" }}
          >
            <Guestbook
              token={token}
              initialMessages={messages}
              enabled={event.guestbookEnabled}
            />
          </section>

          <section
            aria-labelledby="photos-title"
            className="animate-rise"
            style={{ "--rise-delay": "260ms" }}
          >
            <PhotoWall
              token={token}
              eventId={event.id}
              initialPhotos={photos}
              initialCount={guest.photoCount}
              initialVideoCount={guest.videoCount}
              max={MAX_PHOTOS_PER_GUEST}
              maxVideos={MAX_VIDEOS_PER_GUEST}
              enabled={event.photosEnabled}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
