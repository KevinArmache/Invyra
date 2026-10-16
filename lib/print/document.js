import { escapeHtml } from "@/lib/invitation/html";
import { fontsHref } from "@/lib/invitation/fonts";
import {
  applyConditions,
  formatEventDate,
  replaceTokens,
  tokenValues,
} from "@/lib/invitation/document";
import { monogramFrom } from "@/lib/invitation/opening";
import { BLEED, SAFE, SLUG, getFormat, sheetSize } from "@/lib/print/formats";
import { FINISHES } from "@/lib/print/options";

/**
 * Documents HTML des invitations papier (voir lib/print/config.js).
 *
 * Deux sortes de documents, construits à partir des mêmes faces :
 *
 * - `buildFaceDocument` : une face seule, pour les aperçus de la vitrine et
 *   de l'éditeur (iframe sans script). Les finitions y sont simulées : la
 *   dorure brille, le gaufrage a son relief.
 *
 * - `buildPrintDocument` : les feuilles imposées, pour le PDF
 *   (lib/print/render.js). Chaque feuille porte ses faces à leur place, le
 *   fond perdu, les traits de coupe et les repères de pli. En mode « proof »
 *   (bon à tirer), un filigrane, le bord fini et la zone de sécurité sont
 *   dessinés par-dessus. En mode « print », le fichier est celui de
 *   l'imprimeur, et chaque finition a son propre calque (`layer`) : les
 *   éléments concernés en noir, tout le reste masqué.
 *
 * Une face est une `<section class="face face--<id>">` de la taille finie
 * plus le fond perdu. Le CSS du modèle la mesure en mm, avec les variables
 * --trim-w, --trim-h, --bleed et --safe ; `.face-safe` en est la zone où le
 * texte ne risque rien à la coupe.
 *
 * Module pur, importable côté serveur comme côté client.
 */

const DEFAULT_FONTS = ["cormorant", "inter"];

/** Valeurs des jetons pour un destinataire. */
function valuesFor(event, guestName, qr) {
  const values = tokenValues(
    event,
    guestName,
    formatEventDate(event.eventDate),
    monogramFrom(event.title),
    false,
  );
  // QR code vers l'invitation en ligne : pour `data-if="INVITE_QR"`.
  values.INVITE_QR = qr ? "1" : "";
  return values;
}

/**
 * QR code vers l'invitation en ligne, à la place de {{INVITE_QR}}. Le
 * modèle le place dans une boîte qu'il dimensionne (22 mm conviennent) ;
 * le code y reste sombre sur blanc, comme les scanners le lisent le mieux.
 */
function qrBlock(svg) {
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return `<span class="inv-print-qr"><img src="${src}" alt="QR code" /></span>`;
}

function renderFace(html, values, qr) {
  const withQr = html.replaceAll("{{INVITE_QR}}", qr ? qrBlock(qr) : "");
  return replaceTokens(applyConditions(withQr, values), values);
}

function faceSection(faceId, html) {
  return `<section class="face face--${faceId}" data-face="${faceId}">${html}</section>`;
}

// ─── CSS ────────────────────────────────────────────────────────────────────

function baseCss(format) {
  const { width, height } = format.trim;
  return `
:root {
  --bleed: ${BLEED}mm; --safe: ${SAFE}mm;
  --trim-w: ${width}mm; --trim-h: ${height}mm;
  --face-w: ${width + 2 * BLEED}mm; --face-h: ${height + 2 * BLEED}mm;
}
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
[hidden] { display: none !important; }
.face { position: relative; width: var(--face-w); height: var(--face-h); overflow: hidden; background: #fff; }
.face-safe { position: absolute; inset: calc(var(--bleed) + var(--safe)); }
:where(img) { max-width: 100%; object-fit: cover; }
.inv-print-qr { display: block; width: 100%; aspect-ratio: 1; padding: 1.2mm; background: #fff; line-height: 0; }
.inv-print-qr img { display: block; width: 100%; height: 100%; object-fit: contain; }`;
}

/** Couleur de chaque dorure, pour les aperçus et le bon à tirer. */
const FOIL_COLORS = FINISHES.filter((finish) => finish.layer === "foil")
  .map((finish) => `[data-finish="${finish.id}"] { --foil: ${finish.color}; }`)
  .join("\n");

/**
 * Finitions simulées : dorure en dégradé métallique (animée dans les
 * aperçus, figée dans le bon à tirer), gaufrage en relief, vernis
 * sélectif légèrement brillant. Les SVG dorés dessinent en `currentColor`.
 */
function finishCss(animated) {
  return `
${FOIL_COLORS}
[data-finish^="foil"]:not(svg):not(:has(svg)) {
  background: linear-gradient(115deg,
    color-mix(in srgb, var(--foil) 72%, #000) 0%, var(--foil) 28%,
    color-mix(in srgb, var(--foil) 35%, #fff) 46%, var(--foil) 60%,
    color-mix(in srgb, var(--foil) 78%, #000) 100%);
  background-size: 320% 100%; background-position: 70% 50%;
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent; color: var(--foil);
  ${animated ? "animation: inv-foil 7s ease-in-out infinite;" : ""}
}
svg[data-finish^="foil"], [data-finish^="foil"]:has(svg) { color: var(--foil); }
[data-finish^="foil"] svg { filter: drop-shadow(0 0.12mm 0.08mm rgb(0 0 0 / 0.28)); }
[data-finish="emboss"] {
  filter: drop-shadow(0.25mm 0.3mm 0.15mm rgb(0 0 0 / 0.16)) drop-shadow(-0.15mm -0.2mm 0.12mm rgb(255 255 255 / 0.85));
}
[data-finish="spot-uv"] { filter: saturate(1.08) brightness(1.04); }
@keyframes inv-foil { 0%, 100% { background-position: 100% 50%; } 50% { background-position: 0% 50%; } }
@media (prefers-reduced-motion: reduce) { [data-finish^="foil"] { animation: none !important; } }`;
}

/**
 * Calque d'une finition pour l'imprimeur : les éléments marqués en noir
 * plein, tout le reste masqué (fond compris). Les repères de coupe restent,
 * pour caler les calques entre eux.
 */
function layerCss(layer) {
  const selector =
    layer === "foil" ? '[data-finish^="foil"]' : `[data-finish="${layer}"]`;
  return `
.face, .face * { visibility: hidden; }
.face { background: transparent !important; }
${selector}, ${selector} * {
  visibility: visible !important; color: #000 !important;
  -webkit-text-fill-color: #000 !important; background: none !important;
  filter: none !important; animation: none !important;
}
${selector} [fill]:not([fill="none"]), svg${selector}[fill]:not([fill="none"]) { fill: #000 !important; }
${selector} [stroke]:not([stroke="none"]) { stroke: #000 !important; }
${selector} img { visibility: hidden !important; }`;
}

/**
 * Fichier principal de l'imprimeur : la dorure et le gaufrage ne sont pas
 * imprimés à l'encre, ils ont leur propre calque.
 */
const MAIN_LAYER_CSS = `[data-finish^="foil"], [data-finish="emboss"] { visibility: hidden !important; }`;

function documentShell({ css, fonts, body, pageSize = null }) {
  const href = fontsHref(fonts.length > 0 ? fonts : DEFAULT_FONTS);
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
${href ? `<link href="${escapeHtml(href)}" rel="stylesheet" />` : ""}
<style>
${pageSize ? `@page { size: ${pageSize.width}mm ${pageSize.height}mm; margin: 0; }` : ""}
${css}
</style>
</head>
<body>
${body}
</body>
</html>`;
}

// ─── Aperçu d'une face ──────────────────────────────────────────────────────

/**
 * Une face, seule, à sa taille réelle (fond perdu compris). L'appelant
 * l'affiche à l'échelle voulue et masque le fond perdu (voir PaperFace).
 *
 * @param {object} options
 * @param {object} options.config   modèle papier normalisé (normalizePrintConfig)
 * @param {number} [options.pieceIndex=0]
 * @param {string} options.face     identifiant de la face (cover, front…)
 * @param {object} options.event    événement (titre, date, lieu…)
 * @param {string} [options.guestName]
 * @param {string} [options.qr]     SVG du QR code vers l'invitation en ligne
 * @param {boolean} [options.animated=true]  dorure animée
 * @returns {string | null}
 */
export function buildFaceDocument({
  config,
  pieceIndex = 0,
  face,
  event,
  guestName = "",
  qr = null,
  animated = true,
}) {
  const piece = config?.pieces?.[pieceIndex];
  const format = getFormat(piece?.format);
  if (!piece || !format || !format.faces.includes(face)) return null;

  const values = valuesFor(event, guestName, qr);
  const body = faceSection(face, renderFace(piece.faces[face] ?? "", values, qr));
  return documentShell({
    css: `${baseCss(format)}
html, body { width: var(--face-w); height: var(--face-h); overflow: hidden; }
${config.css}
${finishCss(animated)}`,
    fonts: config.fonts ?? [],
    body,
  });
}

// ─── Feuilles imposées (PDF) ────────────────────────────────────────────────

/**
 * Feuilles d'imprimerie pour les planches (`layout`) : plusieurs cartes par
 * feuille, comme les imprimeries numériques les tirent. Tailles en mm.
 */
export const PRESS_SHEETS = {
  a4: { width: 210, height: 297 },
  a3: { width: 297, height: 420 },
  sra3: { width: 320, height: 450 },
};

/** Trait de coupe ou repère : un segment en mm. */
function line(x, y, width, height, extra = "") {
  return `<i class="mark${extra}" style="left:${r(x)}mm;top:${r(y)}mm;width:${r(width)}mm;height:${r(height)}mm"></i>`;
}

const r = (n) => Math.round(n * 1000) / 1000;

const MARK = 0.1; // épaisseur des traits (mm), environ 0,3 pt
const MARK_LENGTH = 6;
const MARK_GAP = 1; // écart entre le fond perdu et le trait

/**
 * Traits de coupe et repères de pli d'une grille de cartes, dans les marges
 * de la feuille : un trait au droit de chaque ligne de coupe, en haut, en
 * bas, à gauche et à droite. `grid` est le rectangle des cartes, fond
 * perdu compris.
 */
function gridMarks({ grid, cutsX, cutsY, foldsX, foldsY }) {
  const top = grid.y - MARK_GAP - MARK_LENGTH;
  const bottom = grid.y + grid.height + MARK_GAP;
  const left = grid.x - MARK_GAP - MARK_LENGTH;
  const right = grid.x + grid.width + MARK_GAP;
  const marks = [];
  for (const [xs, fold] of [[cutsX, ""], [foldsX, " fold fold-v"]]) {
    for (const x of xs) {
      marks.push(line(x - MARK / 2, top, MARK, MARK_LENGTH, fold));
      marks.push(line(x - MARK / 2, bottom, MARK, MARK_LENGTH, fold));
    }
  }
  for (const [ys, fold] of [[cutsY, ""], [foldsY, " fold fold-h"]]) {
    for (const y of ys) {
      marks.push(line(left, y - MARK / 2, MARK_LENGTH, MARK, fold));
      marks.push(line(right, y - MARK / 2, MARK_LENGTH, MARK, fold));
    }
  }
  return marks.join("");
}

/**
 * Une face posée sur la feuille, la carte ayant son fond perdu à
 * (`ox`, `oy`). Elle est rendue avec son fond perdu sur les quatre côtés,
 * puis rognée du côté d'une face voisine (pas de fond perdu au milieu d'une
 * carte pliée). Une face tête-bêche est tournée de 180° : ses côtés rognés
 * s'inversent.
 */
function placedFace(format, sheet, cell, index, html, ox, oy) {
  const col = index % sheet.cols;
  const row = Math.floor(index / sheet.cols);
  const inner = {
    top: row > 0,
    bottom: row < sheet.rows - 1,
    left: col > 0,
    right: col < sheet.cols - 1,
  };
  const turned = cell.rotate === 180;
  const clip = turned
    ? { top: inner.bottom, right: inner.left, bottom: inner.top, left: inner.right }
    : inner;
  const inset = ["top", "right", "bottom", "left"]
    .map((side) => (clip[side] ? `${BLEED}mm` : "0"))
    .join(" ");

  const left = ox + col * format.trim.width;
  const top = oy + row * format.trim.height;
  return `<div class="cell" style="left:${r(left)}mm;top:${r(top)}mm;clip-path:inset(${inset});${
    turned ? "transform:rotate(180deg);" : ""
  }">${faceSection(cell.face, html)}</div>`;
}

/** Bord fini et zone de sécurité de chaque face, dans le bon à tirer. */
function proofGuides(format, sheet, ox, oy) {
  const size = sheetSize(format, sheet);
  const guides = [
    `<i class="guide trim" style="left:${r(ox + BLEED)}mm;top:${r(oy + BLEED)}mm;width:${size.width}mm;height:${size.height}mm"></i>`,
  ];
  sheet.cells.forEach((_, index) => {
    const col = index % sheet.cols;
    const row = Math.floor(index / sheet.cols);
    const left = ox + BLEED + col * format.trim.width + SAFE;
    const top = oy + BLEED + row * format.trim.height + SAFE;
    guides.push(
      `<i class="guide safe" style="left:${r(left)}mm;top:${r(top)}mm;width:${format.trim.width - 2 * SAFE}mm;height:${format.trim.height - 2 * SAFE}mm"></i>`,
    );
  });
  return guides.join("");
}

function sheetCss(pageSize) {
  return `
.sheet { position: relative; width: ${pageSize.width}mm; height: ${pageSize.height}mm; overflow: hidden; break-after: page; background: #fff; }
.sheet:last-child { break-after: auto; }
.cell { position: absolute; width: var(--face-w); height: var(--face-h); }
.mark { position: absolute; display: block; background: #000; }
.mark.fold-v { background: repeating-linear-gradient(to bottom, #000 0 1mm, transparent 1mm 2mm); }
.mark.fold-h { background: repeating-linear-gradient(to right, #000 0 1mm, transparent 1mm 2mm); }
.legend { position: absolute; margin: 0; font: 6pt/1.2 Arial, sans-serif; color: #555; white-space: nowrap; }
.guide { position: absolute; display: block; pointer-events: none; }
.guide.trim { outline: 0.2mm dashed #e0218a; }
.guide.safe { outline: 0.15mm dotted #1aa3c8; }
.watermark { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; pointer-events: none; }
.watermark span {
  transform: rotate(-30deg); white-space: nowrap; font: 700 15mm/1.4 Arial, sans-serif;
  letter-spacing: 2mm; color: rgb(192 57 43 / 0.16); text-align: center;
}`;
}

/** La plus grande feuille de la carte ouverte (mm), sans fond perdu. */
function cardSize(format) {
  return format.sheets.reduce(
    (max, sheet) => {
      const size = sheetSize(format, sheet);
      return { width: Math.max(max.width, size.width), height: Math.max(max.height, size.height) };
    },
    { width: 0, height: 0 },
  );
}

/**
 * Disposition des cartes sur la page : une seule carte entourée de sa
 * marge technique, ou une planche (feuille d'imprimerie, en portrait ou en
 * paysage selon ce qui en loge le plus). Les cartes y gardent chacune leur
 * fond perdu, côte à côte : l'imprimeur coupe au droit de chaque trait.
 *
 * @returns {{ pageSize, cols, rows, origin: { x, y } }}
 */
function pageLayout(format, layout) {
  const card = cardSize(format);
  const cell = { width: card.width + 2 * BLEED, height: card.height + 2 * BLEED };
  const press = PRESS_SHEETS[layout];
  if (press) {
    const fit = ({ width, height }) => ({
      pageSize: { width, height },
      cols: Math.floor((width - 2 * SLUG) / cell.width),
      rows: Math.floor((height - 2 * SLUG) / cell.height),
    });
    const options = [
      fit(press),
      fit({ width: press.height, height: press.width }),
    ].filter((option) => option.cols > 0 && option.rows > 0);
    const best = options.sort((a, b) => b.cols * b.rows - a.cols * a.rows)[0];
    if (best) {
      return {
        ...best,
        origin: {
          x: (best.pageSize.width - best.cols * cell.width) / 2,
          y: (best.pageSize.height - best.rows * cell.height) / 2,
        },
        cell,
      };
    }
  }
  // Carte seule (ou planche trop petite pour la carte).
  return {
    pageSize: { width: cell.width + 2 * SLUG, height: cell.height + 2 * SLUG },
    cols: 1,
    rows: 1,
    origin: { x: SLUG, y: SLUG },
    cell,
  };
}

/**
 * Feuilles à imprimer d'une pièce.
 *
 * Carte seule (`layout: "single"`) : une page par côté de la carte (recto,
 * verso…) et par destinataire. Planche (`layout: "a4" | "a3" | "sra3"`) :
 * chaque page porte autant de cartes que la feuille en contient ; au verso,
 * les colonnes sont inversées, pour une impression recto verso retournée
 * sur le grand côté.
 *
 * @param {object} options
 * @param {object} options.config  modèle papier normalisé
 * @param {number} [options.pieceIndex=0]
 * @param {object} options.event
 * @param {Array<{ guestName?: string, qr?: string }>} [options.recipients]
 *   une carte par destinataire ; une seule carte générique par défaut. Sur
 *   une planche, une carte générique est répétée dans toutes les cases.
 * @param {"proof"|"print"} [options.mode="proof"]
 * @param {"main"|"foil"|"emboss"|"spot-uv"} [options.layer="main"]  calque
 *   (mode « print » seulement)
 * @param {"single"|"a4"|"a3"|"sra3"} [options.layout="single"]
 * @param {{ title?: string, watermark?: string, sides?: object }} [options.labels]
 * @returns {{ html: string, pageSize: { width: number, height: number }, perPage: number } | null}
 */
export function buildPrintDocument({
  config,
  pieceIndex = 0,
  event,
  recipients = [{}],
  mode = "proof",
  layer = "main",
  layout = "single",
  labels = {},
}) {
  const piece = config?.pieces?.[pieceIndex];
  const format = getFormat(piece?.format);
  if (!piece || !format) return null;

  const { pageSize, cols, rows, origin, cell } = pageLayout(format, layout);
  const perPage = cols * rows;
  const proof = mode === "proof";

  // Une carte générique remplit toute la planche ; des cartes nominatives
  // se suivent, la dernière page n'étant remplie qu'en partie.
  const list = recipients.length > 0 ? recipients : [{}];
  const generic = list.length === 1;
  const groups = [];
  if (generic) groups.push(Array.from({ length: perPage }, () => list[0]));
  else for (let i = 0; i < list.length; i += perPage) groups.push(list.slice(i, i + perPage));

  const rendered = new Map();
  const faceHtml = (recipient, face) => {
    const key = `${list.indexOf(recipient)}:${face}`;
    if (!rendered.has(key)) {
      const values = valuesFor(event, recipient.guestName ?? "", recipient.qr);
      rendered.set(key, renderFace(piece.faces[face] ?? "", values, recipient.qr));
    }
    return rendered.get(key);
  };

  const sheets = [];
  groups.forEach((group, groupIndex) => {
    format.sheets.forEach((sheet, sideIndex) => {
      const size = sheetSize(format, sheet);
      const cards = [];
      const guides = [];
      group.forEach((recipient, index) => {
        const row = Math.floor(index / cols);
        // Verso : colonnes inversées, la carte retombe sur son recto.
        const col = sideIndex % 2 === 1 ? cols - 1 - (index % cols) : index % cols;
        const ox = origin.x + col * cell.width;
        const oy = origin.y + row * cell.height;
        cards.push(
          sheet.cells
            .map((sheetCell, cellIndex) =>
              placedFace(format, sheet, sheetCell, cellIndex, faceHtml(recipient, sheetCell.face), ox, oy),
            )
            .join(""),
        );
        if (proof) guides.push(proofGuides(format, sheet, ox, oy));
      });

      // Lignes de coupe et de pli de la grille entière.
      const cutsX = [];
      const foldsX = [];
      for (let col = 0; col < cols; col += 1) {
        const x0 = origin.x + col * cell.width + BLEED;
        cutsX.push(x0, x0 + size.width);
        for (let k = 1; k < sheet.cols; k += 1) foldsX.push(x0 + k * format.trim.width);
      }
      const cutsY = [];
      const foldsY = [];
      for (let row = 0; row < rows; row += 1) {
        const y0 = origin.y + row * cell.height + BLEED;
        cutsY.push(y0, y0 + size.height);
        for (let k = 1; k < sheet.rows; k += 1) foldsY.push(y0 + k * format.trim.height);
      }
      const grid = { x: origin.x, y: origin.y, width: cols * cell.width, height: rows * cell.height };

      const legend = [
        "Invyra",
        labels.title,
        format.id,
        labels.sides?.[sheet.id] ?? sheet.id,
        perPage > 1 ? `${layout.toUpperCase()} · ${perPage} cartes` : null,
        perPage > 1 && sideIndex % 2 === 1 ? "recto verso retourné sur le grand côté" : null,
        !generic ? `page ${groupIndex + 1}/${groups.length}` : null,
        !proof && layer !== "main" ? `calque ${layer}` : null,
      ]
        .filter(Boolean)
        .join(" · ");

      sheets.push(`<div class="sheet">
${cards.join("\n")}
${guides.join("")}
${gridMarks({ grid, cutsX, cutsY, foldsX, foldsY })}
<p class="legend" style="left:${r(grid.x + BLEED)}mm;top:${r(grid.y + grid.height + MARK_GAP + MARK_LENGTH + 1)}mm">${escapeHtml(legend)}</p>
${proof ? `<div class="watermark"><span>${escapeHtml(labels.watermark ?? "BON À TIRER")}</span></div>` : ""}
</div>`);
    });
  });

  let layerRules = "";
  if (!proof) layerRules = layer === "main" ? MAIN_LAYER_CSS : layerCss(layer);

  return {
    pageSize,
    perPage,
    html: documentShell({
      css: `${baseCss(format)}
${config.css}
${finishCss(false)}
${sheetCss(pageSize)}
${layerRules}`,
      fonts: config.fonts ?? [],
      body: sheets.join("\n"),
      pageSize,
    }),
  };
}
