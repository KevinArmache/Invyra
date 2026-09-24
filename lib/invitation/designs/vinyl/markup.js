import {
  cssUrl,
  escapeHtml,
  paragraphs,
  renderRsvpBlock,
  safeUrl,
} from "@/lib/invitation/shared";

/**
 * Balisage de l'invitation Face A : la pochette d'un album (le héro), puis les
 * deux faces du disque. Face A : intro, compte à rebours, crédits,
 * tracklist. On retourne le disque, puis Face B : histoire, lieu, dress code,
 * bac à disques et jukebox (RSVP). Une piste cachée clôt l'album.
 *
 * Tout est lisible sans script (vignettes, « réduire les animations ») : les
 * états masqués, décalés ou épinglés n'existent que sous `html.fx`, classe
 * posée par le script du design.
 */

const DETAIL_LABELS = {
  date: "Date",
  time: "Heure",
  location: "Lieu",
  dressCode: "Tenue",
};

// Durées affichées à côté des numéros de piste, pour le décor.
const DURATIONS = [
  "3:12",
  "4:05",
  "2:48",
  "3:37",
  "5:01",
  "3:54",
  "4:26",
  "2:59",
  "3:21",
  "4:44",
];

function background(url, className, attributes = "") {
  const safe = safeUrl(url);
  if (!safe) return "";
  return `<div class="${className}" style="${escapeHtml(`background-image:${cssUrl(safe)}`)}" ${attributes}></div>`;
}

/** Générateur pseudo-aléatoire déterministe : même rendu à chaque fois. */
function random(seed) {
  let x = (seed * 7919 + 104729) % 233280;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

/**
 * Numéro de catalogue tiré de la date (« 2027-06-12… » → INV·20270612). En
 * mode code, la date est un jeton : on garde un numéro fixe.
 */
function catalogNumber(eventDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(eventDate ?? "");
  return match ? `INV·${match[1]}${match[2]}${match[3]}` : "INV·001";
}

/**
 * Disque vinyle. `.vn-disc-spin` (sillons, label, gravure) tourne ; le reflet
 * `.vn-disc-sheen` reste fixe, comme la lumière sur un vrai disque.
 *
 * @param {object} options
 * @param {string} [options.image]  photo imprimée sur le disque (picture disc)
 * @param {string} [options.etch]   message gravé dans le sillon de sortie,
 *   déjà échappé (peut contenir un jeton)
 * @param {number} [options.speed]  vitesse relative au régime du design
 */
export function disc({
  className = "",
  side = "A",
  rpm = "33",
  image = "",
  etch = "",
  speed = 1,
  attributes = "",
} = {}) {
  const etchSvg = etch
    ? `<svg class="vn-etch" viewBox="0 0 200 200"><defs><path id="vn-etch-path" d="M54 100a46 46 0 1 1 92 0a46 46 0 1 1-92 0"/></defs><text><textPath href="#vn-etch-path" startOffset="25%" text-anchor="middle">${etch}</textPath></text></svg>`
    : "";
  return `<div class="vn-disc ${className}"${speed !== 1 ? ` data-speed="${speed}"` : ""} ${attributes} aria-hidden="true">
  <div class="vn-disc-spin" data-spin>
    ${image ? background(image, "vn-disc-picture") : ""}
    ${etchSvg}
    <span class="vn-label"><span class="vn-label-mono">{{MONOGRAM}}</span><span class="vn-label-side">Face ${side} · ${rpm === "45" ? "45" : "33⅓"}</span></span>
  </div>
  <span class="vn-disc-sheen"></span>
  <span class="vn-disc-spindle"></span>
</div>`;
}

/**
 * Bras de lecture, posé dans un `.vn-deck` : son pivot est en haut à droite
 * du disque. L'angle vient de `--arm` (0 : au repos, 22deg : début du
 * disque, 42deg : sillon de sortie).
 */
export function tonearm(className = "") {
  return `<span class="vn-arm ${className}" aria-hidden="true">
  <span class="vn-arm-base"></span>
  <span class="vn-arm-rot">
    <svg class="vn-arm-svg" viewBox="0 -14 16 106">
      <rect class="vn-arm-metal" x="3.5" y="-13" width="9" height="10" rx="2"/>
      <path class="vn-arm-tube" d="M8 -3V66Q8 70 6.2 72.5L4.8 75"/>
      <g transform="rotate(22 5 80)"><rect class="vn-arm-metal" x="1.6" y="74" width="7" height="12" rx="1.4"/><rect class="vn-arm-cart" x="3" y="82" width="4" height="4" rx=".6"/></g>
    </svg>
  </span>
</span>`;
}

/** Platine vue de dessus. `inner` : le contenu du plateau (disque, bras). */
export function turntable({ rpm = "33", inner = "", className = "" } = {}) {
  const on45 = rpm === "45";
  return `<div class="vn-tt ${className}" aria-hidden="true">
  <span class="vn-tt-plinth"></span>
  <span class="vn-tt-platter"></span>
  <span class="vn-tt-speed"><span${on45 ? "" : ' class="is-on"'}>33</span><span${on45 ? ' class="is-on"' : ""}>45</span></span>
  <span class="vn-tt-led"></span>
  <div class="vn-deck">${inner}</div>
</div>`;
}

/**
 * Pochette de l'album, commune au héro et à l'écran d'ouverture. `title` et
 * `dedication` sont déjà échappés (ils peuvent contenir un jeton).
 */
export function cover({
  image,
  title,
  titleTag = "p",
  sticker = "",
  dedication = "",
  catalog = "",
  className = "",
}) {
  const safe = safeUrl(image);
  return `<div class="vn-cover${safe ? "" : " vn-cover--plain"} ${className}">
  ${safe ? background(safe, "vn-cover-img") : '<span class="vn-cover-rings" aria-hidden="true"></span>'}
  <span class="vn-cover-shade" aria-hidden="true"></span>
  <span class="vn-cover-wear" aria-hidden="true"></span>
  <span class="vn-cover-logo" aria-hidden="true">{{MONOGRAM}}</span>
  ${sticker ? `<span class="vn-sticker">${escapeHtml(sticker)}</span>` : ""}
  ${dedication ? `<span class="vn-cover-dedication">${dedication}</span>` : ""}
  <${titleTag} class="vn-cover-title" data-fit>${title}</${titleTag}>
  ${catalog ? `<span class="vn-cover-cat" aria-hidden="true">${catalog}</span>` : ""}
</div>`;
}

/**
 * Forme d'onde sous le titre d'une piste : deux copies des mêmes barres, la
 * seconde (« lue ») découpée selon `--played`, que le défilement fait avancer.
 */
function wave(seed) {
  const next = random(seed + 3);
  const count = 56;
  let path = "";
  for (let i = 0; i < count; i++) {
    const envelope = 0.35 + 0.65 * Math.sin((i / (count - 1)) * Math.PI) ** 0.6;
    const height = Math.max(2, Math.round((0.25 + 0.75 * next()) * envelope * 22));
    const x = i * 4 + 2;
    path += `M${x} ${12 - height / 2}v${height}`;
  }
  const svg = `<svg viewBox="0 0 ${count * 4} 24"><path d="${path}"/></svg>`;
  return `<div class="vn-wave" data-wave aria-hidden="true"><div class="vn-wave-base">${svg}</div><div class="vn-wave-played">${svg}</div></div>`;
}

/** Code-barres décoratif du dos de pochette. */
function barcode() {
  const next = random(11);
  let x = 0;
  let bars = "";
  for (let i = 0; i < 38; i++) {
    const width = 1 + Math.floor(next() * 3);
    if (i % 2 === 0) bars += `<rect x="${x}" width="${width}" height="40"/>`;
    x += width;
  }
  return `<svg class="vn-barcode" viewBox="0 0 ${x} 40" preserveAspectRatio="none" aria-hidden="true">${bars}</svg>`;
}

export function render({ style, content, details, eventDate }) {
  const { hero, intro, story, program, venue, dressCode, gallery, closing } =
    content;
  const rpm = style.rpm === "45" ? "45" : "33";
  const date = details.find((item) => item.key === "date");
  const time = details.find((item) => item.key === "time");
  const location = details.find((item) => item.key === "location");
  const catalog = catalogNumber(eventDate);

  // Numéros de piste : A1, A2… puis B1, B2… dans l'ordre d'affichage.
  const counters = { A: 0, B: 0 };
  let seed = 0;

  /**
   * Piste de l'album. `name` : titre montré dans le lecteur en haut d'écran
   * et, quand la piste n'a pas de titre affiché, à côté de son numéro.
   */
  function track(side, key, { title = "", name = title, body, attributes = "" }) {
    counters[side] += 1;
    const code = `${side}${counters[side]}`;
    const duration = DURATIONS[seed % DURATIONS.length];
    const head = `<header class="vn-head" data-reveal>
  <p class="vn-code"><span class="vn-code-id">${code}</span>${title ? "" : `<span class="vn-code-name">${escapeHtml(name)}</span>`}<span class="vn-code-sep" aria-hidden="true"></span><span class="vn-code-dur">${duration}</span></p>
  ${title ? `<h2 class="vn-h2">${escapeHtml(title)}</h2>` : ""}
  ${wave(seed)}
</header>`;
    seed += 1;
    return `<section class="vn-track vn-${key}" data-track="${code}" data-track-title="${escapeHtml(name)}" ${attributes}>
${head}
${body}
</section>`;
  }

  // ── Héro : la pochette et son disque ──────────────────────────────────────
  const heroTitle = hero.title ? escapeHtml(hero.title) : "{{EVENT_TITLE}}";
  const where = [time?.value, location?.value].filter(Boolean);
  const heroHtml = `<header class="vn-hero">
  <div class="vn-album" data-album>
    ${disc({ className: "vn-hero-disc", rpm, attributes: "data-hero-disc" })}
    ${cover({
      image: hero.image,
      title: heroTitle,
      titleTag: "h1",
      sticker: hero.eyebrow,
      dedication: "pour {{GUEST_NAME}}",
      catalog,
      className: "vn-slide-in",
    })}
  </div>
  <div class="vn-hero-meta">
    ${date ? `<p class="vn-hero-date vn-rise" style="--d:.8s"><span>Sortie le</span> ${escapeHtml(date.value)}</p>` : ""}
    ${where.length ? `<p class="vn-hero-where vn-rise" style="--d:1s">${where.map(escapeHtml).join('<span aria-hidden="true"> · </span>')}</p>` : ""}
  </div>
  <span class="vn-scroll vn-rise" style="--d:1.5s" aria-hidden="true"></span>
</header>`;

  // ── Lecteur « en cours de lecture » ───────────────────────────────────────
  const nowHtml = `<div class="vn-now" data-now aria-hidden="true">
  <span class="vn-now-disc">${disc({ className: "vn-disc--mini", rpm })}</span>
  <span class="vn-now-code" data-now-code>A1</span>
  <span class="vn-now-title" data-now-title></span>
  <span class="vn-now-eq"><i></i><i></i><i></i></span>
  <span class="vn-now-bar"><span data-now-progress></span></span>
</div>`;

  // ── Face A ────────────────────────────────────────────────────────────────
  const introHtml = intro.message
    ? track("A", "intro", {
        name: "Intro",
        body: `<div class="vn-lyrics">${paragraphs(intro.message)}</div>`,
      })
    : "";

  const countdownHtml =
    style.countdown && eventDate
      ? `<section class="vn-counter" data-countdown="${escapeHtml(eventDate)}">
  <p class="vn-code vn-code--center">Sortie dans</p>
  <div class="vn-counter-deck" data-reveal>
    ${[
      ["d", 3, "jours"],
      ["h", 2, "heures"],
      ["m", 2, "minutes"],
      ["s", 2, "secondes"],
    ]
      .map(
        ([unit, length, label]) =>
          `<div class="vn-cell"><span class="vn-digits" data-unit="${unit}" aria-hidden="true">${`<span class="vn-digit"><span class="vn-strip">${"0123456789"
            .split("")
            .concat("0")
            .map((digit) => `<i>${digit}</i>`)
            .join("")}</span></span>`.repeat(length)}</span><span class="vn-sr" data-sr="${unit}"></span><span class="vn-cell-label">${label}</span></div>`,
      )
      .join("")}
  </div>
  <p class="vn-cd-done" hidden>C'est le grand jour !</p>
</section>`
      : "";

  const detailsHtml =
    content.details.enabled && details.length > 0
      ? track("A", "credits", {
          title: "Crédits",
          body: `<div class="vn-back">
  <dl class="vn-credits-list">
    ${details
      .map(
        (item, index) =>
          `<div class="vn-credit" data-reveal style="--i:${index}"><dt>${DETAIL_LABELS[item.key] ?? ""}</dt><dd>${escapeHtml(item.value)}</dd></div>`,
      )
      .join("")}
  </dl>
  <div class="vn-back-foot" aria-hidden="true">
    ${barcode()}
    <span class="vn-catalog">${catalog}</span>
    <span class="vn-stereo">Stéréo</span>
  </div>
</div>`,
        })
      : "";

  const programItems = program.items.filter((item) => item.time || item.label);
  const programHtml =
    program.enabled && programItems.length > 0
      ? track("A", "tracklist", {
          title: program.title,
          name: program.title || "Tracklist",
          body: `<div class="vn-tl">
  <div class="vn-tl-deck">${turntable({ rpm, inner: `${disc({ rpm })}${tonearm()}` })}</div>
  <ol class="vn-tl-list" data-tracklist>
    ${programItems
      .map(
        (item, index) =>
          `<li class="vn-tl-item" data-reveal style="--i:${index}"><span class="vn-tl-num"><span class="vn-tl-n">${String(index + 1).padStart(2, "0")}</span><span class="vn-tl-eq" aria-hidden="true"><i></i><i></i><i></i></span></span><span class="vn-tl-label">${escapeHtml(item.label)}</span><span class="vn-tl-time">${escapeHtml(item.time)}</span></li>`,
      )
      .join("")}
  </ol>
</div>`,
        })
      : "";

  const sideA = `${introHtml}${countdownHtml}${detailsHtml}${programHtml}`;

  // ── Face B ────────────────────────────────────────────────────────────────
  const storyImage = safeUrl(story.image);
  const storyHtml = story.enabled
    ? track("B", "story", {
        title: story.title,
        name: story.title || "Histoire",
        body: `<div class="vn-split${storyImage ? "" : " vn-split--single"}">
  <div class="vn-text" data-reveal>${paragraphs(story.text)}</div>
  ${storyImage ? `<div class="vn-picture" data-reveal>${disc({ className: "vn-disc--picture", rpm, image: storyImage, speed: 0.12 })}</div>` : ""}
</div>`,
      })
    : "";

  const venueImage = safeUrl(venue.image);
  const mapUrl = safeUrl(venue.mapUrl);
  const venueHtml = venue.enabled
    ? track("B", "venue", {
        title: venue.title,
        name: venue.title || "Le lieu",
        body: `<div class="vn-split vn-split--reverse${venueImage ? "" : " vn-split--single"}">
  <div class="vn-text" data-reveal>
    ${paragraphs(venue.text)}
    ${mapUrl ? `<p class="vn-map-wrap"><a class="vn-map" href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer">Itinéraire<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg></a></p>` : ""}
  </div>
  ${
    venueImage
      ? `<div class="vn-single" data-hole>
    <span class="vn-single-print vn-single-print--top" aria-hidden="true">45 tours</span>
    <span class="vn-single-print vn-single-print--bottom" aria-hidden="true">Stéréo · ${catalog}</span>
    ${background(venueImage, "vn-single-photo")}
    <span class="vn-single-ring" aria-hidden="true"></span>
  </div>`
      : ""
  }
</div>`,
      })
    : "";

  const dressHtml = dressCode.enabled
    ? track("B", "dresscode", {
        title: dressCode.title,
        name: dressCode.title || "Dress code",
        body: `<div class="vn-sticker-wrap"><div class="vn-dress" data-reveal>${paragraphs(dressCode.text)}</div></div>`,
      })
    : "";

  const galleryImages = gallery.images.map(safeUrl).filter(Boolean);
  const galleryHtml =
    gallery.enabled && galleryImages.length > 0
      ? track("B", "gallery", {
          title: gallery.title,
          name: gallery.title || "Galerie",
          body: `<div class="vn-crate">
  <div class="vn-crate-row" data-crate>
    ${galleryImages
      .map(
        (url, index) =>
          `<figure class="vn-crate-item" data-crate-item>
      <button type="button" class="vn-crate-btn" data-photo="${index}" data-src="${escapeHtml(url)}" aria-label="Agrandir la photo ${index + 1}">${background(url, "vn-crate-img")}</button>
      <figcaption class="vn-crate-num" aria-hidden="true">N° ${String(index + 1).padStart(2, "0")}</figcaption>
    </figure>`,
      )
      .join("")}
  </div>
  ${
    galleryImages.length > 1
      ? `<div class="vn-crate-nav">
    <button type="button" class="vn-round-btn" data-crate-prev aria-label="Photo précédente"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
    <button type="button" class="vn-round-btn" data-crate-next aria-label="Photo suivante"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>
  </div>`
      : ""
  }
</div>`,
        })
      : "";

  const rsvpHtml = track("B", "jukebox", {
    name: "Réponse",
    body: `<div class="vn-juke" data-juke>
  <div class="vn-juke-top" aria-hidden="true">
    <span class="vn-juke-glow"></span>
    <div class="vn-juke-window">${disc({ className: "vn-juke-disc", rpm, attributes: "data-juke-disc" })}</div>
    <div class="vn-eq">${Array.from({ length: 13 }, (_, index) => `<i style="--k:${index}"></i>`).join("")}</div>
  </div>
  ${renderRsvpBlock(content.rsvp)}
</div>`,
  });

  const sideB = `${storyHtml}${venueHtml}${dressHtml}${galleryHtml}${rsvpHtml}`;

  // ── Retourner le disque ───────────────────────────────────────────────────
  const flipHtml = sideA
    ? `<section class="vn-flip" data-flip aria-label="Face B">
  <div class="vn-flip-stage">
    <div class="vn-flip-disc" data-flip-disc>
      <div class="vn-flip-face vn-flip-face--a">${disc({ rpm, side: "A" })}</div>
      <div class="vn-flip-face vn-flip-face--b">${disc({ rpm, side: "B" })}</div>
    </div>
    <p class="vn-flip-text"><span class="vn-flip-a" aria-hidden="true">Retournez le disque</span><span class="vn-flip-b">Face B</span></p>
  </div>
</section>`
    : "";

  // ── Piste cachée ──────────────────────────────────────────────────────────
  const hiddenHtml = `<section class="vn-hidden" data-hidden>
  <div class="vn-silence" data-silence aria-hidden="true"><span class="vn-silence-line"></span><span class="vn-silence-time" data-silence-time>3:47</span></div>
  ${
    closing.enabled
      ? `<header class="vn-head" data-reveal>
    <p class="vn-code"><span class="vn-code-id">Piste cachée</span></p>
    ${closing.title ? `<h2 class="vn-h2">${escapeHtml(closing.title)}</h2>` : ""}
  </header>
  <div class="vn-text vn-text--center" data-reveal>${paragraphs(closing.text)}</div>`
      : ""
  }
  <div class="vn-runout" data-runout>
    ${turntable({
      rpm,
      inner: `${disc({ className: "vn-disc--runout", rpm, etch: "À très vite, {{GUEST_NAME}}" })}${tonearm("vn-arm--end")}`,
    })}
  </div>
  <p class="vn-sr">À très vite, {{GUEST_NAME}}</p>
</section>`;

  return `<main class="vn" data-rpm="${rpm}">
${heroHtml}
${nowHtml}
<div class="vn-side vn-side--a">${sideA}</div>
${flipHtml}
<div class="vn-side vn-side--b">${sideB}</div>
${hiddenHtml}
<footer class="vn-footer"><p>℗ {{EVENT_TITLE}}</p><p>${catalog} · Stéréo</p></footer>
</main>`;
}
