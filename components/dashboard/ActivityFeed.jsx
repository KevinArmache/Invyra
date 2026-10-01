import Link from "next/link";
import { Activity, CheckCircle2, Eye, HelpCircle, XCircle } from "lucide-react";

import { Panel } from "@/components/shell/primitives";

const TYPES = {
  viewed: { icon: Eye, color: "var(--gold)" },
  confirmed: { icon: CheckCircle2, color: "var(--positive)" },
  declined: { icon: XCircle, color: "var(--negative)" },
  maybe: { icon: HelpCircle, color: "var(--info)" },
};

/** « il y a 5 min », « hier »… à partir de deux horodatages. */
function relativeTime(date, now, locale, t) {
  const seconds = Math.round((new Date(date).getTime() - now) / 1000);
  if (Math.abs(seconds) < 45) return t("common.just_now");
  const format = new Intl.RelativeTimeFormat(locale === "fr" ? "fr" : "en", {
    numeric: "auto",
  });
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return format.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return format.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return format.format(days, "day");
  return new Date(date).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Activité récente : les dernières ouvertures et réponses des invités, sur
 * tous les événements suivis (voir getRecentActivity). Chaque ligne porte une
 * icône et un verbe : la couleur ne dit jamais seule ce qui s'est passé.
 */
export default function ActivityFeed({ t, locale, items, now, delay = 0 }) {
  return (
    <Panel title={t("dashboard.activity.title")} delay={delay}>
      {items.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <span className="animate-float relative mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-gold/25 bg-gold/5">
            <span className="pulse-ring absolute inset-0 rounded-full" />
            <Activity className="h-5 w-5 text-gold/80" strokeWidth={1.5} />
          </span>
          <p className="max-w-xs text-sm leading-relaxed text-ink-400">
            {t("dashboard.activity.empty")}
          </p>
        </div>
      ) : (
        <ol className="relative px-5 py-4">
          {/* Le fil qui relie les entrées, tracé de haut en bas. */}
          <span
            aria-hidden="true"
            className="absolute top-7 bottom-7 left-[2.15rem] w-px origin-top bg-linear-to-b from-gold/30 via-border to-transparent"
            style={{ animation: `draw-y 1200ms var(--ease-out-expo) ${delay + 200}ms both` }}
          />
          {items.map((item, index) => {
            const type = TYPES[item.type] ?? TYPES.viewed;
            return (
              <li
                key={item.id}
                className="animate-rise relative flex gap-3 py-2.5"
                style={{ "--rise-delay": `${delay + 150 + index * 60}ms` }}
              >
                <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-ink-850">
                  <type.icon
                    className="h-4 w-4"
                    style={{ color: type.color }}
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm leading-snug text-ink-100">
                    <span className="text-ink-50">{item.guestName}</span>{" "}
                    <span className="text-ink-300">
                      {t(`dashboard.activity.${item.type}`)}
                    </span>
                  </p>
                  <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-ink-400">
                    <Link
                      href={`/dashboard/events/${item.eventId}`}
                      className="truncate transition-colors hover:text-gold"
                    >
                      {item.eventTitle}
                    </Link>
                    <span aria-hidden="true">·</span>
                    <time dateTime={new Date(item.at).toISOString()} className="shrink-0">
                      {relativeTime(item.at, now, locale, t)}
                    </time>
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}
