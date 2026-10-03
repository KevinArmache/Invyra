import { nanoid } from "nanoid";

/**
 * Itinéraire d'un événement : ses étapes, dans l'ordre (cérémonie à la
 * mairie, puis réception…), stockées dans Event.itinerary.
 *
 * Une étape :
 *   { id, title, time, place, address, lat, lng }
 * - title    ce qui s'y passe (« Cérémonie »), facultatif ;
 * - time     heure « HH:MM », ou "" ;
 * - place    nom du lieu (« Salle Les Jardins ») ;
 * - address  adresse ;
 * - lat/lng  position sur la carte, ou null pour une étape saisie à la main.
 *
 * Event.location reste le résumé de la première étape (deriveLocation) : les
 * e-mails, les PDF, les modèles d'invitation ({{LOCATION}}) et les listes le
 * lisent toujours. Un événement créé avant l'itinéraire n'a que ce texte :
 * stopsOf en fait une étape.
 *
 * Module pur, importable côté serveur comme côté client.
 */

export const MAX_STOPS = 10;

const LIMITS = { title: 60, place: 150, address: 300 };
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const ID_PATTERN = /^[\w-]{1,24}$/;

/** Taille maximale du champ envoyé par le formulaire (JSON). */
const MAX_FIELD_LENGTH = 20_000;

/** Tuiles OpenStreetMap : l'attribution doit rester visible sur la carte. */
export const OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';

/** Vue de départ d'une carte sans étape : Afrique et Europe. */
export const DEFAULT_VIEW = { lat: 12, lng: 14, zoom: 3 };

function text(value, max) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function coordinate(value, limit) {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || Math.abs(number) > limit) return null;
  return Math.round(number * 1e6) / 1e6;
}

export function newStopId() {
  return nanoid(10);
}

/**
 * Étape vide. L'identifiant par défaut est fixe : le rendu serveur et le
 * navigateur doivent produire le même formulaire.
 */
export function emptyStop(id = "s1") {
  return { id, title: "", time: "", place: "", address: "", lat: null, lng: null };
}

/** Étape tirée du lieu en texte d'un événement créé avant l'itinéraire. */
export function legacyStop(location) {
  const value = text(location, LIMITS.address);
  const short = value.length <= LIMITS.place;
  return {
    ...emptyStop("legacy"),
    place: short ? value : "",
    address: short ? "" : value,
  };
}

export function hasCoords(stop) {
  return Number.isFinite(stop?.lat) && Number.isFinite(stop?.lng);
}

/**
 * Étapes valides, nettoyées : textes bornés, heure au bon format,
 * coordonnées dans leurs bornes (les deux ou aucune), identifiants uniques.
 * Une étape sans lieu, sans adresse et sans position est écartée.
 */
export function cleanItinerary(value) {
  if (!Array.isArray(value)) return [];

  const stops = [];
  const ids = new Set();
  for (const raw of value) {
    if (stops.length >= MAX_STOPS) break;
    if (!raw || typeof raw !== "object") continue;

    const lat = coordinate(raw.lat, 90);
    const lng = coordinate(raw.lng, 180);
    const pinned = lat !== null && lng !== null;
    const stop = {
      id: "",
      title: text(raw.title, LIMITS.title),
      time: TIME_PATTERN.test(raw.time) ? raw.time : "",
      place: text(raw.place, LIMITS.place),
      address: text(raw.address, LIMITS.address),
      lat: pinned ? lat : null,
      lng: pinned ? lng : null,
    };
    if (!stop.place && !stop.address && !pinned) continue;

    let id = typeof raw.id === "string" && ID_PATTERN.test(raw.id) ? raw.id : "";
    while (!id || ids.has(id)) id = newStopId();
    ids.add(id);
    stops.push({ ...stop, id });
  }
  return stops;
}

/**
 * Étapes envoyées par le formulaire (champ caché, en JSON). `undefined` si
 * le champ est absent ou illisible : l'itinéraire enregistré est alors
 * laissé tel quel.
 */
export function parseItineraryField(raw) {
  if (raw === undefined || raw === null) return undefined;
  if (Array.isArray(raw)) return cleanItinerary(raw);
  if (typeof raw !== "string" || raw.length > MAX_FIELD_LENGTH) return undefined;
  try {
    return cleanItinerary(JSON.parse(raw));
  } catch {
    return undefined;
  }
}

/** Étapes d'un événement, y compris un ancien lieu en texte. */
export function stopsOf(event) {
  const stops = cleanItinerary(event?.itinerary);
  if (stops.length > 0) return stops;
  const location = text(event?.location, LIMITS.address);
  return location ? [legacyStop(location)] : [];
}

/** Résumé enregistré dans Event.location : le lieu de la première étape. */
export function deriveLocation(stops) {
  const first = stops?.[0];
  if (!first) return null;
  return first.place || first.address || null;
}

/** Lieu et adresse sur une ligne. */
export function stopLabel(stop) {
  return [stop.place, stop.address].filter(Boolean).join(", ");
}

/** Destination d'une étape pour un service de cartes : position ou texte. */
function stopTarget(stop) {
  return hasCoords(stop) ? `${stop.lat},${stop.lng}` : stopLabel(stop);
}

export function googleMapsLink(stop) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stopTarget(stop))}`;
}

export function wazeLink(stop) {
  return hasCoords(stop)
    ? `https://waze.com/ul?ll=${encodeURIComponent(`${stop.lat},${stop.lng}`)}&navigate=yes`
    : `https://waze.com/ul?q=${encodeURIComponent(stopLabel(stop))}&navigate=yes`;
}

export function appleMapsLink(stop) {
  return `https://maps.apple.com/?daddr=${encodeURIComponent(stopTarget(stop))}`;
}

/**
 * Trajet complet dans Google Maps, depuis la position de l'invité, par
 * toutes les étapes. Google limite les étapes intermédiaires (3 sur mobile) :
 * les liens par étape restent la référence.
 */
export function fullRouteLink(stops) {
  const targets = (stops ?? []).map(stopTarget).filter(Boolean);
  if (targets.length < 2) return null;
  const destination = targets[targets.length - 1];
  const waypoints = targets.slice(0, -1).join("|");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&waypoints=${encodeURIComponent(waypoints)}&travelmode=driving`;
}

/** Page d'itinéraire d'un invité. */
export function directionsPath(token) {
  return `/invite/${token}/directions`;
}

/** Une ligne par étape : « 14:00 · Cérémonie · Mairie du 5e ». */
export function stopLines(stops) {
  return (stops ?? []).map((stop) =>
    [stop.time, stop.title, stop.place || stop.address].filter(Boolean).join(" · "),
  );
}

/** Distance en mètres entre deux positions. */
export function distanceMeters(a, b) {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}
