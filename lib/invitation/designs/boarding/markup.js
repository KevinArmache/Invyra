import {
  escapeHtml,
  imageLayer,
  paragraphs,
  safeUrl,
} from "@/lib/invitation/html";
import { renderRsvpBlock } from "@/lib/invitation/rsvp";
import { random } from "@/lib/invitation/designs/_shared/random";

/**
 * Balisage de l'invitation Embarquement : un tableau des départs en héro,
 * puis le voyage section par section, chacune annoncée par un panneau
 * d'aéroport (message du commandant, bagages, itinéraire, carnet de voyage,
 * destination, consignes, passeport, enregistrement), jusqu'au décollage.
 *
 * Tout est lisible sans script (vignettes, « réduire les animations ») : les
 * états masqués ou décalés n'existent que sous `html.fx`, classe posée par le
 * script du design. Les cases du tableau (`[data-flap]`) sont découpées en
 * palettes par le script statique, qui tourne aussi dans les vignettes.
 */

const DETAIL_TAGS = {
  date: { label: "Date", code: "DAT" },
  time: { label: "Heure", code: "HRS" },
  location: { label: "Lieu", code: "DST" },
  dressCode: { label: "Tenue", code: "DRS" },
};

// Mentions des tampons du passeport, à tour de rôle.
const VISAS = ["Arrivée", "Visa", "Bienvenue", "Départ", "Souvenir", "Escale"];

// Légère rotation des photos du passeport et de leurs tampons.
const PHOTO_TILT = [-2.2, 1.6, -1.1, 2.4, -1.8, 1.2];
const STAMP_TILT = [-14, 9, -6, 12, -10, 7];

/** Pictogrammes des panneaux (traits, 24 × 24). */
const ICONS = {
  speaker:
    '<path d="M4 9.5h3l5-4v13l-5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  bag: '<rect x="4.5" y="7.5" width="15" height="12" rx="2"/><path d="M9 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5v2M9 11v5M15 11v5"/>',
  route:
    '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h5a3 3 0 0 0 0-6h-2a3 3 0 0 1 0-6h5"/>',
  book: '<path d="M5 4.5h10a3 3 0 0 1 3 3v12H8a3 3 0 0 1-3-3z"/><path d="M5 16.5a3 3 0 0 1 3-3h10"/>',
  pin: '<path d="M12 21s-6.5-5.8-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.2 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.3"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.4"/>',
  passport:
    '<rect x="5.5" y="3.5" width="13" height="17" rx="1.5"/><circle cx="12" cy="11" r="3.2"/><path d="M8.8 11h6.4M12 7.8c-1 .9-1.4 2-1.4 3.2s.4 2.3 1.4 3.2M12 7.8c1 .9 1.4 2 1.4 3.2s-.4 2.3-1.4 3.2M9 17h6"/>',
  ticket:
    '<path d="M3.5 7.5h17v3a1.5 1.5 0 0 0 0 3v3h-17v-3a1.5 1.5 0 0 0 0-3z"/><path d="M14 7.5v9" stroke-dasharray="1.5 1.5"/>',
  takeoff:
    '<path d="M3 19.5h18"/><path d="M4.5 13.5 7 15l5-2 5.5-4.5a1.6 1.6 0 0 1 2.2 2.3L13 16.5l-8 1.5-2-3z"/>',
  hanger:
    '<path d="M12 8.5a2 2 0 1 1 2-2"/><path d="M12 8.5v1.2L3.5 16a1 1 0 0 0 .6 1.8h15.8a1 1 0 0 0 .6-1.8L12 9.7"/>',
};

/** Avion vu de dessus, pointé vers le haut (pictogramme « flight » de Material). */
export const PLANE_PATH =
  "M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z";

export function plane(className = "") {
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true"><path d="${PLANE_PATH}"/></svg>`;
}

function icon(name) {
  return `<svg class="bd-icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] ?? ICONS.info}</svg>`;
}

/**
 * Code d'aéroport tiré d'un texte : les initiales de trois mots, sinon les
 * trois premières lettres du premier (« Cérémonie face à la mer » → CFM,
 * « Santorin, Grèce » → SAN).
 */
export function airportCode(text) {
  const words = String(text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter((word) => word.length > 2);
  if (words.length >= 3) return words.slice(0, 3).map((word) => word[0]).join("");
  return (words[0] ?? "").slice(0, 3).padEnd(3, "X");
}

/**
 * Vol et porte tirés de la date de l'événement (« 2027-06-12 » → vol 0612,
 * porte 12). En mode code, la date est un jeton : numéros par défaut.
 */
export function flightInfo(eventDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(eventDate ?? "");
  return {
    flight: match ? `{{MONOGRAM}} ${match[2]}${match[3]}` : "{{MONOGRAM}}",
    gate: match ? String(Number(match[3])) : "1",
    short: match ? `${match[3]}.${match[2]}.${match[1].slice(2)}` : "",
  };
}

/**
 * Code 2D décoratif (façon carte d'embarquement) : trois repères d'angle et
 * des modules répartis de façon déterministe.
 */
export function passCode(seed = 7, size = 21) {
  const next = random(seed);
  const finder = (x, y) =>
    `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z`;
  const inFinder = (x, y) =>
    (x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8);
  let path = finder(0, 0) + finder(size - 7, 0) + finder(0, size - 7);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!inFinder(x, y) && next() < 0.48) path += `M${x} ${y}h1v1h-1z`;
    }
  }
  return `<svg class="bd-code" viewBox="-1 -1 ${size + 2} ${size + 2}" aria-hidden="true" shape-rendering="crispEdges"><path fill-rule="evenodd" d="${path}"/></svg>`;
}

/** Panneau d'aéroport qui annonce une section. */
function sign(iconName, label) {
  return `<p class="bd-sign">${icon(iconName)}<span>${label}</span><span class="bd-sign-arrow" aria-hidden="true">→</span></p>`;
}

function head(iconName, label, title) {
  return `<header class="bd-head" data-reveal>
  ${sign(iconName, label)}
  ${title ? `<h2 class="bd-h2">${escapeHtml(title)}</h2>` : ""}
</header>`;
}

/** Tampon de visa (SVG) posé sur une photo du passeport. */
function visaStamp(index, short) {
  const label = VISAS[index % VISAS.length].toUpperCase();
  const round = index % 2 === 0;
  const frame = round
    ? '<circle cx="60" cy="40" r="35"/><circle cx="60" cy="40" r="29"/>'
    : '<rect x="6" y="9" width="108" height="62" rx="9"/><rect x="11" y="14" width="98" height="52" rx="6"/>';
  return `<svg class="bd-stamp bd-stamp--${index % 2 ? "b" : "a"}" viewBox="0 0 120 80" style="--sr:${STAMP_TILT[index % STAMP_TILT.length]}deg" aria-hidden="true">
  <g fill="none" stroke-width="2.2">${frame}</g>
  <text x="60" y="35" text-anchor="middle" class="bd-stamp-label">${label}</text>
  <text x="60" y="50" text-anchor="middle" class="bd-stamp-date">${short || "BON VOYAGE"}</text>
  <text x="60" y="62" text-anchor="middle" class="bd-stamp-mono">{{MONOGRAM}}</text>
</svg>`;
}

/** Libellé court pour une ligne du tableau. */
function boardLabel(text, max = 22) {
  const clean = String(text ?? "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trim()}…` : clean;
}

export function render({ style, content, details, eventDate }) {
  const { hero, intro, story, program, venue, dressCode, gallery, closing } =
    content;
  const date = details.find((item) => item.key === "date");
  const time = details.find((item) => item.key === "time");
  const { flight, gate, short } = flightInfo(eventDate);
  const title = hero.title ? escapeHtml(hero.title) : "{{EVENT_TITLE}}";
  const programItems = program.items.filter((item) => item.time || item.label);

  // ── Héro : le tableau des départs ─────────────────────────────────────────
  const legs = programItems.slice(0, 3);
  const countdownHtml =
    style.countdown && eventDate
      ? `<div class="bd-board-foot" data-countdown="${escapeHtml(eventDate)}">
    <span class="bd-foot-label">Départ dans</span>
    <span class="bd-cd" aria-hidden="true">${[
      ["d", 3, "J"],
      ["h", 2, "H"],
      ["m", 2, "M"],
      ["s", 2, "S"],
    ]
      .map(
        ([unit, length, suffix]) =>
          `<span class="bd-cd-unit"><span class="bd-word" data-unit="${unit}">${'<span class="bd-c"><i>0</i></span>'.repeat(length)}</span><span class="bd-cd-suffix">${suffix}</span></span>`,
      )
      .join("")}</span>
    <span class="bd-sr" data-sr></span>
  </div>`
      : "";

  const heroHtml = `<header class="bd-hero">
  ${imageLayer(hero.image, "bd-hero-bg", 'data-hero-bg')}
  <span class="bd-hero-shade" aria-hidden="true"></span>
  <div class="bd-hero-inner">
    <p class="bd-hero-top bd-rise" style="--d:.1s">
      <span class="bd-logo" aria-hidden="true">{{MONOGRAM}}</span>
      <span class="bd-hero-eyebrow">${escapeHtml(hero.eyebrow || "Départs")}</span>
      <span class="bd-clock" data-clock aria-hidden="true"></span>
    </p>
    <div class="bd-board bd-rise" style="--d:.2s" data-board>
      <div class="bd-board-grid">
        <span class="bd-th" aria-hidden="true">Heure</span><span class="bd-th" aria-hidden="true">Vol</span><span class="bd-th" aria-hidden="true">Destination</span><span class="bd-th" aria-hidden="true">Porte</span><span class="bd-th" aria-hidden="true">Statut</span>
        <div class="bd-row bd-row--main">
          <span class="bd-cell bd-cell--time" data-flap>${escapeHtml(time?.value || "--:--")}</span>
          <span class="bd-cell bd-cell--flight" data-flap>${flight}</span>
          <h1 class="bd-cell bd-cell--dest" data-flap>${title}</h1>
          <span class="bd-cell bd-cell--gate" data-flap>${gate}</span>
          <span class="bd-cell bd-cell--status" data-flap data-status>Embarquement</span>
        </div>
        ${legs
          .map(
            (item, index) => `<div class="bd-row bd-row--leg">
          <span class="bd-cell bd-cell--time" data-flap>${escapeHtml(item.time || "--:--")}</span>
          <span class="bd-cell bd-cell--flight" data-flap>${airportCode(item.label)} ${214 + index * 137}</span>
          <span class="bd-cell bd-cell--dest" data-flap>${escapeHtml(boardLabel(item.label))}</span>
          <span class="bd-cell bd-cell--gate" data-flap>${"BCD"[index]}${(Number(gate) + index * 3) % 24 || 1}</span>
          <span class="bd-cell bd-cell--status" data-flap>À l'heure</span>
        </div>`,
          )
          .join("")}
      </div>
      ${countdownHtml}
    </div>
    <p class="bd-hero-pax bd-rise" style="--d:.45s">Passager <strong>{{GUEST_NAME}}</strong>${date ? `<span aria-hidden="true"> · </span>${escapeHtml(date.value)}` : ""}</p>
  </div>
  <span class="bd-scroll" aria-hidden="true">${plane()}</span>
</header>`;

  // ── Progression du vol, en haut d'écran ───────────────────────────────────
  const progressHtml = `<div class="bd-progress" data-progress aria-hidden="true"><span class="bd-progress-line"></span>${plane("bd-progress-plane")}</div>`;

  // ── Message du commandant ─────────────────────────────────────────────────
  const introHtml = intro.message
    ? `<section class="bd-section bd-intro">
  ${head("speaker", "Message du commandant", "")}
  <div class="bd-announce" data-announce>
    <span class="bd-announce-chime" aria-hidden="true"><i></i><i></i><i></i></span>
    <div class="bd-announce-text" data-words>${paragraphs(intro.message)}</div>
  </div>
</section>`
    : "";

  // ── Bagages : les infos pratiques arrivent sur le tapis ───────────────────
  const bagsHtml =
    content.details.enabled && details.length > 0
      ? `<section class="bd-section bd-bags">
  ${head("bag", "Bagages", "Infos pratiques")}
  <div class="bd-belt" data-belt>
    <ul class="bd-tags">
      ${details
        .map((item, index) => {
          const tag = DETAIL_TAGS[item.key] ?? { label: "", code: "INV" };
          return `<li class="bd-tag" style="--i:${index}"><span class="bd-tag-hole" aria-hidden="true"></span><span class="bd-tag-code" aria-hidden="true">${tag.code}</span><span class="bd-tag-label">${tag.label}</span><span class="bd-tag-value">${escapeHtml(item.value)}</span><span class="bd-tag-bars" aria-hidden="true"></span></li>`;
        })
        .join("")}
    </ul>
    <span class="bd-belt-rail" aria-hidden="true"></span>
  </div>
</section>`
      : "";

  // ── Itinéraire : l'avion suit la route au défilement ──────────────────────
  const routeHtml =
    program.enabled && programItems.length > 0
      ? `<section class="bd-section bd-route">
  ${head("route", "Itinéraire", program.title)}
  <div class="bd-map" data-route>
    <svg class="bd-route-svg" aria-hidden="true"><path class="bd-route-path" data-route-path/><path class="bd-route-done" data-route-done/></svg>
    ${plane("bd-route-plane")}
    <ol class="bd-stops">
      ${programItems
        .map(
          (item) =>
            `<li class="bd-stop"><span class="bd-stop-dot" data-stop aria-hidden="true"></span><span class="bd-stop-body"><span class="bd-stop-code" aria-hidden="true">${airportCode(item.label)}</span><span class="bd-stop-time">${escapeHtml(item.time)}</span><span class="bd-stop-label">${escapeHtml(item.label)}</span></span></li>`,
        )
        .join("")}
    </ol>
  </div>
</section>`
      : "";

  // ── Carnet de voyage : la carte postale ───────────────────────────────────
  const storyImage = safeUrl(story.image);
  const storyHtml = story.enabled
    ? `<section class="bd-section bd-story">
  ${head("book", "Carnet de voyage", story.title)}
  <div class="bd-split${storyImage ? "" : " bd-split--single"}">
    <div class="bd-text" data-reveal>${paragraphs(story.text)}</div>
    ${
      storyImage
        ? `<figure class="bd-postcard" data-reveal>
      ${imageLayer(storyImage, "bd-postcard-photo")}
      <span class="bd-postage" aria-hidden="true"><span>{{MONOGRAM}}</span></span>
      <svg class="bd-postmark" viewBox="0 0 160 60" aria-hidden="true"><circle cx="30" cy="30" r="24"/><circle cx="30" cy="30" r="19"/><path d="M62 16c12-6 24 6 36 0s24 6 36 0s16 2 22 0M62 30c12-6 24 6 36 0s24 6 36 0s16 2 22 0M62 44c12-6 24 6 36 0s24 6 36 0s16 2 22 0"/></svg>
    </figure>`
        : ""
    }
  </div>
</section>`
    : "";

  // ── Destination : le hublot ───────────────────────────────────────────────
  const venueImage = safeUrl(venue.image);
  const mapUrl = safeUrl(venue.mapUrl);
  const venueHtml = venue.enabled
    ? `<section class="bd-section bd-dest">
  ${head("pin", "Destination", venue.title)}
  <div class="bd-split bd-split--reverse${venueImage ? "" : " bd-split--single"}">
    <div class="bd-text" data-reveal>
      ${paragraphs(venue.text)}
      ${mapUrl ? `<p class="bd-map-link-wrap"><a class="bd-map-link" href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer">${icon("pin")}<span>Voir l'itinéraire</span></a></p>` : ""}
    </div>
    ${
      venueImage
        ? `<div class="bd-window" data-window>
      <div class="bd-window-view">
        ${imageLayer(venueImage, "bd-window-photo")}
        <span class="bd-clouds" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="bd-window-shade" aria-hidden="true"></span>
      </div>
    </div>`
        : ""
    }
  </div>
</section>`
    : "";

  // ── Consignes de bord : le dress code ─────────────────────────────────────
  const rulesHtml = dressCode.enabled
    ? `<section class="bd-section bd-rules">
  ${head("info", "Consignes de bord", dressCode.title)}
  <div class="bd-safety" data-reveal>
    <div class="bd-safety-head" aria-hidden="true"><span class="bd-safety-light">${icon("hanger")}</span><span>Tenue de rigueur</span></div>
    <div class="bd-safety-body">${paragraphs(dressCode.text)}</div>
  </div>
</section>`
    : "";

  // ── Passeport : la galerie ────────────────────────────────────────────────
  const galleryImages = gallery.images.map(safeUrl).filter(Boolean);
  const galleryHtml =
    gallery.enabled && galleryImages.length > 0
      ? `<section class="bd-section bd-passport">
  ${head("passport", "Passeport", gallery.title)}
  <div class="bd-visas">
    ${galleryImages
      .map(
        (url, index) => `<figure class="bd-visa" data-reveal style="--i:${index % 3};--r:${PHOTO_TILT[index % PHOTO_TILT.length]}deg">
      <button type="button" class="bd-visa-btn" data-photo="${index}" data-src="${escapeHtml(url)}" aria-label="Agrandir la photo ${index + 1}">${imageLayer(url, "bd-visa-img")}</button>
      ${visaStamp(index, short)}
    </figure>`,
      )
      .join("")}
  </div>
</section>`
      : "";

  // ── Enregistrement : la réponse ───────────────────────────────────────────
  const rsvpHtml = `<section class="bd-section bd-checkin-section">
  ${head("ticket", "Enregistrement", "")}
  <div class="bd-checkin" data-checkin>
    <div class="bd-ticket" aria-hidden="true">
      <div class="bd-ticket-info">
        <span class="bd-ticket-label">Passager</span><span class="bd-ticket-value">{{GUEST_NAME}}</span>
        <span class="bd-ticket-label">Vol</span><span class="bd-ticket-value">${flight}</span>
        <span class="bd-ticket-label">Porte</span><span class="bd-ticket-value">${gate}</span>
      </div>
      <div class="bd-ticket-scan">${passCode(11)}<span class="bd-scanline"></span></div>
      <span class="bd-ok bd-ok--confirmed">Embarqué</span>
      <span class="bd-ok bd-ok--maybe">En attente</span>
      <span class="bd-ok bd-ok--declined">À la prochaine</span>
    </div>
    ${renderRsvpBlock(content.rsvp)}
  </div>
</section>`;

  // ── Décollage : la conclusion ─────────────────────────────────────────────
  const takeoffHtml = `<section class="bd-takeoff" data-takeoff>
  <div class="bd-sky" aria-hidden="true">
    <span class="bd-sky-sun"></span>
    <span class="bd-sky-cloud bd-sky-cloud--1"></span><span class="bd-sky-cloud bd-sky-cloud--2"></span><span class="bd-sky-cloud bd-sky-cloud--3"></span>
    <svg class="bd-contrail"><path data-contrail/></svg>
    ${plane("bd-sky-plane")}
  </div>
  <div class="bd-takeoff-content">
    ${
      closing.enabled
        ? `${head("takeoff", "Décollage", closing.title)}
    <div class="bd-text bd-text--center" data-reveal>${paragraphs(closing.text)}</div>`
        : ""
    }
    <p class="bd-skywrite" data-skywrite>À très vite, {{GUEST_NAME}}</p>
  </div>
</section>`;

  return `<main class="bd">
${heroHtml}
${progressHtml}
${introHtml}
${bagsHtml}
${routeHtml}
${storyHtml}
${venueHtml}
${rulesHtml}
${galleryHtml}
${rsvpHtml}
${takeoffHtml}
<footer class="bd-footer"><p>Vol ${flight}${date ? ` · ${escapeHtml(date.value)}` : ""}</p><p>Bon voyage</p></footer>
</main>`;
}
