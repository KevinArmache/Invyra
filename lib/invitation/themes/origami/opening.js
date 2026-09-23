import { escapeHtml } from "@/lib/invitation/shared";
import { FIGURES } from "@/lib/invitation/themes/origami/figures";
import { stamp } from "@/lib/invitation/themes/origami/markup";

/**
 * Écran d'ouverture du thème Origami : une feuille pliée en quatre que
 * l'invité déplie du bout du doigt.
 *
 * 1. Couverture : le tampon au monogramme et le nom de l'invité.
 * 2. Premier geste (glisser vers la droite) : le volet droit s'ouvre et
 *    montre la bande du haut.
 * 3. Second geste (glisser vers le bas) : les volets du bas se déplient sur
 *    l'intérieur imprimé. Au relâcher, la feuille prend exactement la place
 *    de la feuille du héro, puis l'écran s'efface : le papier déplié devient
 *    la page.
 *
 * Un toucher, ou Entrée sur le bouton, avance d'un pli. L'écran porte
 * `data-opening-manual` : c'est lui qui appelle `window.openInvitation()`
 * (voir lib/invitation/opening.js), pendant le dernier geste, pour que la
 * musique ait le droit de démarrer.
 *
 * Structure 3D (charnières imbriquées, `preserve-3d`) :
 * - haut gauche : fixe ;
 * - bas gauche : charnière horizontale (--a2) ;
 * - moitié droite : charnière verticale (--a1) qui porte le haut droit et une
 *   seconde charnière horizontale (--a2), synchronisée avec la première.
 * Pliée, la feuille montre le dos du quart haut droit : la couverture.
 */

/** Durées (ms), alignées sur les transitions du CSS ci-dessous. */
const REVEAL_DELAY = 1700;
const REMOVE_DELAY = 2500;

function craneOutline() {
  return FIGURES.crane
    .map(
      (f) =>
        `<polygon points="${f[0]},${f[1]} ${f[2]},${f[3]} ${f[4]},${f[5]}"/>`,
    )
    .join("");
}

export function renderOrigamiOpening({ content, details }) {
  const { opening, hero } = content;
  const date = details.find((item) => item.key === "date");

  const print = `<div class="ori-op-print">
  <span class="ori-op-crease ori-op-crease--v"></span><span class="ori-op-crease ori-op-crease--h"></span>
  <div class="ori-op-print-body">
    ${stamp("ori-op-print-stamp")}
    ${hero.eyebrow ? `<p class="ori-op-print-eyebrow">${escapeHtml(hero.eyebrow)}</p>` : ""}
    <p class="ori-op-print-title">${hero.title ? escapeHtml(hero.title) : "{{EVENT_TITLE}}"}</p>
    ${date ? `<p class="ori-op-print-date">${escapeHtml(date.value)}</p>` : ""}
  </div>
</div>`;

  const band = `<div class="ori-op-band">
  ${opening.eyebrow ? `<p class="ori-op-band-eyebrow">${escapeHtml(opening.eyebrow)}</p>` : ""}
  <svg class="ori-op-crane" viewBox="0 0 200 200">${craneOutline()}</svg>
</div>`;

  const cover = `<div class="ori-op-cover">
  ${stamp("ori-op-cover-stamp")}
  ${opening.title ? `<span class="ori-op-cover-for">Pour</span><span class="ori-op-cover-name">${escapeHtml(opening.title)}</span>` : ""}
</div>`;

  const html = `<div class="ori-op" data-opening data-opening-manual data-reveal-delay="${REVEAL_DELAY}" data-remove-delay="${REMOVE_DELAY}" data-stage="1" role="dialog" aria-modal="true" aria-label="Invitation pliée : dépliez-la pour l'ouvrir">
<span class="ori-op-light" aria-hidden="true"></span>
<div class="ori-op-zoom" aria-hidden="true">
  <div class="ori-op-float">
    <div class="ori-op-scene">
      <div class="ori-op-tilt">
        <span class="ori-op-shadow"></span>
        <div class="ori-op-sheet">
          <div class="ori-op-q ori-op-q--tl"><div class="ori-op-face">${print}</div></div>
          <div class="ori-op-hx ori-op-hx--l"><div class="ori-op-q ori-op-q--b">
            <div class="ori-op-face ori-op-face--b">${print}</div>
            <div class="ori-op-face ori-op-face--back-x">${band}</div>
          </div></div>
          <div class="ori-op-hy">
            <div class="ori-op-q ori-op-q--tr">
              <div class="ori-op-face ori-op-face--r">${print}</div>
              <div class="ori-op-face ori-op-face--back-y">${cover}</div>
            </div>
            <div class="ori-op-hx ori-op-hx--r"><div class="ori-op-q ori-op-q--b">
              <div class="ori-op-face ori-op-face--r ori-op-face--b">${print}</div>
              <div class="ori-op-face ori-op-face--back-x ori-op-face--r">${band}</div>
            </div></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<div class="ori-op-ui">
  <button type="button" class="ori-op-cta" data-unfold-next>
    <span class="ori-op-gesture" aria-hidden="true"><span></span></span>
    <span class="ori-op-hint" data-hint>${escapeHtml(opening.hint || "Dépliez l'invitation")}</span>
  </button>
</div>
</div>`;

  return { html, css: OPENING_CSS, js: OPENING_JS };
}

const OPENING_CSS = `
.ori-op {
  --w: min(76vw, 50vh, 400px);
  --w: min(76vw, 50svh, 400px);
  --p1: 0; --p2: 0; --k: 1.45; --sx: 1; --sy: 1; --s1: 0; --s2: 0;
  --a1: -180deg; --a2: 180deg; --tx: 0deg; --ty: 0deg;
  position: fixed; inset: 0; z-index: 2147483000; overflow: hidden;
  display: grid; place-items: center;
  background: radial-gradient(ellipse at 50% 40%, color-mix(in srgb, var(--c-background) 88%, #fff), var(--c-background) 70%);
  color: var(--c-text); font-family: var(--f-body);
  touch-action: none; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent;
  cursor: grab;
}
.ori-op.is-dragging { cursor: grabbing; }
.ori-op::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background-image: var(--noise); opacity: calc(var(--texture) * .5);
}
.ori-op-light {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(120% 90% at 50% 45%, transparent 50%, rgb(0 0 0 / .16));
  transition: opacity .8s ease .6s;
}
.ori-op-zoom {
  position: relative; width: var(--w); height: calc(var(--w) * 1.3);
  margin-top: -6vh;
  transition: transform .95s cubic-bezier(.65, 0, .25, 1) .8s;
}
.ori-op-float { position: absolute; inset: 0; animation: ori-op-float 5.5s ease-in-out infinite; }
.ori-op.is-dragging .ori-op-float { animation-play-state: paused; }
.ori-op[data-stage="3"] .ori-op-float { animation: none; }
.ori-op-scene { position: absolute; inset: 0; perspective: 1400px; }
.ori-op-tilt {
  position: absolute; inset: 0; transform-style: preserve-3d;
  transform: rotateX(calc(var(--tx) + 16deg * (1 - var(--p1) * .4 - var(--p2) * .6))) rotateY(var(--ty)) rotateZ(calc(-4deg * (1 - var(--p1))));
  transition: transform .5s cubic-bezier(.3, .7, .2, 1);
}
.ori-op.is-dragging .ori-op-tilt { transition: none; }
.ori-op-shadow {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(closest-side, rgb(0 0 0 / .34), rgb(0 0 0 / .14) 65%, transparent);
  transform: translate3d(12px, 26px, -2px) scale(calc(var(--k) * (.56 + .5 * var(--p1))), calc(var(--k) * (.58 + .5 * var(--p2))));
}
.ori-op-sheet {
  position: absolute; inset: 0; transform-style: preserve-3d;
  transform: scale(var(--k)) translate3d(calc(var(--sx) * 25%), calc(var(--sy) * 25%), 0);
}
.ori-op-q, .ori-op-hx, .ori-op-hy { position: absolute; transform-style: preserve-3d; }
.ori-op-q--tl { left: 0; top: 0; width: 50%; height: 50%; }
.ori-op-hx { top: 50%; height: 50%; transform-origin: 50% 0; transform: rotateX(var(--a2)); }
.ori-op-hx--l { left: 0; width: 50%; }
.ori-op-hx--r { left: 0; width: 100%; }
.ori-op-hy { left: 50%; top: 0; width: 50%; height: 100%; transform-origin: 0 50%; transform: translateZ(3px) rotateY(var(--a1)); }
.ori-op-q--tr { left: 0; top: 0; width: 100%; height: 50%; }
.ori-op-q--b { inset: 0; transform: translateZ(-1px); }
.ori-op-face {
  position: absolute; inset: 0; overflow: hidden;
  backface-visibility: hidden; -webkit-backface-visibility: hidden;
  background: var(--c-card);
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / .05);
}
.ori-op-face::before { content: ""; position: absolute; inset: 0; z-index: 3; pointer-events: none; background-image: var(--noise); opacity: calc(var(--texture) * .3); }
.ori-op-face::after { content: ""; position: absolute; inset: 0; z-index: 4; pointer-events: none; opacity: 0; }
.ori-op-hy .ori-op-face::after { background: linear-gradient(90deg, rgb(0 0 0 / .42), rgb(0 0 0 / .08)); opacity: var(--s1); }
.ori-op-hx .ori-op-face::after { background: linear-gradient(180deg, rgb(0 0 0 / .08), rgb(0 0 0 / .4)); opacity: var(--s2); }
.ori-op-face--back-y { transform: rotateY(180deg); }
.ori-op-face--back-x { transform: rotateX(180deg); background: color-mix(in srgb, var(--c-card) 96%, var(--c-text)); }
/* Les deux moitiés de la bande se chevauchent d'un pixel : pas de jour à la
   jointure, par où l'intérieur transparaîtrait. */
.ori-op-hx--l .ori-op-face--back-x { right: -1px; }
.ori-op-hx--r .ori-op-face--back-x { left: -1px; }

/* Intérieur imprimé, réparti sur les quatre quarts. */
.ori-op-print { position: absolute; left: 0; top: 0; width: 200%; height: 200%; }
/* Replié, l'intérieur est entièrement couvert : on le masque pour que le
   tampon, posé sur la ligne de pli, ne dépasse pas au bord. */
.ori-op[data-stage="1"] .ori-op-print { visibility: hidden; }
.ori-op-face--r .ori-op-print, .ori-op-face--r .ori-op-band { left: -100%; }
.ori-op-face--b .ori-op-print { top: -100%; }
.ori-op-crease { position: absolute; opacity: .5; }
.ori-op-crease--v { left: 50%; top: 0; bottom: 0; width: 2px; margin-left: -1px; background: linear-gradient(90deg, color-mix(in srgb, var(--c-text) 20%, transparent), color-mix(in srgb, var(--c-card) 40%, #fff)); }
.ori-op-crease--h { top: 50%; left: 0; right: 0; height: 2px; margin-top: -1px; background: linear-gradient(180deg, color-mix(in srgb, var(--c-text) 20%, transparent), color-mix(in srgb, var(--c-card) 40%, #fff)); }
.ori-op-print-body {
  position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: calc(var(--w) * .028); padding: 0 calc(var(--w) * .08); text-align: center;
}
.ori-op-print-stamp { --size: calc(var(--w) * .15); margin-bottom: calc(var(--w) * .03); }
.ori-op-print-eyebrow { font-family: var(--f-heading); font-size: calc(var(--w) * .03); letter-spacing: .4em; text-transform: uppercase; color: var(--c-accent); }
.ori-op-print-title {
  font-family: var(--f-script); font-size: calc(var(--w) * .13); line-height: 1.12; overflow-wrap: anywhere;
  color: color-mix(in srgb, var(--c-text) 90%, var(--c-accent));
  text-shadow: 0 1px 0 color-mix(in srgb, var(--c-card) 45%, #fff), 0 -1px 0 color-mix(in srgb, var(--c-text) 22%, transparent);
}
.ori-op-print-date { font-family: var(--f-heading); font-size: calc(var(--w) * .032); letter-spacing: .28em; text-transform: uppercase; color: color-mix(in srgb, var(--c-text) 62%, var(--c-card)); }

/* Couverture. */
.ori-op-cover {
  position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: calc(var(--w) * .02); padding: calc(var(--w) * .06); text-align: center;
  outline: 1px solid color-mix(in srgb, var(--c-accent2) 70%, transparent); outline-offset: calc(var(--w) * -.03);
}
.ori-op-cover-stamp { --size: calc(var(--w) * .15); margin-bottom: calc(var(--w) * .02); }
.ori-op-cover-for { font-family: var(--f-script); font-size: calc(var(--w) * .07); line-height: 1; color: color-mix(in srgb, var(--c-text) 62%, var(--c-card)); }
.ori-op-cover-name {
  max-width: 100%; font-family: var(--f-heading); font-size: calc(var(--w) * .042); line-height: 1.35;
  letter-spacing: .12em; text-transform: uppercase; overflow-wrap: anywhere;
}

/* Bande du haut (dos des volets du bas). */
.ori-op-band {
  position: absolute; left: 0; top: 0; width: 200%; height: 100%;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: calc(var(--w) * .035);
  padding: 0 calc(var(--w) * .1); text-align: center;
}
.ori-op-band-eyebrow { font-family: var(--f-heading); font-size: calc(var(--w) * .034); letter-spacing: .32em; text-transform: uppercase; color: var(--c-accent); }
.ori-op-crane { width: calc(var(--w) * .32); height: calc(var(--w) * .32); overflow: visible; }
.ori-op-crane polygon { fill: none; stroke: var(--c-accent2); stroke-width: 1.6; stroke-linejoin: round; }

/* Bouton et indication du geste. */
.ori-op-ui {
  position: absolute; left: 0; right: 0; bottom: calc(env(safe-area-inset-bottom, 0px) + clamp(1.25rem, 6vh, 3rem));
  display: flex; justify-content: center; padding: 0 16px; pointer-events: none;
  transition: opacity .3s ease;
}
.ori-op-cta {
  pointer-events: auto; display: inline-flex; align-items: center; gap: .9rem;
  padding: .8rem 1.35rem; border-radius: 999px; cursor: pointer;
  border: 1px solid color-mix(in srgb, var(--c-text) 18%, transparent);
  background: color-mix(in srgb, var(--c-card) 75%, transparent); color: var(--c-text);
  font-family: var(--f-heading); font-size: .72rem; letter-spacing: .24em; text-transform: uppercase;
  box-shadow: 0 10px 24px -16px rgb(0 0 0 / .5);
  animation: ori-op-in 1s ease .9s both;
}
.ori-op-cta:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 3px; }
.ori-op-hint { transition: opacity .3s ease; }
.ori-op-hint.is-swapping { opacity: 0; }
.ori-op-gesture { position: relative; flex: none; width: 34px; height: 2px; border-radius: 2px; background: color-mix(in srgb, var(--c-text) 22%, transparent); transition: transform .5s ease; }
.ori-op-gesture span { position: absolute; left: 0; top: 50%; width: 8px; height: 8px; margin-top: -4px; border-radius: 50%; background: var(--c-accent); animation: ori-op-swipe 1.9s ease-in-out infinite; }
.ori-op[data-stage="2"] .ori-op-gesture { transform: rotate(90deg); }

/* Ouverture : la feuille rejoint la place de la page, puis l'écran s'efface. */
.ori-op.is-open { pointer-events: none; opacity: 0; transition: opacity .6s ease 1.8s; }
.ori-op.is-open .ori-op-ui { opacity: 0; }
.ori-op.is-open .ori-op-tilt { transform: none; transition: transform .9s cubic-bezier(.65, 0, .25, 1) .55s; }
.ori-op.is-open .ori-op-shadow { opacity: 0; transition: opacity .6s ease .8s; }
.ori-op.is-open .ori-op-print-body, .ori-op.is-open .ori-op-crease { opacity: 0; transition: opacity .4s ease .8s; }
.ori-op.is-open .ori-op-face { box-shadow: none; }
.ori-op.is-open .ori-op-light { opacity: 0; }

@keyframes ori-op-float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-7px) rotate(.5deg); } }
@keyframes ori-op-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes ori-op-swipe {
  0% { transform: translateX(0); opacity: 0; } 15% { opacity: 1; }
  70% { transform: translateX(26px); opacity: 1; } 100% { transform: translateX(26px); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .ori-op *, .ori-op::before { animation: none !important; transition: none !important; }
}
`;

const OPENING_JS = `
(function () {
  var op = document.querySelector('.ori-op[data-opening]');
  if (!op) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var zoom = op.querySelector('.ori-op-zoom');
  var cta = op.querySelector('[data-unfold-next]');
  var hint = op.querySelector('[data-hint]');
  var p1 = 0, p2 = 0, stage = 1, finished = false, frameId = 0, drag = null;

  function apply() {
    var s = op.style;
    var e1 = Math.min(p1, 1.06), e2 = Math.min(p2, 1.06);
    var c1 = Math.min(e1, 1), c2 = Math.min(e2, 1);
    s.setProperty('--p1', c1.toFixed(4));
    s.setProperty('--p2', c2.toFixed(4));
    s.setProperty('--a1', (-180 * (1 - e1)).toFixed(2) + 'deg');
    s.setProperty('--a2', (180 * (1 - e2)).toFixed(2) + 'deg');
    // Pliée, la feuille est agrandie pour rester lisible ; elle revient à
    // sa taille à mesure qu'elle se déplie.
    s.setProperty('--k', (1 + 0.33 * (1 - c1) + 0.12 * (1 - c2)).toFixed(4));
    s.setProperty('--sx', (1 - c1).toFixed(4));
    s.setProperty('--sy', (1 - c2).toFixed(4));
    s.setProperty('--s1', (Math.sin(Math.PI * c1) * 0.9).toFixed(3));
    s.setProperty('--s2', (Math.sin(Math.PI * c2) * 0.9).toFixed(3));
  }

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeBack(t) { var c = 1.3; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }

  function tween(which, to, duration, ease, done) {
    cancelAnimationFrame(frameId);
    var from = which === 1 ? p1 : p2, start = null;
    function step(now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / duration);
      var value = from + (to - from) * ease(t);
      if (which === 1) p1 = value; else p2 = value;
      apply();
      if (t < 1) frameId = requestAnimationFrame(step);
      else if (done) done();
    }
    frameId = requestAnimationFrame(step);
  }

  function setHint(text) {
    if (!hint) return;
    hint.classList.add('is-swapping');
    setTimeout(function () { hint.textContent = text; hint.classList.remove('is-swapping'); }, 220);
  }

  function music() { if (window.startInvitationMusic) window.startInvitationMusic(); }

  /** La feuille dépliée prend la place exacte de la feuille du héro. */
  function aimZoom() {
    var target = document.querySelector('.ori-hero [data-tilt]');
    var box = zoom.getBoundingClientRect();
    var bx = box.left + box.width / 2, by = box.top + box.height / 2;
    if (target) {
      var r = target.getBoundingClientRect();
      zoom.style.transform = 'translate(' + (r.left + r.width / 2 - bx).toFixed(1) + 'px,' + (r.top + r.height / 2 - by).toFixed(1) + 'px) scale(' +
        (r.width / box.width).toFixed(4) + ',' + (r.height / box.height).toFixed(4) + ')';
    } else {
      var z = Math.max(innerWidth / box.width, innerHeight / box.height) * 1.04;
      zoom.style.transform = 'scale(' + z.toFixed(4) + ')';
    }
  }

  function stageTwo() {
    stage = 2;
    op.setAttribute('data-stage', '2');
    setHint('Encore un pli');
  }

  // Appelé pendant le geste de l'invité : la musique peut démarrer.
  function finish() {
    if (finished) return;
    finished = true;
    stage = 3;
    op.setAttribute('data-stage', '3');
    music();
    aimZoom();
    if (window.openInvitation) window.openInvitation();
  }

  function advance() {
    if (finished) return;
    music();
    if (reduce) { p1 = 1; p2 = 1; apply(); finish(); return; }
    if (stage === 1) tween(1, 1, 760, easeBack, stageTwo);
    else { finish(); tween(2, 1, 760, easeBack); }
  }

  cta.addEventListener('click', advance);

  op.addEventListener('pointerdown', function (e) {
    if (finished || drag || (e.button !== undefined && e.button > 0)) return;
    if (e.target.closest('[data-unfold-next]')) return;
    cancelAnimationFrame(frameId);
    var box = zoom.getBoundingClientRect();
    drag = {
      id: e.pointerId, x: e.clientX, y: e.clientY, moved: false,
      from: stage === 1 ? p1 : p2,
      range: stage === 1 ? box.width * 0.62 : box.height * 0.5,
      last: stage === 1 ? p1 : p2, lastTime: e.timeStamp, speed: 0
    };
    if (op.setPointerCapture) { try { op.setPointerCapture(e.pointerId); } catch (err) {} }
    op.classList.add('is-dragging');
  });

  op.addEventListener('pointermove', function (e) {
    if (!drag) {
      if (e.pointerType === 'mouse' && !finished) {
        op.style.setProperty('--ty', ((e.clientX / innerWidth - .5) * 10).toFixed(2) + 'deg');
        op.style.setProperty('--tx', ((.5 - e.clientY / innerHeight) * 6).toFixed(2) + 'deg');
      }
      return;
    }
    if (e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
    if (!drag.moved) return;
    var delta = stage === 1 ? dx : dy;
    var value = drag.from + delta / drag.range;
    value = value < 0 ? 0 : value > 1 ? 1 + (value - 1) * 0.15 : value;
    var dt = Math.max(1, e.timeStamp - drag.lastTime);
    drag.speed = (value - drag.last) / dt;
    drag.last = value;
    drag.lastTime = e.timeStamp;
    if (stage === 1) p1 = value; else p2 = value;
    apply();
  });

  function release(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    var current = drag;
    drag = null;
    op.classList.remove('is-dragging');
    music();
    if (!current.moved) { advance(); return; }
    var value = stage === 1 ? p1 : p2;
    var fling = current.speed > 0.0012;
    if (value > 0.38 || fling) {
      if (stage === 1) tween(1, 1, 520, easeBack, stageTwo);
      else { finish(); tween(2, 1, 560, easeBack); }
    } else {
      tween(stage, 0, 420, easeOut);
    }
  }
  op.addEventListener('pointerup', release);
  op.addEventListener('pointercancel', release);

  op.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.target === cta) return;
      e.preventDefault();
      advance();
    }
  });

  apply();
})();
`;
