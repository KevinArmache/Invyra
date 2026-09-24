import { safeUrl } from "@/lib/invitation/shared";
import { isCodeConfig, isDesignConfig } from "@/lib/invitation/template-config";

/**
 * Édition « sans code » d'un template code.
 *
 * Un template code est du HTML/CSS écrit à la main : on ne peut pas en tirer
 * un formulaire complet. On en extrait donc ce qu'un client veut réellement
 * changer, sans toucher à la structure :
 * - les textes (entre deux balises) ;
 * - les images et liens (`src`, `href`, `url(...)`) ;
 * - les couleurs hexadécimales du CSS et des attributs `style`.
 *
 * Chaque valeur est un « emplacement » repéré par sa position dans la
 * source : modifier une valeur remplace ces caractères-là, le reste du code
 * reste identique à l'octet près.
 *
 * Côté serveur, le même découpage sert à vérifier qu'une modification venue
 * d'un non-admin n'a changé que ces emplacements (voir isVisualEdit) : le
 * squelette (tout sauf les emplacements) doit être identique à l'original.
 *
 * Module pur, sans DOM : importé par l'éditeur et par la validation serveur.
 */

// ─── Découpage ──────────────────────────────────────────────────────────────

/**
 * Jetons HTML : commentaires, blocs dont le contenu n'est pas du texte
 * (script, style…), balises. Ce qui est entre deux jetons est du texte.
 */
const HTML_TOKEN =
  /<!--[\s\S]*?-->|<(script|style|textarea|title|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>|<\/?[a-zA-Z][^>]*>/g;

const URL_ATTRIBUTE = /\b(src|href|poster)\s*=\s*(["'])(.*?)\2/g;
const STYLE_ATTRIBUTE = /\bstyle\s*=\s*(["'])(.*?)\1/g;
const CSS_URL = /url\(\s*(["']?)([^"')]*)\1\s*\)/g;
const HEX_COLOR = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-zA-Z_-])/g;
/** Bloc de déclarations le plus interne : les sélecteurs restent dehors. */
const CSS_BLOCK = /\{([^{}]*)\}/g;

/** Un texte n'est proposé que s'il contient une lettre, un chiffre ou un jeton. */
const MEANINGFUL = /[\p{L}\p{N}]|\{\{/u;

/** Emplacements `url(...)` et couleurs dans un fragment de CSS. */
function scanDeclarations(text, offset, context, slots) {
  // Une couleur à l'intérieur d'un url(...) (fragment « #abc ») n'en est pas une.
  const inUrl = [];
  for (const match of text.matchAll(CSS_URL)) {
    inUrl.push([match.index, match.index + match[0].length]);
    const value = match[2];
    if (!value.trim() || value.startsWith("data:") || value.startsWith("#")) {
      continue;
    }
    const start = offset + match.index + match[0].indexOf(value, 4);
    slots.push({
      kind: "url",
      start,
      end: start + value.length,
      value,
      ...context,
    });
  }
  for (const match of text.matchAll(HEX_COLOR)) {
    if (inUrl.some(([from, to]) => match.index >= from && match.index < to)) {
      continue;
    }
    slots.push({
      kind: "color",
      start: offset + match.index,
      end: offset + match.index + match[0].length,
      value: match[0],
      ...context,
    });
  }
}

function tagInfo(tag) {
  const name = /^<\/?([a-zA-Z][\w-]*)/.exec(tag)?.[1]?.toLowerCase() ?? "";
  const className = /\bclass\s*=\s*(["'])(.*?)\1/.exec(tag)?.[2]?.trim();
  return { tag: name, className: className?.split(/\s+/)[0] ?? "" };
}

/**
 * @returns {Array<{kind: "text"|"url"|"color", start: number, end: number,
 *   value: string, tag?: string, className?: string, group?: string}>}
 */
function scanHtml(html) {
  const source = typeof html === "string" ? html : "";
  const slots = [];
  let cursor = 0;
  let group = "";
  let current = { tag: "", className: "" };

  function pushText(from, to) {
    const raw = source.slice(from, to);
    const trimmedStart = raw.length - raw.trimStart().length;
    const value = raw.trim();
    if (!value) return;
    slots.push({
      kind: "text",
      start: from + trimmedStart,
      end: from + trimmedStart + value.length,
      value,
      meaningful: MEANINGFUL.test(value),
      group,
      ...current,
    });
  }

  for (const match of source.matchAll(HTML_TOKEN)) {
    pushText(cursor, match.index);
    const token = match[0];
    cursor = match.index + token.length;

    if (token.startsWith("<!--")) {
      // Les commentaires de section (<!-- GALERIE -->) servent de titres.
      const label = token.slice(4, -3).trim();
      if (label && label.length <= 60 && !label.includes("\n")) group = label;
      continue;
    }
    if (match[1]) continue; // script, style… : pas de texte éditable dedans.
    if (token.startsWith("</")) continue;

    current = tagInfo(token);
    const context = { group, ...current };

    for (const attribute of token.matchAll(URL_ATTRIBUTE)) {
      const value = attribute[3];
      if (!value.trim() || value.startsWith("#") || value.startsWith("data:")) {
        continue;
      }
      const start =
        match.index + attribute.index + attribute[0].length - value.length - 1;
      slots.push({
        kind: "url",
        attribute: attribute[1].toLowerCase(),
        start,
        end: start + value.length,
        value,
        ...context,
      });
    }
    for (const attribute of token.matchAll(STYLE_ATTRIBUTE)) {
      const offset =
        match.index +
        attribute.index +
        attribute[0].length -
        attribute[2].length -
        1;
      scanDeclarations(attribute[2], offset, context, slots);
    }
  }
  pushText(cursor, source.length);

  return slots.sort((a, b) => a.start - b.start);
}

export function scanCss(css) {
  const source = typeof css === "string" ? css : "";
  // Les commentaires sont neutralisés (même longueur) pour ne pas y
  // chercher de couleurs.
  const masked = source.replace(/\/\*[\s\S]*?\*\//g, (comment) =>
    " ".repeat(comment.length),
  );
  // `slice(0, index)` à chaque bloc serait quadratique sur un gros CSS : on
  // repère plutôt la fin de la règle précédente au fil de la boucle.
  const slots = [];
  let previousEnd = 0;
  for (const block of masked.matchAll(CSS_BLOCK)) {
    // Sélecteur du bloc : ce qui précède l'accolade depuis la règle d'avant.
    const selector = masked
      .slice(previousEnd, block.index)
      .split(/[;{}]/)
      .pop()
      .trim()
      .replace(/\s+/g, " ");
    scanDeclarations(block[1], block.index + 1, { selector }, slots);
    previousEnd = block.index + block[0].length;
  }
  return slots.sort((a, b) => a.start - b.start);
}

/** Remplace les emplacements modifiés : `edits` associe un index à sa valeur. */
export function applyEdits(source, slots, edits) {
  let result = "";
  let cursor = 0;
  slots.forEach((slot, index) => {
    if (!(index in edits)) return;
    result += source.slice(cursor, slot.start) + edits[index];
    cursor = slot.end;
  });
  return result + source.slice(cursor);
}

// ─── Valeurs lisibles ───────────────────────────────────────────────────────

const ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  laquo: "«",
  raquo: "»",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  rsquo: "’",
  lsquo: "‘",
  eacute: "é",
  egrave: "è",
  agrave: "à",
  ccedil: "ç",
};

/** Texte HTML → texte affiché dans le formulaire (entités décodées, espaces réduits). */
export function decodeText(raw) {
  return String(raw)
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, name) => {
      if (name[0] === "#") {
        const code =
          name[1].toLowerCase() === "x"
            ? parseInt(name.slice(2), 16)
            : parseInt(name.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : match;
      }
      return ENTITIES[name.toLowerCase()] ?? match;
    })
    .replace(/\s+/g, " ");
}

/** Texte saisi → HTML : seuls &, < et > posent problème entre deux balises. */
export function encodeText(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * URL saisie → valeur d'attribut ou de `url()` : les caractères qui
 * fermeraient l'attribut ou la parenthèse sont encodés.
 */
export function encodeUrl(value) {
  return String(value ?? "")
    .trim()
    .replace(/["'()\s\\<>]/g, (char) => encodeURIComponent(char));
}

/** Couleur au format #rrggbb, pour le sélecteur de couleur. */
export function expandHex(value) {
  const hex = String(value).toLowerCase();
  if (hex.length === 4) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return hex;
}

// ─── Sources d'un template code ─────────────────────────────────────────────

/**
 * Les sources éditables d'un template code : l'invitation et, s'il est écrit
 * en code, l'écran d'ouverture.
 */
export const VISUAL_SOURCES = [
  { key: "openingHtml", kind: "html", get: (c) => c?.openingCode?.html },
  { key: "openingCss", kind: "css", get: (c) => c?.openingCode?.css },
  { key: "html", kind: "html", get: (c) => c?.html },
  { key: "css", kind: "css", get: (c) => c?.css },
];

export function scanSource(kind, text) {
  return kind === "html" ? scanHtml(text) : scanCss(text);
}

/** Écrit les sources modifiées dans une nouvelle config. */
export function withSources(config, sources) {
  const next = { ...config };
  if ("html" in sources) next.html = sources.html;
  if ("css" in sources) next.css = sources.css;
  if (
    config.openingCode &&
    ("openingHtml" in sources || "openingCss" in sources)
  ) {
    next.openingCode = {
      ...config.openingCode,
      ...("openingHtml" in sources && { html: sources.openingHtml }),
      ...("openingCss" in sources && { css: sources.openingCss }),
    };
  }
  return next;
}

// ─── Vérification côté serveur ──────────────────────────────────────────────

/**
 * Squelette HTML : la suite des balises, commentaires et blocs script/style,
 * emplacements d'URL et de couleur remplacés par un marqueur. Le texte entre
 * deux balises n'en fait pas partie : c'est précisément ce qu'on peut changer.
 */
function htmlSkeleton(html, slots) {
  const values = slots.filter((slot) => slot.kind !== "text");
  const parts = [];
  for (const match of html.matchAll(HTML_TOKEN)) {
    const start = match.index;
    const end = start + match[0].length;
    let token = "";
    let cursor = start;
    for (const slot of values) {
      if (slot.start < start || slot.end > end) continue;
      token += html.slice(cursor, slot.start) + "\u0000";
      cursor = slot.end;
    }
    parts.push(token + html.slice(cursor, end));
  }
  return parts.join("\n");
}

/** Squelette CSS : tout sauf les URL et les couleurs. */
function cssSkeleton(css, slots) {
  let result = "";
  let cursor = 0;
  for (const slot of slots) {
    result += css.slice(cursor, slot.start) + "\u0000";
    cursor = slot.end;
  }
  return result + css.slice(cursor);
}

function validSlotValue(slot, previous) {
  // Sans « < », un texte ne peut pas ouvrir de balise.
  if (slot.kind === "text") return !slot.value.includes("<");
  // Trouvée par HEX_COLOR : c'est forcément une couleur hexadécimale.
  if (slot.kind === "color") return true;
  if (previous && previous.value === slot.value) return true;
  if (slot.value === "") return true;
  return Boolean(safeUrl(slot.value)) && !/["'()\s\<>]/.test(slot.value);
}

function sameSource(kind, before, after) {
  const a = typeof before === "string" ? before : "";
  const b = typeof after === "string" ? after : "";
  if (a === b) return true;

  const beforeSlots = scanSource(kind, a);
  const afterSlots = scanSource(kind, b);
  const toSkeleton = kind === "html" ? htmlSkeleton : cssSkeleton;
  if (toSkeleton(a, beforeSlots) !== toSkeleton(b, afterSlots)) return false;

  // Squelettes identiques : les emplacements non textuels se correspondent
  // un à un.
  const previous = beforeSlots.filter((slot) => slot.kind !== "text");
  let index = 0;
  return afterSlots.every((slot) =>
    slot.kind === "text"
      ? validSlotValue(slot)
      : validSlotValue(slot, previous[index++]),
  );
}

/**
 * `next` ne diffère-t-il de `base` que par ses textes, images, liens et
 * couleurs ? Le JavaScript doit être strictement identique.
 */
export function isVisualEdit(base, next) {
  if (!base || !next || isDesignConfig(base) || !isCodeConfig(next)) {
    return false;
  }
  if ((base.js ?? "") !== (next.js ?? "")) return false;
  if (Boolean(base.openingCode?.html) !== Boolean(next.openingCode?.html)) {
    return false;
  }
  if ((base.openingCode?.js ?? "") !== (next.openingCode?.js ?? "")) {
    return false;
  }
  return VISUAL_SOURCES.every((source) =>
    sameSource(source.kind, source.get(base), source.get(next)),
  );
}
