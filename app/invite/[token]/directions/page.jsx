import { cache } from "react";
import Link from "next/link";
import { ArrowLeft, Route } from "lucide-react";

import { getDirectionsByToken } from "@/app/actions/invitation";
import BrandMark from "@/components/common/BrandMark";
import InvalidLink from "@/components/invitation/InvalidLink";
import InvitationUnavailable from "@/components/invitation/InvitationUnavailable";
import DirectionsView from "@/components/itinerary/DirectionsView";
import { Button } from "@/components/ui/button";
import { eventDayLabel } from "@/lib/invitation/dates";
import { getTranslations } from "@/lib/i18n/server";
import { templateLook } from "@/lib/templates/look";
import { toEditableConfig } from "@/lib/templates/validation";

/**
 * Itinéraire d'un événement, vu par un invité : les étapes sur une carte et
 * un lien vers son application de navigation pour chacune. Accessible avec
 * le jeton de l'invitation (voir getDirectionsByToken) ; ne compte pas comme
 * une ouverture.
 */

/** Une lecture par requête, partagée entre métadonnées et page. */
const loadDirections = cache(async (token) => {
  try {
    return { directions: await getDirectionsByToken(token) };
  } catch (error) {
    console.error("[directions] Chargement impossible :", error.message);
    return { directions: null, failed: true };
  }
});

export async function generateMetadata({ params }) {
  const { token } = await params;
  const [{ directions }, { t }] = await Promise.all([
    loadDirections(token),
    getTranslations(),
  ]);

  // Réservé aux invités : jamais indexé.
  const robots = { index: false, follow: false };
  if (!directions) return { title: t("invite.directions.meta_title"), robots };

  const { event } = directions;
  const title = `${t("invite.directions.meta_title")} · ${event.title}`;
  const description = t("invite.directions.meta_description").replace(
    "{title}",
    event.title,
  );
  const { image } = templateLook(toEditableConfig(event.invitationTemplate));

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

export default async function DirectionsPage({ params }) {
  const { token } = await params;
  const { directions, failed } = await loadDirections(token);
  if (failed) return <InvitationUnavailable />;

  const { t, locale } = await getTranslations();
  const d = (key) => t(`invite.directions.${key}`);

  if (!directions) {
    return (
      <InvalidLink
        title={t("invite.invalid_title")}
        description={t("invite.invalid_desc")}
        icon={Route}
      />
    );
  }

  const { event } = directions;
  const when = [eventDayLabel(event.eventDate, locale), event.time]
    .filter(Boolean)
    .join(" · ");

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
              <span className="hidden sm:inline">{d("back")}</span>
            </Link>
          </Button>
        </nav>

        <header className="mx-auto mt-10 max-w-2xl text-center sm:mt-14">
          <p className="animate-fade-in eyebrow text-gold">{d("eyebrow")}</p>
          <h1 className="animate-rise mt-3 font-display text-4xl leading-tight wrap-break-word text-ink-50 sm:text-5xl">
            {event.title}
          </h1>
          {when && (
            <p
              className="animate-rise mt-2 text-sm text-ink-400"
              style={{ "--rise-delay": "80ms" }}
              data-numeric
            >
              {when}
            </p>
          )}
          <hr
            className="rule-gold animate-draw-x mx-auto mt-5 w-20"
            style={{ "--rise-delay": "180ms" }}
          />
          {event.stops.length > 0 && (
            <p
              className="animate-rise mt-5 text-sm leading-relaxed text-ink-300"
              style={{ "--rise-delay": "120ms" }}
            >
              {d("subtitle")}
            </p>
          )}
        </header>

        <section
          aria-label={d("eyebrow")}
          className="animate-rise mt-12"
          style={{ "--rise-delay": "200ms" }}
        >
          {event.stops.length > 0 ? (
            <DirectionsView stops={event.stops} />
          ) : (
            <div className="mx-auto max-w-md rounded-2xl border border-border/60 bg-ink-850/60 px-6 py-10 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/25 bg-gold/5">
                <Route className="h-6 w-6 text-gold/80" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <h2 className="mt-5 font-display text-2xl text-ink-50">{d("empty_title")}</h2>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-ink-300">
                {d("empty_desc")}
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
