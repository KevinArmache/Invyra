import { normalizeFonts } from "@/lib/invitation/fonts";
import { normalizeOpening } from "@/lib/invitation/opening";
import {
  CODE_TYPE,
  MAX_CODE_LENGTH,
  isCodeConfig,
  normalizeMusic,
  normalizeOpeningCode,
} from "@/lib/templates/config";
import { isVisualEdit } from "@/lib/templates/visual-edit";

/**
 * Modèles avant écriture en base et avant édition : normalisation et
 * contrôle des droits sur le code.
 */

/**
 * Configuration prête à éditer, réduite aux champs du format. `null`
 * signifie « aucun modèle » : l'éditeur invite alors à en choisir un.
 */
export function toEditableConfig(config) {
  if (!isCodeConfig(config)) return null;
  return {
    type: CODE_TYPE,
    html: config.html || "",
    css: config.css || "",
    js: config.js || "",
    opening: normalizeOpening(config.opening),
    openingCode: normalizeOpeningCode(config.openingCode),
    fonts: normalizeFonts(config.fonts),
    music: normalizeMusic(config.music),
  };
}

// ─── Validation côté serveur ────────────────────────────────────────────────

/**
 * Valide et normalise une configuration de template avant écriture en base.
 *
 * @param {object} config
 * @param {object} options
 * @param {boolean} options.allowCode  le code peut-il être modifié ? Seuls les
 *   admins écrivent du code : c'est du HTML/JS arbitraire servi aux invités.
 * @param {object} [options.base]  version de référence du template. Sans
 *   `allowCode`, un template n'est accepté que s'il ne diffère de `base` que
 *   par ses textes, images, liens et couleurs (éditeur visuel).
 */
export function validateTemplateConfig(
  config,
  { allowCode = false, base = null } = {},
) {
  if (!config || typeof config !== "object") {
    throw new Error("Configuration de template invalide");
  }
  if (!isCodeConfig(config)) throw new Error("Type de template inconnu");

  if (!allowCode && !isVisualEdit(base, config)) {
    throw new Error(
      "Seul un administrateur peut modifier le code de ce modèle. Sans code, seuls les textes, les images, les liens et les couleurs peuvent changer.",
    );
  }
  const code = {};
  for (const key of ["html", "css", "js"]) {
    const value = typeof config[key] === "string" ? config[key] : "";
    if (value.length > MAX_CODE_LENGTH) {
      throw new Error("Template trop volumineux");
    }
    code[key] = value;
  }
  for (const key of ["html", "css", "js"]) {
    const value = config.openingCode?.[key];
    if (typeof value === "string" && value.length > MAX_CODE_LENGTH) {
      throw new Error("Écran d'ouverture trop volumineux");
    }
  }
  return {
    type: CODE_TYPE,
    ...code,
    opening: normalizeOpening(config.opening),
    openingCode: normalizeOpeningCode(config.openingCode),
    fonts: normalizeFonts(config.fonts),
    music: normalizeMusic(config.music),
  };
}
