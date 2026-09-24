import {
  cssUrl,
  escapeHtml,
  paragraphs,
  renderRsvpBlock,
  safeUrl,
} from "@/lib/invitation/shared";
import { figurePolygons } from "@/lib/invitation/designs/origami/figures";

/**
 * Balisage de l'invitation Origami : une feuille pleine page (le héro), puis
 * une bande de papier faite de panneaux qui se déplient au défilement.
 *
 * Tout est lisible sans script (vignettes, « réduire les animations ») : les
 * états pliés, masqués ou décalés n'existent que sous `html.fx`, classe posée
 * par le script du design.
 */

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

const DETAIL_LABELS = {
  date: "Date",
  time: "Heure",
  location: "Lieu",
  dressCode: "Tenue",
};

const ICONS = {
  date: '<rect x="3.5" y="5" width="17" height="15.5" rx="1.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  time: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  location:
    '<path d="M12 21s-6.5-5.8-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.2 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.3"/>',
  dressCode:
    '<path d="M12 12 4 7.5v9zM12 12l8-4.5v9z"/><circle cx="12" cy="12" r="1.6"/>',
};

// Légère rotation des photos de l'album, comme posées à la main.
const PHOTO_TILT = [-2.4, 1.8, -1.2, 2.6, -2, 1.3];

function icon(key) {
  return `<svg class="ori-icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[key] ?? ICONS.date}</svg>`;
}

function background(url, className, attributes = "") {
  const safe = safeUrl(url);
  if (!safe) return "";
  return `<div class="${className}" style="${escapeHtml(`background-image:${cssUrl(safe)}`)}" ${attributes}></div>`;
}

/** Tampon à l'encre portant le monogramme (remplacé au rendu). */
export function stamp(className = "") {
  return `<span class="ori-stamp ${className}" aria-hidden="true"><span>{{MONOGRAM}}</span></span>`;
}

/**
 * Panneau de la bande de papier. `data-unfold` : le panneau se déplie depuis
 * sa charnière haute quand il entre à l'écran ; `.ori-shade` porte l'ombre du
 * pli pendant le mouvement.
 */
function panel(className, inner, attributes = "") {
  return `<section class="ori-panel ${className}" data-unfold ${attributes}>
${inner}
<span class="ori-shade" aria-hidden="true"></span>
</section>`;
}

function chapterHead(index, title) {
  return `<header class="ori-head" data-reveal>
  <p class="ori-kicker">Pli ${ROMAN[index] ?? index + 1}</p>
  ${title ? `<h2 class="ori-h2 ori-press">${escapeHtml(title)}</h2>` : ""}
</header>`;
}

export function render({ style, content, details, eventDate }) {
  const { hero, intro, story, program, venue, dressCode, gallery, closing } =
    content;
  const date = details.find((item) => item.key === "date");
  let chapterIndex = 0;
  const nextChapter = () => chapterIndex++;

  // ── Héro : la feuille dépliée ─────────────────────────────────────────────
  const heroImage = safeUrl(hero.image);
  const heroWindow = heroImage
    ? `<div class="ori-window">
    <div class="ori-window-cut ori-cut" style="--d:.45s">${background(heroImage, "ori-window-img", 'data-parallax="0.16"')}</div>
    <svg class="ori-bevel ori-in" style="--d:1.2s" viewBox="0 0 100 100" aria-hidden="true">
      <path class="ori-bevel-dark" d="M1 50 50 1 99 50"/><path class="ori-bevel-light" d="M1 50 50 99 99 50"/>
    </svg>
    ${stamp("ori-stamp--hero ori-stamp-in")}
  </div>`
    : `<div class="ori-window ori-window--empty">${stamp("ori-stamp--hero ori-stamp-in")}</div>`;

  const heroHtml = `<header class="ori-hero">
  <div class="ori-sheet paper" data-tilt>
    <span class="ori-crease ori-crease--v" aria-hidden="true"></span>
    <span class="ori-crease ori-crease--h" aria-hidden="true"></span>
    <svg class="ori-crease-diag" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0 100 100M100 0 0 100"/></svg>
    <span class="ori-glare" aria-hidden="true"></span>
    <div class="ori-hero-content">
      ${hero.eyebrow ? `<p class="ori-eyebrow ori-in" style="--d:.25s">${escapeHtml(hero.eyebrow)}</p>` : ""}
      ${heroWindow}
      <h1 class="ori-title ori-press ori-press-in" style="--d:1s">${hero.title ? escapeHtml(hero.title) : "{{EVENT_TITLE}}"}</h1>
      ${date ? `<p class="ori-date ori-in" style="--d:1.45s">${escapeHtml(date.value)}</p>` : ""}
    </div>
    <span class="ori-scroll ori-in" style="--d:2s" aria-hidden="true"></span>
  </div>
</header>`;

  // ── Message : la carte sort de sa pochette ────────────────────────────────
  const introHtml = intro.message
    ? panel(
        "ori-intro",
        `<div class="ori-pocket" data-pocket>
  <span class="ori-pocket-back" aria-hidden="true"></span>
  <div class="ori-letter paper" data-letter>${paragraphs(intro.message)}</div>
  <span class="ori-pocket-front" aria-hidden="true"></span>
</div>`,
      )
    : "";

  // ── Compte à rebours : les chevalets ──────────────────────────────────────
  const countdownHtml =
    style.countdown && eventDate
      ? panel(
          "ori-countdown",
          `<p class="ori-kicker" data-reveal>Rendez-vous dans</p>
<div class="ori-tents">
  ${["d", "h", "m", "s"]
    .map(
      (unit, index) =>
        `<div class="ori-tent" data-reveal style="--i:${index}"><span class="ori-tent-num" data-unit="${unit}">00</span><span class="ori-tent-label">${
          { d: "jours", h: "heures", m: "minutes", s: "secondes" }[unit]
        }</span></div>`,
    )
    .join("")}
</div>
<p class="ori-cd-done" hidden>C'est le grand jour !</p>`,
          `data-countdown="${escapeHtml(eventDate)}"`,
        )
      : "";

  // ── Infos pratiques : les coins cornés ────────────────────────────────────
  const detailsHtml =
    content.details.enabled && details.length > 0
      ? panel(
          "ori-details",
          `<ul class="ori-cards">${details
            .map(
              (item, index) =>
                `<li class="ori-card" data-reveal style="--i:${index}"><span class="ori-ear" aria-hidden="true"></span>${icon(item.key)}<span class="ori-card-label">${DETAIL_LABELS[item.key] ?? ""}</span><span class="ori-card-value">${escapeHtml(item.value)}</span></li>`,
            )
            .join("")}</ul>`,
        )
      : "";

  // ── Histoire ──────────────────────────────────────────────────────────────
  const storyImage = safeUrl(story.image);
  const storyHtml = story.enabled
    ? panel(
        "ori-chapter ori-story",
        `${chapterHead(nextChapter(), story.title)}
<div class="ori-split${storyImage ? "" : " ori-split--single"}">
  <div class="ori-text" data-reveal>${paragraphs(story.text)}</div>
  ${storyImage ? `<div class="ori-frame-wrap" data-reveal><div class="ori-frame">${background(storyImage, "ori-frame-img", 'data-parallax="0.1"')}</div></div>` : ""}
</div>`,
      )
    : "";

  // ── Programme : l'accordéon ───────────────────────────────────────────────
  const programItems = program.items.filter((item) => item.time || item.label);
  const programHtml =
    program.enabled && programItems.length > 0
      ? panel(
          "ori-chapter ori-program",
          `${chapterHead(nextChapter(), program.title)}
<ol class="ori-accordion" data-accordion>
  ${programItems
    .map(
      (item) =>
        `<li class="ori-fold"><span class="ori-fold-time">${escapeHtml(item.time)}</span><span class="ori-fold-dot" aria-hidden="true"></span><span class="ori-fold-label">${escapeHtml(item.label)}</span></li>`,
    )
    .join("")}
</ol>`,
        )
      : "";

  // ── Lieu : le volet ───────────────────────────────────────────────────────
  const venueImage = safeUrl(venue.image);
  const mapUrl = safeUrl(venue.mapUrl);
  const venueHtml = venue.enabled
    ? panel(
        "ori-chapter ori-venue",
        `${chapterHead(nextChapter(), venue.title)}
<div class="ori-split ori-split--reverse${venueImage ? "" : " ori-split--single"}">
  <div class="ori-text" data-reveal>
    ${paragraphs(venue.text)}
    ${mapUrl ? `<p class="ori-tab-wrap"><a class="ori-tab" href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer">Voir l'itinéraire</a></p>` : ""}
  </div>
  ${
    venueImage
      ? `<div class="ori-gate" data-gate>
    ${background(venueImage, "ori-gate-photo")}
    <span class="ori-gate-door ori-gate-door--l" aria-hidden="true"><span class="ori-gate-seal">${stamp()}</span></span>
    <span class="ori-gate-door ori-gate-door--r" aria-hidden="true"><span class="ori-gate-seal">${stamp()}</span></span>
  </div>`
      : ""
  }
</div>`,
      )
    : "";

  // ── Dress code : l'étiquette ──────────────────────────────────────────────
  const dressCodeHtml = dressCode.enabled
    ? panel(
        "ori-chapter ori-dress",
        `${chapterHead(nextChapter(), dressCode.title)}
<div class="ori-tag-wrap">
  <div class="ori-tag" data-reveal>
    <span class="ori-tag-string" aria-hidden="true"></span>
    <div class="ori-tag-body"><span class="ori-tag-hole" aria-hidden="true"></span>${paragraphs(dressCode.text)}</div>
  </div>
</div>`,
      )
    : "";

  // ── Galerie : l'album ─────────────────────────────────────────────────────
  const galleryImages = gallery.images.map(safeUrl).filter(Boolean);
  const galleryHtml =
    gallery.enabled && galleryImages.length > 0
      ? panel(
          "ori-chapter ori-gallery",
          `${chapterHead(nextChapter(), gallery.title)}
<div class="ori-album" data-album>
  ${galleryImages
    .map(
      (url, index) =>
        `<figure class="ori-photo" data-reveal style="--i:${index % 3};--r:${PHOTO_TILT[index % PHOTO_TILT.length]}deg">
    <button type="button" class="ori-photo-btn" data-photo="${index}" data-src="${escapeHtml(url)}" aria-label="Agrandir la photo ${index + 1}">${background(url, "ori-photo-img")}</button>
    <span class="ori-corner ori-corner--tl" aria-hidden="true"></span><span class="ori-corner ori-corner--tr" aria-hidden="true"></span><span class="ori-corner ori-corner--bl" aria-hidden="true"></span><span class="ori-corner ori-corner--br" aria-hidden="true"></span>
  </figure>`,
    )
    .join("")}
</div>`,
        )
      : "";

  // ── RSVP : la carte-réponse ───────────────────────────────────────────────
  const rsvpHtml = panel(
    "ori-reply",
    `<div class="ori-replycard" data-replycard>
  <span class="ori-reply-seal" aria-hidden="true">${stamp("ori-reply-stamp")}</span>
  ${renderRsvpBlock(content.rsvp)}
</div>`,
  );

  // ── Conclusion : l'envol ──────────────────────────────────────────────────
  const finaleHtml = panel(
    "ori-finale",
    `${
      closing.enabled
        ? `<header class="ori-head" data-reveal>${closing.title ? `<h2 class="ori-h2 ori-press">${escapeHtml(closing.title)}</h2>` : ""}</header>
<div class="ori-text" data-reveal>${paragraphs(closing.text)}</div>`
        : ""
    }
<div class="ori-figure-stage" data-figure-stage>
  <svg class="ori-trail" viewBox="0 0 300 300" preserveAspectRatio="none" aria-hidden="true"><path d="M4 296 C 60 250, 40 170, 120 140 S 250 60, 300 2"/></svg>
  <svg class="ori-figure" viewBox="0 0 200 200" aria-hidden="true">${figurePolygons(style.figure)}</svg>
</div>
<p class="ori-signoff" data-ink>À très vite, {{GUEST_NAME}}</p>`,
    `data-finale data-figure="${escapeHtml(style.figure)}"`,
  );

  return `<main class="ori" data-cranes="${style.cranes ? "1" : "0"}">
${heroHtml}
<div class="ori-strip">
${introHtml}
${countdownHtml}
${detailsHtml}
${storyHtml}
${programHtml}
${venueHtml}
${dressCodeHtml}
${galleryHtml}
${rsvpHtml}
${finaleHtml}
</div>
<footer class="ori-footer">${stamp("ori-stamp--small")}<p>{{EVENT_TITLE}}</p></footer>
</main>`;
}
