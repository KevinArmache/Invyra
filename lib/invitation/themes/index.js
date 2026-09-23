import elegance from "@/lib/invitation/themes/elegance";
import minimal from "@/lib/invitation/themes/minimal";
import festive from "@/lib/invitation/themes/festive";
import eclat from "@/lib/invitation/themes/eclat";
import { renderStandardMarkup } from "@/lib/invitation/markup";
import {
  DEFAULT_CONTENT,
  getFont,
  normalizeContent,
  normalizeMusic,
} from "@/lib/invitation/shared";

/**
 * Registre des thèmes. Ajouter un thème = créer son fichier (voir
 * elegance.js pour la forme attendue) et l'ajouter à cette liste : l'éditeur,
 * la validation et le rendu le prennent en charge automatiquement.
 */
export const THEMES = [eclat, elegance, minimal, festive];

const THEMES_BY_ID = Object.fromEntries(
  THEMES.map((theme) => [theme.id, theme]),
);

export function getTheme(id) {
  return THEMES_BY_ID[id] ?? null;
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/**
 * Ramène un style à la forme du schéma du thème. Les valeurs invalides
 * reprennent la valeur par défaut : elles finissent dans du CSS, rien
 * d'autre qu'une couleur hexadécimale, un identifiant de police connu, un
 * nombre borné ou un booléen n'y entre.
 */
export function normalizeStyle(theme, style) {
  const source = style && typeof style === "object" ? style : {};
  const result = {};

  for (const field of theme.styleSchema) {
    const value = source[field.key];
    const fallback = theme.defaultStyle[field.key];

    if (field.type === "color") {
      result[field.key] =
        typeof value === "string" && HEX_COLOR.test(value)
          ? value.toLowerCase()
          : fallback;
    } else if (field.type === "font") {
      result[field.key] = getFont(value) ? value : fallback;
    } else if (field.type === "range") {
      const number = Number(value);
      result[field.key] = Number.isFinite(number)
        ? Math.min(field.max, Math.max(field.min, number))
        : fallback;
    } else if (field.type === "toggle") {
      result[field.key] = typeof value === "boolean" ? value : fallback;
    }
  }

  return result;
}

/**
 * Style → variables CSS. Couleurs : `--c-<clé>` ; polices : `--f-heading`,
 * `--f-body`, `--f-script` (clé sans le préfixe « font ») ; plages :
 * `--<clé>` avec leur unité. Les interrupteurs ne donnent pas de variable :
 * le thème les lit dans `style` au rendu.
 */
function cssVariables(theme, style) {
  const declarations = theme.styleSchema
    .filter((field) => field.type !== "toggle")
    .map((field) => {
      const value = style[field.key];
      if (field.type === "color") return `--c-${field.key}: ${value};`;
      if (field.type === "font") {
        const name = field.key.replace(/^font/, "").toLowerCase();
        return `--f-${name}: ${getFont(value).stack};`;
      }
      return `--${field.key}: ${value}${field.unit ?? ""};`;
    });
  return `:root { ${declarations.join(" ")} }`;
}

/**
 * Configuration complète d'un nouveau template basé sur ce thème. Sans
 * contenu fourni, on part du contenu d'exemple du thème s'il en a un.
 */
export function createThemeConfig(themeId, content) {
  const theme = getTheme(themeId) ?? THEMES[0];
  return {
    type: "theme",
    themeId: theme.id,
    style: { ...theme.defaultStyle },
    content: normalizeContent(
      content ?? theme.defaultContent ?? DEFAULT_CONTENT,
    ),
  };
}

/**
 * Normalise une configuration de type thème. Lève une erreur si le thème
 * n'existe pas : c'est le seul cas qu'on ne peut pas réparer silencieusement.
 */
export function normalizeThemeConfig(config) {
  const theme = getTheme(config?.themeId);
  if (!theme) throw new Error("Thème inconnu");
  return {
    type: "theme",
    themeId: theme.id,
    style: normalizeStyle(theme, config.style),
    content: normalizeContent(config.content),
    music: normalizeMusic(config.music),
  };
}

/**
 * Rend un template à thème en `{ html, css, js, fonts }`. `js` contient les
 * effets propres au thème ; le script RSVP est ajouté par l'appelant.
 *
 * @param {object} context
 * @param {Array}  context.details      lignes issues de eventDetails()
 * @param {string} [context.eventDate]  date ISO de l'événement
 */
export function renderTheme(config, { details, eventDate }) {
  const normalized = normalizeThemeConfig(config);
  const theme = getTheme(normalized.themeId);
  const { style, content } = normalized;

  const html = theme.render
    ? theme.render({ style, content, details, eventDate })
    : renderStandardMarkup({ content, details }, { hero: theme.heroLayout });

  return {
    html,
    css: `${cssVariables(theme, style)}\n${theme.css}`,
    js: theme.script ?? "",
    // Script léger (ex. compte à rebours) exécuté même dans les aperçus
    // statiques, où les effets et le RSVP sont coupés.
    staticJs: theme.staticScript ?? "",
    fonts: theme.styleSchema
      .filter((field) => field.type === "font")
      .map((field) => style[field.key]),
  };
}
