import {
  createDesignConfig,
  normalizeDesignConfig,
} from "@/lib/invitation/designs";
import { normalizeFonts } from "@/lib/invitation/fonts";
import { normalizeMusic, normalizeOpening } from "@/lib/invitation/content";
import {
  CODE_TYPE,
  MAX_CODE_LENGTH,
  isCodeConfig,
  isDesignConfig,
  normalizeOpeningCode,
} from "@/lib/templates/config";
import { isVisualEdit } from "@/lib/templates/visual-edit";

/**
 * Modèles avant écriture en base et avant édition : normalisation et
 * contrôle des droits sur le code.
 */

/**
 * Configuration prête à éditer : normalisée pour un modèle design (valeurs
 * par défaut complétées), réduite aux sources pour un modèle code. `null`
 * signifie « aucun modèle » : l'éditeur propose alors les designs.
 */
export function toEditableConfig(config) {
  if (!config || typeof config !== "object") return null;
  if (isDesignConfig(config)) {
    try {
      return normalizeDesignConfig(config);
    } catch {
      // Design retiré du registre : on garde le contenu sur le design par défaut.
      return createDesignConfig(undefined, config.content);
    }
  }
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
 * @param {boolean} options.allowCode  un template code peut-il être enregistré ?
 *   Seuls les admins écrivent du code : c'est du HTML/JS arbitraire servi aux
 *   invités.
 * @param {object} [options.base]  version de référence d'un template code.
 *   Sans `allowCode`, un template code n'est accepté que s'il ne diffère de
 *   `base` que par ses textes, images, liens et couleurs (éditeur visuel).
 */
export function validateTemplateConfig(
  config,
  { allowCode = false, base = null } = {},
) {
  if (!config || typeof config !== "object") {
    throw new Error("Configuration de template invalide");
  }

  if (isDesignConfig(config)) return normalizeDesignConfig(config);

  if (isCodeConfig(config)) {
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

  throw new Error("Type de template inconnu");
}
