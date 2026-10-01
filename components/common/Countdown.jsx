"use client";

import { useEffect, useState } from "react";

import { useTranslation } from "@/lib/i18n/Context";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Jours, heures, minutes et secondes restant avant `target`. */
function remaining(target, now) {
  const delta = Math.max(0, new Date(target).getTime() - now);
  return {
    done: delta === 0,
    days: Math.floor(delta / DAY),
    hours: Math.floor((delta % DAY) / HOUR),
    minutes: Math.floor((delta % HOUR) / MINUTE),
    seconds: Math.floor((delta % MINUTE) / SECOND),
  };
}

const pad = (value) => String(value).padStart(2, "0");

/**
 * Compte à rebours vivant jusqu'à un événement.
 *
 * Le premier rendu utilise l'heure du serveur (`now`), pour que le HTML
 * arrive déjà rempli ; l'horloge du navigateur prend le relais au montage.
 * Les deux peuvent différer de quelques secondes : les chiffres sont donc
 * exemptés de l'avertissement d'hydratation.
 *
 * @param {string} props.target  moment visé (AAAA-MM-JJTHH:MM:SS, heure locale)
 * @param {number} props.now     horodatage serveur du premier rendu
 * @param {"full"|"compact"} [props.variant]
 */
export default function Countdown({ target, now, variant = "full" }) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(now);

  // L'horloge du navigateur prend la main dès la première seconde.
  useEffect(() => {
    const timer = setInterval(() => setCurrent(Date.now()), SECOND);
    return () => clearInterval(timer);
  }, []);

  const time = remaining(target, current);

  if (time.done) {
    return (
      <p className="text-sm text-gold">{t("common.countdown.today")}</p>
    );
  }

  const units = [
    { key: "days", value: time.days },
    { key: "hours", value: pad(time.hours) },
    { key: "minutes", value: pad(time.minutes) },
    { key: "seconds", value: pad(time.seconds) },
  ];

  if (variant === "compact") {
    return (
      <span
        className="inline-flex items-baseline gap-1 text-sm text-ink-300"
        suppressHydrationWarning
      >
        {units.slice(0, 3).map((unit) => (
          <span key={unit.key} className="whitespace-nowrap">
            <span data-numeric className="text-ink-50" suppressHydrationWarning>
              {unit.value}
            </span>
            {t(`common.countdown.short.${unit.key}`)}
          </span>
        ))}
      </span>
    );
  }

  return (
    <div
      role="timer"
      aria-live="off"
      className="grid grid-cols-4 gap-2 sm:gap-3"
    >
      {units.map((unit) => (
        <div
          key={unit.key}
          className="rounded-md border border-border/70 bg-ink-900/60 px-2 py-2.5 text-center"
        >
          <p
            data-numeric
            className="font-display text-2xl leading-none text-ink-50 sm:text-3xl"
            suppressHydrationWarning
          >
            {unit.value}
          </p>
          <p className="mt-1.5 text-[10px] tracking-[0.14em] text-ink-400 uppercase">
            {t(`common.countdown.${unit.key}`)}
          </p>
        </div>
      ))}
    </div>
  );
}
