import {
  cssUrl,
  escapeHtml,
  paragraphs,
  renderRsvpBlock,
  safeUrl,
} from "@/lib/invitation/shared";

/**
 * Balisage standard d'une invitation, partagé par les designs.
 *
 * Les designs se distinguent surtout par leur CSS : ils stylent les mêmes
 * classes (`hero`, `block`, `timeline`, `rsvp-*`…). Un design qui veut une
 * structure vraiment différente peut écrire son propre `render`.
 *
 * Toute valeur saisie est échappée ici. Les jetons {{…}} restent tels quels :
 * buildInvitationDocument les remplace ensuite par des valeurs échappées.
 */

function backgroundStyle(url) {
  const safe = safeUrl(url);
  return safe
    ? ` style="${escapeHtml(`background-image:${cssUrl(safe)}`)}"`
    : "";
}

function image(url, className) {
  return safeUrl(url)
    ? `<div class="${className}"${backgroundStyle(url)} role="img" aria-hidden="true"></div>`
    : "";
}

function block(key, title, body) {
  return `<section class="block block--${key}">
  ${title ? `<h2 class="block-title">${escapeHtml(title)}</h2>` : ""}
  ${body}
</section>`;
}

/**
 * @param {object} args
 * @param {object} args.content  contenu normalisé (voir normalizeContent)
 * @param {Array}  args.details  lignes issues de eventDetails()
 * @param {object} [options]
 * @param {"overlay"|"stacked"} [options.hero] titre sur la photo, ou dessous
 */
export function renderStandardMarkup({ content, details }, options = {}) {
  const heroLayout = options.hero ?? "overlay";
  const { hero, intro, story, program, venue, dressCode, gallery, closing } =
    content;

  const heroHtml = `<header class="hero hero--${heroLayout}">
  ${image(hero.image, "hero-media")}
  <div class="hero-content">
    ${hero.eyebrow ? `<p class="eyebrow">${escapeHtml(hero.eyebrow)}</p>` : ""}
    <h1 class="title">${hero.title ? escapeHtml(hero.title) : "{{EVENT_TITLE}}"}</h1>
  </div>
</header>`;

  const introHtml = intro.message
    ? `<section class="intro"><div class="divider" aria-hidden="true"></div>${paragraphs(intro.message)}</section>`
    : "";

  const detailsHtml =
    content.details.enabled && details.length > 0
      ? `<section class="details"><ul class="details-list">${details
          .map(
            (item) =>
              `<li class="details-item details-item--${item.key}"><span class="details-icon" aria-hidden="true">${item.icon}</span><span>${escapeHtml(item.value)}</span></li>`,
          )
          .join("")}</ul></section>`
      : "";

  const storyHtml = story.enabled
    ? block(
        "story",
        story.title,
        `<div class="block-text">${paragraphs(story.text)}</div>${image(story.image, "block-image")}`,
      )
    : "";

  const programItems = program.items.filter((item) => item.time || item.label);
  const programHtml =
    program.enabled && programItems.length > 0
      ? block(
          "program",
          program.title,
          `<ol class="timeline">${programItems
            .map(
              (item) =>
                `<li class="timeline-item"><span class="timeline-time">${escapeHtml(item.time)}</span><span class="timeline-label">${escapeHtml(item.label)}</span></li>`,
            )
            .join("")}</ol>`,
        )
      : "";

  const mapUrl = safeUrl(venue.mapUrl);
  const venueHtml = venue.enabled
    ? block(
        "venue",
        venue.title,
        `<div class="block-text">${paragraphs(venue.text)}</div>${image(venue.image, "block-image")}${
          mapUrl
            ? `<p class="map"><a class="map-link" href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer">Voir l'itinéraire →</a></p>`
            : ""
        }`,
      )
    : "";

  const dressCodeHtml = dressCode.enabled
    ? block(
        "dress-code",
        dressCode.title,
        `<div class="block-text">${paragraphs(dressCode.text)}</div>`,
      )
    : "";

  const galleryHtml =
    gallery.enabled && gallery.images.length > 0
      ? block(
          "gallery",
          gallery.title,
          `<div class="gallery">${gallery.images
            .map((url) => image(url, "gallery-item"))
            .join("")}</div>`,
        )
      : "";

  const closingHtml = closing.enabled
    ? block(
        "closing",
        closing.title,
        `<div class="block-text">${paragraphs(closing.text)}</div>`,
      )
    : "";

  return `<div class="inv">
<article class="card">
${heroHtml}
${introHtml}
${detailsHtml}
${storyHtml}
${programHtml}
${venueHtml}
${dressCodeHtml}
${galleryHtml}
${closingHtml}
${renderRsvpBlock(content.rsvp)}
</article>
</div>`;
}
