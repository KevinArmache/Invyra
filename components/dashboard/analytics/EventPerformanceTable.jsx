import Link from "next/link";

/**
 * Performance par événement.
 *
 * Un tableau plutôt qu'un graphique : quatre mesures par ligne et des titres
 * d'événement de longueur libre se lisent mieux en colonnes. Le taux de
 * confirmation porte quand même une jauge en ligne, parce que c'est la seule
 * colonne qu'on parcourt pour comparer, et qu'une barre se compare plus vite
 * qu'un nombre.
 *
 * Les colonnes numériques sont en chiffres tabulaires pour rester alignées
 * d'une ligne à l'autre.
 */
export default function EventPerformanceTable({ events, locale, t }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[42rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border/60 text-left">
            <th scope="col" className="px-5 py-3 font-normal text-ink-400">
              {t("portal.events.list.title")}
            </th>
            <th scope="col" className="px-3 py-3 text-right font-normal text-ink-400">
              {t("portal.analytics.guests")}
            </th>
            <th scope="col" className="px-3 py-3 text-right font-normal text-ink-400">
              {t("portal.analytics.views")}
            </th>
            <th scope="col" className="px-3 py-3 text-right font-normal text-ink-400">
              {t("portal.analytics.confirmed")}
            </th>
            <th scope="col" className="px-5 py-3 font-normal text-ink-400">
              {t("portal.analytics.rate")}
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border/60">
          {events.map((event) => {
            const guests = Number(event.guest_count) || 0;
            const views = Number(event.viewed_count) || 0;
            const confirmed = Number(event.confirmed_count) || 0;
            const rate = guests > 0 ? Math.round((confirmed / guests) * 100) : 0;

            return (
              <tr key={event.id} className="transition-colors hover:bg-ink-800/40">
                <th scope="row" className="max-w-xs px-5 py-3.5 text-left font-normal">
                  <Link
                    href={`/dashboard/events/${event.id}`}
                    className="block truncate text-ink-100 transition-colors hover:text-gold"
                  >
                    {event.title}
                  </Link>
                  <span className="mt-0.5 block truncate text-xs text-ink-400">
                    {event.eventDate
                      ? new Date(event.eventDate).toLocaleDateString(
                          locale === "fr" ? "fr-FR" : "en-US",
                          { day: "numeric", month: "short", year: "numeric" },
                        )
                      : t("portal.analytics.no_date")}
                  </span>
                </th>

                <td data-numeric className="px-3 py-3.5 text-right text-ink-100">
                  {guests}
                </td>
                <td data-numeric className="px-3 py-3.5 text-right text-ink-300">
                  {views}
                </td>
                <td data-numeric className="px-3 py-3.5 text-right text-ink-100">
                  {confirmed}
                </td>

                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    {/* Jauge : piste en pas plus clair de la même famille que
                        le remplissage, pour que l'état se lise sur toute la
                        largeur et pas seulement sur la portion remplie. */}
                    <div
                      className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-gold/15"
                      role="img"
                      aria-label={`${rate}%`}
                    >
                      <div
                        className="h-full rounded-full bg-gold"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                    <span data-numeric className="text-ink-100">
                      {rate}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
