import { escapeHtml } from "@/lib/invitation/shared";

/**
 * Écran d'ouverture de l'invitation (Digital Invitation Opening).
 *
 * Il est rendu dans le document de l'invitation, au-dessus de tout le reste,
 * et non par la page qui l'héberge : la transition vers l'invitation est donc
 * continue (pas de changement de page, pas de chargement entre les deux).
 *
 * Tant qu'il est fermé, `<html>` porte la classe `sealed` : défilement bloqué
 * et animations de la page en pause. À l'ouverture, les animations d'entrée
 * du design démarrent pendant que l'écran s'efface, et les scripts qui ont
 * appelé `window.whenOpened(fn)` sont lancés.
 *
 * Couleurs et polices : celles du design (variables --c-* et --f-*), avec des
 * valeurs de repli pour les templates code qui n'en déclarent pas.
 *
 * Un template code peut aussi écrire son ouverture en HTML/CSS/JS
 * (`openingCode`, voir renderCustomOpening) : le verrouillage de la page, la
 * musique et le lancement de l'invitation restent ceux de la plateforme.
 */

/**
 * Monogramme déduit du titre : « Mariage de Camille & Antoine » → « C&A »,
 * « Gala de bienfaisance » → « GB ».
 */
export function monogramFrom(title) {
  const text = String(title ?? "").trim();
  if (!text) return "";
  const parts = text.split(/\s*(?:&|\+|\bet\b|\band\b)\s*/i).filter(Boolean);
  if (parts.length >= 2) {
    const left = parts[0].split(/\s+/).pop();
    const right = parts[1].split(/\s+/)[0];
    return `${left[0]}&${right[0]}`.toUpperCase();
  }
  return text
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/** Durées (ms) : quand l'invitation démarre, quand l'écran disparaît. */
const TIMINGS = {
  envelope: { reveal: 1250, remove: 2200 },
  seal: { reveal: 600, remove: 1500 },
  curtain: { reveal: 600, remove: 1600 },
};

function stage(style, monogram) {
  const mono = escapeHtml(monogram);
  if (style === "envelope") {
    return `<span class="op-stage op-envelope" aria-hidden="true">
  <span class="env-back"></span>
  <span class="env-letter"><span class="env-letter-mono">${mono}</span><span class="env-letter-line"></span></span>
  <span class="env-front"></span>
  <span class="env-flap"></span>
  <span class="op-seal"><span>${mono}</span></span>
</span>`;
  }
  if (style === "seal") {
    return `<span class="op-stage" aria-hidden="true"><span class="op-seal op-seal--big"><span>${mono}</span></span></span>`;
  }
  return `<span class="op-stage op-mono" aria-hidden="true">${mono}</span>`;
}

/**
 * Musique d'ouverture : le fichier est préchargé pendant que l'invité voit
 * l'écran d'ouverture, et démarre sur son geste (les navigateurs refusent la
 * lecture automatique sans interaction). Un bouton discret permet de couper.
 */
function musicMarkup(url) {
  return `<audio data-invitation-music src="${escapeHtml(url)}" preload="auto" loop></audio>
<button type="button" class="music-toggle" data-music-toggle hidden aria-label="Couper la musique" aria-pressed="false">
  <span class="music-bars" aria-hidden="true"><span></span><span></span><span></span></span>
  <svg class="music-muted" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="m22 9-6 6M16 9l6 6"/></svg>
</button>`;
}

const MUSIC_SCRIPT = `
(function () {
  var audio = document.querySelector('[data-invitation-music]');
  var toggle = document.querySelector('[data-music-toggle]');
  var opening = document.querySelector('[data-opening]');
  if (!audio || !opening) return;
  var target = 0.8;
  function fadeTo(volume, done) {
    var step = (volume - audio.volume) / 20;
    var count = 0;
    var timer = setInterval(function () {
      count++;
      audio.volume = Math.min(1, Math.max(0, audio.volume + step));
      if (count >= 20) { clearInterval(timer); if (done) done(); }
    }, 60);
  }
  function setMuted(muted) {
    toggle.classList.toggle('is-muted', muted);
    toggle.setAttribute('aria-pressed', muted ? 'true' : 'false');
    toggle.setAttribute('aria-label', muted ? 'Remettre la musique' : 'Couper la musique');
  }
  var started = false;
  function start() {
    if (started) return;
    started = true;
    audio.volume = 0;
    var played = audio.play();
    if (played && played.catch) played.catch(function () {});
    fadeTo(target);
    toggle.hidden = false;
    setMuted(false);
  }
  // Une ouverture en plusieurs gestes (voir data-opening-manual) lance la
  // musique elle-même, pendant un geste de l'invité.
  window.startInvitationMusic = start;
  opening.addEventListener('click', start);
  toggle.addEventListener('click', function () {
    if (audio.paused) {
      audio.play();
      fadeTo(target);
      setMuted(false);
    } else {
      fadeTo(0, function () { audio.pause(); });
      setMuted(true);
    }
  });
})();`;

/**
 * Comportement commun à toutes les ouvertures, standard ou écrites en code :
 * un clic sur `[data-opening]` lui ajoute la classe `is-open`, lance
 * l'invitation après `data-reveal-delay` ms et retire l'écran après
 * `data-remove-delay` ms.
 *
 * Avec `data-opening-manual`, le clic ne suffit plus : l'ouverture décide
 * elle-même du moment (après un pliage en plusieurs gestes, par exemple) et
 * appelle `window.openInvitation()`.
 */
const OPENING_SCRIPT = `
(function () {
  var root = document.documentElement;
  var el = document.querySelector('[data-opening]');
  function reveal() {
    if (window.__opened) return;
    window.__opened = true;
    root.classList.remove('sealed');
    root.classList.add('opened');
    (window.__onOpen || []).forEach(function (fn) { try { fn(); } catch (e) {} });
    window.__onOpen = [];
    document.dispatchEvent(new Event('invitation:opened'));
  }
  if (!el) { reveal(); return; }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function delay(name, fallback) {
    var value = parseInt(el.getAttribute(name), 10);
    return isNaN(value) ? fallback : Math.max(0, value);
  }
  var revealDelay = delay('data-reveal-delay', 1000);
  var removeDelay = Math.max(revealDelay, delay('data-remove-delay', 1800));
  function open() {
    if (el.classList.contains('is-open')) return;
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'true');
    setTimeout(reveal, reduce ? 0 : revealDelay);
    setTimeout(function () { el.remove(); }, reduce ? 350 : removeDelay);
  }
  window.openInvitation = open;
  if (!el.hasAttribute('data-opening-manual')) el.addEventListener('click', open);
})();`;

/** Balisage de l'ouverture standard (sans la musique). */
function openingMarkup(opening, monogram) {
  const style = TIMINGS[opening.style] ? opening.style : "envelope";
  const { reveal, remove } = TIMINGS[style];
  const doors =
    style === "envelope"
      ? ""
      : '<span class="op-door op-door--l" aria-hidden="true"></span><span class="op-door op-door--r" aria-hidden="true"></span>';

  return `<button type="button" class="opening opening--${style}" data-opening data-reveal-delay="${reveal}" data-remove-delay="${remove}" aria-label="Ouvrir l'invitation">
${doors}
<span class="op-glow" aria-hidden="true"></span>
<span class="op-inner">
  ${opening.eyebrow ? `<span class="op-eyebrow">${escapeHtml(opening.eyebrow)}</span>` : ""}
  ${opening.title ? `<span class="op-title">${escapeHtml(opening.title)}</span>` : ""}
  ${stage(style, monogram)}
  ${opening.hint ? `<span class="op-hint">${escapeHtml(opening.hint)}</span>` : ""}
</span>
</button>`;
}

/**
 * @param {object} opening   section `opening` normalisée
 * @param {string} monogram  monogramme à afficher (déjà résolu)
 * @param {string} [musicUrl]  musique à lancer à l'ouverture (URL validée)
 * @returns {{ html: string, css: string, js: string }}
 */
export function renderOpening(opening, monogram, musicUrl) {
  return {
    html: `${openingMarkup(opening, monogram)}
${musicUrl ? musicMarkup(musicUrl) : ""}`,
    css: `${BASE_CSS}
${OPENING_CSS}`,
    js: `${OPENING_SCRIPT}${musicUrl ? MUSIC_SCRIPT : ""}`,
  };
}

/**
 * Ouverture écrite en code (template code, champ `openingCode`). Son HTML
 * doit contenir un élément `[data-opening]` : c'est lui que l'invité touche.
 * Le verrouillage de la page, la musique et le lancement de l'invitation
 * restent assurés par la plateforme.
 *
 * @param {{ html: string, css: string, js: string }} code
 * @param {string} [musicUrl]
 */
export function renderCustomOpening(code, musicUrl) {
  return {
    html: `${code.html}
${musicUrl ? musicMarkup(musicUrl) : ""}`,
    css: `${BASE_CSS}
${code.css}`,
    js: `${OPENING_SCRIPT}
${code.js}${musicUrl ? MUSIC_SCRIPT : ""}`,
  };
}

/**
 * Point de départ de l'ouverture en code : le balisage et le CSS de
 * l'ouverture standard, avec le jeton {{MONOGRAM}} à la place du monogramme.
 */
export function openingToCode(opening) {
  return {
    html: openingMarkup(opening, "{{MONOGRAM}}"),
    css: OPENING_CSS.trim(),
    js: "",
  };
}

/**
 * Script placé en tête du document : il existe avant tous les autres, pour
 * que n'importe quel script (design, template code) puisse différer son
 * démarrage avec `window.whenOpened(fn)`.
 */
export function openingBootstrap(hasOpening) {
  return `window.__opened = ${hasOpening ? "false" : "true"};
window.__onOpen = [];
window.whenOpened = function (fn) { window.__opened ? fn() : window.__onOpen.push(fn); };`;
}

/**
 * CSS indispensable à toute ouverture : page verrouillée tant qu'elle est
 * fermée, bouton de la musique.
 */
const BASE_CSS = `
html.sealed, html.sealed body { overflow: hidden !important; height: 100%; }
html.sealed body > :not([data-opening]), html.sealed body > :not([data-opening]) * { animation-play-state: paused !important; }
@keyframes op-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
/* ── Musique ───────────────────────────────── */
.music-toggle {
  position: fixed; right: 16px; bottom: calc(16px + env(safe-area-inset-bottom, 0px)); z-index: 2147482000;
  width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; cursor: pointer;
  color: var(--c-accent, #d4af37); border: 1px solid color-mix(in srgb, var(--c-accent, #d4af37) 55%, transparent);
  background: color-mix(in srgb, var(--c-background, #0b0d17) 78%, transparent);
  -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
  box-shadow: 0 8px 24px rgb(0 0 0 / .25); animation: op-in .6s ease both;
}
.music-bars { display: flex; align-items: flex-end; gap: 3px; height: 16px; }
.music-bars span { width: 3px; height: 100%; border-radius: 2px; background: currentColor; transform-origin: bottom; animation: music-eq 1s ease-in-out infinite; }
.music-bars span:nth-child(2) { animation-delay: -.35s; }
.music-bars span:nth-child(3) { animation-delay: -.7s; }
.music-muted { display: none; width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.music-toggle.is-muted .music-bars { display: none; }
.music-toggle.is-muted .music-muted { display: block; }
@keyframes music-eq { 0%, 100% { transform: scaleY(.3); } 50% { transform: scaleY(1); } }
@media (prefers-reduced-motion: reduce) { .music-bars span { animation: none !important; } }
`;

/** Apparence de l'ouverture standard (enveloppe, cachet, rideau). */
const OPENING_CSS = `
.opening {
  --o-bg: var(--c-background, #0b0d17);
  --o-text: var(--c-text, #f5f1e8);
  --o-accent: var(--c-accent, #d4af37);
  --o-accent2: var(--c-accent2, color-mix(in srgb, var(--c-accent, #d4af37) 45%, #ffffff));
  --o-heading: var(--f-heading, 'Cormorant Garamond', Georgia, serif);
  --o-script: var(--f-script, var(--f-heading, 'Playfair Display', Georgia, serif));
  --o-paper: color-mix(in srgb, var(--o-accent) 14%, #fbf7ef);
  position: fixed; inset: 0; z-index: 2147483000;
  display: grid; place-items: center; width: 100%; height: 100%;
  margin: 0; padding: 2rem 1.5rem; border: 0; cursor: pointer;
  font: inherit; color: var(--o-text); text-align: center;
  background: radial-gradient(ellipse at 50% 45%, color-mix(in srgb, var(--o-bg) 82%, var(--o-accent) 18%) 0%, var(--o-bg) 72%);
  -webkit-tap-highlight-color: transparent;
  overflow: hidden;
}
.opening:focus-visible { outline: none; }
.opening:focus-visible .op-hint { opacity: 1; text-decoration: underline; }
.op-glow {
  position: absolute; left: 50%; top: 50%; width: 140vmax; height: 140vmax; transform: translate(-50%, -50%);
  background: radial-gradient(circle, color-mix(in srgb, var(--o-accent) 18%, transparent) 0%, transparent 45%);
  animation: op-breathe 5s ease-in-out infinite; pointer-events: none;
}
.op-inner { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 1.4rem; max-width: 34rem; }
.op-eyebrow { font-family: var(--o-heading); font-size: .72rem; letter-spacing: .38em; text-transform: uppercase; color: var(--o-accent); opacity: 0; animation: op-in 1s ease .2s forwards; }
.op-title { font-family: var(--o-script); font-size: clamp(2.2rem, 9vw, 3.4rem); line-height: 1.15; opacity: 0; animation: op-in 1.1s ease .45s forwards; }
.op-hint { font-family: var(--o-heading); font-size: .7rem; letter-spacing: .32em; text-transform: uppercase; opacity: 0; animation: op-in 1s ease 1s forwards, op-pulse 2.6s ease-in-out 2s infinite; }
.op-stage { opacity: 0; animation: op-in 1.1s ease .7s forwards; }

/* Cachet de cire */
.op-seal {
  display: grid; place-items: center; width: 70px; height: 70px; border-radius: 50%;
  background: radial-gradient(circle at 34% 30%, var(--o-accent2) 0%, var(--o-accent) 42%, color-mix(in srgb, var(--o-accent) 62%, #000) 100%);
  box-shadow: 0 8px 18px rgb(0 0 0 / .35), inset 0 0 0 4px color-mix(in srgb, var(--o-accent) 75%, #000 25%), inset 0 0 0 6px color-mix(in srgb, var(--o-accent2) 50%, transparent);
  color: color-mix(in srgb, var(--o-accent) 35%, #000);
  font-family: var(--o-script); font-size: 1.35rem; line-height: 1;
  transition: transform .45s cubic-bezier(.3,1.4,.5,1), opacity .45s ease;
}
.op-seal--big { width: 128px; height: 128px; font-size: 2.3rem; animation: op-float 4s ease-in-out infinite; }

/* Enveloppe */
.op-envelope { position: relative; display: block; width: min(78vw, 340px); aspect-ratio: 1.5; perspective: 1200px; animation: op-in 1.1s ease .7s forwards, op-float 4.5s ease-in-out 1.8s infinite; }
.env-back, .env-front, .env-flap, .env-letter { position: absolute; display: block; }
.env-back { inset: 0; border-radius: 6px; background: color-mix(in srgb, var(--o-paper) 88%, #000); box-shadow: 0 30px 60px -18px rgb(0 0 0 / .55); }
.env-letter {
  left: 7%; right: 7%; top: 7%; height: 86%; border-radius: 4px; z-index: 1;
  background: #fffdf8; box-shadow: 0 2px 10px rgb(0 0 0 / .12);
  display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 10%; gap: .6rem;
  transition: transform 1s cubic-bezier(.2,.8,.2,1) .5s;
}
.env-letter-mono { font-family: var(--o-script); font-size: 1.6rem; color: var(--o-accent); line-height: 1; }
.env-letter-line { width: 38%; height: 1px; background: color-mix(in srgb, var(--o-accent) 60%, transparent); }
.env-front {
  inset: 0; z-index: 2; border-radius: 6px;
  clip-path: polygon(0 0, 50% 54%, 100% 0, 100% 100%, 0 100%);
  background: linear-gradient(160deg, var(--o-paper), color-mix(in srgb, var(--o-paper) 92%, #000));
}
.env-flap {
  left: 0; right: 0; top: 0; height: 57%; z-index: 3;
  clip-path: polygon(0 0, 100% 0, 50% 100%);
  background: linear-gradient(180deg, color-mix(in srgb, var(--o-paper) 95%, #000), color-mix(in srgb, var(--o-paper) 86%, #000));
  transform-origin: top center; backface-visibility: hidden;
  transition: transform .75s cubic-bezier(.45,0,.2,1) .2s, z-index 0s linear .55s;
}
.op-envelope .op-seal { position: absolute; left: 50%; top: 54%; z-index: 4; transform: translate(-50%, -50%); }

/* Portes (cachet) et rideaux */
.op-door { position: absolute; top: 0; bottom: 0; width: 50.5%; z-index: 1; transition: transform 1.1s cubic-bezier(.7,0,.2,1) .25s; }
.op-door--l { left: 0; }
.op-door--r { right: 0; }
.opening--seal, .opening--curtain { background: transparent; }
.opening--seal .op-door {
  background: radial-gradient(ellipse at 100% 50%, color-mix(in srgb, var(--o-bg) 80%, var(--o-accent) 20%), var(--o-bg) 75%);
}
.opening--seal .op-door--r { background: radial-gradient(ellipse at 0% 50%, color-mix(in srgb, var(--o-bg) 80%, var(--o-accent) 20%), var(--o-bg) 75%); }
.opening--seal .op-door--l { box-shadow: inset -1px 0 0 color-mix(in srgb, var(--o-accent) 50%, transparent); }
.opening--curtain .op-door {
  background:
    repeating-linear-gradient(90deg, rgb(0 0 0 / .22) 0 2px, transparent 2px 26px, rgb(255 255 255 / .05) 26px 30px, transparent 30px 44px),
    linear-gradient(180deg, color-mix(in srgb, var(--o-accent) 22%, var(--o-bg)), var(--o-bg));
  transform-origin: left center;
}
.opening--curtain .op-door--r { transform-origin: right center; }
.op-mono { font-family: var(--o-script); font-size: 3rem; line-height: 1; color: var(--o-accent); border: 1px solid color-mix(in srgb, var(--o-accent) 50%, transparent); border-radius: 50%; width: 7.5rem; height: 7.5rem; display: grid; place-items: center; }

/* ── Ouverture ─────────────────────────────── */
.opening.is-open { pointer-events: none; }
.opening--envelope.is-open { opacity: 0; transition: opacity .9s ease 1.25s; }
.is-open .op-envelope { animation: none; opacity: 1; }
.is-open .op-envelope .op-seal { transform: translate(-50%, -50%) scale(1.35); opacity: 0; }
.is-open .env-flap { transform: rotateX(180deg); z-index: 0; }
.is-open .env-letter { transform: translateY(-58%); }
.opening--envelope.is-open .op-inner { transform: scale(1.08); transition: transform 1.2s ease 1s; }
.is-open .op-eyebrow, .is-open .op-title, .is-open .op-hint { animation: none; opacity: 0; transition: opacity .4s ease; }
.opening--envelope.is-open .op-eyebrow, .opening--envelope.is-open .op-title { opacity: 1; }
.opening--seal.is-open .op-seal { transform: scale(1.25); opacity: 0; animation: none; }
.opening--seal.is-open .op-stage, .opening--curtain.is-open .op-stage { animation: none; opacity: 0; transition: opacity .4s ease; }
.opening--seal.is-open .op-glow, .opening--curtain.is-open .op-glow { opacity: 0; transition: opacity .5s ease; }
.opening--seal.is-open .op-door--l { transform: translateX(-102%); }
.opening--seal.is-open .op-door--r { transform: translateX(102%); }
.opening--curtain.is-open .op-door--l { transform: translateX(-100%) scaleX(.6); }
.opening--curtain.is-open .op-door--r { transform: translateX(100%) scaleX(.6); }

@keyframes op-pulse { 0%, 100% { opacity: .75; } 50% { opacity: .35; } }
@keyframes op-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes op-breathe { 0%, 100% { opacity: .7; } 50% { opacity: 1; } }

@media (prefers-reduced-motion: reduce) {
  .opening, .opening * { animation: none !important; transition: none !important; }
  .op-eyebrow, .op-title, .op-hint, .op-stage { opacity: 1; }
  .opening.is-open { opacity: 0; transition: opacity .3s ease !important; }
}
`;
