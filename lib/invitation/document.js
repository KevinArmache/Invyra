import {
  monogramFrom,
  normalizeOpening,
  openingBootstrap,
  renderCustomOpening,
  renderOpening,
} from "@/lib/invitation/opening";
import { escapeHtml } from "@/lib/invitation/html";
import { fontsHref, normalizeFonts } from "@/lib/invitation/fonts";
import { SITE_URL } from "@/lib/site";
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
 * initiales du titre). CONTACT_PHONE : numéro à appeler pour toute question,
 * sans repli (un modèle le place avec `data-if="CONTACT_PHONE"`).
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
    CONTACT_PHONE: contactPhoneOf(event),
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
export function countdownTarget(event) {
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

// ─── Signature ──────────────────────────────────────────────────────────────

/**
 * « Développé par Invyra », au pied de chaque invitation, avec un lien vers
 * le site.
 *
 * Elle se glisse dans le dernier `<footer>` du modèle : elle en hérite la
 * police, la couleur, les majuscules et l'alignement, et suit donc le
 * design de chaque invitation. Ses couleurs propres sont celles du modèle
 * (--c-accent, --c-accent2), avec pour repli la couleur dominante de son
 * CSS. Un modèle sans pied de page la reçoit en fin de page, dans un bloc
 * centré.
 *
 * Le lotus d'Invyra s'y dessine au trait quand la signature arrive à l'écran
 * (`is-visible`, posé par SIGNATURE_SCRIPT), puis ses étincelles scintillent ;
 * le nom est traversé de temps en temps par un reflet. Le lien s'ouvre dans
 * un nouvel onglet (voir `allow-popups-to-escape-sandbox` dans
 * InvitationPreview).
 */
const SIGNATURE_URL = `${SITE_URL}/?utm_source=invitation&utm_medium=signature`;

const SIGNATURE_LINK = `<a class="inv-sig" data-invyra-signature href="${escapeHtml(SIGNATURE_URL)}" target="_blank" rel="noopener" aria-label="Développé par Invyra (ouvre le site)">
<span class="inv-sig-rule" aria-hidden="true"></span>
<span class="inv-sig-body" aria-hidden="true">
<svg class="inv-sig-lotus" viewBox="0 0 32 28" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
<path class="inv-sig-petal" pathLength="1" d="M16 7.5C19.2 11.4 19.2 17 16 21.5C12.8 17 12.8 11.4 16 7.5Z"/>
<path class="inv-sig-petal" pathLength="1" d="M15 21.5C10.2 20.6 6.6 16.8 6 12.2C10.4 13 13.8 16.6 15 21.5Z"/>
<path class="inv-sig-petal" pathLength="1" d="M17 21.5C21.8 20.6 25.4 16.8 26 12.2C21.6 13 18.2 16.6 17 21.5Z"/>
<path class="inv-sig-petal" pathLength="1" d="M3.5 18.5C7.4 22.8 11.6 24.4 16 24.4C20.4 24.4 24.6 22.8 28.5 18.5"/>
<path class="inv-sig-spark" fill="currentColor" stroke="none" d="M16 .6L16.7 2.5L18.6 3.2L16.7 3.9L16 5.8L15.3 3.9L13.4 3.2L15.3 2.5Z"/>
<path class="inv-sig-spark" fill="currentColor" stroke="none" d="M8.4 5.2L8.8 6.4L10 6.8L8.8 7.2L8.4 8.4L8 7.2L6.8 6.8L8 6.4Z"/>
<path class="inv-sig-spark" fill="currentColor" stroke="none" d="M23.6 5.2L24 6.4L25.2 6.8L24 7.2L23.6 8.4L23.2 7.2L22 6.8L23.2 6.4Z"/>
</svg>
<span class="inv-sig-text">Développé par <b class="inv-sig-name">Invyra</b></span>
<svg class="inv-sig-arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 11L11 5M6 5h5v5"/></svg>
</span>
<span class="inv-sig-rule" aria-hidden="true"></span>
</a>`;

/** CSS de la signature ; `accent` sert quand le modèle ne déclare pas --c-accent. */
function signatureCss(accent) {
  return `
.inv-sig {
  --sig-accent: var(--c-accent, ${accent});
  --sig-accent2: var(--c-accent2, color-mix(in srgb, var(--sig-accent) 45%, #ffffff));
  display: flex; align-items: center; justify-content: center; gap: .9em;
  align-self: stretch; box-sizing: border-box; width: 100%; max-width: 34rem;
  margin: 1.4em auto 0; padding: .5em 0;
  font: inherit; letter-spacing: inherit; text-transform: inherit; color: inherit;
  text-decoration: none; -webkit-tap-highlight-color: transparent;
}
.inv-sig:focus-visible { outline: 1px dashed var(--sig-accent); outline-offset: 6px; border-radius: 4px; }
.inv-sig-rule {
  flex: 0 1 3.2em; min-width: 0; height: 1px;
  background: linear-gradient(to right, transparent, var(--sig-accent));
  opacity: .7; transform: scaleX(0); transform-origin: right center;
  transition: transform 1.2s cubic-bezier(.16,1,.3,1) .2s;
}
.inv-sig-rule:last-child { transform-origin: left center; background: linear-gradient(to left, transparent, var(--sig-accent)); }
.inv-sig-body {
  display: inline-flex; align-items: center; gap: .55em; white-space: nowrap;
  transition: transform .45s cubic-bezier(.16,1,.3,1);
}
.inv-sig-lotus {
  width: 2.2em; height: auto; flex-shrink: 0; overflow: visible;
  color: var(--sig-accent);
  transition: filter .45s ease, transform .45s cubic-bezier(.16,1,.3,1);
}
.inv-sig-petal { stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset 1.4s cubic-bezier(.16,1,.3,1); }
.inv-sig-petal:nth-child(2) { transition-delay: .15s; }
.inv-sig-petal:nth-child(3) { transition-delay: .25s; }
.inv-sig-petal:nth-child(4) { transition-delay: .4s; }
.inv-sig-spark {
  opacity: 0; transform-box: fill-box; transform-origin: center;
  transition: opacity .6s ease .9s;
}
.inv-sig-name {
  font-weight: bolder;
  background: linear-gradient(110deg, var(--sig-accent) 0%, var(--sig-accent) 38%, var(--sig-accent2) 50%, var(--sig-accent) 62%, var(--sig-accent) 100%);
  background-size: 260% 100%; background-position: 100% 50%;
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent; color: var(--sig-accent);
}
.inv-sig-arrow {
  width: 0; height: .9em; opacity: 0; flex-shrink: 0; color: var(--sig-accent);
  transition: width .35s ease, opacity .35s ease, transform .35s ease;
  transform: translate(-3px, 3px);
}
.inv-sig.is-visible .inv-sig-rule { transform: scaleX(1); }
.inv-sig.is-visible .inv-sig-petal { stroke-dashoffset: 0; }
.inv-sig.is-visible .inv-sig-spark { opacity: 1; animation: inv-sig-twinkle 2.8s ease-in-out 1.6s infinite; }
.inv-sig.is-visible .inv-sig-spark:nth-of-type(6) { animation-delay: 2.5s; }
.inv-sig.is-visible .inv-sig-spark:nth-of-type(7) { animation-delay: 3.3s; }
.inv-sig.is-visible .inv-sig-lotus { animation: inv-sig-float 4.5s ease-in-out 1.6s infinite; }
.inv-sig.is-visible .inv-sig-name { animation: inv-sig-sheen 6s ease-in-out 1.2s infinite; }
.inv-sig:hover .inv-sig-body, .inv-sig:focus-visible .inv-sig-body { transform: translateY(-2px); }
.inv-sig:hover .inv-sig-lotus, .inv-sig:focus-visible .inv-sig-lotus { filter: drop-shadow(0 0 6px var(--sig-accent)); }
.inv-sig:hover .inv-sig-arrow, .inv-sig:focus-visible .inv-sig-arrow { width: .9em; opacity: 1; transform: none; }
/* Modèle sans pied de page : un bloc à lui, centré, aux couleurs du modèle. */
.inv-sig-wrap {
  position: relative; z-index: 1; display: block; clear: both; flex: 0 0 100%; box-sizing: border-box; width: 100%;
  padding: 2.5rem 1rem calc(2.25rem + env(safe-area-inset-bottom, 0px));
  text-align: center; color: var(--c-text, inherit);
  font-family: var(--f-heading, inherit); font-size: .72rem;
  letter-spacing: .28em; text-transform: uppercase; opacity: .8;
}
.inv-sig-wrap .inv-sig { margin-top: 0; }
@keyframes inv-sig-twinkle { 0%, 100% { opacity: 1; transform: scale(1); } 45% { opacity: .25; transform: scale(.55); } }
@keyframes inv-sig-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
@keyframes inv-sig-sheen { 0% { background-position: 100% 50%; } 45%, 100% { background-position: -60% 50%; } }
@media (prefers-reduced-motion: reduce) {
  .inv-sig, .inv-sig * { animation: none !important; transition: none !important; }
  .inv-sig-rule { transform: none; }
  .inv-sig-petal { stroke-dashoffset: 0; }
  .inv-sig-spark { opacity: 1; }
}`;
}

/**
 * Lance le dessin de la signature quand elle arrive à l'écran, une fois
 * l'invitation ouverte : une invitation courte l'a à l'écran d'emblée, et le
 * dessin aurait lieu sous l'écran d'ouverture.
 */
const SIGNATURE_SCRIPT = `window.whenOpened(function () {
  var sig = document.querySelector('[data-invyra-signature]');
  if (!sig) return;
  if (!('IntersectionObserver' in window)) { sig.classList.add('is-visible'); return; }
  var observer = new IntersectionObserver(function (entries) {
    if (!entries[0].isIntersecting) return;
    sig.classList.add('is-visible');
    observer.disconnect();
  }, { threshold: 0.4 });
  observer.observe(sig);
});`;

/**
 * Le HTML du modèle avec sa signature : avant le dernier `</footer>` s'il en
 * a un, sinon dans un pied ajouté en fin de page. `before` (le bloc de
 * contact) est placé juste au-dessus de la signature.
 */
function withSignature(html, before = "") {
  // Un « </footer> » écrit dans un script du modèle ne compte pas : les
  // scripts sont masqués (même longueur) avant la recherche.
  const index = html
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, (match) => " ".repeat(match.length))
    .toLowerCase()
    .lastIndexOf("</footer>");
  const footer = `${before}${SIGNATURE_LINK}`;
  if (index === -1) {
    return `${html}\n<footer class="inv-sig-wrap">${footer}</footer>`;
  }
  return `${html.slice(0, index)}${footer}${html.slice(index)}`;
}

// ─── Numéro de contact ──────────────────────────────────────────────────────

/**
 * « Pour tout renseignement » suivi du numéro de contact de l'événement, au
 * pied de chaque invitation, juste au-dessus de la signature : comme elle, il
 * hérite de la police, des majuscules et de l'alignement du pied du modèle,
 * et prend sa couleur d'accent.
 *
 * Un modèle qui place lui-même {{CONTACT_PHONE}} ne le reçoit pas une seconde
 * fois. Le lien `tel:` ne garde que les chiffres et le « + » ; il n'a pas de
 * `target` : le bac à sable de l'iframe (allow-popups) laisse passer le
 * protocole vers le composeur du téléphone.
 */
const PHONE_ICON = `<svg class="inv-contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;

function contactPhoneOf(event) {
  return String(event.contactPhone || event.contact_phone || "").trim();
}

/** Bloc de contact à placer au pied du modèle, ou "" s'il n'en faut pas. */
function contactBlock(html, event) {
  const phone = contactPhoneOf(event);
  if (!phone || html.includes("{{CONTACT_PHONE}}")) return "";

  const number = `${PHONE_ICON}<span class="inv-contact-number">${escapeHtml(phone)}</span>`;
  const dial = phone.replace(/[^\d+]/g, "");
  const link = dial
    ? `<a class="inv-contact-phone" href="tel:${escapeHtml(dial)}">${number}</a>`
    : `<span class="inv-contact-phone">${number}</span>`;
  return `<div class="inv-contact" data-invyra-contact>
<span class="inv-contact-label">Pour tout renseignement</span>
${link}
</div>`;
}

/** CSS du bloc de contact ; `accent` sert quand le modèle ne déclare pas --c-accent. */
function contactCss(accent) {
  return `
.inv-contact {
  --contact-accent: var(--c-accent, ${accent});
  display: flex; flex-direction: column; align-items: center; gap: .6em;
  align-self: stretch; box-sizing: border-box; width: 100%; max-width: 34rem;
  margin: 1.6em auto 0; text-align: center;
  font: inherit; letter-spacing: inherit; text-transform: inherit; color: inherit;
}
.inv-contact-label { opacity: .75; }
.inv-contact-phone {
  display: inline-flex; align-items: center; justify-content: center; gap: .6em;
  box-sizing: border-box; max-width: 100%; padding: .55em 1.25em;
  border: 1px solid color-mix(in srgb, var(--contact-accent) 45%, transparent);
  border-radius: 999px; color: var(--contact-accent);
  /* Les pieds de page sont souvent écrits tout petit : le numéro reste lisible. */
  font-size: max(1.1em, .85rem); font-weight: bolder; letter-spacing: .06em; text-transform: none;
  font-variant-numeric: tabular-nums; text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  transition: background-color .3s ease, border-color .3s ease, transform .3s cubic-bezier(.16,1,.3,1);
}
a.inv-contact-phone:hover, a.inv-contact-phone:focus-visible {
  background: color-mix(in srgb, var(--contact-accent) 12%, transparent);
  border-color: var(--contact-accent); transform: translateY(-1px);
}
a.inv-contact-phone:focus-visible { outline: 1px dashed var(--contact-accent); outline-offset: 4px; }
.inv-contact-icon { width: 1.05em; height: 1.05em; flex-shrink: 0; }
.inv-contact-number { min-width: 0; overflow-wrap: anywhere; }
.inv-sig-wrap .inv-contact { margin-top: 0; }
.inv-sig-wrap .inv-contact + .inv-sig { margin-top: 1.4em; }
@media (prefers-reduced-motion: reduce) {
  .inv-contact-phone { transition: none; }
  a.inv-contact-phone:hover, a.inv-contact-phone:focus-visible { transform: none; }
}`;
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
 * Filet de sécurité pour les photos importées, quelles que soient leurs
 * dimensions : une image ne déborde pas de son conteneur et se recadre au
 * lieu de se déformer. `:where()` a une spécificité nulle : la moindre règle
 * du modèle l'emporte (un `object-fit: contain`, une taille de fond…).
 *
 * Pas de `height: auto` : il écraserait les attributs `height` et une photo
 * carrée ou ronde perdrait sa forme.
 */
const MEDIA_FIT_CSS = `:where(img, video) { max-width: 100%; object-fit: cover; }
:where([style*="background-image"]) { background-size: cover; background-position: center; }`;

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
  // Une vignette ne montre que le haut de l'invitation : pas de signature
  // ni de numéro de contact.
  else parts.html = withSignature(parts.html, contactBlock(parts.html, event));

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
  const footerAccent = readOnly ? null : accentFromCss(parts.css);

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
${MEDIA_FIT_CSS}
${scrollbarCss(parts.css, readOnly)}
${parts.css}
${readOnly ? "" : `${signatureCss(footerAccent)}${contactCss(footerAccent)}`}
${opening?.css ?? ""}
${readOnly ? THUMBNAIL_CSS : ""}
</style>
<script>${openingBootstrap(Boolean(opening))}</script>
${readOnly ? "" : `<script>${READY_SCRIPT}</script>`}
</head>
<body>
${html}
<script>window.GUEST_DATA = ${toScriptLiteral(rsvpData)};</script>
${readOnly ? "" : `<script>${SIGNATURE_SCRIPT}</script>`}
<script>
${script}
</script>
</body>
</html>`;
}
