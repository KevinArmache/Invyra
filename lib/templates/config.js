import { safeUrl } from "@/lib/invitation/html";

/**
 * Format de `templates.config` en base. Tout modèle est écrit en HTML, CSS et
 * JavaScript : `{ type: "code", html, css, js, opening, openingCode, fonts,
 * music }`. Les modèles de la galerie et la copie propre à chaque événement
 * ont le même format.
 *
 * Module pur : importé côté serveur (validation, actions) et côté client
 * (éditeurs, aperçus).
 */

/** Valeur de `type` d'un modèle. */
export const CODE_TYPE = "code";

export function isCodeConfig(config) {
  return config?.type === CODE_TYPE;
}

/** Modèle vide : l'éditeur de code le remplit avec le code de départ. */
export function emptyCodeConfig() {
  return { type: CODE_TYPE, html: "", css: "", js: "" };
}

/** Taille maximale de chaque source (HTML, CSS, JS) d'un modèle. */
export const MAX_CODE_LENGTH = 200_000;

/**
 * Ouverture écrite en code : `null` tant qu'elle n'a pas de HTML, auquel cas
 * l'ouverture standard (réglages `opening`) s'applique.
 */
export function normalizeOpeningCode(code) {
  if (!code || typeof code !== "object") return null;
  const result = {};
  for (const key of ["html", "css", "js"]) {
    const value = typeof code[key] === "string" ? code[key] : "";
    // Trop volumineux : ignoré au rendu, refusé à l'enregistrement.
    if (value.length > MAX_CODE_LENGTH) return null;
    result[key] = value;
  }
  return result.html.trim() ? result : null;
}

/**
 * Musique jouée à l'ouverture de l'invitation : une URL https, ou rien.
 *
 * @returns {{ url: string } | null}
 */
export function normalizeMusic(music) {
  const url = safeUrl(music?.url);
  return url ? { url } : null;
}
