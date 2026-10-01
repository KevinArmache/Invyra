import Link from "next/link";
import { ArrowRight, CalendarClock, MapPin, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import Countdown from "@/components/common/Countdown";
import Particles from "@/components/landing/Particles";

/**
 * Bandeau d'accueil du tableau de bord : le titre de la page (au prénom),
 * et à droite le prochain événement avec son compte à rebours vivant.
 *
 * @param {object|null} props.nextEvent  `{ id, title, location, dateLabel, target }`
 *   ou null s'il n'y a aucun événement daté à venir
 * @param {number} props.now  horodatage serveur (premier rendu du compte à rebours)
 */
export default function WelcomeBanner({ t, greeting, nextEvent, now }) {
  const words = greeting.split(" ").filter(Boolean);

  return (
    <section className="animate-rise grain relative overflow-hidden rounded-2xl border border-gold/20 bg-ink-850 p-6 shadow-elevation-2 sm:p-8">
      <div
        aria-hidden="true"
        className="animate-breathe pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 80% at 15% 0%, color-mix(in oklch, var(--gold) 13%, transparent), transparent 70%)",
        }}
      />
      <Particles count={8} />

      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-center">
        <div>
          <p className="eyebrow text-gold/80">{t("dashboard.title")}</p>
          <h1 className="mt-3 text-3xl leading-tight text-ink-50 sm:text-4xl">
            {words.map((word, index) => (
              <span key={`${word}-${index}`}>
                {index > 0 && " "}
                <span className="word-mask">
                  <span style={{ "--i": index }}>{word}</span>
                </span>
              </span>
            ))}
          </h1>
          <hr
            className="rule-gold-left animate-draw-x mt-4 w-16"
            style={{ "--rise-delay": "300ms" }}
          />
          <p
            className="animate-rise mt-4 max-w-md text-sm leading-relaxed text-ink-300"
            style={{ "--rise-delay": "200ms" }}
          >
            {t("dashboard.welcome")}
          </p>
          <div
            className="animate-rise mt-6 flex flex-wrap gap-3"
            style={{ "--rise-delay": "300ms" }}
          >
            <Button asChild size="lg" className="group">
              <Link href="/dashboard/events/new">
                <Plus className="transition-transform duration-300 group-hover:rotate-90" />
                {t("dashboard.create_event")}
              </Link>
            </Button>
          </div>
        </div>

        <div
          className="animate-scale-in rounded-xl border border-border/70 bg-ink-900/60 p-5 backdrop-blur-sm"
          style={{ "--rise-delay": "250ms" }}
        >
          <p className="eyebrow">{t("dashboard.next_event")}</p>
          {nextEvent ? (
            <>
              <Link
                href={`/dashboard/events/${nextEvent.id}`}
                className="mt-3 block truncate font-display text-xl text-ink-50 transition-colors hover:text-gold"
              >
                {nextEvent.title}
              </Link>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {nextEvent.dateLabel}
                </span>
                {nextEvent.location && (
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{nextEvent.location}</span>
                  </span>
                )}
              </p>
              <div className="mt-4">
                <Countdown target={nextEvent.target} now={now} />
              </div>
              <Link
                href={`/dashboard/events/${nextEvent.id}`}
                className="group mt-4 inline-flex items-center gap-1.5 text-sm text-gold transition-colors hover:text-gold-bright"
              >
                {t("dashboard.open_event")}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </>
          ) : (
            <div className="mt-3 flex items-start gap-3">
              <span className="animate-float flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/5">
                <CalendarClock className="h-4 w-4 text-gold/80" strokeWidth={1.6} />
              </span>
              <div>
                <p className="text-sm text-ink-100">{t("dashboard.no_upcoming_title")}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-400">
                  {t("dashboard.no_upcoming_desc")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
