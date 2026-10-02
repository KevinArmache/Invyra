/**
 * Jour d'un événement en toutes lettres (« Samedi 19 décembre 2026 »), pour
 * le billet, le PDF du billet et l'écran d'accueil.
 *
 * Lu en UTC : les dates d'événement sont enregistrées à minuit UTC (voir
 * createEvent). Module pur, importable côté serveur comme côté client.
 *
 * @param {Date|string|null} eventDate
 * @param {string} [locale]  "fr" ou "en"
 * @returns {string|null}
 */
export function eventDayLabel(eventDate, locale = "fr") {
  if (!eventDate) return null;
  const date = new Date(eventDate);
  if (Number.isNaN(date.getTime())) return null;
  const label = date.toLocaleDateString(locale === "en" ? "en-US" : "fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Heure locale « 18:42 » d'un horodatage (arrivée d'un invité). */
export function clockLabel(value, locale = "fr") {
  if (!value) return "";
  return new Date(value).toLocaleTimeString(locale === "en" ? "en-US" : "fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
