/**
 * Recherche de lieux pour l'itinéraire, avec Photon (komoot), un service
 * gratuit sans clé, bâti sur les données OpenStreetMap.
 *
 * - searchPlaces : suggestions pendant la frappe ;
 * - reversePlace : adresse d'un point touché sur la carte.
 *
 * Appelé depuis le navigateur de l'hôte : le service public demande un usage
 * raisonnable, d'où l'attente après la frappe (côté composant), l'annulation
 * de la requête précédente (signal) et un petit cache. Changer de service ne
 * touche que ce fichier.
 *
 * Navigateur uniquement.
 */

const PHOTON_URL = "https://photon.komoot.io";
const LIMIT = 6;
const CACHE_SIZE = 50;

export const MIN_QUERY_LENGTH = 3;
const MAX_QUERY_LENGTH = 100;

const cache = new Map();

function remember(key, value) {
  cache.delete(key);
  cache.set(key, value);
  if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value);
  return value;
}

/** Photon ne connaît que quelques langues : français par défaut. */
function photonLang(locale) {
  return locale === "en" ? "en" : "fr";
}

/** Lieu au format d'une étape d'itinéraire (voir lib/itinerary.js). */
function featureToPlace(feature, index) {
  const props = feature?.properties ?? {};
  const [lng, lat] = feature?.geometry?.coordinates ?? [];
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const street = [props.housenumber, props.street].filter(Boolean).join(" ");
  const city = props.city || props.town || props.village || "";
  const locality = [props.postcode, city].filter(Boolean).join(" ");
  const place = props.name || street || city || props.state || props.country || "";
  const parts = [
    street,
    props.district && props.district !== city ? props.district : "",
    locality,
    city ? "" : props.state,
    props.country,
  ].filter((part) => part && part !== place);

  return {
    key: `${props.osm_type ?? ""}${props.osm_id ?? index}`,
    place,
    address: [...new Set(parts)].join(", "),
    lat: Math.round(lat * 1e6) / 1e6,
    lng: Math.round(lng * 1e6) / 1e6,
  };
}

async function fetchPlaces(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Photon ${response.status}`);
  const data = await response.json();
  return (data?.features ?? []).map(featureToPlace).filter(Boolean);
}

/**
 * Lieux correspondant à `query`. `near` (centre de la carte) favorise les
 * résultats proches.
 *
 * @returns {Promise<Array<{ key, place, address, lat, lng }>>}
 */
export async function searchPlaces(query, { locale, near, signal } = {}) {
  const q = String(query ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  if (q.length < MIN_QUERY_LENGTH) return [];

  const params = new URLSearchParams({
    q,
    limit: String(LIMIT),
    lang: photonLang(locale),
  });
  if (near) {
    params.set("lat", near.lat.toFixed(3));
    params.set("lon", near.lng.toFixed(3));
  }
  const url = `${PHOTON_URL}/api/?${params}`;
  if (cache.has(url)) return cache.get(url);
  return remember(url, await fetchPlaces(url, signal));
}

/** Lieu le plus proche d'une position, ou null. */
export async function reversePlace({ lat, lng }, { locale, signal } = {}) {
  const params = new URLSearchParams({
    lat: lat.toFixed(6),
    lon: lng.toFixed(6),
    lang: photonLang(locale),
  });
  const url = `${PHOTON_URL}/reverse?${params}`;
  if (cache.has(url)) return cache.get(url)[0] ?? null;
  const places = remember(url, await fetchPlaces(url, signal));
  return places[0] ?? null;
}
