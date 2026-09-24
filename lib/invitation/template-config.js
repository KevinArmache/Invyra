/**
 * Format de `templates.config` en base. Un modèle est de l'une des deux
 * sortes :
 * - design : `{ type: "theme", themeId, style, content, music }`, rendu par
 *   un design du registre (lib/invitation/designs) ;
 * - code : `{ type: "code", html, css, js, opening, openingCode, fonts,
 *   music }`, écrit à la main.
 *
 * « theme » et « themeId » sont des noms historiques : ils sont enregistrés
 * dans chaque modèle et dans chaque copie de modèle d'un événement. On ne les
 * renomme pas en base ; le reste du code passe par ce module et ne les écrit
 * jamais en dur.
 *
 * Module pur : importé côté serveur (validation, actions) et côté client
 * (éditeurs, aperçus).
 */

/** Valeur de `type` d'un modèle rendu par un design. */
export const DESIGN_TYPE = "theme";

/** Champ qui porte l'identifiant du design. */
export const DESIGN_ID_FIELD = "themeId";

/** Valeur de `type` d'un modèle écrit en HTML, CSS et JavaScript. */
export const CODE_TYPE = "code";

export function isDesignConfig(config) {
  return config?.type === DESIGN_TYPE;
}

export function isCodeConfig(config) {
  return config?.type === CODE_TYPE;
}

export function designIdOf(config) {
  return config?.[DESIGN_ID_FIELD];
}

/**
 * Config d'un modèle design. `fields` : `style`, `content` et, une fois
 * normalisée, `music`, dans cet ordre.
 */
export function toDesignConfig(designId, fields) {
  return { type: DESIGN_TYPE, [DESIGN_ID_FIELD]: designId, ...fields };
}

/** Modèle code vide, point de départ du mode code. */
export function emptyCodeConfig() {
  return { type: CODE_TYPE, html: "", css: "", js: "" };
}
