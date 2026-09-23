import { CheckCircle2, Clock, HelpCircle, XCircle } from "lucide-react";

/**
 * Répartition des réponses : une barre empilée horizontale, parce que la
 * question posée est une part-du-tout (« quelle fraction de mes invités a
 * répondu ? »), pas une comparaison de trois grandeurs indépendantes.
 *
 * Les trois couleurs sont des couleurs d'état réservées, pas des couleurs de
 * série : elles voyagent donc toujours avec une icône et un libellé, jamais
 * seules. Chacune a été mesurée à plus de 4,5:1 sur la surface de carte.
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

export default function RsvpBreakdown({ counts, total, t }) {
  const hasData = total > 0;
  // « Peut-être » n'existe pas partout : un segment sans valeur nulle part
  // déclarée ne doit pas occuper une colonne vide dans la légende.
  const segments = SEGMENTS.filter((segment) => counts[segment.key] != null);
  const drawn = segments.filter((segment) => counts[segment.key] > 0);

  return (
    <div className="p-5">
      {/* La barre. Les segments sont séparés par un écart de 2 px dans la
          couleur de la surface : c'est l'écart qui les distingue, pas un
          contour, qui ajouterait de l'encre sans données. */}
      <div
        className="flex h-3 w-full overflow-hidden rounded-full bg-ink-800"
        role="img"
        aria-label={segments.map(
          (segment) =>
            `${t(segment.labelKey)} : ${counts[segment.key]} sur ${total}`,
        ).join(", ")}
      >
        {hasData &&
          drawn.map((segment, index) => {
            const value = counts[segment.key];

            return (
              <div
                key={segment.key}
                style={{
                  width: `${(value / total) * 100}%`,
                  background: segment.fill,
                  marginLeft: index === 0 ? 0 : 2,
                }}
                className="h-full first:rounded-l-full last:rounded-r-full"
              />
            );
          })}
      </div>

      {/* Légende : la pastille colorée porte l'identité, le texte reste en
          jetons d'encre. Une couleur d'état en texte serait à la fois moins
          lisible et redondante avec l'icône. */}
      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {segments.map((segment) => {
          const value = counts[segment.key];
          const share = hasData ? Math.round((value / total) * 100) : 0;

          return (
            <div
              key={segment.key}
              className="flex items-center gap-3 rounded-md border border-border/60 bg-ink-800/40 px-4 py-3"
            >
              <segment.icon
                className="h-5 w-5 shrink-0"
                style={{ color: segment.fill }}
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <dd className="text-2xl leading-none text-ink-50">{value}</dd>
                <dt className="mt-1.5 truncate text-xs text-ink-400">
                  {t(segment.labelKey)} · {share}%
                </dt>
              </div>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
