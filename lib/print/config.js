import { normalizeFonts } from "@/lib/invitation/fonts";
import { MAX_CODE_LENGTH } from "@/lib/templates/config";
import { getFormat } from "@/lib/print/formats";
import { getFinish, getPaper } from "@/lib/print/options";

/**
 * Configuration d'un modèle papier (Template.config, `medium: "print"`) :
 *
 *   {
 *     type: "print",
 *     css,                         // partagé par toutes les faces
 *     fonts: ["cormorant", …],     // voir lib/invitation/fonts.js
 *     pieces: [                    // la première est l'invitation
 *       { kind: "invitation", format: "folded-a5",
 *         faces: { cover: "<html>", "inside-left": "…", … } },
 *     ],
 *     paper: "cotton",             // papier conseillé (lib/print/options.js)
 *     finishes: ["foil-gold"],     // finitions dessinées dans le modèle
 *   }
 *
 * Chaque face est un fragment HTML placé dans `<section class="face">`,
 * mesuré en mm (voir lib/print/document.js). Les jetons sont ceux des
 * invitations ({{EVENT_TITLE}}, {{GUEST_NAME}}, data-if…), plus
 * {{INVITE_QR}} : le QR code qui mène à l'invitation en ligne.
 *
 * Module pur, importable côté serveur comme côté client.
 */

export const PRINT_TYPE = "print";

/** Pièces d'une suite papier, dans l'ordre d'affichage. */
export const PIECE_KINDS = [
  "invitation",
  "save-the-date",
  "rsvp",
  "info",
  "menu",
  "place-card",
  "program",
  "thank-you",
];

/** Pièces au plus dans un modèle : une suite complète. */
const MAX_PIECES = 8;

export function isPrintConfig(config) {
  return (
    config?.type === PRINT_TYPE &&
    Array.isArray(config.pieces) &&
    config.pieces.length > 0
  );
}

function text(value) {
  return typeof value === "string" ? value : "";
}

/** Pièce ramenée à son format : faces connues seulement, toutes présentes. */
function normalizePiece(piece) {
  const format = getFormat(piece?.format);
  if (!format) return null;
  const faces = Object.fromEntries(
    format.faces.map((face) => [face, text(piece.faces?.[face])]),
  );
  return {
    kind: PIECE_KINDS.includes(piece.kind) ? piece.kind : "invitation",
    format: format.id,
    faces,
  };
}

/**
 * Configuration lisible par le moteur, ou null si ce n'est pas un modèle
 * papier. Les champs inconnus sont retirés.
 */
export function normalizePrintConfig(config) {
  if (!isPrintConfig(config)) return null;
  const pieces = config.pieces.slice(0, MAX_PIECES).map(normalizePiece).filter(Boolean);
  if (pieces.length === 0) return null;
  return {
    type: PRINT_TYPE,
    css: text(config.css),
    fonts: normalizeFonts(config.fonts),
    pieces,
    paper: getPaper(config.paper)?.id ?? "matte",
    finishes: Array.isArray(config.finishes)
      ? config.finishes.filter((id) => getFinish(id))
      : [],
  };
}

/**
 * Valide un modèle papier avant écriture en base. Réservé aux admins : le
 * HTML et le CSS sont écrits à la main.
 *
 * @returns {object} la configuration normalisée
 * @throws si le modèle est invalide ou trop volumineux
 */
export function validatePrintConfig(config) {
  const normalized = normalizePrintConfig(config);
  if (!normalized) throw new Error("Modèle papier invalide : format ou faces manquants.");

  let size = normalized.css.length;
  for (const piece of normalized.pieces) {
    for (const html of Object.values(piece.faces)) size += html.length;
  }
  if (size > MAX_CODE_LENGTH) throw new Error("Modèle papier trop volumineux");
  return normalized;
}

/**
 * Première photo du modèle (https), face par face dans l'ordre de lecture :
 * l'aperçu du lien partagé d'un modèle papier (Open Graph).
 */
export function printTemplateImage(config) {
  for (const piece of config?.pieces ?? []) {
    for (const html of Object.values(piece.faces ?? {})) {
      const match = /<img\b[^>]*\ssrc\s*=\s*["'](https:\/\/[^"']+)["']/i.exec(html);
      if (match) return match[1].replace(/&amp;/g, "&");
    }
  }
  return null;
}

const IMG_SRC = /(<img\b[^>]*\ssrc\s*=\s*["'])(https:\/\/[^"']+)(["'])/gi;

/**
 * Photos (https) d'une invitation en ligne (Template.config d'un
 * événement), dans l'ordre de la page, sans doublon : celles que le client a
 * déjà choisies pour son invitation.
 */
export function invitationPhotos(digitalConfig) {
  const urls = [];
  for (const match of String(digitalConfig?.html ?? "").matchAll(IMG_SRC)) {
    const url = match[2].replace(/&amp;/g, "&");
    if (!urls.includes(url)) urls.push(url);
  }
  return urls;
}

/**
 * Le modèle papier avec ces photos à la place des siennes, face après face
 * dans l'ordre de lecture (la première photo de l'invitation en ligne, en
 * général le couple, prend le premier cadre). Un cadre vide (`src=""`) le
 * reste. Sans photo, le modèle est rendu tel quel.
 */
export function withPhotos(config, photos) {
  if (!config || !photos?.length) return config;
  let index = 0;
  const swap = (html) =>
    html.replace(IMG_SRC, (match, before, url, after) => {
      const next = photos[index % photos.length].replace(/&/g, "&amp;").replace(/"/g, "&quot;");
      index += 1;
      return `${before}${next}${after}`;
    });
  return {
    ...config,
    pieces: config.pieces.map((piece) => ({
      ...piece,
      faces: Object.fromEntries(Object.entries(piece.faces).map(([face, html]) => [face, swap(html)])),
    })),
  };
}

/** Pièce principale (l'invitation) et son format. */
export function mainPiece(config) {
  const piece = config?.pieces?.[0] ?? null;
  return piece ? { piece, format: getFormat(piece.format) } : { piece: null, format: null };
}
