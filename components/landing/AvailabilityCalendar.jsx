"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, ChevronLeft, ChevronRight, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/utils/i18n/Context";

/** Nombre de mois consultables à partir du mois courant. */
const MONTHS_AHEAD = 24;
/** Nombre de dates réservées listées à côté du calendrier. */
const UPCOMING_LIMIT = 6;

function pad(value) {
  return String(value).padStart(2, "0");
}

function monthKey(year, month) {
  return `${year}-${pad(month + 1)}`;
}

function dayKey(year, month, day) {
  return `${monthKey(year, month)}-${pad(day)}`;
}

/** Écart en mois entre deux clés AAAA-MM(-JJ). */
function monthsBetween(fromKey, toKey) {
  const [fromYear, fromMonth] = fromKey.split("-").map(Number);
  const [toYear, toMonth] = toKey.split("-").map(Number);
  return (toYear - fromYear) * 12 + (toMonth - fromMonth);
}

/**
 * Calendrier des disponibilités de la page d'accueil.
 *
 * Une date devient « réservée » dès qu'un événement y est créé. Elle reste
 * choisissable : plusieurs mariages peuvent avoir lieu le même jour. Un clic
 * sur une date affiche le nombre de mariages déjà prévus (jamais leurs
 * détails) et propose de demander la date par email.
 *
 * @param {Array<{date: string, count: number}>} props.bookedDates
 * @param {string} props.today  AAAA-MM-JJ, calculé côté serveur pour que le
 *   rendu serveur et le rendu client tombent d'accord.
 * @param {string} props.contactEmail  destinataire des demandes de réservation
 */
export default function AvailabilityCalendar({
  bookedDates,
  today,
  contactEmail,
}) {
  const { t, locale } = useTranslation();
  const intlLocale = locale === "fr" ? "fr-FR" : "en-US";

  const [todayYear, todayMonth] = today.split("-").map(Number);
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState(null);

  const booked = useMemo(
    () => new Map(bookedDates.map((item) => [item.date, item.count])),
    [bookedDates],
  );
  const upcoming = bookedDates.slice(0, UPCOMING_LIMIT);

  const view = new Date(Date.UTC(todayYear, todayMonth - 1 + offset, 1));
  const year = view.getUTCFullYear();
  const month = view.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  // Semaine commençant le lundi : dimanche (0) passe en dernière colonne.
  const leadingBlanks = (view.getUTCDay() + 6) % 7;

  const monthLabel = new Intl.DateTimeFormat(intlLocale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(view);

  const weekdays = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(intlLocale, {
      weekday: "short",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(2024, 0, 1 + index))),
  );

  const longDate = (key) =>
    new Intl.DateTimeFormat(intlLocale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${key}T00:00:00Z`));

  const shortDate = (key) =>
    new Intl.DateTimeFormat(intlLocale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${key}T00:00:00Z`));

  const bookedThisMonth = bookedDates.filter((item) =>
    item.date.startsWith(monthKey(year, month)),
  ).length;

  function countLabel(count) {
    if (count === 0) return t("landing.availability.day_free");
    return `${count} ${t(
      count === 1
        ? "landing.availability.wedding_one"
        : "landing.availability.wedding_many",
    )}`;
  }

  /** Lien email pré-rempli, avec la date choisie s'il y en a une. */
  function mailtoFor(key) {
    const dateLabel = key ? longDate(key) : null;
    const subject = dateLabel
      ? `${t("landing.availability.mail_subject")} : ${dateLabel}`
      : t("landing.availability.mail_subject");
    const body = t("landing.availability.mail_body").replace(
      "{date}",
      dateLabel ?? t("landing.availability.mail_date_placeholder"),
    );
    return `mailto:${contactEmail}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  }

  function goTo(key) {
    setOffset(Math.min(MONTHS_AHEAD, Math.max(0, monthsBetween(today, key))));
    setSelected(key);
  }

  const selectedCount = selected ? (booked.get(selected) ?? 0) : 0;

  return (
    <section
      id="availability"
      className="scroll-mt-16 border-t border-border/60 px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
    >
      <div className="mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-[1fr_minmax(0,520px)] lg:gap-20">
        <header className="reveal">
          <h2 className="text-4xl leading-tight text-balance text-ink-50 sm:text-5xl">
            {t("landing.availability.title")}
            <em className="text-gold not-italic">
              {t("landing.availability.title_highlight")}
            </em>
          </h2>
          <hr className="rule-gold-left mt-7 w-24" />
          <p className="mt-7 text-lg leading-relaxed text-pretty text-ink-300">
            {t("landing.availability.subtitle")}
          </p>
          <p className="mt-4 leading-relaxed text-pretty text-ink-400">
            {t("landing.availability.multiple_note")}
          </p>

          {upcoming.length > 0 && (
            <div className="mt-8">
              <p className="eyebrow">{t("landing.availability.upcoming")}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {upcoming.map((item) => (
                  <li key={item.date}>
                    <button
                      type="button"
                      onClick={() => goTo(item.date)}
                      aria-pressed={selected === item.date}
                      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                        selected === item.date
                          ? "border-gold bg-gold/15 text-ink-50"
                          : "border-gold/40 text-ink-100 hover:border-gold hover:text-ink-50"
                      }`}
                    >
                      <CalendarCheck className="h-3.5 w-3.5 text-gold" />
                      {shortDate(item.date)}
                      {item.count > 1 && (
                        <span className="text-xs text-gold">×{item.count}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-ink-300">
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border border-border bg-ink-850" />
              {t("landing.availability.legend_free")}
            </li>
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-gold" />
              {t("landing.availability.legend_booked")}
            </li>
          </ul>

          <Button asChild size="lg" className="mt-10">
            <a href={mailtoFor(selected)}>
              <Mail className="mr-2 h-4 w-4" />
              {t("landing.availability.cta")}
            </a>
          </Button>
        </header>

        <div className="reveal surface p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOffset((value) => value - 1)}
              disabled={offset === 0}
              aria-label={t("landing.availability.prev")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-center">
              <p className="text-xl text-ink-50 capitalize" aria-live="polite">
                {monthLabel}
              </p>
              <p className="mt-0.5 text-xs text-ink-400">
                {bookedThisMonth === 0
                  ? t("landing.availability.month_free")
                  : `${bookedThisMonth} ${t(
                      bookedThisMonth === 1
                        ? "landing.availability.month_booked_one"
                        : "landing.availability.month_booked_many",
                    )}`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOffset((value) => value + 1)}
              disabled={offset >= MONTHS_AHEAD}
              aria-label={t("landing.availability.next")}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-7 gap-1.5 text-center">
            {weekdays.map((weekday) => (
              <span
                key={weekday}
                aria-hidden="true"
                className="pb-2 text-[11px] tracking-wider text-ink-400 uppercase"
              >
                {weekday.replace(".", "")}
              </span>
            ))}

            {Array.from({ length: leadingBlanks }, (_, index) => (
              <span key={`blank-${index}`} aria-hidden="true" />
            ))}

            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1;
              const key = dayKey(year, month, day);
              const count = booked.get(key) ?? 0;
              const isPast = key < today;
              const isToday = key === today;
              const isSelected = key === selected;

              if (isPast) {
                return (
                  <span
                    key={key}
                    aria-hidden="true"
                    className="flex aspect-square items-center justify-center rounded-md text-sm text-ink-600"
                  >
                    {day}
                  </span>
                );
              }

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(key)}
                  aria-pressed={isSelected}
                  aria-label={`${longDate(key)} : ${countLabel(count)}`}
                  className={`relative flex aspect-square flex-col items-center justify-center rounded-md border text-sm transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                    count > 0
                      ? "border-gold bg-gold font-semibold text-primary-foreground hover:bg-gold-bright"
                      : "border-border/60 bg-ink-850 text-ink-100 hover:border-gold/60"
                  } ${isSelected ? "ring-2 ring-ink-50 ring-offset-2 ring-offset-background" : ""} ${
                    isToday && !isSelected ? "ring-1 ring-ink-300" : ""
                  }`}
                >
                  <span data-numeric>{day}</span>
                  {count > 1 && (
                    <span className="mt-0.5 text-[10px] leading-none">
                      ×{count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Détail de la date choisie */}
          <div
            aria-live="polite"
            className="mt-6 rounded-md border border-border/60 bg-ink-850/60 p-4"
          >
            {selected ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base text-ink-50 first-letter:uppercase">
                    {longDate(selected)}
                  </p>
                  <p
                    className={`mt-1 text-sm ${
                      selectedCount > 0 ? "text-gold" : "text-ink-300"
                    }`}
                  >
                    {countLabel(selectedCount)}
                  </p>
                  {selectedCount > 0 && (
                    <p className="mt-1 text-xs text-ink-400">
                      {t("landing.availability.still_possible")}
                    </p>
                  )}
                </div>
                <Button asChild size="sm" className="shrink-0">
                  <a href={mailtoFor(selected)}>
                    <Mail className="mr-1.5 h-3.5 w-3.5" />
                    {t("landing.availability.book_this_date")}
                  </a>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-ink-400">
                {t("landing.availability.pick_a_date")}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
