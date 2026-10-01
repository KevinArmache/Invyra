import { CheckCircle2, Clock, HelpCircle, XCircle } from "lucide-react";

import AnimatedNumber from "@/components/common/AnimatedNumber";

/**
 * Répartition des réponses : une barre empilée horizontale, parce que la
 * question posée est une part-du-tout (« quelle fraction de mes invités a
 * répondu ? »), pas une comparaison de trois grandeurs indépendantes.
 *
 * Les quatre couleurs sont des couleurs d'état réservées, pas des couleurs de
 * série : elles voyagent donc toujours avec une icône et un libellé, jamais
 * seules. Chacune a été mesurée à plus de 4,5:1 sur la surface de carte, et
 * dans cet ordre deux voisines restent distinctes pour un œil daltonien
 * (ΔE 9,2 au pire, entre présents et absents).
 *
 * La barre se déploie de gauche à droite à l'arrivée. Chaque segment est
 * focalisable et montre sa valeur au survol comme au clavier ; la légende
 * donne de toute façon tous les nombres.
 */

const SEGMENTS = [
  {
    key: "confirmed",
    icon: CheckCircle2,
    fill: "var(--positive)",
    labelKey: "portal.analytics.confirmed",
  },
  {
    key: "declined",
    icon: XCircle,
    fill: "var(--negative)",
    labelKey: "portal.analytics.declined",
  },
  {
    key: "maybe",
    icon: HelpCircle,
    fill: "var(--info)",
    labelKey: "portal.events.details.guests.status.maybe",
  },
  {
    key: "pending",
    icon: Clock,
    fill: "var(--caution)",
    labelKey: "portal.analytics.pending",
  },
];

export default function RsvpBreakdown({ counts, total, t, delay = 0 }) {
  const hasData = total > 0;
  // Un segment sans valeur déclarée ne doit pas occuper une colonne vide
  // dans la légende.
  const segments = SEGMENTS.filter((segment) => counts[segment.key] != null);
  const drawn = segments.filter((segment) => counts[segment.key] > 0);
  const share = (value) => (hasData ? Math.round((value / total) * 100) : 0);

  return (
    <div className="p-5">
      {/* La barre. Les segments sont séparés par un écart de 2 px dans la
          couleur de la surface : c'est l'écart qui les distingue, pas un
          contour, qui ajouterait de l'encre sans données. La zone de survol
          de chaque segment (24 px) déborde de sa partie peinte (12 px). */}
      <div
        className="relative flex h-6 w-full items-center"
        role="img"
        aria-label={segments
          .map(
            (segment) =>
              `${t(segment.labelKey)} : ${counts[segment.key]} / ${total}`,
          )
          .join(", ")}
      >
        {!hasData && (
          <span className="absolute inset-x-0 h-3 rounded-full bg-ink-800" />
        )}
        {hasData && (
          <div
            className="animate-grow-x flex h-full w-full"
            style={{ "--rise-delay": `${delay + 200}ms` }}
          >
            {drawn.map((segment, index) => {
              const value = counts[segment.key];
              return (
                <span
                  key={segment.key}
                  tabIndex={0}
                  data-tip={`${t(segment.labelKey)} · ${value} (${share(value)} %)`}
                  className="chart-tip group/segment flex h-full items-center"
                  style={{
                    width: `${(value / total) * 100}%`,
                    marginLeft: index === 0 ? 0 : 2,
                  }}
                >
                  <span
                    className={`block h-3 w-full transition-[height,filter] duration-300 group-hover/segment:h-4 group-hover/segment:brightness-110 ${
                      index === 0 ? "rounded-l-full" : ""
                    } ${index === drawn.length - 1 ? "rounded-r-full" : ""}`}
                    style={{ background: segment.fill }}
                  />
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Légende : la pastille colorée porte l'identité, le texte reste en
          jetons d'encre. Une couleur d'état en texte serait à la fois moins
          lisible et redondante avec l'icône. */}
      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {segments.map((segment, index) => {
          const value = counts[segment.key];

          return (
            <div
              key={segment.key}
              className="animate-rise group flex flex-col-reverse justify-end rounded-lg border border-border/60 bg-ink-800/40 px-4 py-3 transition-colors duration-300 hover:border-border hover:bg-ink-800/70"
              style={{ "--rise-delay": `${delay + 250 + index * 70}ms` }}
            >
              <dt className="mt-1.5 truncate text-xs text-ink-400">
                {t(segment.labelKey)} · {share(value)}%
              </dt>
              <dd className="flex items-center gap-3">
                <segment.icon
                  className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110"
                  style={{ color: segment.fill }}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span className="text-2xl leading-none text-ink-50">
                  <AnimatedNumber value={value} delay={delay + 300 + index * 90} />
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
