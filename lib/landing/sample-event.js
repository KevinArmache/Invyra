/**
 * Événement fictif des aperçus publics (vitrine de la page d'accueil).
 *
 * Sa date est toujours à venir : un aperçu ouvert aujourd'hui comme dans un
 * an montre un compte à rebours qui défile, jamais bloqué à zéro. L'heure est
 * décalée de celle du moment pour que les heures et les minutes affichées ne
 * tombent pas à « 00 ».
 */

const DAY = 86_400_000;
/** Écart entre aujourd'hui et la date fictive. */
const DAYS_AHEAD = 127;

export function sampleEvent(now = new Date()) {
  const date = new Date(now.getTime() + DAYS_AHEAD * DAY);
  // Un quart d'heure rond (« 20h45 ») situé 6 h et 21 à 35 min plus tard que
  // maintenant : le compte à rebours affiche des heures et des minutes.
  const quarters = Math.floor((now.getMinutes() + 20) / 15) + 1;
  const hours = (now.getHours() + 6 + Math.floor(quarters / 4)) % 24;
  const minutes = (quarters % 4) * 15;
  const time = `${hours}h${String(minutes).padStart(2, "0")}`;

  return {
    title: "Camille & Antoine",
    // Minuit UTC : même convention que les événements réels (voir createEvent).
    eventDate: `${date.toISOString().slice(0, 10)}T00:00:00.000Z`,
    location: "Domaine de la Roseraie",
    time,
    dressCode: "Tenue de soirée",
  };
}
