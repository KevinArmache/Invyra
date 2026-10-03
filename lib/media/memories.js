/**
 * Photos et vidéos partagées par les invités : types acceptés, poids
 * maximaux et emplacement des fichiers sur Vercel Blob.
 *
 * Module pur, importable côté serveur (app/api/upload/route.js,
 * app/actions/memories.js) comme côté client (PhotoWall) : les deux côtés
 * appliquent ainsi les mêmes règles.
 *
 * Emplacements, tous sous memories/<eventId>/ :
 * - photo  : photo.<ext>            (à la racine, comme les photos d'avant)
 * - vidéo  : videos/video.<ext>
 * - poster : posters/poster.jpg     (image d'aperçu d'une vidéo)
 *
 * Vercel Blob ajoute un suffixe aléatoire à chaque nom.
 */

export const MEMORIES_PREFIX = "memories/";

export const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];

/** MP4 (Android, la plupart des appareils), MOV (iPhone), WebM. */
export const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export const POSTER_TYPE = "image/jpeg";

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const MAX_POSTER_BYTES = 1024 * 1024;

const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

/** Types déduits de l'extension, quand le navigateur n'en donne aucun. */
const TYPES_BY_EXTENSION = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  jfif: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

/**
 * Extension d'un type MIME. Elle ne vient jamais du nom du fichier : un
 * « .jfif » ou un nom sans extension donnait un chemin que Vercel Blob
 * refusait.
 */
export function extensionFor(type) {
  return EXTENSIONS[type] ?? "bin";
}

/** Type MIME d'un fichier, deviné par l'extension si le navigateur l'omet. */
export function mediaTypeOf(file) {
  if (file?.type) return file.type;
  const extension = String(file?.name ?? "").split(".").pop()?.toLowerCase();
  return TYPES_BY_EXTENSION[extension] ?? "";
}

export function isVideoType(type) {
  return VIDEO_TYPES.includes(type);
}

/** Chemin d'envoi d'un fichier ; `kind` : "photo" | "video" | "poster". */
export function memoryPath(eventId, kind, type) {
  const base = `${MEMORIES_PREFIX}${eventId}/`;
  if (kind === "video") return `${base}videos/video.${extensionFor(type)}`;
  if (kind === "poster") return `${base}posters/poster.jpg`;
  return `${base}photo.${extensionFor(type)}`;
}

/**
 * Nature d'un chemin d'envoi : "photo", "video", "poster", ou null s'il
 * n'appartient pas au dossier de cet événement ou n'a pas la bonne forme.
 */
export function memoryPathKind(pathname, eventId) {
  const base = `${MEMORIES_PREFIX}${eventId}/`;
  if (typeof pathname !== "string" || !pathname.startsWith(base)) return null;

  const parts = pathname.slice(base.length).split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) return null;
  if (parts.length === 1) return "photo";
  if (parts.length === 2) {
    if (parts[0] === "videos") return "video";
    if (parts[0] === "posters") return "poster";
  }
  return null;
}

/** Durée lisible : « 0:42 », « 12:05 », « 1:02:05 ». */
export function formatDuration(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = String(total % 60).padStart(2, "0");
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}`
    : `${minutes}:${rest}`;
}

/** Codes levés tels quels par PhotoWall et renvoyés par addEventPhoto. */
const CODES = new Set([
  "type",
  "size",
  "video_size",
  "limit",
  "video_limit",
  "closed",
  "invalid",
]);

/**
 * Cause d'un envoi raté, pour choisir le message affiché.
 *
 * Quand /api/upload refuse un envoi, le SDK de Vercel Blob ne transmet pas
 * la raison (« Failed to retrieve the client token ») : les limites sont
 * donc vérifiées dans le navigateur avant l'envoi, et un refus restant est
 * annoncé comme tel ("refused").
 */
export function uploadErrorCode(error) {
  const message = String(error?.message ?? "");
  if (CODES.has(message)) return message;
  if (/content type mismatch/i.test(message)) return "type";
  if (/file is too large/i.test(message)) return "size";
  if (/client token|access denied|has expired/i.test(message)) return "refused";
  if (
    (typeof navigator !== "undefined" && navigator.onLine === false) ||
    error?.name === "TypeError" ||
    /failed to fetch|network|load failed|aborted/i.test(message)
  ) {
    return "network";
  }
  return "server";
}
