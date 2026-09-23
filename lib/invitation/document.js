import {
  createThemeConfig,
  normalizeThemeConfig,
  renderTheme,
} from "@/lib/invitation/themes";
import {
  monogramFrom,
  openingBootstrap,
  renderCustomOpening,
  renderOpening,
} from "@/lib/invitation/opening";
import { isVisualEdit, scanCss } from "@/lib/invitation/visual";
import {
  RSVP_SCRIPT,
  escapeHtml,
  eventDetails,
  fontsHref,
  normalizeFonts,
  normalizeMusic,
  normalizeOpening,
} from "@/lib/invitation/shared";

/**
 * Construction du document HTML d'une invitation, quel que soit le type de
 * template :
 * - `{ type: "code", html, css, js, opening, openingCode, fonts, music }` :
 *   template écrit à la main. `openingCode` (facultatif) remplace l'écran
 *   d'ouverture standard par un écran écrit en HTML/CSS/JS ;
 * - `{ type: "theme", themeId, style, content, music }` : template généré par
 *   un thème.
 *
 * Dans les deux cas, l'invitation a un écran d'ouverture (voir opening.js) et
 * peut avoir une musique qui démarre quand l'invité l'ouvre.
 *
 * Le document est ensuite affiché dans l'iframe isolée d'InvitationPreview.
 */

// ─── Valeurs injectées dans un <script> ─────────────────────────────────────

/**
 * Caractères à neutraliser avant d'injecter une valeur dans un <script> :
 * les chevrons, qui permettraient de fermer la balise, et U+2028 / U+2029,
 * que JavaScript traite comme des fins de ligne et qui couperaient la
 * chaîne en deux.
 *
 * Les motifs sont construits depuis leurs points de code plutôt qu'écrits
 * en toutes lettres : insérés littéralement, U+2028 et U+2029 termineraient
 * prématurément le littéral d'expression régulière de ce fichier-ci.
 *
 * `JSON.stringify` seul ne suffit pas : `notes` et `dietary_restrictions`
 * sont saisis par l'invité, une séquence `</script>` fermerait la balise.
 */
const UNSAFE_IN_SCRIPT = new RegExp(
  "[<>" + String.fromCharCode(0x2028, 0x2029) + "]",
  "g",
);
const ESCAPE_PREFIX = String.fromCharCode(92) + "u";
function toScriptLiteral(value) {
  return JSON.stringify(value ?? null).replace(
    UNSAFE_IN_SCRIPT,
    (char) => ESCAPE_PREFIX + char.charCodeAt(0).toString(16).padStart(4, "0"),
  );
}

// ─── Replis des templates code ──────────────────────────────────────────────

const MAX_CODE_LENGTH = 200_000;

const FALLBACK_HTML =
  '<div style="padding:4rem;text-align:center;"><h1>{{EVENT_TITLE}}</h1><p>Invité : {{GUEST_NAME}}</p></div>';

const FALLBACK_CSS =
  "body { background: #111; color: #fff; font-family: sans-serif; }";

/** Polices chargées pour les templates code, qui ne déclarent pas les leurs. */
const CODE_TEMPLATE_FONTS = ["cormorant", "playfair", "inter"];

/**
 * Script de secours, utilisé quand un template code ne fournit pas le sien :
 * il relaie les réponses RSVP au parent et gère l'état « déjà répondu ».
 */
const FALLBACK_SCRIPT = `
document.addEventListener('DOMContentLoaded', function () {
  var formSection = document.getElementById('rsvp-form');
  var successSection = document.getElementById('rsvp-success');
  var statusMsg = document.getElementById('rsvp-status-msg');
  var editBtn = document.getElementById('rsvp-edit-btn');

  if (window.GUEST_DATA && window.GUEST_DATA.rsvp_status) {
    if (formSection) formSection.style.display = 'none';
    if (successSection) successSection.style.display = 'block';
    if (statusMsg) {
      var s = window.GUEST_DATA.rsvp_status;
      if (s === 'confirmed') statusMsg.textContent = '🎉 Présence confirmée !';
      else if (s === 'declined') statusMsg.textContent = '😔 Vous avez décliné.';
      else statusMsg.textContent = '🤔 Réponse en attente.';
    }
    document.querySelectorAll('[data-rsvp]').forEach(function (b) {
      if (b.getAttribute('data-rsvp') === window.GUEST_DATA.rsvp_status) {
        b.classList.add('active');
      }
    });
  }

  if (editBtn) {
    editBtn.addEventListener('click', function () {
      if (formSection) formSection.style.display = 'block';
      if (successSection) successSection.style.display = 'none';
    });
  }

  document.addEventListener('submit', function (e) {
    if (e.target.tagName.toLowerCase() !== 'form') return;
    e.preventDefault();
    var formData = new FormData(e.target);
    window.parent.postMessage({
      type: 'RSVP_SUBMIT',
      data: {
        rsvp_status: formData.get('rsvp_status') || 'confirmed',
        dietary_restrictions: formData.get('dietary_restrictions') || '',
        plus_one: formData.get('plus_one') === 'on' || formData.get('plus_one') === 'true',
        notes: formData.get('notes') || ''
      }
    }, '*');
  });

  document.addEventListener('click', function (e) {
    var btnRsvp = e.target.closest('[data-rsvp]');
    if (btnRsvp) {
      e.preventDefault();
      window.parent.postMessage({
        type: 'RSVP_SUBMIT',
        data: { rsvp_status: btnRsvp.getAttribute('data-rsvp') }
      }, '*');
      return;
    }
    // Compatibilité avec les modèles écrits avant l'attribut data-rsvp.
    if (e.target.closest('.btn-yes')) {
      e.preventDefault();
      window.parent.postMessage({ type: 'RSVP_SUBMIT', data: { rsvp_status: 'confirmed' } }, '*');
    } else if (e.target.closest('.btn-no')) {
      e.preventDefault();
      window.parent.postMessage({ type: 'RSVP_SUBMIT', data: { rsvp_status: 'declined' } }, '*');
    }
  });
});`;

// ─── Jetons ─────────────────────────────────────────────────────────────────

export const TEMPLATE_TOKENS = [
  "{{GUEST_NAME}}",
  "{{EVENT_TITLE}}",
  "{{EVENT_DATE}}",
  "{{TIME}}",
  "{{EVENT_LOCATION}}",
  "{{DRESS_CODE}}",
  "{{EVENT_DESCRIPTION}}",
  "{{CUSTOM_MESSAGE}}",
  // Date du compte à rebours (AAAA-MM-JJTHH:MM:SS), pour les templates code.
  "{{COUNTDOWN_DATE}}",
  // Monogramme de l'ouverture (réglage, sinon initiales du titre).
  "{{MONOGRAM}}",
];

function formatEventDate(eventDate) {
  if (!eventDate) return null;
  return new Date(eventDate).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Remplace les jetons par les valeurs de l'événement, échappées. Les
 * remplacements passent par une fonction : une chaîne de remplacement
 * interpréterait les motifs `$&`, `$1`… qu'un nom d'invité peut contenir.
 */
function replaceTokens(html, event, guestName, formattedDate, monogram) {
  const values = {
    EVENT_TITLE: event.title || "Nom de l'événement",
    GUEST_NAME: guestName || "Prénom Nom",
    LOCATION: event.location || "Lieu",
    EVENT_LOCATION: event.location || "Lieu",
    TIME: event.time || formattedDate || "Date & heure",
    EVENT_DATE: formattedDate || "Date",
    DRESS_CODE: event.dressCode || event.dress_code || "Non précisé",
    EVENT_DESCRIPTION: event.description || "",
    CUSTOM_MESSAGE: event.customMessage || event.custom_message || "",
    COUNTDOWN_DATE: countdownTarget(event) ?? "",
    MONOGRAM: monogram || monogramFrom(event.title),
  };
  return html.replace(/{{([A-Z_]+)}}/g, (match, name) =>
    name in values ? escapeHtml(values[name]) : match,
  );
}

// ─── Document ───────────────────────────────────────────────────────────────

/**
 * Moment de l'événement pour le compte à rebours : le jour de `eventDate`
 * combiné à l'heure saisie en texte libre (« 15h00 », « 19:30 », « 19h »).
 * Sans heure lisible, on vise minuit.
 *
 * Renvoie une date locale sans fuseau (« 2026-12-19T15:00:00 ») : le
 * navigateur de l'invité l'interprète dans son propre fuseau, ce qui colle à
 * l'heure affichée sur l'invitation.
 */
function countdownTarget(event) {
  if (!event.eventDate) return null;
  const date = new Date(event.eventDate);
  if (Number.isNaN(date.getTime())) return null;

  // Les dates sont enregistrées à minuit UTC (voir createEvent) : le jour
  // se lit donc en UTC.
  const day = date.toISOString().slice(0, 10);
  const match = /(\d{1,2})\s*(?:h|H|:)\s*(\d{2})?/.exec(event.time ?? "");
  const hours = match ? Math.min(23, Number(match[1])) : 0;
  const minutes = match && match[2] ? Math.min(59, Number(match[2])) : 0;
  const pad = (value) => String(value).padStart(2, "0");
  return `${day}T${pad(hours)}:${pad(minutes)}:00`;
}

function renderParts(config, event, formattedDate) {
  if (config?.type === "theme") {
    try {
      const rendered = renderTheme(config, {
        details: eventDetails(event, formattedDate),
        eventDate: countdownTarget(event),
      });
      const normalized = normalizeThemeConfig(config);
      return {
        ...rendered,
        js: `${RSVP_SCRIPT}\n${rendered.js}`,
        opening: normalized.content.opening,
        music: normalized.music,
      };
    } catch {
      // Thème supprimé du registre : on retombe sur le rendu minimal plutôt
      // que de laisser l'invité devant une page blanche.
    }
  }
  const fonts = normalizeFonts(config?.fonts);
  return {
    html: config?.html || FALLBACK_HTML,
    css: config?.css || FALLBACK_CSS,
    js: config?.js || FALLBACK_SCRIPT,
    fonts: fonts.length > 0 ? fonts : CODE_TEMPLATE_FONTS,
    // Sans réglages enregistrés, l'ouverture par défaut (enveloppe).
    opening: normalizeOpening(config?.opening),
    openingCode: normalizeOpeningCode(config?.openingCode),
    music: normalizeMusic(config?.music),
  };
}

/**
 * Ouverture écrite en code : `null` tant qu'elle n'a pas de HTML, auquel cas
 * l'ouverture standard (réglages `opening`) s'applique.
 */
function normalizeOpeningCode(code) {
  if (!code || typeof code !== "object") return null;
  const result = {};
  for (const key of ["html", "css", "js"]) {
    const value = typeof code[key] === "string" ? code[key] : "";
    // Trop volumineux : ignoré au rendu, refusé à l'enregistrement.
    if (value.length > MAX_CODE_LENGTH) return null;
    result[key] = value;
  }
  return result.html.trim() ? result : null;
}

/**
 * Convertit un template à thème en template code équivalent, pour qu'un
 * admin puisse le retoucher à la main.
 *
 * Les valeurs propres à un événement (date, lieu, compte à rebours…) sont
 * rendues sous forme de jetons, pour que le code reste valable pour
 * n'importe quel événement.
 */
export function themeToCode(config) {
  const normalized = normalizeThemeConfig(config);
  const rendered = renderTheme(normalized, {
    details: [
      { icon: "📅", key: "date", value: "{{EVENT_DATE}}" },
      { icon: "⏰", key: "time", value: "{{TIME}}" },
      { icon: "📍", key: "location", value: "{{EVENT_LOCATION}}" },
      { icon: "👗", key: "dressCode", value: "{{DRESS_CODE}}" },
    ],
    eventDate: "{{COUNTDOWN_DATE}}",
  });
  return {
    type: "code",
    html: rendered.html.trim(),
    css: rendered.css.trim(),
    js: [RSVP_SCRIPT, rendered.js, rendered.staticJs]
      .map((part) => part.trim())
      .filter(Boolean)
      .join("\n\n"),
    fonts: rendered.fonts,
    opening: normalized.content.opening,
    music: normalized.music,
  };
}

// ─── Barre de défilement ────────────────────────────────────────────────────

/** Couleur de repli quand le template ne laisse deviner aucun accent. */
const NEUTRAL_SCROLLBAR = "#8a8580";

/** Saturation et luminosité (0–1) d'une couleur #rrggbb. */
function hsl(hex) {
  const [r, g, b] = [1, 3, 5].map(
    (index) => parseInt(hex.slice(index, index + 2), 16) / 255,
  );
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const saturation =
    max === min ? 0 : (max - min) / (1 - Math.abs(2 * lightness - 1));
  return { saturation, lightness };
}

/**
 * Couleur d'accent d'un template code, qui ne déclare pas de variable
 * --c-accent : la couleur franche (ni grise, ni presque noire ou blanche) la
 * plus utilisée dans son CSS.
 */
function accentFromCss(css) {
  const counts = new Map();
  for (const slot of scanCss(css)) {
    if (slot.kind !== "color") continue;
    const value = slot.value.toLowerCase();
    const hex =
      value.length === 4
        ? `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
        : value;
    const { saturation, lightness } = hsl(hex);
    if (saturation < 0.25 || lightness < 0.2 || lightness > 0.85) continue;
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }
  let best = null;
  for (const [hex, count] of counts) {
    if (!best || count > best.count) best = { hex, count };
  }
  return best?.hex ?? NEUTRAL_SCROLLBAR;
}

/**
 * La barre de défilement du navigateur est blanche par défaut, ce qui jure
 * avec la plupart des invitations. Elle prend ici la couleur d'accent du
 * modèle, sur un rail transparent qui laisse voir le fond de la page.
 *
 * Placé avant le CSS du template : un template code peut toujours styler sa
 * propre barre. En vignette, elle est masquée.
 */
function scrollbarCss(css, readOnly) {
  if (readOnly) {
    return `html { scrollbar-width: none; }
::-webkit-scrollbar { display: none; }`;
  }
  const thumb = `color-mix(in srgb, var(--c-accent, ${accentFromCss(css)}) 60%, transparent)`;
  return `html { scrollbar-width: thin; scrollbar-color: ${thumb} transparent; }
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: ${thumb}; border-radius: 999px; }`;
}

/**
 * @returns {string} document HTML complet, prêt pour `srcDoc`
 */
export function buildInvitationDocument({
  config,
  event,
  guestName,
  rsvpData,
  readOnly = false,
  showOpening = true,
}) {
  const formattedDate = formatEventDate(event.eventDate);
  const parts = renderParts(config, event, formattedDate);

  // Toute invitation a un écran d'ouverture. Il n'est pas affiché en vignette
  // (il masquerait le design) ni pendant l'édition du contenu. La musique
  // démarre au geste d'ouverture : sans écran d'ouverture, pas de musique.
  const monogram = parts.opening.monogram || monogramFrom(event.title);
  let opening = null;
  if (!readOnly && showOpening) {
    opening = parts.openingCode
      ? renderCustomOpening(parts.openingCode, parts.music?.url)
      : renderOpening(parts.opening, monogram, parts.music?.url);
  }

  const html = replaceTokens(
    `${opening?.html ?? ""}${parts.html}`,
    event,
    guestName,
    formattedDate,
    monogram,
  );
  const fonts = fontsHref(parts.fonts);

  // En vignette, le script n'est pas exécuté : une vignette n'a pas à
  // pouvoir envoyer une réponse RSVP.
  // Seul le script « statique » du thème (compte à rebours…) y tourne.
  const script = readOnly
    ? (parts.staticJs ?? "")
    : `${parts.js}\n${parts.staticJs ?? ""}\n${opening?.js ?? ""}`;

  return `<!DOCTYPE html>
<html lang="fr"${opening ? ' class="sealed"' : ""}>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
${fonts ? `<link href="${escapeHtml(fonts)}" rel="stylesheet" />` : ""}
<style>
html, body { margin: 0; padding: 0; width: 100%; min-height: 100%; overflow-x: hidden; }
[hidden] { display: none !important; }
${scrollbarCss(parts.css, readOnly)}
${parts.css}
${opening?.css ?? ""}
</style>
<script>${openingBootstrap(Boolean(opening))}</script>
</head>
<body>
${html}
<script>window.GUEST_DATA = ${toScriptLiteral(rsvpData)};</script>
<script>
${script}
</script>
</body>
</html>`;
}

/**
 * Configuration prête à éditer : normalisée pour un thème (valeurs par
 * défaut complétées), réduite aux trois sources pour un template code.
 * `null` signifie « aucun template » : l'éditeur propose alors les thèmes.
 */
export function toEditableConfig(config) {
  if (!config || typeof config !== "object") return null;
  if (config.type === "theme") {
    try {
      return normalizeThemeConfig(config);
    } catch {
      // Thème retiré du registre : on garde le contenu sur le thème par défaut.
      return createThemeConfig(undefined, config.content);
    }
  }
  return {
    type: "code",
    html: config.html || "",
    css: config.css || "",
    js: config.js || "",
    opening: normalizeOpening(config.opening),
    openingCode: normalizeOpeningCode(config.openingCode),
    fonts: normalizeFonts(config.fonts),
    music: normalizeMusic(config.music),
  };
}

// ─── Validation côté serveur ────────────────────────────────────────────────

/**
 * Valide et normalise une configuration de template avant écriture en base.
 *
 * @param {object} config
 * @param {object} options
 * @param {boolean} options.allowCode  un template code peut-il être enregistré ?
 *   Seuls les admins écrivent du code : c'est du HTML/JS arbitraire servi aux
 *   invités.
 * @param {object} [options.base]  version de référence d'un template code.
 *   Sans `allowCode`, un template code n'est accepté que s'il ne diffère de
 *   `base` que par ses textes, images, liens et couleurs (éditeur visuel).
 */
export function validateTemplateConfig(
  config,
  { allowCode = false, base = null } = {},
) {
  if (!config || typeof config !== "object") {
    throw new Error("Configuration de template invalide");
  }

  if (config.type === "theme") return normalizeThemeConfig(config);

  if (config.type === "code") {
    if (!allowCode && !isVisualEdit(base, config)) {
      throw new Error(
        "Seul un administrateur peut modifier le code de ce modèle. Sans code, seuls les textes, les images, les liens et les couleurs peuvent changer.",
      );
    }
    const code = {};
    for (const key of ["html", "css", "js"]) {
      const value = typeof config[key] === "string" ? config[key] : "";
      if (value.length > MAX_CODE_LENGTH) {
        throw new Error("Template trop volumineux");
      }
      code[key] = value;
    }
    for (const key of ["html", "css", "js"]) {
      const value = config.openingCode?.[key];
      if (typeof value === "string" && value.length > MAX_CODE_LENGTH) {
        throw new Error("Écran d'ouverture trop volumineux");
      }
    }
    return {
      type: "code",
      ...code,
      opening: normalizeOpening(config.opening),
      openingCode: normalizeOpeningCode(config.openingCode),
      fonts: normalizeFonts(config.fonts),
      music: normalizeMusic(config.music),
    };
  }

  throw new Error("Type de template inconnu");
}
