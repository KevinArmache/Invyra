/**
 * « il y a 5 min », « hier »… à partir de deux horodatages ; au-delà d'un
 * mois, le jour et le mois. Partagé par le fil d'activité et les avis sur
 * les modèles.
 *
 * @param {Date|string} date
 * @param {number} now  horodatage de référence (ms)
 * @param {string} locale
 * @param {(key: string) => string} t
 */
export function relativeTime(date, now, locale, t) {
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
