import {
  escapeHtml,
  imageLayer,
  paragraphs,
  safeUrl,
} from "@/lib/invitation/html";
import { renderRsvpBlock } from "@/lib/invitation/rsvp";

/**
 * Balisage de l'invitation Éclat : héro plein écran, puis des chapitres
 * numérotés en chiffres romains qui se révèlent au défilement.
 */

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

function chapter(index, key, title, body) {
  return `<section class="chapter chapter--${key}">
  <header class="chapter-head" data-reveal>
    <p class="chapter-kicker">${ROMAN[index] ?? index + 1}</p>
    ${title ? `<h2 class="chapter-title">${escapeHtml(title)}</h2>` : ""}
  </header>
  ${body}
</section>`;
}

export function render({ style, content, details, eventDate }) {
  const { hero, intro, story, program, venue, dressCode, gallery, closing } =
    content;
  const date = details.find((item) => item.key === "date");
  let chapterIndex = 0;
  const nextChapter = () => chapterIndex++;

  const heroHtml = `<header class="hero">
  <div class="hero-media" data-parallax="0.35">${imageLayer(hero.image, "hero-img")}</div>
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
        ${safeUrl(story.image) ? `<div class="photo photo--arch" data-reveal>${imageLayer(story.image, "photo-img", 'data-parallax="0.12"')}</div>` : ""}`,
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
        ${safeUrl(venue.image) ? `<div class="photo" data-reveal>${imageLayer(venue.image, "photo-img", 'data-parallax="0.12"')}</div>` : ""}
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
                `<figure data-reveal style="--i:${index % 3}">${imageLayer(url, "gallery-img")}</figure>`,
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
