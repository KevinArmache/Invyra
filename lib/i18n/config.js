export const LOCALES = ["fr", "en"];
export const DEFAULT_LOCALE = "fr";
export const LOCALE_COOKIE = "invyra_locale";

export const LOCALE_LABELS = {
  fr: "Français",
  en: "English",
};

export function normalizeLocale(value) {
  if (!value) return DEFAULT_LOCALE;
  const short = String(value).split("-")[0].toLowerCase();
  return LOCALES.includes(short) ? short : DEFAULT_LOCALE;
}

/**
 * Descend une clé pointée (« landing.hero.title ») dans le dictionnaire.
 * Renvoie la clé elle-même si rien ne correspond : une traduction manquante
 * laisse une trace lisible à l'écran plutôt qu'un trou.
 */
export function translate(dictionary, key) {
  if (!dictionary || !key) return key;

  let current = dictionary;
  for (const part of key.split(".")) {
    if (current == null || typeof current !== "object" || !(part in current)) {
      return key;
    }
    current = current[part];
  }

  return current === undefined ? key : current;
}
