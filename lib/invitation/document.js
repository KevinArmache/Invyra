import {
  monogramFrom,
  normalizeOpening,
  openingBootstrap,
  renderCustomOpening,
  renderOpening,
} from "@/lib/invitation/opening";
import { escapeHtml } from "@/lib/invitation/html";
import { fontsHref, normalizeFonts } from "@/lib/invitation/fonts";
import {
  normalizeMusic,
  normalizeOpeningCode,
} from "@/lib/templates/config";
import { scanCss } from "@/lib/templates/visual-edit";

/**
 * Construction du document HTML d'une invitation à partir de son modèle
 * (HTML, CSS et JavaScript, voir lib/templates/config.js) et de l'événement.
 *
 * Toute invitation a un écran d'ouverture (voir opening.js) : l'ouverture
 * standard, réglée par `opening`, ou celle écrite par le modèle
 * (`openingCode`). Elle peut aussi avoir une musique qui démarre quand
 * l'invité l'ouvre.
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

// ─── Replis d'un modèle incomplet ───────────────────────────────────────────

const FALLBACK_HTML =
  '<div style="padding:4rem;text-align:center;"><h1>{{EVENT_TITLE}}</h1><p>Invité : {{GUEST_NAME}}</p></div>';

const FALLBACK_CSS =
  "body { background: #111; color: #fff; font-family: sans-serif; }";

/** Polices chargées pour un modèle qui ne déclare pas les siennes. */
const DEFAULT_FONTS = ["cormorant", "playfair", "inter"];

/**
 * Script de secours, utilisé quand le modèle ne fournit pas le sien :
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
 * Valeur de chaque jeton `{{NOM}}` pour cet événement, vide quand
 * l'événement ne la renseigne pas (les conditions `data-if` en dépendent).
 *
 * COUNTDOWN_DATE : moment de l'événement (AAAA-MM-JJTHH:MM:SS), pour un
 * compte à rebours. MONOGRAM : monogramme de l'ouverture (réglage, sinon
 * initiales du titre).
 */
function tokenValues(event, guestName, formattedDate, monogram) {
  return {
    EVENT_TITLE: event.title,
    GUEST_NAME: guestName,
    LOCATION: event.location,
    EVENT_LOCATION: event.location,
    TIME: event.time,
    EVENT_DATE: formattedDate,
    DRESS_CODE: event.dressCode || event.dress_code,
    EVENT_DESCRIPTION: event.description,
    CUSTOM_MESSAGE: event.customMessage || event.custom_message,
    COUNTDOWN_DATE: countdownTarget(event),
    MONOGRAM: monogram || monogramFrom(event.title),
  };
}

/** Texte affiché par un jeton dont l'événement ne renseigne pas la valeur. */
const TOKEN_FALLBACKS = {
  EVENT_TITLE: "Nom de l'événement",
  GUEST_NAME: "Prénom Nom",
  LOCATION: "Lieu",
  EVENT_LOCATION: "Lieu",
  EVENT_DATE: "Date",
  DRESS_CODE: "Non précisé",
};

/**
 * Remplace les jetons par les valeurs de l'événement, échappées. Les
 * remplacements passent par une fonction : une chaîne de remplacement
 * interpréterait les motifs `$&`, `$1`… qu'un nom d'invité peut contenir.
 */
function replaceTokens(html, values) {
  // Sans heure, {{TIME}} affiche la date.
  const fallbacks = {
    ...TOKEN_FALLBACKS,
    TIME: values.EVENT_DATE || "Date & heure",
  };
  return html.replace(/{{([A-Z_]+)}}/g, (match, name) =>
    name in values ? escapeHtml(values[name] || fallbacks[name] || "") : match,
  );
}

/**
 * Affichage conditionnel : un élément marqué `data-if="DRESS_CODE"` (nom
 * d'un jeton, sans accolades) n'est affiché que si l'événement renseigne
 * cette valeur. Avec plusieurs noms, il suffit que l'un soit renseigné ; un
 * « ! » devant un nom inverse la condition :
 *
 *   <span data-if="TIME">{{TIME}}</span><span data-if="!TIME">--:--</span>
 *
 * Un élément dont la condition n'est pas remplie reçoit l'attribut `hidden`.
 */
const CONDITION = /\sdata-if\s*=\s*(["'])(.*?)\1/g;

function applyConditions(html, values) {
  return html.replace(CONDITION, (attribute, quote, condition) => {
    const names = condition.split(/\s+/).filter(Boolean);
    const shown =
      names.length === 0 ||
      names.some((name) =>
        name.startsWith("!") ? !values[name.slice(1)] : Boolean(values[name]),
      );
    return shown ? attribute : `${attribute} hidden`;
  });
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

function renderParts(config) {
  const fonts = normalizeFonts(config?.fonts);
  return {
    html: config?.html || FALLBACK_HTML,
    css: config?.css || FALLBACK_CSS,
    js: config?.js || FALLBACK_SCRIPT,
    fonts: fonts.length > 0 ? fonts : DEFAULT_FONTS,
    // Sans réglages enregistrés, l'ouverture par défaut (enveloppe).
    opening: normalizeOpening(config?.opening),
    openingCode: normalizeOpeningCode(config?.openingCode),
    music: normalizeMusic(config?.music),
  };
}

// ─── Signal « prête à être montrée » ────────────────────────────────────────

/**
 * La page hôte (InvitationExperience) montre l'invitation dès que ce signal
 * arrive : document analysé, polices chargées (1,2 s au plus). Sans lui, elle
 * attendait l'événement `load` de l'iframe, donc toutes les photos, galerie
 * comprise : sur mobile, plusieurs secondes d'écran noir pendant lesquelles
 * un toucher ouvrait l'enveloppe sans que l'invité la voie.
 */
const READY_SCRIPT = `(function () {
  var sent = false;
  function ready() {
    if (sent) return;
    sent = true;
    try { window.parent.postMessage({ type: 'INVITATION_READY' }, '*'); } catch (e) {}
  }
  function go() {
    if (document.fonts && document.fonts.ready) {
      var timer = setTimeout(ready, 1200);
      document.fonts.ready.then(function () { clearTimeout(timer); ready(); });
    } else ready();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
  else go();
})();`;

// ─── Barre de défilement ────────────────────────────────────────────────────

/** Couleur de repli quand le modèle ne laisse deviner aucun accent. */
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
 * Couleur d'accent d'un modèle qui ne déclare pas de variable --c-accent :
 * la couleur franche (ni grise, ni presque noire ou blanche) la
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
 * Placé avant le CSS du modèle : un modèle peut toujours styler sa propre
 * barre. En vignette, elle est masquée.
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

// ─── Vignettes ──────────────────────────────────────────────────────────────

/**
 * Scripts écrits dans le HTML du modèle (bibliothèques 3D ou d'animation
 * chargées depuis un CDN, effets…) : une vignette n'en a pas besoin, et
 * chacune les chargerait et les exécuterait.
 *
 * Exception : les scripts marqués `<script data-static>` restent. Ils ne font
 * que poser l'état affiché (compte à rebours, palettes d'un tableau, titre
 * ajusté à sa place) et une vignette sans eux serait incomplète.
 */
const SCRIPT_TAGS = /<script\b(?![^>]*\bdata-static\b)[^>]*>[\s\S]*?<\/script\s*>/gi;

/**
 * Vignette figée : chaque animation saute à son état final. Les entrées
 * (fondus, titres) sont donc visibles d'emblée, et les boucles infinies
 * (indicateur de défilement, reflets, zooms lents) ne tournent pas en
 * continu dans chaque carte.
 *
 * Une vignette ne montre que le haut de l'invitation : les éléments marqués
 * `data-thumbnail-skip` (photos des sections du bas, galerie) n'y sont pas
 * affichés, et leurs images ne sont pas chargées.
 */
const THUMBNAIL_CSS = `*, *::before, *::after {
  animation-duration: 0s !important; animation-delay: 0s !important;
  transition-duration: 0s !important; transition-delay: 0s !important;
}
[data-thumbnail-skip] { display: none !important; }`;

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
  const parts = renderParts(config);
  if (readOnly) parts.html = parts.html.replace(SCRIPT_TAGS, "");

  // Toute invitation a un écran d'ouverture. Il n'est pas affiché en vignette
  // (il masquerait l'invitation) ni pendant l'édition du contenu. La musique
  // démarre au geste d'ouverture : sans écran d'ouverture, pas de musique.
  const monogram = parts.opening.monogram || monogramFrom(event.title);
  let opening = null;
  if (!readOnly && showOpening) {
    opening = parts.openingCode
      ? renderCustomOpening(parts.openingCode, parts.music?.url)
      : renderOpening(parts.opening, monogram, parts.music?.url);
  }

  const values = tokenValues(event, guestName, formattedDate, monogram);
  const html = replaceTokens(
    applyConditions(`${opening?.html ?? ""}${parts.html}`, values),
    values,
  );
  const fonts = fontsHref(parts.fonts);

  // En vignette, le script n'est pas exécuté : une vignette n'a pas à
  // pouvoir envoyer une réponse RSVP. Seuls les scripts `data-static` du
  // HTML y tournent (voir SCRIPT_TAGS).
  const script = readOnly ? "" : `${parts.js}\n\n${opening?.js ?? ""}`;

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
${readOnly ? THUMBNAIL_CSS : ""}
</style>
<script>${openingBootstrap(Boolean(opening))}</script>
${readOnly ? "" : `<script>${READY_SCRIPT}</script>`}
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
