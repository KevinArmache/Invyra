/**
 * Lit une vidéo choisie par un invité avant son envoi : dimensions, durée et
 * image d'aperçu (poster), affichée dans la grille à la place de la vidéo.
 *
 * Une vidéo n'est pas recompressée : elle part telle quelle (voir
 * MAX_VIDEO_BYTES). L'aperçu est une image JPEG légère, prise vers la
 * première seconde.
 *
 * Ne lève jamais d'erreur : ce qui ne peut pas être lu vaut null. C'est le
 * cas d'une vidéo HEVC (iPhone) dans Chrome ou Firefox, dont les métadonnées
 * se lisent mais pas les images ; elle s'envoie quand même, sans aperçu.
 *
 * Navigateur uniquement (vidéo, canvas).
 */

import { MAX_POSTER_BYTES, POSTER_TYPE } from "@/lib/media/memories";

const POSTER_MAX_SIDE = 720;
const TIMEOUT = 15_000;

/** Attend `event` sur l'élément ; rejette sur erreur ou au bout du délai. */
function waitFor(element, event) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => finish(reject, new Error("timeout")), TIMEOUT);
    const onEvent = () => finish(resolve);
    const onError = () => finish(reject, new Error("error"));
    function finish(callback, value) {
      clearTimeout(timer);
      element.removeEventListener(event, onEvent);
      element.removeEventListener("error", onError);
      callback(value);
    }
    element.addEventListener(event, onEvent);
    element.addEventListener("error", onError);
  });
}

/**
 * Image vide : un navigateur qui ne décode pas la vidéo dessine du noir ou
 * rien du tout. Réduite à 8 × 8, il suffit d'un pixel visible pour la garder.
 */
function isBlank(canvas) {
  const probe = document.createElement("canvas");
  probe.width = 8;
  probe.height = 8;
  const context = probe.getContext("2d", { willReadFrequently: true });
  context.drawImage(canvas, 0, 0, 8, 8);
  const { data } = context.getImageData(0, 0, 8, 8);
  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] > 0 && data[index] + data[index + 1] + data[index + 2] > 24) {
      return false;
    }
  }
  return true;
}

async function capture(video) {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) return null;

  const scale = Math.min(1, POSTER_MAX_SIDE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  if (isBlank(canvas)) return null;

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, POSTER_TYPE, 0.8),
  );
  if (!blob || blob.size > MAX_POSTER_BYTES) return null;
  return new File([blob], "poster.jpg", { type: POSTER_TYPE });
}

/**
 * @param {File} file  vidéo choisie
 * @returns {Promise<{ width: number|null, height: number|null,
 *   duration: number|null, poster: File|null }>}
 */
export async function readVideo(file) {
  const result = { width: null, height: null, duration: null, poster: null };
  if (typeof document === "undefined") return result;

  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  // Safari iOS lit les attributs plutôt que les propriétés.
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");

  try {
    const metadata = waitFor(video, "loadedmetadata");
    video.src = url;
    video.load();
    await metadata;

    result.width = video.videoWidth || null;
    result.height = video.videoHeight || null;
    // Une vidéo WebM enregistrée dans un navigateur annonce parfois une
    // durée infinie.
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    if (duration > 0) result.duration = Math.max(1, Math.round(duration));

    const seeked = waitFor(video, "seeked");
    video.currentTime = duration > 0 ? Math.min(1, duration / 4) : 0.1;
    await seeked;
    result.poster = await capture(video);
  } catch {
    // Métadonnées ou aperçu illisibles : la vidéo part sans.
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }

  return result;
}
