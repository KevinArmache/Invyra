import {
  DEFAULT_CONTENT,
  cssUrl,
  escapeHtml,
  paragraphs,
  renderRsvpBlock,
  safeUrl,
} from "@/lib/invitation/shared";

/**
 * Éclat : le thème « grand mariage ».
 *
 * Plein écran sur la photo du couple (zoom lent + parallaxe), titre
 * calligraphié à la feuille d'or, sceau « Save the date » qui tourne,
 * poussière d'or en arrière-plan, compte à rebours, sections qui se révèlent
 * au défilement, frise du programme qui se trace, confettis dorés quand
 * l'invité confirme.
 *
 * Tous les effets sont progressifs : sans script (vignettes de la galerie)
 * ou avec « réduire les animations », l'invitation reste complète et lisible.
 */

const photo = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80`;

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

const ICONS = {
  date: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  time: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  location:
    '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  dressCode: '<path d="M12 7a2 2 0 1 1 2-2M12 7v2l-9 7h18l-9-7"/>',
};

function icon(key) {
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[key] ?? ICONS.date}</svg>`;
}

function ornament(extraClass = "") {
  return `<svg class="ornament ${extraClass}" viewBox="0 0 240 24" aria-hidden="true">
  <path pathLength="1" d="M4 12 H96"/><path pathLength="1" d="M144 12 H236"/>
  <circle cx="104" cy="12" r="2"/><circle cx="136" cy="12" r="2"/>
  <path class="ornament-gem" d="M120 3 L128 12 L120 21 L112 12 Z"/>
</svg>`;
}

function background(url, className, attributes = "") {
  const safe = safeUrl(url);
  if (!safe) return "";
  return `<div class="${className}" style="${escapeHtml(`background-image:${cssUrl(safe)}`)}" ${attributes}></div>`;
}

function chapter(index, key, title, body) {
  return `<section class="chapter chapter--${key}">
  <header class="chapter-head" data-reveal>
    <p class="chapter-kicker">${ROMAN[index] ?? index + 1}</p>
    ${title ? `<h2 class="chapter-title">${escapeHtml(title)}</h2>` : ""}
  </header>
  ${body}
</section>`;
}

function render({ style, content, details, eventDate }) {
  const { hero, intro, story, program, venue, dressCode, gallery, closing } =
    content;
  const date = details.find((item) => item.key === "date");
  let chapterIndex = 0;
  const nextChapter = () => chapterIndex++;

  const heroHtml = `<header class="hero">
  <div class="hero-media" data-parallax="0.35">${background(hero.image, "hero-img")}</div>
  <div class="hero-veil"></div>
  <div class="hero-content">
    ${hero.eyebrow ? `<p class="eyebrow hero-in" style="--d:.2s">${escapeHtml(hero.eyebrow)}</p>` : ""}
    <h1 class="title foil hero-in" style="--d:.55s">${hero.title ? escapeHtml(hero.title) : "{{EVENT_TITLE}}"}</h1>
    ${ornament("hero-in draw")}
    ${date ? `<p class="hero-date hero-in" style="--d:1.3s">${escapeHtml(date.value)}</p>` : ""}
  </div>
  <svg class="seal" viewBox="0 0 200 200" aria-hidden="true">
    <defs><path id="seal-path" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0"/></defs>
    <circle cx="100" cy="100" r="96"/>
    <text><textPath href="#seal-path" textLength="486" lengthAdjust="spacing">SAVE THE DATE ✦ SAVE THE DATE ✦</textPath></text>
    <text class="seal-amp" x="100" y="122" text-anchor="middle">&amp;</text>
  </svg>
  <div class="scroll-hint" aria-hidden="true"><span></span></div>
</header>`;

  const introHtml = intro.message
    ? `<section class="intro"><div class="frame" data-reveal>${paragraphs(intro.message)}</div></section>`
    : "";

  const countdownHtml =
    style.countdown && eventDate
      ? `<section class="countdown" data-countdown="${escapeHtml(eventDate)}" data-reveal>
  ${["d", "h", "m", "s"]
    .map(
      (unit, index) =>
        `<div class="cd-unit" style="--i:${index}"><span class="cd-num" data-unit="${unit}">00</span><span class="cd-label">${
          { d: "jours", h: "heures", m: "minutes", s: "secondes" }[unit]
        }</span></div>`,
    )
    .join("")}
  <p class="cd-done" hidden>C'est le grand jour !</p>
</section>`
      : "";

  const detailsHtml =
    content.details.enabled && details.length > 0
      ? `<section class="details"><ul>${details
          .map(
            (item, index) =>
              `<li data-reveal style="--i:${index}">${icon(item.key)}<span>${escapeHtml(item.value)}</span></li>`,
          )
          .join("")}</ul></section>`
      : "";

  const storyHtml = story.enabled
    ? chapter(
        nextChapter(),
        "story",
        story.title,
        `<div class="chapter-text" data-reveal>${paragraphs(story.text)}</div>
        ${safeUrl(story.image) ? `<div class="photo photo--arch" data-reveal>${background(story.image, "photo-img", 'data-parallax="0.12"')}</div>` : ""}`,
      )
    : "";

  const programItems = program.items.filter((item) => item.time || item.label);
  const programHtml =
    program.enabled && programItems.length > 0
      ? chapter(
          nextChapter(),
          "program",
          program.title,
          `<ol class="timeline" data-timeline>
  <span class="timeline-progress" aria-hidden="true"></span>
  ${programItems
    .map(
      (item) =>
        `<li data-reveal><span class="tl-dot" aria-hidden="true"></span><span class="tl-time">${escapeHtml(item.time)}</span><span class="tl-label">${escapeHtml(item.label)}</span></li>`,
    )
    .join("")}
</ol>`,
        )
      : "";

  const mapUrl = safeUrl(venue.mapUrl);
  const venueHtml = venue.enabled
    ? chapter(
        nextChapter(),
        "venue",
        venue.title,
        `<div class="chapter-text" data-reveal>${paragraphs(venue.text)}</div>
        ${safeUrl(venue.image) ? `<div class="photo" data-reveal>${background(venue.image, "photo-img", 'data-parallax="0.12"')}</div>` : ""}
        ${mapUrl ? `<p class="map" data-reveal><a href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer">Voir l'itinéraire</a></p>` : ""}`,
      )
    : "";

  const dressCodeHtml = dressCode.enabled
    ? chapter(
        nextChapter(),
        "dress-code",
        dressCode.title,
        `<div class="chapter-text" data-reveal>${paragraphs(dressCode.text)}</div>`,
      )
    : "";

  const galleryHtml =
    gallery.enabled && gallery.images.length > 0
      ? chapter(
          nextChapter(),
          "gallery",
          gallery.title,
          `<div class="gallery">${gallery.images
            .map(
              (url, index) =>
                `<figure data-reveal style="--i:${index % 3}">${background(url, "gallery-img")}</figure>`,
            )
            .join("")}</div>`,
        )
      : "";

  const closingHtml = closing.enabled
    ? `<section class="closing" data-reveal>
  ${ornament()}
  ${closing.title ? `<h2 class="closing-title foil">${escapeHtml(closing.title)}</h2>` : ""}
  <div class="chapter-text">${paragraphs(closing.text)}</div>
</section>`
    : "";

  return `${style.particles ? '<canvas class="fx-dust" aria-hidden="true"></canvas>' : ""}
${style.confetti ? '<canvas class="fx-confetti" aria-hidden="true" data-confetti></canvas>' : ""}
<main class="eclat">
${heroHtml}
<div class="page">
${introHtml}
${countdownHtml}
${detailsHtml}
${storyHtml}
${programHtml}
${venueHtml}
${dressCodeHtml}
${galleryHtml}
${closingHtml}
<div class="rsvp-wrap" data-reveal>${renderRsvpBlock(content.rsvp)}</div>
<footer class="footer">${ornament()}<p>{{EVENT_TITLE}}</p></footer>
</div>
</main>`;
}

const css = `
* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  background: var(--c-background);
  color: var(--c-text);
  font-family: var(--f-body);
  font-size: 1.12rem;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}
.fx-dust, .fx-confetti { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.fx-dust { z-index: 0; }
.fx-confetti { z-index: 50; }
.eclat { position: relative; z-index: 1; overflow-x: hidden; }

/* ── Héro ─────────────────────────────────────────── */
.hero {
  position: relative; min-height: 100vh; min-height: 100svh;
  display: grid; place-items: center; text-align: center;
  overflow: hidden; color: #fff; isolation: isolate;
}
.hero-media { position: absolute; inset: -10% 0; z-index: -2; will-change: transform; }
.hero-img {
  position: absolute; inset: 0; background-size: cover; background-position: center;
  animation: kenburns 26s ease-in-out infinite alternate;
}
.hero-veil {
  position: absolute; inset: 0; z-index: -1;
  background:
    radial-gradient(ellipse at center, transparent 30%, rgb(0 0 0 / var(--overlay)) 100%),
    linear-gradient(180deg, rgb(0 0 0 / calc(var(--overlay) * 0.6)) 0%, rgb(0 0 0 / var(--overlay)) 70%, var(--c-background) 100%);
}
.hero-content { padding: 6rem 1.5rem 7rem; max-width: 720px; }
.eyebrow {
  font-family: var(--f-heading); font-size: 0.78rem; letter-spacing: 0.45em;
  text-transform: uppercase; color: var(--c-accent2); margin-bottom: 1.25rem;
}
.title {
  font-family: var(--f-script); font-weight: 400;
  font-size: clamp(3.4rem, 15vw, 6.5rem); line-height: 1.15; padding: 0 0.25em;
}
.foil {
  background: linear-gradient(100deg, var(--c-accent) 0%, var(--c-accent2) 22%, var(--c-accent) 45%, var(--c-accent2) 70%, var(--c-accent) 100%);
  background-size: 250% auto;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: foil 9s linear infinite;
}
.hero .title { filter: drop-shadow(0 4px 24px rgb(0 0 0 / 0.45)); }
.hero-date {
  font-family: var(--f-heading); font-size: 0.95rem; letter-spacing: 0.3em;
  text-transform: uppercase; margin-top: 1rem; color: rgb(255 255 255 / 0.9);
}
.hero-in { opacity: 0; animation: rise 1.6s cubic-bezier(.2,.7,.2,1) var(--d, 0s) forwards; }
.hero .ornament { --d: .9s; }

.ornament { display: block; width: min(240px, 70%); height: 24px; margin: 1.25rem auto; overflow: visible; }
.ornament path, .ornament circle { fill: none; stroke: var(--c-accent); stroke-width: 1.2; }
.ornament circle { fill: var(--c-accent); stroke: none; }
.ornament .ornament-gem { fill: var(--c-accent); stroke: none; }
.ornament.draw path[pathLength] { stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 1.8s ease-out 1.1s forwards; }

.seal {
  position: absolute; right: 6%; bottom: 9%; width: clamp(84px, 20vw, 120px);
  animation: spin 32s linear infinite; opacity: .9;
}
.seal circle { fill: rgb(0 0 0 / .18); stroke: var(--c-accent); stroke-width: 1; }
.seal text { fill: var(--c-accent2); font-family: var(--f-heading); font-size: 15px; letter-spacing: 2px; }
.seal .seal-amp { font-family: var(--f-script); font-size: 64px; letter-spacing: 0; fill: var(--c-accent); }

.scroll-hint { position: absolute; left: 50%; bottom: 1.75rem; width: 1px; height: 56px; background: rgb(255 255 255 / .25); overflow: hidden; }
.scroll-hint span { position: absolute; left: 0; top: -40%; width: 1px; height: 40%; background: var(--c-accent2); animation: hint 2.2s ease-in-out infinite; }

/* ── Contenu ──────────────────────────────────────── */
.page { max-width: 600px; margin: 0 auto; padding: 0 1.5rem 3rem; }
.intro { padding: 3.5rem 0 1rem; }
.frame {
  position: relative; text-align: center; font-style: italic; font-size: 1.2rem;
  padding: 2.75rem 1.75rem; border: 1px solid color-mix(in srgb, var(--c-accent) 55%, transparent);
  outline: 1px solid color-mix(in srgb, var(--c-accent) 25%, transparent); outline-offset: 7px;
  border-radius: var(--radius);
  background: color-mix(in srgb, var(--c-text) 3%, transparent);
}
.frame p + p { margin-top: 1rem; }

.countdown { display: grid; grid-template-columns: repeat(4, 1fr); gap: .6rem; margin: 3rem 0 1rem; text-align: center; }
.cd-unit {
  padding: 1.1rem .25rem; border-radius: var(--radius);
  background: color-mix(in srgb, var(--c-text) 5%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-accent) 30%, transparent);
}
.cd-num { display: block; font-family: var(--f-heading); font-size: clamp(1.6rem, 7vw, 2.3rem); color: var(--c-accent); font-variant-numeric: tabular-nums; line-height: 1.2; }
.cd-num.tick { animation: tick .5s ease; }
.cd-label { display: block; font-size: .68rem; letter-spacing: .22em; text-transform: uppercase; opacity: .7; }
.cd-done { grid-column: 1 / -1; font-family: var(--f-script); font-size: 2.6rem; color: var(--c-accent); }
.countdown:has(.cd-done:not([hidden])) .cd-unit { display: none; }
/* Sans script (vignettes), le compte à rebours afficherait « 00 » partout :
   il n'apparaît qu'une fois lancé. */
.countdown:not(.is-live) { display: none; }

.details ul { list-style: none; display: grid; gap: 1rem; margin: 3rem 0 1rem; text-align: center; }
.details li { display: flex; flex-direction: column; align-items: center; gap: .5rem; font-size: 1.1rem; }
.icon {
  width: 44px; height: 44px; padding: 11px; border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--c-accent) 60%, transparent);
  fill: none; stroke: var(--c-accent); stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round;
}

.chapter { padding-top: 5rem; text-align: center; }
.chapter-kicker { font-family: var(--f-heading); font-size: .75rem; letter-spacing: .5em; color: var(--c-accent); }
.chapter-kicker::before, .chapter-kicker::after { content: ""; display: inline-block; width: 22px; height: 1px; margin: 0 .9em; vertical-align: middle; background: currentColor; opacity: .6; }
.chapter-title { font-family: var(--f-script); font-weight: 400; font-size: clamp(2.6rem, 11vw, 3.6rem); line-height: 1.2; color: var(--c-accent); margin: .25rem 0 1.25rem; }
.chapter-text { opacity: .88; }
.chapter-text p + p { margin-top: 1rem; }

.photo { position: relative; margin-top: 2.25rem; aspect-ratio: 4 / 3; border-radius: var(--radius); overflow: hidden; box-shadow: 0 30px 60px -30px rgb(0 0 0 / .6); }
.photo--arch { aspect-ratio: 4 / 5; max-width: 420px; margin-inline: auto; border-radius: 999px 999px var(--radius) var(--radius); }
.photo::after { content: ""; position: absolute; inset: 10px; border: 1px solid rgb(255 255 255 / .35); border-radius: inherit; pointer-events: none; }
.photo-img { position: absolute; inset: -12% 0; background-size: cover; background-position: center; will-change: transform; }

.timeline { position: relative; list-style: none; text-align: left; margin: 0 auto; max-width: 420px; padding-left: 2.25rem; }
.timeline::before, .timeline-progress { content: ""; position: absolute; left: 7px; top: 8px; bottom: 8px; width: 1px; }
.timeline::before { background: color-mix(in srgb, var(--c-text) 18%, transparent); }
.timeline-progress { background: linear-gradient(var(--c-accent2), var(--c-accent)); transform-origin: top; transform: scaleY(var(--progress, 1)); }
.timeline li { position: relative; display: grid; grid-template-columns: 4.5rem 1fr; gap: .75rem; padding: .9rem 0; }
.tl-dot { position: absolute; left: calc(-2.25rem + 2px); top: 1.35rem; width: 11px; height: 11px; border-radius: 50%; background: var(--c-background); border: 1px solid var(--c-accent); transition: background .6s, box-shadow .6s; }
.timeline li.is-visible .tl-dot { background: var(--c-accent); box-shadow: 0 0 0 5px color-mix(in srgb, var(--c-accent) 20%, transparent), 0 0 18px var(--c-accent); }
html:not(.fx) .tl-dot { background: var(--c-accent); }
.tl-time { font-family: var(--f-heading); color: var(--c-accent); letter-spacing: .08em; }

.map { margin-top: 1.5rem; }
.map a {
  display: inline-block; padding: .7rem 1.6rem; border-radius: 999px; text-decoration: none;
  font-family: var(--f-heading); font-size: .8rem; letter-spacing: .2em; text-transform: uppercase;
  color: var(--c-accent); border: 1px solid var(--c-accent); transition: background .3s, color .3s;
}
.map a:hover { background: var(--c-accent); color: var(--c-background); }

.gallery { display: grid; grid-template-columns: repeat(2, 1fr); grid-auto-rows: 150px; gap: .6rem; }
.gallery figure { position: relative; overflow: hidden; border-radius: calc(var(--radius) * .6); }
.gallery figure:nth-child(3n + 1) { grid-row: span 2; }
.gallery-img { position: absolute; inset: 0; background-size: cover; background-position: center; transition: transform 1.2s cubic-bezier(.2,.7,.2,1); }
.gallery figure:hover .gallery-img { transform: scale(1.08); }

.closing { padding-top: 5rem; text-align: center; }
.closing-title { font-family: var(--f-script); font-weight: 400; font-size: clamp(2.8rem, 12vw, 4rem); line-height: 1.2; padding: 0 .2em; margin-bottom: 1rem; }

/* ── RSVP ─────────────────────────────────────────── */
.rsvp-wrap { margin-top: 4.5rem; }
.rsvp {
  position: relative; text-align: center; padding: 2.75rem 1.5rem;
  border-radius: var(--radius); overflow: hidden;
  background: color-mix(in srgb, var(--c-text) 5%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-accent) 45%, transparent);
  box-shadow: 0 0 60px -20px color-mix(in srgb, var(--c-accent) 50%, transparent);
}
.rsvp-title { font-family: var(--f-script); font-weight: 400; font-size: clamp(2.4rem, 10vw, 3.2rem); line-height: 1.2; color: var(--c-accent); margin-bottom: 1.5rem; }
.rsvp-buttons { display: grid; gap: .7rem; max-width: 340px; margin: 0 auto; }
.rsvp-btn {
  position: relative; overflow: hidden; cursor: pointer;
  font-family: var(--f-heading); font-size: .82rem; letter-spacing: .2em; text-transform: uppercase;
  padding: 1rem 1.25rem; border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--c-accent) 60%, transparent);
  background: transparent; color: var(--c-text);
  transition: transform .3s, box-shadow .3s, background .3s;
}
.rsvp-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 30px -12px var(--c-accent); }
.rsvp-btn--confirmed { background: linear-gradient(120deg, var(--c-accent), var(--c-accent2), var(--c-accent)); color: #1b1408; border-color: transparent; font-weight: 600; }
.rsvp-btn--confirmed::after {
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(115deg, transparent 35%, rgb(255 255 255 / .55) 50%, transparent 65%);
  transform: translateX(-120%); animation: shine 3.8s ease-in-out 2s infinite;
}
.rsvp-btn:disabled { cursor: default; opacity: .65; }
.rsvp-btn.active { opacity: 1; box-shadow: 0 0 0 2px var(--c-background), 0 0 0 3px var(--c-accent); }
.rsvp-status { font-family: var(--f-script); font-size: 2.2rem; line-height: 1.3; color: var(--c-accent); margin-bottom: 1.25rem; }
.rsvp-edit { font: inherit; font-size: .9rem; background: none; border: none; color: var(--c-text); opacity: .7; text-decoration: underline; cursor: pointer; }

.footer { text-align: center; padding-top: 3.5rem; font-family: var(--f-heading); font-size: .75rem; letter-spacing: .35em; text-transform: uppercase; opacity: .7; }

/* ── Révélation au défilement (activée par le script) ─ */
.fx [data-reveal] {
  opacity: 0; transform: translateY(40px); filter: blur(6px);
  transition: opacity 1.2s ease, transform 1.2s cubic-bezier(.2,.7,.2,1), filter 1.2s ease;
  transition-delay: calc(var(--i, 0) * 140ms);
}
.fx [data-reveal].is-visible { opacity: 1; transform: none; filter: none; }

@keyframes kenburns { from { transform: scale(1.05); } to { transform: scale(1.18) translate(-2%, -2%); } }
@keyframes foil { to { background-position: -250% center; } }
@keyframes rise { from { opacity: 0; transform: translateY(26px); filter: blur(10px); } to { opacity: 1; transform: none; filter: none; } }
@keyframes draw { to { stroke-dashoffset: 0; } }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes hint { 0% { top: -40%; } 100% { top: 100%; } }
@keyframes tick { 0% { transform: translateY(-6px); opacity: .3; } 100% { transform: none; opacity: 1; } }
@keyframes shine { 0%, 60% { transform: translateX(-120%); } 100% { transform: translateX(120%); } }

@media (min-width: 560px) {
  .details ul { grid-template-columns: repeat(2, 1fr); }
  .gallery { grid-template-columns: repeat(3, 1fr); grid-auto-rows: 170px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
  .hero-in { opacity: 1; }
  .ornament.draw path[pathLength] { stroke-dashoffset: 0; }
}
`;

/**
 * Effets. Exécuté après RSVP_SCRIPT, dans l'iframe isolée. Écrit en ES5
 * sans dépendance, et entièrement facultatif : chaque bloc vérifie que son
 * élément existe.
 */
const script = `
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var css = getComputedStyle(root);
  var GOLD = css.getPropertyValue('--c-accent').trim() || '#d9b56c';
  var LIGHT = css.getPropertyValue('--c-accent2').trim() || '#fff1c9';
  var TEXT = css.getPropertyValue('--c-text').trim() || '#ffffff';

  function hexToRgb(hex) {
    var n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function fitCanvas(canvas) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  // ── Révélation au défilement ────────────────────────
  var reveals = document.querySelectorAll('[data-reveal]');
  if (!reduce && 'IntersectionObserver' in window) {
    root.classList.add('fx');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    // Les éléments restent masqués derrière l'écran d'ouverture : on ne
    // commence à les révéler qu'une fois l'invitation ouverte.
    var startReveals = function () { reveals.forEach(function (el) { io.observe(el); }); };
    if (window.whenOpened) window.whenOpened(startReveals); else startReveals();
  }

  // ── Parallaxe + frise du programme ──────────────────
  var parallax = document.querySelectorAll('[data-parallax]');
  var timeline = document.querySelector('[data-timeline]');
  var ticking = false;
  function onScroll() {
    ticking = false;
    var vh = innerHeight;
    parallax.forEach(function (el) {
      var factor = parseFloat(el.getAttribute('data-parallax')) || 0.1;
      var box = el.parentElement.getBoundingClientRect();
      if (box.bottom < -200 || box.top > vh + 200) return;
      // L'image déborde de 10 à 12 % en haut et en bas : on ne la décale
      // jamais davantage, sinon un bord vide apparaîtrait dans le cadre.
      var limit = box.height * 0.1;
      var offset = el.classList.contains('hero-media')
        ? -box.top * factor
        : Math.max(-limit, Math.min(limit, (box.top + box.height / 2 - vh / 2) * -factor));
      el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
    });
    if (timeline) {
      var t = timeline.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (vh * 0.8 - t.top) / t.height));
      timeline.style.setProperty('--progress', p.toFixed(3));
    }
  }
  if (!reduce) {
    if (timeline) timeline.style.setProperty('--progress', '0');
    addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();
  }

  // ── Poussière d'or ─────────────────────────────────
  var dust = document.querySelector('.fx-dust');
  if (dust && !reduce) {
    var dctx = fitCanvas(dust);
    var rgb = hexToRgb(GOLD);
    var particles = [];
    var count = Math.min(90, Math.round(innerWidth * innerHeight / 9000));
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * innerWidth,
        y: Math.random() * innerHeight,
        r: Math.random() < 0.12 ? 3 + Math.random() * 5 : 0.6 + Math.random() * 1.8,
        vy: 0.1 + Math.random() * 0.35,
        sway: Math.random() * Math.PI * 2,
        tw: Math.random() * Math.PI * 2
      });
    }
    addEventListener('resize', function () { dctx = fitCanvas(dust); });
    (function frame() {
      if (!document.hidden) {
        dctx.clearRect(0, 0, innerWidth, innerHeight);
        particles.forEach(function (p) {
          p.y -= p.vy;
          p.sway += 0.01;
          p.tw += 0.03;
          if (p.y < -10) { p.y = innerHeight + 10; p.x = Math.random() * innerWidth; }
          var x = p.x + Math.sin(p.sway) * 12;
          var big = p.r > 3;
          var alpha = (big ? 0.08 : 0.35) + Math.sin(p.tw) * (big ? 0.05 : 0.3);
          var g = dctx.createRadialGradient(x, p.y, 0, x, p.y, p.r * (big ? 1 : 2.5));
          g.addColorStop(0, 'rgba(' + rgb.join(',') + ',' + Math.max(0, alpha) + ')');
          g.addColorStop(1, 'rgba(' + rgb.join(',') + ',0)');
          dctx.fillStyle = g;
          dctx.beginPath();
          dctx.arc(x, p.y, p.r * (big ? 1 : 2.5), 0, Math.PI * 2);
          dctx.fill();
        });
      }
      requestAnimationFrame(frame);
    })();
  }

  // ── Confettis dorés à la confirmation ──────────────
  var confettiCanvas = document.querySelector('[data-confetti]');
  if (confettiCanvas && !reduce) {
    var cctx = null;
    var pieces = [];
    var running = false;
    var colors = [GOLD, LIGHT, TEXT, GOLD];
    var burst = function (x, y) {
      cctx = fitCanvas(confettiCanvas);
      for (var i = 0; i < 160; i++) {
        var angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
        var speed = 6 + Math.random() * 10;
        pieces.push({
          x: x, y: y,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          w: 5 + Math.random() * 6, h: 8 + Math.random() * 8,
          rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
          color: colors[i % colors.length], life: 1, round: Math.random() < 0.3
        });
      }
      if (!running) { running = true; requestAnimationFrame(step); }
    };
    var step = function () {
      cctx.clearRect(0, 0, innerWidth, innerHeight);
      pieces = pieces.filter(function (p) { return p.life > 0 && p.y < innerHeight + 40; });
      pieces.forEach(function (p) {
        p.vy += 0.28; p.vx *= 0.985; p.vy *= 0.985;
        p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 0.006;
        cctx.save();
        cctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.5));
        cctx.translate(p.x, p.y);
        cctx.rotate(p.rot);
        cctx.fillStyle = p.color;
        if (p.round) { cctx.beginPath(); cctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); cctx.fill(); }
        else cctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2)));
        cctx.restore();
      });
      if (pieces.length) requestAnimationFrame(step);
      else { running = false; cctx.clearRect(0, 0, innerWidth, innerHeight); }
    };
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-rsvp="confirmed"]');
      if (!btn || btn.disabled) return;
      var box = btn.getBoundingClientRect();
      burst(box.left + box.width / 2, box.top + box.height / 2);
    }, true);
  }
})();
`;

/**
 * Compte à rebours, à part du reste : il tourne aussi dans les aperçus
 * statiques (vignettes, « Aperçu du modèle actif »), qui n'exécutent pas les
 * effets ni le RSVP. Voir  dans themes/index.js.
 */
const countdownScript = `
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var countdown = document.querySelector('[data-countdown]');
  if (countdown) {
    var target = new Date(countdown.getAttribute('data-countdown')).getTime();
    var nums = {};
    countdown.querySelectorAll('[data-unit]').forEach(function (el) { nums[el.getAttribute('data-unit')] = el; });
    var done = countdown.querySelector('.cd-done');
    var update = function () {
      var diff = target - Date.now();
      // Date illisible, ou événement terminé depuis plus d'un jour : le
      // bloc reste masqué.
      if (isNaN(target) || diff <= -86400000) {
        countdown.classList.remove('is-live');
        return false;
      }
      countdown.classList.add('is-live');
      if (diff <= 0) {
        if (done) done.hidden = false;
        return false;
      }
      var values = {
        d: Math.floor(diff / 86400000),
        h: Math.floor(diff / 3600000) % 24,
        m: Math.floor(diff / 60000) % 60,
        s: Math.floor(diff / 1000) % 60
      };
      Object.keys(values).forEach(function (unit) {
        var el = nums[unit];
        var text = values[unit] < 10 ? '0' + values[unit] : String(values[unit]);
        if (el && el.textContent !== text) {
          el.textContent = text;
          if (!reduce) { el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); }
        }
      });
      return true;
    };
    if (update()) {
      var timer = setInterval(function () { if (!update()) clearInterval(timer); }, 1000);
    }
  }

})();
`;

const eclat = {
  id: "eclat",
  name: "Éclat",
  occasions: ["wedding"],
  render,
  css,
  script,
  staticScript: countdownScript,

  styleSchema: [
    { key: "background", type: "color" },
    { key: "text", type: "color" },
    { key: "accent", type: "color" },
    { key: "accent2", type: "color" },
    { key: "fontScript", type: "font" },
    { key: "fontHeading", type: "font" },
    { key: "fontBody", type: "font" },
    { key: "radius", type: "range", min: 0, max: 40, step: 2, unit: "px" },
    { key: "overlay", type: "range", min: 0, max: 90, step: 5, unit: "%" },
    { key: "particles", type: "toggle" },
    { key: "countdown", type: "toggle" },
    { key: "confetti", type: "toggle" },
  ],

  defaultStyle: {
    background: "#0b0d17",
    text: "#f3ecdf",
    accent: "#d9b56c",
    accent2: "#fff1c9",
    fontScript: "pinyon",
    fontHeading: "cinzel",
    fontBody: "cormorant",
    radius: 20,
    overlay: 45,
    particles: true,
    countdown: true,
    confetti: true,
  },

  presets: [
    {
      id: "starry",
      name: "Nuit étoilée",
      style: {
        background: "#0b0d17",
        text: "#f3ecdf",
        accent: "#d9b56c",
        accent2: "#fff1c9",
      },
    },
    {
      id: "champagne",
      name: "Champagne",
      style: {
        background: "#faf5ec",
        text: "#3a2f28",
        accent: "#b08a45",
        accent2: "#f0d9a0",
      },
    },
    {
      id: "blush",
      name: "Rose poudré",
      style: {
        background: "#f8ecea",
        text: "#4a2f33",
        accent: "#b57b72",
        accent2: "#f6d3c8",
      },
    },
    {
      id: "emerald",
      name: "Émeraude",
      style: {
        background: "#0c2621",
        text: "#f1ead8",
        accent: "#d4b06a",
        accent2: "#fbe9b7",
      },
    },
  ],

  defaultContent: {
    ...DEFAULT_CONTENT,
    hero: {
      image: photo("photo-1537633552985-df8429e8048b"),
      eyebrow: "Nous nous marions",
      title: "",
    },
    intro: {
      message:
        "Cher(e) {{GUEST_NAME}},\n\nAvec une immense joie et le cœur rempli d'amour, nous avons le bonheur de vous convier à la célébration de notre mariage.\n\nVotre présence à nos côtés rendra ce jour inoubliable.",
    },
    story: {
      enabled: true,
      title: "Notre histoire",
      text: "Il y a des rencontres qui changent une vie. La nôtre a commencé par un sourire, s'est poursuivie par mille éclats de rire, et ne s'est plus jamais arrêtée.\n\nAujourd'hui, nous avons choisi de nous dire oui, et nous voulons partager ce moment avec celles et ceux que nous aimons.",
      image: photo("photo-1606216794074-735e91aa2c92"),
    },
    program: {
      enabled: true,
      title: "Le programme",
      items: [
        { time: "15:00", label: "Cérémonie" },
        { time: "16:30", label: "Vin d'honneur" },
        { time: "19:30", label: "Dîner aux chandelles" },
        { time: "22:00", label: "Ouverture du bal" },
        { time: "00:00", label: "Pièce montée & feu d'artifice" },
      ],
    },
    venue: {
      enabled: true,
      title: "Le lieu",
      text: "Un domaine niché dans la verdure, où la cérémonie se tiendra en plein air sous les arches fleuries.",
      image: photo("photo-1469371670807-013ccf25f16a"),
      mapUrl: "",
    },
    dressCode: {
      enabled: true,
      title: "Dress code",
      text: "Tenue de soirée. Laissez-vous inspirer par des tons clairs, nude et dorés.",
    },
    gallery: {
      enabled: true,
      title: "Instants choisis",
      images: [
        photo("photo-1583939003579-730e3918a45a"),
        photo("photo-1465495976277-4387d4b0b4c6"),
        photo("photo-1522413452208-996ff3f3e740"),
        photo("photo-1460978812857-470ed1c77af0"),
        photo("photo-1532712938310-34cb3982ef74"),
        photo("photo-1519225421980-715cb0215aed"),
      ],
    },
    closing: {
      enabled: true,
      title: "Avec tout notre amour",
      text: "Nous avons hâte de vivre ce jour avec vous, de trinquer, de danser et de garder, ensemble, des souvenirs pour toujours.",
    },
    rsvp: {
      title: "Serez-vous des nôtres ?",
      confirmed: "Avec joie !",
      maybe: "Peut-être",
      declined: "Hélas, non",
    },
  },
};

export default eclat;
