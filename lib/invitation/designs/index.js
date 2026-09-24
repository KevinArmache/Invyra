import elegance from "@/lib/invitation/designs/elegance";
import minimal from "@/lib/invitation/designs/minimal";
import festive from "@/lib/invitation/designs/festive";
import eclat from "@/lib/invitation/designs/eclat";
import origami from "@/lib/invitation/designs/origami";
import vinyl from "@/lib/invitation/designs/vinyl";
import { renderStandardMarkup } from "@/lib/invitation/markup";
import {
  DEFAULT_CONTENT,
  getFont,
  normalizeContent,
  normalizeMusic,
} from "@/lib/invitation/shared";
import {
  designIdOf,
  toDesignConfig,
} from "@/lib/invitation/template-config";

/**
 * Registre des designs : la mise en page, le CSS et les effets d'un modèle
 * sans code. Ajouter un design = créer son fichier (elegance.js pour un
 * design simple, origami/ ou vinyl/ pour un design avec sa propre ouverture)
 * et l'ajouter à cette liste : le sélecteur, l'éditeur, la validation et le
 * rendu le prennent en charge automatiquement.
 *
 * Forme d'un design : `id`, `name`, `styleSchema`, `defaultStyle`, `presets`
 * (ambiances), `css`, et au choix `heroLayout` (balisage standard) ou
 * `render` (balisage propre). Facultatifs : `script`, `staticScript`,
 * `opening`, `defaultContent`, `hiddenFields`.
 */
export const DESIGNS = [eclat, origami, vinyl, elegance, minimal, festive];

const DESIGNS_BY_ID = Object.fromEntries(
  DESIGNS.map((design) => [design.id, design]),
);

export function getDesign(id) {
  return DESIGNS_BY_ID[id] ?? null;
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/**
 * Ramène un style à la forme du schéma du design. Les valeurs invalides
 * reprennent la valeur par défaut : elles finissent dans du CSS, rien
 * d'autre qu'une couleur hexadécimale, un identifiant de police connu, un
 * nombre borné, un booléen ou une option de la liste n'y entre.
 */
function normalizeStyle(design, style) {
  const source = style && typeof style === "object" ? style : {};
  const result = {};

  for (const field of design.styleSchema) {
    const value = source[field.key];
    const fallback = design.defaultStyle[field.key];

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
    } else if (field.type === "select") {
      result[field.key] = field.options.includes(value) ? value : fallback;
    }
  }

  return result;
}

/**
 * Style → variables CSS. Couleurs : `--c-<clé>` ; polices : `--f-heading`,
 * `--f-body`, `--f-script`… (clé sans le préfixe « font ») ; plages :
 * `--<clé>` avec leur unité. Les interrupteurs et les listes de choix ne
 * donnent pas de variable : le design les lit dans `style` au rendu.
 */
function cssVariables(design, style) {
  const declarations = design.styleSchema
    .filter((field) => field.type !== "toggle" && field.type !== "select")
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
 * Configuration complète d'un nouveau modèle basé sur ce design. Sans
 * contenu fourni, on part du contenu d'exemple du design s'il en a un.
 */
export function createDesignConfig(designId, content) {
  const design = getDesign(designId) ?? DESIGNS[0];
  return toDesignConfig(design.id, {
    style: { ...design.defaultStyle },
    content: normalizeContent(
      content ?? design.defaultContent ?? DEFAULT_CONTENT,
    ),
  });
}

/**
 * Normalise la configuration d'un modèle design. Lève une erreur si le design
 * n'existe pas : c'est le seul cas qu'on ne peut pas réparer silencieusement.
 */
export function normalizeDesignConfig(config) {
  const design = getDesign(designIdOf(config));
  if (!design) throw new Error("Design inconnu");
  return toDesignConfig(design.id, {
    style: normalizeStyle(design, config.style),
    content: normalizeContent(config.content),
    music: normalizeMusic(config.music),
  });
}

/**
 * Rend un modèle design en `{ html, css, js, staticJs, fonts, openingCode }`.
 * `js` contient les effets propres au design ; le script RSVP est ajouté par
 * l'appelant. `openingCode` est l'écran d'ouverture propre au design
 * (`design.opening`), `null` quand il garde l'ouverture standard.
 *
 * @param {object} context
 * @param {Array}  context.details      lignes issues de eventDetails()
 * @param {string} [context.eventDate]  date ISO de l'événement
 */
export function renderDesign(config, { details, eventDate }) {
  const normalized = normalizeDesignConfig(config);
  const design = getDesign(designIdOf(normalized));
  const { style, content } = normalized;

  const html = design.render
    ? design.render({ style, content, details, eventDate })
    : renderStandardMarkup({ content, details }, { hero: design.heroLayout });

  return {
    html,
    css: `${cssVariables(design, style)}\n${design.css}`,
    js: design.script ?? "",
    // Script léger (ex. compte à rebours) exécuté même dans les aperçus
    // statiques, où les effets et le RSVP sont coupés.
    staticJs: design.staticScript ?? "",
    fonts: design.styleSchema
      .filter((field) => field.type === "font")
      .map((field) => style[field.key]),
    openingCode: design.opening
      ? design.opening({ style, content, details })
      : null,
  };
}
